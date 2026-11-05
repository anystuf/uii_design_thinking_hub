import {
  BadRequestException, ConflictException, ForbiddenException, Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../database/prisma/prisma.service';
import { StudioAccessService } from '../studio-access/studio-access.service';
import {
  CreateIterationDto, CreateVersionedEvidenceDto, ReviseEvidenceDto,
} from './dto/evidence.dto';

@Injectable()
export class EvidenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: StudioAccessService,
  ) {}

  async list(projectId: string, user: AuthenticatedUser) {
    await this.access.project(projectId, user);
    return this.prisma.evidence.findMany({
      where: { projectId },
      include: {
        sprintStage: { select: { stage: true } },
        versions: {
          include: {
            fileAsset: { select: { id: true, fileName: true, mimeType: true, size: true } },
            createdBy: { select: { id: true, fullName: true } },
          },
          orderBy: { version: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(projectId: string, dto: CreateVersionedEvidenceDto, user: AuthenticatedUser) {
    await this.access.project(projectId, user, true);
    const sprintStage = await this.prisma.sprintStage.findUnique({
      where: { projectId_stage: { projectId, stage: dto.mode } },
    });
    if (!sprintStage) throw new NotFoundException('Stage not found for project.');
    if (dto.fileAssetId) await this.assertAsset(projectId, dto.fileAssetId);

    return this.prisma.$transaction(async (tx) => {
      const record = await tx.evidence.create({
        data: {
          projectId, sprintStageId: sprintStage.id, createdById: user.id,
          type: dto.type, title: dto.title, description: dto.description,
          reflection: dto.reflection, activeVersion: 1,
        },
      });
      const version = await tx.evidenceVersion.create({
        data: {
          evidenceId: record.id, version: 1, createdById: user.id,
          type: dto.type, title: dto.title, description: dto.description,
          reflection: dto.reflection, fileAssetId: dto.fileAssetId,
        },
        include: { fileAsset: true },
      });
      return { evidence: record, version };
    });
  }

  async revise(id: string, dto: ReviseEvidenceDto, user: AuthenticatedUser) {
    const evidence = await this.prisma.evidence.findUnique({ where: { id } });
    if (!evidence) throw new NotFoundException('Evidence not found.');
    await this.access.project(evidence.projectId, user, true);
    if (evidence.createdById !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the original author can revise this evidence.');
    }

    if (!Object.keys(dto).length) throw new BadRequestException('At least one change required.');
    if (dto.fileAssetId) await this.assertAsset(evidence.projectId, dto.fileAssetId);

    const latest = await this.prisma.evidenceVersion.findUnique({
      where: { evidenceId_version: { evidenceId: id, version: evidence.activeVersion } },
    });
    if (!latest) throw new ConflictException('Evidence version history is incomplete.');

    return this.prisma.$transaction(async (tx) => {
      const changed = await tx.evidence.updateMany({
        where: { id, activeVersion: latest.version },
        data: {
          type: dto.type, title: dto.title, description: dto.description,
          reflection: dto.reflection, activeVersion: latest.version + 1,
        },
      });
      if (changed.count !== 1) throw new ConflictException('Evidence changed. Refresh and retry.');

      return tx.evidenceVersion.create({
        data: {
          evidenceId: id, version: latest.version + 1, createdById: user.id,
          type: dto.type ?? latest.type, title: dto.title ?? latest.title,
          description: dto.description ?? latest.description,
          reflection: dto.reflection ?? latest.reflection,
          fileAssetId: dto.fileAssetId ?? latest.fileAssetId,
        },
        include: { fileAsset: true },
      });
    });
  }

  async notes(projectId: string, user: AuthenticatedUser) {
    await this.access.project(projectId, user);
    return this.prisma.iterationNote.findMany({
      where: { projectId },
      include: { author: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addNote(projectId: string, dto: CreateIterationDto, user: AuthenticatedUser) {
    await this.access.project(projectId, user, true);
    return this.prisma.iterationNote.create({
      data: {
        projectId, authorId: user.id, mode: dto.mode,
        reason: dto.reason, nextDecision: dto.nextDecision,
      },
    });
  }

  private async assertAsset(projectId: string, fileAssetId: string) {
    const asset = await this.prisma.fileAsset.findUnique({ where: { id: fileAssetId } });
    if (!asset || asset.projectId !== projectId) {
      throw new BadRequestException('File must be an uploaded asset in the same project.');
    }
  }
}
