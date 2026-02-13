/**
 * Rate limiter in-memory pour suggestions (privacy-first)
 */

const store = new Map();
const WINDOW_MS = 60 * 60 * 1000; // 1h
const MAX_PER_WINDOW = 3;

export function rateLimitSuggestions(req, res, next) {
  const key = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  let entry = store.get(key);

  if (!entry) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(key, entry);
  }

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + WINDOW_MS;
  }

  entry.count++;

  if (entry.count > MAX_PER_WINDOW) {
    return res.status(429).json({
      error: 'Trop de suggestions. Réessayez dans 1 heure.',
    });
  }

  next();
}
