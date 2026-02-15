import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes/api.js';
import { stripeWebhookRouter } from './routes/stripeWebhook.js';

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors({ origin: true }));

// Stripe webhook AVANT express.json() — Stripe exige le raw body
app.use('/api/webhook', stripeWebhookRouter);

app.use(express.json());

app.use('/api', apiRouter);

app.get('/health', (_, res) => res.json({ ok: true }));

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
