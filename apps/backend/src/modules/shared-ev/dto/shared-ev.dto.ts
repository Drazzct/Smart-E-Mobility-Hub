// Request payloads of Module 1 (validated manually in SharedEvService).

/** Query of GET /shared-ev/vehicles/search (UC-STU-GetEV). */
export class SearchVehicleQueryDto {
  hubId?: string; // omitted or "all" = every Hub
  minBattery?: number; // optional student requirement, never below MIN_BATTERY_LEVEL
}

/** Body of POST /shared-ev/reservations (UC-STU-ReserveEV). */
export class ReserveVehicleDto {
  studentId: string;
  vehicleId: string;
}

/** Body of cancel / pickup requests (UC-STU-ReserveEV A1, UC-STU-03). */
export class StudentActionDto {
  studentId: string;
}

/** Body of POST /shared-ev/sessions/:id/return (UC-STU-02). */
export class ReturnVehicleDto {
  studentId: string;
  returnHubId: string;
  batteryLevel: number; // battery reported by the vehicle after the trip
  faultReported?: boolean; // vehicle fault detected during return (E3)
}
