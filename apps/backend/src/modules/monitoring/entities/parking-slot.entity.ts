export enum ParkingSlotStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
}

export class ParkingSlot {
  id: string;
  code: string;
  hubId: string;
  status: ParkingSlotStatus;
}
