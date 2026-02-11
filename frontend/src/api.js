const BASE = '/api';

async function fetchJSON(url) {
  const res = await fetch(`${BASE}${url}`);
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

async function postJSON(url, data) {
  const res = await fetch(`${BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API Error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getDashboard: () => fetchJSON('/dashboard'),
  getMarketAudit: (niche) => fetchJSON(`/market/audit${niche ? `?niche=${niche}` : ''}`),
  getNicheAnalysis: (niche) => fetchJSON(`/market/audit/${encodeURIComponent(niche)}`),
  getSegments: () => fetchJSON('/segments'),
  getWeaknesses: () => fetchJSON('/competitors/weaknesses'),
  getOffer: () => fetchJSON('/offer'),
  getKOLs: () => fetchJSON('/kols'),
  getMicroKOLs: () => fetchJSON('/kols/micro'),
  getKOLBreakdown: (id) => fetchJSON(`/kols/${id}/breakdown`),
  getMindshare: (campaignId) => fetchJSON(`/mindshare/${campaignId}`),
  getCampaigns: () => fetchJSON('/campaigns'),
  getCampaign: (id) => fetchJSON(`/campaigns/${id}`),
  generateContent: (data) => postJSON('/content/generate', data),
  getContentTones: () => fetchJSON('/content/tones'),
  getROIEstimate: (budget, niche, duration) =>
    fetchJSON(`/roi/estimate?budget=${budget}&niche=${encodeURIComponent(niche)}&duration=${duration}`),
  getCampaignROI: (id) => fetchJSON(`/roi/campaign/${id}`),
  submitSuggestion: (content, category) => postJSON('/suggestions', { content, category }),
  getSuggestionStats: () => fetchJSON('/suggestions/stats'),
  getArchitecture: () => fetchJSON('/architecture'),
};
