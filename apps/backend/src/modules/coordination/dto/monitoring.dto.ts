import { Hub } from '../entities/hub.entity.js';
import { Vehicle } from '../entities/vehicle.entity.js';

export class HubStatusDto {
  id: string;
  name: string;
  totalCapacity: number;
  availableCount: number;
  reservedCount: number;
  inUseCount: number;
  chargingCount: number;
  demandLevel: string;
  surplusVehicles: number;
  deficitVehicles: number;
}

export class ResourceDemandDto {
  hubId: string;
  hubName: string;
  currentAvailable: number;
  expectedDemand: number;
  demandLevel: string;
  surplus: number;
  deficit: number;
  recommendedAction: string;
}

export class VehicleDto {
  id: string;
  code: string;
  name: string;
  type: string;
  hubId: string;
  batteryLevel: number;
  status: string;
  rangeKm: number;
  eligible: boolean;
}

export class GetHubsResponseDto {
  hubs: HubStatusDto[];
  totalHubs: number;
}

export class GetVehiclesResponseDto {
  vehicles: VehicleDto[];
  totalVehicles: number;
}

export class GetResourceDemandResponseDto {
  demands: ResourceDemandDto[];
  hupsWithDeficit: string[];
  hubsWithSurplus: string[];
}
