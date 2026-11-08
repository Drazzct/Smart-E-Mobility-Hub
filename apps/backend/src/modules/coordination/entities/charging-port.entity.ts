export enum PortStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  DISABLED = 'DISABLED',
}

export class ChargingPort {
  id: string;
  name: string;
  hubId: string;
  capacity: string; // e.g., "Fast", "Standard"
  status: PortStatus;
}
