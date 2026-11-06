import { Injectable, NotFoundException } from '@nestjs/common';
import { SharedEV } from '../shared-ev/entities/shared-ev.entity.js';
import { Hub } from './entities/hub.entity.js';
import {
  Charger,
  ChargerStatus,
  UNAVAILABLE_CHARGER_STATUSES,
} from './entities/charger.entity.js';
import {
  ParkingSlot,
  ParkingSlotStatus,
} from './entities/parking-slot.entity.js';
import { MonitoringDataSources } from './adapters/monitoring-data-sources.js';
import { MONITORING_HUBS } from '../../mock/monitoring.mock.js';
import {
  CRITICAL_BATTERY_THRESHOLD,
  HUB_WARNING_FILL_PCT,
  HUB_CRITICAL_FILL_PCT,
} from './monitoring.constants.js';
import {
  AlertSeverity,
  ChargingQueueItemDto,
  HubDetailDto,
  HubMetricsDto,
  ImbalanceLevel,
  MonitoringAlertDto,
  NetworkOverviewDto,
  NetworkTotalsDto,
} from './dto/monitoring-response.dto.js';

type EvState =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'IN_USE'
  | 'CHARGING'
  | 'WAITING_CHARGING'
  | 'MAINTENANCE';
const hasStatus = (ev: SharedEV, ...states: EvState[]): boolean =>
  states.includes(String(ev.status) as EvState);

interface NetworkSnapshot {
  evs: SharedEV[];
  chargers: Charger[];
  slots: ParkingSlot[];
}

@Injectable()
export class MonitoringService {
  private readonly hubs: Hub[] = MONITORING_HUBS.map((h) => ({ ...h }));

  constructor(private readonly sources: MonitoringDataSources) {}

  getOverview(): NetworkOverviewDto {
    const snap = this.takeSnapshot();
    const { evs, chargers, slots } = snap;
    const hubs = this.hubs.map((hub) => this.buildHubMetrics(hub, snap));

    const totals: NetworkTotalsDto = {
      totalEvs: evs.length,
      available: evs.filter((e) => hasStatus(e, 'AVAILABLE')).length,
      inUse: evs.filter((e) => hasStatus(e, 'IN_USE', 'RESERVED')).length,
      charging: evs.filter((e) => hasStatus(e, 'CHARGING')).length,
      waitingForCharging: evs.filter((e) => hasStatus(e, 'WAITING_CHARGING'))
        .length,
      maintenance: evs.filter((e) => hasStatus(e, 'MAINTENANCE')).length,
      totalChargers: chargers.length,
      freeChargers: chargers.filter((c) => c.status === ChargerStatus.FREE)
        .length,
      unavailableChargers: chargers.filter((c) =>
        UNAVAILABLE_CHARGER_STATUSES.includes(c.status),
      ).length,
      totalParkingSlots: slots.length,
      availableParkingSlots: slots.filter(
        (s) => s.status === ParkingSlotStatus.AVAILABLE,
      ).length,
      hubsNeedingAttention: hubs.filter(
        (m) => m.imbalance !== 'normal' || m.parkingFull,
      ).length,
    };

    return {
      generatedAt: new Date().toISOString(),
      dataSources: this.sources.info,
      totals,
      hubs,
      chargingQueue: this.buildChargingQueue(evs, chargers),
    };
  }

  getHubDetail(hubId: string): HubDetailDto {
    const hub = this.hubs.find((h) => h.id === hubId);
    if (!hub) throw new NotFoundException(`Không tìm thấy Hub ${hubId}`);

    const snap: NetworkSnapshot = {
      evs: this.sources.evs.getEvs(hubId),
      chargers: this.sources.chargers.getChargers(hubId),
      slots: this.sources.parking.getParkingSlots(hubId),
    };
    return {
      metrics: this.buildHubMetrics(hub, snap),
      evs: snap.evs,
      chargers: snap.chargers,
      parkingSlots: snap.slots,
    };
  }

  getChargingQueue(): ChargingQueueItemDto[] {
    return this.buildChargingQueue(
      this.getEvs(),
      this.sources.chargers.getChargers(),
    );
  }

  getAlerts(): MonitoringAlertDto[] {
    const snap = this.takeSnapshot();
    const alerts: MonitoringAlertDto[] = [];

    for (const hub of this.hubs) {
      const m = this.buildHubMetrics(hub, snap);
      if (m.imbalance !== 'normal') {
        alerts.push({
          id: `HUB_OVERLOAD:${hub.id}`,
          type: 'HUB_OVERLOAD',
          severity: m.imbalance === 'critical' ? 'CRITICAL' : 'WARNING',
          hubId: hub.id,
          message: `${hub.name} chỉ còn ${m.available}/${hub.evCapacity} xe rảnh (lấp đầy ${m.fillPct}%).`,
        });
      }
      if (m.parkingFull) {
        alerts.push({
          id: `HUB_PARKING_FULL:${hub.id}`,
          type: 'HUB_PARKING_FULL',
          severity: 'CRITICAL',
          hubId: hub.id,
          message: `${hub.name} đã hết chỗ đỗ (0/${m.totalParkingSlots} chỗ trống).`,
        });
      }
    }

    for (const c of snap.chargers) {
      if (UNAVAILABLE_CHARGER_STATUSES.includes(c.status)) {
        alerts.push({
          id: `CHARGER_UNAVAILABLE:${c.id}`,
          type: 'CHARGER_UNAVAILABLE',
          severity: c.status === ChargerStatus.FAULTY ? 'CRITICAL' : 'WARNING',
          hubId: c.hubId,
          resourceId: c.id,
          message: `Cổng sạc ${c.code} đang ở trạng thái ${c.status}.`,
        });
      }
    }

    for (const ev of snap.evs) {
      if (hasStatus(ev, 'MAINTENANCE')) {
        alerts.push({
          id: `EV_MAINTENANCE:${ev.id}`,
          type: 'EV_MAINTENANCE',
          severity: 'WARNING',
          hubId: ev.hubId,
          resourceId: ev.id,
          message: `Xe ${ev.code} đang bảo trì.`,
        });
      } else if (
        hasStatus(ev, 'AVAILABLE') &&
        ev.batteryLevel < CRITICAL_BATTERY_THRESHOLD
      ) {
        alerts.push({
          id: `EV_LOW_BATTERY:${ev.id}`,
          type: 'EV_LOW_BATTERY',
          severity: 'INFO',
          hubId: ev.hubId,
          resourceId: ev.id,
          message: `Xe ${ev.code} còn ${ev.batteryLevel}% pin nhưng chưa được xếp sạc.`,
        });
      }
    }

    const rank: Record<AlertSeverity, number> = {
      CRITICAL: 0,
      WARNING: 1,
      INFO: 2,
    };
    return alerts.sort((a, b) => rank[a.severity] - rank[b.severity]);
  }

  getImbalance(fillPct: number): ImbalanceLevel {
    if (fillPct >= HUB_CRITICAL_FILL_PCT) return 'critical';
    if (fillPct >= HUB_WARNING_FILL_PCT) return 'warning';
    return 'normal';
  }

  private takeSnapshot(): NetworkSnapshot {
    return {
      evs: this.getEvs(),
      chargers: this.sources.chargers.getChargers(),
      slots: this.sources.parking.getParkingSlots(),
    };
  }

  private getEvs(): SharedEV[] {
    return this.sources.evs.getEvs();
  }

  private buildHubMetrics(hub: Hub, snap: NetworkSnapshot): HubMetricsDto {
    const evs = snap.evs.filter((e) => e.hubId === hub.id);
    const chargers = snap.chargers.filter((c) => c.hubId === hub.id);
    const slots = snap.slots.filter((s) => s.hubId === hub.id);

    const available = evs.filter((e) => hasStatus(e, 'AVAILABLE')).length;
    const fillPct =
      hub.evCapacity > 0
        ? Math.round(
            Math.min(
              100,
              ((hub.evCapacity - available) / hub.evCapacity) * 100,
            ),
          )
        : 100;
    const availableParkingSlots = slots.filter(
      (s) => s.status === ParkingSlotStatus.AVAILABLE,
    ).length;

    return {
      hub: { ...hub },
      totalEvs: evs.length,
      available,
      inUse: evs.filter((e) => hasStatus(e, 'IN_USE', 'RESERVED')).length,
      charging: evs.filter((e) => hasStatus(e, 'CHARGING', 'WAITING_CHARGING'))
        .length,
      maintenance: evs.filter((e) => hasStatus(e, 'MAINTENANCE')).length,
      fillPct,
      totalChargers: chargers.length,
      freeChargers: chargers.filter((c) => c.status === ChargerStatus.FREE)
        .length,
      faultyChargers: chargers.filter((c) =>
        UNAVAILABLE_CHARGER_STATUSES.includes(c.status),
      ).length,
      totalParkingSlots: slots.length,
      availableParkingSlots,
      parkingFull: slots.length > 0 && availableParkingSlots === 0,
      imbalance: this.getImbalance(fillPct),
    };
  }

  private buildChargingQueue(
    evs: SharedEV[],
    chargers: Charger[],
  ): ChargingQueueItemDto[] {
    const items: ChargingQueueItemDto[] = evs
      .filter((e) => hasStatus(e, 'CHARGING', 'WAITING_CHARGING'))
      .map((e) => ({
        evId: e.id,
        evCode: e.code,
        hubId: e.hubId,
        batteryLevel: e.batteryLevel,
        state: hasStatus(e, 'CHARGING') ? 'charging' : 'waiting',
        priority:
          e.batteryLevel < CRITICAL_BATTERY_THRESHOLD ? 'high' : 'normal',
        chargerCode: chargers.find((c) => c.currentEV === e.code)?.code,
      }));

    return items.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === 'high' ? -1 : 1;
      if (a.state !== b.state) return a.state === 'charging' ? -1 : 1;
      return a.batteryLevel - b.batteryLevel;
    });
  }
}
