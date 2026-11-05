import { ProjectTaskStatus } from '@prisma/client';
import {
  IsBoolean, IsDateString, IsEmail, IsEnum, IsNotEmpty,
  IsOptional, IsString, IsUUID, MaxLength,
} from 'class-validator';

export class CreateTeamDto {
  @IsString() @IsNotEmpty() @MaxLength(160)
  name!: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;
}

export class InviteTeamMemberDto {
  @IsEmail()
  email!: string;
}

export class RespondInvitationDto {
  @IsBoolean()
  accept!: boolean;
}

export class CreateProjectTaskDto {
  @IsString() @IsNotEmpty() @MaxLength(160)
  title!: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsOptional() @IsUUID()
  assigneeId?: string;

  @IsOptional() @IsDateString()
  dueAt?: string;
}

export class UpdateProjectTaskDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160)
  title?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsOptional() @IsUUID()
  assigneeId?: string;

  @IsOptional() @IsEnum(ProjectTaskStatus)
  status?: ProjectTaskStatus;

  @IsOptional() @IsDateString()
  dueAt?: string;
}
