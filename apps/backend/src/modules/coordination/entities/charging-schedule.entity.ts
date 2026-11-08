export enum ScheduleStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export class ChargingSchedule {
  id: string;
  requestId: string;
  portId: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  estimatedTime: number; // minutes
  fromBattery: number; // Start battery %
  toBattery: number; // Target battery %
  status: ScheduleStatus;
  createdAt: Date;
}
