import { Injectable } from '@nestjs/common';
import type {
  ChargerDataProvider,
  EvDataProvider,
  ParkingDataProvider,
} from './data-provider.interfaces.js';
import { Module1EvAdapter } from './module1-ev.adapter.js';
import { Module2ParkingAdapter } from './module2-parking.adapter.js';
import { Module4ChargerAdapter } from './module4-charger.adapter.js';
import { MockChargerDataProvider } from './mock-charger.provider.js';
import { MockParkingDataProvider } from './mock-parking.provider.js';

export interface DataSourceInfo {
  evs: string;
  chargers: string;
  parking: string;
}

@Injectable()
export class MonitoringDataSources {
  private readonly mockChargers = new MockChargerDataProvider();
  private readonly mockParking = new MockParkingDataProvider();

  constructor(
    private readonly module1: Module1EvAdapter,
    private readonly module2: Module2ParkingAdapter,
    private readonly module4: Module4ChargerAdapter,
  ) {}

  get evs(): EvDataProvider {
    return this.module1;
  }

  get chargers(): ChargerDataProvider {
    return this.module4.isConnected() ? this.module4 : this.mockChargers;
  }

  get parking(): ParkingDataProvider {
    return this.module2.isConnected() ? this.module2 : this.mockParking;
  }

  get info(): DataSourceInfo {
    return {
      evs: this.module1.isConnected()
        ? 'Module 1 (SharedEvService.findAll)'
        : 'Không có (chưa tìm thấy SharedEvService)',
      chargers: this.describe(this.module4.getStatus(), 'Module 4'),
      parking: this.describe(this.module2.getStatus(), 'Module 2'),
    };
  }

  private describe(
    s: ReturnType<Module4ChargerAdapter['getStatus']>,
    name: string,
  ): string {
    if (!s.connected) return 'Dữ liệu tạm của Module 3';
    const skipped = s.skipped > 0 ? ` – bỏ qua ${s.skipped} bản ghi lạ` : '';
    return `${name} qua adapter (${s.source})${skipped}`;
  }
}
