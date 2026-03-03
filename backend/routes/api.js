import { Router } from 'express';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  listNiches,
  saveWorkspaceProfile,
  getDashboardSnapshot,
  getCommercialOffer,
  getOrCreateTelegramAlertConnection,
  updateTelegramAlertConnection,
  connectTelegramChatByToken,
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
import * as llm from '../services/llmClient.js';
import * as telegramClient from '../services/telegramClient.js';

const router = Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

function buildTelegramLinkPayload(connection) {
  const botUsername = telegramClient.getBotUsername();
  const deepLink = botUsername
    ? `https://t.me/${botUsername.replace(/^@/, '')}?start=${connection.linkToken}`
    : null;

  const qrCodeUrl = deepLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(deepLink)}`
    : null;

  return {
    configured: telegramClient.isConfigured(),
    botUsername: botUsername || null,
    deepLink,
    qrCodeUrl,
    connection,
  };
}

function parseJsonArray(raw) {
  const text = String(raw || '').trim();
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start < 0 || end <= start) return [];
    try {
      const parsed = JSON.parse(text.slice(start, end + 1));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

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

router.get('/alerts/telegram/config', (req, res) => {
  try {
    const userKey = req.query.userKey || 'workspace-default';
    const connection = getOrCreateTelegramAlertConnection(userKey);
    const payload = buildTelegramLinkPayload(connection);
    return res.json({ ok: true, ...payload });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Unable to load Telegram alert configuration.',
    });
  }
});

router.post('/alerts/telegram/config', (req, res) => {
  const {
    userKey = 'workspace-default',
    minImpactScore,
    networks,
    dailyDigest,
  } = req.body || {};

  try {
    const connection = updateTelegramAlertConnection(userKey, {
      minImpactScore,
      networks,
      dailyDigest,
    });
    const payload = buildTelegramLinkPayload(connection);
    return res.json({ ok: true, ...payload });
  } catch (error) {
    return res.status(400).json({
      error: error.message || 'Unable to update Telegram alert configuration.',
    });
  }
});

router.post('/alerts/telegram/link', (req, res) => {
  const { linkToken, chatId, username } = req.body || {};

  try {
    const connection = connectTelegramChatByToken({
      linkToken,
      chatId,
      username,
    });
    const payload = buildTelegramLinkPayload(connection);
    return res.json({ ok: true, ...payload });
  } catch (error) {
    return res.status(400).json({
      error: error.message || 'Unable to bind Telegram chat.',
    });
  }
});

router.post('/alerts/telegram/test', async (req, res) => {
  const { userKey = 'workspace-default', message } = req.body || {};

  try {
    const connection = getOrCreateTelegramAlertConnection(userKey);
    if (!connection.telegramChatId) {
      return res.status(400).json({
        error: 'Telegram not connected for this user. Scan QR and link chat first.',
      });
    }

    const sent = await telegramClient.sendMessage(
      connection.telegramChatId,
      message || 'Test alerte MaaS: connexion Telegram active.'
    );

    return res.json({
      ok: true,
      messageId: sent?.message_id || null,
      connection,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Unable to send Telegram test alert.',
    });
  }
});

router.post('/kol/prompt-test', async (req, res) => {
  const {
    nicheKey = 'intelligence-artificielle-fr',
    surveyAnswers = {},
    objective = 'awareness',
    budget = 'mid',
    countryCode = 'FR',
    language = 'fr',
    limit = 10,
  } = req.body || {};

  if (!llm.isConfigured('openai')) {
    return res.status(400).json({
      error: 'OpenAI is not configured. Add OPENAI_API_KEY in .env.',
    });
  }

  try {
    const promptPath = join(__dirname, '..', '..', 'Prompts', 'Prompt_Extract_KOLs_From_Survey.txt');
    const systemPrompt = await readFile(promptPath, 'utf8');
    const seeds = getStrictSeedsForNiche(nicheKey);

    const userPrompt = [
      'Lance extraction KOL sur ces donnees:',
      `niche: ${nicheKey}`,
      `country_code: ${countryCode}`,
      `language: ${language}`,
      `objective: ${objective}`,
      `budget: ${budget}`,
      `survey_answers_json: ${JSON.stringify(surveyAnswers || {})}`,
      `x_seed_handles: ${JSON.stringify(seeds?.xUsers || [])}`,
      `youtube_seed_channels: ${JSON.stringify(seeds?.youtubeChannels || [])}`,
      `limit: ${Math.max(1, Math.min(15, Number(limit || 10)))}`,
    ].join('\n');

    const raw = await llm.generate(systemPrompt, userPrompt, {
      provider: 'openai',
      task: 'analysis',
      temperature: 0.1,
      maxTokens: 1800,
    });

    const parsed = parseJsonArray(raw);
    const filtered = parsed
      .filter((item) => Number(item?.niche_fit_score || 0) >= 70)
      .slice(0, 15);

    return res.json({
      ok: true,
      nicheKey,
      usedSeeds: {
        xUsers: seeds?.xUsers?.length || 0,
        youtubeChannels: seeds?.youtubeChannels?.length || 0,
      },
      count: filtered.length,
      items: filtered,
      raw: raw?.slice(0, 2400) || '',
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Unable to run KOL prompt test.',
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
