# NOTE — Dernier échange sur le projet MaaS

> **Date** : 13 février 2025  
> **Contexte** : Échange via application mobile, conversation non synchronisée entre mobile et desktop. Ce fichier permet de retrouver le contenu de la dernière session.

---

## Demandes traitées

### 1. Règle « étape par étape » supprimée
Tu as demandé de ne plus attendre ta validation à chaque étape et de développer le projet en entier d’un coup. C’est fait.

### 2. Commandes terminal
- **Backend** : `cd backend && npm run dev`
- **Frontend** : `cd frontend && npm run dev`
- **Aperçu** : http://localhost:5173

### 3. Clés API
Liste complète dans `.env.example` : Stripe, Supabase, Apify, X, YouTube, LinkedIn, Meta, TikTok. Le fichier `.env` est gitignoré : aucune clé n’est commitée. Si tu avais ajouté Stripe/YouTube ailleurs (autre projet, fichier supprimé), colle-les dans `.env`. `VITE_SUPABASE_*` est dérivé automatiquement depuis `URL_SUPABASE` et `API_KEY_SUPABASE` par `vite.config.js`.

### 4. SQLite vs Supabase
- **SQLite** : base locale, pas de clé API.
- **Supabase** : prévu pour PostgreSQL, Auth (GitHub/Gmail), API REST. Les clés sont déjà dans ton `.env`. SQLite reste utilisé par défaut.

### 5. Auth (Connexion GitHub / Forget)
- Boutons ajoutés : **Connexion GitHub**, **Déconnexion**, **Forget**.
- **Réelle** si `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont définis + GitHub activé dans Supabase. Sinon, mode démo (mock).

### 6. Stratégies frontend
- **default** : Home landing + Dashboard séparé
- **dashboard-first** : Dashboard = page d’accueil, login optionnel
- **login-first** : Connexion obligatoire pour accéder au Dashboard

Branches : `stripe`, `dashboard-first`, `login-first`. Variable : `VITE_STRATEGY`.

### 7. Parcours d’analyse SaaS client
- Pas d’audit automatisé pour l’instant.
- Proposition : **sondage structuré** (plus simple et moins coûteux qu’une analyse de code par LLM).
- 3 exemples de sondages complets ajoutés dans `docs/SONDAGES_MAAS.md`.

---

## Fichiers importants

| Fichier | Rôle |
|---------|------|
| `docs/GUIDE_MAAS.md` | Commandes, clés API, stratégies, 3 URLs locales |
| `docs/SONDAGES_MAAS.md` | 3 sondages complets par approche stratégique |
| `.env.example` | Variables d’environnement (sans secrets) |
| `frontend/src/context/AuthContext.jsx` | Auth (mock ou Supabase) |
| `frontend/src/components/Layout.jsx` | Header avec Connexion / Déconnexion / Forget |

---

## 3 liens locaux pour voir les 3 approches

**Utiliser http:// (pas https://) pour localhost.**

| Terminal | Commande | URL |
|----------|----------|-----|
| 1 | `npm run dev:default` | http://localhost:5173 |
| 2 | `npm run dev:dashboard` | http://localhost:5174 |
| 3 | `npm run dev:login` | http://localhost:5175 |

## Prochaines actions possibles

1. Configurer Supabase Auth + GitHub OAuth (voir `docs/GUIDE_MAAS.md`).
2. Intégrer les sondages dans le flux (page ou modal).
3. Migrer SQLite → Supabase si besoin de multi-utilisateurs.

---

*Mettre à jour ce fichier après chaque session importante pour garder le contexte.*
