/**
 * Meta Graph API Client (Facebook + Instagram)
 * Requiert META_APP_ID + META_APP_SECRET + Page Access Token
 */

const BASE_URL = 'https://graph.facebook.com/v18.0';

export function isConfigured() {
  return !!(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

/**
 * Récupère les insights d'une page Facebook
 * @param {string} pageAccessToken
 * @param {string} pageId
 */
export async function getPageInsights(pageAccessToken, pageId) {
  if (!pageAccessToken) throw new Error('Page access_token requis');

  const res = await fetch(
    `${BASE_URL}/${pageId}/insights?metric=page_impressions,page_engaged_users&period=day&access_token=${pageAccessToken}`
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Meta API ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json();
}

/**
 * Récupère les stats d'un compte Instagram Business
 * @param {string} accessToken
 * @param {string} igUserId — ID numérique Instagram Business
 */
export async function getInstagramInsights(accessToken, igUserId) {
  if (!accessToken) throw new Error('access_token requis');

  const res = await fetch(
    `${BASE_URL}/${igUserId}/insights?metric=impressions,reach,follower_count&period=day&access_token=${accessToken}`
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Instagram API ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json();
}

/**
 * Placeholder : récupère métriques KOL Meta
 */
export async function fetchKolMetrics(accessToken, pageId) {
  if (!isConfigured()) {
    return {
      platform: 'meta',
      platformUserId: pageId,
      handle: null,
      displayName: null,
      followers: 0,
      impressions: 0,
      engagementRate: 0,
      _status: 'not_configured',
    };
  }

  const insights = await getPageInsights(accessToken, pageId);
  return {
    platform: 'meta',
    platformUserId: pageId,
    handle: null,
    displayName: null,
    followers: 0,
    impressions: 0,
    engagementRate: 0,
    extra: insights,
  };
}
