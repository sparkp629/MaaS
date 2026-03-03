import * as xClient from './xClient.js';
import * as youtubeClient from './youtubeClient.js';
import * as metaClient from './metaClient.js';
import * as substackClient from './substackClient.js';
import * as grokClient from './grokClient.js';
import { getStrictSeedsForNiche } from '../config/kolSeeds.js';
import {
  ensureNiche,
  resolveNicheRecord,
  upsertKolCandidate,
  upsertSocialHighlight,
  upsertSubstackSignal,
} from '../db/dal.js';

function parseList(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values) {
  return Array.from(new Set(values));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function dateOnly(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function toTitle(text, fallback = 'Untitled') {
  const clean = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return fallback;

  if (clean.length <= 90) return clean;

  const cut = clean.slice(0, 90);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, Math.max(40, lastSpace))}...`;
}

function toPreview(text, max = 180) {
  const clean = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();

  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}...`;
}

function computeFitScore(followers, engagementRate) {
  const followerSignal = Math.log10(Math.max(10, Number(followers || 0))) * 16;
  const engagementSignal = Number(engagementRate || 0) * 6;
  return clamp(Math.round(20 + followerSignal + engagementSignal), 1, 99);
}

function computeImpactScore({ views = 0, engagementRate = 0, interactions = 0 }) {
  const viewsSignal = Math.log10(Math.max(10, Number(views || 0))) * 15;
  const interactionsSignal = Math.log10(Math.max(10, Number(interactions || 0))) * 14;
  const engagementSignal = Number(engagementRate || 0) * 5;
  return clamp(Math.round(15 + viewsSignal + interactionsSignal + engagementSignal), 1, 99);
}

function parseIsoDurationToSeconds(input) {
  const raw = String(input || '').trim();
  if (!raw.startsWith('PT')) return 0;
  const hours = Number((raw.match(/(\d+)H/) || [])[1] || 0);
  const minutes = Number((raw.match(/(\d+)M/) || [])[1] || 0);
  const seconds = Number((raw.match(/(\d+)S/) || [])[1] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

function normalizeNiche(input) {
  if (!input) {
    return resolveNicheRecord(null);
  }

  const raw = String(input || '').trim().toLowerCase();
  if (raw === 'intelligence-artificielle-fr' || raw === 'ia-fr') {
    return ensureNiche({
      key: 'intelligence-artificielle-fr',
      label: 'Intelligence Artificielle (FR)',
      description: 'Comptes et contenus IA francophones a fort impact.',
    });
  }

  try {
    return ensureNiche({ key: input, label: input });
  } catch {
    return resolveNicheRecord(input);
  }
}

function defaultSourcesFromEnv() {
  return {
    xUsers: parseList(process.env.X_KOL_USERNAMES || process.env.X_USERNAMES || ''),
    youtubeChannels: parseList(
      process.env.YOUTUBE_CHANNEL_REFERENCES || process.env.YOUTUBE_CHANNELS || ''
    ),
    metaPageIds: parseList(process.env.META_PAGE_IDS || ''),
    instagramUserIds: parseList(process.env.INSTAGRAM_USER_IDS || ''),
    substackFeeds: parseList(process.env.SUBSTACK_FEEDS || ''),
  };
}

function resolveSources(overrideSources = {}) {
  const defaults = defaultSourcesFromEnv();
  return {
    xUsers: unique([
      ...defaults.xUsers,
      ...parseList(overrideSources.xUsers),
    ]),
    youtubeChannels: unique([
      ...defaults.youtubeChannels,
      ...parseList(overrideSources.youtubeChannels),
    ]),
    metaPageIds: unique([
      ...defaults.metaPageIds,
      ...parseList(overrideSources.metaPageIds),
    ]),
    instagramUserIds: unique([
      ...defaults.instagramUserIds,
      ...parseList(overrideSources.instagramUserIds),
    ]),
    substackFeeds: unique([
      ...defaults.substackFeeds,
      ...parseList(overrideSources.substackFeeds),
    ]),
  };
}

function applyAIFrenchFallback(nicheKey, sources) {
  const key = String(nicheKey || '').toLowerCase();
  const looksLikeAIFrench =
    key.includes('intelligence-artificielle') ||
    key.includes('ia-fr') ||
    (key.includes('ai') && key.includes('fr'));

  if (!looksLikeAIFrench) return sources;

  const next = { ...sources };
  if (!next.xUsers.length) {
    next.xUsers = ['MistralAI', 'huggingface'];
  }
  if (!next.youtubeChannels.length) {
    next.youtubeChannels = ['Mistral AI', 'Hugging Face'];
  }
  return next;
}

function applyStrictNicheSeeds(nicheKey, sources) {
  const strict = getStrictSeedsForNiche(nicheKey);
  if (!strict) return sources;

  const next = { ...sources };
  next.xUsers = unique([...(next.xUsers || []), ...(Array.isArray(strict.xUsers) ? strict.xUsers : [])]);
  next.youtubeChannels = unique([
    ...(next.youtubeChannels || []),
    ...(Array.isArray(strict.youtubeChannels) ? strict.youtubeChannels : []),
  ]);
  return next;
}

async function applyGrokExpansion(nicheKey, sources) {
  const run = {
    connector: 'grok',
    configured: grokClient.isConfigured(),
    attempted: 0,
    addedXUsers: 0,
    addedYouTubeChannels: 0,
    errors: [],
  };

  if (!run.configured) {
    run.note = 'GROK_API_KEY is missing.';
    return { sources, run };
  }

  try {
    const discovery = await grokClient.discoverKOLSeeds({
      nicheKey,
      xUsers: sources.xUsers,
      youtubeChannels: sources.youtubeChannels,
      limitX: 10,
      limitYouTube: 10,
    });

    const mergedX = unique([...(sources.xUsers || []), ...(discovery.xUsers || [])]);
    const mergedYouTube = unique([
      ...(sources.youtubeChannels || []),
      ...(discovery.youtubeChannels || []),
    ]);

    run.attempted =
      Number(discovery.xUsers?.length || 0) + Number(discovery.youtubeChannels?.length || 0);
    run.addedXUsers = Math.max(0, mergedX.length - (sources.xUsers || []).length);
    run.addedYouTubeChannels = Math.max(
      0,
      mergedYouTube.length - (sources.youtubeChannels || []).length
    );
    run.note = `Expanded strict seeds with ${run.addedXUsers} X and ${run.addedYouTubeChannels} YouTube candidates.`;

    return {
      sources: {
        ...sources,
        xUsers: mergedX,
        youtubeChannels: mergedYouTube,
      },
      run,
    };
  } catch (error) {
    run.errors.push({ message: error.message });
    run.note = 'Grok expansion failed, using strict seeds only.';
    return { sources, run };
  }
}

async function syncX({ nicheKey, usernames }) {
  const result = {
    connector: 'x',
    configured: xClient.isConfigured(),
    attempted: usernames.length,
    created: 0,
    updated: 0,
    socialCreated: 0,
    socialUpdated: 0,
    errors: [],
  };

  if (!result.configured) {
    result.note = 'X_BEARER_TOKEN is missing.';
    return result;
  }

  for (const username of usernames) {
    try {
      const metrics = await xClient.fetchKolMetrics(username);
      const fitScore = computeFitScore(metrics.followers, metrics.engagementRate);
      const kolWrite = upsertKolCandidate({
        nicheKey,
        name: metrics.displayName,
        handle: metrics.handle,
        primaryNetwork: 'X',
        secondaryNetworks: ['YouTube', 'Meta'],
        followers: metrics.followers,
        engagementRate: metrics.engagementRate,
        fitScore,
        estSponsorshipUsd: clamp(Math.round(metrics.followers / 100), 200, 8000),
        reason:
          'Live X metrics sync: profile reach and recent post engagement are above niche baseline.',
        profileUrl: `https://x.com/${metrics.handle.replace(/^@/, '')}`,
        lastSignalAt: dateOnly(),
      });

      if (kolWrite.updated) result.updated += 1;
      else result.created += 1;

      const tweets = await xClient.getRecentTweets(metrics.platformUserId, 5);

      for (const tweet of tweets) {
        const interactions =
          Number(tweet.publicMetrics.likes || 0) +
          Number(tweet.publicMetrics.replies || 0) +
          Number(tweet.publicMetrics.reposts || 0) +
          Number(tweet.publicMetrics.quotes || 0);

        const itemWrite = upsertSocialHighlight({
          nicheKey,
          network: 'X',
          authorName: metrics.displayName,
          authorHandle: metrics.handle,
          authorAvatarUrl: metrics.avatarUrl,
          format: tweet.text.length > 200 ? 'Thread' : 'Post',
          title: toTitle(tweet.text, `X post by ${metrics.displayName}`),
          hook: toPreview(tweet.text, 300),
          metrics: {
            impressions: tweet.publicMetrics.impressions,
            likes: tweet.publicMetrics.likes,
            replies: tweet.publicMetrics.replies,
            reposts: tweet.publicMetrics.reposts,
            quotes: tweet.publicMetrics.quotes,
            thumbnailUrl: tweet.mediaUrl || null,
          },
          impactScore: computeImpactScore({
            views: tweet.publicMetrics.impressions,
            engagementRate: metrics.engagementRate,
            interactions,
          }),
          views: tweet.publicMetrics.impressions,
          engagementRate: metrics.engagementRate,
          url: `https://x.com/${metrics.handle.replace(/^@/, '')}/status/${tweet.id}`,
          publishedAt: dateOnly(tweet.createdAt),
        });

        if (itemWrite.updated) result.socialUpdated += 1;
        else result.socialCreated += 1;
      }
    } catch (error) {
      result.errors.push({ source: username, message: error.message });
    }
  }

  return result;
}

function computeYouTubeEngagement(videos) {
  if (!Array.isArray(videos) || videos.length === 0) return 0;

  const ratio = videos.map((video) => {
    const views = Number(video.views || 0);
    const interactions = Number(video.likes || 0) + Number(video.comments || 0);
    if (!views) return 0;
    return (interactions / views) * 100;
  });

  return Number((ratio.reduce((sum, n) => sum + n, 0) / ratio.length).toFixed(2));
}

async function syncYouTube({ nicheKey, references }) {
  const result = {
    connector: 'youtube',
    configured: youtubeClient.isConfigured(),
    attempted: references.length,
    created: 0,
    updated: 0,
    socialCreated: 0,
    socialUpdated: 0,
    errors: [],
  };

  if (!result.configured) {
    result.note = 'YOUTUBE_API_KEY is missing.';
    return result;
  }

  for (const reference of references) {
    try {
      const metrics = await youtubeClient.fetchKolMetrics(reference);
      const engagementRate = computeYouTubeEngagement(metrics.recentVideos);
      const fitScore = computeFitScore(metrics.subscribers, engagementRate);

      const kolWrite = upsertKolCandidate({
        nicheKey,
        name: metrics.displayName,
        handle: metrics.handle?.startsWith('@') ? metrics.handle : `@${metrics.handle}`,
        primaryNetwork: 'YouTube',
        secondaryNetworks: ['X', 'Instagram'],
        followers: metrics.subscribers,
        engagementRate,
        fitScore,
        estSponsorshipUsd: clamp(Math.round(metrics.subscribers / 120), 300, 12000),
        reason:
          'Live YouTube sync: channel velocity and recent video engagement align with niche demand.',
        profileUrl: metrics.channelUrl,
        lastSignalAt: dateOnly(),
      });

      if (kolWrite.updated) result.updated += 1;
      else result.created += 1;

      const videos = Array.isArray(metrics.recentVideos) ? metrics.recentVideos : [];
      for (const video of videos) {
        const interactions = Number(video.likes || 0) + Number(video.comments || 0);
        const videoEngagement = video.views
          ? Number(((interactions / Number(video.views)) * 100).toFixed(2))
          : 0;

        const itemWrite = upsertSocialHighlight({
          nicheKey,
          network: 'YouTube',
          authorName: metrics.displayName,
          authorHandle: metrics.handle,
          authorAvatarUrl: metrics.avatarUrl || null,
          format: 'Video',
          title: toTitle(video.title, `Video by ${metrics.displayName}`),
          hook: toPreview(video.description || video.title, 300),
          metrics: {
            views: Number(video.views || 0),
            likes: Number(video.likes || 0),
            comments: Number(video.comments || 0),
            videoId: video.videoId || null,
            thumbnailUrl: video.thumbnailUrl || null,
            duration: video.duration || '',
            isShort: (() => {
              const durationSec = parseIsoDurationToSeconds(video.duration);
              return durationSec > 0 ? durationSec <= 61 : false;
            })(),
          },
          impactScore: computeImpactScore({
            views: Number(video.views || 0),
            engagementRate: videoEngagement,
            interactions,
          }),
          views: Number(video.views || 0),
          engagementRate: videoEngagement,
          url: `https://youtube.com/watch?v=${video.videoId}`,
          publishedAt: dateOnly(video.publishedAt),
        });

        if (itemWrite.updated) result.socialUpdated += 1;
        else result.socialCreated += 1;
      }
    } catch (error) {
      result.errors.push({ source: reference, message: error.message });
    }
  }

  return result;
}

async function syncMeta({ nicheKey, pageIds, accessToken }) {
  const result = {
    connector: 'meta',
    configured: metaClient.isConfigured() && Boolean(accessToken),
    attempted: pageIds.length,
    created: 0,
    updated: 0,
    socialCreated: 0,
    socialUpdated: 0,
    errors: [],
  };

  if (!result.configured) {
    result.note = 'META credentials or access token are missing.';
    return result;
  }

  for (const pageId of pageIds) {
    try {
      const metrics = await metaClient.fetchKolMetrics(accessToken, pageId);
      const fitScore = computeFitScore(metrics.followers, metrics.engagementRate);

      const kolWrite = upsertKolCandidate({
        nicheKey,
        name: metrics.displayName,
        handle: `@${String(metrics.displayName || pageId).replace(/\s+/g, '').toLowerCase()}`,
        primaryNetwork: 'Meta',
        secondaryNetworks: ['Instagram', 'X'],
        followers: metrics.followers,
        engagementRate: metrics.engagementRate,
        fitScore,
        estSponsorshipUsd: clamp(Math.round(metrics.followers / 140), 180, 7000),
        reason:
          'Live Meta sync: page engagement and audience size suggest high distribution potential.',
        profileUrl: metrics.profileUrl,
        lastSignalAt: dateOnly(),
      });

      if (kolWrite.updated) result.updated += 1;
      else result.created += 1;

      const posts = await metaClient.getRecentPagePosts(accessToken, pageId, 5);

      for (const post of posts) {
        const interactions = post.likes + post.comments + post.shares;
        const postEngagement = metrics.followers
          ? Number(((interactions / metrics.followers) * 100).toFixed(2))
          : 0;

        const itemWrite = upsertSocialHighlight({
          nicheKey,
          network: 'Meta',
          authorName: metrics.displayName,
          authorHandle: null,
          format: 'Post',
          title: toTitle(post.text, `Meta post by ${metrics.displayName}`),
          hook: `Likes ${post.likes}, comments ${post.comments}, shares ${post.shares}`,
          metrics: {
            likes: Number(post.likes || 0),
            comments: Number(post.comments || 0),
            shares: Number(post.shares || 0),
            thumbnailUrl: post.mediaUrl || null,
          },
          impactScore: computeImpactScore({
            views: interactions * 12,
            engagementRate: postEngagement,
            interactions,
          }),
          views: interactions * 12,
          engagementRate: postEngagement,
          url: post.permalink,
          publishedAt: dateOnly(post.createdAt),
        });

        if (itemWrite.updated) result.socialUpdated += 1;
        else result.socialCreated += 1;
      }
    } catch (error) {
      result.errors.push({ source: pageId, message: error.message });
    }
  }

  return result;
}

async function syncInstagram({ nicheKey, userIds, accessToken }) {
  const result = {
    connector: 'instagram',
    configured: metaClient.isConfigured() && Boolean(accessToken),
    attempted: userIds.length,
    created: 0,
    updated: 0,
    socialCreated: 0,
    socialUpdated: 0,
    errors: [],
  };

  if (!result.configured) {
    result.note = 'META credentials or Instagram access token are missing.';
    return result;
  }

  for (const userId of userIds) {
    try {
      const profile = await metaClient.getInstagramProfile(accessToken, userId);
      const media = await metaClient.getRecentInstagramMedia(accessToken, userId, 5);

      const avgEngagement = media.length
        ? Number(
            (
              media.reduce((sum, item) => {
                const interactions = Number(item.likes || 0) + Number(item.comments || 0);
                if (!profile.followers) return sum;
                return sum + (interactions / profile.followers) * 100;
              }, 0) / media.length
            ).toFixed(2)
          )
        : 0;

      const kolWrite = upsertKolCandidate({
        nicheKey,
        name: profile.username,
        handle: `@${profile.username}`,
        primaryNetwork: 'Instagram',
        secondaryNetworks: ['Meta', 'YouTube'],
        followers: profile.followers,
        engagementRate: avgEngagement,
        fitScore: computeFitScore(profile.followers, avgEngagement),
        estSponsorshipUsd: clamp(Math.round(profile.followers / 160), 150, 10000),
        reason:
          'Live Instagram sync: creator audience and per-post engagement are high for this niche.',
        profileUrl: profile.profileUrl,
        lastSignalAt: dateOnly(),
      });

      if (kolWrite.updated) result.updated += 1;
      else result.created += 1;

      for (const item of media) {
        const interactions = Number(item.likes || 0) + Number(item.comments || 0);
        const engagementRate = profile.followers
          ? Number(((interactions / profile.followers) * 100).toFixed(2))
          : 0;

        const write = upsertSocialHighlight({
          nicheKey,
          network: 'Instagram',
          authorName: profile.username,
          authorHandle: `@${profile.username}`,
          format: item.mediaType || 'Post',
          title: toTitle(item.caption, `Instagram ${item.mediaType || 'post'}`),
          hook: `Likes ${item.likes}, comments ${item.comments}`,
          metrics: {
            likes: Number(item.likes || 0),
            comments: Number(item.comments || 0),
            thumbnailUrl: item.mediaUrl || null,
          },
          impactScore: computeImpactScore({
            views: interactions * 15,
            engagementRate,
            interactions,
          }),
          views: interactions * 15,
          engagementRate,
          url: item.permalink,
          publishedAt: dateOnly(item.createdAt),
        });

        if (write.updated) result.socialUpdated += 1;
        else result.socialCreated += 1;
      }
    } catch (error) {
      result.errors.push({ source: userId, message: error.message });
    }
  }

  return result;
}

async function syncSubstack({ nicheKey, feedUrls }) {
  const result = {
    connector: 'substack',
    configured: substackClient.isConfigured() || feedUrls.length > 0,
    attempted: feedUrls.length,
    created: 0,
    updated: 0,
    errors: [],
    note:
      'Open rate and CTR are only stored when source provides them. RSS feeds mainly provide topic velocity.',
  };

  if (!result.configured) {
    result.note = 'SUBSTACK_FEEDS is missing.';
    return result;
  }

  const feeds = await substackClient.fetchFeeds(feedUrls);

  for (const feed of feeds) {
    if (!feed.ok) {
      result.errors.push({ source: feed.feedUrl, message: feed.error });
      continue;
    }

    for (const item of feed.items.slice(0, 8)) {
      try {
        const write = upsertSubstackSignal({
          nicheKey,
          publication: feed.publication,
          topic: item.title,
          angle: item.description?.slice(0, 260) || null,
          openRate: 0,
          ctr: 0,
          growthScore: item.growthScore,
          issueUrl: item.link,
          publishedAt: dateOnly(item.publishedAt),
        });

        if (write.updated) result.updated += 1;
        else result.created += 1;
      } catch (error) {
        result.errors.push({ source: item.link || feed.feedUrl, message: error.message });
      }
    }
  }

  return result;
}

export function getConnectorStatus() {
  const defaults = defaultSourcesFromEnv();
  const metaToken =
    process.env.META_PAGE_ACCESS_TOKEN ||
    process.env.META_ACCESS_TOKEN ||
    '';

  return {
    connectors: {
      x: {
        configured: xClient.isConfigured(),
        defaultSources: defaults.xUsers.length,
      },
      youtube: {
        configured: youtubeClient.isConfigured(),
        defaultSources: defaults.youtubeChannels.length,
      },
      meta: {
        configured: metaClient.isConfigured() && Boolean(metaToken),
        defaultSources: defaults.metaPageIds.length,
      },
      instagram: {
        configured: metaClient.isConfigured() && Boolean(metaToken),
        defaultSources: defaults.instagramUserIds.length,
      },
      substack: {
        configured: substackClient.isConfigured(),
        defaultSources: defaults.substackFeeds.length,
      },
      grok: {
        configured: grokClient.isConfigured(),
        defaultSources: 0,
      },
    },
    envKeys: {
      xUsers: 'X_KOL_USERNAMES',
      youtubeChannels: 'YOUTUBE_CHANNEL_REFERENCES',
      metaPageIds: 'META_PAGE_IDS',
      instagramUserIds: 'INSTAGRAM_USER_IDS',
      substackFeeds: 'SUBSTACK_FEEDS',
      grok: 'GROK_API_KEY',
    },
  };
}

export async function syncLiveSources({ nicheKey, sources = {}, tokens = {} } = {}) {
  const niche = normalizeNiche(nicheKey);
  let resolved = applyStrictNicheSeeds(
    niche.key,
    applyAIFrenchFallback(niche.key, resolveSources(sources))
  );

  const grokExpansion = await applyGrokExpansion(niche.key, resolved);
  resolved = grokExpansion.sources;

  const metaAccessToken =
    tokens.metaAccessToken ||
    tokens.instagramAccessToken ||
    process.env.META_PAGE_ACCESS_TOKEN ||
    process.env.META_ACCESS_TOKEN ||
    '';

  const report = {
    startedAt: new Date().toISOString(),
    niche,
    sources: {
      xUsers: resolved.xUsers,
      youtubeChannels: resolved.youtubeChannels,
      metaPageIds: resolved.metaPageIds,
      instagramUserIds: resolved.instagramUserIds,
      substackFeeds: resolved.substackFeeds,
    },
    runs: [],
  };

  report.runs.push(grokExpansion.run);

  report.runs.push(
    await syncX({ nicheKey: niche.key, usernames: resolved.xUsers })
  );
  report.runs.push(
    await syncYouTube({ nicheKey: niche.key, references: resolved.youtubeChannels })
  );
  report.runs.push(
    await syncMeta({
      nicheKey: niche.key,
      pageIds: resolved.metaPageIds,
      accessToken: metaAccessToken,
    })
  );
  report.runs.push(
    await syncInstagram({
      nicheKey: niche.key,
      userIds: resolved.instagramUserIds,
      accessToken: metaAccessToken,
    })
  );
  report.runs.push(
    await syncSubstack({
      nicheKey: niche.key,
      feedUrls: resolved.substackFeeds,
    })
  );

  report.finishedAt = new Date().toISOString();

  report.summary = report.runs.reduce(
    (acc, run) => {
      acc.created += Number(run.created || 0);
      acc.updated += Number(run.updated || 0);
      acc.socialCreated += Number(run.socialCreated || 0);
      acc.socialUpdated += Number(run.socialUpdated || 0);
      acc.errors += Array.isArray(run.errors) ? run.errors.length : 0;
      return acc;
    },
    { created: 0, updated: 0, socialCreated: 0, socialUpdated: 0, errors: 0 }
  );

  return report;
}
