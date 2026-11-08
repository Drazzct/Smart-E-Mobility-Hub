import { Module } from '@nestjs/common';
import { SharedEvService } from './shared-ev.service.js';
import { SharedEvController } from './shared-ev.controller.js';
import { SharedEvRepository } from './shared-ev.repository.js';
import { ClockService } from './clock.service.js';

@Module({
  controllers: [SharedEvController],
  providers: [SharedEvService, SharedEvRepository, ClockService],
})
export class SharedEvModule {}
