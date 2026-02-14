/**
 * Content Orchestrator — Hook → 3 formats (X Thread, LinkedIn, Short)
 * v2 : LLM si configuré, sinon fallback templates
 */

import * as llm from './llmClient.js';

function uuid() {
  return crypto.randomUUID();
}

const TONE_PROFILES = {
  technique: { emoji: 0, style: 'précis, data-driven' },
  informatif: { emoji: 1, style: 'clair, pédagogique' },
  sarcastique: { emoji: 2, style: 'ironique, punchlines' },
  inspirant: { emoji: 2, style: 'storytelling, vision' },
  casual: { emoji: 2, style: 'décontracté' },
};

const HOOK_PATTERNS = [
  (p, n) => `Et si ${p} pouvait faire en 5 min ce qui vous prend 5 heures ?`,
  (p, n) => `${n} : le problème que personne n'ose résoudre... jusqu'à ${p}.`,
  (p, n) => `J'ai découvert ${p} et mon workflow ne sera plus jamais le même.`,
];

/**
 * Extrait ou génère un Hook à partir du produit
 */
export function extractHook(productName, productDescription = '', niche = '') {
  const desc = productDescription.trim() || productName;
  const idx = Math.floor(Math.random() * HOOK_PATTERNS.length);
  const text = HOOK_PATTERNS[idx](productName, niche || 'votre niche');
  return {
    id: uuid(),
    text,
    platform: 'twitter',
    source: { productName, niche, descriptionSnippet: desc.slice(0, 100) },
  };
}

/**
 * Génère un thread X (structure : hook → problem → agitation → solution → proof → cta)
 */
export function generateThread(hook, productName, niche, tone = 'informatif') {
  const t = TONE_PROFILES[tone] || TONE_PROFILES.informatif;
  const emoji = t.emoji > 0 ? '🧵 ' : '';
  return {
    id: uuid(),
    hookId: hook.id,
    format: 'thread',
    tone,
    platform: 'twitter',
    content: [
      `${emoji}${hook.text}`,
      ``,
      `Le contexte : en ${niche || 'cette niche'}, beaucoup perdent des heures sur des tâches répétitives.`,
      ``,
      `Le piège : on s'habitue. On se dit "c'est comme ça". Jusqu'à ce qu'on découvre ${productName}.`,
      ``,
      `La solution : ${productName} automatise ce qui prenait 5h. Setup en quelques clics.`,
      ``,
      `Preuve : des créateurs l'utilisent déjà. Temps gagné = focus sur ce qui compte.`,
      ``,
      `CTA : Essayez ${productName} — lien en bio. RT si ce thread vous parle 👇`,
    ].join('\n'),
    structure: ['hook', 'problem', 'agitation', 'solution', 'proof', 'cta'],
  };
}

/**
 * Génère un post LinkedIn
 */
export function generateLinkedInPost(hook, productName, niche, tone = 'informatif') {
  return {
    id: uuid(),
    hookId: hook.id,
    format: 'linkedin_post',
    tone,
    platform: 'linkedin',
    content: [
      hook.text,
      ``,
      `En travaillant avec des créateurs en ${niche || 'tech'}, j'ai vu un pattern : des heures perdues sur des tâches que des outils simples peuvent automatiser.`,
      ``,
      `La leçon : ce n'est pas la quantité de travail qui compte. C'est où on met son énergie.`,
      ``,
      `${productName} m'a permis de recentrer mon temps sur ce qui crée vraiment de la valeur.`,
      ``,
      `Lien en commentaire si vous voulez explorer. DM ouvert pour en discuter.`,
    ].join('\n\n'),
    structure: ['hook', 'story', 'insight', 'solution', 'cta'],
  };
}

/**
 * Génère un script Short (60s)
 */
export function generateShortContent(hook, productName, niche, tone = 'informatif') {
  return {
    id: uuid(),
    hookId: hook.id,
    format: 'short_script',
    tone,
    platform: 'youtube',
    script: {
      hook_visual: `0-3s | Texte : "${hook.text}" | Fond gradient, texte bold`,
      problem_demo: `3-13s | Screencast : workflow actuel lent, répétitif`,
      solution_demo: `13-43s | Démo ${productName} : setup rapide, résultat en direct`,
      result: `43-53s | Avant/Après : 5h → 5 min`,
      cta_overlay: `53-60s | "Lien en bio" + overlay`,
    },
    content: [
      `[0-3s] HOOK VISUAL: "${hook.text}"`,
      `[3-13s] PROBLEM: Démo du workflow actuel`,
      `[13-43s] SOLUTION: ${productName} en action`,
      `[43-53s] RESULT: Avant/Après`,
      `[53-60s] CTA: Lien en bio`,
    ].join('\n'),
    structure: ['hook_visual', 'problem_demo', 'solution_demo', 'result', 'cta_overlay'],
  };
}

/**
 * Orchestre : Hook → 3 formats
 * Si LLM configuré → contenu IA. Sinon → templates statiques (fallback)
 */
export function orchestrate(productName, productDescription, niche, tone = 'informatif') {
  const hook = extractHook(productName, productDescription, niche);
  return {
    hook,
    outputs: {
      thread: generateThread(hook, productName, niche, tone),
      linkedin: generateLinkedInPost(hook, productName, niche, tone),
      short: generateShortContent(hook, productName, niche, tone),
    },
    llmAvailable: llm.isConfigured(),
  };
}

/**
 * Orchestre avec LLM (async) — contenu IA si configuré, sinon fallback templates
 */
export async function orchestrateWithAI(productName, productDescription, niche, tone = 'informatif') {
  const hook = extractHook(productName, productDescription, niche);

  if (!llm.isConfigured()) {
    // Fallback templates
    return orchestrate(productName, productDescription, niche, tone);
  }

  const userPrompt = `Produit : ${productName}
Description : ${productDescription || 'Pas de description'}
Niche : ${niche || 'Tech/SaaS'}
Ton : ${tone}
Hook de départ : "${hook.text}"

Génère le contenu en te basant sur ce hook.`;

  try {
    const [threadContent, linkedinContent, shortContent] = await Promise.all([
      llm.generate(llm.SYSTEM_PROMPTS.thread, userPrompt),
      llm.generate(llm.SYSTEM_PROMPTS.linkedin, userPrompt),
      llm.generate(llm.SYSTEM_PROMPTS.short, userPrompt),
    ]);

    return {
      hook,
      llmGenerated: true,
      outputs: {
        thread: {
          id: uuid(),
          hookId: hook.id,
          format: 'thread',
          tone,
          platform: 'twitter',
          content: threadContent || generateThread(hook, productName, niche, tone).content,
          structure: ['hook', 'problem', 'agitation', 'solution', 'proof', 'cta'],
        },
        linkedin: {
          id: uuid(),
          hookId: hook.id,
          format: 'linkedin_post',
          tone,
          platform: 'linkedin',
          content: linkedinContent || generateLinkedInPost(hook, productName, niche, tone).content,
          structure: ['hook', 'story', 'insight', 'solution', 'cta'],
        },
        short: {
          id: uuid(),
          hookId: hook.id,
          format: 'short_script',
          tone,
          platform: 'youtube',
          content: shortContent || generateShortContent(hook, productName, niche, tone).content,
          structure: ['hook_visual', 'problem_demo', 'solution_demo', 'result', 'cta_overlay'],
        },
      },
    };
  } catch (err) {
    console.error('LLM error, fallback templates:', err.message);
    return {
      ...orchestrate(productName, productDescription, niche, tone),
      llmError: err.message,
    };
  }
}
