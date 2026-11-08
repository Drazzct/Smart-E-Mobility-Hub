export interface SourceCandidate {
  className: string;
  method: string;
}

export const MODULE2_PARKING_SOURCES: SourceCandidate[] = [
  { className: 'ParkingService', method: 'findAllSlots' },
  { className: 'ParkingService', method: 'findAll' },
  { className: 'ParkingService', method: 'getSlots' },
  { className: 'ParkingSlotService', method: 'findAll' },
  { className: 'PersonalEvParkingService', method: 'findAllSlots' },
  { className: 'PersonalEvService', method: 'findAllSlots' },
];

export const MODULE4_CHARGER_SOURCES: SourceCandidate[] = [
  { className: 'ChargingService', method: 'findAllPorts' },
  { className: 'ChargingService', method: 'getPorts' },
  { className: 'SmartChargingService', method: 'findAllPorts' },
  { className: 'SmartChargingService', method: 'getPorts' },
  { className: 'ChargingPortService', method: 'findAll' },
  { className: 'ChargingPortsService', method: 'findAll' },
];
