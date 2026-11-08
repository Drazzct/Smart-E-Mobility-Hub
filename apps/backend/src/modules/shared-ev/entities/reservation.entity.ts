export enum ReservationStatus {
  CONFIRMED = 'CONFIRMED', // active, waiting for pickup
  FULFILLED = 'FULFILLED', // consumed by a pickup
  CANCELLED = 'CANCELLED', // cancelled by the student
  EXPIRED = 'EXPIRED', // not picked up within the grace period (FR-AUTO-01)
}

export class Reservation {
  id: string;
  studentId: string;
  vehicleId: string;
  hubId: string;
  createdAt: string; // ISO-8601
  expiresAt: string; // ISO-8601
  status: ReservationStatus;
}
