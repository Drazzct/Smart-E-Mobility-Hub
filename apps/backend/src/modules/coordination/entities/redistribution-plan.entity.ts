export enum RedistributionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export class RedistributionPlan {
  id: string;
  sourceHubId: string;
  destinationHubId: string;
  vehicleIds: string[]; // List of vehicle IDs to redistribute
  status: RedistributionStatus;
  createdAt: Date;
  approvedAt?: Date;
  completedAt?: Date;
  reason: string; // Why redistribution is needed
}
