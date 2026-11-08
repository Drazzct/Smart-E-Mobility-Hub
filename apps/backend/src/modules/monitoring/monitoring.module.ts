import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { MonitoringService } from './monitoring.service.js';
import { MonitoringController } from './monitoring.controller.js';
import { MonitoringDataSources } from './adapters/monitoring-data-sources.js';
import { SourceLocator } from './adapters/source-locator.js';
import { Module1EvAdapter } from './adapters/module1-ev.adapter.js';
import { Module2ParkingAdapter } from './adapters/module2-parking.adapter.js';
import { Module4ChargerAdapter } from './adapters/module4-charger.adapter.js';

@Module({
  imports: [DiscoveryModule],
  controllers: [MonitoringController],
  providers: [
    SourceLocator,
    Module1EvAdapter,
    Module2ParkingAdapter,
    Module4ChargerAdapter,
    MonitoringDataSources,
    MonitoringService,
  ],
})
export class MonitoringModule {}
