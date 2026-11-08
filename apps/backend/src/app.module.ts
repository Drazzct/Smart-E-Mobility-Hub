import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SharedEvModule } from './modules/shared-ev/shared-ev.module.js';
import { SimulationModule } from './modules/simulation/simulation.module.js';

@Module({
  imports: [
    SharedEvModule,
    SimulationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

