import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export enum AnnouncementAudience {
  COURSE = 'COURSE',
  ALL_STUDENTS = 'ALL_STUDENTS',
}

export class PublishAnnouncementDto {
  @IsString()
  @MinLength(4)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1500)
  body!: string;

  @IsEnum(AnnouncementAudience)
  audience!: AnnouncementAudience;

  @IsUUID()
  @IsOptional()
  courseId?: string;
}
