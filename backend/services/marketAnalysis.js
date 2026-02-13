/**
 * Market Analysis — Segments Micro-SaaS & Competitor Weakness Matrix
 * v1 Lean : données statiques enrichies
 */

const SEGMENTS = [
  { id: 'devtools', name: 'Dev Tools', demand: 92, growth: 8.2 },
  { id: 'nocode', name: 'No-code / Low-code', demand: 88, growth: 12.1 },
  { id: 'apifirst', name: 'API-first SaaS', demand: 85, growth: 6.5 },
  { id: 'crm', name: 'CRM de niche', demand: 79, growth: 4.8 },
  { id: 'analytics', name: 'Analytics', demand: 76, growth: 7.2 },
];

const COMPETITOR_WEAKNESS = [
  {
    competitorId: 'c1',
    name: 'Agency A',
    dimensions: {
      technical_depth: 72,
      roi_tracking: 65,
      pricing_rigidity: 58,
      content_freshness: 45,
      audience_quality: 38,
    },
  },
  {
    competitorId: 'c2',
    name: 'Agency B',
    dimensions: {
      technical_depth: 45,
      roi_tracking: 82,
      pricing_rigidity: 88,
      content_freshness: 52,
      audience_quality: 41,
    },
  },
  {
    competitorId: 'c3',
    name: 'Agency C',
    dimensions: {
      technical_depth: 38,
      roi_tracking: 55,
      pricing_rigidity: 62,
      content_freshness: 78,
      audience_quality: 55,
    },
  },
];

/**
 * Top 5 segments à fort besoin (Micro-SaaS)
 */
export function getTopSegments() {
  return SEGMENTS.map((s) => ({
    ...s,
    label: `${s.name} — demande ${s.demand}/100, croissance ${s.growth}%`,
  }));
}

/**
 * Competitor Weakness Matrix — higher = weaker (opportunité)
 */
export function getCompetitorWeakness() {
  return COMPETITOR_WEAKNESS;
}

/**
 * Synthèse Intelligence
 */
export function getIntelligenceSummary() {
  return {
    segments: getTopSegments(),
    competitors: getCompetitorWeakness(),
    dimensions: [
      'technical_depth',
      'roi_tracking',
      'pricing_rigidity',
      'content_freshness',
      'audience_quality',
    ],
  };
}
