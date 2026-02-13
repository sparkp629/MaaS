/**
 * Mindshare Index — formule composite
 * MI = (Engagement Rate × Audience Overlap) / Noise Factor
 * + variante multi-canaux (skill niche-scoring-logic)
 */

/** Paliers : poor / good / excellent → 0–100 */
function normalizeBenchmark(value, poor, good, excellent) {
  if (value <= 0) return 0;
  if (value <= poor) return Math.max(0, (value / poor) * 30);
  if (value <= good) return 30 + ((value - poor) / (good - poor || 1)) * 40;
  if (value <= excellent)
    return 70 + ((value - good) / (excellent - good || 1)) * 30;
  return Math.min(100, 100 + ((value - excellent) / (excellent || 1)) * 10);
}

const WEIGHTS = {
  twitter: 0.25,
  newsletter: 0.2,
  youtube: 0.15,
  linkedin: 0.1,
  twitch: 0.05,
  mentions: 0.12,
  sentiment: 0.13,
};

const THRESHOLDS = {
  impressions: { poor: 1e3, good: 1e4, excellent: 1e5 },
  engagementRate: { poor: 1, good: 5, excellent: 15 },
  opens: { poor: 20, good: 40, excellent: 60 },
  ctr: { poor: 1, good: 3, excellent: 8 },
  views: { poor: 500, good: 5e3, excellent: 5e4 },
  mentions: { poor: 1, good: 10, excellent: 50 },
};

function levelFromScore(score) {
  if (score >= 80) return 'Dominant';
  if (score >= 60) return 'Fort';
  if (score >= 40) return 'Croissant';
  if (score >= 20) return 'Émergent';
  return 'Invisible';
}

/**
 * MI simple : (Engagement × Overlap) / Noise
 * @param {object} params
 * @param {number} params.engagementRate - 0–100
 * @param {number} params.audienceOverlap - 0–100
 * @param {number} params.noiseFactor - >= 1 (plus élevé = plus de bruit)
 */
export function computeSimpleMI({ engagementRate, audienceOverlap, noiseFactor = 1 }) {
  const raw = (engagementRate * audienceOverlap) / (noiseFactor || 1);
  const value = Math.min(100, Math.max(0, raw));
  return {
    value: Math.round(value * 10) / 10,
    breakdown: { engagementRate, audienceOverlap, noiseFactor },
    level: levelFromScore(value),
  };
}

/**
 * MI multi-canaux (skill niche-scoring-logic)
 * @param {object} metrics - métriques par canal
 */
export function computeMultiChannelMI(metrics = {}) {
  const breakdown = {};
  let total = 0;

  if (metrics.twitter) {
    const impScore = normalizeBenchmark(
      metrics.twitter.impressions || 0,
      THRESHOLDS.impressions.poor,
      THRESHOLDS.impressions.good,
      THRESHOLDS.impressions.excellent
    );
    const engScore = normalizeBenchmark(
      metrics.twitter.engagementRate || 0,
      THRESHOLDS.engagementRate.poor,
      THRESHOLDS.engagementRate.good,
      THRESHOLDS.engagementRate.excellent
    );
    breakdown.twitter = impScore * 0.4 + engScore * 0.6;
    total += breakdown.twitter * WEIGHTS.twitter;
  }

  if (metrics.newsletter) {
    const opensScore = normalizeBenchmark(
      metrics.newsletter.opens || 0,
      THRESHOLDS.opens.poor,
      THRESHOLDS.opens.good,
      THRESHOLDS.opens.excellent
    );
    const ctrScore = normalizeBenchmark(
      metrics.newsletter.ctr || 0,
      THRESHOLDS.ctr.poor,
      THRESHOLDS.ctr.good,
      THRESHOLDS.ctr.excellent
    );
    breakdown.newsletter = opensScore * 0.4 + ctrScore * 0.6;
    total += breakdown.newsletter * WEIGHTS.newsletter;
  }

  if (metrics.youtube?.views != null) {
    breakdown.youtube = normalizeBenchmark(
      metrics.youtube.views,
      THRESHOLDS.views.poor,
      THRESHOLDS.views.good,
      THRESHOLDS.views.excellent
    );
    total += breakdown.youtube * WEIGHTS.youtube;
  }

  if (metrics.linkedin) {
    const impScore = normalizeBenchmark(
      metrics.linkedin.impressions || 0,
      THRESHOLDS.impressions.poor,
      THRESHOLDS.impressions.good,
      THRESHOLDS.impressions.excellent
    );
    const engScore = normalizeBenchmark(
      metrics.linkedin.engagementRate || 0,
      THRESHOLDS.engagementRate.poor,
      THRESHOLDS.engagementRate.good,
      THRESHOLDS.engagementRate.excellent
    );
    breakdown.linkedin = impScore * 0.5 + engScore * 0.5;
    total += breakdown.linkedin * WEIGHTS.linkedin;
  }

  if (metrics.mentions != null) {
    breakdown.mentions = normalizeBenchmark(
      metrics.mentions,
      THRESHOLDS.mentions.poor,
      THRESHOLDS.mentions.good,
      THRESHOLDS.mentions.excellent
    );
    total += breakdown.mentions * WEIGHTS.mentions;
  }

  if (metrics.sentiment != null) {
    breakdown.sentiment = Math.min(100, metrics.sentiment);
    total += breakdown.sentiment * WEIGHTS.sentiment;
  }

  const finalValue = Math.round(Math.min(100, total) * 10) / 10;

  return {
    value: finalValue,
    breakdown: { ...breakdown, engagementRate: breakdown.twitter ?? 0, audienceOverlap: 50, noiseFactor: 1 },
    level: levelFromScore(finalValue),
  };
}

export { levelFromScore, normalizeBenchmark };
