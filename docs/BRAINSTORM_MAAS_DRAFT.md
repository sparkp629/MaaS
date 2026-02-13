# MaaS — Conversation de Brouillon (Brainstorming)

> **Statut** : Brouillon voué à être supprimé après validation  
> **Objectif** : Clarifier le concept avant tout code. Si c'est confus pour l'humain, ce le sera pour l'IA.  
> **Repo** : https://github.com/sparkp629/MaaS

---

## Étape 1 — Contexte Fonctionnel (sans coder)

### Cible
- **Micro-SaaS founders** : créateurs de produits B2B/B2C techniques, budget limité, besoin de crédibilité
- **Key Opinion Leaders (KOLs)** : influenceurs de niche technique (<10k followers souvent), audience qualifiée, taux d'engagement élevé
- **Agences de growth** : tiers qui gèrent des campagnes pour les founders

### Problème
Le marketing traditionnel repose sur des **vanity metrics** (followers) et manque de **transparence ROI**. Les founders paient sans savoir si un KOL convertit vraiment.

### Solution
Plateforme **Mindshare-as-a-Service (MaaS)** centrée sur la **profondeur d'influence** dans des niches techniques, pas sur le volume de followers.

### Modèle économique — Option A vs B

| Critère | Setup Fee ($2k–$5k) | Retainer Performance-Based |
|--------|---------------------|-----------------------------|
| **Avantage Founder** | Autorité immédiate, audit livré en clé en main | Paiement aligné sur les résultats réels |
| **Avantage Agency** | Trésorerie prévisible, moins de friction | Recurring, fidélisation |
| **Risque Founder** | Capital upfront sans garantie de ROI | — |
| **Risque Agency** | Churn après 1 campagne | Complexité du suivi de conversion |

**Irresistible Offer** : Un "Magic Button" (Service Turnkey) — audit + première campagne clé en main — comme argument de clôture dans le funnel commercial pour pousser à la conversion compulsive.

---

## Étape 2 — Contexte Technique & Stack

### Stack proposée (Lean)

| Couche | Technologie | Justification |
|--------|-----------|---------------|
| **Frontend** | React (Latest), Tailwind CSS, Lucide Icons | Simple, rapide, écosystème riche |
| **Backend** | Node.js / TypeScript | Alignement full-JS, compétences transférables |
| **Base de données** | Supabase (PostgreSQL) | PostgreSQL + auth + API REST, faible coût |
| **APIs externes** | X API v2, Apify (scraping) | Données sociales structurées + extraction profonde |
| **Payments** | Stripe | Standard, simple, RGPD-friendly |

### Contraintes
- **Privacy-first** : rate limiting IP pour suggestions anonymes, pas de tracking intrusif
- **Pas de monolithe** : découper en services/modules réutilisables
- **Double implémentation** : chaque feature en v1 (Lean, semi-manuelle) et v2 (Agentic, x402/8004)

---

## Étape 3 — Validation du Plan (Choix techniques)

### Choix 1 : Architecture modulaire vs monolithe
| Option | Avantages | Inconvénients |
|--------|-----------|---------------|
| **Monorepo multi-packages** | Un seul repo, dépendances partagées, déploiement simplifié | Plus complexe à configurer (turborepo, nx, etc.) |
| **Microservices séparés** | Scalabilité par service, équipes autonomes | Opération lourde, latence réseau |
| **Modulaire en monorepo simple** | `backend/`, `frontend/`, `packages/shared/` | Compromis : structure claire sans overhead |

**Recommandation** : Monorepo simple (`backend/`, `frontend/`, éventuellement `packages/`) — suffisant pour un MVP, extensible vers microservices plus tard.

### Choix 2 : x402 et ERC-8004 pour la v2 Agentic
| Standard | Usage dans MaaS |
|----------|-----------------|
| **x402** (Coinbase CDP) | Paiements programmatiques HTTP : KOL payé par requête, micropaiements par conversion |
| **ERC-8004** | Registre d'identité/réputation des agents : KOL = Server Agent, Founder = Client Agent ; attestations pour pénalités |

**Inconvénient** : Complexité blockchain, gas, adoption limitée. **À réserver pour v2 uniquement.**

### Choix 3 : UI — Tailwind seul vs Shadcn
| Option | Avantages | Inconvénients |
|--------|-----------|---------------|
| **Tailwind + composants custom** | Léger, full control | Plus de temps pour les composants |
| **Shadcn/ui** | Code ouvert, composables, accessible | Dépendance à Radix, quelques K de bundle |
| **Tailwind Plus (payant)** | Blocs prêts, design cohérent | Coût licence |

**Recommandation** : **Shadcn/ui** (gratuit, open-code) ou **Tailwind seul** si budget minimal.

---

## Étape 4 — Modélisation Fine (Types & Modules)

### Modules principaux (à typer en premier)

1. **KOL Matching**
   - `KOL`, `Founder`, `MatchScore`, `EngagementMetrics`
2. **Intelligence Layer**
   - `MindshareIndex`, `ConversionCapabilityScore`, `CompetitorWeakness`
3. **Campaign Orchestrator**
   - `Hook`, `ContentFormat` (Thread, LinkedIn, Short), `Tone` (Sarcastic, Academic, Hype)
4. **Penalty / Accountability**
   - `CampaignAgreement`, `PenaltyType`, `Attestation` (v2, 8004)
5. **ROI / Attribution**
   - `Click`, `Impression`, `MindshareGrowth`, `Spend`

### Formule Mindshare Index (MI)
$$MI = \frac{(\text{Engagement Rate} \times \text{Audience Overlap})}{\text{Noise Factor}}$$

À implémenter en pur JS/TS (voir skill `niche-scoring-logic`).

---

## Étape 5 — Développement UI (Écrans)

### Tabs du Dashboard

| Tab | Contenu |
|-----|---------|
| **Discovery** | Match founders ↔ KOLs. Context-Rich Previews : 280 chars X, thumbnails YT, LinkedIn, Facebook, TikTok, Instagram |
| **Intelligence** | Top 5 segments Micro-SaaS, Competitor Weakness Matrix (profondeur technique, ROI tracking, rigidité pricing, etc.) |
| **ROI/Attribution** | Clicks, impressions, Mindshare Growth vs Spend, vue single-page |

---

## Étape 6 — Logique & Tests

- Relier les écrans à Supabase
- Tests unitaires sur les formules (MI, Conversion Score)
- E2E sur les parcours critiques (auth, matching, dashboard)

---

## Documentation & Liens Essentiels

### APIs & Authentification
- [OAuth 2.0 Google — Conformité production](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance?hl=fr)
- [OAuth 2.0 — Scopes restreints & vérification](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification)
- [YouTube Data API — Authentification](https://developers.google.com/youtube/v3/guides/authentication?hl=fr)
- [X API v2 — Quickstart & Auth](https://docs.x.com/x-api/posts/search/quickstart/resources/fundamentals/authentication)

### UI & Design
- [Shadcn/ui — Installation](https://ui.shadcn.com/docs)
- [Shadcn/ui — Directory composants](https://ui.shadcn.com/docs/directory)
- [Tailwind CSS — Docs](https://tailwindcss.com/docs)
- [Tailwind Plus UI Blocks (React)](https://tailwindcss.com/plus/ui-blocks/documentation/using-react) *(optionnel, payant)*

### Standards Agentic (v2)
- [x402 — How it works](https://docs.cdp.coinbase.com/x402/core-concepts/how-it-works)
- [x402 — Client/Server Flow](https://docs.cdp.coinbase.com/x402/core-concepts/client-server)
- [x402 — Facilitator](https://docs.cdp.coinbase.com/x402/core-concepts/facilitator)
- [x402 — HTTP 402](https://docs.cdp.coinbase.com/x402/core-concepts/http-402)
- [ERC-8004 — Spécification](https://eips.ethereum.org/EIPS/eip-8004)
- [ERC-8004 — Rationale](https://eips.ethereum.org/EIPS/eip-8004) *(section Rationale)*

### YouTube
- [YouTube Data API — Référence](https://developers.google.com/youtube/v3/docs?hl=fr)
- [YouTube Data API — OAuth 2.0](https://developers.google.com/youtube/v3/guides/auth/devices)

### Projet GitHub
- [Repo MaaS](https://github.com/sparkp629/MaaS)

---

## Patterns & Structure de Fichiers Suggérée

```
MaaS/
├── backend/                 # API Node.js/TS
│   ├── routes/
│   ├── services/           # Logique métier
│   │   ├── kolScoring.ts
│   │   ├── mindshareIndex.ts
│   │   ├── contentOrchestrator.ts
│   │   └── marketAnalysis.ts
│   ├── db/                 # Accès données (DAL)
│   └── types/              # Types partagés
├── frontend/               # React + Tailwind
│   ├── src/
│   │   ├── components/
│   │   ├── pages/          # Tabs Discovery, Intelligence, ROI
│   │   ├── hooks/
│   │   └── api/
│   └── ...
├── packages/               # Optionnel : shared types/utils
│   └── shared/
├── docs/                   # RGPD, Sécurité, Flux
└── .env.example            # Variables sans secrets
```

### Patterns validés
- **DAL (Data Access Layer)** : séparer `db/` des `services/`
- **DTO** : objets plats pour les réponses API
- **Cascading Prompts** : Extraction → Transformation → Personnalisation
- **v1 vs v2** : interfaces communes, implémentations différentes (Strategy pattern)

---

## Prochaines Actions (après validation de ce brouillon)

1. Valider ou ajuster ce document (Chat)
2. Créer les types TypeScript pour tous les modules (Composer)
3. Générer les écrans UI avec les types (Composer)
4. Implémenter la logique et les tests (Composer)
5. Commiter à chaque étape stable

---

*Document généré pour clarifier la vision avant tout développement. À supprimer ou archiver après validation.*
