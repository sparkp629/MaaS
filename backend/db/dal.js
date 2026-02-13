/**
 * MaaS — Data Access Layer
 */

import { getDb } from './init.js';

function uuid() {
  return crypto.randomUUID();
}

export function createSuggestion(text, ipHash = null) {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO suggestions (text, ip_hash) VALUES (?, ?)'
  );
  const result = stmt.run(text?.trim()?.slice(0, 500) || '', ipHash || null);
  return { id: result.lastInsertRowid };
}

export function countSuggestionsByIpInLastHour(ipHash) {
  if (!ipHash) return 0;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COUNT(*) as c FROM suggestions 
       WHERE ip_hash = ? AND created_at > datetime('now', '-1 hour')`
    )
    .get(ipHash);
  return row?.c ?? 0;
}

export function getCampaigns(founderId = null) {
  const db = getDb();
  let rows;
  if (founderId) {
    rows = db.prepare('SELECT * FROM campaigns WHERE founder_id = ? ORDER BY created_at DESC').all(founderId);
  } else {
    rows = db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all();
  }
  return rows;
}

export function createCampaign(founderId, productName, niche) {
  const id = uuid();
  const db = getDb();
  db.prepare('INSERT INTO campaigns (id, founder_id, product_name, niche) VALUES (?, ?, ?, ?)').run(
    id,
    founderId || null,
    productName || '',
    niche || ''
  );
  return { id };
}

export function getClicks(campaignId = null) {
  const db = getDb();
  const rows = campaignId
    ? db.prepare('SELECT * FROM clicks WHERE campaign_id = ?').all(campaignId)
    : db.prepare('SELECT * FROM clicks').all();
  return rows;
}

export function getImpressions(campaignId = null) {
  const db = getDb();
  const rows = campaignId
    ? db.prepare('SELECT * FROM impressions WHERE campaign_id = ?').all(campaignId)
    : db.prepare('SELECT * FROM impressions').all();
  return rows;
}

export function getSpends(campaignId = null) {
  const db = getDb();
  const rows = campaignId
    ? db.prepare('SELECT * FROM spends WHERE campaign_id = ?').all(campaignId)
    : db.prepare('SELECT * FROM spends').all();
  return rows;
}

export function getRoiSummary() {
  const db = getDb();
  const clicks = db.prepare('SELECT COUNT(*) as c FROM clicks').get();
  const imp = db.prepare('SELECT COALESCE(SUM(count), 0) as s FROM impressions').get();
  const spend = db.prepare('SELECT COALESCE(SUM(amount), 0) as s FROM spends').get();
  return {
    clicks: clicks?.c ?? 0,
    impressions: imp?.s ?? 0,
    spend: spend?.s ?? 0,
    mindshareGrowth: 0,
  };
}
