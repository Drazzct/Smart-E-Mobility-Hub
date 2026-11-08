import { Injectable } from '@nestjs/common';
import { INITIAL_SHARED_EV_DATA } from '../../mock/shared-ev.mock.js';
import { SharedEV } from './entities/shared-ev.entity.js';
import { MobilityHub } from './entities/mobility-hub.entity.js';
import { Reservation } from './entities/reservation.entity.js';
import { UsageSession } from './entities/usage-session.entity.js';
import { Student } from './entities/student.entity.js';

/** Shape of the mock data object. */
export interface SharedEvDataSet {
  students: Student[];
  hubs: MobilityHub[];
  vehicles: SharedEV[];
  reservations: Reservation[];
  usageSessions: UsageSession[];
}

/**
 * In-memory data store for Module 1.
 * It is seeded from a deep copy of the mock data object, so the mock itself is
 * never mutated and every server restart (or every test) starts from the same state.
 */
@Injectable()
export class SharedEvRepository {
  private data: SharedEvDataSet;

  constructor() {
    this.reset();
  }

  /** Reload the initial mock data (used at start-up and by tests). */
  reset(initial: SharedEvDataSet = INITIAL_SHARED_EV_DATA): void {
    this.data = structuredClone(initial);
  }

  // ---- Students ----
  findStudent(id: string): Student | undefined {
    return this.data.students.find((s) => s.id === id);
  }

  // ---- Hubs ----
  findAllHubs(): MobilityHub[] {
    return this.data.hubs;
  }

  findHub(id: string): MobilityHub | undefined {
    return this.data.hubs.find((h) => h.id === id);
  }

  // ---- Vehicles ----
  findAllVehicles(): SharedEV[] {
    return this.data.vehicles;
  }

  findVehicle(id: string): SharedEV | undefined {
    return this.data.vehicles.find((v) => v.id === id);
  }

  findVehiclesByHub(hubId: string): SharedEV[] {
    return this.data.vehicles.filter((v) => v.hubId === hubId);
  }

  // ---- Reservations ----
  findAllReservations(): Reservation[] {
    return this.data.reservations;
  }

  findReservation(id: string): Reservation | undefined {
    return this.data.reservations.find((r) => r.id === id);
  }

  saveReservation(reservation: Reservation): Reservation {
    this.data.reservations.push(reservation);
    return reservation;
  }

  // ---- Usage sessions ----
  findSession(id: string): UsageSession | undefined {
    return this.data.usageSessions.find((s) => s.id === id);
  }

  findAllSessions(): UsageSession[] {
    return this.data.usageSessions;
  }

  saveSession(session: UsageSession): UsageSession {
    this.data.usageSessions.push(session);
    return session;
  }
}