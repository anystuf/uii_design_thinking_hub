import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CourseStatus,
  ProjectStatus,
  ProjectMemberRole,
  SubmissionStatus,
  SprintStageType,
  UserRole,
  type Evidence,
  type Project,
} from '@prisma/client';

import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../database/prisma/prisma.service';
import { SharePointService } from '../upload/sharepoint.service';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateSprintStageDto } from './dto/update-sprint-stage.dto';

const DEFAULT_STAGES: SprintStageType[] = [
  SprintStageType.EMPATHIZE,
  SprintStageType.DEFINE,
  SprintStageType.IDEATE,
  SprintStageType.PROTOTYPE,
  SprintStageType.TEST,
];

const LECTURER_MANAGED_STATUSES = new Set<ProjectStatus>([
  ProjectStatus.UNDER_REVIEW,
  ProjectStatus.REVISION_REQUESTED,
  ProjectStatus.APPROVED,
]);

const STATUS_TRANSITIONS: Partial<Record<ProjectStatus, ProjectStatus[]>> = {
  [ProjectStatus.DRAFT]: [ProjectStatus.SUBMITTED],
  [ProjectStatus.SUBMITTED]: [ProjectStatus.UNDER_REVIEW],
  [ProjectStatus.UNDER_REVIEW]: [ProjectStatus.REVISION_REQUESTED, ProjectStatus.APPROVED],
  [ProjectStatus.REVISION_REQUESTED]: [ProjectStatus.SUBMITTED],
};

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sharePointService: SharePointService,
  ) {}

  async findAll(user: AuthenticatedUser) {
    const where =
      user.role === UserRole.ADMIN
        ? {}
        : user.role === UserRole.LECTURER
          ? { course: { createdById: user.id } }
          : { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] };

    return this.prisma.project.findMany({
      where,
      include: {
        course: {
          select: { id: true, title: true, slug: true, createdById: true },
        },
        owner: {
          select: { id: true, email: true, fullName: true, role: true },
        },
        _count: {
          select: { evidence: true, feedback: true, stages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        course: {
          select: { id: true, title: true, slug: true, createdById: true },
        },
        owner: {
          select: { id: true, email: true, fullName: true, role: true },
        },
        stages: { orderBy: { stage: 'asc' } },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    await this.assertCanAccessProject(project, user);
    return project;
  }

  async create(dto: CreateProjectDto, user: AuthenticatedUser) {
    if (user.role !== UserRole.STUDENT && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Insufficient role for this action.');
    }

    const course = await this.findAccessibleCourse(dto.courseId, user);

    if (user.role === UserRole.STUDENT && course.status !== CourseStatus.PUBLISHED) {
      throw new ForbiddenException('Students can only create projects in published courses.');
    }

    if (user.role === UserRole.STUDENT) {
      await this.ensureEnrollment(course.id, user);
    }

    await this.ensureDevUser(user);

    return this.prisma.project.create({
      data: {
        title: dto.title,
        description: dto.description,
        courseId: dto.courseId,
        ownerId: user.id,
        status: ProjectStatus.DRAFT,
        currentStage: SprintStageType.EMPATHIZE,
        stages: {
          create: DEFAULT_STAGES.map((stage) => ({
            stage,
          })),
        },
      },
      include: {
        stages: { orderBy: { stage: 'asc' } },
      },
    });
  }

  async update(id: string, dto: UpdateProjectDto, user: AuthenticatedUser) {
    const project = await this.findProjectEntity(id);

    if (user.role === UserRole.STUDENT) {
      this.assertOwnProject(project, user);

      if (dto.status && dto.status !== ProjectStatus.DRAFT) {
        throw new ForbiddenException('Students cannot change project review status.');
      }
    } else if (user.role === UserRole.LECTURER) {
      await this.assertLecturerCanAccessProject(project, user);

      if (dto.status && !LECTURER_MANAGED_STATUSES.has(dto.status)) {
        throw new ForbiddenException('Lecturers can only manage review and approval statuses.');
      }

      if (dto.title !== undefined || dto.description !== undefined) {
        throw new ForbiddenException('Lecturers cannot edit student project content.');
      }
    }

    if (dto.status) {
      this.assertValidStatusTransition(project.status, dto.status);
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        currentStage: dto.currentStage,
      },
    });
  }

  async delete(id: string, user: AuthenticatedUser) {
    const project = await this.findProjectEntity(id);

    if (user.role === UserRole.ADMIN) {
      await this.prisma.project.delete({ where: { id } });
      return { success: true };
    }

    this.assertOwnProject(project, user);

    if (project.status !== ProjectStatus.DRAFT && project.status !== ProjectStatus.REVISION_REQUESTED) {
      throw new ForbiddenException('Only draft or revision-requested projects can be deleted.');
    }

    await this.prisma.project.delete({ where: { id } });
    return { success: true };
  }

  async submit(id: string, user: AuthenticatedUser) {
    const project = await this.findProjectEntity(id);
    if (user.role !== UserRole.ADMIN) {
      this.assertOwnProject(project, user);
    }

    if (project.status !== ProjectStatus.DRAFT && project.status !== ProjectStatus.REVISION_REQUESTED) {
      throw new ConflictException('Only draft or revision-requested projects can be submitted.');
    }

    const sprintStage = await this.findSprintStage(id, project.currentStage);
    const version = (await this.prisma.submission.count({
      where: { projectId: id, sprintStageId: sprintStage.id },
    })) + 1;

    return this.prisma.$transaction(async (tx) => {
      const submission = await tx.submission.create({
        data: {
          projectId: id,
          sprintStageId: sprintStage.id,
          authorId: user.id,
          version,
          status: SubmissionStatus.SUBMITTED,
        },
      });
      const updatedProject = await tx.project.update({
        where: { id },
        data: { status: ProjectStatus.SUBMITTED },
      });
      return { project: updatedProject, submission };
    });
  }

  async findSubmissions(id: string, user: AuthenticatedUser) {
    const project = await this.findProjectEntity(id);
    await this.assertCanAccessProject(project, user);
    return this.prisma.submission.findMany({
      where: { projectId: id },
      include: {
        sprintStage: true,
        author: { select: { id: true, fullName: true, role: true } },
        evidence: { include: { files: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async findStages(id: string, user: AuthenticatedUser) {
    const project = await this.findProjectEntity(id);
    await this.assertCanAccessProject(project, user);

    return this.prisma.sprintStage.findMany({
      where: { projectId: id },
      orderBy: { stage: 'asc' },
    });
  }

  async updateStage(
    id: string,
    stageValue: string,
    dto: UpdateSprintStageDto,
    user: AuthenticatedUser,
  ) {
    const project = await this.findProjectEntity(id);

    if (user.role !== UserRole.ADMIN) {
      this.assertOwnProject(project, user);
    }

    const stage = parseStage(stageValue);
    const sprintStage = await this.findSprintStage(id, stage);

    return this.prisma.sprintStage.update({
      where: { id: sprintStage.id },
      data: {
        completed: dto.completed,
        completedAt:
          dto.completed === undefined
            ? undefined
            : dto.completed
              ? new Date()
              : null,
      },
    });
  }

  async findEvidence(id: string, user: AuthenticatedUser) {
    const project = await this.findProjectEntity(id);
    await this.assertCanAccessProject(project, user);

    return this.prisma.evidence.findMany({
      where: { projectId: id },
      include: {
        sprintStage: true,
        createdBy: {
          select: { id: true, email: true, fullName: true, role: true },
        },
        files: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createEvidence(id: string, dto: CreateEvidenceDto, user: AuthenticatedUser) {
    const project = await this.findProjectEntity(id);

    if (user.role !== UserRole.ADMIN) {
      await this.assertTeamMember(project, user);
    }

    const sprintStage = await this.findSprintStageForProject(id, dto.sprintStageId);
    await this.ensureDevUser(user);

    const uploadedFiles = dto.files?.length
      ? await Promise.all(
          dto.files.map((file) => this.sharePointService.uploadFile(file)),
        )
      : [];

    return this.prisma.evidence.create({
      data: {
        projectId: id,
        sprintStageId: sprintStage.id,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        reflection: dto.reflection,
        createdById: user.id,
        files: {
          create: uploadedFiles,
        },
      },
      include: {
        sprintStage: true,
        files: true,
      },
    });
  }

  async updateEvidence(id: string, dto: UpdateEvidenceDto, user: AuthenticatedUser) {
    const evidence = await this.findEvidenceEntity(id);
    const project = await this.findProjectEntity(evidence.projectId);

    if (user.role === UserRole.ADMIN) {
      return this.persistEvidenceUpdate(id, dto);
    }

    await this.assertTeamMember(project, user);

    if (evidence.createdById !== user.id) {
      throw new ForbiddenException('Students can only edit their own evidence.');
    }

    return this.persistEvidenceUpdate(id, dto);
  }

  async deleteEvidence(id: string, user: AuthenticatedUser) {
    const evidence = await this.findEvidenceEntity(id);
    const project = await this.findProjectEntity(evidence.projectId);

    if (user.role === UserRole.ADMIN) {
      await this.deleteEvidenceFiles(evidence);
      await this.prisma.evidence.delete({ where: { id } });
      return { success: true };
    }

    await this.assertTeamMember(project, user);

    if (evidence.createdById !== user.id) {
      throw new ForbiddenException('Students can only delete their own evidence.');
    }

    await this.deleteEvidenceFiles(evidence);
    await this.prisma.evidence.delete({ where: { id } });
    return { success: true };
  }

  async findFeedback(id: string, user: AuthenticatedUser) {
    const project = await this.findProjectEntity(id);
    await this.assertCanAccessProject(project, user);

    return this.prisma.feedback.findMany({
      where: { projectId: id },
      include: {
        author: {
          select: { id: true, email: true, fullName: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createFeedback(id: string, dto: CreateFeedbackDto, user: AuthenticatedUser) {
    const project = await this.findProjectEntity(id);

    if (user.role === UserRole.LECTURER) {
      await this.assertLecturerCanAccessProject(project, user);
    }

    await this.ensureDevUser(user);

    return this.prisma.feedback.create({
      data: {
        projectId: id,
        authorId: user.id,
        comment: dto.comment,
      },
      include: {
        author: {
          select: { id: true, email: true, fullName: true, role: true },
        },
      },
    });
  }

  private async persistEvidenceUpdate(id: string, dto: UpdateEvidenceDto) {
    return this.prisma.evidence.update({
      where: { id },
      data: {
        type: dto.type,
        title: dto.title,
        description: dto.description,
        reflection: dto.reflection,
      },
      include: {
        sprintStage: true,
        files: true,
      },
    });
  }

  private async findAccessibleCourse(courseId: string, user: AuthenticatedUser) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found.');
    }

    if (
      user.role === UserRole.ADMIN ||
      (user.role === UserRole.LECTURER && course.createdById === user.id) ||
      user.role === UserRole.STUDENT
    ) {
      return course;
    }

    throw new ForbiddenException('Insufficient role for this course.');
  }

  private async findProjectEntity(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    return project;
  }

  private async findSprintStage(projectId: string, stage: SprintStageType) {
    const sprintStage = await this.prisma.sprintStage.findUnique({
      where: {
        projectId_stage: {
          projectId,
          stage,
        },
      },
    });

    if (!sprintStage) {
      throw new NotFoundException('Sprint stage not found.');
    }

    return sprintStage;
  }

  private async findSprintStageForProject(projectId: string, sprintStageId: string) {
    const sprintStage = await this.prisma.sprintStage.findUnique({
      where: { id: sprintStageId },
    });

    if (!sprintStage || sprintStage.projectId !== projectId) {
      throw new NotFoundException('Sprint stage not found.');
    }

    return sprintStage;
  }

  private async findEvidenceEntity(id: string) {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!evidence) {
      throw new NotFoundException('Evidence not found.');
    }

    return evidence;
  }

  private async assertCanAccessProject(project: Project, user: AuthenticatedUser) {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (user.role === UserRole.LECTURER) {
      await this.assertLecturerCanAccessProject(project, user);
      return;
    }

    await this.assertTeamMember(project, user);
  }

  private async assertTeamMember(project: Project, user: AuthenticatedUser) {
    if (project.ownerId === user.id) return;
    if (user.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Project team access denied.');
    }
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: project.id, userId: user.id } },
    });
    if (!member) throw new ForbiddenException('Project team membership required.');
  }

  private assertOwnProject(project: Project, user: AuthenticatedUser) {
    if (project.ownerId !== user.id) {
      throw new ForbiddenException('You can only manage your own projects.');
    }
  }

  private async assertLecturerCanAccessProject(project: Project, user: AuthenticatedUser) {
    const course = await this.prisma.course.findUnique({
      where: { id: project.courseId },
      select: { createdById: true },
    });

    if (!course || course.createdById !== user.id) {
      throw new ForbiddenException('You can only manage projects in your own courses.');
    }
  }

  private async ensureEnrollment(courseId: string, user: AuthenticatedUser) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('You must be enrolled in this course first.');
    }
  }

  private async ensureDevUser(user: AuthenticatedUser) {
    await this.prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      update: {
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  }

  private async deleteEvidenceFiles(evidence: Evidence & { files: { sharepointItemId: string }[] }) {
    await Promise.all(
      evidence.files.map((file) =>
        this.sharePointService.deleteFile(file.sharepointItemId),
      ),
    );
  }

  private assertValidStatusTransition(from: ProjectStatus, to: ProjectStatus) {
    if (from === to) {
      return;
    }

    if (!STATUS_TRANSITIONS[from]?.includes(to)) {
      throw new ConflictException(`Cannot change project status from ${from} to ${to}.`);
    }
  }
}

function parseStage(value: string): SprintStageType {
  if (!Object.values(SprintStageType).includes(value as SprintStageType)) {
    throw new BadRequestException('Invalid sprint stage.');
  }

  return value as SprintStageType;
}

