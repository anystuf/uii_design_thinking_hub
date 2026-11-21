import { Module } from '@nestjs/common';
import { StudioAccessModule } from '../studio-access/studio-access.module';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';

@Module({
  imports: [StudioAccessModule],
  controllers: [ChallengesController],
  providers: [ChallengesService],
})
export class ChallengesModule {}
