/**
 * KOL Scoring — Conversion Capability Score (0–100)
 * Facteurs : technical sentiment, growth velocity, micro-KOL impact
 */

/** Normalisation 0–100 par paliers */
function norm(value, poor, good, excellent) {
  if (value <= 0) return 0;
  if (value <= poor) return (value / poor) * 30;
  if (value <= good) return 30 + ((value - poor) / (good - poor || 1)) * 40;
  return 70 + Math.min(30, ((value - good) / (excellent - good || 1)) * 30);
}

const WEIGHTS = {
  technicalSentiment: 0.4,
  growthVelocity: 0.35,
  microKOLImpact: 0.25,
};

/**
 * Calcule le Conversion Capability Score
 * @param {object} params
 * @param {number} params.technicalSentiment - 0–100 (alignement technique du contenu)
 * @param {number} params.growthVelocity - % croissance followers/mois
 * @param {number} params.followers - pour micro-KOL bonus (<10k)
 * @param {number} [params.engagementRate] - optionnel
 */
export function computeConversionScore({
  technicalSentiment = 0,
  growthVelocity = 0,
  followers = 0,
  engagementRate = 0,
}) {
  const sentimentScore = Math.min(100, technicalSentiment);
  const velocityScore = norm(growthVelocity, 1, 5, 15);
  const isMicroKOL = followers < 10000;
  const microBonus = isMicroKOL ? 15 : 0;
  const engBonus = Math.min(10, (engagementRate || 0) / 5);

  const raw =
    sentimentScore * WEIGHTS.technicalSentiment +
    velocityScore * WEIGHTS.growthVelocity +
    (microBonus + engBonus) * WEIGHTS.microKOLImpact;

  const value = Math.min(100, Math.max(0, raw + microBonus * 0.3));

  return {
    value: Math.round(value * 10) / 10,
    factors: {
      technicalSentiment: sentimentScore,
      growthVelocity: velocityScore,
      microKOLImpact: isMicroKOL ? microBonus : 0,
    },
    isMicroKOL,
  };
}
