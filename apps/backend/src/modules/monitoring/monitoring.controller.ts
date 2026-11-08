import { Controller, Get, Param } from '@nestjs/common';
import { MonitoringService } from './monitoring.service.js';

@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('overview')
  getOverview() {
    return this.monitoringService.getOverview();
  }

  @Get('hubs/:hubId')
  getHubDetail(@Param('hubId') hubId: string) {
    return this.monitoringService.getHubDetail(hubId);
  }

  @Get('alerts')
  getAlerts() {
    return this.monitoringService.getAlerts();
  }

  @Get('charging-queue')
  getChargingQueue() {
    return this.monitoringService.getChargingQueue();
  }
}
