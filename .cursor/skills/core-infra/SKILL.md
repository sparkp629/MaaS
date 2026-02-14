---
name: core-infra
description: Gère Auth (Supabase OAuth), Stripe Checkout, Supabase (Auth + DB), variables d'environnement et configuration MaaS. Use when configuring authentication, payments, database connection, .env, VITE_* vars, or when the user mentions login, checkout, GitHub OAuth, Stripe, Supabase.
---

# Core Infra — Auth, Stripe, Supabase, Configuration

Sous-agent dédié aux briques transverses du MaaS : authentification, paiement, base de données, variables d'environnement.

---

## Périmètre

| Inclus | Exclu |
|--------|-------|
| Auth (Supabase OAuth GitHub/Gmail) | Design UI des pages |
| Stripe Checkout (Magic Button) | Scoring, métriques |
| Supabase (Auth + PostgreSQL) | Ingestion X/newsletters |
| Variables `.env`, `.env.example` | Génération de contenu |
| Dérivation `VITE_SUPABASE_*` dans vite.config | |

---

## Exemples de prompts (quand m'invoquer)

- « Configurer la connexion GitHub avec Supabase »
- « Ajouter une variable d'environnement pour TikTok »
- « Corriger l'erreur Stripe au checkout »
- « Brancher Supabase au lieu de SQLite »
- « Le login ne fonctionne pas en prod »
- « Dériver VITE_SUPABASE_URL depuis .env »

---

## Quand ne pas m'invoquer

- Création de composants Dashboard → `agent-frontend`
- Scoring Mindshare, pondérations → `niche-scoring-logic`
- Scraping X, newsletters → `agent-scraper`
- Modélisation SaaS, TCO → `strategic-architecture`

---

## 1. Auth (Supabase)

### Fichiers

| Fichier | Rôle |
|---------|------|
| `frontend/src/context/AuthContext.jsx` | Provider OAuth, login/logout |
| `frontend/src/lib/supabase.js` | Client Supabase, `isSupabaseConfigured()` |
| `frontend/vite.config.js` | Dérivation VITE_SUPABASE_* |

### Logique

- Si `URL_SUPABASE` et `API_KEY_SUPABASE` définis → Auth réelle via Supabase
- Sinon → mode démo (mock user)
- OAuth GitHub : Authentication → Providers → GitHub dans le dashboard Supabase

### Variables requises

```
URL_SUPABASE=https://xxx.supabase.co
API_KEY_SUPABASE=eyJ...
```

---

## 2. Stripe Checkout

### Fichiers

| Fichier | Rôle |
|---------|------|
| `backend/routes/api.js` | Route `/api/checkout`, `createCheckoutSession` |
| `frontend/src/pages/Checkout.jsx` | Redirection vers Stripe |
| `frontend/src/pages/CheckoutSuccess.jsx` | Page succès |

### Variables requises

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
```

---

## 3. Supabase (DB)

Actuellement SQLite (`backend/maas.db`). Migration Supabase prévue pour multi-utilisateurs.

- Schéma : `db/init.js` (inspiration)
- Requêtes : Supabase client ou `@supabase/supabase-js`

---

## 4. Configuration (.env)

### Règle

Ne jamais commiter `.env`. Variables sensibles dans `.env.example` sans valeurs réelles.

### Dérivation VITE_*

`vite.config.js` lit `URL_SUPABASE` et `API_KEY_SUPABASE` et expose `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` au frontend.

---

## Checklist avant modification

- [ ] Vérifier que `.env` n'est pas proposé en commit
- [ ] Nouvelle variable → ajouter dans `.env.example` avec valeur vide
- [ ] Stripe : utiliser les clés test en dev
