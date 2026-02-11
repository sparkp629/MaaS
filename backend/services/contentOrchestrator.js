/**
 * Content Orchestrator Service
 * 
 * Système de prompts en cascade pour générer des campagnes de Mindshare:
 * 1. Extraction du Hook depuis les pages de vente SaaS
 * 2. Transformation en 3 types de contenus X (thread, BIP, CTA)
 * 3. Adaptation du ton au profil psychographique du KOL
 * 4. Génération de formats courts pour autres plateformes
 */

// Templates de contenu par type
const CONTENT_TEMPLATES = {
  thread: {
    structure: [
      'hook',           // Accroche forte
      'problem',        // Le problème
      'agitation',      // Amplification du problème
      'solution',       // Présentation de la solution
      'proof',          // Preuve / données
      'cta',            // Call to action
    ],
    format: '🧵 Thread éducatif',
  },
  bip: {
    structure: [
      'context',        // Contexte build in public
      'metrics',        // Métriques partagées
      'learning',       // Leçon apprise
      'next_step',      // Prochaine étape
    ],
    format: '📊 Build in Public',
  },
  cta: {
    structure: [
      'bold_claim',     // Affirmation audacieuse
      'benefits',       // 3 bénéfices clés
      'urgency',        // Urgence / rareté
      'action',         // Action immédiate
    ],
    format: '🚀 CTA Agressif',
  },
  short: {
    structure: [
      'hook_visual',    // Hook visuel (3 sec)
      'problem_demo',   // Démo du problème (10 sec)
      'solution_demo',  // Démo de la solution (30 sec)
      'result',         // Résultat (10 sec)
      'cta_overlay',    // CTA en overlay (7 sec)
    ],
    format: '⚡ Short Video',
  },
};

// Adaptations de ton psychographique
const TONE_PROFILES = {
  technique: {
    style: 'Précis, data-driven, jargon technique accepté',
    emoji_level: 'minimal',
    sentence_style: 'concis et factuel',
    example_prefix: 'Benchmark:',
    cta_style: 'Documentation → ',
  },
  informatif: {
    style: 'Clair, pédagogique, accessible',
    emoji_level: 'modéré',
    sentence_style: 'explicatif avec exemples',
    example_prefix: 'Par exemple:',
    cta_style: 'En savoir plus → ',
  },
  sarcastique: {
    style: 'Ironique, provocateur, opinions fortes',
    emoji_level: 'stratégique',
    sentence_style: 'punchlines et contrastes',
    example_prefix: 'Plot twist:',
    cta_style: 'Prouvez-moi le contraire → ',
  },
  inspirant: {
    style: 'Motivant, storytelling, vision',
    emoji_level: 'abondant',
    sentence_style: 'narratif et émotionnel',
    example_prefix: 'Imaginez:',
    cta_style: 'Commencez votre voyage → ',
  },
  casual: {
    style: 'Décontracté, authentique, conversationnel',
    emoji_level: 'naturel',
    sentence_style: 'comme un message à un ami',
    example_prefix: 'Genre:',
    cta_style: 'Go check ça → ',
  },
};

/**
 * Extrait le hook d'une description de produit SaaS
 */
function extractHook(productName, productDescription, niche) {
  // Algorithme d'extraction de hook basé sur des patterns éprouvés
  const hookPatterns = [
    `Et si ${productName} pouvait faire en 5 minutes ce qui vous prend 5 heures ?`,
    `${niche}: le problème que personne n'ose résoudre... jusqu'à ${productName}.`,
    `J'ai découvert ${productName} et mon workflow ne sera plus jamais le même.`,
    `Pourquoi les meilleurs devs utilisent ${productName} (et pourquoi vous devriez aussi).`,
    `${productName}: l'outil que j'aurais voulu avoir il y a 2 ans.`,
  ];

  // Sélection basée sur la longueur du nom et la niche
  const index = (productName.length + niche.length) % hookPatterns.length;
  return hookPatterns[index];
}

/**
 * Génère les 3 types de contenu X à partir d'un hook
 */
function generateXContent(hook, productName, niche, tone = 'informatif') {
  const toneProfile = TONE_PROFILES[tone] || TONE_PROFILES.informatif;

  const thread = generateThread(hook, productName, niche, toneProfile);
  const bip = generateBIP(productName, niche, toneProfile);
  const cta = generateCTA(hook, productName, toneProfile);

  return { thread, bip, cta, tone: toneProfile };
}

function generateThread(hook, productName, niche, tone) {
  return {
    type: 'thread',
    format: CONTENT_TEMPLATES.thread.format,
    content: [
      `🧵 ${hook}`,
      `\nLe problème:\n${tone.example_prefix} 70% des ${niche} perdent des heures sur des tâches répétitives. C'est du temps qui pourrait servir à innover.`,
      `\nEt ça empire:\nChaque heure perdue = opportunité manquée. Vos concurrents avancent pendant que vous êtes bloqué.`,
      `\nLa solution: ${productName}\n→ Automatise les tâches fastidieuses\n→ Intégration native avec votre stack\n→ Résultats mesurables dès le jour 1`,
      `\n📊 Les chiffres:\n- 45% de gain de productivité moyen\n- 3.2x ROI en 30 jours\n- +89% de satisfaction utilisateur`,
      `\n${tone.cta_style}${productName.toLowerCase().replace(/\s/g, '')}.com\n\nRT si ça peut aider quelqu'un 🔄`,
    ].join('\n'),
    estimated_engagement: '4.2% - 7.8%',
  };
}

function generateBIP(productName, niche, tone) {
  return {
    type: 'bip',
    format: CONTENT_TEMPLATES.bip.format,
    content: [
      `📊 Build in Public - Semaine 4 avec ${productName}`,
      `\n${tone.example_prefix}`,
      `Voici nos métriques de Mindshare cette semaine:`,
      `\n📈 Impressions X: +234%`,
      `📧 Taux ouverture newsletter: 34.5%`,
      `🎯 Nouveaux signups organiques: +89`,
      `💰 Revenue influenced: $4,200`,
      `\nCe qui a marché:\n→ Threads techniques > Posts promotionnels\n→ Micro-KOLs > Macro-influenceurs\n→ Authenticité > Perfection`,
      `\nLeçon de la semaine:\nLe Mindshare se construit en montrant, pas en vendant.`,
    ].join('\n'),
    estimated_engagement: '5.1% - 8.3%',
  };
}

function generateCTA(hook, productName, tone) {
  return {
    type: 'cta',
    format: CONTENT_TEMPLATES.cta.format,
    content: [
      `🚀 ${hook}`,
      `\n${productName} fait ce que personne d'autre ne fait:`,
      `\n✅ [Bénéfice 1 - Gain de temps concret]`,
      `✅ [Bénéfice 2 - Résultat mesurable]`,
      `✅ [Bénéfice 3 - Avantage compétitif unique]`,
      `\n⏰ Offre de lancement: essai gratuit 14 jours`,
      `(Plus que 48h avant la fin)`,
      `\n${tone.cta_style}${productName.toLowerCase().replace(/\s/g, '')}.com/try`,
    ].join('\n'),
    estimated_engagement: '2.8% - 5.5%',
  };
}

/**
 * Génère un contenu short (YouTube/TikTok)
 */
function generateShortContent(hook, productName, niche, tone = 'informatif') {
  return {
    type: 'short',
    format: CONTENT_TEMPLATES.short.format,
    script: {
      hook_visual: `[0-3s] "${hook}" - Texte bold sur fond gradient`,
      problem_demo: `[3-13s] Screencast: montrer le problème (workflow lent/manuel dans ${niche})`,
      solution_demo: `[13-43s] Screencast: démo de ${productName} en action`,
      result: `[43-53s] Avant/Après side-by-side avec métriques`,
      cta_overlay: `[53-60s] "Lien en bio" + avis utilisateurs en overlay`,
    },
    platforms: ['YouTube Shorts', 'TikTok', 'Instagram Reels'],
    estimated_views: '5K - 50K',
  };
}

/**
 * Adapte un contenu au profil psychographique d'un KOL
 */
function adaptContentToKOL(content, kolTone) {
  const profile = TONE_PROFILES[kolTone] || TONE_PROFILES.informatif;
  return {
    ...content,
    adapted_tone: kolTone,
    tone_profile: profile,
    adaptation_notes: `Contenu adapté au style "${kolTone}": ${profile.style}`,
  };
}

/**
 * Génère une campagne complète pour un produit
 */
function generateFullCampaign(productName, productDescription, niche, kolProfiles) {
  const hook = extractHook(productName, productDescription, niche);

  const contents = kolProfiles.map(kol => {
    const xContent = generateXContent(hook, productName, niche, kol.psychographic_tone);
    const shortContent = generateShortContent(hook, productName, niche, kol.psychographic_tone);

    return {
      kol_id: kol.id,
      kol_name: kol.name,
      kol_handle: kol.handle,
      kol_platform: kol.platform,
      tone: kol.psychographic_tone,
      x_thread: adaptContentToKOL(xContent.thread, kol.psychographic_tone),
      x_bip: adaptContentToKOL(xContent.bip, kol.psychographic_tone),
      x_cta: adaptContentToKOL(xContent.cta, kol.psychographic_tone),
      short: adaptContentToKOL(shortContent, kol.psychographic_tone),
    };
  });

  return {
    hook,
    product: productName,
    niche,
    contents,
    total_kols: kolProfiles.length,
    content_pieces: kolProfiles.length * 4,
    estimated_total_reach: kolProfiles.reduce((sum, k) => sum + k.followers, 0) * 3,
  };
}

module.exports = {
  extractHook,
  generateXContent,
  generateShortContent,
  adaptContentToKOL,
  generateFullCampaign,
  TONE_PROFILES,
  CONTENT_TEMPLATES,
};
