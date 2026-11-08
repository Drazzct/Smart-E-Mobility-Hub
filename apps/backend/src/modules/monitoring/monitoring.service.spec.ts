import { NotFoundException } from '@nestjs/common';
import { MonitoringService } from './monitoring.service.js';
import { SharedEvService } from '../shared-ev/shared-ev.service.js';
import { EVStatus } from '../shared-ev/entities/shared-ev.entity.js';
import { buildDataSources } from './adapters/fake-nest.test-util.js';

describe('MonitoringService', () => {
  let sharedEv: SharedEvService;
  let monitoring: MonitoringService;

  beforeEach(() => {
    sharedEv = new SharedEvService();
    monitoring = new MonitoringService(buildDataSources({ sharedEv }));
  });

  describe('getImbalance (ngưỡng 70% / 90%)', () => {
    it.each([
      [69, 'normal'],
      [70, 'warning'],
      [89, 'warning'],
      [90, 'critical'],
      [100, 'critical'],
    ])('fillPct %i -> %s', (fill, expected) => {
      expect(monitoring.getImbalance(fill)).toBe(expected);
    });
  });

  describe('getOverview', () => {
    it('tính đúng KPI toàn mạng từ dữ liệu Module 1 + cổng sạc', () => {
      const { totals } = monitoring.getOverview();
      expect(totals.totalEvs).toBe(4);
      expect(totals.available).toBe(3);
      expect(totals.inUse).toBe(0);
      expect(totals.charging).toBe(1);
      expect(totals.totalChargers).toBe(9);
      expect(totals.freeChargers).toBe(6);
      expect(totals.unavailableChargers).toBe(2);
      expect(totals.totalParkingSlots).toBe(15);
      expect(totals.availableParkingSlots).toBe(5);
    });

    it('tính đúng số liệu từng Hub', () => {
      const hubs = monitoring.getOverview().hubs;
      const metro = hubs.find((m) => m.hub.id === 'hub-metro')!;
      const ktxb = hubs.find((m) => m.hub.id === 'hub-ktxb')!;
      expect(metro.available).toBe(1);
      expect(metro.fillPct).toBe(92);
      expect(metro.imbalance).toBe('critical');
      expect(ktxb.fillPct).toBe(80);
      expect(ktxb.imbalance).toBe('warning');
    });

    it('hàng đợi sạc có xe đang sạc kèm mã cổng', () => {
      const queue = monitoring.getOverview().chargingQueue;
      expect(queue).toHaveLength(1);
      expect(queue[0].evCode).toBe('EV-002');
      expect(queue[0].priority).toBe('high');
      expect(queue[0].chargerCode).toBe('CH-001');
    });
  });

  describe('getHubDetail', () => {
    it('trả về xe và cổng sạc của Hub', () => {
      const detail = monitoring.getHubDetail('hub-ktxb');
      expect(detail.evs.map((e) => e.id)).toEqual(['ev-3', 'ev-4']);
      expect(detail.chargers).toHaveLength(3);
      expect(detail.parkingSlots).toHaveLength(4);
      expect(detail.metrics.availableParkingSlots).toBe(1);
    });

    it('ném 404 với Hub không tồn tại', () => {
      expect(() => monitoring.getHubDetail('hub-x')).toThrow(NotFoundException);
    });
  });

  describe('getAlerts', () => {
    it('có cảnh báo cổng sạc hỏng và Hub quá tải, sắp CRITICAL trước', () => {
      const alerts = monitoring.getAlerts();
      const ids = alerts.map((a) => a.id);
      expect(ids).toContain('CHARGER_UNAVAILABLE:ch-6');
      expect(ids).toContain('CHARGER_UNAVAILABLE:ch-9');
      expect(ids).toContain('HUB_OVERLOAD:hub-metro');
      expect(alerts[0].severity).toBe('CRITICAL');
    });

    it('cảnh báo Hub hết chỗ đỗ (dữ liệu từ nguồn chỗ đỗ của Module 2)', () => {
      const ids = monitoring.getAlerts().map((a) => a.id);
      expect(ids).toContain('HUB_PARKING_FULL:hub-service');
      expect(ids).not.toContain('HUB_PARKING_FULL:hub-metro');
    });
  });

  describe('liên kết với Module 1 (shared-ev)', () => {
    it('đặt xe ở Module 1 làm thay đổi số liệu dashboard Module 3', () => {
      vi.useFakeTimers();
      sharedEv.reserveEv('ev-1', 'STU-01');

      const totals = monitoring.getOverview().totals;
      expect(totals.available).toBe(2);
      expect(totals.inUse).toBe(1);

      vi.advanceTimersByTime(30000);
      expect(monitoring.getOverview().totals.available).toBe(3);
      vi.useRealTimers();
    });

    it('Module 3 chỉ đọc: sửa dữ liệu trả về không làm đổi dữ liệu Module 1', () => {
      const detail = monitoring.getHubDetail('hub-metro');
      detail.evs[0].status = EVStatus.MAINTENANCE;
      expect(sharedEv.findAll().find((e) => e.id === 'ev-1')?.status).toBe(
        EVStatus.AVAILABLE,
      );
    });
  });

  describe('Module 4 có backend -> dashboard dùng dữ liệu qua adapter', () => {
    it('cổng sạc của Module 4 (dạng frontend dự đoán) xuất hiện trên dashboard', () => {
      class ChargingService {
        findAllPorts() {
          return [
            {
              id: 'PORT-METRO-04',
              name: 'Fast DC Port 4',
              capacity: '50kW',
              status: 'DISABLED',
            },
          ];
        }
      }
      const m3 = new MonitoringService(
        buildDataSources({ sharedEv, otherServices: [new ChargingService()] }),
      );

      const overview = m3.getOverview();
      expect(overview.totals.totalChargers).toBe(1);
      expect(overview.dataSources.chargers).toBe(
        'Module 4 qua adapter (ChargingService.findAllPorts())',
      );
      expect(m3.getAlerts().map((a) => a.id)).toContain(
        'CHARGER_UNAVAILABLE:PORT-METRO-04',
      );
    });
  });
});
