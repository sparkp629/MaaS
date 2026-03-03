import crypto from 'node:crypto';
import { getDb } from './init.js';

function toNicheKey(input) {
  const raw = String(input || '').trim().toLowerCase();
  if (!raw) return null;
  if (raw.includes('-')) return raw;
  return raw
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function safeJsonParse(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function preview180(value) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= 180) return clean;
  return `${clean.slice(0, 177).trimEnd()}...`;
}

function randomToken(size = 16) {
  return crypto.randomBytes(size).toString('hex');
}

function mapTelegramRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userKey: row.user_key,
    linkToken: row.link_token,
    status: row.status,
    telegramChatId: row.telegram_chat_id,
    telegramUsername: row.telegram_username,
    minImpactScore: Number(row.min_impact_score || 70),
    networks: String(row.networks_csv || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    dailyDigest: Boolean(Number(row.daily_digest || 0)),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function resolveNiche(conn, requestedNiche) {
  const keyCandidate = toNicheKey(requestedNiche);

  if (keyCandidate) {
    const byKey = conn
      .prepare('SELECT key, label, description FROM niches WHERE key = ?')
      .get(keyCandidate);
    if (byKey) return byKey;

    const byLabel = conn
      .prepare('SELECT key, label, description FROM niches WHERE lower(label) = ?')
      .get(String(requestedNiche || '').trim().toLowerCase());
    if (byLabel) return byLabel;
  }

  const latestWorkspace = conn
    .prepare(
      `SELECT n.key, n.label, n.description
       FROM workspace_profiles w
       JOIN niches n ON n.key = w.niche_key
       ORDER BY w.id DESC
       LIMIT 1`
    )
    .get();

  if (latestWorkspace) return latestWorkspace;

  return conn
    .prepare('SELECT key, label, description FROM niches ORDER BY key ASC LIMIT 1')
    .get();
}

export function resolveNicheRecord(requestedNiche) {
  const conn = getDb();
  return resolveNiche(conn, requestedNiche);
}

export function listNiches() {
  const conn = getDb();
  return conn
    .prepare('SELECT key, label, description FROM niches ORDER BY label ASC')
    .all();
}

export function ensureNiche({ key, label, description = '' }) {
  const conn = getDb();
  const cleanKey = toNicheKey(key || label);
  if (!cleanKey) {
    throw new Error('A valid niche key or label is required.');
  }

  const cleanLabel = String(label || cleanKey)
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const existing = conn
    .prepare('SELECT key, label, description FROM niches WHERE key = ?')
    .get(cleanKey);

  if (existing) return existing;

  conn
    .prepare(
      `INSERT INTO niches (key, label, description)
       VALUES (?, ?, ?)`
    )
    .run(cleanKey, cleanLabel, String(description || '').trim() || null);

  return conn
    .prepare('SELECT key, label, description FROM niches WHERE key = ?')
    .get(cleanKey);
}

export function saveWorkspaceProfile({ nicheKey, objective, budgetRange }) {
  const conn = getDb();
  const niche = resolveNiche(conn, nicheKey);
  const insert = conn.prepare(`
    INSERT INTO workspace_profiles (niche_key, objective, budget_range)
    VALUES (?, ?, ?)
  `);

  const result = insert.run(
    niche.key,
    String(objective || '').trim() || null,
    String(budgetRange || '').trim() || null
  );

  return {
    id: result.lastInsertRowid,
    niche,
    objective: String(objective || '').trim() || null,
    budgetRange: String(budgetRange || '').trim() || null,
  };
}

export function upsertKolCandidate({
  nicheKey,
  name,
  handle,
  primaryNetwork,
  secondaryNetworks = [],
  followers = 0,
  engagementRate = 0,
  fitScore = 0,
  estSponsorshipUsd = 0,
  reason = null,
  profileUrl = null,
  lastSignalAt = null,
}) {
  const conn = getDb();

  const existing = conn
    .prepare(
      `SELECT id
       FROM kol_candidates
       WHERE niche_key = ? AND handle = ? AND primary_network = ?`
    )
    .get(nicheKey, handle, primaryNetwork);

  const secondaryNetworksCsv = Array.isArray(secondaryNetworks)
    ? secondaryNetworks.join(',')
    : String(secondaryNetworks || '');

  if (existing?.id) {
    conn
      .prepare(
        `UPDATE kol_candidates
         SET name = ?,
             secondary_networks = ?,
             followers = ?,
             engagement_rate = ?,
             fit_score = ?,
             est_sponsorship_usd = ?,
             reason = ?,
             profile_url = ?,
             last_signal_at = ?
         WHERE id = ?`
      )
      .run(
        name,
        secondaryNetworksCsv,
        Number(followers || 0),
        Number(engagementRate || 0),
        Number(fitScore || 0),
        Number(estSponsorshipUsd || 0),
        reason,
        profileUrl,
        lastSignalAt,
        existing.id
      );
    return { id: existing.id, updated: true };
  }

  const inserted = conn
    .prepare(
      `INSERT INTO kol_candidates (
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      nicheKey,
      name,
      handle,
      primaryNetwork,
      secondaryNetworksCsv,
      Number(followers || 0),
      Number(engagementRate || 0),
      Number(fitScore || 0),
      Number(estSponsorshipUsd || 0),
      reason,
      profileUrl,
      lastSignalAt
    );

  return { id: inserted.lastInsertRowid, updated: false };
}

export function upsertSocialHighlight({
  nicheKey,
  network,
  authorName,
  authorHandle = null,
  authorAvatarUrl = null,
  format = null,
  title,
  hook = null,
  metrics = null,
  impactScore = 0,
  views = 0,
  engagementRate = 0,
  url = null,
  publishedAt = null,
}) {
  const conn = getDb();

  let existing = null;

  if (url) {
    existing = conn
      .prepare(
        `SELECT id
         FROM social_highlights
         WHERE niche_key = ? AND network = ? AND url = ?`
      )
      .get(nicheKey, network, url);
  } else {
    existing = conn
      .prepare(
        `SELECT id
         FROM social_highlights
         WHERE niche_key = ? AND network = ? AND title = ? AND author_name = ?`
      )
      .get(nicheKey, network, title, authorName);
  }

  if (existing?.id) {
    conn
      .prepare(
        `UPDATE social_highlights
         SET author_handle = ?,
             author_avatar_url = ?,
             format = ?,
             hook = ?,
             metrics_json = ?,
             impact_score = ?,
             views = ?,
             engagement_rate = ?,
             published_at = ?,
             url = ?
         WHERE id = ?`
      )
      .run(
        authorHandle,
        authorAvatarUrl,
        format,
        hook,
        metrics ? JSON.stringify(metrics) : null,
        Number(impactScore || 0),
        Number(views || 0),
        Number(engagementRate || 0),
        publishedAt,
        url,
        existing.id
      );
    return { id: existing.id, updated: true };
  }

  const inserted = conn
    .prepare(
      `INSERT INTO social_highlights (
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      nicheKey,
      network,
      authorName,
      authorHandle,
      authorAvatarUrl,
      format,
      title,
      hook,
      metrics ? JSON.stringify(metrics) : null,
      Number(impactScore || 0),
      Number(views || 0),
      Number(engagementRate || 0),
      url,
      publishedAt
    );

  return { id: inserted.lastInsertRowid, updated: false };
}

export function upsertSubstackSignal({
  nicheKey,
  publication,
  topic,
  angle = null,
  openRate = 0,
  ctr = 0,
  growthScore = 0,
  issueUrl,
  publishedAt = null,
}) {
  const conn = getDb();
  const existing = conn
    .prepare(
      `SELECT id
       FROM substack_signals
       WHERE niche_key = ? AND issue_url = ?`
    )
    .get(nicheKey, issueUrl);

  if (existing?.id) {
    conn
      .prepare(
        `UPDATE substack_signals
         SET publication = ?,
             topic = ?,
             angle = ?,
             open_rate = ?,
             ctr = ?,
             growth_score = ?,
             published_at = ?
         WHERE id = ?`
      )
      .run(
        publication,
        topic,
        angle,
        Number(openRate || 0),
        Number(ctr || 0),
        Number(growthScore || 0),
        publishedAt,
        existing.id
      );
    return { id: existing.id, updated: true };
  }

  const inserted = conn
    .prepare(
      `INSERT INTO substack_signals (
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      nicheKey,
      publication,
      topic,
      angle,
      Number(openRate || 0),
      Number(ctr || 0),
      Number(growthScore || 0),
      issueUrl,
      publishedAt
    );

  return { id: inserted.lastInsertRowid, updated: false };
}

export function getKolMatches(nicheKey) {
  const conn = getDb();
  return conn
    .prepare(
      `SELECT
        id,
        name,
        handle,
        primary_network AS primaryNetwork,
        secondary_networks AS secondaryNetworks,
        followers,
        engagement_rate AS engagementRate,
        fit_score AS fitScore,
        est_sponsorship_usd AS estSponsorshipUsd,
        reason,
        profile_url AS profileUrl,
        last_signal_at AS lastSignalAt
      FROM kol_candidates
      WHERE niche_key = ?
      ORDER BY fit_score DESC, engagement_rate DESC
      LIMIT 8`
    )
    .all(nicheKey)
    .map((row) => ({
      ...row,
      secondaryNetworks: String(row.secondaryNetworks || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    }));
}

export function getSocialHighlights(nicheKey) {
  const conn = getDb();
  return conn
    .prepare(
      `SELECT
        id,
        network,
        author_name AS authorName,
        author_handle AS authorHandle,
        author_avatar_url AS authorAvatarUrl,
        format,
        title,
        hook,
        metrics_json AS metricsJson,
        impact_score AS impactScore,
        views,
        engagement_rate AS engagementRate,
        url,
        published_at AS publishedAt
      FROM social_highlights
      WHERE niche_key = ?
      ORDER BY impact_score DESC, views DESC
      LIMIT 50`
    )
    .all(nicheKey)
    .map((row) => ({
      ...row,
      metrics: safeJsonParse(row.metricsJson),
      preview: preview180(row.hook || row.title),
    }));
}

export function getSubstackSignals(nicheKey) {
  const conn = getDb();
  return conn
    .prepare(
      `SELECT
        id,
        publication,
        topic,
        angle,
        open_rate AS openRate,
        ctr,
        growth_score AS growthScore,
        issue_url AS issueUrl,
        published_at AS publishedAt
      FROM substack_signals
      WHERE niche_key = ?
      ORDER BY growth_score DESC, open_rate DESC
      LIMIT 10`
    )
    .all(nicheKey);
}

function summarizeSocialByNetwork(socialRows) {
  const bucket = new Map();

  socialRows.forEach((row) => {
    const key = row.network;
    const existing = bucket.get(key) || {
      network: key,
      contentCount: 0,
      totalImpact: 0,
      avgEngagement: 0,
    };

    existing.contentCount += 1;
    existing.totalImpact += Number(row.impactScore || 0);
    existing.avgEngagement += Number(row.engagementRate || 0);
    bucket.set(key, existing);
  });

  return Array.from(bucket.values())
    .map((row) => ({
      ...row,
      avgImpact: Math.round(row.totalImpact / Math.max(1, row.contentCount)),
      avgEngagement: Number((row.avgEngagement / Math.max(1, row.contentCount)).toFixed(1)),
    }))
    .sort((a, b) => b.avgImpact - a.avgImpact);
}

export function getCommercialOffer() {
  return {
    coreOffer: {
      name: 'Signal-to-Deal Sprint',
      promise:
        'Find the best-fit KOLs and replicate top social and Substack angles in one weekly workflow.',
      outcome:
        'In 7 days: 5 qualified KOL targets, 20 high-impact content references, 10 winning newsletter angles.',
      guarantee:
        'If no qualified KOL shortlist is delivered, next sprint is free.',
    },
    plans: [
      {
        id: 'starter',
        name: 'Starter',
        monthlyUsd: 149,
        target: 'Solo founder',
        features: [
          '1 niche workspace',
          'Top 5 KOL matches refreshed weekly',
          'Top social winners on X/YouTube/Instagram/Meta',
          'Top 5 Substack topics by growth score',
        ],
      },
      {
        id: 'growth',
        name: 'Growth',
        monthlyUsd: 399,
        target: 'Growth team',
        features: [
          '3 niche workspaces',
          'Daily refresh and impact scoring',
          'Outreach-ready KOL shortlist with estimated sponsorship costs',
          'Substack topic tracker with open-rate and CTR benchmark',
        ],
        highlighted: true,
      },
      {
        id: 'scale',
        name: 'Scale',
        monthlyUsd: 990,
        target: 'Agency or portfolio studio',
        features: [
          '10 niche workspaces',
          'Priority data refresh and analyst support',
          'Competitive watchlist and signal alerts',
          'Executive reporting for clients and partners',
        ],
      },
    ],
    upsells: [
      {
        name: 'Done-for-you KOL Outreach Pack',
        priceUsd: 300,
        value: 'Personalized outreach angles and first-contact scripts for each shortlisted KOL.',
      },
      {
        name: 'Weekly Topic Radar',
        priceUsd: 120,
        value: 'Extra Substack and social trend digest every Monday.',
      },
      {
        name: 'Launch Burst Add-on',
        priceUsd: 450,
        value: '14-day campaign blueprint with posting sequence and KPI targets.',
      },
    ],
  };
}

export function getDashboardSnapshot(requestedNiche) {
  const conn = getDb();
  const niche = resolveNiche(conn, requestedNiche);

  const kolMatches = getKolMatches(niche.key);
  const socialHighlights = getSocialHighlights(niche.key);
  const substackSignals = getSubstackSignals(niche.key);

  const avgFitScore = kolMatches.length
    ? Math.round(
        kolMatches.reduce((acc, row) => acc + Number(row.fitScore || 0), 0) /
          kolMatches.length
      )
    : 0;

  const avgImpactScore = socialHighlights.length
    ? Math.round(
        socialHighlights.reduce((acc, row) => acc + Number(row.impactScore || 0), 0) /
          socialHighlights.length
      )
    : 0;

  const avgOpenRate = substackSignals.length
    ? Number(
        (
          substackSignals.reduce((acc, row) => acc + Number(row.openRate || 0), 0) /
          substackSignals.length
        ).toFixed(1)
      )
    : 0;

  const topXPosts = socialHighlights
    .filter((item) => item.network === 'X')
    .slice(0, 8);

  const topYouTubeVideos = socialHighlights
    .filter((item) => item.network === 'YouTube')
    .slice(0, 8);

  return {
    generatedAt: new Date().toISOString(),
    niche,
    summary: {
      kolCandidates: kolMatches.length,
      avgKolFitScore: avgFitScore,
      socialWinners: socialHighlights.length,
      avgSocialImpact: avgImpactScore,
      substackWinners: substackSignals.length,
      avgSubstackOpenRate: avgOpenRate,
    },
    networkBreakdown: summarizeSocialByNetwork(socialHighlights),
    kolMatches,
    socialHighlights,
    topXPosts,
    topYouTubeVideos,
    substackSignals,
    commercialOffer: getCommercialOffer(),
  };
}

export function getOrCreateTelegramAlertConnection(userKeyInput) {
  const conn = getDb();
  const userKey = String(userKeyInput || '').trim().toLowerCase();
  if (!userKey) {
    throw new Error('userKey is required.');
  }

  const existing = conn
    .prepare(
      `SELECT *
       FROM telegram_alert_connections
       WHERE user_key = ?`
    )
    .get(userKey);

  if (existing) {
    if (!existing.link_token) {
      const token = randomToken(16);
      conn
        .prepare(
          `UPDATE telegram_alert_connections
           SET link_token = ?, updated_at = datetime('now')
           WHERE id = ?`
        )
        .run(token, existing.id);

      const refreshed = conn
        .prepare(`SELECT * FROM telegram_alert_connections WHERE id = ?`)
        .get(existing.id);
      return mapTelegramRow(refreshed);
    }

    return mapTelegramRow(existing);
  }

  const token = randomToken(16);
  const inserted = conn
    .prepare(
      `INSERT INTO telegram_alert_connections (
        user_key,
        link_token,
        status,
        min_impact_score,
        networks_csv,
        daily_digest
      )
      VALUES (?, ?, 'pending', 70, 'X,YouTube', 1)`
    )
    .run(userKey, token);

  const created = conn
    .prepare(`SELECT * FROM telegram_alert_connections WHERE id = ?`)
    .get(inserted.lastInsertRowid);

  return mapTelegramRow(created);
}

export function updateTelegramAlertConnection(userKeyInput, config = {}) {
  const conn = getDb();
  const current = getOrCreateTelegramAlertConnection(userKeyInput);

  const minImpactScore = Number.isFinite(Number(config.minImpactScore))
    ? Math.max(1, Math.min(99, Number(config.minImpactScore)))
    : current.minImpactScore;

  const networksCsv = Array.isArray(config.networks) && config.networks.length
    ? config.networks.map((item) => String(item || '').trim()).filter(Boolean).join(',')
    : current.networks.join(',');

  const dailyDigest = config.dailyDigest == null
    ? current.dailyDigest
    : Boolean(config.dailyDigest);

  conn
    .prepare(
      `UPDATE telegram_alert_connections
       SET min_impact_score = ?,
           networks_csv = ?,
           daily_digest = ?,
           updated_at = datetime('now')
       WHERE user_key = ?`
    )
    .run(minImpactScore, networksCsv, dailyDigest ? 1 : 0, current.userKey);

  const updated = conn
    .prepare(`SELECT * FROM telegram_alert_connections WHERE user_key = ?`)
    .get(current.userKey);
  return mapTelegramRow(updated);
}

export function connectTelegramChatByToken({ linkToken, chatId, username = null }) {
  const conn = getDb();
  const token = String(linkToken || '').trim();
  if (!token) {
    throw new Error('linkToken is required.');
  }

  const existing = conn
    .prepare(
      `SELECT *
       FROM telegram_alert_connections
       WHERE link_token = ?`
    )
    .get(token);

  if (!existing) {
    throw new Error('Unknown Telegram link token.');
  }

  const cleanChatId = String(chatId || '').trim();
  if (!cleanChatId) {
    throw new Error('chatId is required.');
  }

  conn
    .prepare(
      `UPDATE telegram_alert_connections
       SET telegram_chat_id = ?,
           telegram_username = ?,
           status = 'connected',
           updated_at = datetime('now')
       WHERE id = ?`
    )
    .run(cleanChatId, username ? String(username) : null, existing.id);

  const updated = conn
    .prepare(`SELECT * FROM telegram_alert_connections WHERE id = ?`)
    .get(existing.id);
  return mapTelegramRow(updated);
}
