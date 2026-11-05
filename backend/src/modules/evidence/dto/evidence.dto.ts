import { EvidenceType, SprintStageType } from '@prisma/client';
import {
  IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID,
  Max, MaxLength, Min,
} from 'class-validator';

export class PresignUploadDto {
  @IsString() @IsNotEmpty() @MaxLength(240)
  fileName!: string;

  @IsString() @IsNotEmpty() @MaxLength(100)
  mimeType!: string;

  @IsInt() @Min(1) @Max(50 * 1024 * 1024)
  size!: number;
}

export class CreateVersionedEvidenceDto {
  @IsEnum(SprintStageType)
  mode!: SprintStageType;

  @IsEnum(EvidenceType)
  type!: EvidenceType;

  @IsString() @IsNotEmpty() @MaxLength(160)
  title!: string;

  @IsOptional() @IsString() @MaxLength(3000)
  description?: string;

  @IsOptional() @IsString() @MaxLength(3000)
  reflection?: string;

  @IsOptional() @IsUUID()
  fileAssetId?: string;
}

export class ReviseEvidenceDto {
  @IsOptional() @IsEnum(EvidenceType)
  type?: EvidenceType;

  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160)
  title?: string;

  @IsOptional() @IsString() @MaxLength(3000)
  description?: string;

  @IsOptional() @IsString() @MaxLength(3000)
  reflection?: string;

  @IsOptional() @IsUUID()
  fileAssetId?: string;
}

export class CreateIterationDto {
  @IsString() @IsNotEmpty() @MaxLength(2500)
  reason!: string;

  @IsString() @IsNotEmpty() @MaxLength(2500)
  nextDecision!: string;

  @IsOptional() @IsEnum(SprintStageType)
  mode?: SprintStageType;
}
