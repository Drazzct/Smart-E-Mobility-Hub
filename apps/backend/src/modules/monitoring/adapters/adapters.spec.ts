import { SourceLocator } from './source-locator.js';
import { Module2ParkingAdapter } from './module2-parking.adapter.js';
import {
  Module4ChargerAdapter,
  parsePowerKw,
} from './module4-charger.adapter.js';
import { Module1EvAdapter } from './module1-ev.adapter.js';
import { hubIdFromResourceId, normalizeHubId } from './hub-id.normalizer.js';
import {
  buildDataSources,
  fakeDiscovery,
  fakeModuleRef,
} from './fake-nest.test-util.js';
import { MockChargerDataProvider } from './mock-charger.provider.js';
import { MockParkingDataProvider } from './mock-parking.provider.js';
import { SharedEvService } from '../../shared-ev/shared-ev.service.js';
import { ChargerStatus } from '../entities/charger.entity.js';
import { ParkingSlotStatus } from '../entities/parking-slot.entity.js';

const MODULE2_FRONTEND_SLOTS = [
  {
    id: 'SLOT-A01',
    name: 'A01',
    hubId: 'HUB-METRO',
    type: 'Motorbike',
    status: 'Available',
  },
  {
    id: 'SLOT-A02',
    name: 'A02',
    hubId: 'HUB-METRO',
    type: 'Motorbike',
    status: 'Available',
  },
  {
    id: 'SLOT-A03',
    name: 'A03',
    hubId: 'HUB-METRO',
    type: 'Motorbike',
    status: 'Reserved',
  },
  {
    id: 'SLOT-B01',
    name: 'B01',
    hubId: 'HUB-METRO',
    type: 'Car',
    status: 'Occupied',
  },
  {
    id: 'SLOT-C01',
    name: 'C01',
    hubId: 'HUB-DORM',
    type: 'Motorbike',
    status: 'Available',
  },
];
const MODULE4_FRONTEND_PORTS = [
  {
    id: 'PORT-METRO-01',
    name: 'Fast DC Port 1',
    capacity: '50kW',
    status: 'IN_USE',
  },
  {
    id: 'PORT-METRO-02',
    name: 'Standard Port 2',
    capacity: '11kW',
    status: 'AVAILABLE',
  },
  {
    id: 'PORT-METRO-04',
    name: 'Fast DC Port 4',
    capacity: '50kW',
    status: 'DISABLED',
  },
  {
    id: 'PORT-DORM-02',
    name: 'Standard Port 2',
    capacity: '11kW',
    status: 'IN_USE',
  },
  {
    id: 'PORT-CAMPUS-03',
    name: 'Standard Port 3',
    capacity: '11kW',
    status: 'IN_USE',
  },
];

class ParkingService {
  constructor(private readonly slots: unknown) {}
  findAll() {
    return this.slots;
  }
}
class ChargingService {
  constructor(private readonly ports: unknown) {}
  findAllPorts() {
    return this.ports;
  }
}

const locatorWith = (...services: object[]) =>
  new SourceLocator(fakeDiscovery(services));

describe('hub-id.normalizer', () => {
  it.each([
    ['hub-metro', 'hub-metro'],
    ['HUB-METRO', 'hub-metro'],
    ['HUB-DORM', 'hub-ktxb'],
    ['hub_campus', 'hub-campus'],
    ['HUB-SERVICE', 'hub-service'],
    ['KTXB', 'hub-ktxb'],
  ])('normalizeHubId(%s) -> %s', (raw, expected) => {
    expect(normalizeHubId(raw)).toBe(expected);
  });

  it('không nhận ra -> undefined', () => {
    expect(normalizeHubId('HUB-MARS')).toBe(undefined);
    expect(normalizeHubId(42)).toBe(undefined);
  });

  it('suy ra Hub từ ID tài nguyên', () => {
    expect(hubIdFromResourceId('PORT-METRO-01')).toBe('hub-metro');
    expect(hubIdFromResourceId('PORT-DORM-02')).toBe('hub-ktxb');
    expect(hubIdFromResourceId('SLOT-A01')).toBe(undefined);
  });
});

describe('Module2ParkingAdapter (dữ liệu dự đoán từ frontend Module 2)', () => {
  it('đọc và chuyển đổi đúng toàn bộ chỗ đỗ', () => {
    const adapter = new Module2ParkingAdapter(
      locatorWith(new ParkingService(MODULE2_FRONTEND_SLOTS)),
    );
    const slots = adapter.getParkingSlots();
    expect(slots).toHaveLength(5);
    expect(slots[0]).toEqual({
      id: 'SLOT-A01',
      code: 'A01',
      hubId: 'hub-metro',
      status: ParkingSlotStatus.AVAILABLE,
    });
    expect(slots[4].hubId).toBe('hub-ktxb');
    expect(slots.map((s) => s.status)).toEqual([
      ParkingSlotStatus.AVAILABLE,
      ParkingSlotStatus.AVAILABLE,
      ParkingSlotStatus.RESERVED,
      ParkingSlotStatus.OCCUPIED,
      ParkingSlotStatus.AVAILABLE,
    ]);
    expect(adapter.getStatus()).toEqual({
      connected: true,
      source: 'ParkingService.findAll()',
      skipped: 0,
      lastIssue: undefined,
    });
  });

  it('lọc theo Hub sau khi chuẩn hóa', () => {
    const adapter = new Module2ParkingAdapter(
      locatorWith(new ParkingService(MODULE2_FRONTEND_SLOTS)),
    );
    expect(adapter.getParkingSlots('hub-metro')).toHaveLength(4);
  });

  it('bản ghi lạ bị bỏ qua và được đếm, không làm hỏng các bản ghi khác', () => {
    const adapter = new Module2ParkingAdapter(
      locatorWith(
        new ParkingService([
          ...MODULE2_FRONTEND_SLOTS,
          { id: 'SLOT-X', hubId: 'HUB-MARS', status: 'Available' },
          { id: 'SLOT-Y', hubId: 'HUB-METRO', status: 'Teleporting' },
        ]),
      ),
    );
    expect(adapter.getParkingSlots()).toHaveLength(5);
    expect(adapter.getStatus().skipped).toBe(2);
  });

  it('chấp nhận dữ liệu bọc dạng { data: [...] }', () => {
    const adapter = new Module2ParkingAdapter(
      locatorWith(new ParkingService({ data: MODULE2_FRONTEND_SLOTS })),
    );
    expect(adapter.getParkingSlots()).toHaveLength(5);
  });

  it('không tìm thấy service Module 2 -> chưa kết nối', () => {
    const adapter = new Module2ParkingAdapter(locatorWith());
    expect(adapter.isConnected()).toBe(false);
    expect(adapter.getParkingSlots()).toEqual([]);
  });
});

describe('Module4ChargerAdapter (dữ liệu dự đoán từ frontend Module 4)', () => {
  it('đọc và chuyển đổi đúng toàn bộ cổng sạc', () => {
    const adapter = new Module4ChargerAdapter(
      locatorWith(new ChargingService(MODULE4_FRONTEND_PORTS)),
    );
    const chargers = adapter.getChargers();
    expect(chargers).toHaveLength(5);
    expect(chargers[0]).toEqual({
      id: 'PORT-METRO-01',
      code: 'PORT-METRO-01',
      hubId: 'hub-metro',
      status: ChargerStatus.BUSY,
      powerKw: 50,
      currentEV: null,
    });
    expect(chargers[2].status).toBe(ChargerStatus.OUT_OF_SERVICE);
    expect(chargers.map((c) => c.hubId)).toEqual([
      'hub-metro',
      'hub-metro',
      'hub-metro',
      'hub-ktxb',
      'hub-campus',
    ]);
  });

  it('dùng hubId và currentEV nếu backend có các trường này', () => {
    const adapter = new Module4ChargerAdapter(
      locatorWith(
        new ChargingService([
          {
            id: 'ch-1',
            code: 'CH-001',
            hubId: 'HUB-SERVICE',
            status: 'Charging',
            powerKw: 7,
            currentEV: 'EV-002',
          },
        ]),
      ),
    );
    expect(adapter.getChargers()[0]).toEqual({
      id: 'ch-1',
      code: 'CH-001',
      hubId: 'hub-service',
      status: ChargerStatus.BUSY,
      powerKw: 7,
      currentEV: 'EV-002',
    });
  });

  it('service nguồn ném lỗi -> trả mảng rỗng, ghi nhận lỗi', () => {
    class BrokenCharging {
      findAllPorts(): never {
        throw new Error('db down');
      }
    }
    Object.defineProperty(BrokenCharging, 'name', { value: 'ChargingService' });
    const adapter = new Module4ChargerAdapter(
      locatorWith(new BrokenCharging()),
    );
    expect(adapter.getChargers()).toEqual([]);
    expect(String(adapter.getStatus().lastIssue)).toContain('db down');
  });

  it.each([
    [50, 50],
    ['50kW', 50],
    ['7.4 kW', 7.4],
    [undefined, 0],
  ])('parsePowerKw(%s) -> %s', (raw, expected) => {
    expect(parsePowerKw(raw)).toBe(expected);
  });
});

describe('SourceLocator', () => {
  it('chọn ứng viên đầu tiên khớp cả tên class lẫn tên hàm', () => {
    class SmartChargingService {
      getPorts() {
        return [];
      }
    }
    const found = locatorWith(new SmartChargingService()).find([
      { className: 'ChargingService', method: 'findAllPorts' },
      { className: 'SmartChargingService', method: 'findAllPorts' },
      { className: 'SmartChargingService', method: 'getPorts' },
    ]);
    expect(found?.className).toBe('SmartChargingService');
    expect(found?.method).toBe('getPorts');
  });

  it('không có ứng viên khớp -> undefined', () => {
    expect(
      locatorWith(new ParkingService([])).find([
        { className: 'ParkingService', method: 'deleteAll' },
      ]),
    ).toBe(undefined);
  });
});

describe('Module1EvAdapter', () => {
  it('đọc xe từ SharedEvService bằng strict: false và trả bản sao', () => {
    const calls: { token: unknown; strict?: boolean }[] = [];
    const sharedEv = new SharedEvService();
    const adapter = new Module1EvAdapter(
      fakeModuleRef([[SharedEvService, sharedEv]], calls),
    );
    const metro = adapter.getEvs('hub-metro');
    expect(metro.map((e) => e.id)).toEqual(['ev-1', 'ev-2']);
    metro[0].batteryLevel = 0;
    expect(sharedEv.findAll()[0].batteryLevel).toBe(85);
    expect(calls[0].strict).toBe(false);
  });

  it('chưa có Module 1 -> danh sách rỗng', () => {
    const adapter = new Module1EvAdapter(fakeModuleRef([]));
    expect(adapter.isConnected()).toBe(false);
    expect(adapter.getEvs()).toEqual([]);
  });
});

describe('MonitoringDataSources', () => {
  it('chưa có Module 2/4 -> dùng dữ liệu tạm của Module 3', () => {
    const sources = buildDataSources({ sharedEv: new SharedEvService() });
    expect(sources.chargers instanceof MockChargerDataProvider).toBe(true);
    expect(sources.parking instanceof MockParkingDataProvider).toBe(true);
    expect(sources.info).toEqual({
      evs: 'Module 1 (SharedEvService.findAll)',
      chargers: 'Dữ liệu tạm của Module 3',
      parking: 'Dữ liệu tạm của Module 3',
    });
  });

  it('Module 2/4 có backend -> tự chuyển sang adapter, báo số bản ghi bị bỏ qua', () => {
    const sources = buildDataSources({
      sharedEv: new SharedEvService(),
      otherServices: [
        new ParkingService([
          ...MODULE2_FRONTEND_SLOTS,
          { id: 'bad', status: '???' },
        ]),
        new ChargingService(MODULE4_FRONTEND_PORTS),
      ],
    });
    expect(sources.parking.getParkingSlots()).toHaveLength(5);
    expect(sources.chargers.getChargers()).toHaveLength(5);
    expect(sources.info.parking).toBe(
      'Module 2 qua adapter (ParkingService.findAll()) – bỏ qua 1 bản ghi lạ',
    );
    expect(sources.info.chargers).toBe(
      'Module 4 qua adapter (ChargingService.findAllPorts())',
    );
  });

  it('dữ liệu tạm của Module 3 hợp lệ (Hub đúng, trạng thái đúng, id không trùng)', () => {
    const chargers = new MockChargerDataProvider().getChargers();
    const slots = new MockParkingDataProvider().getParkingSlots();
    for (const c of chargers) {
      expect(normalizeHubId(c.hubId)).toBe(c.hubId);
      expect(Object.values(ChargerStatus)).toContain(c.status);
    }
    for (const s of slots) {
      expect(normalizeHubId(s.hubId)).toBe(s.hubId);
      expect(Object.values(ParkingSlotStatus)).toContain(s.status);
    }
    expect(new Set(chargers.map((c) => c.id)).size).toBe(chargers.length);
    expect(new Set(slots.map((s) => s.id)).size).toBe(slots.length);
  });
});
