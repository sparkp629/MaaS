import { Router } from 'express';
import Stripe from 'stripe';
import { getDashboardSummary, getSampleKOLs } from '../db/samples.js';
import { orchestrate } from '../services/contentOrchestrator.js';
import { getIntelligenceSummary } from '../services/marketAnalysis.js';
import {
  createSuggestion,
  getRoiSummary,
} from '../db/dal.js';
import { rateLimitSuggestions } from '../middleware/rateLimit.js';

const router = Router();
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

router.get('/dashboard', (_, res) => {
  res.json(getDashboardSummary());
});

router.get('/kol', (_, res) => {
  res.json(getSampleKOLs());
});

router.get('/intelligence', (_, res) => {
  res.json(getIntelligenceSummary());
});

router.get('/roi', (_, res) => {
  res.json(getRoiSummary());
});

router.post('/content/generate', (req, res) => {
  const { productName, productDescription, niche, tone } = req.body || {};
  if (!productName) {
    return res.status(400).json({ error: 'productName requis' });
  }
  try {
    const result = orchestrate(
      productName,
      productDescription || '',
      niche || '',
      tone || 'informatif'
    );
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/suggestions', rateLimitSuggestions, (req, res) => {
  const { text } = req.body || {};
  if (!text?.trim()) {
    return res.status(400).json({ error: 'text requis' });
  }
  try {
    const ipHash = req.ip ? Buffer.from(req.ip).toString('base64').slice(0, 32) : null;
    const { id } = createSuggestion(text, ipHash);
    res.json({ ok: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/checkout/create-session', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({
      error: 'Paiement non configuré. Définissez STRIPE_SECRET_KEY.',
    });
  }
  const { priceId, successUrl, cancelUrl } = req.body || {};
  const pid = priceId || process.env.STRIPE_PRICE_ID;
  if (!pid) {
    return res.status(400).json({ error: 'priceId ou STRIPE_PRICE_ID requis' });
  }
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: pid, quantity: 1 }],
      success_url: successUrl || `${req.headers.origin || ''}/checkout/success`,
      cancel_url: cancelUrl || `${req.headers.origin || ''}/checkout`,
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export { router as apiRouter };
