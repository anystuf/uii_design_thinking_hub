import { Type } from 'class-transformer';
import { IsInt, IsString, MaxLength, Min } from 'class-validator';

export class FileInputDto {
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @MaxLength(120)
  mimeType!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  size!: number;
}
