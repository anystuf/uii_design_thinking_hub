import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateLessonProgressDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(86400)
  watchedSeconds?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  completed?: boolean;
}
