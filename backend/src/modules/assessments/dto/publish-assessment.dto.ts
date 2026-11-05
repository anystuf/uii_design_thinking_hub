import { Type } from 'class-transformer';
import {
  ArrayMinSize, IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional,
  IsString, IsUUID, Max, MaxLength, Min, ValidateNested,
} from 'class-validator';
import { ReviewDecision } from '@prisma/client';

export class CriterionRatingDto {
  @IsUUID() criterionId!: string;
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0) @Max(10)
  score!: number;

  @IsOptional() @IsString() @MaxLength(1000)
  comment?: string;
}

export class PublishAssessmentDto {
  @IsUUID()
  rubricVersionId!: string;

  @IsEnum(ReviewDecision)
  decision!: ReviewDecision;

  @IsOptional() @IsString() @MaxLength(3000)
  feedback?: string;

  @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CriterionRatingDto)
  scores!: CriterionRatingDto[];
}
