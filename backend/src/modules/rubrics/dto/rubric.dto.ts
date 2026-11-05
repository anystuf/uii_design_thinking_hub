import { Type } from 'class-transformer';
import {
  ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID,
  Max, MaxLength, Min, ValidateNested,
} from 'class-validator';

export class CreateRubricDto {
  @IsString() @IsNotEmpty() @MaxLength(160)
  title!: string;

  @IsOptional() @IsUUID()
  milestoneId?: string;
}

export class CriterionInputDto {
  @IsString() @IsNotEmpty() @MaxLength(160)
  title!: string;

  @IsOptional() @IsString() @MaxLength(1000)
  description?: string;

  @IsInt() @Min(1) @Max(100)
  weight!: number;

  @IsInt() @Min(1) @Max(10)
  maxScore!: number;
}

export class ReplaceCriteriaDto {
  @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CriterionInputDto)
  criteria!: CriterionInputDto[];
}
