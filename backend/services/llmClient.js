/**
 * LLM Client — Génération de contenu IA
 * Supporte : Anthropic (Claude), OpenAI (GPT)
 * Fallback : retourne null si aucune clé configurée → le contentOrchestrator garde ses templates
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

function getProvider() {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return null;
}

export function isConfigured() {
  return !!getProvider();
}

/**
 * Appel Anthropic Claude
 */
async function callClaude(systemPrompt, userPrompt) {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Anthropic ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || '';
}

/**
 * Appel OpenAI GPT
 */
async function callOpenAI(systemPrompt, userPrompt) {
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      max_tokens: 1500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OpenAI ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Appel LLM unifié
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @returns {string|null} — null si pas configuré
 */
export async function generate(systemPrompt, userPrompt) {
  const provider = getProvider();
  if (!provider) return null;

  if (provider === 'anthropic') {
    return callClaude(systemPrompt, userPrompt);
  }
  return callOpenAI(systemPrompt, userPrompt);
}

// --- System prompts optimisés pour MaaS ---

export const SYSTEM_PROMPTS = {
  thread: `Tu es un expert en copywriting X (Twitter). Tu génères des threads viraux en français.
Règles strictes :
- Format thread : 5 à 8 tweets séparés par "---"
- Tweet 1 = Hook : accrocheur, 280 chars max
- Tweets 2-3 = Problème + Agitation
- Tweets 4-5 = Solution + Preuve
- Tweet final = CTA avec urgence subtile
- Ton : professionnel mais conversationnel
- Pas de hashtags sauf le dernier tweet (max 2)
- Pas d'émojis excessifs (max 1 par tweet)`,

  linkedin: `Tu es un expert en personal branding LinkedIn. Tu génères des posts LinkedIn en français.
Règles strictes :
- 1200-1500 caractères max
- Première ligne = Hook (accrocheur, lisible dans le feed)
- Structure : Hook → Story/Insight → Leçon → CTA
- Sauts de ligne courts (1-2 phrases par paragraphe)
- Ton : professionnel, authentique, pas corporate
- Pas de hashtags dans le corps (3 max en fin de post)
- Pas d'émojis excessifs (max 3 dans tout le post)`,

  short: `Tu es un expert en scripts vidéo courte (TikTok, Reels, Shorts). Tu génères des scripts en français.
Règles strictes :
- Durée : 45-60 secondes
- Format : [TIMING] INSTRUCTION VISUELLE + TEXTE
- 0-3s = Hook (texte à l'écran, accroche immédiate)
- 3-15s = Problème (screencast ou face cam)
- 15-40s = Solution (démo produit)
- 40-50s = Résultat (avant/après)
- 50-60s = CTA (lien en bio)
- Rythme rapide, coupures fréquentes`,
};
