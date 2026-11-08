export enum ChargingPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum RiskLevel {
  CRITICAL = 'CRITICAL',
  AT_RISK = 'AT_RISK',
  NORMAL = 'NORMAL',
}

export enum ChargingRequestStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  CHARGING = 'CHARGING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class ChargingRequest {
  id: string;
  vehicleId: string;
  vehicleName: string;
  hubId: string;
  battery: number; // Current battery %
  priority: ChargingPriority;
  waitingTime: number; // minutes
  usageRequired: string; // Time when vehicle is needed
  riskLevel: RiskLevel;
  status: ChargingRequestStatus;
  assignedPort?: string;
  createdAt: Date;
}
