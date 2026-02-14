import { Router } from 'express';
import Stripe from 'stripe';
import { getDashboardSummary, getSampleKOLs } from '../db/samples.js';
import { orchestrate, orchestrateWithAI } from '../services/contentOrchestrator.js';
import { getIntelligenceSummary } from '../services/marketAnalysis.js';
import {
  createSuggestion,
  getRoiSummary,
  upsertKolMetric,
  getKolMetrics,
  trackClick,
  trackImpression,
} from '../db/dal.js';
import { rateLimitSuggestions } from '../middleware/rateLimit.js';
import * as xClient from '../services/xClient.js';
import * as youtubeClient from '../services/youtubeClient.js';

const router = Router();
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

router.get('/dashboard', (_, res) => {
  res.json(getDashboardSummary());
});

router.get('/kol', (_, res) => {
  res.json(getSampleKOLs());
});

router.get('/intelligence', (_, res) => {
  res.json(getIntelligenceSummary());
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
    res.json({ ...data, dbResult: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Fetch & store YouTube KOL metrics
router.post('/kol/fetch/youtube', async (req, res) => {
  const { channelId } = req.body || {};
  if (!channelId) return res.status(400).json({ error: 'channelId requis (UC... ou nom)' });
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
      extra: { videoCount: data.videoCount, recentVideos: data.recentVideos },
    });
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
    supabase: !!(process.env.URL_SUPABASE && process.env.API_KEY_SUPABASE),
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

export { router as apiRouter };
