import { Charger } from '../entities/charger.entity.js';
import { ParkingSlot } from '../entities/parking-slot.entity.js';
import { SharedEV } from '../../shared-ev/entities/shared-ev.entity.js';

export interface EvDataProvider {
  getEvs(hubId?: string): SharedEV[];
}

export interface ChargerDataProvider {
  getChargers(hubId?: string): Charger[];
}

export interface ParkingDataProvider {
  getParkingSlots(hubId?: string): ParkingSlot[];
}
