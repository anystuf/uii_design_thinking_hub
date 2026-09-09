import { EvidenceType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { FileInputDto } from './file-input.dto';

export class CreateEvidenceDto {
  @IsUUID()
  sprintStageId!: string;

  @IsEnum(EvidenceType)
  type!: EvidenceType;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  reflection?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => FileInputDto)
  files?: FileInputDto[];
}
