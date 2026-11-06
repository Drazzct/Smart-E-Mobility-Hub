import { MONITORING_HUB_IDS } from '../../../mock/monitoring.mock.js';

const HUB_ALIASES: Record<string, string> = {
  metro: 'hub-metro',
  'ga-metro': 'hub-metro',
  ktxb: 'hub-ktxb',
  'ktx-b': 'hub-ktxb',
  dorm: 'hub-ktxb',
  dormitory: 'hub-ktxb',
  campus: 'hub-campus',
  service: 'hub-service',
};

export function normalizeHubId(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || raw.trim() === '') return undefined;
  const key = raw
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');
  if (MONITORING_HUB_IDS.includes(key)) return key;
  const short = key.replace(/^hub-/, '');
  return HUB_ALIASES[short];
}

export function hubIdFromResourceId(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  for (const part of raw.toLowerCase().split(/[-_]/)) {
    const hub = normalizeHubId(part);
    if (hub) return hub;
  }
  return undefined;
}
