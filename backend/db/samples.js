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
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    twitter: { impressions: 15000, engagementRate: 6.2 },
    twitterPost: "Just shipped a new feature that cuts our CI time by 40%. The secret? Parallel jobs + smart caching. If you're still waiting 10min for builds, this thread is for you 🧵",
    newsletter: { opens: 42, ctr: 4.1 },
    youtube: { views: 8000 },
    youtubeThumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    youtubeAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    linkedin: { impressions: 5000, engagementRate: 3.5 },
    linkedinPost: '5 lessons from scaling a dev tool from 0 to 10k users. No VC, no hype. Just product and community.',
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
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    twitter: { impressions: 8000, engagementRate: 8.1 },
    twitterPost: "Most no-code 'tutorials' are just demos. Here's how I actually built a profitable app in 2 weeks without writing code. Real numbers inside.",
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
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
    twitter: { impressions: 45000, engagementRate: 4.1 },
    twitterPost: "API design tip: version in the URL, not the header. Your future self will thank you when you're debugging at 2am.",
    newsletter: { opens: 35, ctr: 2.8 },
    youtube: { views: 12000 },
    youtubeThumbnail: 'https://i.ytimg.com/vi/jNQXAC9IVRw/mqdefault.jpg',
    youtubeAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
    linkedin: { impressions: 12000, engagementRate: 2.1 },
    linkedinPost: 'Why REST is still the right choice for 90% of APIs. A pragmatic take after building 50+ integrations.',
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
    const twPost = (raw.twitterPost || '').slice(0, 280);
    return {
      id: raw.id,
      handle: raw.handle,
      displayName: raw.displayName,
      avatarUrl: raw.avatarUrl,
      followers: raw.followers,
      niche: raw.niche,
      conversionScore: conv.value,
      mindshareIndex: mi.value,
      isMicroKOL: conv.isMicroKOL,
      preview: `Building in public • ${raw.niche} • ${raw.followers} followers`,
      previews: {
        twitter: raw.twitter ? { text: twPost, avatarUrl: raw.avatarUrl } : null,
        youtube: raw.youtube ? { thumbnailUrl: raw.youtubeThumbnail, avatarUrl: raw.youtubeAvatar } : null,
        linkedin: raw.linkedin ? { text: (raw.linkedinPost || '').slice(0, 280) } : null,
      },
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
      ? 'Dominant'
      : avgMI >= 60
        ? 'Fort'
        : avgMI >= 40
          ? 'Croissant'
          : avgMI >= 20
            ? 'Émergent'
            : 'Invisible';
  return {
    kolCount: kols.length,
    campaigns: [],
    mindshare: { value: Math.round(avgMI * 10) / 10, level },
  };
}
