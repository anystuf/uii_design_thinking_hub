import { Module } from '@nestjs/common';
import { StudioAccessModule } from '../studio-access/studio-access.module';
import { PracticeController } from './practice.controller';
import { PracticeService } from './practice.service';

@Module({
  imports: [StudioAccessModule],
  controllers: [PracticeController],
  providers: [PracticeService],
})
export class PracticeModule {}
