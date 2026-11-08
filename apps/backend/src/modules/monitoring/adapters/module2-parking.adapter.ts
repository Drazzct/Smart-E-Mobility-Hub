import { Injectable } from '@nestjs/common';
import {
  ParkingSlot,
  ParkingSlotStatus,
} from '../entities/parking-slot.entity.js';
import { ParkingDataProvider } from './data-provider.interfaces.js';
import { MODULE2_PARKING_SOURCES } from './adapter-sources.config.js';
import { SourceLocator } from './source-locator.js';
import {
  MapResult,
  SourceAdapterBase,
  pick,
  statusKey,
} from './source-adapter.base.js';
import { hubIdFromResourceId, normalizeHubId } from './hub-id.normalizer.js';

const STATUS_MAP: Record<string, ParkingSlotStatus> = {
  available: ParkingSlotStatus.AVAILABLE,
  free: ParkingSlotStatus.AVAILABLE,
  empty: ParkingSlotStatus.AVAILABLE,
  reserved: ParkingSlotStatus.RESERVED,
  booked: ParkingSlotStatus.RESERVED,
  occupied: ParkingSlotStatus.OCCUPIED,
  in_use: ParkingSlotStatus.OCCUPIED,
  parked: ParkingSlotStatus.OCCUPIED,
  checked_in: ParkingSlotStatus.OCCUPIED,
  maintenance: ParkingSlotStatus.MAINTENANCE,
  faulty: ParkingSlotStatus.MAINTENANCE,
  disabled: ParkingSlotStatus.MAINTENANCE,
  out_of_service: ParkingSlotStatus.MAINTENANCE,
};

@Injectable()
export class Module2ParkingAdapter
  extends SourceAdapterBase<ParkingSlot>
  implements ParkingDataProvider
{
  protected readonly label = 'Module 2 – chỗ đỗ';
  protected readonly candidates = MODULE2_PARKING_SOURCES;

  constructor(locator: SourceLocator) {
    super(locator);
  }

  getParkingSlots(hubId?: string): ParkingSlot[] {
    return this.readAll().filter((s) => !hubId || s.hubId === hubId);
  }

  protected map(raw: Record<string, unknown>): MapResult<ParkingSlot> {
    const id = pick(raw, 'id', 'slotId', 'code');
    if (typeof id !== 'string' || !id) {
      return { ok: false, reason: 'Chỗ đỗ thiếu id' };
    }

    const hubId =
      normalizeHubId(pick(raw, 'hubId', 'hub', 'hubCode')) ??
      hubIdFromResourceId(id);
    if (!hubId) {
      return { ok: false, reason: `Không xác định được Hub của chỗ đỗ ${id}` };
    }

    const rawStatus = pick(raw, 'status', 'state');
    const status = STATUS_MAP[statusKey(rawStatus) ?? ''];
    if (!status) {
      return {
        ok: false,
        reason: `Trạng thái chỗ đỗ không nhận ra: ${String(rawStatus)}`,
      };
    }

    return {
      ok: true,
      value: {
        id,
        code: String(pick(raw, 'code', 'name') ?? id),
        hubId,
        status,
      },
    };
  }
}
