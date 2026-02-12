require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { initDB } = require('./db/init');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// Journal de logs (audit — conformité X Developer Agreement § VIII)
const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'maas-api.log');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

function auditLog(msg, meta = {}) {
  const line = `${new Date().toISOString()} | ${msg}${Object.keys(meta).length ? ' | ' + JSON.stringify(meta) : ''}\n`;
  fs.appendFileSync(LOG_FILE, line, 'utf8');
}

// Middleware de journalisation des requêtes API
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    auditLog('REQUEST', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - start,
    });
  });
  next();
});

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

// Initialiser la base de données
const db = initDB();
app.locals.db = db;
app.locals.auditLog = auditLog; // Pour tracer les appels API X depuis les routes

// Routes API
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'MaaS Backend', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[MaaS] Serveur démarré sur http://localhost:${PORT}`);
  console.log(`[MaaS] Supabase: ${process.env.SUPABASE_URL ? '✓ Configuré' : '✗ Non configuré'}`);
  console.log(`[MaaS] Apify: ${process.env.APIFY_TOKEN ? '✓ Configuré' : '✗ Non configuré'}`);
  console.log(`[MaaS] Twitter API: ${process.env.TWITTER_BEARER_TOKEN ? '✓ Configuré' : '✗ Non configuré'}`);
});
