/**
 * Mindshare Index Service
 * 
 * Agrège des données disparates (vues X, LinkedIn, newsletter, etc.)
 * en un score unique: le Mindshare Index (0-100).
 * 
 * COMPOSANTES ET PONDÉRATIONS:
 * - Portée X/Twitter (impressions + engagement)    : 25%
 * - Performance Newsletter (opens + CTR)            : 20%
 * - Portée YouTube (vues)                           : 15%
 * - Portée LinkedIn (impressions + engagement, profils authentiques) : 10%
 * - Portée Twitch (viewers)                         : 5%
 * - Mentions de marque                              : 12%
 * - Sentiment global                                : 13%
 */

const MINDSHARE_WEIGHTS = {
  twitter_score: 0.25,
  newsletter_score: 0.20,
  youtube_score: 0.15,
  linkedin_score: 0.10,
  twitch_score: 0.05,
  mention_score: 0.12,
  sentiment_score: 0.13,
};

// Benchmarks pour normalisation (valeurs typiques pour un Micro-SaaS)
const BENCHMARKS = {
  twitter_impressions: { poor: 1000, good: 10000, excellent: 50000 },
  twitter_engagement: { poor: 1, good: 5, excellent: 12 },
  linkedin_impressions: { poor: 500, good: 5000, excellent: 25000 },
  linkedin_engagement: { poor: 0.5, good: 3, excellent: 8 },
  newsletter_opens: { poor: 200, good: 1500, excellent: 5000 },
  newsletter_ctr: { poor: 2, good: 10, excellent: 25 },
  youtube_views: { poor: 100, good: 2000, excellent: 10000 },
  twitch_viewers: { poor: 10, good: 100, excellent: 500 },
  brand_mentions: { poor: 1, good: 15, excellent: 50 },
  sentiment: { poor: 30, good: 65, excellent: 90 },
};

function normalizeToBenchmark(value, metric) {
  const bench = BENCHMARKS[metric];
  if (!bench) return 50;
  if (value <= bench.poor) return Math.max(0, (value / bench.poor) * 30);
  if (value <= bench.good) return 30 + ((value - bench.poor) / (bench.good - bench.poor)) * 40;
  if (value <= bench.excellent) return 70 + ((value - bench.good) / (bench.excellent - bench.good)) * 30;
  return 100;
}

/**
 * Calcule le Mindshare Index à partir de métriques brutes
 */
function calculateMindshareIndex(metrics) {
  // Score Twitter (impressions + engagement combinés)
  const twitterImpr = normalizeToBenchmark(metrics.twitter_impressions || 0, 'twitter_impressions');
  const twitterEng = normalizeToBenchmark(metrics.twitter_engagement || 0, 'twitter_engagement');
  const twitter_score = twitterImpr * 0.4 + twitterEng * 0.6;

  // Score Newsletter
  const nlOpens = normalizeToBenchmark(metrics.newsletter_opens || 0, 'newsletter_opens');
  const nlCtr = normalizeToBenchmark(metrics.newsletter_ctr || 0, 'newsletter_ctr');
  const newsletter_score = nlOpens * 0.4 + nlCtr * 0.6;

  // Score YouTube
  const youtube_score = normalizeToBenchmark(metrics.youtube_views || 0, 'youtube_views');

  // Score LinkedIn (profils authentiques, impressions + engagement)
  const linkedinImpr = normalizeToBenchmark(metrics.linkedin_impressions || 0, 'linkedin_impressions');
  const linkedinEng = normalizeToBenchmark(metrics.linkedin_engagement || 0, 'linkedin_engagement');
  const linkedin_score = linkedinImpr * 0.5 + linkedinEng * 0.5;

  // Score Twitch
  const twitch_score = normalizeToBenchmark(metrics.twitch_viewers || 0, 'twitch_viewers');

  // Score Mentions
  const mention_score = normalizeToBenchmark(metrics.brand_mentions || 0, 'brand_mentions');

  // Score Sentiment
  const sentiment_score = normalizeToBenchmark(metrics.sentiment || 0, 'sentiment');

  // Calcul final pondéré
  const index =
    twitter_score * MINDSHARE_WEIGHTS.twitter_score +
    newsletter_score * MINDSHARE_WEIGHTS.newsletter_score +
    youtube_score * MINDSHARE_WEIGHTS.youtube_score +
    linkedin_score * MINDSHARE_WEIGHTS.linkedin_score +
    twitch_score * MINDSHARE_WEIGHTS.twitch_score +
    mention_score * MINDSHARE_WEIGHTS.mention_score +
    sentiment_score * MINDSHARE_WEIGHTS.sentiment_score;

  return {
    mindshare_index: Math.round(index * 10) / 10,
    breakdown: {
      twitter: { score: Math.round(twitter_score * 10) / 10, weight: '25%', impressions: metrics.twitter_impressions, engagement: metrics.twitter_engagement },
      newsletter: { score: Math.round(newsletter_score * 10) / 10, weight: '20%', opens: metrics.newsletter_opens, ctr: metrics.newsletter_ctr },
      youtube: { score: Math.round(youtube_score * 10) / 10, weight: '15%', views: metrics.youtube_views },
      linkedin: { score: Math.round(linkedin_score * 10) / 10, weight: '10%', impressions: metrics.linkedin_impressions, engagement: metrics.linkedin_engagement },
      twitch: { score: Math.round(twitch_score * 10) / 10, weight: '5%', viewers: metrics.twitch_viewers },
      mentions: { score: Math.round(mention_score * 10) / 10, weight: '12%', count: metrics.brand_mentions },
      sentiment: { score: Math.round(sentiment_score * 10) / 10, weight: '13%', value: metrics.sentiment },
    },
    level: index >= 80 ? 'Dominant' : index >= 60 ? 'Fort' : index >= 40 ? 'Croissant' : index >= 20 ? 'Émergent' : 'Invisible',
    color: index >= 80 ? '#10b981' : index >= 60 ? '#6366f1' : index >= 40 ? '#f59e0b' : index >= 20 ? '#f97316' : '#ef4444',
  };
}

/**
 * Obtient l'historique du Mindshare Index pour une campagne
 */
function getMindshareHistory(db, campaignId) {
  const metrics = db.prepare(
    'SELECT * FROM mindshare_metrics WHERE campaign_id = ? ORDER BY date ASC'
  ).all(campaignId);

  return metrics.map(m => ({
    date: m.date,
    ...calculateMindshareIndex(m),
    raw: m,
  }));
}

/**
 * Obtient le dernier Mindshare Index d'une campagne
 */
function getLatestMindshare(db, campaignId) {
  const metric = db.prepare(
    'SELECT * FROM mindshare_metrics WHERE campaign_id = ? ORDER BY date DESC LIMIT 1'
  ).get(campaignId);

  if (!metric) return null;
  return calculateMindshareIndex(metric);
}

module.exports = {
  calculateMindshareIndex,
  getMindshareHistory,
  getLatestMindshare,
  MINDSHARE_WEIGHTS,
};
