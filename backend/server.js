require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db/init');
const apiRoutes = require('./routes/api');

function createApp() {
  const app = express();

  // Middleware
  app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
  app.use(express.json());

  // Initialiser la base de données
  const db = initDB();
  app.locals.db = db;

  // Routes API
  app.use('/api', apiRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'MaaS Backend', timestamp: new Date().toISOString() });
  });

  return app;
}

function startServer(port = process.env.PORT || 3001) {
  const app = createApp();
  const server = app.listen(port, () => {
    console.log(`[MaaS] Serveur démarré sur http://localhost:${port}`);
    console.log(`[MaaS] Supabase: ${process.env.SUPABASE_URL ? '✓ Configuré' : '✗ Non configuré'}`);
    console.log(`[MaaS] Apify: ${process.env.APIFY_TOKEN ? '✓ Configuré' : '✗ Non configuré'}`);
    console.log(`[MaaS] Twitter API: ${process.env.TWITTER_BEARER_TOKEN ? '✓ Configuré' : '✗ Non configuré'}`);
  });

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp, startServer };
