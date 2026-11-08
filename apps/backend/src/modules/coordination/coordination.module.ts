import { Module } from '@nestjs/common';
import { CoordinationService } from './coordination.service.js';
import { CoordinationController } from './coordination.controller.js';

@Module({
  controllers: [CoordinationController],
  providers: [CoordinationService],
  exports: [CoordinationService],
})
export class CoordinationModule {}
