import { Logger } from '@nestjs/common';
import { SourceCandidate } from './adapter-sources.config.js';
import { LocatedSource, SourceLocator } from './source-locator.js';

export type MapResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: string };

export interface AdapterStatus {
  connected: boolean;
  source?: string;
  skipped: number;
  lastIssue?: string;
}

export abstract class SourceAdapterBase<T> {
  protected abstract readonly label: string;
  protected abstract readonly candidates: SourceCandidate[];
  protected abstract map(raw: Record<string, unknown>): MapResult<T>;

  private readonly logger = new Logger('MonitoringAdapter');
  private located?: LocatedSource | null;
  private status: AdapterStatus = { connected: false, skipped: 0 };

  constructor(private readonly locator: SourceLocator) {}

  isConnected(): boolean {
    return this.locate() !== null;
  }

  getStatus(): AdapterStatus {
    this.locate();
    return { ...this.status };
  }

  protected readAll(): T[] {
    const source = this.locate();
    if (!source) return [];

    let rows: unknown[];
    try {
      rows = this.unwrapArray(source.read());
    } catch (err) {
      this.report(0, `Lỗi khi gọi ${this.status.source}: ${String(err)}`);
      return [];
    }

    const result: T[] = [];
    let skipped = 0;
    let lastReason: string | undefined;
    for (const row of rows) {
      if (!row || typeof row !== 'object') {
        skipped++;
        lastReason = 'Bản ghi không phải object';
        continue;
      }
      const mapped = this.map(row as Record<string, unknown>);
      if (mapped.ok) result.push(mapped.value);
      else {
        skipped++;
        lastReason = mapped.reason;
      }
    }
    this.report(skipped, lastReason);
    return result;
  }

  private locate(): LocatedSource | null {
    if (this.located === undefined) {
      this.located = this.locator.find(this.candidates) ?? null;
      this.status.connected = this.located !== null;
      this.status.source = this.located
        ? `${this.located.className}.${this.located.method}()`
        : undefined;
      this.logger.log(
        this.located
          ? `${this.label}: đọc từ ${this.status.source}`
          : `${this.label}: chưa tìm thấy service nguồn -> dùng dữ liệu tạm`,
      );
    }
    return this.located;
  }

  private unwrapArray(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
      for (const key of ['data', 'items', 'slots', 'ports', 'chargers']) {
        const inner = (value as Record<string, unknown>)[key];
        if (Array.isArray(inner)) return inner;
      }
    }
    throw new Error('Dữ liệu trả về không phải mảng');
  }

  private report(skipped: number, reason?: string): void {
    if (skipped !== this.status.skipped || reason !== this.status.lastIssue) {
      if (skipped > 0 || reason) {
        this.logger.warn(
          `${this.label}: bỏ qua ${skipped} bản ghi. ${reason ?? ''}`.trim(),
        );
      }
    }
    this.status.skipped = skipped;
    this.status.lastIssue = reason;
  }
}

export function pick(raw: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (raw[k] !== undefined && raw[k] !== null) return raw[k];
  }
  return undefined;
}

export function statusKey(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}
