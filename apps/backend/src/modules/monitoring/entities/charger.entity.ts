export enum ChargerStatus {
  FREE = 'FREE',
  BUSY = 'BUSY',
  FAULTY = 'FAULTY',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export const UNAVAILABLE_CHARGER_STATUSES: ChargerStatus[] = [
  ChargerStatus.FAULTY,
  ChargerStatus.MAINTENANCE,
  ChargerStatus.OUT_OF_SERVICE,
];

export class Charger {
  id: string;
  code: string;
  hubId: string;
  status: ChargerStatus;
  powerKw: number;
  currentEV?: string | null;
}
