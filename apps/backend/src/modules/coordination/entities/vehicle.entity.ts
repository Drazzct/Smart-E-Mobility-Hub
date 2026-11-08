import { EVStatus } from '../../shared-ev/entities/shared-ev.entity.js';

export class Vehicle {
  id: string;
  code: string;
  name: string;
  type: string; // 'Electric scooter', 'Electric bike', etc.
  hubId: string;
  batteryLevel: number; // 0-100%
  status: EVStatus;
  rangeKm: number;
  eligible: boolean; // Can be redistributed
  currentReservationId?: string | null;
}
