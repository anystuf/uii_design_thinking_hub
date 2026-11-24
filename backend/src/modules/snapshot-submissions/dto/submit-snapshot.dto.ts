import { ArrayMinSize, IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SubmitSnapshotDto {
  @IsOptional() @IsUUID()
  milestoneId?: string;

  @IsArray() @ArrayMinSize(1) @IsUUID('4', { each: true })
  evidenceVersionIds!: string[];

  @IsOptional() @IsString() @MaxLength(3000)
  note?: string;
}
