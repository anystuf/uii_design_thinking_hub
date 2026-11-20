import {
  ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsISO8601,
  IsOptional, IsString, Max, MaxLength, Min, MinLength,
} from 'class-validator';

export class SaveExerciseDto {
  @IsIn(['QUIZ', 'WRITTEN', 'PROJECT'])
  kind!: 'QUIZ' | 'WRITTEN' | 'PROJECT';

  @IsString() @MinLength(3) @MaxLength(180)
  title!: string;

  @IsString() @MaxLength(6000)
  instructions!: string;

  @IsArray() @ArrayMaxSize(20)
  items!: unknown[];

  @IsInt() @Min(0) @Max(100)
  passingScore!: number;

  @IsInt() @Min(1) @Max(20)
  maxAttempts!: number;

  @IsBoolean()
  published!: boolean;

  @IsOptional() @IsISO8601()
  dueAt?: string | null;
}

export class SubmitAttemptDto {
  @IsOptional() @IsArray() @ArrayMaxSize(20)
  answerIndexes?: unknown[];

  @IsOptional() @IsString() @MaxLength(10000)
  responseText?: string;

  @IsOptional() @IsString() @MaxLength(100)
  projectId?: string;
}

export class ReviewAttemptDto {
  @IsInt() @Min(0) @Max(100)
  score!: number;

  @IsString() @MinLength(3) @MaxLength(4000)
  feedback!: string;
}
