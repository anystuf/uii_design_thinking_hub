import { Module } from '@nestjs/common';
import { StudioAccessService } from './studio-access.service';

@Module({
  providers: [StudioAccessService],
  exports: [StudioAccessService],
})
export class StudioAccessModule {}
