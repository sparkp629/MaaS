/**
 * KOL Scoring Service
 * 
 * Algorithme de scoring des Key Opinion Leaders basé sur 10 variables pondérées.
 * Le score final (Compatibility Score) est sur 100.
 * 
 * VARIABLES ET PONDÉRATIONS:
 * 1. Taux d'engagement technique    (0.18) - Engagement spécifique aux sujets techniques
 * 2. Impressions moyennes (proxy)    (0.20) - Portée mesurable via API X (impressions)
 * 3. Ratio technique/promotionnel    (0.12) - Authenticité du contenu
 * 4. Autorité de niche               (0.10) - Reconnaissance dans la niche
 * 5. Overlap d'audience              (0.10) - Correspondance avec l'audience cible
 * 6. Vélocité de croissance          (0.08) - Dynamique de croissance
 * 7. Score de sentiment              (0.08) - Positivité de l'audience
 * 8. Fréquence de publication        (0.05) - Régularité du contenu
 * 9. Rétention d'audience            (0.05) - Fidélité de l'audience
 * 10. Diversité des formats          (0.04) - Variété du contenu
 */

const WEIGHTS = {
  avg_engagement_rate: 0.18,
  impressions_avg: 0.20,
  tech_promo_ratio: 0.12,
  niche_authority: 0.10,
  audience_overlap: 0.10,
  growth_velocity: 0.08,
  sentiment_score: 0.08,
  publish_frequency: 0.05,
  audience_retention: 0.05,
  format_diversity: 0.04,
};

// Normalisation des valeurs sur une échelle 0-100
const NORMALIZATION = {
  avg_engagement_rate: { min: 0, max: 20 },      // % engagement
  impressions_avg: { min: 0, max: 100000 },        // impressions/post (via API X)
  tech_promo_ratio: { min: 0, max: 1 },            // ratio 0-1
  niche_authority: { min: 0, max: 100 },           // score 0-100
  audience_overlap: { min: 0, max: 0.5 },          // inversé: moins = mieux (unique audience)
  growth_velocity: { min: 0, max: 50 },            // % croissance mensuelle
  sentiment_score: { min: 0, max: 100 },           // score 0-100
  publish_frequency: { min: 0, max: 10 },          // posts/semaine
  audience_retention: { min: 0, max: 100 },        // % rétention
  format_diversity: { min: 0, max: 1 },            // ratio 0-1
};

function normalize(value, key) {
  const { min, max } = NORMALIZATION[key];
  // L'overlap est inversé: un faible overlap = audience unique = meilleur score
  if (key === 'audience_overlap') {
    return Math.max(0, Math.min(100, ((max - value) / (max - min)) * 100));
  }
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

/**
 * Calcule le score de compatibilité d'un KOL
 */
function getKolValue(kol, key) {
  let val = kol[key];
  if (key === 'impressions_avg' && (val === undefined || val === null) && kol.conversion_rate != null) {
    return kol.conversion_rate * 5000;
  }
  return val ?? 0;
}

function calculateCompatibilityScore(kol) {
  let score = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    const normalizedValue = normalize(getKolValue(kol, key), key);
    score += normalizedValue * weight;
  }
  return Math.round(score * 10) / 10;
}

/**
 * Calcule les scores pour tous les KOLs et met à jour la DB
 */
function scoreAllKOLs(db) {
  const kols = db.prepare('SELECT * FROM kols').all();
  const update = db.prepare('UPDATE kols SET compatibility_score = ? WHERE id = ?');

  const results = kols.map(kol => {
    const score = calculateCompatibilityScore(kol);
    update.run(score, kol.id);
    return { ...kol, compatibility_score: score };
  });

  return results.sort((a, b) => b.compatibility_score - a.compatibility_score);
}

/**
 * Détecte les Micro-KOLs (< 10k followers) à fort impact
 */
function detectMicroKOLs(db) {
  const kols = scoreAllKOLs(db);
  return kols
    .filter(k => k.followers < 10000)
    .sort((a, b) => b.compatibility_score - a.compatibility_score)
    .map(k => ({
      ...k,
      impact_ratio: Math.round((k.compatibility_score / (k.followers / 1000)) * 100) / 100,
      label: k.compatibility_score > 80 ? 'Pépite cachée' :
             k.compatibility_score > 65 ? 'Fort potentiel' : 'À surveiller'
    }));
}

/**
 * Score un KOL pour un produit SaaS spécifique
 */
function scoreKOLForProduct(kol, productNiche) {
  let baseScore = calculateCompatibilityScore(kol);

  // Bonus de correspondance de niche (+15% max)
  if (kol.niche && kol.niche.toLowerCase().includes(productNiche.toLowerCase())) {
    baseScore = Math.min(100, baseScore * 1.15);
  }

  return Math.round(baseScore * 10) / 10;
}

/**
 * Retourne les détails du scoring pour un KOL
 */
function getScoreBreakdown(kol) {
  const breakdown = {};
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    const rawVal = getKolValue(kol, key);
    const normalized = normalize(rawVal, key);
    breakdown[key] = {
      raw_value: rawVal,
      normalized: Math.round(normalized * 10) / 10,
      weight: weight,
      weighted_score: Math.round(normalized * weight * 10) / 10,
      label: getVariableLabel(key),
    };
  }
  return breakdown;
}

function getVariableLabel(key) {
  const labels = {
    avg_engagement_rate: 'Taux d\'engagement technique',
    impressions_avg: 'Impressions moyennes (API X)',
    tech_promo_ratio: 'Ratio contenu tech/promo',
    niche_authority: 'Autorité de niche',
    audience_overlap: 'Unicité de l\'audience',
    growth_velocity: 'Vélocité de croissance',
    sentiment_score: 'Sentiment de l\'audience',
    publish_frequency: 'Fréquence de publication',
    audience_retention: 'Rétention d\'audience',
    format_diversity: 'Diversité des formats',
  };
  return labels[key] || key;
}

module.exports = {
  calculateCompatibilityScore,
  scoreAllKOLs,
  detectMicroKOLs,
  scoreKOLForProduct,
  getScoreBreakdown,
  WEIGHTS,
};
