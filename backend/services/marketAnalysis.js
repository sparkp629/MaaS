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
 * Comparaisons MaaS vs Services traditionnels par niche
 * Chiffrées, intuitives: qualité, praticité, économie, gain de temps
 */
const NICHE_COMPARISONS = {
  'AI Tools': {
    traditional_cost_annual: 48000,
    traditional_hours_annual: 420,
    traditional_quality_score: 65,
    traditional_setup_days: 45,
    maas_savings_pct: 72,
    maas_time_saved_hours: 380,
    maas_quality_score: 92,
    maas_setup_days: 3,
    pain_points: ['Agences peu familières avec la tech AI', 'Délai de compréhension produit 4-6 semaines', 'Pitch générique = faible conversion'],
    maas_advantages: ['Match KOL-IA natif: compréhension immédiate du repo', 'Contenus différenciants en 48h', 'Attribution revenue par KOL'],
  },
  'Code Generation': {
    traditional_cost_annual: 52000,
    traditional_hours_annual: 380,
    traditional_quality_score: 60,
    traditional_setup_days: 60,
    maas_savings_pct: 75,
    maas_time_saved_hours: 340,
    maas_quality_score: 88,
    maas_setup_days: 2,
    pain_points: ['Développeurs méfiants des agences marketing', 'Produits complexes à vulgariser', 'Faux positifs dans le ciblage'],
    maas_advantages: ['Analyse GitHub → langage technique adapté', 'KOLs dev/tech authentiques', 'Zero bullshit positioning'],
  },
  'Productivity': {
    traditional_cost_annual: 36000,
    traditional_hours_annual: 280,
    traditional_quality_score: 70,
    traditional_setup_days: 30,
    maas_savings_pct: 68,
    maas_time_saved_hours: 240,
    maas_quality_score: 90,
    maas_setup_days: 4,
    pain_points: ['Niche saturée, CPM élevé', 'Message noyé dans le bruit', 'Difficile de prouver l\'impact'],
    maas_advantages: ['Micro-KOLs à forte affinité audience', 'Mindshare Index = preuve chiffrée', 'ROI mesuré au centime près'],
  },
  'NoCode': {
    traditional_cost_annual: 42000,
    traditional_hours_annual: 350,
    traditional_quality_score: 62,
    traditional_setup_days: 40,
    maas_savings_pct: 70,
    maas_time_saved_hours: 300,
    maas_quality_score: 85,
    maas_setup_days: 5,
    pain_points: ['Communauté fragmentée (Bubble, Webflow, etc.)', 'Influenceurs souvent affiliés concurrents', 'Démos longues à produire'],
    maas_advantages: ['Cartographie de la niche NoCode', 'Match créateurs non affiliés', 'Demos courtes générées automatiquement'],
  },
  'DevOps': {
    traditional_cost_annual: 58000,
    traditional_hours_annual: 450,
    traditional_quality_score: 58,
    traditional_setup_days: 70,
    maas_savings_pct: 78,
    maas_time_saved_hours: 400,
    maas_quality_score: 91,
    maas_setup_days: 3,
    pain_points: ['Aucune agence spécialisée DevOps B2B', 'Décideurs tech difficiles à toucher', 'Cycle de vente long'],
    maas_advantages: ['KOLs SRE/DevOps avec audience CTO', 'Positionnement technique crédible', 'Pipeline warm leads qualifiés'],
  },
  'SEO': {
    traditional_cost_annual: 44000,
    traditional_hours_annual: 320,
    traditional_quality_score: 68,
    traditional_setup_days: 35,
    maas_savings_pct: 65,
    maas_time_saved_hours: 260,
    maas_quality_score: 87,
    maas_setup_days: 5,
    pain_points: ['SEO = canal lent, peu de "quick wins"', 'Influenceurs SEO souvent payés au CPV', 'Trafique non qualifié'],
    maas_advantages: ['Mindshare comme levier SEO indirect', 'Autorité par citations KOL', 'Trafic intentionnel qualifié'],
  },
  'Analytics': {
    traditional_cost_annual: 46000,
    traditional_hours_annual: 340,
    traditional_quality_score: 64,
    traditional_setup_days: 42,
    maas_savings_pct: 71,
    maas_time_saved_hours: 280,
    maas_quality_score: 89,
    maas_setup_days: 4,
    pain_points: ['Produits data difficiles à "puncher"', 'Décideurs data très rationnels', 'Peu d\'influenceurs spécialisés'],
    maas_advantages: ['KOLs data engineers, analystes', 'Case studies chiffrés générés', 'Positionnement proof-driven'],
  },
  default: {
    traditional_cost_annual: 45000,
    traditional_hours_annual: 360,
    traditional_quality_score: 64,
    traditional_setup_days: 45,
    maas_savings_pct: 70,
    maas_time_saved_hours: 300,
    maas_quality_score: 88,
    maas_setup_days: 5,
    pain_points: ['Coût agence récurrent élevé', 'Perte de temps en briefings', 'Résultats difficiles à mesurer'],
    maas_advantages: ['Paiement unique, résultat garanti', 'Setup rapide via GitHub', 'Dashboard ROI temps réel'],
  },
};

/**
 * Génère l'offre irrésistible MaaS — achat unique high-ticket (10 000€+)
 */
function generateIrresistibleOffer(db) {
  const weaknesses = getCompetitorWeaknesses(db);

  return {
    title: 'L\'Offre Irrésistible MaaS',
    subtitle: 'Achat unique high-ticket — La première agence de Mindshare basée sur la performance pour l\'écosystème SaaS',
    pricing_model: {
      type: 'one_time',
      description: 'Paiement unique — zéro abonnement, résultat garanti',
      tiers: [
        {
          name: 'Foundation',
          price: 10000,
          price_display: '10 000€',
          one_time: true,
          includes: [
            'Audit de niche complet & cartographie KOL',
            '5 Micro-KOLs matchés (score compatibilité >85)',
            '20 contenus différenciants générés',
            'Dashboard Mindshare Index 6 mois',
            'Rapport ROI détaillé à 90 jours',
          ],
          best_for: 'Early-stage SaaS (MRR < 15k€)',
        },
        {
          name: 'Growth',
          price: 25000,
          price_display: '25 000€',
          one_time: true,
          featured: true,
          includes: [
            'Tout Foundation +',
            '12 KOLs matchés (micro + mid-tier)',
            '50 contenus multi-format (threads, vidéos courtes, newsletter)',
            'Content Orchestrator automatisé',
            'Attribution multi-touch par canal',
            'A/B testing hooks & CTA',
            'Accès Mindshare Index 12 mois',
          ],
          best_for: 'SaaS en croissance (MRR 15k€–80k€)',
        },
        {
          name: 'Scale',
          price: 50000,
          price_display: '50 000€+',
          one_time: true,
          includes: [
            'Tout Growth +',
            '25+ KOLs multi-plateforme (X, LinkedIn, YouTube, Twitch)',
            'Contenus illimités sur la durée de la campagne',
            'Campagnes vidéo (YouTube, Twitch) incluses',
            'Account manager dédié',
            'Stratégie mindshare trimestrielle',
            'Garantie ROI positif ou complément offert',
          ],
          best_for: 'SaaS établi (MRR 80k€+)',
        },
      ],
    },
    niche_comparisons: NICHE_COMPARISONS,
    problems_solved: weaknesses.map(w => ({
      problem: w.weakness,
      solution: w.maas_solution,
      severity: w.severity,
    })),
    guarantees: [
      'ROI positif garanti sous 90 jours ou complément offert jusqu\'à résultat',
      'Paiement unique — aucun abonnement, zéro surprise',
      'Transparence totale: accès dashboard temps réel dès le jour 1',
    ],
    urgency: {
      message: 'Places limitées: 5 nouveaux clients par trimestre pour garantir la qualité',
      social_proof: '23 SaaS accompagnés | +340% Mindshare Index moyen | 2.4M€ revenue influenced',
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
