import { Router } from 'express';
import { getDashboardSummary, getSampleKOLs } from '../db/samples.js';

const router = Router();

router.get('/dashboard', (_, res) => {
  res.json(getDashboardSummary());
});

router.get('/kol', (_, res) => {
  res.json(getSampleKOLs());
});

export { router as apiRouter };
