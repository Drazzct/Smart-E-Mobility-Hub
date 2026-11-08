import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { SharedEvService } from '../../shared-ev/shared-ev.service.js';
import { SharedEV } from '../../shared-ev/entities/shared-ev.entity.js';
import { EvDataProvider } from './data-provider.interfaces.js';
import { normalizeHubId } from './hub-id.normalizer.js';

@Injectable()
export class Module1EvAdapter implements EvDataProvider {
  private readonly logger = new Logger('MonitoringAdapter');
  private service?: SharedEvService | null;

  constructor(private readonly moduleRef: ModuleRef) {}

  isConnected(): boolean {
    return this.locate() !== null;
  }

  getEvs(hubId?: string): SharedEV[] {
    const service = this.locate();
    if (!service) return [];
    return service
      .findAll()
      .map((e) => ({ ...e, hubId: normalizeHubId(e.hubId) ?? e.hubId }))
      .filter((e) => !hubId || e.hubId === hubId);
  }

  private locate(): SharedEvService | null {
    if (this.service === undefined) {
      try {
        this.service = this.moduleRef.get(SharedEvService, { strict: false });
      } catch {
        this.service = null;
      }
      this.logger.log(
        this.service
          ? 'Module 1 – xe: đọc từ SharedEvService.findAll()'
          : 'Module 1 – xe: chưa tìm thấy SharedEvService -> danh sách xe rỗng',
      );
    }
    return this.service ?? null;
  }
}
