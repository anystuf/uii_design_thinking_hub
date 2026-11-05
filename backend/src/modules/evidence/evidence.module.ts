import { Module } from '@nestjs/common';
import { StudioAccessModule } from '../studio-access/studio-access.module';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';
import { PrivateStorageService } from './private-storage.service';

@Module({
  imports: [StudioAccessModule],
  controllers: [EvidenceController],
  providers: [EvidenceService, PrivateStorageService],
})
export class EvidenceModule {}
