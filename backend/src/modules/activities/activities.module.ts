import { Module } from '@nestjs/common';
import { StudioAccessModule } from '../studio-access/studio-access.module';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';

@Module({
  imports: [StudioAccessModule],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}
