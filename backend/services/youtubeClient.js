/**
 * YouTube Data API v3 client
 * Pulls public profile and recent video metrics.
 */

const BASE_URL = 'https://www.googleapis.com/youtube/v3';
let keyCursor = 0;

function parseCsvKeys(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAllApiKeys() {
  const pool = parseCsvKeys(process.env.YOUTUBE_API_KEYS);
  if (pool.length) return pool;

  const single =
    String(process.env.YOUTUBE_API_KEY || '').trim() ||
    String(process.env.API_KEY_YOUTUBE || '').trim() ||
    String(process.env.GOOGLE_API_KEY || '').trim();

  return single ? [single] : [];
}

function nextApiKey(keys) {
  if (!keys.length) return null;
  const key = keys[keyCursor % keys.length];
  keyCursor += 1;
  return key;
}

function isQuotaError(status, body = '') {
  if (Number(status) !== 403) return false;
  const text = String(body || '').toLowerCase();
  return text.includes('quota') || text.includes('rate limit') || text.includes('daily limit exceeded');
}

async function ytFetch(path, params = {}) {
  const keys = getAllApiKeys();
  if (!keys.length) {
    throw new Error('YOUTUBE_API_KEY not configured');
  }

  let lastError = null;
  const attempts = Math.max(1, keys.length);

  for (let i = 0; i < attempts; i += 1) {
    const key = nextApiKey(keys);
    const url = new URL(`${BASE_URL}${path}`);
    url.searchParams.set('key', key);

    for (const [k, v] of Object.entries(params)) {
      if (v != null) url.searchParams.set(k, String(v));
    }

    const res = await fetch(url.toString());
    if (res.ok) {
      return res.json();
    }

    const body = await res.text().catch(() => '');
    lastError = new Error(`YouTube API ${res.status}: ${body.slice(0, 240)}`);

    if (!isQuotaError(res.status, body) || i === attempts - 1) {
      throw lastError;
    }
  }

  throw lastError || new Error('YouTube API request failed.');
}

export function isConfigured() {
  return getAllApiKeys().length > 0;
}

/**
 * Fetches channel stats from channel id.
 * @param {string} channelId
 */
export async function getChannelStats(channelId) {
  const data = await ytFetch('/channels', {
    part: 'snippet,statistics',
    id: channelId,
  });

  const ch = data?.items?.[0];
  if (!ch) throw new Error(`YouTube channel ${channelId} not found`);

  return {
    channelId: ch.id,
    title: ch.snippet?.title,
    description: ch.snippet?.description?.slice(0, 2000) || '',
    thumbnailUrl: ch.snippet?.thumbnails?.medium?.url,
    subscribers: parseInt(ch.statistics?.subscriberCount, 10) || 0,
    totalViews: parseInt(ch.statistics?.viewCount, 10) || 0,
    videoCount: parseInt(ch.statistics?.videoCount, 10) || 0,
  };
}

/**
 * Finds channel by name query.
 * @param {string} query
 */
export async function searchChannel(query) {
  const data = await ytFetch('/search', {
    part: 'snippet',
    q: query,
    type: 'channel',
    maxResults: 1,
  });

  const item = data?.items?.[0];
  if (!item) throw new Error(`No YouTube channel found for "${query}"`);

  return {
    channelId: item.snippet?.channelId || item.id?.channelId,
    title: item.snippet?.title,
    thumbnailUrl: item.snippet?.thumbnails?.medium?.url,
  };
}

function extractUrlsFromText(text = '') {
  const matches = text.match(/https?:\/\/[^\s)]+/gi) || [];
  return matches
    .map((url) => url.replace(/[),.;!?]+$/g, ''))
    .filter((url, idx, arr) => arr.indexOf(url) === idx);
}

function parseYouTubeReference(input = '') {
  const raw = String(input || '').trim();
  if (!raw) return { type: 'unknown', value: '' };

  if (/^UC[\w-]{20,}$/i.test(raw)) {
    return { type: 'channelId', value: raw };
  }

  if (raw.startsWith('@')) {
    return { type: 'handle', value: raw.slice(1) };
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length === 0) return { type: 'unknown', value: raw };

      if (parts[0].startsWith('@')) {
        return { type: 'handle', value: parts[0].slice(1) };
      }
      if (parts[0] === 'channel' && parts[1]) {
        return { type: 'channelId', value: parts[1] };
      }
      if ((parts[0] === 'c' || parts[0] === 'user') && parts[1]) {
        return { type: 'query', value: parts[1] };
      }
      return { type: 'query', value: raw };
    } catch {
      return { type: 'query', value: raw };
    }
  }

  return { type: 'query', value: raw };
}

async function getChannelByHandle(handle) {
  const cleanHandle = String(handle || '').replace(/^@/, '').trim();
  if (!cleanHandle) throw new Error('YouTube handle is empty');

  const data = await ytFetch('/channels', {
    part: 'snippet,statistics',
    forHandle: cleanHandle,
  });

  const ch = data?.items?.[0];
  if (!ch) throw new Error(`YouTube channel @${cleanHandle} not found`);

  return {
    channelId: ch.id,
    title: ch.snippet?.title,
    description: ch.snippet?.description?.slice(0, 2000) || '',
    thumbnailUrl: ch.snippet?.thumbnails?.medium?.url,
    subscribers: parseInt(ch.statistics?.subscriberCount, 10) || 0,
    totalViews: parseInt(ch.statistics?.viewCount, 10) || 0,
    videoCount: parseInt(ch.statistics?.videoCount, 10) || 0,
    handle: `@${cleanHandle}`,
  };
}

/**
 * Fetches recent videos for one channel.
 * @param {string} channelId
 * @param {number} maxResults
 */
export async function getRecentVideos(channelId, maxResults = 5) {
  const searchData = await ytFetch('/search', {
    part: 'snippet',
    channelId,
    type: 'video',
    order: 'date',
    maxResults: Math.min(50, maxResults),
  });

  const videoIds = (searchData?.items || []).map((i) => i.id?.videoId).filter(Boolean);
  if (!videoIds.length) return [];

  const statsData = await ytFetch('/videos', {
    part: 'statistics,snippet,contentDetails',
    id: videoIds.join(','),
  });

  return (statsData?.items || []).map((v) => ({
    videoId: v.id,
    title: v.snippet?.title,
    description: v.snippet?.description || '',
    thumbnailUrl: v.snippet?.thumbnails?.medium?.url,
    publishedAt: v.snippet?.publishedAt,
    duration: v.contentDetails?.duration || '',
    views: parseInt(v.statistics?.viewCount, 10) || 0,
    likes: parseInt(v.statistics?.likeCount, 10) || 0,
    comments: parseInt(v.statistics?.commentCount, 10) || 0,
  }));
}

/**
 * Fetches normalized KOL metrics for YouTube source.
 * @param {string} channelIdOrName
 */
export async function fetchKolMetrics(channelIdOrName) {
  const ref = parseYouTubeReference(channelIdOrName);
  let stats;

  if (ref.type === 'channelId') {
    stats = await getChannelStats(ref.value);
  } else if (ref.type === 'handle') {
    stats = await getChannelByHandle(ref.value);
  } else {
    const found = await searchChannel(ref.value);
    stats = await getChannelStats(found.channelId);
  }

  const channelId = stats.channelId;
  const videos = await getRecentVideos(channelId, 5);
  const profileLinks = extractUrlsFromText(stats.description || '');

  const avgViews = videos.length
    ? Math.round(videos.reduce((sum, video) => sum + video.views, 0) / videos.length)
    : 0;

  return {
    platform: 'youtube',
    platformUserId: stats.channelId,
    handle: stats.handle || stats.title,
    displayName: stats.title || stats.handle,
    avatarUrl: stats.thumbnailUrl,
    subscribers: stats.subscribers,
    totalViews: stats.totalViews,
    views: avgViews,
    videoCount: stats.videoCount,
    recentVideos: videos,
    profileDescription: stats.description || '',
    profileLinks,
    channelUrl: stats.handle
      ? `https://www.youtube.com/${stats.handle}`
      : `https://www.youtube.com/channel/${channelId}`,
  };
}
