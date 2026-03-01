import { getDb } from '../db/init.js';
import { embedText, cosineSimilarity } from './embeddingClient.js';

function getSupabaseCredentials() {
  const url = process.env.URL_SUPABASE;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.API_KEY_SUPABASE;
  if (!url || !key) return null;
  return { url, key };
}

function safeJson(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function supabaseRest(path, creds) {
  const res = await fetch(`${creds.url}/rest/v1${path}`, {
    headers: {
      apikey: creds.key,
      Authorization: `Bearer ${creds.key}`,
    },
  });

  const text = await res.text();
  const payload = text ? (() => {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  })() : [];

  if (!res.ok) {
    throw new Error(`Supabase ${res.status} on ${path}: ${typeof payload === 'string' ? payload : JSON.stringify(payload)}`);
  }

  return Array.isArray(payload) ? payload : [];
}

async function loadKnowledgeFromSupabase() {
  const creds = getSupabaseCredentials();
  if (!creds) throw new Error('Supabase credentials missing.');

  const [sources, chunks, vectors] = await Promise.all([
    supabaseRest('/knowledge_sources?select=id,sqlite_id,file_path,source_type,topic,relevance_score,include_in_scope,extraction_status,metadata_json&include_in_scope=eq.true&limit=10000', creds),
    supabaseRest('/knowledge_chunks?select=id,sqlite_id,source_id,chunk_index,text_content,token_estimate&limit=10000', creds),
    supabaseRest('/knowledge_vectors?select=id,sqlite_id,source_id,chunk_id,embedding_model,embedding_dims,embedding_json&limit=10000', creds),
  ]);

  return {
    provider: 'supabase',
    sources: sources.map((row) => ({
      id: row.id,
      sqliteId: row.sqlite_id,
      filePath: row.file_path,
      sourceType: row.source_type,
      topic: row.topic,
      relevanceScore: Number(row.relevance_score || 0),
      includeInScope: !!row.include_in_scope,
      extractionStatus: row.extraction_status,
      metadata: safeJson(row.metadata_json, {}),
    })),
    chunks: chunks.map((row) => ({
      id: row.id,
      sqliteId: row.sqlite_id,
      sourceId: row.source_id,
      chunkIndex: Number(row.chunk_index || 0),
      textContent: row.text_content,
      tokenEstimate: Number(row.token_estimate || 0),
    })),
    vectors: vectors.map((row) => ({
      id: row.id,
      sqliteId: row.sqlite_id,
      sourceId: row.source_id,
      chunkId: row.chunk_id,
      embeddingModel: row.embedding_model,
      embeddingDims: Number(row.embedding_dims || 0),
      embedding: safeJson(row.embedding_json, []),
    })),
  };
}

function loadKnowledgeFromSqlite() {
  const db = getDb();

  const sources = db
    .prepare(
      `SELECT id, file_path AS filePath, source_type AS sourceType, topic, relevance_score AS relevanceScore,
              include_in_scope AS includeInScope, extraction_status AS extractionStatus, metadata_json AS metadataJson
       FROM knowledge_sources
       WHERE include_in_scope = 1`
    )
    .all()
    .map((row) => ({
      id: row.id,
      filePath: row.filePath,
      sourceType: row.sourceType,
      topic: row.topic,
      relevanceScore: Number(row.relevanceScore || 0),
      includeInScope: Number(row.includeInScope || 0) === 1,
      extractionStatus: row.extractionStatus,
      metadata: safeJson(row.metadataJson, {}),
    }));

  const chunks = db
    .prepare(
      `SELECT id, source_id AS sourceId, chunk_index AS chunkIndex, text_content AS textContent, token_estimate AS tokenEstimate
       FROM knowledge_chunks`
    )
    .all()
    .map((row) => ({
      id: row.id,
      sourceId: row.sourceId,
      chunkIndex: Number(row.chunkIndex || 0),
      textContent: row.textContent,
      tokenEstimate: Number(row.tokenEstimate || 0),
    }));

  const vectors = db
    .prepare(
      `SELECT id, source_id AS sourceId, chunk_id AS chunkId, embedding_model AS embeddingModel,
              embedding_dims AS embeddingDims, embedding_json AS embeddingJson
       FROM knowledge_vectors`
    )
    .all()
    .map((row) => ({
      id: row.id,
      sourceId: row.sourceId,
      chunkId: row.chunkId,
      embeddingModel: row.embeddingModel,
      embeddingDims: Number(row.embeddingDims || 0),
      embedding: safeJson(row.embeddingJson, []),
    }));

  return { provider: 'sqlite', sources, chunks, vectors };
}

function isPromptSourcePath(filePath) {
  const value = String(filePath || '').toLowerCase();
  return value.includes('prompt') || value.includes('/prompts/') || value.includes('titres');
}

function isLineUsable(line) {
  const clean = String(line || '').trim();
  if (!clean) return false;
  if (clean.length < 4 || clean.length > 140) return false;
  if (/^[\-#*\d\.\)\(\s]+$/.test(clean)) return false;
  return /[a-zA-ZÀ-ÿ]/.test(clean);
}

function extractExactLexicon(chunks, maxItems = 28) {
  const out = [];
  const seen = new Set();

  for (const chunk of chunks) {
    const raw = String(chunk.textContent || '');
    const lines = raw.includes('\n') ? raw.split(/\n+/) : raw.split(/(?<=[\.!?;:])\s+/);

    for (const line of lines) {
      const clean = String(line || '').trim();
      const key = clean.toLowerCase();
      if (!isLineUsable(clean) || seen.has(key)) continue;
      seen.add(key);
      out.push(clean);
      if (out.length >= maxItems) return out;
    }
  }

  return out;
}

function summarizeImageAssets(sources, limit = 8) {
  return sources
    .filter((source) => source.sourceType === 'image')
    .slice(0, limit)
    .map((source) => source.filePath);
}

function truncate(text, limit = 700) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, limit - 3)}...`;
}

function buildRagPromptContext({ lexicon, topMatches, imageAssets }) {
  const lines = [];

  if (lexicon.length) {
    lines.push('LEXIQUE EXACT A REUTILISER (garder la formulation):');
    lexicon.forEach((term) => lines.push(`- ${term}`));
  }

  if (topMatches.length) {
    lines.push('');
    lines.push('EXTRAITS SOURCES A EXPLOITER:');
    topMatches.forEach((match, idx) => {
      lines.push(`${idx + 1}. [${match.topic || 'general'}] ${match.sourcePath}`);
      lines.push(`   -> ${truncate(match.excerpt, 720)}`);
    });
  }

  if (imageAssets.length) {
    lines.push('');
    lines.push('ASSETS VISUELS COMPLEMENTAIRES DISPONIBLES:');
    imageAssets.forEach((asset) => lines.push(`- ${asset}`));
  }

  return lines.join('\n').trim();
}

function scoreMatches(queryVector, dataset, topK = 12) {
  const sourceById = new Map(dataset.sources.map((source) => [String(source.id), source]));
  const chunkById = new Map(dataset.chunks.map((chunk) => [String(chunk.id), chunk]));

  const matches = [];

  for (const vectorRow of dataset.vectors) {
    const embedding = Array.isArray(vectorRow.embedding) ? vectorRow.embedding : [];
    if (!embedding.length) continue;

    const chunk = chunkById.get(String(vectorRow.chunkId));
    const source = sourceById.get(String(vectorRow.sourceId));

    if (!chunk || !source) continue;

    const cosine = cosineSimilarity(queryVector, embedding);
    const relevanceBoost = (Number(source.relevanceScore || 0) / 100) * 0.1;
    const score = cosine * 0.9 + relevanceBoost;

    matches.push({
      score,
      cosine,
      sourceId: source.id,
      chunkId: chunk.id,
      sourcePath: source.filePath,
      sourceType: source.sourceType,
      topic: source.topic,
      excerpt: chunk.textContent,
    });
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, topK);
}

async function loadDataset(preferSupabase = true) {
  if (preferSupabase) {
    try {
      const remote = await loadKnowledgeFromSupabase();
      if (remote.vectors.length) return remote;
    } catch {
      // fallback below
    }
  }

  return loadKnowledgeFromSqlite();
}

export async function retrieveKnowledgeContext({
  query,
  topK = Number(process.env.VECTOR_TOPK || 12),
  preferSupabase = true,
} = {}) {
  const cleanQuery = String(query || '').trim();
  if (!cleanQuery) {
    return {
      provider: 'none',
      lexicon: [],
      topMatches: [],
      imageAssets: [],
      contextPrompt: '',
    };
  }

  const dataset = await loadDataset(preferSupabase);

  if (!dataset.vectors.length) {
    return {
      provider: dataset.provider,
      lexicon: [],
      topMatches: [],
      imageAssets: summarizeImageAssets(dataset.sources),
      contextPrompt: '',
      warning: 'No vectors available. Run build_knowledge_vectors first.',
    };
  }

  const queryEmbedding = await embedText(cleanQuery);
  const matches = scoreMatches(queryEmbedding.vector, dataset, topK);

  const promptSources = new Set(
    dataset.sources
      .filter((source) => isPromptSourcePath(source.filePath))
      .map((source) => String(source.id))
  );

  const promptChunks = dataset.chunks
    .filter((chunk) => promptSources.has(String(chunk.sourceId)))
    .map((chunk) => ({ textContent: chunk.textContent }))
    .slice(0, 200);

  const lexicon = extractExactLexicon(promptChunks);
  const imageAssets = summarizeImageAssets(dataset.sources);

  return {
    provider: dataset.provider,
    lexicon,
    imageAssets,
    topMatches: matches,
    contextPrompt: buildRagPromptContext({
      lexicon,
      topMatches: matches,
      imageAssets,
    }),
  };
}
