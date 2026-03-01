import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import normalizeEnv from '../services/envNormalize.js';
import { getDb } from '../db/init.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: join(__dirname, '..', '..', '.env') });
normalizeEnv();

const SUPABASE_URL = process.env.URL_SUPABASE;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.API_KEY_SUPABASE;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Supabase credentials missing. Set URL_SUPABASE and API_KEY_SUPABASE (or SUPABASE_SERVICE_ROLE_KEY).');
}

const REST_BASE = `${SUPABASE_URL}/rest/v1`;

async function rest(path, { method = 'GET', body = null, prefer = null } = {}) {
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };

  if (body != null) {
    headers['Content-Type'] = 'application/json';
  }

  if (prefer) {
    headers.Prefer = prefer;
  }

  const res = await fetch(`${REST_BASE}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const payload = text ? (() => {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  })() : null;

  if (!res.ok) {
    throw new Error(`Supabase ${method} ${path} failed (${res.status}): ${typeof payload === 'string' ? payload : JSON.stringify(payload)}`);
  }

  return payload;
}

function toBool(value) {
  return Number(value || 0) === 1;
}

function toJson(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function inBatches(items, size = 50) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

async function upsertBatches(table, rows, conflictKey, batchSize = 50) {
  if (!rows.length) return 0;
  let processed = 0;

  for (const batch of inBatches(rows, batchSize)) {
    await rest(`/${table}?on_conflict=${encodeURIComponent(conflictKey)}`, {
      method: 'POST',
      body: batch,
      prefer: 'resolution=merge-duplicates,return=minimal',
    });
    processed += batch.length;
  }

  return processed;
}

async function loadRemoteMap(table) {
  const all = await rest(`/${table}?select=id,sqlite_id&limit=10000`);
  const map = new Map();
  for (const row of Array.isArray(all) ? all : []) {
    map.set(Number(row.sqlite_id), row.id);
  }
  return map;
}

async function run() {
  const db = getDb();

  // Sanity check table presence
  try {
    await rest('/knowledge_sources?select=id&limit=1');
  } catch (error) {
    throw new Error(
      `knowledge tables are missing in Supabase. Run docs/supabase_metadata_schema.sql first. Details: ${error.message}`
    );
  }

  const sourceRows = db
    .prepare(
      `SELECT id, file_path, source_type, topic, relevance_score, include_in_scope, extraction_status, metadata_json, created_at, updated_at
       FROM knowledge_sources`
    )
    .all()
    .map((row) => ({
      sqlite_id: Number(row.id),
      file_path: row.file_path,
      source_type: row.source_type,
      topic: row.topic,
      relevance_score: Number(row.relevance_score || 0),
      include_in_scope: toBool(row.include_in_scope),
      extraction_status: row.extraction_status,
      metadata_json: toJson(row.metadata_json),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

  await upsertBatches('knowledge_sources', sourceRows, 'sqlite_id', 80);

  const sourceIdMap = await loadRemoteMap('knowledge_sources');

  const chunkRowsLocal = db
    .prepare(
      `SELECT id, source_id, chunk_index, text_content, token_estimate, created_at
       FROM knowledge_chunks`
    )
    .all();

  const chunkRows = chunkRowsLocal
    .map((row) => {
      const sourceId = sourceIdMap.get(Number(row.source_id));
      if (!sourceId) return null;

      return {
        sqlite_id: Number(row.id),
        source_id: sourceId,
        chunk_index: Number(row.chunk_index),
        text_content: row.text_content,
        token_estimate: Number(row.token_estimate || 0),
        created_at: row.created_at,
      };
    })
    .filter(Boolean);

  await upsertBatches('knowledge_chunks', chunkRows, 'sqlite_id', 80);

  const chunkIdMap = await loadRemoteMap('knowledge_chunks');

  const vectorRowsLocal = db
    .prepare(
      `SELECT id, source_id, chunk_id, embedding_model, embedding_dims, embedding_json, created_at
       FROM knowledge_vectors`
    )
    .all();

  const vectorRows = vectorRowsLocal
    .map((row) => {
      const sourceId = sourceIdMap.get(Number(row.source_id));
      const chunkId = row.chunk_id ? chunkIdMap.get(Number(row.chunk_id)) : null;
      if (!sourceId || !chunkId) return null;

      return {
        sqlite_id: Number(row.id),
        source_id: sourceId,
        chunk_id: chunkId,
        embedding_model: row.embedding_model,
        embedding_dims: Number(row.embedding_dims || 0),
        embedding_json: toJson(row.embedding_json),
        created_at: row.created_at,
      };
    })
    .filter(Boolean);

  await upsertBatches('knowledge_vectors', vectorRows, 'sqlite_id', 30);

  console.log(
    JSON.stringify(
      {
        supabase: SUPABASE_URL,
        synced: {
          knowledge_sources: sourceRows.length,
          knowledge_chunks: chunkRows.length,
          knowledge_vectors: vectorRows.length,
        },
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
