// Account protection middleware skeleton
// - Marks requests as suspicious when disposable emails or missing fingerprints are detected
// - Placeholder for future rate-limits, CAPTCHA triggers, or blocklists

import fs from 'fs';

const disposableDomains = new Set([
  'mailinator.com', '10minutemail.com', 'dispostable.com', 'tempmail.com', 'trashmail.com',
]);

function isDisposableEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1].toLowerCase();
  if (disposableDomains.has(domain)) return true;
  // simple heuristic: short domain or contains 'mail' + number
  if (/temp|mail|disposable|trash|10min/.test(domain)) return true;
  return false;
}

export default function accountProtection() {
  return (req, res, next) => {
    try {
      req.protection = req.protection || {};
      // fingerprint header (optional)
      const fp = req.headers['x-fp'] || req.headers['x-fingerprint'] || null;
      req.protection.fingerprint = !!fp;

      // detect disposable email in body or headers
      const email = (req.body && req.body.email) || req.headers['x-email'] || null;
      req.protection.suspectedDisposableEmail = isDisposableEmail(email);

      // simple heuristic for suspicion
      req.protection.isSuspicious = (!req.protection.fingerprint) || req.protection.suspectedDisposableEmail;

      if (req.protection.isSuspicious) {
        console.debug('[accountProtection] suspicious request', {
          ip: req.ip,
          email: email ? String(email).slice(0, 50) : null,
          fingerprint: !!fp,
        });
      }
    } catch (e) {
      // non-blocking: do not break requests on middleware error
      console.warn('[accountProtection] middleware error', e && e.message ? e.message : e);
    }
    return next();
  };
}
