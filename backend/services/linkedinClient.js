/**
 * LinkedIn Marketing API Client
 * Requiert OAuth2 (LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET)
 * Pour l'instant : structure prête, à brancher avec OAuth flow
 */

const BASE_URL = 'https://api.linkedin.com/v2';

export function isConfigured() {
  return !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
}

/**
 * Récupère les métriques d'une organisation LinkedIn
 * Nécessite un access_token obtenu via OAuth2
 * @param {string} accessToken
 * @param {string} organizationId — URN format urn:li:organization:XXX
 */
export async function getOrganizationStats(accessToken, organizationId) {
  if (!accessToken) throw new Error('LinkedIn access_token requis');

  const res = await fetch(
    `${BASE_URL}/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=${organizationId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`LinkedIn API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data;
}

/**
 * Récupère les posts récents d'une organisation
 * @param {string} accessToken
 * @param {string} organizationId
 */
export async function getOrganizationPosts(accessToken, organizationId) {
  if (!accessToken) throw new Error('LinkedIn access_token requis');

  const res = await fetch(
    `${BASE_URL}/ugcPosts?q=authors&authors=List(${organizationId})&count=10`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`LinkedIn API ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json();
}

/**
 * Placeholder : récupère métriques KOL LinkedIn
 * Retourne un objet compatible avec upsertKolMetric
 */
export async function fetchKolMetrics(accessToken, organizationId) {
  if (!isConfigured()) {
    return {
      platform: 'linkedin',
      platformUserId: organizationId,
      handle: null,
      displayName: null,
      followers: 0,
      impressions: 0,
      engagementRate: 0,
      _status: 'not_configured',
    };
  }

  const stats = await getOrganizationStats(accessToken, organizationId);
  // Adapter selon la réponse réelle de l'API
  return {
    platform: 'linkedin',
    platformUserId: organizationId,
    handle: null,
    displayName: null,
    followers: 0,
    impressions: 0,
    engagementRate: 0,
    extra: stats,
  };
}
