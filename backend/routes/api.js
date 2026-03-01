import { Router } from 'express';
import {
  listNiches,
  saveWorkspaceProfile,
  getDashboardSnapshot,
  getCommercialOffer,
} from '../db/dal.js';
import {
  getConnectorStatus,
  syncLiveSources,
} from '../services/liveSync.js';
import { getStrictSeedsForNiche, STRICT_KOL_SEEDS } from '../config/kolSeeds.js';
import {
  ANALYSIS_TEMPERATURE,
  COPYWRITING_TEMPERATURE,
  resolveTaskPreset,
} from '../config/copywritingConfig.js';
import { orchestrateWithAI } from '../services/contentOrchestrator.js';
import { retrieveKnowledgeContext } from '../services/knowledgeRetrieval.js';
import { getTopicsForSurvey } from '../services/substackClient.js';
import { getDb } from '../db/init.js';

const router = Router();

router.get('/niches', (_req, res) => {
  try {
    res.json({ items: listNiches() });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to load niches.' });
  }
});

router.post('/onboarding', (req, res) => {
  const { nicheKey, objective, budgetRange } = req.body || {};

  try {
    const profile = saveWorkspaceProfile({ nicheKey, objective, budgetRange });
    const dashboard = getDashboardSnapshot(profile.niche.key);

    res.json({
      profile,
      dashboard,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message || 'Unable to save onboarding profile.',
    });
  }
});

router.get('/dashboard', (req, res) => {
  try {
    const data = getDashboardSnapshot(req.query.niche);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to load dashboard.' });
  }
});

router.get('/offer', (_req, res) => {
  try {
    res.json(getCommercialOffer());
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to load commercial offer.' });
  }
});

router.get('/connectors/status', (_req, res) => {
  try {
    res.json(getConnectorStatus());
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to load connector status.' });
  }
});

router.get('/connectors/seeds', (req, res) => {
  const niche = req.query.niche;
  if (niche) {
    return res.json({
      niche,
      seeds: getStrictSeedsForNiche(niche),
    });
  }

  return res.json({
    items: STRICT_KOL_SEEDS,
  });
});

router.post('/connectors/sync', async (req, res) => {
  const { nicheKey, sources, tokens } = req.body || {};

  try {
    const syncReport = await syncLiveSources({
      nicheKey,
      sources: sources || {},
      tokens: tokens || {},
    });

    const dashboard = getDashboardSnapshot(syncReport.niche.key);

    res.json({
      ok: true,
      syncReport,
      dashboard,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || 'Unable to run connector sync.',
    });
  }
});

router.get('/copywriting/config', (_req, res) => {
  const preset = resolveTaskPreset('copywriting_high_quality');
  const analysisPreset = resolveTaskPreset('analysis');

  res.json({
    provider: preset.provider,
    temperatures: {
      copywriting: COPYWRITING_TEMPERATURE,
      analysis: ANALYSIS_TEMPERATURE,
    },
    presets: {
      analysis: analysisPreset,
      copywritingHighQuality: preset,
    },
  });
});

router.post('/copywriting/generate', async (req, res) => {
  const {
    productName,
    productDescription = '',
    niche = 'intelligence artificielle fr',
    tone = 'informatif',
  } = req.body || {};

  const cleanName = String(productName || '').trim();
  if (!cleanName) {
    return res.status(400).json({
      error: 'productName is required.',
    });
  }

  try {
    const result = await orchestrateWithAI(cleanName, productDescription, niche, tone);
    return res.json({
      ok: true,
      provider: 'openai',
      result,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Unable to generate copywriting content.',
    });
  }
});

router.post('/copywriting/generate-rag', async (req, res) => {
  const {
    productName,
    productDescription = '',
    niche = 'intelligence artificielle fr',
    tone = 'informatif',
    additionalContext = '',
    topK = Number(process.env.VECTOR_TOPK || 12),
    forceProvider = 'openai',
  } = req.body || {};

  const cleanName = String(productName || '').trim();
  if (!cleanName) {
    return res.status(400).json({
      error: 'productName is required.',
    });
  }

  try {
    const retrieval = await retrieveKnowledgeContext({
      query: `${cleanName}\n${productDescription}\n${niche}\n${tone}\n${additionalContext}`,
      topK,
      preferSupabase: true,
    });

    const result = await orchestrateWithAI(
      cleanName,
      productDescription,
      niche,
      tone,
      {
        provider: forceProvider,
        task: 'copywriting_high_quality',
        lexicalTerms: retrieval.lexicon,
        knowledgeContext: [retrieval.contextPrompt, additionalContext].filter(Boolean).join('\n\n'),
      }
    );

    return res.json({
      ok: true,
      provider: forceProvider,
      retrieval: {
        provider: retrieval.provider,
        lexiconCount: retrieval.lexicon.length,
        topMatches: retrieval.topMatches.slice(0, 10).map((match) => ({
          score: Number(match.score.toFixed(4)),
          cosine: Number(match.cosine.toFixed(4)),
          sourcePath: match.sourcePath,
          sourceType: match.sourceType,
          topic: match.topic,
          excerpt: String(match.excerpt || '').slice(0, 220),
        })),
        imageAssets: retrieval.imageAssets,
        warning: retrieval.warning || null,
      },
      result,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Unable to generate copywriting content with RAG.',
    });
  }
});

router.post('/survey/substack-topics', async (req, res) => {
  const {
    surveyAnswers = {},
    feedUrls = '',
    limit = 10,
  } = req.body || {};

  try {
    const result = await getTopicsForSurvey({
      surveyAnswers,
      feedUrls,
      limit,
    });

    return res.json({
      ok: true,
      result,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Unable to rank Substack topics from survey answers.',
    });
  }
});

router.get('/objective', (_req, res) => {
  res.json({
    mission:
      'Connect each niche to the most relevant KOL, surface top-impact social content, and extract winning Substack topics.',
    scope: [
      'KOL relevance and shortlist',
      'High-impact content feed across X, YouTube, Instagram, Meta',
      'Substack outperforming topic tracking',
    ],
  });
});

router.get('/knowledge/summary', (_req, res) => {
  try {
    const db = getDb();
    const totals = db
      .prepare(
        `SELECT
          COUNT(*) AS totalSources,
          SUM(CASE WHEN include_in_scope = 1 THEN 1 ELSE 0 END) AS inScope,
          SUM(CASE WHEN extraction_status = 'extracted' THEN 1 ELSE 0 END) AS extractedTextSources,
          SUM(CASE WHEN extraction_status = 'metadata_only' THEN 1 ELSE 0 END) AS metadataOnlySources,
          SUM(CASE WHEN extraction_status = 'ignored' THEN 1 ELSE 0 END) AS ignoredSources
        FROM knowledge_sources`
      )
      .get();

    const topSources = db
      .prepare(
        `SELECT file_path AS filePath, source_type AS sourceType, topic, relevance_score AS relevanceScore, extraction_status AS extractionStatus
         FROM knowledge_sources
         WHERE include_in_scope = 1
         ORDER BY relevance_score DESC, updated_at DESC
         LIMIT 50`
      )
      .all();

    res.json({ totals, topSources });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to load knowledge summary.' });
  }
});

router.get('/knowledge/prompts', (_req, res) => {
  try {
    const db = getDb();
    const items = db
      .prepare(
        `SELECT file_path AS filePath, source_type AS sourceType, topic, extraction_status AS extractionStatus
         FROM knowledge_sources
         WHERE include_in_scope = 1
           AND lower(file_path) LIKE '%prompt%'
         ORDER BY file_path ASC`
      )
      .all();

    return res.json({ items });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to load prompt knowledge sources.' });
  }
});

export { router as apiRouter };
