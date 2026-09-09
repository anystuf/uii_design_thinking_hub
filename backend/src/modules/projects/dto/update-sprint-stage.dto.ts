import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateSprintStageDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  completed?: boolean;
}
