import { apiClient } from "./client";

export type EVStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "IN_USE"
  | "CHARGING"
  | "WAITING_CHARGING"
  | "MAINTENANCE";
export type ChargerStatus = "FREE" | "BUSY" | "FAULTY" | "MAINTENANCE" | "OUT_OF_SERVICE";
export type ParkingSlotStatus = "AVAILABLE" | "RESERVED" | "OCCUPIED" | "MAINTENANCE";
export type ImbalanceLevel = "normal" | "warning" | "critical";
export type AlertSeverity = "CRITICAL" | "WARNING" | "INFO";
export type AlertType =
  | "HUB_OVERLOAD"
  | "HUB_PARKING_FULL"
  | "CHARGER_UNAVAILABLE"
  | "EV_MAINTENANCE"
  | "EV_LOW_BATTERY";

export interface Hub {
  id: string;
  name: string;
  area: string;
  evCapacity: number;
}

export interface SharedEV {
  id: string;
  code: string;
  hubId: string;
  batteryLevel: number;
  status: EVStatus;
  rangeKm?: number;
}

export interface Charger {
  id: string;
  code: string;
  hubId: string;
  status: ChargerStatus;
  powerKw: number;
  currentEV?: string | null;
}

export interface ParkingSlot {
  id: string;
  code: string;
  hubId: string;
  status: ParkingSlotStatus;
}

export interface HubMetrics {
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

export interface ChargingQueueItem {
  evId: string;
  evCode: string;
  hubId: string;
  batteryLevel: number;
  state: "charging" | "waiting";
  priority: "high" | "normal";
  chargerCode?: string;
}

export interface NetworkTotals {
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

export interface DataSourceInfo {
  evs: string;
  chargers: string;
  parking: string;
}

export interface NetworkOverview {
  generatedAt: string;
  dataSources: DataSourceInfo;
  totals: NetworkTotals;
  hubs: HubMetrics[];
  chargingQueue: ChargingQueueItem[];
}

export interface HubDetail {
  metrics: HubMetrics;
  evs: SharedEV[];
  chargers: Charger[];
  parkingSlots: ParkingSlot[];
}

export interface MonitoringAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  hubId: string;
  resourceId?: string;
  message: string;
}

const REQUEST_TIMEOUT_MS = 4000;

export const monitoringApi = {
  async getOverview(): Promise<NetworkOverview> {
    const res = await apiClient.get<NetworkOverview>("/monitoring/overview", {
      timeout: REQUEST_TIMEOUT_MS,
    });
    return res.data;
  },

  async getAlerts(): Promise<MonitoringAlert[]> {
    const res = await apiClient.get<MonitoringAlert[]>("/monitoring/alerts", {
      timeout: REQUEST_TIMEOUT_MS,
    });
    return res.data;
  },

  async getHubDetail(hubId: string): Promise<HubDetail> {
    const res = await apiClient.get<HubDetail>(
      `/monitoring/hubs/${encodeURIComponent(hubId)}`,
      { timeout: REQUEST_TIMEOUT_MS },
    );
    return res.data;
  },
};
