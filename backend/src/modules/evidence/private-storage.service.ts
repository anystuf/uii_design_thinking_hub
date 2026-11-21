import {
  BadRequestException, ConflictException, ForbiddenException, Injectable,
  NotFoundException, ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../database/prisma/prisma.service';
import { StudioAccessService } from '../studio-access/studio-access.service';
import { PresignUploadDto } from './dto/evidence.dto';

const MIME_EXTENSIONS: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'audio/mpeg': '.mp3',
  'video/mp4': '.mp4',
  'text/plain': '.txt',
};

@Injectable()
export class PrivateStorageService {
  private client: SupabaseClient | undefined;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly access: StudioAccessService,
  ) {}

  private get bucket() {
    return this.config.get<string>('EVIDENCE_BUCKET') || 'design-evidence';
  }

  private get storage() {
    if (!this.client) {
      const url = this.config.get<string>('SUPABASE_URL');
      const secret = this.config.get<string>('SUPABASE_SECRET_KEY');
      if (!url || !secret) {
        throw new ServiceUnavailableException('Private evidence storage is not configured.');
      }
      // A server-only secret key MUST NEVER be exposed as NEXT_PUBLIC_*.
      this.client = createClient(url, secret, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }
    return this.client.storage.from(this.bucket);
  }

  async presign(projectId: string, dto: PresignUploadDto, user: AuthenticatedUser) {
    await this.access.project(projectId, user, true);
    const extension = MIME_EXTENSIONS[dto.mimeType.toLowerCase()];
    if (!extension) throw new BadRequestException('File MIME type is not allowed.');

    const key = projectId + '/' + randomUUID() + extension;
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const intent = await this.prisma.uploadIntent.create({
      data: {
        projectId, userId: user.id, fileName: dto.fileName,
        mimeType: dto.mimeType.toLowerCase(), declaredSize: dto.size,
        storageKey: key, expiresAt,
      },
    });

    const { data, error } = await this.storage.createSignedUploadUrl(key, { upsert: false });
    if (error || !data) {
      await this.prisma.uploadIntent.delete({ where: { id: intent.id } });
      throw new ServiceUnavailableException('Could not issue a signed upload token.');
    }

    return {
      intentId: intent.id, storageKey: key, bucket: this.bucket,
      token: data.token, expiresAt: expiresAt.toISOString(),
    };
  }

  async complete(intentId: string, user: AuthenticatedUser) {
    const intent = await this.prisma.uploadIntent.findUnique({ where: { id: intentId } });
    if (!intent) throw new NotFoundException('Upload intent not found.');
    if (intent.userId !== user.id) throw new ForbiddenException('Not your upload.');
    await this.access.project(intent.projectId, user, true);

    if (intent.status === UploadStatus.COMPLETED) {
      const existing = await this.prisma.fileAsset.findUnique({ where: { storageKey: intent.storageKey } });
      if (!existing) throw new ConflictException('Upload was completed without a file record.');
      return existing;
    }
    if (intent.expiresAt.getTime() < Date.now()) {
      throw new ConflictException('Upload intent expired. Request a new one.');
    }

    const { data, error } = await this.storage.info(intent.storageKey);
    if (error || !data) throw new NotFoundException('Uploaded object not found in private storage.');

    const actualSize = Number(data.size);
    const actualMime = (data.contentType ?? '').toLowerCase().split(';')[0].trim();
    if (
      !Number.isFinite(actualSize) ||
      actualSize !== intent.declaredSize ||
      actualMime !== intent.mimeType ||
      actualSize > 50 * 1024 * 1024
    ) {
      await this.storage.remove([intent.storageKey]);
      throw new BadRequestException('Uploaded file metadata does not match the declared file.');
    }

    return this.prisma.$transaction(async (tx) => {
      const reserved = await tx.uploadIntent.updateMany({
        where: { id: intent.id, status: UploadStatus.PENDING },
        data: { status: UploadStatus.COMPLETED },
      });
      if (reserved.count !== 1) throw new ConflictException('Upload already completed.');
      return tx.fileAsset.create({
        data: {
          projectId: intent.projectId, uploadedById: user.id,
          storageKey: intent.storageKey, bucket: this.bucket,
          fileName: intent.fileName, mimeType: intent.mimeType,
          size: actualSize,
        },
      });
    });
  }

  async download(fileAssetId: string, user: AuthenticatedUser) {
    const file = await this.prisma.fileAsset.findUnique({ where: { id: fileAssetId } });
    if (!file) throw new NotFoundException('File not found.');
    await this.access.project(file.projectId, user);

    // Short-lived private link, issued only after resource authorization.
    const { data, error } = await this.storage.createSignedUrl(file.storageKey, 60);
    if (error || !data) throw new ServiceUnavailableException('Could not sign download URL.');
    return { signedUrl: data.signedUrl, expiresInSeconds: 60, fileName: file.fileName };
  }
}
