import { Injectable } from '@nestjs/common';
import { Charger, ChargerStatus } from '../entities/charger.entity.js';
import { ChargerDataProvider } from './data-provider.interfaces.js';
import { MODULE4_CHARGER_SOURCES } from './adapter-sources.config.js';
import { SourceLocator } from './source-locator.js';
import {
  MapResult,
  SourceAdapterBase,
  pick,
  statusKey,
} from './source-adapter.base.js';
import { hubIdFromResourceId, normalizeHubId } from './hub-id.normalizer.js';

const STATUS_MAP: Record<string, ChargerStatus> = {
  available: ChargerStatus.FREE,
  free: ChargerStatus.FREE,
  idle: ChargerStatus.FREE,
  ready: ChargerStatus.FREE,
  active: ChargerStatus.FREE,
  in_use: ChargerStatus.BUSY,
  busy: ChargerStatus.BUSY,
  charging: ChargerStatus.BUSY,
  occupied: ChargerStatus.BUSY,
  booked: ChargerStatus.BUSY,
  faulty: ChargerStatus.FAULTY,
  fault: ChargerStatus.FAULTY,
  error: ChargerStatus.FAULTY,
  maintenance: ChargerStatus.MAINTENANCE,
  disabled: ChargerStatus.OUT_OF_SERVICE,
  out_of_service: ChargerStatus.OUT_OF_SERVICE,
  offline: ChargerStatus.OUT_OF_SERVICE,
};

@Injectable()
export class Module4ChargerAdapter
  extends SourceAdapterBase<Charger>
  implements ChargerDataProvider
{
  protected readonly label = 'Module 4 – cổng sạc';
  protected readonly candidates = MODULE4_CHARGER_SOURCES;

  constructor(locator: SourceLocator) {
    super(locator);
  }

  getChargers(hubId?: string): Charger[] {
    return this.readAll().filter((c) => !hubId || c.hubId === hubId);
  }

  protected map(raw: Record<string, unknown>): MapResult<Charger> {
    const id = pick(raw, 'id', 'portId', 'chargerId', 'code');
    if (typeof id !== 'string' || !id) {
      return { ok: false, reason: 'Cổng sạc thiếu id' };
    }

    const hubId =
      normalizeHubId(pick(raw, 'hubId', 'hub', 'hubCode')) ??
      hubIdFromResourceId(id);
    if (!hubId) {
      return { ok: false, reason: `Không xác định được Hub của cổng ${id}` };
    }

    const rawStatus = pick(raw, 'status', 'state');
    const status = STATUS_MAP[statusKey(rawStatus) ?? ''];
    if (!status) {
      return {
        ok: false,
        reason: `Trạng thái cổng sạc không nhận ra: ${String(rawStatus)}`,
      };
    }

    const currentEV = pick(
      raw,
      'currentEV',
      'currentEv',
      'currentVehicle',
      'vehicleCode',
      'vehicleId',
    );

    return {
      ok: true,
      value: {
        id,
        code: String(pick(raw, 'code') ?? id),
        hubId,
        status,
        powerKw: parsePowerKw(
          pick(raw, 'powerKw', 'power', 'capacityKw', 'capacity'),
        ),
        currentEV:
          status === ChargerStatus.BUSY && typeof currentEV === 'string'
            ? currentEV
            : null,
      },
    };
  }
}

export function parsePowerKw(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const m = raw.match(/(\d+(?:\.\d+)?)/);
    if (m) return Number(m[1]);
  }
  return 0;
}
