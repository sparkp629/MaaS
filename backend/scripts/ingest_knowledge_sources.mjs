import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import mammoth from 'mammoth';
import { getDb } from '../db/init.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse/lib/pdf-parse.js');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..', '..');
const draftsRoot = path.resolve(workspaceRoot, '..', '..', 'Drafts');

const SCAN_EXT = new Set([
  '.txt',
  '.pdf',
  '.md',
  '.docx',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.svg',
]);

const TOPIC_RULES = [
  { topic: 'kol', words: ['kol', 'influenc', 'creator', 'outreach'] },
  { topic: 'dashboard', words: ['dashboard', 'frontend', 'interface', 'layout', 'ui', 'ux'] },
  { topic: 'marketing', words: ['marketing', 'offer', 'headline', 'storytelling', 'copywriting', 'wiifm'] },
  { topic: 'seo', words: ['seo', 'search', 'semantic', 'intent'] },
  { topic: 'niche-avatar', words: ['avatar', 'niche', 'persona', 'schwartz'] },
  { topic: 'ia-automation', words: ['ia', 'ai', 'automation', 'agent', 'langgraph'] },
  { topic: 'funnel', words: ['funnel', 'landing', 'checkout', 'upsell', 'conversion', 'tunnel'] },
  { topic: 'visual-assets', words: ['background', 'design', 'mockup', 'thumbnail', 'image'] },
];

const HARD_IGNORE = [
  'reentrancy',
  'smartcontrat',
  'smartcontract',
  'eip-8004',
  'x402',
  'qr code',
  'accescontrol',
];

function normalize(p) {
  return p.replace(/\\/g, '/');
}

function sourceType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.txt') return 'txt';
  if (ext === '.pdf') return 'pdf';
  if (ext === '.md') return 'md';
  if (ext === '.docx') return 'docx';
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext)) return 'image';
  return 'other';
}

function scoreFile(filePath) {
  const name = path.basename(filePath).toLowerCase();
  const full = filePath.toLowerCase();

  if (HARD_IGNORE.some((w) => name.includes(w) || full.includes(w))) {
    return { include: false, score: 0, topic: 'ignored' };
  }

  let best = { topic: 'general', score: 0 };

  for (const rule of TOPIC_RULES) {
    const hits = rule.words.reduce((n, w) => n + (full.includes(w) ? 1 : 0), 0);
    if (hits > best.score) {
      best = { topic: rule.topic, score: hits };
    }
  }

  const include = best.score > 0;
  const bonus = sourceType(filePath) === 'txt' || sourceType(filePath) === 'md' ? 10 : 0;
  const relevance = Math.min(100, best.score * 25 + bonus);

  return {
    include,
    score: relevance,
    topic: best.topic,
  };
}

function chunkText(text, maxChars = 1500) {
  const clean = String(text || '').replace(/\u0000/g, '').trim();
  if (!clean) return [];

  const chunks = [];
  let cursor = 0;

  while (cursor < clean.length) {
    const slice = clean.slice(cursor, cursor + maxChars);
    chunks.push(slice);
    cursor += maxChars;
  }

  return chunks;
}

function estimateTokens(text) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words * 1.3));
}

async function collectFiles(root) {
  const files = [];

  async function walk(current) {
    let entries = [];
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name.startsWith('.git') || entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }

      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (SCAN_EXT.has(ext)) {
        files.push(fullPath);
      }
    }
  }

  await walk(root);
  return files;
}

async function extractFromPdf(filePath) {
  try {
    const buffer = await fs.readFile(filePath);
    const parsed = await pdfParse(buffer);
    const text = String(parsed?.text || '').replace(/\u0000/g, '').trim();

    if (!text || text.length < 80) {
      return { text: '', status: 'metadata_only', reason: 'pdf_text_too_short' };
    }

    return { text, status: 'extracted', reason: null };
  } catch {
    return { text: '', status: 'metadata_only', reason: 'pdf_parse_failed' };
  }
}

async function extractFromDocx(filePath) {
  try {
    const out = await mammoth.extractRawText({ path: filePath });
    const text = String(out?.value || '').replace(/\u0000/g, '').trim();

    if (!text || text.length < 80) {
      return { text: '', status: 'metadata_only', reason: 'docx_text_too_short' };
    }

    return { text, status: 'extracted', reason: null };
  } catch {
    return { text: '', status: 'metadata_only', reason: 'docx_parse_failed' };
  }
}

async function extractFromSource(filePath, type) {
  if (type === 'txt' || type === 'md') {
    const text = await fs.readFile(filePath, 'utf8').catch(() => '');
    return {
      text: String(text || '').replace(/\u0000/g, '').trim(),
      status: 'extracted',
      reason: null,
    };
  }

  if (type === 'pdf') {
    return extractFromPdf(filePath);
  }

  if (type === 'docx') {
    return extractFromDocx(filePath);
  }

  if (type === 'image') {
    const base = path.basename(filePath);
    const descriptor = `Image asset for dashboard or content context: ${base}`;
    return { text: descriptor, status: 'extracted', reason: null };
  }

  return { text: '', status: 'metadata_only', reason: 'unsupported_type' };
}

async function upsertSource(conn, filePath, info, stat, extractionMeta = {}) {
  const sourcePath = normalize(filePath);
  const metadata = {
    size: stat.size,
    mtime: stat.mtime.toISOString(),
    topic: info.topic,
    ...extractionMeta,
  };

  const existing = conn
    .prepare('SELECT id FROM knowledge_sources WHERE file_path = ?')
    .get(sourcePath);

  const sourcePayload = [
    sourceType(filePath),
    info.topic,
    info.score,
    info.include ? 1 : 0,
    info.include ? extractionMeta.extractionStatus || 'pending' : 'ignored',
    JSON.stringify(metadata),
  ];

  if (existing?.id) {
    conn
      .prepare(
        `UPDATE knowledge_sources
         SET source_type = ?,
             topic = ?,
             relevance_score = ?,
             include_in_scope = ?,
             extraction_status = ?,
             metadata_json = ?,
             updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(...sourcePayload, existing.id);

    return existing.id;
  }

  const insert = conn
    .prepare(
      `INSERT INTO knowledge_sources (
        file_path,
        source_type,
        topic,
        relevance_score,
        include_in_scope,
        extraction_status,
        metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(sourcePath, ...sourcePayload);

  return insert.lastInsertRowid;
}

async function ingest() {
  const conn = getDb();
  const files = [
    ...(await collectFiles(workspaceRoot)),
    ...(await collectFiles(draftsRoot)),
  ];

  const deleteChunksStmt = conn.prepare('DELETE FROM knowledge_chunks WHERE source_id = ?');
  const deleteVectorsStmt = conn.prepare('DELETE FROM knowledge_vectors WHERE source_id = ?');
  const insertChunkStmt = conn.prepare(
    `INSERT INTO knowledge_chunks (source_id, chunk_index, text_content, token_estimate)
     VALUES (?, ?, ?, ?)`
  );

  let included = 0;
  let ignored = 0;
  let chunkCount = 0;
  let metadataOnly = 0;
  let extractedPdfCount = 0;

  for (const filePath of files) {
    const stat = await fs.stat(filePath).catch(() => null);
    if (!stat || !stat.isFile()) continue;

    const info = scoreFile(filePath);
    const type = sourceType(filePath);

    if (!info.include) {
      await upsertSource(conn, filePath, info, stat, {
        extractionStatus: 'ignored',
        parseReason: 'out_of_scope',
      });
      ignored += 1;
      continue;
    }

    const extracted = await extractFromSource(filePath, type);
    const chunks = chunkText(extracted.text, 1500);
    const extractionStatus = chunks.length ? 'extracted' : 'metadata_only';

    const sourceId = await upsertSource(conn, filePath, info, stat, {
      extractionStatus,
      parseReason: extracted.reason,
      chunkCount: chunks.length,
    });

    deleteChunksStmt.run(sourceId);
    deleteVectorsStmt.run(sourceId);

    included += 1;

    if (!chunks.length) {
      metadataOnly += 1;
      conn
        .prepare("UPDATE knowledge_sources SET extraction_status = 'metadata_only' WHERE id = ?")
        .run(sourceId);
      continue;
    }

    chunks.forEach((chunk, idx) => {
      insertChunkStmt.run(sourceId, idx, chunk, estimateTokens(chunk));
    });

    if (type === 'pdf') {
      extractedPdfCount += 1;
    }

    chunkCount += chunks.length;

    conn
      .prepare("UPDATE knowledge_sources SET extraction_status = 'extracted' WHERE id = ?")
      .run(sourceId);
  }

  const stats = conn
    .prepare(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN include_in_scope = 1 THEN 1 ELSE 0 END) AS in_scope,
        SUM(CASE WHEN extraction_status = 'extracted' THEN 1 ELSE 0 END) AS extracted,
        SUM(CASE WHEN extraction_status = 'metadata_only' THEN 1 ELSE 0 END) AS metadata_only
       FROM knowledge_sources`
    )
    .get();

  console.log(
    JSON.stringify(
      {
        scanned: files.length,
        included,
        ignored,
        chunkCount,
        metadataOnly,
        extractedPdfCount,
        db: stats,
      },
      null,
      2
    )
  );
}

ingest().catch((error) => {
  console.error(error);
  process.exit(1);
});
