import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CoordinationService } from './coordination.service.js';

@Controller('coordination')
export class CoordinationController {
  constructor(private readonly service: CoordinationService) {}

  @Get('hubs')
  getHubsStatus() {
    return this.service.getHubsStatus();
  }

  @Get('vehicles')
  getVehicles() {
    return this.service.getVehicles();
  }

  @Get('demand-analysis')
  analyzeResourceDemand() {
    return this.service.analyzeResourceDemand();
  }

  @Get('redistribution/recommendation')
  getRedistributionRecommendation() {
    return this.service.getRedistributionRecommendation();
  }

  @Post('redistribution/approve/:planId')
  approveRedistribution(@Param('planId') planId: string) {
    return this.service.approveRedistribution(planId);
  }

  @Post('redistribution/reject/:planId')
  rejectRedistribution(@Param('planId') planId: string) {
    return this.service.rejectRedistribution(planId);
  }

  @Get('charging/priorities')
  calculateChargingPriorities() {
    return this.service.calculateChargingPriorities();
  }

  @Get('charging/schedule-generator')
  generateChargingSchedule() {
    return this.service.generateChargingSchedule();
  }

  @Post('charging/schedule/approve')
  approveChargingSchedule(@Body() schedules: any[]) {
    return this.service.approveChargingSchedule(schedules);
  }

  @Post('charging/schedule/reject')
  rejectChargingSchedule() {
    return this.service.rejectChargingSchedule();
  }

  @Get('charging/schedules')
  getChargingSchedules() {
    return this.service.getChargingSchedules();
  }
}
