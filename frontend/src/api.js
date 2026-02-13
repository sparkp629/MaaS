const API_BASE = '/api';

export const api = {
  async getDashboard() {
    const res = await fetch(`${API_BASE}/dashboard`);
    if (!res.ok) throw new Error('Dashboard fetch failed');
    return res.json();
  },
  async getKOLs() {
    const res = await fetch(`${API_BASE}/kol`);
    if (!res.ok) throw new Error('KOL fetch failed');
    return res.json();
  },
  async getIntelligence() {
    const res = await fetch(`${API_BASE}/intelligence`);
    if (!res.ok) throw new Error('Intelligence fetch failed');
    return res.json();
  },
  async getRoi() {
    const res = await fetch(`${API_BASE}/roi`);
    if (!res.ok) throw new Error('ROI fetch failed');
    return res.json();
  },
  async generateContent(body) {
    const res = await fetch(`${API_BASE}/content/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
    return data;
  },
  async submitSuggestion(text) {
    const res = await fetch(`${API_BASE}/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
    return data;
  },
  async createCheckoutSession(options = {}) {
    const res = await fetch(`${API_BASE}/checkout/create-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
    return data;
  },
};
