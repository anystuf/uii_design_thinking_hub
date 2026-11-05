import { Module } from '@nestjs/common';
import { StudioAccessModule } from '../studio-access/studio-access.module';
import { RubricsController } from './rubrics.controller';
import { RubricsService } from './rubrics.service';

@Module({
  imports: [StudioAccessModule],
  controllers: [RubricsController],
  providers: [RubricsService],
})
export class RubricsModule {}
