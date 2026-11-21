import {
  ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { ChallengeStatus, UserRole } from '@prisma/client';

import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../database/prisma/prisma.service';
import { StudioAccessService } from '../studio-access/studio-access.service';
import { CreateChallengeDto, CreateMilestoneDto, UpdateChallengeDto } from './dto/challenge.dto';

@Injectable()
export class ChallengesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: StudioAccessService,
  ) {}

  async list(courseId: string, user: AuthenticatedUser) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found.');
    const lecturer = user.role === UserRole.ADMIN ||
      (user.role === UserRole.LECTURER && course.createdById === user.id);
    if (!lecturer) await this.access.enrolledStudent(courseId, user);

    return this.prisma.designChallenge.findMany({
      where: { courseId, ...(lecturer ? {} : { status: { not: ChallengeStatus.DRAFT } }) },
      include: { milestones: { orderBy: { dueAt: 'asc' } }, _count: { select: { projects: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(courseId: string, dto: CreateChallengeDto, user: AuthenticatedUser) {
    await this.access.lecturerCourse(courseId, user);
    return this.prisma.designChallenge.create({
      data: {
        courseId,
        title: dto.title,
        brief: dto.brief,
        learningOutcomes: dto.learningOutcomes,
      },
    });
  }

  async get(id: string, user: AuthenticatedUser) {
    await this.access.challenge(id, user);
    return this.prisma.designChallenge.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true } },
        milestones: { orderBy: { dueAt: 'asc' } },
        activities: { include: { template: true }, orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async update(id: string, dto: UpdateChallengeDto, user: AuthenticatedUser) {
    const existing = await this.access.challenge(id, user);
    await this.access.lecturerCourse(existing.courseId, user);

    if (dto.status && dto.status !== existing.status) {
      const allowed: Record<ChallengeStatus, ChallengeStatus[]> = {
        DRAFT: [ChallengeStatus.PUBLISHED],
        PUBLISHED: [ChallengeStatus.CLOSED],
        CLOSED: [ChallengeStatus.PUBLISHED],
      };
      if (!allowed[existing.status].includes(dto.status)) {
        throw new ConflictException('Invalid challenge status transition.');
      }
    }
    return this.prisma.designChallenge.update({
      where: { id },
      data: {
        title: dto.title,
        brief: dto.brief,
        learningOutcomes: dto.learningOutcomes,
        status: dto.status,
        publishedAt: dto.status === ChallengeStatus.PUBLISHED
          ? (existing.publishedAt ?? new Date())
          : undefined,
      },
    });
  }

  async addMilestone(id: string, dto: CreateMilestoneDto, user: AuthenticatedUser) {
    const challenge = await this.access.challenge(id, user);
    await this.access.lecturerCourse(challenge.courseId, user);
    return this.prisma.challengeMilestone.create({
      data: {
        challengeId: id,
        title: dto.title,
        description: dto.description,
        mode: dto.mode,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        deliverables: dto.deliverables,
      },
    });
  }

  async milestones(id: string, user: AuthenticatedUser) {
    await this.access.challenge(id, user);
    return this.prisma.challengeMilestone.findMany({
      where: { challengeId: id }, orderBy: { dueAt: 'asc' },
    });
  }
}
