/**
 * Meta Graph API client (Facebook + Instagram Business)
 */

const BASE_URL = 'https://graph.facebook.com/v18.0';

export function isConfigured() {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

function buildGraphUrl(path, params = {}) {
  const url = new URL(`${BASE_URL}/${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function graphFetch(path, params = {}) {
  const accessToken =
    params.access_token ||
    process.env.META_PAGE_ACCESS_TOKEN ||
    process.env.META_ACCESS_TOKEN ||
    '';

  if (!accessToken) {
    throw new Error('Meta access token is required');
  }

  const response = await fetch(
    buildGraphUrl(path, {
      ...params,
      access_token: accessToken,
    })
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Meta API ${response.status}: ${body.slice(0, 240)}`);
  }

  return response.json();
}

export async function getPageDetails(accessToken, pageId) {
  if (!pageId) throw new Error('pageId is required');

  const payload = await graphFetch(pageId, {
    fields: 'id,name,fan_count,followers_count,link',
    access_token: accessToken,
  });

  return {
    id: payload.id,
    name: payload.name || pageId,
    followers:
      Number(payload.followers_count || payload.fan_count || 0) || 0,
    link: payload.link || `https://facebook.com/${pageId}`,
  };
}

export async function getPageInsights(accessToken, pageId) {
  if (!pageId) throw new Error('pageId is required');

  return graphFetch(`${pageId}/insights`, {
    metric: 'page_impressions,page_engaged_users',
    period: 'day',
    access_token: accessToken,
  });
}

export async function getRecentPagePosts(accessToken, pageId, limit = 5) {
  if (!pageId) throw new Error('pageId is required');

  const payload = await graphFetch(`${pageId}/posts`, {
    fields: 'id,message,created_time,permalink_url,full_picture,shares,reactions.summary(true),comments.summary(true)',
    limit: Math.min(10, Math.max(3, Number(limit) || 5)),
    access_token: accessToken,
  });

  const rows = Array.isArray(payload?.data) ? payload.data : [];

  return rows.map((row) => ({
    id: row.id,
    text: String(row.message || '').trim(),
    createdAt: row.created_time || null,
    permalink: row.permalink_url || null,
    mediaUrl: row.full_picture || null,
    likes: Number(row?.reactions?.summary?.total_count || 0),
    comments: Number(row?.comments?.summary?.total_count || 0),
    shares: Number(row?.shares?.count || 0),
  }));
}

export async function getInstagramProfile(accessToken, igUserId) {
  if (!igUserId) throw new Error('igUserId is required');

  const payload = await graphFetch(igUserId, {
    fields: 'id,username,followers_count,profile_picture_url',
    access_token: accessToken,
  });

  return {
    id: payload.id,
    username: payload.username || igUserId,
    followers: Number(payload.followers_count || 0),
    avatarUrl: payload.profile_picture_url || null,
    profileUrl: payload.username
      ? `https://instagram.com/${payload.username}`
      : null,
  };
}

export async function getRecentInstagramMedia(accessToken, igUserId, limit = 5) {
  if (!igUserId) throw new Error('igUserId is required');

  const payload = await graphFetch(`${igUserId}/media`, {
    fields:
      'id,caption,permalink,timestamp,media_type,like_count,comments_count,media_url,thumbnail_url',
    limit: Math.min(10, Math.max(3, Number(limit) || 5)),
    access_token: accessToken,
  });

  const rows = Array.isArray(payload?.data) ? payload.data : [];

  return rows.map((row) => ({
    id: row.id,
    caption: row.caption || '',
    permalink: row.permalink || null,
    createdAt: row.timestamp || null,
    mediaType: row.media_type || null,
    mediaUrl: row.media_url || row.thumbnail_url || null,
    likes: Number(row.like_count || 0),
    comments: Number(row.comments_count || 0),
  }));
}

export async function fetchKolMetrics(accessToken, pageId) {
  if (!isConfigured()) {
    throw new Error('Meta app credentials are not configured');
  }

  const [page, insights] = await Promise.all([
    getPageDetails(accessToken, pageId),
    getPageInsights(accessToken, pageId),
  ]);

  const rows = Array.isArray(insights?.data) ? insights.data : [];
  const metricMap = Object.fromEntries(rows.map((row) => [row.name, row]));

  function metric(name) {
    const values = metricMap[name]?.values;
    if (!Array.isArray(values) || values.length === 0) return 0;
    const raw = values[values.length - 1]?.value;
    if (typeof raw === 'number') return raw;
    if (raw && typeof raw === 'object') {
      return Object.values(raw).reduce(
        (sum, current) => sum + (Number(current) || 0),
        0
      );
    }
    return Number(raw) || 0;
  }

  const impressions = Number(metric('page_impressions'));
  const engagedUsers = Number(metric('page_engaged_users'));
  const engagementRate = impressions
    ? Number(((engagedUsers / impressions) * 100).toFixed(2))
    : 0;

  return {
    platform: 'Meta',
    platformUserId: page.id,
    handle: page.name,
    displayName: page.name,
    followers: page.followers,
    impressions,
    engagementRate,
    profileUrl: page.link,
    extra: {
      engagedUsers,
    },
  };
}
