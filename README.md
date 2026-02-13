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
# (optionnel) valider les endpoints critiques
npm run smoke

# 2. Frontend (dans un autre terminal)
cd frontend
npm install
npm run dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:5173

## Configuration Backend (.env à la racine)

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=votre_clé
APIFY_TOKEN=votre_token
TWITTER_BEARER_TOKEN=votre_bearer_token
PORT=3001
NODE_ENV=development

# Optionnel: liste des origines CORS autorisées (CSV)
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Optionnel en prod: chemin absolu vers frontend/dist
# FRONTEND_DIST_PATH=/var/www/maas/frontend/dist
```

## Configuration Frontend (frontend/.env, optionnel)

```env
# Laisser vide en déploiement mono-serveur (backend sert déjà /api)
VITE_API_BASE_URL=
```

## Déploiement Production (coût minimal, 1 seul serveur Node)

Le mode recommandé est **mono-serveur**:
- backend Express + API
- frontend Vite buildé et servi statiquement par Express

```bash
# 1) Installer les dépendances
npm run setup

# 2) Builder le frontend
npm run build

# 3) Configurer la prod
cp .env.example .env
# puis mettre NODE_ENV=production et PORT selon votre infra

# 4) Démarrer l'application
npm run start

# 5) Vérifier la santé applicative
curl http://localhost:3001/health
```

Validation backend avant mise en ligne:

```bash
npm run smoke
```

## Déploiement VPS (Nginx + systemd)

Templates fournis:
- `infra/nginx/maas.conf`
- `infra/systemd/maas.service`

Procédure standard (Ubuntu/Debian):

```bash
# 1) Déployer le code sur le VPS
sudo mkdir -p /opt/maas/current /opt/maas/shared
sudo chown -R $USER:$USER /opt/maas

# 2) Installer et builder
cd /opt/maas/current
npm run setup
npm run build

# 3) Configurer l'environnement runtime
cp .env.example /opt/maas/shared/.env
# puis éditer /opt/maas/shared/.env (NODE_ENV=production, CORS_ORIGINS, tokens, etc.)

# 4) Installer le service systemd
sudo cp infra/systemd/maas.service /etc/systemd/system/maas.service
# IMPORTANT: adapter WorkingDirectory / EnvironmentFile / User dans le fichier
sudo systemctl daemon-reload
sudo systemctl enable --now maas
sudo systemctl status maas

# 5) Installer la conf Nginx
sudo cp infra/nginx/maas.conf /etc/nginx/sites-available/maas.conf
# IMPORTANT: remplacer server_name par votre domaine
sudo ln -sf /etc/nginx/sites-available/maas.conf /etc/nginx/sites-enabled/maas.conf
sudo nginx -t
sudo systemctl reload nginx

# 6) Option HTTPS automatique (Let's Encrypt)
sudo certbot --nginx -d maas.example.com
```

Vérifications post-déploiement:

```bash
curl http://127.0.0.1:3001/health
curl https://maas.example.com/health
curl https://maas.example.com/api/dashboard
```

## CI/CD minimaliste (GitHub Actions + SSH)

Le workflow est fourni dans:
- `.github/workflows/deploy-vps.yml`

Principe:
1. Vérifie le code (install + smoke + build)
2. Se connecte en SSH au VPS
3. Exécute `infra/scripts/deploy.sh` (git pull, build, restart, healthcheck)

Secrets GitHub à configurer (Repository Settings → Secrets and variables → Actions):

| Secret | Obligatoire | Exemple |
|--------|-------------|---------|
| `VPS_HOST` | Oui | `203.0.113.10` |
| `VPS_USER` | Oui | `deploy` |
| `VPS_SSH_KEY` | Oui | Clé privée OpenSSH (multi-lignes) |
| `VPS_PORT` | Non | `22` |
| `VPS_APP_DIR` | Non | `/opt/maas/current` |
| `VPS_SERVICE_NAME` | Non | `maas` |
| `VPS_HEALTHCHECK_URL` | Non | `http://127.0.0.1:3001/health` |

Déclenchement:
- automatique sur push `main`
- manuel via `workflow_dispatch` (branche sélectionnable)

Pré-requis VPS pour le user SSH:
- accès en écriture au dossier applicatif
- droit de redémarrer le service systemd

Template sudoers fourni:
- `infra/systemd/maas-sudoers`

## Architecture

```
MaaS/
├── package.json                # Scripts racine (setup/build/start/smoke)
├── .github/
│   └── workflows/deploy-vps.yml   # CI/CD minimal vers VPS
├── infra/
│   ├── nginx/maas.conf            # Reverse proxy Nginx
│   ├── scripts/deploy.sh          # Script de déploiement SSH
│   └── systemd/
│       ├── maas.service           # Service Linux de l'app
│       └── maas-sudoers           # Droits sudo minimaux (restart/status)
├── backend/
│   ├── server.js                 # Serveur Express
│   ├── db/init.js                # Schema + seed data
│   ├── routes/api.js             # Endpoints API
│   ├── scripts/smoke-test.js     # Smoke test backend
│   └── services/
│       ├── marketAnalysis.js     # Audit de marché
│       ├── kolScoring.js         # Scoring KOL (10 variables)
│       ├── mindshareIndex.js     # Calcul Mindshare Index
│       └── contentOrchestrator.js # Génération de contenu
├── frontend/
│   ├── .env.example              # Variable VITE_API_BASE_URL
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
