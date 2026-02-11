/**
 * Market Analysis Service
 * 
 * Analyse le marché actuel pour un SaaS dans une niche donnée.
 * Identifie les opportunités de contenu (newsletters, threads X, etc.)
 * 
 * Sources de données:
 * - Base de données locale (données enrichies)
 * - Apify API (scraping si configuré)
 * - Twitter API v2 (si configuré)
 */

/**
 * Récupère l'analyse de marché pour une niche
 */
function getMarketAudit(db, niche = null) {
  if (niche) {
    return db.prepare(
      'SELECT * FROM market_audits WHERE LOWER(niche) = LOWER(?) ORDER BY trending_score DESC'
    ).all(niche);
  }
  return db.prepare('SELECT * FROM market_audits ORDER BY trending_score DESC').all();
}

/**
 * Récupère les segments Micro-SaaS identifiés
 */
function getSegments(db) {
  return db.prepare('SELECT * FROM segments ORDER BY opportunity_score DESC').all();
}

/**
 * Récupère les faiblesses des concurrents
 */
function getCompetitorWeaknesses(db) {
  return db.prepare('SELECT * FROM competitor_weaknesses ORDER BY severity DESC').all();
}

/**
 * Analyse le potentiel d'une niche
 */
function analyzeNichePotential(db, niche) {
  const audits = getMarketAudit(db, niche);

  if (audits.length === 0) {
    return {
      niche,
      status: 'no_data',
      message: 'Aucune donnée disponible pour cette niche. Lancez un scan Apify.',
    };
  }

  const avgTrending = audits.reduce((s, a) => s + a.trending_score, 0) / audits.length;
  const totalReach = audits.reduce((s, a) => s + a.potential_reach, 0);
  const lowCompetition = audits.filter(a => a.competition_level === 'faible').length;

  const opportunityTypes = {};
  audits.forEach(a => {
    opportunityTypes[a.opportunity_type] = (opportunityTypes[a.opportunity_type] || 0) + 1;
  });

  return {
    niche,
    status: 'analyzed',
    summary: {
      total_opportunities: audits.length,
      avg_trending_score: Math.round(avgTrending * 10) / 10,
      total_potential_reach: totalReach,
      low_competition_count: lowCompetition,
      opportunity_types: opportunityTypes,
    },
    top_opportunities: audits.slice(0, 5),
    recommendation: avgTrending > 85 
      ? 'Niche très chaude — action immédiate recommandée'
      : avgTrending > 70 
        ? 'Niche prometteuse — stratégie de contenu à planifier'
        : 'Niche stable — approche long-terme conseillée',
  };
}

/**
 * Génère l'offre irrésistible MaaS basée sur l'analyse des concurrents
 */
function generateIrresistibleOffer(db) {
  const weaknesses = getCompetitorWeaknesses(db);

  return {
    title: 'L\'Offre Irrésistible MaaS',
    subtitle: 'La première agence de Mindshare basée sur la performance pour l\'écosystème SaaS',
    problems_solved: weaknesses.map(w => ({
      problem: w.weakness,
      solution: w.maas_solution,
      severity: w.severity,
    })),
    pricing_model: {
      name: 'Performance-First',
      description: 'Vous ne payez que pour les résultats mesurables',
      tiers: [
        {
          name: 'Starter',
          price: '997€/mois + 5% du revenue influenced',
          includes: ['Audit de niche complet', '3 Micro-KOLs matchés', '12 contenus/mois', 'Dashboard Mindshare Index', 'Rapport hebdomadaire'],
          best_for: 'Early-stage SaaS (<$10k MRR)',
        },
        {
          name: 'Growth',
          price: '2,497€/mois + 3% du revenue influenced',
          includes: ['Tout Starter +', '8 KOLs matchés (micro + mid)', '30 contenus/mois', 'Content Orchestrator automatisé', 'Attribution multi-touch', 'A/B testing de hooks'],
          best_for: 'SaaS en croissance ($10k-$50k MRR)',
          featured: true,
        },
        {
          name: 'Scale',
          price: '4,997€/mois + 2% du revenue influenced',
          includes: ['Tout Growth +', '20+ KOLs multi-plateforme', 'Contenus illimités', 'Campagnes YouTube + Twitch', 'Account manager dédié', 'Stratégie mindshare trimestrielle'],
          best_for: 'SaaS établi ($50k+ MRR)',
        },
      ],
    },
    guarantees: [
      'ROI positif garanti sous 90 jours ou remboursement intégral',
      'Transparence totale: accès dashboard temps réel',
      'Aucun engagement long-terme: résiliable mensuellement',
    ],
    urgency: {
      message: 'Places limitées: nous n\'acceptons que 5 nouveaux clients par mois pour garantir la qualité',
      social_proof: '23 SaaS accompagnés | +340% Mindshare Index moyen | $2.4M revenue influenced',
    },
  };
}

/**
 * Calcule le ROI estimé pour un client
 */
function calculateEstimatedROI(budget, niche, campaignDuration = 3) {
  // Facteurs de multiplication basés sur la niche
  const nicheMultipliers = {
    'AI Tools': 3.8,
    'Code Generation': 4.2,
    'SEO': 3.1,
    'Productivity': 2.9,
    'NoCode': 2.5,
    'DevOps': 3.5,
    'Analytics': 3.0,
    'default': 2.8,
  };

  const multiplier = nicheMultipliers[niche] || nicheMultipliers.default;
  const estimatedRevenue = budget * multiplier * (campaignDuration / 3);
  const roi = ((estimatedRevenue - budget) / budget) * 100;

  return {
    budget,
    niche,
    duration_months: campaignDuration,
    estimated_revenue: Math.round(estimatedRevenue),
    roi_percent: Math.round(roi),
    multiplier,
    breakdown: {
      month_1: Math.round(estimatedRevenue * 0.2),
      month_2: Math.round(estimatedRevenue * 0.35),
      month_3: Math.round(estimatedRevenue * 0.45),
    },
    comparison: {
      traditional_ads_roi: Math.round(roi * 0.3),
      generic_agency_roi: Math.round(roi * 0.5),
      maas_roi: Math.round(roi),
    },
  };
}

module.exports = {
  getMarketAudit,
  getSegments,
  getCompetitorWeaknesses,
  analyzeNichePotential,
  generateIrresistibleOffer,
  calculateEstimatedROI,
};
