# Guide MaaS — Commandes, clés API, stratégies

## 1. Commandes terminal pour lancer le projet

**Une seule app** (backend + frontend), pas 3 frontends distincts. Les "3 approches" = 3 branches stratégiques à tester en changeant de branche.

### Lancer l’app

```powershell
# Terminal 1 — Backend
cd c:\Users\Admin\OneDrive\Bureau\ProjetsPerso\MaaS\backend
npm run dev

# Terminal 2 — Frontend
cd c:\Users\Admin\OneDrive\Bureau\ProjetsPerso\MaaS\frontend
npm run dev
```

Puis ouvrir **http://localhost:5173** dans le navigateur.

### Tester les 3 approches (3 branches)

```powershell
cd c:\Users\Admin\OneDrive\Bureau\ProjetsPerso\MaaS

# Approche 1 — main (Dashboard avancé, métriques, graphiques)
git checkout main
# Puis: cd backend; npm run dev  (Terminal 1)
#       cd frontend; npm run dev (Terminal 2)
# Ouvrir http://localhost:5173

# Approche 2 — stripe (Home landing, Content Orchestrator, Checkout)
git checkout stripe
# Même procédure

# Approche 3 — Stripe avec stratégies (dashboard-first ou login-first)
# Dans frontend/.env ou .env à la racine :
# VITE_STRATEGY=dashboard-first  → Dashboard = page d'accueil, login optionnel
# VITE_STRATEGY=login-first      → Gate obligatoire pour le Dashboard
# VITE_STRATEGY=default          → Home landing + Dashboard séparé (défaut)
```

**Pour changer de stratégie** : modifier `VITE_STRATEGY` dans `.env` (frontend) puis relancer `npm run dev`.

### 3 liens locaux distincts (3 frontends en parallèle)

Avec 3 terminaux frontend, vous pouvez voir les 3 approches en même temps :

```powershell
# Terminal 1 — Default (Home + Dashboard)
cd frontend
npm run dev:default
# → http://localhost:5173 (attention : http, pas https)

# Terminal 2 — Dashboard-first
npm run dev:dashboard
# → http://localhost:5174

# Terminal 3 — Login-first
npm run dev:login
# → http://localhost:5175
```

Backend partagé : un seul `npm run dev` dans `backend/` (port 3001). Les 3 frontends appellent le même API.

---

## 2. Clés API — liste complète

Toutes les APIs mentionnées dans le projet (X, YouTube, LinkedIn, Meta, TikTok, Stripe, Supabase, Apify). Seules celles utilisées actuellement sont obligatoires ; les autres préparent les futures intégrations.

| Variable | Réseau / Service | Obligatoire |
|----------|------------------|-------------|
| `STRIPE_SECRET_KEY` | Stripe | Checkout |
| `STRIPE_PRICE_ID` | Stripe | Checkout |
| `URL_SUPABASE` | Supabase | Auth |
| `API_KEY_SUPABASE` | Supabase | Auth (VITE_ dérivés auto) |
| `API_KEY_APIFY` | Apify | Scraping |
| `X_BEARER_TOKEN` | X (Twitter) | Données X |
| `YOUTUBE_API_KEY` | YouTube | Données YT |
| `LINKEDIN_CLIENT_ID` | LinkedIn | OAuth |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn | OAuth |
| `META_APP_ID` | Facebook, Instagram | Meta Graph API |
| `META_APP_SECRET` | Facebook, Instagram | Meta Graph API |
| `TIKTOK_CLIENT_KEY` | TikTok | Marketing API |
| `TIKTOK_CLIENT_SECRET` | TikTok | Marketing API |

### Où les trouver

| Variable | Où l'obtenir |
|----------|--------------|
| `STRIPE_SECRET_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys) → Secret key (sk_test_...) |
| `STRIPE_PRICE_ID` | [Stripe Dashboard](https://dashboard.stripe.com/products) → Créer un produit Magic Button → Price ID (price_...) |
| `API_KEY_SUPABASE` | [Supabase](https://supabase.com/dashboard) → Settings → API → anon public (ou service_role pour backend) |
| `URL_SUPABASE` | [Supabase](https://supabase.com/dashboard) → Settings → API → Project URL |
| `API_KEY_APIFY` | [Apify](https://console.apify.com/account/integrations) → API token |
| `VITE_SUPABASE_URL` | [Supabase](https://supabase.com/dashboard) → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | [Supabase](https://supabase.com/dashboard) → Settings → API → anon public |

### Activer Auth GitHub (connexion réelle)

1. **Supabase** : Authentication → Providers → GitHub → Enable.
2. **GitHub** : [Settings → Developer settings → OAuth Apps](https://github.com/settings/developers) → New OAuth App.
   - Homepage : `http://localhost:5173` (ou ton domaine)
   - Callback : `https://<TON_PROJECT_REF>.supabase.co/auth/v1/callback` (voir Supabase → URL)
3. Copier Client ID et Client Secret dans Supabase (GitHub provider).
4. Ajouter dans `.env` :
   ```
   VITE_SUPABASE_URL=https://arrmabvwhhqtdfogsplr.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon key de Supabase>
   ```

---

## 3. SQLite — pas de clé API

SQLite est une base de données **fichier locale** : pas de serveur distant, pas de clé API.

- Fichier : `backend/maas.db` (créé automatiquement)
- Variable optionnelle : `DB_PATH=./backend/maas.db` (chemin personnalisé)

Aucune clé n’est nécessaire pour SQLite.

---

## 4. Rôle de Supabase dans ce projet

Actuellement le projet utilise **SQLite** (fichier local). Supabase n’est pas encore branché.

Rôle prévu de Supabase :

| Usage | Intérêt |
|-------|---------|
| **PostgreSQL** | Remplacer SQLite pour la prod : multi‑utilisateurs, sauvegarde, scalabilité |
| **Auth** | Connexion GitHub/Gmail OAuth sans gérer soi‑même les tokens et sessions |
| **API REST / Realtime** | API générée automatiquement sur les tables, websockets si besoin |
| **Storage** | Fichiers (avatars KOL, exports, etc.) |

Tes clés Supabase sont prêtes pour une future migration SQLite → Supabase. Pour l’instant, SQLite suffit pour tester.

---

## 5. Parcours d’analyse du SaaS client

Aujourd’hui il n’y a pas encore d’“audit” automatisé. Le “Magic Button” promet “audit + première campagne”, mais l’audit n’est pas implémenté.

### Proposition : sondage plutôt qu’analyse de code

Un **sondage structuré** est adapté pour :

- Récolter : niche, produit, objectifs, budget, canaux
- Qualifier les suggestions (KOL matching, formats de contenu)
- Coût et maintenance faibles
- Pas de dépendance à un dépôt GitHub ou à l’analyse de code

L’**analyse de code par LLM** :

- Peut apporter : stack technique, qualité, potentiel SEO/performance
- Mais : coût LLM élevé, parsing de repos, maintenance complexe, besoin d’accès au code

**Recommandation** : commencer par un sondage de 5–10 questions. L’analyse de code restera pour une version avancée si le besoin se confirme.

---

## 6. Branches actuelles (2, pas 3)

```
main   — Dashboard avancé, métriques, graphiques
stripe — Content Orchestrator, Checkout, Intelligence, Home
```

Il n’y a pas 3 branches `main`. Pour avoir 3 approches stratégiques, on peut créer une branche dédiée, par ex. `dashboard-first`.

---

## 7. Approches stratégiques à implémenter

### Approche A — Login obligatoire (GitHub first)

- Landing explicative
- CTA “Se connecter avec GitHub” → Dashboard
- Sans login : pas d’accès au Dashboard

### Approche B — Dashboard-first (recommandée)

- Page d’accueil = Dashboard avec données de démo
- Login optionnel (GitHub/Gmail) pour :
  - sauvegarder les campagnes
  - accès complet aux métriques
  - débloquer certains KOLs ou rapports
- Restrictions sur les données sensibles (ex. ROI détaillé) pour encourager la connexion

### Approche C — Hybride

- Dashboard libre avec données limitées
- Connexion pour exporter, historiser, personnaliser
