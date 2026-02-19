/**
 * MaaS — Init SQLite (DAL)
 * Tables : suggestions (rate-limited), campaigns, clicks, impressions, spends
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || join(__dirname, '..', 'maas.db');

let db = null;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema(db);
  }
  return db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      ip_hash TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  try {
    db.exec(`ALTER TABLE suggestions ADD COLUMN ip_hash TEXT;`);
  } catch (_) {}
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_suggestions_ip ON suggestions(ip_hash);
    CREATE INDEX IF NOT EXISTS idx_suggestions_created ON suggestions(created_at);

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      founder_id TEXT,
      product_name TEXT,
      niche TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clicks (
      id TEXT PRIMARY KEY,
      campaign_id TEXT,
      kol_id TEXT,
      source TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS impressions (
      id TEXT PRIMARY KEY,
      campaign_id TEXT,
      kol_id TEXT,
      count INTEGER DEFAULT 1,
      source TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS spends (
      id TEXT PRIMARY KEY,
      campaign_id TEXT,
      amount REAL,
      currency TEXT DEFAULT 'EUR',
      category TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stripe_session_id TEXT UNIQUE,
      email TEXT,
      amount_total INTEGER,
      currency TEXT,
      status TEXT DEFAULT 'completed',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(email);

    CREATE TABLE IF NOT EXISTS kol_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      platform_user_id TEXT,
      handle TEXT,
      display_name TEXT,
      followers INTEGER DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      engagement_rate REAL DEFAULT 0,
      views INTEGER DEFAULT 0,
      subscribers INTEGER DEFAULT 0,
      extra_json TEXT,
      fetched_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_kol_platform ON kol_metrics(platform, platform_user_id);
    
    -- Stored external contents (posts, videos, threads) to monitor availability
    CREATE TABLE IF NOT EXISTS contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      platform_content_id TEXT,
      url TEXT,
      status TEXT DEFAULT 'available', -- available | unavailable
      last_checked_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      extra_json TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_contents_platform ON contents(platform, platform_content_id);
  `);
}
