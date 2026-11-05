import {
  ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import {
  ChallengeStatus, InvitationStatus, Prisma, ProjectMemberRole,
  ProjectStatus, ProjectTaskStatus, SprintStageType, UserRole,
} from '@prisma/client';

import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../database/prisma/prisma.service';
import { StudioAccessService } from '../studio-access/studio-access.service';
import {
  CreateProjectTaskDto, CreateTeamDto, InviteTeamMemberDto,
  RespondInvitationDto, UpdateProjectTaskDto,
} from './dto/team.dto';

const FIVE_MODES: SprintStageType[] = [
  SprintStageType.EMPATHIZE, SprintStageType.DEFINE, SprintStageType.IDEATE,
  SprintStageType.PROTOTYPE, SprintStageType.TEST,
];

const membersInclude = {
  user: { select: { id: true, fullName: true, email: true } },
};

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: StudioAccessService,
  ) {}

  async create(challengeId: string, dto: CreateTeamDto, user: AuthenticatedUser) {
    const challenge = await this.access.challenge(challengeId, user);
    if (challenge.status !== ChallengeStatus.PUBLISHED) {
      throw new ConflictException('Challenge is not accepting new teams.');
    }
    await this.access.enrolledStudent(challenge.courseId, user);

    const membership = await this.prisma.projectMember.findFirst({
      where: { challengeId, userId: user.id },
    });
    if (membership) throw new ConflictException('You already belong to a team for this challenge.');

    try {
      return await this.prisma.project.create({
        data: {
          challengeId, courseId: challenge.courseId, ownerId: user.id,
          title: dto.name, description: dto.description, status: ProjectStatus.DRAFT,
          currentStage: SprintStageType.EMPATHIZE,
          stages: { create: FIVE_MODES.map((stage) => ({ stage })) },
          members: { create: { userId: user.id, challengeId, role: ProjectMemberRole.OWNER } },
        },
        include: {
          challenge: { select: { id: true, title: true } },
          stages: true,
          members: { include: membersInclude },
        },
      });
    } catch (error) {
      if (isUniqueError(error)) throw new ConflictException('Team membership already exists.');
      throw error;
    }
  }

  async list(challengeId: string, user: AuthenticatedUser) {
    const challenge = await this.access.challenge(challengeId, user);
    const staff = user.role === UserRole.ADMIN ||
      (user.role === UserRole.LECTURER && challenge.course.createdById === user.id);
    return this.prisma.project.findMany({
      where: {
        challengeId,
        ...(staff ? {} : { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] }),
      },
      select: {
        id: true, title: true, description: true, challengeId: true, ownerId: true,
        currentStage: true, status: true, createdAt: true,
        members: { include: membersInclude },
        _count: { select: { tasks: true, activities: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async mine(user: AuthenticatedUser) {
    if (user.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only students join teams.');
    }
    return this.prisma.project.findMany({
      where: {
        challengeId: { not: null },
        OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
      },
      include: {
        challenge: { select: { id: true, title: true, courseId: true } },
        members: { include: membersInclude },
        _count: { select: { tasks: true, activities: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async get(projectId: string, user: AuthenticatedUser) {
    await this.access.project(projectId, user);
    return this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        challenge: { include: { milestones: { orderBy: { dueAt: 'asc' } } } },
        members: { include: membersInclude },
        tasks: { include: { assignee: { select: { id: true, fullName: true } } }, orderBy: { createdAt: 'desc' } },
        stages: true,
      },
    });
  }

  async invite(projectId: string, dto: InviteTeamMemberDto, user: AuthenticatedUser) {
    const project = await this.access.project(projectId, user, true, true);
    if (!project.challengeId) {
      throw new ConflictException('Legacy projects do not accept challenge team invitations.');
    }
    const invitee = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (!invitee || invitee.role !== UserRole.STUDENT) {
      throw new NotFoundException('Student not found. Ask them to sign in first.');
    }
    if (invitee.id === user.id) throw new ConflictException('You are already the owner.');
    if (await this.prisma.projectMember.findFirst({
      where: { challengeId: project.challengeId, userId: invitee.id },
    })) throw new ConflictException('Student already belongs to a team.');

    await this.access.enrolledStudent(project.courseId, {
      id: invitee.id, email: invitee.email, fullName: invitee.fullName, role: invitee.role,
    });

    return this.prisma.projectInvitation.upsert({
      where: { projectId_invitedUserId: { projectId, invitedUserId: invitee.id } },
      create: { projectId, invitedUserId: invitee.id, invitedById: user.id },
      update: { status: InvitationStatus.PENDING, invitedById: user.id, respondedAt: null },
      include: { invitedUser: { select: { id: true, fullName: true, email: true } } },
    });
  }

  async invitations(user: AuthenticatedUser) {
    if (user.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only students receive team invitations.');
    }
    return this.prisma.projectInvitation.findMany({
      where: { invitedUserId: user.id, status: InvitationStatus.PENDING },
      include: {
        project: { select: { id: true, title: true, challenge: { select: { title: true, courseId: true } } } },
        invitedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async respond(invitationId: string, dto: RespondInvitationDto, user: AuthenticatedUser) {
    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { id: invitationId },
      include: { project: true },
    });
    if (!invitation) throw new NotFoundException('Invitation not found.');
    if (invitation.invitedUserId !== user.id) {
      throw new ForbiddenException('Only the invited student can respond.');
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ConflictException('Invitation already resolved.');
    }
    const project = invitation.project;
    if (!project.challengeId) throw new ConflictException('Project is not attached to a challenge.');
    if (dto.accept) await this.access.enrolledStudent(project.courseId, user);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const changed = await tx.projectInvitation.updateMany({
          where: { id: invitationId, status: InvitationStatus.PENDING },
          data: {
            status: dto.accept ? InvitationStatus.ACCEPTED : InvitationStatus.DECLINED,
            respondedAt: new Date(),
          },
        });
        if (changed.count !== 1) throw new ConflictException('Invitation already resolved.');
        if (dto.accept) {
          await tx.projectMember.create({
            data: {
              projectId: project.id, userId: user.id,
              challengeId: project.challengeId!, role: ProjectMemberRole.MEMBER,
            },
          });
        }
        return { accepted: dto.accept, projectId: project.id };
      });
    } catch (error) {
      if (isUniqueError(error)) throw new ConflictException('You already belong to a team for this challenge.');
      throw error;
    }
  }

  async tasks(projectId: string, user: AuthenticatedUser) {
    await this.access.project(projectId, user);
    return this.prisma.projectTask.findMany({
      where: { projectId },
      include: { assignee: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTask(projectId: string, dto: CreateProjectTaskDto, user: AuthenticatedUser) {
    await this.access.project(projectId, user, true);
    if (dto.assigneeId) await this.assertAssignee(projectId, dto.assigneeId);
    return this.prisma.projectTask.create({
      data: {
        projectId, title: dto.title, description: dto.description,
        assigneeId: dto.assigneeId, createdById: user.id,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        status: ProjectTaskStatus.TODO,
      },
    });
  }

  async updateTask(
    projectId: string, taskId: string, dto: UpdateProjectTaskDto, user: AuthenticatedUser,
  ) {
    await this.access.project(projectId, user, true);
    const task = await this.prisma.projectTask.findUnique({ where: { id: taskId } });
    if (!task || task.projectId !== projectId) throw new NotFoundException('Task not found.');
    if (dto.assigneeId) await this.assertAssignee(projectId, dto.assigneeId);
    return this.prisma.projectTask.update({
      where: { id: taskId },
      data: {
        title: dto.title, description: dto.description, assigneeId: dto.assigneeId,
        status: dto.status, dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
      },
    });
  }

  private async assertAssignee(projectId: string, userId: string) {
    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!membership) throw new ForbiddenException('Assignee must be a team member.');
  }
}

function isUniqueError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
