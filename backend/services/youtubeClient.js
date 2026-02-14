/**
 * YouTube Data API v3 Client
 * Récupère métriques publiques : vues, likes, subscribers
 */

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

function getApiKey() {
  return process.env.YOUTUBE_API_KEY || process.env.API_KEY_YOUTUBE || process.env.GOOGLE_API_KEY || null;
}

async function ytFetch(path, params = {}) {
  const key = getApiKey();
  if (!key) throw new Error('YOUTUBE_API_KEY non configuré');

  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('key', key);
  for (const [k, v] of Object.entries(params)) {
    if (v != null) url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`YouTube API ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json();
}

/**
 * Récupère les stats d'une chaîne par son ID
 * @param {string} channelId — UC...
 */
export async function getChannelStats(channelId) {
  const data = await ytFetch('/channels', {
    part: 'snippet,statistics',
    id: channelId,
  });

  const ch = data?.items?.[0];
  if (!ch) throw new Error(`Chaîne ${channelId} introuvable`);

  return {
    channelId: ch.id,
    title: ch.snippet?.title,
    description: ch.snippet?.description?.slice(0, 200),
    thumbnailUrl: ch.snippet?.thumbnails?.medium?.url,
    subscribers: parseInt(ch.statistics?.subscriberCount) || 0,
    totalViews: parseInt(ch.statistics?.viewCount) || 0,
    videoCount: parseInt(ch.statistics?.videoCount) || 0,
  };
}

/**
 * Recherche une chaîne par nom
 * @param {string} query — nom de la chaîne
 */
export async function searchChannel(query) {
  const data = await ytFetch('/search', {
    part: 'snippet',
    q: query,
    type: 'channel',
    maxResults: 1,
  });

  const item = data?.items?.[0];
  if (!item) throw new Error(`Aucune chaîne trouvée pour "${query}"`);

  return {
    channelId: item.snippet?.channelId || item.id?.channelId,
    title: item.snippet?.title,
    thumbnailUrl: item.snippet?.thumbnails?.medium?.url,
  };
}

/**
 * Récupère les dernières vidéos d'une chaîne avec stats
 * @param {string} channelId
 * @param {number} maxResults
 */
export async function getRecentVideos(channelId, maxResults = 5) {
  // Chercher les dernières vidéos
  const searchData = await ytFetch('/search', {
    part: 'snippet',
    channelId,
    type: 'video',
    order: 'date',
    maxResults: Math.min(50, maxResults),
  });

  const videoIds = (searchData?.items || []).map(i => i.id?.videoId).filter(Boolean);
  if (!videoIds.length) return [];

  // Récupérer les stats
  const statsData = await ytFetch('/videos', {
    part: 'statistics,snippet',
    id: videoIds.join(','),
  });

  return (statsData?.items || []).map(v => ({
    videoId: v.id,
    title: v.snippet?.title,
    thumbnailUrl: v.snippet?.thumbnails?.medium?.url,
    publishedAt: v.snippet?.publishedAt,
    views: parseInt(v.statistics?.viewCount) || 0,
    likes: parseInt(v.statistics?.likeCount) || 0,
    comments: parseInt(v.statistics?.commentCount) || 0,
  }));
}

/**
 * Récupère profil + métriques pour un KOL YouTube
 * @param {string} channelId — ou nom (lance une recherche)
 */
export async function fetchKolMetrics(channelIdOrName) {
  let channelId = channelIdOrName;

  // Si pas un ID YouTube (UC...), chercher par nom
  if (!channelId.startsWith('UC')) {
    const found = await searchChannel(channelId);
    channelId = found.channelId;
  }

  const stats = await getChannelStats(channelId);
  const videos = await getRecentVideos(channelId, 5);

  const avgViews = videos.length
    ? Math.round(videos.reduce((s, v) => s + v.views, 0) / videos.length)
    : 0;

  return {
    platform: 'youtube',
    platformUserId: stats.channelId,
    handle: stats.title,
    displayName: stats.title,
    avatarUrl: stats.thumbnailUrl,
    subscribers: stats.subscribers,
    totalViews: stats.totalViews,
    views: avgViews,
    videoCount: stats.videoCount,
    recentVideos: videos,
  };
}

export function isConfigured() {
  return !!getApiKey();
}
