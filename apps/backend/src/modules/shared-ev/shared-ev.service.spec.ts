import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SharedEvService } from './shared-ev.service.js';
import { EVStatus } from './entities/shared-ev.entity.js';

describe('SharedEvService - Student Portal (Module 1)', () => {
  let service: SharedEvService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharedEvService],
    }).compile();

    service = module.get<SharedEvService>(SharedEvService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all available shared EVs', () => {
    const evs = service.findAll();
    expect(Array.isArray(evs)).toBe(true);
    expect(evs.length).toBeGreaterThan(0);
  });

  it('should filter EVs by hubId', () => {
    const metroEvs = service.findByHub('hub-metro');
    expect(metroEvs.every((ev) => ev.hubId === 'hub-metro')).toBe(true);
  });

  it('should successfully reserve an available EV', () => {
    const res = service.reserveEv('ev-1', 'STU999');
    expect(res.message).toBeDefined();
    expect(res.ev.status).toBe(EVStatus.RESERVED);
    expect(res.ev.currentReservationId).toContain('STU999');
  });

  it('should throw BadRequestException when attempting to reserve an already unavailable EV', () => {
    expect(() => service.reserveEv('ev-2', 'STU111')).toThrow(BadRequestException);
  });

  it('should throw NotFoundException when vehicle does not exist', () => {
    expect(() => service.reserveEv('ev-nonexistent', 'STU111')).toThrow(NotFoundException);
  });
});

