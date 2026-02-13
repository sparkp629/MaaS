import { Router } from 'express';

const router = Router();

// Placeholder — à connecter aux services
router.get('/dashboard', (_, res) => {
  res.json({
    kolCount: 0,
    campaigns: [],
    mindshare: { value: 0, level: 'Invisible' },
  });
});

router.get('/kol', (_, res) => {
  res.json([]);
});

export { router as apiRouter };
