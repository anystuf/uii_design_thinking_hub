import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export const COMMUNITY_TOPICS = ['GENERAL', 'EMPATHIZE', 'DEFINE', 'IDEATE', 'PROTOTYPE', 'TEST'] as const;
export type CommunityTopic = (typeof COMMUNITY_TOPICS)[number];

export class CreateQuestionDto {
  @IsString()
  @MinLength(12)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(3000)
  body!: string;

  @IsIn(COMMUNITY_TOPICS)
  topic!: CommunityTopic;
}
