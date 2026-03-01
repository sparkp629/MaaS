const API_BASE = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }

  return payload;
}

export const api = {
  getNiches() {
    return request('/niches');
  },

  getDashboard(nicheKey) {
    const search = nicheKey ? `?niche=${encodeURIComponent(nicheKey)}` : '';
    return request(`/dashboard${search}`);
  },

  saveOnboarding(payload) {
    return request('/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  getOffer() {
    return request('/offer');
  },

  getObjective() {
    return request('/objective');
  },

  getConnectorStatus() {
    return request('/connectors/status');
  },

  getConnectorSeeds(nicheKey = null) {
    const search = nicheKey ? `?niche=${encodeURIComponent(nicheKey)}` : '';
    return request(`/connectors/seeds${search}`);
  },

  syncConnectors(payload) {
    return request('/connectors/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
  },

  getCopywritingConfig() {
    return request('/copywriting/config');
  },

  generateCopywriting(payload) {
    return request('/copywriting/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
  },

  generateCopywritingRag(payload) {
    return request('/copywriting/generate-rag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
  },

  getSubstackTopicsFromSurvey(payload) {
    return request('/survey/substack-topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
  },
};
