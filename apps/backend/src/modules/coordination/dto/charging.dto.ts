export class ChargingPriorityDto {
  vehicleId: string;
  vehicleName: string;
  hubId: string;
  batteryLevel: number;
  priority: string;
  waitingTime: number;
  riskLevel: string;
  usageRequired: string;
  reason: string;
}

export class GetChargingPrioritiesResponseDto {
  priorities: ChargingPriorityDto[];
  totalVehicles: number;
}

export class ChargingScheduleItemDto {
  requestId: string;
  vehicleId: string;
  vehicleName: string;
  portId: string;
  startTime: string;
  endTime: string;
  estimatedTime: number;
  fromBattery: number;
  toBattery: number;
  status: string;
}

export class GenerateChargingScheduleDto {
  schedules: ChargingScheduleItemDto[];
  assigned: number;
  queued: number;
  totalRequests: number;
  estimatedTotalTime: string;
  totalEnergy: string;
}

export class ApproveChargingScheduleDto {
  scheduleId: string;
}

export class RejectChargingScheduleDto {
  scheduleId: string;
  reason?: string;
}

export class ChargingScheduleResponseDto {
  message: string;
  scheduleId: string;
  status: string;
}

export class GetChargingSchedulesResponseDto {
  schedules: ChargingScheduleItemDto[];
  totalSchedules: number;
}
