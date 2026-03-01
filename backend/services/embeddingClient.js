const OPENAI_EMBEDDINGS_URL = 'https://api.openai.com/v1/embeddings';

function ensureOpenAiKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing for embedding generation.');
  }
}

function normalizeEmbeddingInput(input) {
  return String(input || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20000);
}

export async function embedText(text, model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small') {
  ensureOpenAiKey();
  const input = normalizeEmbeddingInput(text);

  if (!input) {
    throw new Error('Cannot embed empty text.');
  }

  const res = await fetch(OPENAI_EMBEDDINGS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model, input }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OpenAI embeddings ${res.status}: ${body.slice(0, 260)}`);
  }

  const json = await res.json();
  const vector = json?.data?.[0]?.embedding;

  if (!Array.isArray(vector) || !vector.length) {
    throw new Error('Invalid embedding payload returned by OpenAI.');
  }

  return {
    model,
    dims: vector.length,
    vector,
  };
}

export async function embedTexts(texts, model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small') {
  ensureOpenAiKey();
  const inputs = (Array.isArray(texts) ? texts : [texts])
    .map((text) => normalizeEmbeddingInput(text))
    .filter(Boolean);

  if (!inputs.length) return [];

  const res = await fetch(OPENAI_EMBEDDINGS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model, input: inputs }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OpenAI embeddings ${res.status}: ${body.slice(0, 260)}`);
  }

  const json = await res.json();
  const data = Array.isArray(json?.data) ? json.data : [];

  return data.map((item) => ({
    model,
    dims: Array.isArray(item?.embedding) ? item.embedding.length : 0,
    vector: Array.isArray(item?.embedding) ? item.embedding : [],
  }));
}

export function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || !a.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    const va = Number(a[i]) || 0;
    const vb = Number(b[i]) || 0;
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }

  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
