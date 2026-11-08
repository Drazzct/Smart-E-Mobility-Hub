import { apiClient } from '../api/client';

export interface Hub {
  id: string;
  name: string;
  area: string;
}

export interface Vehicle {
  id: string;
  code: string;
  hubId: string;
  batteryLevel: number;
  status: string;
  currentReservationId?: string | null;
  name?: string;
  type?: string;
  rangeKm?: number;
  eligible?: boolean;
}

export interface Reservation {
  id: string;
  vehicleId: string;
  hubId: string;
  createdAt: string;
  expiresAt: string;
  status: 'Confirmed' | 'Fulfilled';
}

export class SharedEVService {
  static async getAllVehicles(): Promise<Vehicle[]> {
    try {
      const response = await apiClient.get('/shared-ev');
      const vehicles: Vehicle[] = Array.isArray(response.data) ? response.data : response.data.vehicles || [];
      return vehicles.map(v => ({
        ...v,
        name: this.getVehicleName(v.code),
        type: this.getVehicleType(v.code),
        rangeKm: this.calculateRange(v.batteryLevel),
        eligible: v.batteryLevel >= 20,
      }));
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return [];
    }
  }

  static async getVehiclesByHub(hubId: string): Promise<Vehicle[]> {
    try {
      const response = await apiClient.get(`/shared-ev/hub/${hubId}`);
      const vehicles: Vehicle[] = Array.isArray(response.data) ? response.data : response.data.vehicles || [];
      return vehicles.map(v => ({
        ...v,
        name: this.getVehicleName(v.code),
        type: this.getVehicleType(v.code),
        rangeKm: this.calculateRange(v.batteryLevel),
        eligible: v.batteryLevel >= 20,
      }));
    } catch (error) {
      console.error(`Error fetching vehicles for hub ${hubId}:`, error);
      return [];
    }
  }

  static async reserveVehicle(vehicleId: string, studentId: string = 'STU-DEFAULT'): Promise<{ success: boolean; reservationId?: string; message: string }> {
    try {
      const response = await apiClient.post(`/shared-ev/${vehicleId}/reserve`, { studentId });
      return {
        success: response.status === 200 || response.status === 201,
        reservationId: response.data?.reservationId,
        message: response.data?.message || 'Reservation successful',
      };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to reserve vehicle';
      console.error('Error reserving vehicle:', error);
      return { success: false, message };
    }
  }

  private static getVehicleName(code: string): string {
    const type = this.getVehicleType(code);
    return `${type} ${code}`;
  }

  private static getVehicleType(code: string): string {
    if (code.includes('001') || code.includes('002') || code.includes('003')) return 'E-Scooter';
    if (code.includes('004') || code.includes('005')) return 'E-Bike';
    return 'Electric Vehicle';
  }

  private static calculateRange(battery: number): number {
    return Math.round((battery / 100) * 50);
  }

  static getLocalHubs(): Hub[] {
    return [
      { id: 'hub-metro', name: 'Metro Station Hub', area: 'Metro Line 1' },
      { id: 'hub-ktxb', name: 'Dormitory Hub B', area: 'Student Dormitories' },
    ];
  }
}
