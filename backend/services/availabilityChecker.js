// Simple skeleton for hourly content availability checker
// Exports a checkOnce() function and startScheduler() to run periodically.

import { setInterval as setIntervalFn } from 'timers';
import { getContentsToCheck, markContentUnavailable, markContentChecked } from '../db/dal.js';

export async function checkOnce({ dbClient = null } = {}) {
  // dbClient: optional database client to query stored posts/content
  // This skeleton logs the action and returns a result object.
  console.log('[availabilityChecker] Running single availability check');
  // Determine contents to check from DB
  const toCheck = getContentsToCheck(200);
  let checked = 0;
  let removed = 0;

  for (const row of toCheck) {
    checked += 1;
    const url = row.url;
    if (!url) {
      markContentUnavailable(row.id, 'missing_url');
      removed += 1;
      continue;
    }

    try {
      const resp = await fetch(url, { method: 'HEAD', redirect: 'follow', timeout: 10000 });
      if (!resp.ok) {
        console.log(`[availabilityChecker] Content ${row.id} -> ${url} returned ${resp.status}`);
        markContentUnavailable(row.id, `http_${resp.status}`);
        removed += 1;
      } else {
        markContentChecked(row.id, true, { status: resp.status });
      }
    } catch (err) {
      console.warn(`[availabilityChecker] Error checking ${row.id} ${url}:`, err && err.message ? err.message : err);
      // On network error, don't immediately mark unavailable; record attempt
      markContentChecked(row.id, true, { error: String(err && err.message ? err.message : err) });
    }
  }

  return { ok: true, checked, removed };
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
