require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { initDB } = require('./db/init');
const apiRoutes = require('./routes/api');

function getCorsOrigins() {
  const configured = process.env.CORS_ORIGINS;
  if (configured && configured.trim()) {
    return configured
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  return ['http://localhost:5173', 'http://127.0.0.1:5173'];
}

function resolveFrontendDistPath() {
  if (process.env.FRONTEND_DIST_PATH && process.env.FRONTEND_DIST_PATH.trim()) {
    return path.resolve(process.env.FRONTEND_DIST_PATH.trim());
  }
  return path.join(__dirname, '..', 'frontend', 'dist');
}

function createApp() {
  const app = express();

  // Middleware
  app.use(cors({ origin: getCorsOrigins() }));
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

  // En production, servir le frontend buildé (mode "single server" économique)
  if (process.env.NODE_ENV === 'production') {
    const frontendDistPath = resolveFrontendDistPath();
    if (fs.existsSync(frontendDistPath)) {
      app.use(express.static(frontendDistPath));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path === '/health') {
          return next();
        }
        return res.sendFile(path.join(frontendDistPath, 'index.html'));
      });
    } else {
      console.warn(`[MaaS] Frontend dist introuvable: ${frontendDistPath}`);
      console.warn('[MaaS] Lancez "npm --prefix ../frontend run build" avant start:prod');
    }
  }

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
