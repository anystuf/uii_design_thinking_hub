import {
  BadRequestException, ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import {
  ActivityStatus, Prisma, SprintStageType, UserRole,
} from '@prisma/client';

import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../database/prisma/prisma.service';
import { StudioAccessService } from '../studio-access/studio-access.service';
import {
  AssignChallengeActivityDto, CreateProjectActivityDto, UpdateProjectActivityDto,
} from './dto/activity.dto';

type TemplateField = { key: string; label: string; type: 'text' | 'textarea' };

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: StudioAccessService,
  ) {}

  templates(mode?: string) {
    if (mode && !Object.values(SprintStageType).includes(mode as SprintStageType)) {
      throw new BadRequestException('Unknown Design Thinking mode.');
    }
    return this.prisma.activityTemplate.findMany({
      where: { isActive: true, ...(mode ? { mode: mode as SprintStageType } : {}) },
      orderBy: [{ mode: 'asc' }, { name: 'asc' }],
    });
  }

  async assigned(challengeId: string, user: AuthenticatedUser) {
    const challenge = await this.access.challenge(challengeId, user);
    const canManage = user.role === UserRole.ADMIN ||
      (user.role === UserRole.LECTURER && challenge.course.createdById === user.id);
    return this.prisma.challengeActivity.findMany({
      where: {
        challengeId,
        ...(canManage ? {} : { publishedAt: { not: null } }),
      },
      include: { template: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async assign(challengeId: string, dto: AssignChallengeActivityDto, user: AuthenticatedUser) {
    const challenge = await this.access.challenge(challengeId, user);
    await this.access.lecturerCourse(challenge.courseId, user);
    const template = await this.prisma.activityTemplate.findUnique({ where: { id: dto.templateId } });
    if (!template || !template.isActive) throw new NotFoundException('Activity template not found.');

    try {
      return await this.prisma.challengeActivity.create({
        data: {
          challengeId, templateId: template.id, instructions: dto.instructions,
          publishedAt: dto.isPublished === false ? null : new Date(),
        },
        include: { template: true },
      });
    } catch (error) {
      if (isUnique(error)) throw new ConflictException('Template already assigned to this challenge.');
      throw error;
    }
  }

  async projectActivities(projectId: string, user: AuthenticatedUser, mode?: string) {
    await this.access.project(projectId, user);
    if (mode && !Object.values(SprintStageType).includes(mode as SprintStageType)) {
      throw new BadRequestException('Unknown Design Thinking mode.');
    }
    return this.prisma.projectActivity.findMany({
      where: { projectId, ...(mode ? { mode: mode as SprintStageType } : {}) },
      include: {
        template: true,
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async start(projectId: string, dto: CreateProjectActivityDto, user: AuthenticatedUser) {
    const project = await this.access.project(projectId, user, true);
    const template = await this.prisma.activityTemplate.findUnique({ where: { id: dto.templateId } });
    if (!template || !template.isActive) throw new NotFoundException('Activity template not found.');

    if (dto.challengeActivityId) {
      const assigned = await this.prisma.challengeActivity.findUnique({
        where: { id: dto.challengeActivityId },
      });
      if (
        !assigned || assigned.challengeId !== project.challengeId ||
        assigned.templateId !== template.id || !assigned.publishedAt
      ) throw new BadRequestException('Activity is not assigned to this challenge.');
    }
    validateContent(template.fields, dto.content ?? {}, false);
    return this.prisma.projectActivity.create({
      data: {
        projectId, templateId: template.id, challengeActivityId: dto.challengeActivityId,
        mode: template.mode, content: dto.content ?? {}, createdById: user.id,
        status: ActivityStatus.DRAFT,
      },
      include: { template: true },
    });
  }

  async update(id: string, dto: UpdateProjectActivityDto, user: AuthenticatedUser) {
    const activity = await this.prisma.projectActivity.findUnique({
      where: { id }, include: { template: true },
    });
    if (!activity) throw new NotFoundException('Project activity not found.');
    await this.access.project(activity.projectId, user, true);

    const content = dto.content ?? (activity.content as Record<string, string>);
    const status = dto.status ?? activity.status;
    validateContent(activity.template.fields, content, status === ActivityStatus.COMPLETED);

    return this.prisma.projectActivity.update({
      where: { id },
      data: {
        content: dto.content === undefined ? undefined : dto.content,
        status: dto.status, updatedById: user.id,
      },
      include: { template: true },
    });
  }
}

function validateContent(fieldsValue: Prisma.JsonValue, content: Record<string, string>, complete: boolean) {
  if (
    !Array.isArray(fieldsValue) ||
    fieldsValue.some((item) => !item || typeof item !== 'object' ||
      !('key' in item) || typeof item.key !== 'string')
  ) throw new BadRequestException('Activity template field schema is invalid.');

  const fields = fieldsValue as TemplateField[];
  const expected = new Set(fields.map((item) => item.key));
  if (JSON.stringify(content).length > 16000) {
    throw new BadRequestException('Activity content exceeds size limit.');
  }
  for (const [key, value] of Object.entries(content)) {
    if (!expected.has(key) || typeof value !== 'string' || value.length > 5000) {
      throw new BadRequestException('Unexpected or oversized activity response.');
    }
  }
  if (complete && fields.some((item) => !content[item.key]?.trim())) {
    throw new BadRequestException('Complete all activity fields before marking done.');
  }
}

function isUnique(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
