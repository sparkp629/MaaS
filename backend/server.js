import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Charger .env du backend, puis .env à la racine du repo (monorepo)
dotenv.config();
dotenv.config({ path: join(__dirname, '..', '.env') });
import cors from 'cors';
import { apiRouter } from './routes/api.js';
import { initAwsSecrets } from './services/awsSecrets.js';
import { stripeWebhookRouter } from './routes/stripeWebhook.js';
import { normalizeEnv } from './services/envNormalize.js';
import { startScheduler } from './services/availabilityChecker.js';
import accountProtection from './middleware/accountProtection.js';

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors({ origin: true }));

// Lightweight account protection checks (disposable emails, missing fingerprint)
app.use(accountProtection());

// Stripe webhook AVANT express.json() — Stripe exige le raw body
app.use('/api/webhook', stripeWebhookRouter);

app.use(express.json());

app.use('/api', apiRouter);

app.get('/health', (_, res) => res.json({ ok: true }));

// Normalize env aliases and then initialize secrets (AWS Secrets Manager)
normalizeEnv();
await initAwsSecrets();

const server = app.listen(PORT, () => {
  console.log(`[MaaS Backend] OK — listening on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} already in use. Kill the old process or change PORT in .env`);
    process.exit(1);
  }
  throw err;
});

// Optionally start the availability checker (disabled by default)
if (process.env.ENABLE_AVAILABILITY_CHECKER === 'true') {
  const minutes = parseInt(process.env.AVAILABILITY_CHECK_INTERVAL_MINUTES || '60', 10);
  startScheduler({ minutes });
}
