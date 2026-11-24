import { Module } from '@nestjs/common';
import { StudioAccessModule } from '../studio-access/studio-access.module';
import { SnapshotSubmissionsController } from './snapshot-submissions.controller';
import { SnapshotSubmissionsService } from './snapshot-submissions.service';

@Module({
  imports: [StudioAccessModule],
  controllers: [SnapshotSubmissionsController],
  providers: [SnapshotSubmissionsService],
})
export class SnapshotSubmissionsModule {}
