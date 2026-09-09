import { EvidenceType } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateEvidenceDto {
  @IsOptional()
  @IsEnum(EvidenceType)
  type?: EvidenceType;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  reflection?: string;
}
