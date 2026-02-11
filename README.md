# MaaS — Mindshare-as-a-Service

Plateforme fullstack d'agence en ligne spécialisée dans l'écosystème SaaS/Micro-SaaS.
Analyse de marché, scoring KOL, orchestration de campagnes et tracking ROI.

## Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | React 18 + Vite + Tailwind CSS + Recharts |
| Backend | Node.js + Express |
| Base de données | SQLite (local) / Supabase (production) |
| APIs | Twitter API v2, Apify, Supabase |

## Démarrage Rapide

```bash
# 1. Backend
cd backend
npm install
npm run dev

# 2. Frontend (dans un autre terminal)
cd frontend
npm install
npm run dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:5173

## Configuration (.env)

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=votre_clé
APIFY_TOKEN=votre_token
TWITTER_BEARER_TOKEN=votre_bearer_token
PORT=3001
```

## Architecture

```
MaaS/
├── backend/
│   ├── server.js                 # Serveur Express
│   ├── db/init.js                # Schema + seed data
│   ├── routes/api.js             # Endpoints API
│   └── services/
│       ├── marketAnalysis.js     # Audit de marché
│       ├── kolScoring.js         # Scoring KOL (10 variables)
│       ├── mindshareIndex.js     # Calcul Mindshare Index
│       └── contentOrchestrator.js # Génération de contenu
├── frontend/
│   └── src/
│       ├── App.jsx               # Routing
│       ├── api.js                # Client API
│       ├── components/           # Layout, MindshareGauge, SuggestionBox
│       └── pages/                # Dashboard, MarketAudit, KOLScoring, etc.
└── .env
```

## Fonctionnalités

### 1. Audit de Marché
- Analyse des opportunités de contenu par niche SaaS
- Identification de 5 segments Micro-SaaS à fort potentiel
- Analyse des 8 faiblesses des agences concurrentes

### 2. KOL Scoring (10 Variables Pondérées)
| Variable | Poids |
|----------|-------|
| Taux de conversion historique | 20% |
| Taux d'engagement technique | 18% |
| Ratio contenu tech/promo | 12% |
| Autorité de niche | 10% |
| Unicité de l'audience | 10% |
| Vélocité de croissance | 8% |
| Sentiment de l'audience | 8% |
| Fréquence de publication | 5% |
| Rétention d'audience | 5% |
| Diversité des formats | 4% |

### 3. Mindshare Index (Score 0-100)
Score composite pondéré: Twitter (25%) + Newsletter (20%) + YouTube (15%) + Mentions (15%) + Sentiment (15%) + Twitch (10%)

### 4. Content Orchestrator
- Extraction de hooks depuis les pages SaaS
- 3 types de contenu X: Thread éducatif, Build in Public, CTA agressif
- Adaptation au profil psychographique du KOL
- Formats shorts pour YouTube/TikTok

### 5. Dashboard ROI Client
- Simulateur de ROI interactif
- Funnel d'attribution complet
- Comparaison vs agences traditionnelles

### 6. Suggestions Anonymes
- Hash SHA-256 (IP + User-Agent) comme empreinte
- Aucune donnée personnelle stockée
- Rate limiting: 3 suggestions/jour par fingerprint

## Endpoints API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/dashboard | Vue d'ensemble |
| GET | /api/market/audit | Opportunités de contenu |
| GET | /api/segments | Segments Micro-SaaS |
| GET | /api/competitors/weaknesses | Faiblesses concurrents |
| GET | /api/offer | Offre irrésistible |
| GET | /api/kols | KOLs avec scores |
| GET | /api/kols/micro | Micro-KOLs détectés |
| GET | /api/kols/:id/breakdown | Détail du scoring |
| GET | /api/mindshare/:id | Mindshare Index + historique |
| POST | /api/content/generate | Générer une campagne |
| GET | /api/roi/estimate | Estimation ROI |
| POST | /api/suggestions | Soumettre une suggestion anonyme |

## Alternatives API Économiques

| Service | Gratuit | Payant |
|---------|---------|--------|
| Base de données | SQLite (local) | Supabase Free ($0) → Pro ($25/mois) |
| Scraping | Crawlee (open-source) | Apify ($49/mois) |
| Email | Resend (3000/mois gratuit) | SendGrid ($20/mois) |
| Analytics | Plausible self-hosted | PostHog ($0 → $450/mois) |
