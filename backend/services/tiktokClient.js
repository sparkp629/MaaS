/**
 * TikTok Marketing API Client
 * Requiert TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET
 */

const BASE_URL = 'https://open.tiktokapis.com/v2';

export function isConfigured() {
  return !!(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET);
}

/**
 * Récupère les infos d'un utilisateur TikTok
 * Requiert un access_token obtenu via OAuth2
 * @param {string} accessToken
 */
export async function getUserInfo(accessToken) {
  if (!accessToken) throw new Error('TikTok access_token requis');

  const res = await fetch(`${BASE_URL}/user/info/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: ['open_id', 'union_id', 'avatar_url', 'display_name', 'follower_count', 'likes_count', 'video_count'],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`TikTok API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const user = data?.data?.user || {};

  return {
    openId: user.open_id,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    followers: user.follower_count || 0,
    likes: user.likes_count || 0,
    videoCount: user.video_count || 0,
  };
}

/**
 * Placeholder : récupère métriques KOL TikTok
 */
export async function fetchKolMetrics(accessToken, userId) {
  if (!isConfigured()) {
    return {
      platform: 'tiktok',
      platformUserId: userId,
      handle: null,
      displayName: null,
      followers: 0,
      impressions: 0,
      engagementRate: 0,
      _status: 'not_configured',
    };
  }

  const user = await getUserInfo(accessToken);
  return {
    platform: 'tiktok',
    platformUserId: user.openId || userId,
    handle: user.displayName,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    followers: user.followers,
    impressions: 0,
    engagementRate: 0,
    views: 0,
    extra: { likes: user.likes, videoCount: user.videoCount },
  };
}
