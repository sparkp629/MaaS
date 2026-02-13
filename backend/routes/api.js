import { Router } from 'express';
import { getDashboardSummary, getSampleKOLs } from '../db/samples.js';
import { orchestrate } from '../services/contentOrchestrator.js';

const router = Router();

router.get('/dashboard', (_, res) => {
  res.json(getDashboardSummary());
});

router.get('/kol', (_, res) => {
  res.json(getSampleKOLs());
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

export { router as apiRouter };
