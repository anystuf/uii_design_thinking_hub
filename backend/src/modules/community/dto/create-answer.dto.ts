import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAnswerDto {
  @IsString()
  @MinLength(5)
  @MaxLength(3000)
  content!: string;
}
