const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const { getMarketAudit, getSegments, getCompetitorWeaknesses, analyzeNichePotential, generateIrresistibleOffer, calculateEstimatedROI } = require('../services/marketAnalysis');
const { scoreAllKOLs, detectMicroKOLs, getScoreBreakdown, calculateCompatibilityScore, WEIGHTS } = require('../services/kolScoring');
const { calculateMindshareIndex, getMindshareHistory, getLatestMindshare, MINDSHARE_WEIGHTS } = require('../services/mindshareIndex');
const { extractHook, generateXContent, generateShortContent, generateFullCampaign, TONE_PROFILES, CONTENT_TEMPLATES } = require('../services/contentOrchestrator');

function enrichKol(kol) {
  const username = (kol.handle || '').replace(/^@/, '');
  const platform = kol.primary_platform || kol.platform || 'twitter';
  const avatarSource = platform === 'twitter' ? 'twitter' : platform === 'youtube' ? 'youtube' : 'twitter';
  return {
    ...kol,
    primary_platform: platform,
    avatar_url: kol.avatar_url || `https://unavatar.io/${avatarSource}/${username}`,
    x_url: kol.x_url || `https://x.com/${username}`,
    youtube_url: kol.youtube_url || `https://youtube.com/@${username}`,
    twitch_url: kol.twitch_url || `https://twitch.tv/${username}`,
  };
}

// ===== DASHBOARD OVERVIEW =====
router.get('/dashboard', (req, res) => {
  const db = req.app.locals.db;
  try {
    const kols = scoreAllKOLs(db);
    const campaigns = db.prepare('SELECT * FROM campaigns').all();
    const segments = getSegments(db);

    // Métriques globales
    const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
    const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
    const avgROI = campaigns.length > 0
      ? campaigns.reduce((s, c) => s + c.roi_percent, 0) / campaigns.length : 0;

    // Dernier Mindshare Index
    const latestMindshare = campaigns.map(c => ({
      campaign: c.product_name,
      ...getLatestMindshare(db, c.id),
    })).filter(m => m.mindshare_index);

    res.json({
      overview: {
        total_kols: kols.length,
        active_campaigns: campaigns.filter(c => c.status === 'active').length,
        total_impressions: totalImpressions,
        total_conversions: totalConversions,
        avg_roi: Math.round(avgROI),
        segments_tracked: segments.length,
      },
      top_kols: kols.slice(0, 5).map(k => ({
        id: k.id, name: k.name, handle: k.handle,
        platform: k.platform, followers: k.followers,
        score: k.compatibility_score,
      })),
      campaigns: campaigns.map(c => ({
        id: c.id, client: c.client_name, product: c.product_name,
        status: c.status, mindshare_index: c.mindshare_index,
        impressions: c.impressions, conversions: c.conversions,
        roi: c.roi_percent,
      })),
      mindshare_latest: latestMindshare,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== MARKET AUDIT =====
router.get('/market/audit', (req, res) => {
  const db = req.app.locals.db;
  const { niche } = req.query;
  try {
    const audits = getMarketAudit(db, niche);
    res.json({ audits, total: audits.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/market/audit/:niche', (req, res) => {
  const db = req.app.locals.db;
  try {
    const analysis = analyzeNichePotential(db, req.params.niche);
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== SEGMENTS =====
router.get('/segments', (req, res) => {
  const db = req.app.locals.db;
  try {
    const segments = getSegments(db);
    res.json({ segments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== COMPETITOR WEAKNESSES =====
router.get('/competitors/weaknesses', (req, res) => {
  const db = req.app.locals.db;
  try {
    const weaknesses = getCompetitorWeaknesses(db);
    res.json({ weaknesses, total: weaknesses.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== IRRESISTIBLE OFFER =====
router.get('/offer', (req, res) => {
  const db = req.app.locals.db;
  try {
    const offer = generateIrresistibleOffer(db);
    res.json(offer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== KOL SCORING =====
router.get('/kols', (req, res) => {
  const db = req.app.locals.db;
  try {
    const kols = scoreAllKOLs(db).map(enrichKol);
    res.json({
      kols,
      scoring_variables: Object.entries(WEIGHTS).map(([key, weight]) => ({
        key,
        weight,
        weight_percent: `${Math.round(weight * 100)}%`,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/kols/micro', (req, res) => {
  const db = req.app.locals.db;
  try {
    const microKols = detectMicroKOLs(db).map(enrichKol);
    res.json({ micro_kols: microKols, total: microKols.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/kols/:id/breakdown', (req, res) => {
  const db = req.app.locals.db;
  try {
    const kol = db.prepare('SELECT * FROM kols WHERE id = ?').get(req.params.id);
    if (!kol) return res.status(404).json({ error: 'KOL non trouvé' });
    const enriched = enrichKol({ ...kol, compatibility_score: calculateCompatibilityScore(kol) });

    const breakdown = getScoreBreakdown(kol);
    res.json({ kol: enriched, breakdown });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== MINDSHARE INDEX =====
router.get('/mindshare/:campaignId', (req, res) => {
  const db = req.app.locals.db;
  try {
    const history = getMindshareHistory(db, req.params.campaignId);
    const latest = getLatestMindshare(db, req.params.campaignId);
    res.json({
      campaign_id: parseInt(req.params.campaignId),
      latest,
      history,
      weights: MINDSHARE_WEIGHTS,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== CAMPAIGNS =====
router.get('/campaigns', (req, res) => {
  const db = req.app.locals.db;
  try {
    const campaigns = db.prepare('SELECT * FROM campaigns').all();
    res.json({ campaigns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/campaigns/:id', (req, res) => {
  const db = req.app.locals.db;
  try {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campagne non trouvée' });

    const mindshare = getLatestMindshare(db, campaign.id);
    const history = getMindshareHistory(db, campaign.id);

    res.json({ campaign, mindshare, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== CONTENT ORCHESTRATOR =====
router.post('/content/generate', (req, res) => {
  const db = req.app.locals.db;
  const { product_name, product_description, niche, kol_ids } = req.body;

  try {
    if (!product_name || !niche) {
      return res.status(400).json({ error: 'product_name et niche requis' });
    }

    let kolProfiles;
    if (kol_ids && kol_ids.length > 0) {
      const placeholders = kol_ids.map(() => '?').join(',');
      kolProfiles = db.prepare(`SELECT * FROM kols WHERE id IN (${placeholders})`).all(...kol_ids);
    } else {
      kolProfiles = scoreAllKOLs(db).slice(0, 3);
    }

    const campaign = generateFullCampaign(
      product_name,
      product_description || '',
      niche,
      kolProfiles
    );

    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/content/tones', (req, res) => {
  res.json({ tones: TONE_PROFILES, templates: CONTENT_TEMPLATES });
});

// ===== CLIENT ROI =====
router.get('/roi/estimate', (req, res) => {
  const { budget, niche, duration } = req.query;
  try {
    const estimation = calculateEstimatedROI(
      parseFloat(budget) || 3000,
      niche || 'AI Tools',
      parseInt(duration) || 3
    );
    res.json(estimation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/roi/campaign/:id', (req, res) => {
  const db = req.app.locals.db;
  try {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campagne non trouvée' });

    const roi = {
      campaign: campaign.product_name,
      budget: campaign.budget,
      revenue_generated: campaign.revenue_generated,
      roi_percent: campaign.roi_percent,
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      conversions: campaign.conversions,
      cost_per_conversion: campaign.budget / Math.max(campaign.conversions, 1),
      revenue_per_conversion: campaign.revenue_generated / Math.max(campaign.conversions, 1),
      funnel: {
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        click_rate: Math.round((campaign.clicks / Math.max(campaign.impressions, 1)) * 10000) / 100,
        conversions: campaign.conversions,
        conversion_rate: Math.round((campaign.conversions / Math.max(campaign.clicks, 1)) * 10000) / 100,
      },
    };

    res.json(roi);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== SUGGESTIONS (Anonymes) =====
router.post('/suggestions', (req, res) => {
  const db = req.app.locals.db;
  const { content, category } = req.body;

  if (!content || content.trim().length < 10) {
    return res.status(400).json({ error: 'La suggestion doit faire au moins 10 caractères' });
  }

  try {
    // Fingerprint anonyme: hash de IP + User-Agent
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const ua = req.headers['user-agent'] || 'unknown';
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${ip}::${ua}`)
      .digest('hex')
      .substring(0, 16);

    // Rate limiting: max 3 suggestions par fingerprint par jour
    const today = new Date().toISOString().split('T')[0];
    const count = db.prepare(
      `SELECT COUNT(*) as c FROM suggestions WHERE fingerprint = ? AND date(created_at) = ?`
    ).get(fingerprint, today).c;

    if (count >= 3) {
      return res.status(429).json({ error: 'Limite de suggestions atteinte pour aujourd\'hui (max 3)' });
    }

    db.prepare(
      'INSERT INTO suggestions (fingerprint, content, category) VALUES (?, ?, ?)'
    ).run(fingerprint, content.trim(), category || 'general');

    res.json({
      success: true,
      message: 'Suggestion envoyée anonymement. Merci !',
      remaining_today: 3 - count - 1,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/suggestions/stats', (req, res) => {
  const db = req.app.locals.db;
  try {
    const total = db.prepare('SELECT COUNT(*) as c FROM suggestions').get().c;
    const byCategory = db.prepare(
      'SELECT category, COUNT(*) as count FROM suggestions GROUP BY category ORDER BY count DESC'
    ).all();
    const recent = db.prepare(
      'SELECT content, category, created_at FROM suggestions ORDER BY created_at DESC LIMIT 10'
    ).all();

    res.json({ total, by_category: byCategory, recent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ARCHITECTURE INFO =====
router.get('/architecture', (req, res) => {
  res.json({
    stack: {
      frontend: 'React 18 + Vite + Tailwind CSS + Recharts',
      backend: 'Node.js + Express',
      database: 'SQLite (local) / Supabase (production)',
      apis: {
        twitter_v2: {
          endpoints: [
            'GET /2/tweets/search/recent - Recherche de tweets récents',
            'GET /2/users/:id/tweets - Timeline d\'un utilisateur',
            'GET /2/tweets/:id - Détails d\'un tweet (impressions, engagement)',
            'GET /2/users/:id/followers - Liste des followers',
            'GET /2/tweets/counts/recent - Volume de tweets sur un sujet',
          ],
          status: process.env.TWITTER_BEARER_TOKEN ? 'configured' : 'not_configured',
          docs: 'https://developer.twitter.com/en/docs/twitter-api',
        },
        apify: {
          usage: 'Scraping de données web (profils, métriques publiques)',
          status: process.env.APIFY_TOKEN ? 'configured' : 'not_configured',
          docs: 'https://docs.apify.com/api/v2',
          cost: '~$49/mois (plan Starter - 100 Actor runs)',
        },
        supabase: {
          usage: 'Base de données PostgreSQL + Auth + Realtime',
          status: process.env.SUPABASE_URL ? 'configured' : 'not_configured',
          docs: 'https://supabase.com/docs',
          cost: 'Gratuit (jusqu\'à 500MB) / $25/mois (Pro)',
        },
      },
      alternatives_economiques: {
        scraping: 'Crawlee (open-source gratuit) au lieu d\'Apify ($49/mois)',
        database: 'SQLite (gratuit) pour MVP, Supabase free tier pour prod',
        analytics: 'Plausible self-hosted (gratuit) au lieu de GA4',
        email: 'Resend ($0 pour 3000 emails/mois) au lieu de SendGrid',
      },
    },
  });
});

module.exports = router;
