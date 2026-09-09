import { PostVisibility } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsUUID()
  projectId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  caption?: string;

  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;
}
