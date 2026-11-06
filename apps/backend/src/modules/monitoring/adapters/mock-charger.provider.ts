import { Injectable } from '@nestjs/common';
import { Charger } from '../entities/charger.entity.js';
import { ChargerDataProvider } from './data-provider.interfaces.js';
import { INITIAL_CHARGERS } from '../../../mock/monitoring.mock.js';

@Injectable()
export class MockChargerDataProvider implements ChargerDataProvider {
  private readonly chargers: Charger[] = INITIAL_CHARGERS.map((c) => ({
    ...c,
  }));

  getChargers(hubId?: string): Charger[] {
    return this.chargers
      .filter((c) => !hubId || c.hubId === hubId)
      .map((c) => ({ ...c }));
  }
}
