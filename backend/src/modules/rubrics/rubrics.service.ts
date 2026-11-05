import {
  BadRequestException, ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { RubricStatus, UserRole } from '@prisma/client';

import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../database/prisma/prisma.service';
import { StudioAccessService } from '../studio-access/studio-access.service';
import { CreateRubricDto, ReplaceCriteriaDto } from './dto/rubric.dto';

@Injectable()
export class RubricsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: StudioAccessService,
  ) {}

  async create(challengeId: string, dto: CreateRubricDto, user: AuthenticatedUser) {
    const challenge = await this.access.challenge(challengeId, user);
    await this.access.lecturerCourse(challenge.courseId, user);

    if (dto.milestoneId) {
      const milestone = await this.prisma.challengeMilestone.findUnique({
        where: { id: dto.milestoneId },
      });
      if (!milestone || milestone.challengeId !== challengeId) {
        throw new BadRequestException('Milestone belongs to a different challenge.');
      }
    }

    return this.prisma.rubric.create({
      data: {
        challengeId, milestoneId: dto.milestoneId,
        title: dto.title, createdById: user.id,
        versions: { create: { version: 1, status: RubricStatus.DRAFT } },
      },
      include: { versions: true },
    });
  }

  async list(challengeId: string, user: AuthenticatedUser) {
    const challenge = await this.access.challenge(challengeId, user);
    const canManage = user.role === UserRole.ADMIN ||
      (user.role === UserRole.LECTURER && challenge.course.createdById === user.id);
    return this.prisma.rubric.findMany({
      where: {
        challengeId,
        ...(canManage ? {} : { versions: { some: { status: RubricStatus.PUBLISHED } } }),
      },
      include: {
        versions: {
          where: canManage ? {} : { status: RubricStatus.PUBLISHED },
          include: { criteria: { orderBy: { orderIndex: 'asc' } } },
          orderBy: { version: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string, user: AuthenticatedUser) {
    const rubric = await this.prisma.rubric.findUnique({ where: { id } });
    if (!rubric) throw new NotFoundException('Rubric not found.');
    const rows = await this.list(rubric.challengeId, user);
    const allowed = rows.find((item) => item.id === id);
    if (!allowed) throw new NotFoundException('Rubric not published.');
    return allowed;
  }

  async replaceCriteria(id: string, dto: ReplaceCriteriaDto, user: AuthenticatedUser) {
    const version = await this.prisma.rubricVersion.findUnique({
      where: { id }, include: { rubric: true },
    });
    if (!version) throw new NotFoundException('Rubric version not found.');
    await this.access.lecturerCourse(
      (await this.access.challenge(version.rubric.challengeId, user)).courseId, user,
    );
    if (version.status !== RubricStatus.DRAFT) {
      throw new ConflictException('Published rubric versions are immutable.');
    }
    if (dto.criteria.length > 30) {
      throw new BadRequestException('Rubric cannot have more than 30 criteria.');
    }
    return this.prisma.$transaction(async (tx) => {
      // Acquire a write lock on the DRAFT row before mutating its children.
      // A concurrent publish either waits for these edits or blocks them.
      const locked = await tx.rubricVersion.updateMany({
        where: { id, status: RubricStatus.DRAFT },
        data: { status: RubricStatus.DRAFT },
      });
      if (locked.count !== 1) {
        throw new ConflictException('Rubric was published during editing.');
      }
      await tx.rubricCriterion.deleteMany({ where: { rubricVersionId: id } });
      await tx.rubricCriterion.createMany({
        data: dto.criteria.map((criterion, orderIndex) => ({
          rubricVersionId: id,
          title: criterion.title, description: criterion.description,
          weight: criterion.weight, maxScore: criterion.maxScore, orderIndex,
        })),
      });
      return tx.rubricVersion.findUnique({
        where: { id }, include: { criteria: { orderBy: { orderIndex: 'asc' } } },
      });
    });
  }

  async publish(id: string, user: AuthenticatedUser) {
    const version = await this.prisma.rubricVersion.findUnique({
      where: { id }, include: { rubric: true },
    });
    if (!version) throw new NotFoundException('Rubric version not found.');
    const challenge = await this.access.challenge(version.rubric.challengeId, user);
    await this.access.lecturerCourse(challenge.courseId, user);

    return this.prisma.$transaction(async (tx) => {
      // Changing status first locks this row. Criteria edits also lock it
      // before modifying children, guaranteeing a stable scoring definition.
      const locked = await tx.rubricVersion.updateMany({
        where: { id, status: RubricStatus.DRAFT },
        data: { status: RubricStatus.PUBLISHED, publishedAt: new Date() },
      });
      if (locked.count !== 1) {
        throw new ConflictException('Rubric already published.');
      }
      const criteria = await tx.rubricCriterion.findMany({
        where: { rubricVersionId: id },
      });
      if (!criteria.length ||
        criteria.reduce((sum, criterion) => sum + criterion.weight, 0) !== 100) {
        throw new BadRequestException('Rubric weights must total exactly 100.');
      }
      return tx.rubricVersion.findUnique({
        where: { id }, include: { criteria: { orderBy: { orderIndex: 'asc' } } },
      });
    });
  }

  async nextVersion(id: string, user: AuthenticatedUser) {
    const rubric = await this.prisma.rubric.findUnique({
      where: { id }, include: {
        versions: { orderBy: { version: 'desc' }, take: 1, include: { criteria: true } },
      },
    });
    if (!rubric) throw new NotFoundException('Rubric not found.');
    const challenge = await this.access.challenge(rubric.challengeId, user);
    await this.access.lecturerCourse(challenge.courseId, user);
    const previous = rubric.versions[0];
    if (!previous || previous.status !== RubricStatus.PUBLISHED) {
      throw new ConflictException('Publish the current draft before starting a new version.');
    }

    return this.prisma.rubricVersion.create({
      data: {
        rubricId: id, version: previous.version + 1,
        criteria: { create: previous.criteria.map((criterion) => ({
          title: criterion.title, description: criterion.description,
          weight: criterion.weight, maxScore: criterion.maxScore,
          orderIndex: criterion.orderIndex,
        })) },
      },
      include: { criteria: true },
    });
  }
}
