import { ChallengeStatus, SprintStageType } from '@prisma/client';
import {
  IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength,
} from 'class-validator';

export class CreateChallengeDto {
  @IsString() @IsNotEmpty() @MaxLength(160)
  title!: string;

  @IsString() @IsNotEmpty() @MaxLength(6000)
  brief!: string;

  @IsOptional() @IsString() @MaxLength(2000)
  learningOutcomes?: string;
}

export class UpdateChallengeDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160)
  title?: string;

  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(6000)
  brief?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  learningOutcomes?: string;

  @IsOptional() @IsEnum(ChallengeStatus)
  status?: ChallengeStatus;
}

export class CreateMilestoneDto {
  @IsString() @IsNotEmpty() @MaxLength(160)
  title!: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsOptional() @IsEnum(SprintStageType)
  mode?: SprintStageType;

  @IsOptional() @IsDateString()
  dueAt?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  deliverables?: string;
}
