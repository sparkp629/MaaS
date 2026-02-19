import { Router } from 'express';
import Stripe from 'stripe';
import { orchestrate, orchestrateWithAI } from '../services/contentOrchestrator.js';
import {
  createSuggestion,
  getRoiSummary,
  upsertKolMetric,
  upsertContent,
  getKolMetrics,
  trackClick,
  trackImpression,
  listContents,
  deleteContent,
} from '../db/dal.js';
import { rateLimitSuggestions } from '../middleware/rateLimit.js';
import * as xClient from '../services/xClient.js';
import * as youtubeClient from '../services/youtubeClient.js';
import * as linkedinClient from '../services/linkedinClient.js';
import * as metaClient from '../services/metaClient.js';
import * as tiktokClient from '../services/tiktokClient.js';
import { computeMultiChannelMI } from '../services/mindshareIndex.js';
import { computeConversionScore } from '../services/kolScoring.js';
import { checkOnce as runAvailabilityCheck } from '../services/availabilityChecker.js';

const router = Router();
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

function levelFromScore(score) {
  if (score >= 80) return 'Dominant';
  if (score >= 60) return 'Fort';
  if (score >= 40) return 'Croissant';
  if (score >= 20) return 'Émergent';
  return 'Invisible';
}

function parseExtra(extraJson) {
  if (!extraJson) return {};
  try {
    return JSON.parse(extraJson);
  } catch {
    return {};
  }
}

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`.replace(/\/$/, '').toLowerCase();
  } catch {
    return null;
  }
}

function toKolPreview(platform, row, extra) {
  if (platform === 'twitter') {
    return {
      twitter: {
        text: `Impressions moyennes : ${(extra.avgImpressions || row.impressions || 0).toLocaleString()} • ER ${row.engagement_rate || 0}%`,
        avatarUrl: null,
      },
    };
  }
  if (platform === 'youtube') {
    const firstVideo = Array.isArray(extra.recentVideos) ? extra.recentVideos[0] : null;
    return {
      youtube: {
        thumbnailUrl: firstVideo?.thumbnailUrl || null,
        avatarUrl: null,
      },
    };
  }
  if (platform === 'linkedin') {
    return {
      linkedin: {
        text: `Followers : ${(row.followers || 0).toLocaleString()} • Impressions : ${(row.impressions || 0).toLocaleString()}`,
      },
    };
  }
  return {};
}

function toDashboardKol(row) {
  const platform = row.platform || 'unknown';
  const extra = parseExtra(row.extra_json);
  const externalLinks = [
    ...(Array.isArray(extra.profileLinks) ? extra.profileLinks : []),
    ...(extra.channelUrl ? [extra.channelUrl] : []),
  ].filter((link, idx, arr) => arr.indexOf(link) === idx);
  const metrics = {
    mentions: Math.round((row.impressions || 0) / 1000),
    sentiment: Math.min(100, Math.round((row.engagement_rate || 0) * 8)),
  };

  if (platform === 'twitter') {
    metrics.twitter = { impressions: row.impressions || 0, engagementRate: row.engagement_rate || 0 };
  } else if (platform === 'youtube') {
    metrics.youtube = { views: row.views || row.impressions || 0 };
  } else if (platform === 'linkedin') {
    metrics.linkedin = { impressions: row.impressions || 0, engagementRate: row.engagement_rate || 0 };
  } else if (platform === 'newsletter') {
    metrics.newsletter = { opens: row.impressions || 0, ctr: row.engagement_rate || 0 };
  }

  const mi = computeMultiChannelMI(metrics);
  const conv = computeConversionScore({
    technicalSentiment: Math.min(100, Math.round((row.engagement_rate || 0) * 8)),
    growthVelocity: 0,
    followers: row.followers || 0,
    engagementRate: row.engagement_rate || 0,
  });

  return {
    id: `${platform}-${row.platform_user_id || row.id}`,
    handle: row.handle || `@${platform}_${row.platform_user_id || row.id}`,
    displayName: row.display_name || row.handle || `Compte ${platform}`,
    avatarUrl: null,
    followers: row.followers || 0,
    niche: platform.toUpperCase(),
    conversionScore: conv.value,
    mindshareIndex: mi.value,
    engagementRate: row.engagement_rate ? `${row.engagement_rate}%` : '—',
    isMicroKOL: conv.isMicroKOL,
    previews: toKolPreview(platform, row, extra),
    externalLinks,
  };
}

function getRealKols() {
  const metrics = getKolMetrics();
  return metrics.map(toDashboardKol);
}

function getRealDashboardSummary() {
  const kols = getRealKols();
  const avgMI = kols.length
    ? kols.reduce((sum, kol) => sum + (kol.mindshareIndex || 0), 0) / kols.length
    : 0;

  return {
    kolCount: kols.length,
    campaigns: [],
    mindshare: {
      value: Math.round(avgMI * 10) / 10,
      level: levelFromScore(avgMI),
    },
  };
}

function getRealIntelligenceSummary() {
  const metrics = getKolMetrics();
  const byPlatform = new Map();

  for (const row of metrics) {
    const key = row.platform || 'unknown';
    const current = byPlatform.get(key) || { platform: key, demandTotal: 0, count: 0 };
    const demandScore = Math.min(
      100,
      Math.round(
        (row.followers || 0) / 200 +
        (row.impressions || 0) / 2000 +
        (row.engagement_rate || 0) * 2
      )
    );
    current.demandTotal += demandScore;
    current.count += 1;
    byPlatform.set(key, current);
  }

  const segments = Array.from(byPlatform.values())
    .map((item) => ({
      id: item.platform,
      name: `Canal ${item.platform.toUpperCase()}`,
      demand: Math.round(item.demandTotal / Math.max(1, item.count)),
      growth: 0,
      label: `Canal ${item.platform.toUpperCase()} — demande ${(item.demandTotal / Math.max(1, item.count)).toFixed(1)}/100`,
    }))
    .sort((a, b) => b.demand - a.demand)
    .slice(0, 5);

  return {
    segments,
    competitors: [],
    dimensions: [],
  };
}

function getKolMesh() {
  const rows = getKolMetrics('youtube');
  const nodes = rows.map((row) => {
    const extra = parseExtra(row.extra_json);
    const links = Array.isArray(extra.profileLinks) ? extra.profileLinks : [];
    const channelUrl = extra.channelUrl || null;
    return {
      id: `youtube-${row.platform_user_id || row.id}`,
      platformUserId: row.platform_user_id || null,
      handle: row.handle || null,
      displayName: row.display_name || row.handle || null,
      channelUrl,
      links,
    };
  });

  const nodeByUrl = new Map();
  for (const node of nodes) {
    if (node.channelUrl) {
      const key = normalizeUrl(node.channelUrl);
      if (key) nodeByUrl.set(key, node.id);
    }
  }

  const edges = [];
  for (const node of nodes) {
    for (const link of node.links) {
      const target = nodeByUrl.get(normalizeUrl(link));
      if (target && target !== node.id) {
        edges.push({
          from: node.id,
          to: target,
          type: 'youtube_to_youtube',
          link,
        });
      }
    }
  }

  return { nodes, edges };
}

router.get('/dashboard', (_, res) => {
  res.json(getRealDashboardSummary());
});

router.get('/kol', (_, res) => {
  res.json(getRealKols());
});

router.get('/intelligence', (_, res) => {
  res.json(getRealIntelligenceSummary());
});

router.get('/kol/mesh', (_, res) => {
  res.json(getKolMesh());
});

router.get('/roi', (_, res) => {
  res.json(getRoiSummary());
});

router.post('/content/generate', async (req, res) => {
  const { productName, productDescription, niche, tone, useAI } = req.body || {};
  if (!productName) {
    return res.status(400).json({ error: 'productName requis' });
  }
  try {
    let result;
    if (useAI !== false) {
      // Par défaut, essaie l'IA — fallback templates si pas configuré
      result = await orchestrateWithAI(
        productName,
        productDescription || '',
        niche || '',
        tone || 'informatif'
      );
    } else {
      result = orchestrate(
        productName,
        productDescription || '',
        niche || '',
        tone || 'informatif'
      );
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/suggestions', rateLimitSuggestions, (req, res) => {
  const { text } = req.body || {};
  if (!text?.trim()) {
    return res.status(400).json({ error: 'text requis' });
  }
  try {
    const ipHash = req.ip ? Buffer.from(req.ip).toString('base64').slice(0, 32) : null;
    const { id } = createSuggestion(text, ipHash);
    res.json({ ok: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/checkout/create-session', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({
      error: 'Paiement non configuré. Définissez STRIPE_SECRET_KEY.',
    });
  }
  const { priceId, successUrl, cancelUrl } = req.body || {};
  const pid = priceId || process.env.STRIPE_PRICE_ID;
  if (!pid) {
    return res.status(400).json({ error: 'priceId ou STRIPE_PRICE_ID requis' });
  }
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: pid, quantity: 1 }],
      success_url: successUrl || `${req.headers.origin || ''}/checkout/success`,
      cancel_url: cancelUrl || `${req.headers.origin || ''}/checkout`,
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- KOL Metrics (données réelles) ---

router.get('/kol/metrics', (_, res) => {
  try {
    const metrics = getKolMetrics();
    res.json(metrics);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/kol/metrics/:platform', (req, res) => {
  try {
    const metrics = getKolMetrics(req.params.platform);
    res.json(metrics);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Fetch & store X (Twitter) KOL metrics
router.post('/kol/fetch/x', async (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: 'username requis (sans @)' });
  if (!xClient.isConfigured()) {
    return res.status(503).json({ error: 'X_BEARER_TOKEN non configuré. Ajoutez-le dans .env' });
  }
  try {
    const data = await xClient.fetchKolMetrics(username.replace('@', ''));
    const result = upsertKolMetric({
      platform: data.platform,
      platformUserId: data.platformUserId,
      handle: data.handle,
      displayName: data.displayName,
      followers: data.followers,
      impressions: data.impressions,
      engagementRate: data.engagementRate,
      views: 0,
      subscribers: 0,
      extra: { tweetCount: data.tweetCount, avgImpressions: data.avgImpressions },
    });
    // register profile URL for monitoring
    try {
      const profileUrl = data.handle ? `https://x.com/${data.handle.replace(/^@/, '')}` : null;
      if (profileUrl) upsertContent({ platform: 'x', platformContentId: data.platformUserId, url: profileUrl, extra: { source: 'profile' } });
    } catch (e) {
      console.warn('[upsertContent] x profile insert failed', e && e.message ? e.message : e);
    }
    res.json({ ...data, dbResult: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Fetch & store YouTube KOL metrics
router.post('/kol/fetch/youtube', async (req, res) => {
  const { channelId } = req.body || {};
  if (!channelId) return res.status(400).json({ error: 'channelId requis (UC..., @handle ou URL)' });
  if (!youtubeClient.isConfigured()) {
    return res.status(503).json({ error: 'YOUTUBE_API_KEY non configuré. Ajoutez-le dans .env' });
  }
  try {
    const data = await youtubeClient.fetchKolMetrics(channelId);
    const result = upsertKolMetric({
      platform: data.platform,
      platformUserId: data.platformUserId,
      handle: data.handle,
      displayName: data.displayName,
      followers: data.subscribers,
      impressions: data.totalViews,
      engagementRate: 0,
      views: data.views,
      subscribers: data.subscribers,
      extra: {
        videoCount: data.videoCount,
        recentVideos: data.recentVideos,
        profileLinks: data.profileLinks || [],
        profileDescription: data.profileDescription || '',
        channelUrl: data.channelUrl || null,
      },
    });
    // register channel url and recent videos for monitoring
    try {
      const channelUrl = data.channelUrl || (data.handle ? `https://www.youtube.com/${data.handle.replace(/^@/, '')}` : null);
      if (channelUrl) upsertContent({ platform: 'youtube', platformContentId: data.platformUserId, url: channelUrl, extra: { source: 'channel' } });
      if (Array.isArray(data.recentVideos)) {
        for (const v of data.recentVideos) {
          if (v.videoId) upsertContent({ platform: 'youtube', platformContentId: `${data.platformUserId}:${v.videoId}`, url: `https://www.youtube.com/watch?v=${v.videoId}`, extra: { source: 'video' } });
        }
      }
    } catch (e) {
      console.warn('[upsertContent] youtube insert failed', e && e.message ? e.message : e);
    }
    res.json({ ...data, dbResult: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/kol/fetch/youtube/batch', async (req, res) => {
  const { channels } = req.body || {};
  if (!Array.isArray(channels) || channels.length === 0) {
    return res.status(400).json({ error: 'channels requis (tableau de @handle, URL ou ID)' });
  }
  if (!youtubeClient.isConfigured()) {
    return res.status(503).json({ error: 'YOUTUBE_API_KEY non configuré. Ajoutez-le dans .env' });
  }

  const results = [];
  for (const rawRef of channels) {
    const ref = String(rawRef || '').trim();
    if (!ref) {
      results.push({ ref, ok: false, error: 'Référence vide' });
      continue;
    }
    try {
      const data = await youtubeClient.fetchKolMetrics(ref);
      const dbResult = upsertKolMetric({
        platform: data.platform,
        platformUserId: data.platformUserId,
        handle: data.handle,
        displayName: data.displayName,
        followers: data.subscribers,
        impressions: data.totalViews,
        engagementRate: 0,
        views: data.views,
        subscribers: data.subscribers,
        extra: {
          videoCount: data.videoCount,
          recentVideos: data.recentVideos,
          profileLinks: data.profileLinks || [],
          profileDescription: data.profileDescription || '',
          channelUrl: data.channelUrl || null,
        },
      });
      // register channel url
      try {
        const channelUrl = data.channelUrl || (data.handle ? `https://www.youtube.com/${data.handle.replace(/^@/, '')}` : null);
        if (channelUrl) upsertContent({ platform: 'youtube', platformContentId: data.platformUserId, url: channelUrl, extra: { source: 'channel' } });
      } catch (e) {
        console.warn('[upsertContent] youtube batch insert failed', e && e.message ? e.message : e);
      }
      results.push({
        ref,
        ok: true,
        platformUserId: data.platformUserId,
        handle: data.handle,
        displayName: data.displayName,
        subscribers: data.subscribers,
        profileLinks: data.profileLinks || [],
        channelUrl: data.channelUrl || null,
        dbResult,
      });
    } catch (error) {
      results.push({ ref, ok: false, error: error.message });
    }
  }

  const okCount = results.filter((item) => item.ok).length;
  res.json({
    okCount,
    errorCount: results.length - okCount,
    results,
  });
});

// Fetch & store LinkedIn KOL metrics
router.post('/kol/fetch/linkedin', async (req, res) => {
  const { accessToken, organizationId } = req.body || {};
  if (!organizationId) return res.status(400).json({ error: 'organizationId requis (urn:li:organization:...)' });
  if (!accessToken) return res.status(400).json({ error: 'accessToken LinkedIn requis' });
  if (!linkedinClient.isConfigured()) {
    return res.status(503).json({ error: 'LinkedIn non configuré. Ajoutez LINKEDIN_CLIENT_ID et LINKEDIN_CLIENT_SECRET dans .env' });
  }
  try {
    const data = await linkedinClient.fetchKolMetrics(accessToken, organizationId);
    const result = upsertKolMetric({
      platform: data.platform,
      platformUserId: data.platformUserId,
      handle: data.handle || organizationId,
      displayName: data.displayName || organizationId,
      followers: data.followers || 0,
      impressions: data.impressions || 0,
      engagementRate: data.engagementRate || 0,
      views: data.views || 0,
      subscribers: 0,
      extra: data.extra || null,
    });
    // register linkedin org URL
    try {
      const orgId = data.platformUserId;
      const idPart = String(orgId || '').split(':').pop();
      if (idPart) upsertContent({ platform: 'linkedin', platformContentId: orgId, url: `https://www.linkedin.com/company/${idPart}`, extra: { source: 'organization' } });
    } catch (e) {
      console.warn('[upsertContent] linkedin insert failed', e && e.message ? e.message : e);
    }
    res.json({ ...data, dbResult: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Fetch & store Meta (Facebook/Instagram) KOL metrics
router.post('/kol/fetch/meta', async (req, res) => {
  const { accessToken, pageId } = req.body || {};
  if (!pageId) return res.status(400).json({ error: 'pageId requis' });
  if (!accessToken) return res.status(400).json({ error: 'accessToken Meta requis' });
  if (!metaClient.isConfigured()) {
    return res.status(503).json({ error: 'Meta non configuré. Ajoutez META_APP_ID et META_APP_SECRET dans .env' });
  }
  try {
    const data = await metaClient.fetchKolMetrics(accessToken, pageId);
    const result = upsertKolMetric({
      platform: data.platform,
      platformUserId: data.platformUserId,
      handle: data.handle || pageId,
      displayName: data.displayName || pageId,
      followers: data.followers || 0,
      impressions: data.impressions || 0,
      engagementRate: data.engagementRate || 0,
      views: data.views || 0,
      subscribers: 0,
      extra: data.extra || null,
    });
    // register meta page URL
    try {
      const pageId = data.platformUserId;
      if (pageId) upsertContent({ platform: 'meta', platformContentId: pageId, url: `https://www.facebook.com/${pageId}`, extra: { source: 'page' } });
    } catch (e) {
      console.warn('[upsertContent] meta insert failed', e && e.message ? e.message : e);
    }
    res.json({ ...data, dbResult: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Fetch & store TikTok KOL metrics
router.post('/kol/fetch/tiktok', async (req, res) => {
  const { accessToken, userId } = req.body || {};
  if (!accessToken) return res.status(400).json({ error: 'accessToken TikTok requis' });
  if (!userId) return res.status(400).json({ error: 'userId TikTok requis' });
  if (!tiktokClient.isConfigured()) {
    return res.status(503).json({ error: 'TikTok non configuré. Ajoutez TIKTOK_CLIENT_KEY et TIKTOK_CLIENT_SECRET dans .env' });
  }
  try {
    const data = await tiktokClient.fetchKolMetrics(accessToken, userId);
    const result = upsertKolMetric({
      platform: data.platform,
      platformUserId: data.platformUserId,
      handle: data.handle || userId,
      displayName: data.displayName || userId,
      followers: data.followers || 0,
      impressions: data.impressions || 0,
      engagementRate: data.engagementRate || 0,
      views: data.views || 0,
      subscribers: 0,
      extra: data.extra || null,
    });
    // register tiktok profile URL if available
    try {
      const handle = data.handle || null;
      if (handle) {
        const h = String(handle).replace(/^@/, '').trim();
        if (h) upsertContent({ platform: 'tiktok', platformContentId: data.platformUserId, url: `https://www.tiktok.com/@${h}`, extra: { source: 'profile' } });
      }
    } catch (e) {
      console.warn('[upsertContent] tiktok insert failed', e && e.message ? e.message : e);
    }
    res.json({ ...data, dbResult: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- API status (quelles APIs sont configurées) ---

router.get('/status/apis', (_, res) => {
  res.json({
    x: xClient.isConfigured(),
    youtube: youtubeClient.isConfigured(),
    stripe: !!stripe,
    supabase: !!(process.env.URL_SUPABASE && (process.env.API_KEY_SUPABASE || process.env.PUBLISHABLE_KEY_SUPABASE || process.env.VITE_SUPABASE_ANON_KEY)),
    linkedin: !!(process.env.LINKEDIN_CLIENT_ID),
    meta: !!(process.env.META_APP_ID),
    tiktok: !!(process.env.TIKTOK_CLIENT_KEY),
  });
});

// --- Tracking (clics / impressions réels) ---

router.get('/track/:campaignId', (req, res) => {
  const { campaignId } = req.params;
  const { kol, source, redirect } = req.query;
  try {
    trackClick(campaignId, kol || null, source || 'link');
    if (redirect) {
      return res.redirect(redirect);
    }
    // Pixel transparent 1x1
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    res.send(pixel);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/track/impression', (req, res) => {
  const { campaignId, kolId, source, count } = req.body || {};
  if (!campaignId) return res.status(400).json({ error: 'campaignId requis' });
  try {
    const result = trackImpression(campaignId, kolId, source || 'api', count || 1);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Admin: run availability checker on-demand ---
router.post('/admin/run-availability-check', async (req, res) => {
  const adminKey = req.headers['x-admin-key'] || req.body?.adminKey || req.query?.adminKey || null;
  if (process.env.ADMIN_API_KEY) {
    if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'admin key manquante ou invalide' });
    }
  } else {
    console.warn('[admin] ADMIN_API_KEY not set; endpoint open (dev only)');
  }

  try {
    const result = await runAvailabilityCheck({ dbClient: null });
    return res.json({ ok: true, result });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// List tracked contents (admin)
router.get('/admin/contents', (req, res) => {
  const adminKey = req.headers['x-admin-key'] || req.query?.adminKey || null;
  if (process.env.ADMIN_API_KEY && adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'admin key manquante ou invalide' });
  }
  try {
    const page = parseInt(req.query.page || '0', 10);
    const limit = Math.min(1000, parseInt(req.query.limit || '200', 10));
    const items = listContents(limit, page * limit);
    return res.json({ ok: true, items });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Delete a tracked content
router.delete('/admin/contents/:id', (req, res) => {
  const adminKey = req.headers['x-admin-key'] || req.query?.adminKey || null;
  if (process.env.ADMIN_API_KEY && adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'admin key manquante ou invalide' });
  }
  try {
    const id = parseInt(req.params.id, 10);
    deleteContent(id);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Validate admin API key (used by frontend to confirm key before showing Admin link)
router.get('/admin/validate', (req, res) => {
  const provided = req.headers['x-admin-key'] || req.query?.adminKey || null;
  if (!process.env.ADMIN_API_KEY) {
    return res.json({ ok: false, note: 'ADMIN_API_KEY not configured' });
  }
  if (provided && provided === process.env.ADMIN_API_KEY) {
    return res.json({ ok: true });
  }
  return res.json({ ok: false });
});

export { router as apiRouter };
