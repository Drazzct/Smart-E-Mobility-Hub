import { Injectable } from '@nestjs/common';
import { Hub, DemandLevel } from './entities/hub.entity.js';
import { Vehicle } from './entities/vehicle.entity.js';
import { ChargingRequest, ChargingRequestStatus } from './entities/charging-request.entity.js';
import { ChargingPort, PortStatus } from './entities/charging-port.entity.js';
import { ChargingSchedule, ScheduleStatus } from './entities/charging-schedule.entity.js';
import { RedistributionPlan, RedistributionStatus } from './entities/redistribution-plan.entity.js';
import { EVStatus } from '../shared-ev/entities/shared-ev.entity.js';
import { INITIAL_HUBS, INITIAL_VEHICLES, INITIAL_CHARGING_REQUESTS, INITIAL_CHARGING_PORTS } from '../../mock/coordination.mock.js';

@Injectable()
export class CoordinationService {
  private hubs = [...INITIAL_HUBS];
  private vehicles = [...INITIAL_VEHICLES];
  private chargingRequests = [...INITIAL_CHARGING_REQUESTS];
  private chargingPorts = [...INITIAL_CHARGING_PORTS];
  private redistributionPlans: RedistributionPlan[] = [];
  private chargingSchedules: ChargingSchedule[] = [];

  getHubsStatus() {
    return {
      hubs: this.hubs.map(h => {
        const hv = this.vehicles.filter(v => v.hubId === h.id);
        const av = hv.filter(v => v.status === EVStatus.AVAILABLE).length;
        const rv = hv.filter(v => v.status === EVStatus.RESERVED).length;
        const iv = hv.filter(v => v.status === EVStatus.IN_USE).length;
        const cv = hv.filter(v => v.status === EVStatus.CHARGING).length;
        const util = (rv + iv) / h.totalCapacity;
        let dm = util > 0.7 ? DemandLevel.HIGH : util > 0.4 ? DemandLevel.MEDIUM : DemandLevel.LOW;
        return {
          id: h.id,
          name: h.name,
          totalCapacity: h.totalCapacity,
          availableCount: av,
          reservedCount: rv,
          inUseCount: iv,
          chargingCount: cv,
          demandLevel: dm.toString(),
          surplusVehicles: Math.max(0, av - 6),
          deficitVehicles: Math.max(0, 3 - av),
        };
      }),
      totalHubs: this.hubs.length,
    };
  }

  getVehicles() {
    return {
      vehicles: this.vehicles.map(v => ({
        id: v.id,
        code: v.code,
        name: v.name,
        type: v.type,
        hubId: v.hubId,
        batteryLevel: v.batteryLevel,
        status: v.status,
        rangeKm: v.rangeKm,
        eligible: v.eligible,
      })),
      totalVehicles: this.vehicles.length,
    };
  }

  analyzeResourceDemand() {
    const demands = this.hubs.map(h => {
      const hv = this.vehicles.filter(v => v.hubId === h.id);
      const av = hv.filter(v => v.status === EVStatus.AVAILABLE).length;
      const rv = hv.filter(v => v.status === EVStatus.RESERVED).length;
      const iv = hv.filter(v => v.status === EVStatus.IN_USE).length;
      const exp = rv + iv + 2;
      const def = Math.max(0, exp - av);
      const sur = Math.max(0, av - 5);
      let act = 'MONITOR';
      if (def > 0) act = 'REDISTRIBUTE_IN';
      else if (sur > 2) act = 'REDISTRIBUTE_OUT';
      return {
        hubId: h.id,
        hubName: h.name,
        currentAvailable: av,
        expectedDemand: exp,
        demandLevel: h.demandLevel,
        surplus: sur,
        deficit: def,
        recommendedAction: act,
      };
    });
    return {
      demands,
      hupsWithDeficit: demands.filter(d => d.deficit > 0).map(d => d.hubId),
      hubsWithSurplus: demands.filter(d => d.surplus > 0).map(d => d.hubId),
    };
  }

  getRedistributionRecommendation() {
    const d = this.analyzeResourceDemand();
    if (!d.hupsWithDeficit.length || !d.hubsWithSurplus.length) {
      return { recommendation: null, available: false, message: 'No redistribution needed' };
    }
    const sh = this.hubs.find(h => h.id === d.hubsWithSurplus[0]);
    const dh = this.hubs.find(h => h.id === d.hupsWithDeficit[0]);
    if (!sh || !dh) {
      return { recommendation: null, available: false, message: 'Invalid hub' };
    }
    const el = this.vehicles.filter(v => v.hubId === sh.id && v.eligible && v.status === EVStatus.AVAILABLE);
    if (!el.length) {
      return { recommendation: null, available: false, message: 'No eligible vehicles' };
    }
    const tm = el.slice(0, 3);
    const rec = {
      id: `REDIST-${Date.now()}`,
      sourceHubId: sh.id,
      sourceHubName: sh.name,
      destinationHubId: dh.id,
      destinationHubName: dh.name,
      vehicleIds: tm.map(v => v.id),
      vehicleDetails: tm.map(v => ({ id: v.id, code: v.code, name: v.name, batteryLevel: v.batteryLevel })),
      reason: `${dh.name} needs. ${sh.name} surplus.`,
      estimatedDistance: 5,
      status: RedistributionStatus.PENDING,
    };
    const p: RedistributionPlan = {
      id: rec.id,
      sourceHubId: sh.id,
      destinationHubId: dh.id,
      vehicleIds: tm.map(v => v.id),
      status: RedistributionStatus.PENDING,
      createdAt: new Date(),
      reason: rec.reason,
    };
    this.redistributionPlans.push(p);
    return { recommendation: rec, available: true, message: 'Generated' };
  }

  approveRedistribution(planId: string) {
    const p = this.redistributionPlans.find(x => x.id === planId);
    if (!p) throw new Error('Not found');
    p.status = RedistributionStatus.APPROVED;
    p.approvedAt = new Date();
    for (const vid of p.vehicleIds) {
      const v = this.vehicles.find(x => x.id === vid);
      if (v) v.hubId = p.destinationHubId;
    }
    return { message: 'Approved', status: RedistributionStatus.APPROVED };
  }

  rejectRedistribution(planId: string) {
    const p = this.redistributionPlans.find(x => x.id === planId);
    if (!p) throw new Error('Not found');
    p.status = RedistributionStatus.REJECTED;
    return { message: 'Rejected', status: RedistributionStatus.REJECTED };
  }

  calculateChargingPriorities() {
    const pri = this.chargingRequests
      .filter(r => r.status !== ChargingRequestStatus.COMPLETED)
      .map(r => ({
        vehicleId: r.vehicleId,
        vehicleName: r.vehicleName,
        hubId: r.hubId,
        batteryLevel: r.battery,
        priority: r.priority,
        waitingTime: r.waitingTime,
        riskLevel: r.riskLevel,
        usageRequired: r.usageRequired,
        reason: `${r.battery}%`,
      }))
      .sort((a, b) => a.batteryLevel - b.batteryLevel);
    return { priorities: pri, totalVehicles: pri.length };
  }

  generateChargingSchedule() {
    const pri = this.calculateChargingPriorities().priorities;
    const pt = this.chargingPorts.filter(p => p.status === PortStatus.AVAILABLE);
    const sch = [];
    let pi = 0;
    let t = 10;
    for (const pr of pri) {
      if (!pt.length || pi >= pt.length) break;
      const r = this.chargingRequests.find(x => x.vehicleId === pr.vehicleId);
      if (!r) continue;
      const et = Math.ceil(((100 - pr.batteryLevel) / 100) * 60);
      const en = t + Math.ceil(et / 60);
      sch.push({
        requestId: r.id,
        vehicleId: pr.vehicleId,
        vehicleName: pr.vehicleName,
        portId: pt[pi].id,
        startTime: `${String(t).padStart(2, '0')}:00`,
        endTime: `${String(en).padStart(2, '0')}:00`,
        estimatedTime: et,
        fromBattery: pr.batteryLevel,
        toBattery: Math.min(100, pr.batteryLevel + 50),
        status: ScheduleStatus.PENDING,
      });
      pt[pi].status = PortStatus.IN_USE;
      pi++;
      t = en;
    }
    return {
      schedules: sch,
      assigned: sch.length,
      queued: pri.length - sch.length,
      totalRequests: pri.length,
      estimatedTotalTime: `${t - 10}h`,
      totalEnergy: `~${sch.length * 25}kWh`,
    };
  }

  approveChargingSchedule(sch: any[]) {
    const id = `SCHEDULE-${Date.now()}`;
    for (const s of sch) {
      this.chargingSchedules.push({
        id: `${id}-${s.requestId}`,
        requestId: s.requestId,
        portId: s.portId,
        startTime: s.startTime,
        endTime: s.endTime,
        estimatedTime: s.estimatedTime,
        fromBattery: s.fromBattery,
        toBattery: s.toBattery,
        status: ScheduleStatus.APPROVED,
        createdAt: new Date(),
      });
      const r = this.chargingRequests.find(x => x.id === s.requestId);
      if (r) {
        r.status = ChargingRequestStatus.ASSIGNED;
        r.assignedPort = s.portId;
      }
    }
    return { message: 'Approved', scheduleId: id };
  }

  rejectChargingSchedule() {
    return { message: 'Rejected' };
  }

  getChargingSchedules() {
    return {
      schedules: this.chargingSchedules.map(s => {
        const r = this.chargingRequests.find(x => x.id === s.requestId);
        return {
          requestId: s.requestId,
          vehicleId: r?.vehicleId || '',
          vehicleName: r?.vehicleName || '',
          portId: s.portId,
          startTime: s.startTime,
          endTime: s.endTime,
          estimatedTime: s.estimatedTime,
          fromBattery: s.fromBattery,
          toBattery: s.toBattery,
          status: s.status,
        };
      }),
      totalSchedules: this.chargingSchedules.length,
    };
  }
}
