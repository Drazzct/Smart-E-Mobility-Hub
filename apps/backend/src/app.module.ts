import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SharedEvModule } from './modules/shared-ev/shared-ev.module.js';
import { CoordinationModule } from './modules/coordination/coordination.module.js';

@Module({
  imports: [
    SharedEvModule,
    CoordinationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

