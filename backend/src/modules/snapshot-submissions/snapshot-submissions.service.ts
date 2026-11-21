import {
  BadRequestException, ConflictException, ForbiddenException,
  Injectable, NotFoundException,
} from '@nestjs/common';
import { Prisma, SubmissionKind, SubmissionStatus } from '@prisma/client';

import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../database/prisma/prisma.service';
import { StudioAccessService } from '../studio-access/studio-access.service';
import { SubmitSnapshotDto } from './dto/submit-snapshot.dto';

@Injectable()
export class SnapshotSubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: StudioAccessService,
  ) {}

  async submit(projectId: string, dto: SubmitSnapshotDto, user: AuthenticatedUser) {
    const project = await this.access.project(projectId, user, true);

    const evidenceIds = [...new Set(dto.evidenceVersionIds)];
    if (!evidenceIds.length || evidenceIds.length !== dto.evidenceVersionIds.length) {
      throw new BadRequestException('Select unique evidence versions to submit.');
    }
    if (evidenceIds.length > 100) {
      throw new BadRequestException('Cannot submit more than 100 evidence items.');
    }

    const milestone = dto.milestoneId
      ? await this.prisma.challengeMilestone.findUnique({ where: { id: dto.milestoneId } })
      : null;
    if (dto.milestoneId && (!milestone || milestone.challengeId !== project.challengeId)) {
      throw new BadRequestException('Milestone does not belong to this project challenge.');
    }

    const now = new Date();
    const isLate = Boolean(milestone?.dueAt && now > milestone.dueAt);
    if (isLate && milestone?.allowLate === false) {
      throw new ConflictException('Submission deadline has passed.');
    }

    const scopeKey = dto.milestoneId ? 'MILESTONE:' + dto.milestoneId : 'PROJECT';
    const kind = dto.milestoneId ? SubmissionKind.MILESTONE : SubmissionKind.PROJECT;

    // Serializable isolation + unique (projectId, scopeKey, version) keep
    // concurrent requests from allocating the same submission version.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const versions = await tx.evidenceVersion.findMany({
            where: { id: { in: evidenceIds } },
            include: { evidence: { select: { projectId: true } } },
          });
          if (versions.length !== evidenceIds.length ||
              versions.some((item) => item.evidence.projectId !== projectId)) {
            throw new BadRequestException('Evidence version does not belong to this project.');
          }
          const previous = await tx.submissionSnapshot.findFirst({
            where: { projectId, scopeKey },
            orderBy: { version: 'desc' },
            select: { version: true },
          });
          return tx.submissionSnapshot.create({
            data: {
              projectId, milestoneId: dto.milestoneId, scopeKey, kind,
              version: (previous?.version ?? 0) + 1,
              submittedById: user.id, status: SubmissionStatus.SUBMITTED,
              note: dto.note, isLate,
              items: { create: evidenceIds.map((evidenceVersionId) => ({ evidenceVersionId })) },
            },
            include: {
              items: {
                include: {
                  evidenceVersion: {
                    include: {
                      fileAsset: { select: { id: true, fileName: true, mimeType: true, size: true } },
                    },
                  },
                },
              },
            },
          });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        if (isRetryable(error) && attempt < 2) continue;
        if (isRetryable(error)) {
          throw new ConflictException('Concurrent submission. Refresh and retry.');
        }
        throw error;
      }
    }
    throw new ConflictException('Could not allocate a submission version.');
  }

  async list(projectId: string, user: AuthenticatedUser) {
    await this.access.project(projectId, user);
    return this.prisma.submissionSnapshot.findMany({
      where: { projectId },
      include: {
        submittedBy: { select: { id: true, fullName: true } },
        milestone: { select: { id: true, title: true, dueAt: true } },
        items: {
          include: {
            evidenceVersion: {
              include: { fileAsset: { select: { id: true, fileName: true, size: true } } },
            },
          },
        },
        assessments: {
          include: {
            scores: { include: { criterion: { select: { title: true, maxScore: true } } } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async get(id: string, user: AuthenticatedUser) {
    const submission = await this.prisma.submissionSnapshot.findUnique({
      where: { id },
    });
    if (!submission) throw new NotFoundException('Submission not found.');
    await this.access.project(submission.projectId, user);
    return this.prisma.submissionSnapshot.findUnique({
      where: { id },
      include: {
        submittedBy: { select: { id: true, fullName: true } },
        milestone: true,
        items: {
          include: {
            evidenceVersion: {
              include: { fileAsset: { select: { id: true, fileName: true, size: true } } },
            },
          },
        },
      },
    });
  }
}

function isRetryable(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === 'P2002' || error.code === 'P2034');
}
