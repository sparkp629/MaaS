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
    country: 'United States',
    primaryNetwork: 'twitter',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    twitter: { impressions: 15000, engagementRate: 6.2 },
    twitterPost: 'Cut CI time by 40% using parallel jobs and smart caching. Full stack and measurable results in production.',
    linkedin: { impressions: 5000, engagementRate: 3.5 },
    linkedinPost: '5 lessons from scaling a dev tool from 0 to 10k users.',
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
    country: 'France',
    primaryNetwork: 'youtube',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    twitter: { impressions: 8000, engagementRate: 8.1 },
    twitterPost: 'How I built a profitable app in two weeks without code, with revenue proof and retention numbers.',
    youtube: { views: 19000 },
    youtubePost: 'Case study: launch timeline, acquisition channels, and conversion stack.',
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
    country: 'Japan',
    primaryNetwork: 'linkedin',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
    twitter: { impressions: 45000, engagementRate: 4.1 },
    twitterPost: 'API design: predictable versioning keeps operations stable and decreases support tickets.',
    linkedin: { impressions: 12000, engagementRate: 2.1 },
    linkedinPost: 'Pragmatic API architecture after 50+ integrations.',
    mentions: 32,
    sentiment: 78,
    technicalSentiment: 90,
    growthVelocity: 2.1,
  },
  {
    id: '4',
    handle: '@streamgrowth_mina',
    displayName: 'Mina Park',
    followers: 9600,
    niche: 'Gaming analytics',
    country: 'South Korea',
    primaryNetwork: 'twitch',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mina',
    twitter: { impressions: 10200, engagementRate: 5.4 },
    twitterPost: 'Livestream conversion templates for sponsorship workflows.',
    mentions: 24,
    sentiment: 70,
    technicalSentiment: 74,
    growthVelocity: 5.9,
  },
  {
    id: '5',
    handle: '@growthlena',
    displayName: 'Lena Costa',
    followers: 15000,
    niche: 'B2B demand generation',
    country: 'Brazil',
    primaryNetwork: 'twitter',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lena',
    twitter: { impressions: 32000, engagementRate: 4.9 },
    twitterPost: 'How to build reliable attribution loops for creator partnerships.',
    mentions: 27,
    sentiment: 75,
    technicalSentiment: 81,
    growthVelocity: 5.2,
  },
  {
    id: '6',
    handle: '@adriankpi',
    displayName: 'Adrian Novak',
    followers: 6100,
    niche: 'Newsletter growth',
    country: 'Germany',
    primaryNetwork: 'newsletter',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Adrian',
    twitter: { impressions: 7400, engagementRate: 3.8 },
    twitterPost: 'Newsletter segmentation for intent-based conversion improvements.',
    mentions: 12,
    sentiment: 68,
    technicalSentiment: 71,
    growthVelocity: 4.5,
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
      avatarUrl: raw.avatarUrl,
      followers: raw.followers,
      niche: raw.niche,
      country: raw.country,
      primaryNetwork: raw.primaryNetwork,
      engagementRate: raw.twitter?.engagementRate ? `${raw.twitter.engagementRate}%` : null,
      conversionScore: conv.value,
      mindshareIndex: mi.value,
      isMicroKOL: conv.isMicroKOL,
      previews: {
        twitter: raw.twitterPost ? { text: raw.twitterPost } : null,
        youtube: raw.youtubePost ? { text: raw.youtubePost } : null,
        linkedin: raw.linkedinPost ? { text: raw.linkedinPost, status: raw.id === '3' ? 'censored' : 'ok', platformLabel: 'LinkedIn' } : null,
        newsletter: raw.primaryNetwork === 'newsletter' ? { text: 'Weekly issue format and subject lines outperforming baseline CTR.' } : null,
      },
    };
  });
}

export function getDashboardSummary() {
  const kols = getSampleKOLs();
  const avgMI = kols.length ? kols.reduce((s, k) => s + k.mindshareIndex, 0) / kols.length : 0;
  const level = avgMI >= 80 ? 'Dominant' : avgMI >= 60 ? 'Strong' : avgMI >= 40 ? 'Growing' : avgMI >= 20 ? 'Emerging' : 'Invisible';
  return {
    kolCount: kols.length,
    campaigns: [],
    mindshare: { value: Math.round(avgMI * 10) / 10, level },
  };
}
