export const MIN_BATTERY_LEVEL = 20;

/**
 * BR-03 / FR-AUTO-01: grace period before an unclaimed reservation expires.
 * Default 15 minutes; override with env RESERVATION_GRACE_SECONDS for demos (e.g. 60).
 */
export const RESERVATION_GRACE_MS =
  Number(process.env.RESERVATION_GRACE_SECONDS ?? 15 * 60) * 1000;

/** How often the background job checks for overdue reservations. */
export const EXPIRATION_SWEEP_INTERVAL_MS = 5_000;
