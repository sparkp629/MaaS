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
};
