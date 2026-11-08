export enum DemandLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export class Hub {
  id: string;
  name: string;
  totalCapacity: number;
  location: string;
  demandLevel: DemandLevel;
}
