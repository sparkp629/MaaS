/**
 * Données d'exemple pour développement (sans DB)
 */

import { computeMultiChannelMI } from '../services/mindshareIndex.js';
import { computeConversionScore } from '../services/kolScoring.js';

const RAW_KOLS = [
  {
    id: '1', handle: '@devtools_sarah', displayName: 'Sarah Chen', followers: 7200,
    niche: 'Dev Tools', country: 'United States', primaryNetwork: 'twitter',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    twitter: { impressions: 15000, engagementRate: 6.2 },
    twitterPost: 'CI reduced by 40% with concrete deployment proof and conversion tracking.',
    linkedin: { impressions: 5000, engagementRate: 3.5 },
    linkedinPost: '5 lessons from 0 to 10k users using founder-led content.',
    mentions: 18, sentiment: 72, technicalSentiment: 85, growthVelocity: 4.2,
    patternSubject: 'Proof-based founder narrative', patternFormat: 'Thread + screenshot', patternTone: 'Pragmatic',
  },
  {
    id: '2', handle: '@nocode_alex', displayName: 'Alex Rivera', followers: 4500,
    niche: 'No-code', country: 'France', primaryNetwork: 'youtube',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    twitter: { impressions: 8000, engagementRate: 8.1 },
    twitterPost: 'Built a profitable app in two weeks, with retention breakdown and acquisition cost details.',
    youtube: { views: 19000 },
    youtubePost: 'Launch timeline, attribution map, and repeatable growth loop.',
    mentions: 8, sentiment: 65, technicalSentiment: 60, growthVelocity: 7.5,
    patternSubject: 'Before/after business outcome', patternFormat: 'Short case video', patternTone: 'Direct',
  },
  {
    id: '3', handle: '@api_first', displayName: 'Jordan Kim', followers: 12000,
    niche: 'API-first', country: 'Japan', primaryNetwork: 'linkedin',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
    twitter: { impressions: 45000, engagementRate: 4.1 },
    twitterPost: 'Predictable versioning lowered support burden and improved partner activation.',
    linkedin: { impressions: 12000, engagementRate: 2.1 },
    linkedinPost: 'Pragmatic architecture lessons after 50+ integrations.',
    mentions: 32, sentiment: 78, technicalSentiment: 90, growthVelocity: 2.1,
    patternSubject: 'Risk reduction strategy', patternFormat: 'Long expert post', patternTone: 'Educational',
  },
  {
    id: '4', handle: '@streamgrowth_mina', displayName: 'Mina Park', followers: 9600,
    niche: 'Gaming analytics', country: 'South Korea', primaryNetwork: 'twitch',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mina',
    twitter: { impressions: 10200, engagementRate: 5.4 },
    twitterPost: 'Livestream sponsorship workflows with direct conversion prompts.',
    twitchPost: 'Live teardown of sponsor placement that improved checkout rate.',
    mentions: 24, sentiment: 70, technicalSentiment: 74, growthVelocity: 5.9,
    patternSubject: 'Live proof loop', patternFormat: 'Live stream + clip', patternTone: 'Energetic',
  },
  {
    id: '5', handle: '@growthlena', displayName: 'Lena Costa', followers: 15000,
    niche: 'B2B demand generation', country: 'Brazil', primaryNetwork: 'twitter',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lena',
    twitter: { impressions: 32000, engagementRate: 4.9 },
    twitterPost: 'Attribution loops for creator partnerships that lowered wasted spend.',
    mentions: 27, sentiment: 75, technicalSentiment: 81, growthVelocity: 5.2,
    patternSubject: 'Cost-saving narrative', patternFormat: 'Step list', patternTone: 'Executive',
  },
  {
    id: '6', handle: '@adriankpi', displayName: 'Adrian Novak', followers: 6100,
    niche: 'Newsletter growth', country: 'Germany', primaryNetwork: 'newsletter',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Adrian',
    twitter: { impressions: 7400, engagementRate: 3.8 },
    twitterPost: 'Intent segmentation increased qualified replies and meetings booked.',
    mentions: 12, sentiment: 68, technicalSentiment: 71, growthVelocity: 4.5,
    patternSubject: 'Intent segmentation', patternFormat: 'Issue + call to action', patternTone: 'Methodical',
  },
];

export function getSampleKOLs() {
  const hydrated = RAW_KOLS.map((raw) => {
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

    const influenceScore = Math.round((mi.value * 0.45) + (conv.value * 0.45) + ((raw.twitter?.engagementRate || 0) * 1.2));

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
      influenceScore,
      contentPattern: {
        subject: raw.patternSubject,
        format: raw.patternFormat,
        tone: raw.patternTone,
      },
      previews: {
        twitter: raw.twitterPost ? { text: raw.twitterPost } : null,
        youtube: raw.youtubePost ? { text: raw.youtubePost } : null,
        twitch: raw.twitchPost ? { text: raw.twitchPost } : null,
        linkedin: raw.linkedinPost ? {
          text: raw.linkedinPost,
          status: raw.id === '3' ? 'censored' : 'ok',
          platformLabel: 'LinkedIn',
        } : null,
        newsletter: raw.primaryNetwork === 'newsletter'
          ? { text: 'Weekly issue with problem-first framing and measurable call to action.' }
          : null,
      },
    };
  });

  return hydrated.sort((a, b) => {
    if (a.country !== b.country) return a.country.localeCompare(b.country);
    return b.influenceScore - a.influenceScore;
  });
}

export function getDashboardSummary() {
  const kols = getSampleKOLs();
  const avgMI = kols.length ? kols.reduce((sum, kol) => sum + kol.mindshareIndex, 0) / kols.length : 0;
  const level = avgMI >= 80 ? 'Dominant' : avgMI >= 60 ? 'Strong' : avgMI >= 40 ? 'Growing' : avgMI >= 20 ? 'Emerging' : 'Invisible';

  return {
    kolCount: kols.length,
    campaigns: [],
    mindshare: { value: Math.round(avgMI * 10) / 10, level },
  };
}
