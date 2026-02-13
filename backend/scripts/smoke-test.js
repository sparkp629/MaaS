const { startServer } = require('../server');

const SMOKE_PORT = Number(process.env.SMOKE_PORT || 3101);
const BASE_URL = `http://127.0.0.1:${SMOKE_PORT}`;

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

async function getJson(pathname) {
  const response = await fetch(`${BASE_URL}${pathname}`);
  if (!response.ok) {
    throw new Error(`GET ${pathname} a échoué (${response.status})`);
  }
  return response.json();
}

async function postJson(pathname, body, headers = {}) {
  const response = await fetch(`${BASE_URL}${pathname}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  return { status: response.status, payload };
}

async function run() {
  const server = startServer(SMOKE_PORT);
  await wait(450);

  try {
    const health = await getJson('/health');
    if (health.status !== 'ok') {
      throw new Error('Health check invalide');
    }

    const dashboard = await getJson('/api/dashboard');
    if (!dashboard.overview || !Array.isArray(dashboard.top_kols) || !Array.isArray(dashboard.campaigns)) {
      throw new Error('Payload dashboard invalide');
    }

    const kols = await getJson('/api/kols');
    if (!Array.isArray(kols.kols) || kols.kols.length === 0) {
      throw new Error('Liste KOL vide');
    }

    const roi = await getJson('/api/roi/estimate?budget=3000&niche=AI%20Tools&duration=3');
    if (typeof roi.roi_percent !== 'number') {
      throw new Error('Payload ROI invalide');
    }

    // Vérifie aussi le rate-limit suggestions (3/jour)
    const userAgent = `maas-smoke-${Date.now()}`;
    for (let i = 0; i < 3; i += 1) {
      const result = await postJson(
        '/api/suggestions',
        { content: `Suggestion smoke #${i + 1} - contenu valide`, category: 'general' },
        { 'User-Agent': userAgent }
      );

      if (result.status !== 200 || !result.payload.success) {
        throw new Error(`Suggestion #${i + 1} rejetée de manière inattendue`);
      }
    }

    const limitReached = await postJson(
      '/api/suggestions',
      { content: 'Suggestion smoke #4 - doit être bloquée', category: 'general' },
      { 'User-Agent': userAgent }
    );

    if (limitReached.status !== 429) {
      throw new Error('Le rate-limit des suggestions n\'est pas appliqué');
    }

    console.log('[SMOKE] OK - Endpoints critiques validés');
  } finally {
    await closeServer(server);
  }
}

run().catch((error) => {
  console.error('[SMOKE] ECHEC:', error.message);
  process.exit(1);
});
