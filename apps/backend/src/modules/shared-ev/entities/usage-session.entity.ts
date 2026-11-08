export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export class UsageSession {
  id: string;
  studentId: string;
  vehicleId: string;
  reservationId: string;
  startHubId: string;
  startedAt: string; // ISO-8601
  endHubId: string | null;
  endedAt: string | null;
  status: SessionStatus;
}
