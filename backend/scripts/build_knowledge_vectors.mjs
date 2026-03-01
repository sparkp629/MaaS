import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb } from '../db/init.js';
import normalizeEnv from '../services/envNormalize.js';
import { embedTexts } from '../services/embeddingClient.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: join(__dirname, '..', '..', '.env') });
normalizeEnv();

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const BATCH_SIZE = Number(process.env.VECTOR_BATCH_SIZE || 16);
const MAX_CHUNKS = Number(process.env.VECTOR_MAX_CHUNKS || 1200);

function normalizeVector(vec) {
  if (!Array.isArray(vec) || !vec.length) return vec;
  const norm = Math.sqrt(vec.reduce((acc, v) => acc + (Number(v) || 0) ** 2, 0));
  if (!norm) return vec;
  return vec.map((v) => Number(v) / norm);
}

function inBatches(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

async function run() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing. Cannot build knowledge vectors.');
  }

  const db = getDb();

  const allRows = db
    .prepare(
      `SELECT kc.id AS chunkId, kc.source_id AS sourceId, kc.text_content AS textContent
       FROM knowledge_chunks kc
       JOIN knowledge_sources ks ON ks.id = kc.source_id
       WHERE ks.include_in_scope = 1
       ORDER BY kc.source_id ASC, kc.chunk_index ASC`
    )
    .all();

  const rows = allRows.slice(0, MAX_CHUNKS);

  db.prepare('DELETE FROM knowledge_vectors').run();

  const insertVectorStmt = db.prepare(
    `INSERT INTO knowledge_vectors (
      source_id,
      chunk_id,
      embedding_model,
      embedding_dims,
      embedding_json
    ) VALUES (?, ?, ?, ?, ?)`
  );

  let inserted = 0;
  let failed = 0;

  for (const batch of inBatches(rows, BATCH_SIZE)) {
    const texts = batch.map((row) => row.textContent);

    try {
      const embeddings = await embedTexts(texts, EMBEDDING_MODEL);

      for (let i = 0; i < batch.length; i += 1) {
        const row = batch[i];
        const embedding = embeddings[i];

        if (!embedding || !Array.isArray(embedding.vector) || !embedding.vector.length) {
          failed += 1;
          continue;
        }

        const normalized = normalizeVector(embedding.vector);

        insertVectorStmt.run(
          row.sourceId,
          row.chunkId,
          embedding.model,
          embedding.dims,
          JSON.stringify(normalized)
        );
        inserted += 1;
      }
    } catch (error) {
      failed += batch.length;
      console.error(`[vector] batch failed (${batch.length} chunks): ${error.message}`);
    }
  }

  const stats = db.prepare('SELECT COUNT(*) AS vectorCount FROM knowledge_vectors').get();

  console.log(
    JSON.stringify(
      {
        embeddingModel: EMBEDDING_MODEL,
        chunksAvailable: allRows.length,
        chunksConsidered: rows.length,
        batchSize: BATCH_SIZE,
        inserted,
        failed,
        vectorCount: stats.vectorCount,
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
