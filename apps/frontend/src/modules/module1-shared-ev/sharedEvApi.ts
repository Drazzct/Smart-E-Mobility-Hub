import axios from "axios";
import { apiClient } from "../../api/client";

// ---- Types mirrored from the backend (apps/backend/src/modules/shared-ev/entities) ----
export type EVStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "IN_USE"
  | "WAITING_FOR_CHARGING"
  | "CHARGING"
  | "MAINTENANCE";
export type ReservationStatus = "CONFIRMED" | "FULFILLED" | "CANCELLED" | "EXPIRED";

export type HubOverview = {
  id: string;
  name: string;
  area: string;
  parkingCapacity: number;
  operational: boolean;
  parkedVehicles: number;
  freeSpots: number;
  availableVehicles: number;
};

export type SharedEV = {
  id: string;
  name: string;
  type: "SCOOTER" | "BIKE";
  hubId: string;
  batteryLevel: number;
  maxRangeKm: number;
  status: EVStatus;
  currentReservationId: string | null;
};

export type Reservation = {
  id: string;
  studentId: string;
  vehicleId: string;
  hubId: string;
  createdAt: string;
  expiresAt: string;
  status: ReservationStatus;
};

export type UsageSession = {
  id: string;
  studentId: string;
  vehicleId: string;
  reservationId: string;
  startHubId: string;
  startedAt: string;
  endHubId: string | null;
  endedAt: string | null;
  status: "ACTIVE" | "COMPLETED";
};

/** Shared business-rule value (same as MIN_BATTERY_LEVEL in the backend). */
export const MIN_BATTERY_LEVEL = 20;

/** Logged-in demo student (authentication is outside the MVP scope). */
export const CURRENT_STUDENT_ID = "STU-001";

const BASE = "/shared-ev";

export const sharedEvApi = {
  getHubs: () => apiClient.get<HubOverview[]>(`${BASE}/hubs`).then((r) => r.data),
  getAllVehicles: () => apiClient.get<SharedEV[]>(`${BASE}/vehicles`).then((r) => r.data),
  searchVehicles: (hubId: string, minBattery: number) =>
    apiClient
      .get<SharedEV[]>(`${BASE}/vehicles/search`, { params: { hubId, minBattery } })
      .then((r) => r.data),
  reserveVehicle: (vehicleId: string) =>
    apiClient
      .post<Reservation>(`${BASE}/reservations`, { studentId: CURRENT_STUDENT_ID, vehicleId })
      .then((r) => r.data),
  getActiveReservation: () =>
    apiClient
      .get<{ reservation: Reservation | null }>(`${BASE}/reservations/active`, {
        params: { studentId: CURRENT_STUDENT_ID },
      })
      .then((r) => r.data.reservation),
  cancelReservation: (reservationId: string) =>
    apiClient
      .post<Reservation>(`${BASE}/reservations/${reservationId}/cancel`, { studentId: CURRENT_STUDENT_ID })
      .then((r) => r.data),
  pickUpVehicle: (reservationId: string) =>
    apiClient
      .post<UsageSession>(`${BASE}/reservations/${reservationId}/pickup`, { studentId: CURRENT_STUDENT_ID })
      .then((r) => r.data),
  getActiveSession: () =>
    apiClient
      .get<{ session: UsageSession | null }>(`${BASE}/sessions/active`, {
        params: { studentId: CURRENT_STUDENT_ID },
      })
      .then((r) => r.data.session),
  returnVehicle: (sessionId: string, returnHubId: string, batteryLevel: number, faultReported: boolean) =>
    apiClient
      .post<{ session: UsageSession; vehicle: SharedEV }>(`${BASE}/sessions/${sessionId}/return`, {
        studentId: CURRENT_STUDENT_ID,
        returnHubId,
        batteryLevel,
        faultReported,
      })
      .then((r) => r.data),
};

/** Extracts the backend error message (NestJS format) or a generic connection error. */
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "Cannot reach the server. Check that the backend is running and try again.";
    const message = (error.response.data as { message?: string | string[] } | undefined)?.message;
    if (Array.isArray(message)) return message.join(" ");
    if (message) return message;
  }
  return "Something went wrong. Please try again.";
}

/** Same rule as SharedEvService.determinePostReturnStatus (UC-STU-02), used for preview only. */
export function previewReturnStatus(batteryLevel: number, faultReported: boolean): EVStatus {
  if (faultReported) return "MAINTENANCE";
  if (batteryLevel < MIN_BATTERY_LEVEL) return "WAITING_FOR_CHARGING";
  return "AVAILABLE";
}
