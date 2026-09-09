import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @IsUUID()
  courseId!: string;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
