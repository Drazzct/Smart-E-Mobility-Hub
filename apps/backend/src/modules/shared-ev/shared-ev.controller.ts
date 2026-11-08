import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { SharedEvService } from './shared-ev.service.js';
import {
  ReserveVehicleDto,
  ReturnVehicleDto,
  SearchVehicleQueryDto,
  StudentActionDto,
} from './dto/shared-ev.dto.js';

/** REST API of Module 1 – base path /api/shared-ev */
@Controller('shared-ev')
export class SharedEvController {
  constructor(private readonly sharedEvService: SharedEvService) {}

  // ---- UC-STU-GetEV ----
  @Get('hubs')
  getHubs() {
    return this.sharedEvService.getHubs();
  }

  @Get('vehicles')
  getAllVehicles() {
    return this.sharedEvService.getAllVehicles();
  }

  @Get('vehicles/search')
  searchVehicles(@Query() query: SearchVehicleQueryDto) {
    return this.sharedEvService.searchVehicles(query);
  }

  @Get('vehicles/:id')
  getVehicle(@Param('id') id: string) {
    return this.sharedEvService.getVehicle(id);
  }

  // ---- UC-STU-ReserveEV ----
  @Post('reservations')
  reserveVehicle(@Body() dto: ReserveVehicleDto) {
    return this.sharedEvService.reserveVehicle(dto.studentId, dto.vehicleId);
  }

  @Get('reservations/active')
  getActiveReservation(@Query('studentId') studentId: string) {
    return { reservation: this.sharedEvService.getActiveReservation(studentId) };
  }

  @Post('reservations/:id/cancel')
  cancelReservation(@Param('id') id: string, @Body() dto: StudentActionDto) {
    return this.sharedEvService.cancelReservation(dto.studentId, id);
  }

  // ---- UC-STU-03 Pick up ----
  @Post('reservations/:id/pickup')
  pickUpVehicle(@Param('id') id: string, @Body() dto: StudentActionDto) {
    return this.sharedEvService.pickUpVehicle(dto.studentId, id);
  }

  // ---- UC-STU-02 Return ----
  @Get('sessions/active')
  getActiveSession(@Query('studentId') studentId: string) {
    return { session: this.sharedEvService.getActiveSession(studentId) };
  }

  @Post('sessions/:id/return')
  returnVehicle(@Param('id') id: string, @Body() dto: ReturnVehicleDto) {
    return this.sharedEvService.returnVehicle(id, dto);
  }
}

