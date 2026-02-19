// Simple skeleton for hourly content availability checker
// Exports a checkOnce() function and startScheduler() to run periodically.

import { setInterval as setIntervalFn } from 'timers';

export async function checkOnce({ dbClient = null } = {}) {
  // dbClient: optional database client to query stored posts/content
  // This skeleton logs the action and returns a result object.
  console.log('[availabilityChecker] Running single availability check');

  // TODO: implement provider-specific availability checks:
  // - For each stored post record: call provider API (YouTube, X, TikTok, Meta) to verify status
  // - If content not found or removed, mark as unavailable in DB and optionally remove
  // - Respect rate limits, backoff and quota configuration

  // Return a minimal structure useful for tests and health endpoints
  return { ok: true, checked: 0, removed: 0 };
}

let _interval = null;

export function startScheduler({ minutes = 60, dbClient = null } = {}) {
  const ms = Math.max(1, minutes) * 60 * 1000;
  if (_interval) {
    clearInterval(_interval);
  }
  console.log(`[availabilityChecker] Starting scheduler every ${minutes} minute(s)`);
  _interval = setIntervalFn(async () => {
    try {
      await checkOnce({ dbClient });
    } catch (err) {
      console.error('[availabilityChecker] Error during check:', err);
    }
  }, ms);
  return _interval;
}

export function stopScheduler() {
  if (_interval) clearInterval(_interval);
  _interval = null;
}
