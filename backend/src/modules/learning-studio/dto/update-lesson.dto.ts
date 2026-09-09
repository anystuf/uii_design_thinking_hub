import { LessonContentType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateLessonDto {
  @IsString()
  @IsOptional()
  @MaxLength(160)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1200)
  description?: string;

  @IsInt()
  @Min(0)
  @Max(500)
  @IsOptional()
  orderIndex?: number;

  @IsInt()
  @Min(0)
  @Max(600)
  @IsOptional()
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  videoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  content?: string;

  @IsEnum(LessonContentType)
  @IsOptional()
  contentType?: LessonContentType;
}

