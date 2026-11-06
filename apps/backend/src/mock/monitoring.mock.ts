import { Hub } from '../modules/monitoring/entities/hub.entity.js';
import {
  Charger,
  ChargerStatus,
} from '../modules/monitoring/entities/charger.entity.js';
import {
  ParkingSlot,
  ParkingSlotStatus,
} from '../modules/monitoring/entities/parking-slot.entity.js';

export const MONITORING_HUBS: Hub[] = [
  { id: 'hub-metro', name: 'Ga Metro', area: 'Metro Line 1', evCapacity: 12 },
  { id: 'hub-ktxb', name: 'KTX B', area: 'Ký túc xá B', evCapacity: 10 },
  {
    id: 'hub-campus',
    name: 'Khu học chính',
    area: 'Trường Đại học',
    evCapacity: 8,
  },
  {
    id: 'hub-service',
    name: 'Khu dịch vụ',
    area: 'Trung tâm dịch vụ',
    evCapacity: 6,
  },
];

export const MONITORING_HUB_IDS: string[] = MONITORING_HUBS.map((h) => h.id);

export const INITIAL_CHARGERS: Charger[] = [
  {
    id: 'ch-1',
    code: 'CH-001',
    hubId: 'hub-metro',
    status: ChargerStatus.BUSY,
    powerKw: 7,
    currentEV: 'EV-002',
  },
  {
    id: 'ch-2',
    code: 'CH-002',
    hubId: 'hub-metro',
    status: ChargerStatus.FREE,
    powerKw: 7,
  },
  {
    id: 'ch-3',
    code: 'CH-003',
    hubId: 'hub-metro',
    status: ChargerStatus.FREE,
    powerKw: 7,
  },
  {
    id: 'ch-4',
    code: 'CH-004',
    hubId: 'hub-ktxb',
    status: ChargerStatus.FREE,
    powerKw: 7,
  },
  {
    id: 'ch-5',
    code: 'CH-005',
    hubId: 'hub-ktxb',
    status: ChargerStatus.FREE,
    powerKw: 7,
  },
  {
    id: 'ch-6',
    code: 'CH-006',
    hubId: 'hub-ktxb',
    status: ChargerStatus.FAULTY,
    powerKw: 7,
  },
  {
    id: 'ch-7',
    code: 'CH-007',
    hubId: 'hub-campus',
    status: ChargerStatus.FREE,
    powerKw: 7,
  },
  {
    id: 'ch-8',
    code: 'CH-008',
    hubId: 'hub-campus',
    status: ChargerStatus.FREE,
    powerKw: 7,
  },
  {
    id: 'ch-9',
    code: 'CH-009',
    hubId: 'hub-service',
    status: ChargerStatus.MAINTENANCE,
    powerKw: 7,
  },
];

const slot = (
  id: string,
  hubId: string,
  status: ParkingSlotStatus,
): ParkingSlot => ({ id, code: id.toUpperCase(), hubId, status });

export const INITIAL_PARKING_SLOTS: ParkingSlot[] = [
  slot('a01', 'hub-metro', ParkingSlotStatus.AVAILABLE),
  slot('a02', 'hub-metro', ParkingSlotStatus.AVAILABLE),
  slot('a03', 'hub-metro', ParkingSlotStatus.RESERVED),
  slot('a04', 'hub-metro', ParkingSlotStatus.OCCUPIED),
  slot('a05', 'hub-metro', ParkingSlotStatus.OCCUPIED),
  slot('a06', 'hub-metro', ParkingSlotStatus.MAINTENANCE),
  slot('b01', 'hub-ktxb', ParkingSlotStatus.AVAILABLE),
  slot('b02', 'hub-ktxb', ParkingSlotStatus.OCCUPIED),
  slot('b03', 'hub-ktxb', ParkingSlotStatus.OCCUPIED),
  slot('b04', 'hub-ktxb', ParkingSlotStatus.RESERVED),
  slot('c01', 'hub-campus', ParkingSlotStatus.AVAILABLE),
  slot('c02', 'hub-campus', ParkingSlotStatus.AVAILABLE),
  slot('c03', 'hub-campus', ParkingSlotStatus.OCCUPIED),
  slot('d01', 'hub-service', ParkingSlotStatus.OCCUPIED),
  slot('d02', 'hub-service', ParkingSlotStatus.RESERVED),
];
