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
    seedBaseData(db);
  }
  return db;
}

function initSchema(conn) {
  conn.exec(`
    CREATE TABLE IF NOT EXISTS niches (
      key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workspace_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      niche_key TEXT NOT NULL,
      objective TEXT,
      budget_range TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (niche_key) REFERENCES niches(key)
    );

    CREATE TABLE IF NOT EXISTS kol_candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      niche_key TEXT NOT NULL,
      name TEXT NOT NULL,
      handle TEXT NOT NULL,
      primary_network TEXT NOT NULL,
      secondary_networks TEXT,
      followers INTEGER DEFAULT 0,
      engagement_rate REAL DEFAULT 0,
      fit_score INTEGER DEFAULT 0,
      est_sponsorship_usd INTEGER DEFAULT 0,
      reason TEXT,
      profile_url TEXT,
      last_signal_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (niche_key) REFERENCES niches(key)
    );

    CREATE TABLE IF NOT EXISTS social_highlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      niche_key TEXT NOT NULL,
      network TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_handle TEXT,
      author_avatar_url TEXT,
      format TEXT,
      title TEXT NOT NULL,
      hook TEXT,
      metrics_json TEXT,
      impact_score INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      engagement_rate REAL DEFAULT 0,
      url TEXT,
      published_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (niche_key) REFERENCES niches(key)
    );

    CREATE TABLE IF NOT EXISTS substack_signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      niche_key TEXT NOT NULL,
      publication TEXT NOT NULL,
      topic TEXT NOT NULL,
      angle TEXT,
      open_rate REAL DEFAULT 0,
      ctr REAL DEFAULT 0,
      growth_score INTEGER DEFAULT 0,
      issue_url TEXT,
      published_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (niche_key) REFERENCES niches(key)
    );

    CREATE TABLE IF NOT EXISTS knowledge_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL UNIQUE,
      source_type TEXT NOT NULL, -- txt | pdf | md | docx | other
      topic TEXT,
      relevance_score INTEGER DEFAULT 0,
      include_in_scope INTEGER DEFAULT 0, -- 1 yes, 0 ignored
      extraction_status TEXT DEFAULT 'pending', -- pending | extracted | metadata_only | ignored
      metadata_json TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS knowledge_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id INTEGER NOT NULL,
      chunk_index INTEGER NOT NULL,
      text_content TEXT NOT NULL,
      token_estimate INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (source_id) REFERENCES knowledge_sources(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS knowledge_vectors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id INTEGER NOT NULL,
      chunk_id INTEGER,
      embedding_model TEXT,
      embedding_dims INTEGER DEFAULT 0,
      embedding_json TEXT, -- JSON array for portability in SQLite
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (source_id) REFERENCES knowledge_sources(id) ON DELETE CASCADE,
      FOREIGN KEY (chunk_id) REFERENCES knowledge_chunks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS telegram_alert_connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_key TEXT NOT NULL UNIQUE,
      link_token TEXT,
      status TEXT DEFAULT 'pending', -- pending | connected
      telegram_chat_id TEXT,
      telegram_username TEXT,
      min_impact_score INTEGER DEFAULT 70,
      networks_csv TEXT DEFAULT 'X,YouTube',
      daily_digest INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_kol_niche_fit
      ON kol_candidates(niche_key, fit_score DESC);

    CREATE INDEX IF NOT EXISTS idx_social_niche_impact
      ON social_highlights(niche_key, impact_score DESC);

    CREATE INDEX IF NOT EXISTS idx_substack_niche_growth
      ON substack_signals(niche_key, growth_score DESC);

    CREATE INDEX IF NOT EXISTS idx_knowledge_sources_scope
      ON knowledge_sources(include_in_scope, source_type, relevance_score DESC);

    CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source
      ON knowledge_chunks(source_id, chunk_index);

    CREATE INDEX IF NOT EXISTS idx_knowledge_vectors_source
      ON knowledge_vectors(source_id, chunk_id);

    CREATE INDEX IF NOT EXISTS idx_telegram_alert_user
      ON telegram_alert_connections(user_key);
  `);

  try {
    conn.exec(`ALTER TABLE social_highlights ADD COLUMN author_avatar_url TEXT;`);
  } catch (_) {}

  try {
    conn.exec(`ALTER TABLE social_highlights ADD COLUMN metrics_json TEXT;`);
  } catch (_) {}

  try {
    conn.exec(`ALTER TABLE telegram_alert_connections ADD COLUMN telegram_username TEXT;`);
  } catch (_) {}
}

function tableHasData(conn, tableName) {
  const row = conn.prepare(`SELECT COUNT(*) AS c FROM ${tableName}`).get();
  return Number(row?.c || 0) > 0;
}

function seedBaseData(conn) {
  const insertNiche = conn.prepare(`
    INSERT OR IGNORE INTO niches (key, label, description)
    VALUES (@key, @label, @description)
  `);

  [
    {
      key: 'deeptech-defense',
      label: 'DeepTech Defense',
      description: 'Defense, robotics and dual-use startups building trust before fundraising rounds.',
    },
    {
      key: 'ai-saas-b2b',
      label: 'AI SaaS B2B',
      description: 'B2B AI products selling to operations, sales and growth teams.',
    },
    {
      key: 'creator-commerce',
      label: 'Creator Commerce',
      description: 'Creators, infoproducts and community-first monetization businesses.',
    },
    {
      key: 'intelligence-artificielle-fr',
      label: 'Intelligence Artificielle (FR)',
      description: 'Comptes et contenus IA francophones a fort impact.',
    },
    {
      key: 'tech',
      label: 'Tech',
      description: 'Technologies logicielles et tendances produit globales.',
    },
    {
      key: 'automation',
      label: 'Automation',
      description: 'Automatisation no-code, agents et orchestration process.',
    },
    {
      key: 'startup',
      label: 'Startup',
      description: 'Build, distribution, fundraising, growth et execution.',
    },
    {
      key: 'saas',
      label: 'SaaS',
      description: 'Produit SaaS, GTM, retention et monetisation.',
    },
  ].forEach((niche) => insertNiche.run(niche));

  if (!tableHasData(conn, 'kol_candidates')) {
    const insertKol = conn.prepare(`
      INSERT INTO kol_candidates (
        niche_key,
        name,
        handle,
        primary_network,
        secondary_networks,
        followers,
        engagement_rate,
        fit_score,
        est_sponsorship_usd,
        reason,
        profile_url,
        last_signal_at
      )
      VALUES (
        @niche_key,
        @name,
        @handle,
        @primary_network,
        @secondary_networks,
        @followers,
        @engagement_rate,
        @fit_score,
        @est_sponsorship_usd,
        @reason,
        @profile_url,
        @last_signal_at
      )
    `);

    [
      {
        niche_key: 'deeptech-defense',
        name: 'Lena Voronin',
        handle: '@lena_dualuse',
        primary_network: 'X',
        secondary_networks: 'YouTube,LinkedIn',
        followers: 186000,
        engagement_rate: 4.2,
        fit_score: 93,
        est_sponsorship_usd: 2400,
        reason: 'Audience founders plus defense investors, high discussion quality on procurement topics.',
        profile_url: 'https://x.com/lena_dualuse',
        last_signal_at: '2026-02-18',
      },
      {
        niche_key: 'deeptech-defense',
        name: 'Armand Leclerc',
        handle: '@ardent_systems',
        primary_network: 'YouTube',
        secondary_networks: 'X,Meta',
        followers: 92000,
        engagement_rate: 6.8,
        fit_score: 89,
        est_sponsorship_usd: 3100,
        reason: 'Strong long-form explainers on autonomous systems and policy context.',
        profile_url: 'https://youtube.com/@ardent_systems',
        last_signal_at: '2026-02-21',
      },
      {
        niche_key: 'ai-saas-b2b',
        name: 'Nadia Brooks',
        handle: '@nadia_pipeline',
        primary_network: 'LinkedIn',
        secondary_networks: 'X,YouTube',
        followers: 131000,
        engagement_rate: 5.1,
        fit_score: 91,
        est_sponsorship_usd: 2800,
        reason: 'High-converting founder audience and frequent buying-intent conversations.',
        profile_url: 'https://linkedin.com/in/nadia-pipeline',
        last_signal_at: '2026-02-17',
      },
      {
        niche_key: 'creator-commerce',
        name: 'Yuna Park',
        handle: '@yuna-launches',
        primary_network: 'Instagram',
        secondary_networks: 'YouTube,Meta',
        followers: 247000,
        engagement_rate: 7.4,
        fit_score: 95,
        est_sponsorship_usd: 3600,
        reason: 'Very responsive ecommerce audience with repeated product launch case studies.',
        profile_url: 'https://instagram.com/yuna-launches',
        last_signal_at: '2026-02-22',
      },
      {
        niche_key: 'ai-saas-b2b',
        name: 'Felix Renaud',
        handle: '@felix_revops',
        primary_network: 'X',
        secondary_networks: 'Meta,Substack',
        followers: 76000,
        engagement_rate: 5.6,
        fit_score: 87,
        est_sponsorship_usd: 1900,
        reason: 'Strong GTM operator audience and tactical case-study threads.',
        profile_url: 'https://x.com/felix_revops',
        last_signal_at: '2026-02-20',
      },
      {
        niche_key: 'deeptech-defense',
        name: 'Marta Klein',
        handle: '@marta_signalops',
        primary_network: 'Meta',
        secondary_networks: 'X,LinkedIn',
        followers: 54000,
        engagement_rate: 5.9,
        fit_score: 84,
        est_sponsorship_usd: 1500,
        reason: 'Defense operations community with high repeat interactions around field feedback.',
        profile_url: 'https://facebook.com/marta.signalops',
        last_signal_at: '2026-02-16',
      },
    ].forEach((row) => insertKol.run(row));
  }

  if (!tableHasData(conn, 'social_highlights')) {
    const insertSocial = conn.prepare(`
      INSERT INTO social_highlights (
        niche_key,
        network,
        author_name,
        author_handle,
        author_avatar_url,
        format,
        title,
        hook,
        metrics_json,
        impact_score,
        views,
        engagement_rate,
        url,
        published_at
      )
      VALUES (
        @niche_key,
        @network,
        @author_name,
        @author_handle,
        @author_avatar_url,
        @format,
        @title,
        @hook,
        @metrics_json,
        @impact_score,
        @views,
        @engagement_rate,
        @url,
        @published_at
      )
    `);

    [
      {
        niche_key: 'deeptech-defense',
        network: 'X',
        author_name: 'Lena Voronin',
        author_handle: '@lena_dualuse',
        author_avatar_url: null,
        format: 'Thread',
        title: 'Why procurement delays kill robotics pilots before PMF',
        hook: 'Breakdown of 3 contract bottlenecks and how founders can de-risk them.',
        metrics_json: null,
        impact_score: 96,
        views: 412000,
        engagement_rate: 6.2,
        url: 'https://x.com/lena_dualuse/status/14001',
        published_at: '2026-02-18',
      },
      {
        niche_key: 'deeptech-defense',
        network: 'YouTube',
        author_name: 'Armand Leclerc',
        author_handle: '@ardent_systems',
        author_avatar_url: null,
        format: 'Video',
        title: 'Autonomous ISR stack: what investors miss in due diligence',
        hook: 'Annotated teardown with 5 traction metrics to track before Series A.',
        metrics_json: null,
        impact_score: 92,
        views: 138000,
        engagement_rate: 7.1,
        url: 'https://youtube.com/watch?v=deeptech01',
        published_at: '2026-02-21',
      },
      {
        niche_key: 'deeptech-defense',
        network: 'Instagram',
        author_name: 'Field Ops Weekly',
        author_handle: '@fieldopsweekly',
        author_avatar_url: null,
        format: 'Carousel',
        title: 'Deployment lessons from 12 real-world drone tests',
        hook: 'Visual checklist reused by multiple engineering teams.',
        metrics_json: null,
        impact_score: 88,
        views: 81000,
        engagement_rate: 8.9,
        url: 'https://instagram.com/p/deeptechops',
        published_at: '2026-02-19',
      },
      {
        niche_key: 'deeptech-defense',
        network: 'Meta',
        author_name: 'Marta Klein',
        author_handle: '@marta_signalops',
        author_avatar_url: null,
        format: 'Post',
        title: 'How teams cut test-loop time by 27% using mixed simulation',
        hook: 'Clear before-after table and operator quotes.',
        metrics_json: null,
        impact_score: 83,
        views: 59000,
        engagement_rate: 5.4,
        url: 'https://facebook.com/marta.signalops/posts/501',
        published_at: '2026-02-16',
      },
      {
        niche_key: 'ai-saas-b2b',
        network: 'X',
        author_name: 'Felix Renaud',
        author_handle: '@felix_revops',
        author_avatar_url: null,
        format: 'Thread',
        title: 'The 4-metric dashboard every AI sales team should show weekly',
        hook: 'Template included with definitions and benchmark ranges.',
        metrics_json: null,
        impact_score: 90,
        views: 229000,
        engagement_rate: 5.8,
        url: 'https://x.com/felix_revops/status/551',
        published_at: '2026-02-20',
      },
      {
        niche_key: 'creator-commerce',
        network: 'YouTube',
        author_name: 'Yuna Park',
        author_handle: '@yuna-launches',
        author_avatar_url: null,
        format: 'Video',
        title: 'From 0 to 120k in 7 days: launch system breakdown',
        hook: 'Exact posting cadence across YouTube and Instagram.',
        metrics_json: null,
        impact_score: 97,
        views: 468000,
        engagement_rate: 9.3,
        url: 'https://youtube.com/watch?v=creator120k',
        published_at: '2026-02-22',
      },
    ].forEach((row) => insertSocial.run(row));
  }

  if (!tableHasData(conn, 'substack_signals')) {
    const insertSubstack = conn.prepare(`
      INSERT INTO substack_signals (
        niche_key,
        publication,
        topic,
        angle,
        open_rate,
        ctr,
        growth_score,
        issue_url,
        published_at
      )
      VALUES (
        @niche_key,
        @publication,
        @topic,
        @angle,
        @open_rate,
        @ctr,
        @growth_score,
        @issue_url,
        @published_at
      )
    `);

    [
      {
        niche_key: 'deeptech-defense',
        publication: 'Dual-Use Briefing',
        topic: 'Public contracts that unlocked first 7-figure pilots',
        angle: 'Concrete contract pathways with timeline benchmarks.',
        open_rate: 58.4,
        ctr: 11.7,
        growth_score: 95,
        issue_url: 'https://dualusebriefing.substack.com/p/contracts-pilots',
        published_at: '2026-02-20',
      },
      {
        niche_key: 'deeptech-defense',
        publication: 'Operator Alpha',
        topic: 'Why field reliability stories beat pure performance claims',
        angle: 'Narratives tied to operator outcomes and uptime metrics.',
        open_rate: 54.1,
        ctr: 9.4,
        growth_score: 88,
        issue_url: 'https://operatoralpha.substack.com/p/field-reliability-stories',
        published_at: '2026-02-18',
      },
      {
        niche_key: 'ai-saas-b2b',
        publication: 'Pipeline Signals',
        topic: 'Pricing AI copilots when value is workflow compression',
        angle: 'Pricing ladders anchored on time-to-outcome metrics.',
        open_rate: 52.3,
        ctr: 10.2,
        growth_score: 91,
        issue_url: 'https://pipelinesignals.substack.com/p/pricing-ai-copilots',
        published_at: '2026-02-17',
      },
      {
        niche_key: 'creator-commerce',
        publication: 'Monetize Daily',
        topic: 'How creators package offers before audience plateaus',
        angle: 'Offer sequencing playbook with launch cadence examples.',
        open_rate: 61.8,
        ctr: 12.9,
        growth_score: 98,
        issue_url: 'https://monetizedaily.substack.com/p/offer-sequencing',
        published_at: '2026-02-21',
      },
      {
        niche_key: 'deeptech-defense',
        publication: 'Frontier GTM',
        topic: 'Positioning deep tech without leaking sensitive capabilities',
        angle: 'Messaging framework balancing compliance and demand generation.',
        open_rate: 50.6,
        ctr: 8.7,
        growth_score: 82,
        issue_url: 'https://frontiergtm.substack.com/p/positioning-without-leaks',
        published_at: '2026-02-15',
      },
    ].forEach((row) => insertSubstack.run(row));
  }
}
