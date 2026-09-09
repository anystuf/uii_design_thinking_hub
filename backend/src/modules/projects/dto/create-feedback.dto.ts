import { IsString, MaxLength } from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  @MaxLength(3000)
  comment!: string;
}
