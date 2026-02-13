---
name: content-orchestrator
description: Transforms a Hook into 3 content formats (X Thread, LinkedIn Post, Script Short) and manages Cascading Prompts. Use when adapting hooks for multi-platform campaigns, extending content templates, or generating X threads, LinkedIn posts, or short-form video scripts.
---

# Content Orchestrator — Sous-agent de contenu

Sous-agent dédié à la transformation d'un **Hook** en 3 formats distribuables. Gère les **Cascading Prompts** : chaque format est dérivé du Hook selon une chaîne de prompts définie.

---

## Périmètre

| Entrée | Sorties |
|--------|---------|
| **Hook** (accroche) | X Thread, LinkedIn Post, Script Short |

- **Inclus** : Extraction/adaptation de Hook, génération X (thread, BIP, CTA), LinkedIn Post, script Short vidéo
- **Exclu** : Ingestion données (→ agent-scraper), scoring KOL (→ niche-scoring-logic)

---

## Architecture des Cascading Prompts

```
[Hook]
    │
    ├─► Prompt 1: X Thread (structure thread → bip → cta)
    ├─► Prompt 2: LinkedIn Post (format professionnel, storytelling)
    └─► Prompt 3: Script Short (séquence visuelle 0–60s)
```

**Règle** : Le Hook est la **source unique de vérité**. Aucun format ne doit inventer d’angle absent du Hook.

---

## Étape 0 — Obtenir le Hook

Deux cas :

1. **Hook fourni** : utiliser tel quel.
2. **Hook à extraire** : `extractHook(productName, productDescription, niche)` — voir [contentOrchestrator.js](../../backend/services/contentOrchestrator.js).

Patterns de hooks éprouvés :

- `Et si [Produit] pouvait faire en 5 min ce qui vous prend 5 heures ?`
- `[Niche] : le problème que personne n'ose résoudre... jusqu'à [Produit].`
- `J'ai découvert [Produit] et mon workflow ne sera plus jamais le même.`

---

## Format 1 — X Thread

**Structure** : hook → problem → agitation → solution → proof → cta

| Bloc | Rôle |
|------|------|
| hook | Accroche forte (🧵) |
| problem | Contexte douleur/niche |
| agitation | Amplification |
| solution | Présentation produit |
| proof | Données/preuve |
| cta | Call to action + RT si ça aide |

**Fichier** : `backend/services/contentOrchestrator.js` — `generateThread`, `generateBIP`, `generateCTA`.

**Ton** : Adapter via `TONE_PROFILES` (technique, informatif, sarcastique, inspirant, casual).

---

## Format 2 — LinkedIn Post

**Spécificités LinkedIn** (vs X) :

- Ton plus professionnel, moins emojis
- Structure : Hook → Story/Contexte → Insight → CTA
- Longueur : 100–300 mots typiques, paragraphes courts
- Pas de thread : post unique avec sauts de ligne

**Structure suggérée** :

```
[Hook en 1 ligne]

[Paragraphe 1 — Contexte ou story personnel]

[Paragraphe 2 — Le problème / la leçon]

[Paragraphe 3 — La solution ou l’insight]

[CTA soft : "Lien en commentaire" / "DM si tu veux en discuter"]
```

**Note** : Le LinkedIn Post n’est pas encore implémenté dans `contentOrchestrator.js`. À ajouter via une fonction `generateLinkedInPost(hook, productName, niche, tone)`.

---

## Format 3 — Script Short

**Durée cible** : 60 secondes (YouTube Shorts, TikTok, Reels).

**Structure temporelle** :

| Segment | Durée | Contenu |
|---------|-------|---------|
| hook_visual | 0–3s | Texte bold, hook, fond gradient |
| problem_demo | 3–13s | Screencast du problème |
| solution_demo | 13–43s | Démo produit en action |
| result | 43–53s | Avant/Après + métriques |
| cta_overlay | 53–60s | Lien en bio, avis overlay |

**Fichier** : `backend/services/contentOrchestrator.js` — `generateShortContent`.

Retourner un objet `script` avec clés `hook_visual`, `problem_demo`, `solution_demo`, `result`, `cta_overlay`.

---

## Profils de ton (TONE_PROFILES)

Réutiliser les profils existants pour tous les formats :

| Profil | Style |
|--------|-------|
| technique | Précis, data-driven, peu d’emojis |
| informatif | Clair, pédagogique |
| sarcastique | Ironique, punchlines |
| inspirant | Storytelling, vision |
| casual | Décontracté, conversationnel |

---

## Structure des fichiers

| Fichier | Rôle |
|---------|------|
| `backend/services/contentOrchestrator.js` | Logique principale, CONTENT_TEMPLATES, TONE_PROFILES |
| `backend/routes/api.js` | Endpoints génération (extractHook, generateXContent, etc.) |
| `frontend/src/pages/CampaignEngine.jsx` | UI génération, affichage hook + contenus |

---

## Checklist avant modification

- [ ] Le Hook est bien la seule source d’angle
- [ ] Chaque format respecte sa structure (thread, LinkedIn, Short)
- [ ] TONE_PROFILES est appliqué de façon cohérente
- [ ] Pas de contenu inventé hors Hook/produit/niche
