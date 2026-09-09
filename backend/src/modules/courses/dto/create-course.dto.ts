import { CourseStatus, SprintPhase } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  slug?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1200)
  description?: string;

  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  level!: string;

  @IsEnum(SprintPhase)
  @IsOptional()
  sprintPhase?: SprintPhase;
}
