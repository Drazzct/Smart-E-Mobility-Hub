import { Injectable } from '@nestjs/common';

/**
 * Wraps the system time so that time-dependent rules (reservation expiration)
 * can be tested with a fake clock.
 */
@Injectable()
export class ClockService {
  now(): Date {
    return new Date();
  }
}
