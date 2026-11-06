import { DiscoveryService, ModuleRef } from '@nestjs/core';
import { SharedEvService } from '../../shared-ev/shared-ev.service.js';
import { SourceLocator } from './source-locator.js';
import { Module1EvAdapter } from './module1-ev.adapter.js';
import { Module2ParkingAdapter } from './module2-parking.adapter.js';
import { Module4ChargerAdapter } from './module4-charger.adapter.js';
import { MonitoringDataSources } from './monitoring-data-sources.js';

export function fakeModuleRef(
  entries: [unknown, unknown][],
  calls: { token: unknown; strict?: boolean }[] = [],
): ModuleRef {
  const map = new Map<unknown, unknown>(entries);
  return {
    get: (token: unknown, options?: { strict?: boolean }) => {
      calls.push({ token, strict: options?.strict });
      if (!map.has(token))
        throw new Error(`Nest could not find ${String(token)}`);
      return map.get(token);
    },
  } as unknown as ModuleRef;
}

export function fakeDiscovery(instances: object[]): DiscoveryService {
  return {
    getProviders: () =>
      instances.map((instance) => ({
        instance,
        metatype: instance.constructor,
      })),
  } as unknown as DiscoveryService;
}

export function buildDataSources(options: {
  sharedEv?: SharedEvService;
  otherServices?: object[];
}): MonitoringDataSources {
  const moduleRef = fakeModuleRef(
    options.sharedEv ? [[SharedEvService, options.sharedEv]] : [],
  );
  const locator = new SourceLocator(fakeDiscovery(options.otherServices ?? []));
  return new MonitoringDataSources(
    new Module1EvAdapter(moduleRef),
    new Module2ParkingAdapter(locator),
    new Module4ChargerAdapter(locator),
  );
}
