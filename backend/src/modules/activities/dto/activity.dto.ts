import { ActivityStatus } from '@prisma/client';
import {
  IsBoolean, IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength,
} from 'class-validator';

export class AssignChallengeActivityDto {
  @IsUUID()
  templateId!: string;

  @IsOptional() @IsString() @MaxLength(2000)
  instructions?: string;

  @IsOptional() @IsBoolean()
  isPublished?: boolean;
}

export class CreateProjectActivityDto {
  @IsUUID()
  templateId!: string;

  @IsOptional() @IsUUID()
  challengeActivityId?: string;

  @IsOptional() @IsObject()
  content?: Record<string, string>;
}

export class UpdateProjectActivityDto {
  @IsOptional() @IsObject()
  content?: Record<string, string>;

  @IsOptional() @IsEnum(ActivityStatus)
  status?: ActivityStatus;
}
