const API_BASE = '/api';

async function safeFetch(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}

export const api = {
  async getDashboard() {
    return safeFetch(`${API_BASE}/dashboard`);
  },
  async getKOLs() {
    return safeFetch(`${API_BASE}/kol`);
  },
  async getIntelligence() {
    return safeFetch(`${API_BASE}/intelligence`);
  },
  async getRoi() {
    return safeFetch(`${API_BASE}/roi`);
  },
  async getApiStatus() {
    return safeFetch(`${API_BASE}/status/apis`);
  },
  async getHygieneStatus() {
    return safeFetch(`${API_BASE}/status/hygiene`);
  },
  async generateContent(body) {
    return safeFetch(`${API_BASE}/content/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  },
  async submitSuggestion(text) {
    return safeFetch(`${API_BASE}/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  },
  async createCheckoutSession(options = {}) {
    return safeFetch(`${API_BASE}/checkout/create-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
  },
  async getKolMetrics(platform = null) {
    const url = platform ? `${API_BASE}/kol/metrics/${platform}` : `${API_BASE}/kol/metrics`;
    return safeFetch(url);
  },
  async fetchXKol(username) {
    return safeFetch(`${API_BASE}/kol/fetch/x`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
  },
  async fetchYouTubeKol(channelId) {
    return safeFetch(`${API_BASE}/kol/fetch/youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId }),
    });
  },
  async trackImpression(campaignId, kolId, source, count = 1) {
    return safeFetch(`${API_BASE}/track/impression`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, kolId, source, count }),
    });
  },
};
