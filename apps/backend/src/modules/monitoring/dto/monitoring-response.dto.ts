import { Hub } from '../entities/hub.entity.js';
import { Charger } from '../entities/charger.entity.js';
import { ParkingSlot } from '../entities/parking-slot.entity.js';
import { SharedEV } from '../../shared-ev/entities/shared-ev.entity.js';
import { DataSourceInfo } from '../adapters/monitoring-data-sources.js';

export type ImbalanceLevel = 'normal' | 'warning' | 'critical';
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type AlertType =
  | 'HUB_OVERLOAD'
  | 'HUB_PARKING_FULL'
  | 'CHARGER_UNAVAILABLE'
  | 'EV_MAINTENANCE'
  | 'EV_LOW_BATTERY';

export interface HubMetricsDto {
  hub: Hub;
  totalEvs: number;
  available: number;
  inUse: number;
  charging: number;
  maintenance: number;
  fillPct: number;
  totalChargers: number;
  freeChargers: number;
  faultyChargers: number;
  totalParkingSlots: number;
  availableParkingSlots: number;
  parkingFull: boolean;
  imbalance: ImbalanceLevel;
}

export interface ChargingQueueItemDto {
  evId: string;
  evCode: string;
  hubId: string;
  batteryLevel: number;
  state: 'charging' | 'waiting';
  priority: 'high' | 'normal';
  chargerCode?: string;
}

export interface NetworkTotalsDto {
  totalEvs: number;
  available: number;
  inUse: number;
  charging: number;
  waitingForCharging: number;
  maintenance: number;
  totalChargers: number;
  freeChargers: number;
  unavailableChargers: number;
  totalParkingSlots: number;
  availableParkingSlots: number;
  hubsNeedingAttention: number;
}

export interface NetworkOverviewDto {
  generatedAt: string;
  dataSources: DataSourceInfo;
  totals: NetworkTotalsDto;
  hubs: HubMetricsDto[];
  chargingQueue: ChargingQueueItemDto[];
}

export interface HubDetailDto {
  metrics: HubMetricsDto;
  evs: SharedEV[];
  chargers: Charger[];
  parkingSlots: ParkingSlot[];
}

export interface MonitoringAlertDto {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  hubId: string;
  resourceId?: string;
  message: string;
}
