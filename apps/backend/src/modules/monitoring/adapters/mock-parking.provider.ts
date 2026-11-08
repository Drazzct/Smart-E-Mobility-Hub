import { Injectable } from '@nestjs/common';
import { ParkingSlot } from '../entities/parking-slot.entity.js';
import { ParkingDataProvider } from './data-provider.interfaces.js';
import { INITIAL_PARKING_SLOTS } from '../../../mock/monitoring.mock.js';

@Injectable()
export class MockParkingDataProvider implements ParkingDataProvider {
  private readonly slots: ParkingSlot[] = INITIAL_PARKING_SLOTS.map((s) => ({
    ...s,
  }));

  getParkingSlots(hubId?: string): ParkingSlot[] {
    return this.slots
      .filter((s) => !hubId || s.hubId === hubId)
      .map((s) => ({ ...s }));
  }
}
