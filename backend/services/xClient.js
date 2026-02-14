/**
 * X (Twitter) API v2 Client
 * Récupère métriques publiques : impressions, engagement, followers
 * Conformité : pas de contenu tweet, uniquement métriques agrégées
 */

const BASE_URL = 'https://api.twitter.com/2';

function getBearer() {
  return process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN || null;
}

async function xFetch(path, params = {}) {
  const bearer = getBearer();
  if (!bearer) throw new Error('X_BEARER_TOKEN non configuré');

  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v != null) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${bearer}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`X API ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json();
}

/**
 * Récupère un profil utilisateur X par username
 * @param {string} username — sans le @
 */
export async function getUserByUsername(username) {
  const data = await xFetch(`/users/by/username/${username}`, {
    'user.fields': 'public_metrics,description,profile_image_url',
  });
  if (!data?.data) throw new Error(`Utilisateur @${username} introuvable`);

  const u = data.data;
  return {
    id: u.id,
    username: u.username,
    displayName: u.name,
    description: u.description,
    avatarUrl: u.profile_image_url,
    followers: u.public_metrics?.followers_count ?? 0,
    following: u.public_metrics?.following_count ?? 0,
    tweetCount: u.public_metrics?.tweet_count ?? 0,
  };
}

/**
 * Récupère les métriques des tweets récents d'un utilisateur
 * @param {string} userId — ID numérique X
 * @param {number} maxResults — 5 à 100 (default 10)
 */
export async function getUserTweetMetrics(userId, maxResults = 10) {
  const data = await xFetch(`/users/${userId}/tweets`, {
    max_results: Math.min(100, Math.max(5, maxResults)),
    'tweet.fields': 'public_metrics,created_at',
  });

  const tweets = data?.data || [];
  let totalImpressions = 0;
  let totalEngagement = 0;

  for (const t of tweets) {
    const m = t.public_metrics || {};
    totalImpressions += m.impression_count || 0;
    totalEngagement += (m.like_count || 0) + (m.retweet_count || 0) + (m.reply_count || 0) + (m.quote_count || 0);
  }

  const avgImpressions = tweets.length ? Math.round(totalImpressions / tweets.length) : 0;
  const engagementRate = totalImpressions > 0
    ? Math.round((totalEngagement / totalImpressions) * 10000) / 100
    : 0;

  return {
    tweetCount: tweets.length,
    totalImpressions,
    avgImpressions,
    totalEngagement,
    engagementRate,
  };
}

/**
 * Récupère profil + métriques pour un KOL
 * @param {string} username — sans @
 */
export async function fetchKolMetrics(username) {
  const user = await getUserByUsername(username);
  const metrics = await getUserTweetMetrics(user.id);

  return {
    platform: 'twitter',
    platformUserId: user.id,
    handle: `@${user.username}`,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    followers: user.followers,
    impressions: metrics.totalImpressions,
    engagementRate: metrics.engagementRate,
    tweetCount: metrics.tweetCount,
    avgImpressions: metrics.avgImpressions,
  };
}

export function isConfigured() {
  return !!getBearer();
}
