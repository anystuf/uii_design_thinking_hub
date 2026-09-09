import { CourseStatus, SprintPhase } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCourseDto {
  @IsString()
  @IsOptional()
  @MaxLength(160)
  title?: string;

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
  @IsOptional()
  @MaxLength(80)
  level?: string;

  @IsEnum(SprintPhase)
  @IsOptional()
  sprintPhase?: SprintPhase;
}
