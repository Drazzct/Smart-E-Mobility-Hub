import { Injectable } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { SourceCandidate } from './adapter-sources.config.js';

export interface LocatedSource {
  className: string;
  method: string;
  read: () => unknown;
}

@Injectable()
export class SourceLocator {
  constructor(private readonly discovery: DiscoveryService) {}

  find(candidates: SourceCandidate[]): LocatedSource | undefined {
    const providers = this.discovery.getProviders();

    for (const { className, method } of candidates) {
      for (const wrapper of providers) {
        const instance = wrapper.instance as
          | Record<string, unknown>
          | undefined;
        const name = wrapper.metatype?.name;
        if (!instance || name !== className) continue;

        const fn = instance[method];
        if (typeof fn === 'function') {
          return {
            className,
            method,
            read: () => (fn as () => unknown).call(instance),
          };
        }
      }
    }
    return undefined;
  }
}
