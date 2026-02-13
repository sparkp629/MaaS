/**
 * Données d'exemple pour développement (sans DB)
 * À remplacer par Supabase/SQLite en prod
 */

import { computeMultiChannelMI } from '../services/mindshareIndex.js';
import { computeConversionScore } from '../services/kolScoring.js';

const RAW_KOLS = [
  {
    id: '1',
    handle: '@devtools_sarah',
    displayName: 'Sarah Chen',
    followers: 7200,
    niche: 'Dev Tools',
    nicheDisplay: 'Outils pour développeurs',
    twitter: { impressions: 15000, engagementRate: 6.2 },
    newsletter: { opens: 42, ctr: 4.1 },
    youtube: { views: 8000 },
    linkedin: { impressions: 5000, engagementRate: 3.5 },
    mentions: 18,
    sentiment: 72,
    technicalSentiment: 85,
    growthVelocity: 4.2,
  },
  {
    id: '2',
    handle: '@nocode_alex',
    displayName: 'Alex Rivera',
    followers: 4500,
    niche: 'No-code',
    nicheDisplay: 'Sans code',
    twitter: { impressions: 8000, engagementRate: 8.1 },
    newsletter: { opens: 55, ctr: 5.2 },
    mentions: 8,
    sentiment: 65,
    technicalSentiment: 60,
    growthVelocity: 7.5,
  },
  {
    id: '3',
    handle: '@api_first',
    displayName: 'Jordan Kim',
    followers: 12000,
    niche: 'API-first',
    nicheDisplay: 'Logiciels connectés',
    twitter: { impressions: 45000, engagementRate: 4.1 },
    newsletter: { opens: 35, ctr: 2.8 },
    linkedin: { impressions: 12000, engagementRate: 2.1 },
    mentions: 32,
    sentiment: 78,
    technicalSentiment: 90,
    growthVelocity: 2.1,
  },
];

export function getSampleKOLs() {
  return RAW_KOLS.map((raw) => {
    const mi = computeMultiChannelMI({
      twitter: raw.twitter,
      newsletter: raw.newsletter,
      youtube: raw.youtube,
      linkedin: raw.linkedin,
      mentions: raw.mentions,
      sentiment: raw.sentiment,
    });
    const conv = computeConversionScore({
      technicalSentiment: raw.technicalSentiment,
      growthVelocity: raw.growthVelocity,
      followers: raw.followers,
      engagementRate: raw.twitter?.engagementRate,
    });
    return {
      id: raw.id,
      handle: raw.handle,
      displayName: raw.displayName,
      followers: raw.followers,
      niche: raw.nicheDisplay || raw.niche,
      conversionScore: conv.value,
      mindshareIndex: mi.value,
      isMicroKOL: conv.isMicroKOL,
      preview: `Partage sa progression publiquement • ${raw.nicheDisplay || raw.niche} • ${raw.followers.toLocaleString('fr-FR')} abonnés`,
    };
  });
}

export function getDashboardSummary() {
  const kols = getSampleKOLs();
  const avgMI = kols.length
    ? kols.reduce((s, k) => s + k.mindshareIndex, 0) / kols.length
    : 0;
  const level =
    avgMI >= 80
      ? 'Très influent'
      : avgMI >= 60
        ? 'Fort'
        : avgMI >= 40
          ? 'En croissance'
          : avgMI >= 20
            ? 'En émergence'
            : 'À développer';
  return {
    kolCount: kols.length,
    campaigns: [],
    mindshare: { value: Math.round(avgMI * 10) / 10, level },
  };
}
