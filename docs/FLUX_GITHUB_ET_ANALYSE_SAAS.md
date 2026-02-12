# Flux Backend GitHub & Pipeline d'analyse SaaS client

## 1. Flux évolutif depuis le clic "Connecter GitHub"

### Étape 1 : Clic utilisateur (frontend)
- L'utilisateur coche la charte d'utilisation
- Clic sur "Connecter GitHub"
- **Action** : Redirection vers GitHub OAuth

### Étape 2 : Redirection OAuth GitHub
```
GET https://github.com/login/oauth/authorize
  ?client_id={GITHUB_CLIENT_ID}
  &redirect_uri={CALLBACK_URL}  # ex: https://maas.app/oauth/github/callback
  &scope=repo,read:user,read:org
  &state={CSRF_TOKEN}
```

**Backend** : Génère un `state` aléatoire (crypto.randomBytes), le stocke en session ou Redis avec TTL 10 min, inclut le `client_id` de l'app GitHub.

### Étape 3 : Utilisateur autorise sur GitHub
- GitHub affiche la page de consentement (scopes : repo, read:user, read:org)
- L'utilisateur accepte ou refuse

### Étape 4 : Callback — GitHub redirige vers notre backend
```
GET /oauth/github/callback?code={AUTH_CODE}&state={STATE}
```

**Backend** :
1. Vérifier `state` == valeur stockée (CSRF)
2. Échanger `code` contre `access_token` :
   ```
   POST https://github.com/login/oauth/access_token
   Body: client_id, client_secret, code, redirect_uri
   ```
3. Stocker `access_token` (et optionnellement `refresh_token`) :
   - Associé à l'utilisateur (session, JWT, ou table `user_github_tokens`)
4. Optionnel : récupérer le profil GitHub (`GET /user`) pour enrichir le profil MaaS
5. Rediriger le frontend vers `/campaigns` avec un token ou un flag `github_connected=true`

### Étape 5 : Accès aux repos (backend)
- Pour chaque opération nécessitant des données repo :
  ```
  GET https://api.github.com/user/repos?per_page=100
  Authorization: Bearer {access_token}
  ```
- Récupérer la liste des repos accessibles
- L'utilisateur sélectionne un repo (ou on prend le repo "principal" par heuristique)

### Étape 6 : Lecture du contenu du repo (sans stockage)
- **Principe** : Analyse en temps réel, pas de clone persistant
- `GET /repos/{owner}/{repo}/contents/` pour l'arborescence
- `GET /repos/{owner}/{repo}/readme` pour le README
- `GET /repos/{owner}/{repo}/languages` pour les langages
- **Ne pas** : cloner le repo, stocker le code, indexer les fichiers sensibles

### Étape 7 : Déclenchement du pipeline d'analyse SaaS
- Une fois le repo identifié, lancer le pipeline d'analyse (voir section 2)
- Les résultats (extraits structurés : niche, type, fonctionnalités) sont stockés ; le contenu brut ne l'est pas

---

## 2. Pipeline d'analyse précis d'un SaaS client (sans simulation)

Objectif : **définir le besoin spécifique** du SaaS à partir de données réelles (repo GitHub, pas de simulation), même si les types de SaaS se ressemblent.

### Phase 1 : Ingestion & extraction
1. **Lecture des métadonnées repo**
   - Nom, description, topics, langages
   - Licence, stars, forks (si public)
   - Date de création, dernière mise à jour

2. **Parsing README**
   - Détection du "elevator pitch" (premiers paragraphes)
   - Sections : Features, Installation, Use cases, Pricing (si présent)
   - Liens vers site web, docs, démo

3. **Scan des fichiers clés** (sans stockage du contenu)
   - `package.json` / `requirements.txt` / `go.mod` → stack technique
   - `docker-compose` / `Dockerfile` → infra
   - Structure des dossiers (src/, app/, api/) → architecture
   - Fichiers de config (env example) → services tiers utilisés

### Phase 2 : Classification & typologie
4. **Détection du type SaaS**
   - API-first / Dashboard / CLI / No-code / Embedded / Plugin
   - B2B / B2C / B2B2C
   - Vertical : AI Tools, DevOps, Analytics, Productivity, etc.

5. **Différenciation fine** (même si types proches)
   - Ex : "AI Tools" → sous-type : Code Gen / Chat / Image / Data / Automation
   - Ex : "Productivity" → sous-type : Notes / Tasks / Collaboration / Automation
   - Utiliser les topics GitHub, le vocabulaire du README, les dépendances

### Phase 3 : Cartographie du besoin
6. **Persona cible**
   - Décideur (CTO, VP Eng, Product Manager) vs utilisateur final (dev, analyste)
   - Taille d'entreprise (startup, scale-up, enterprise) inférée depuis positioning

7. **Pain points probables**
   - Extrait des sections "Problem" / "Why" du README
   - Comparaison avec segments connus (table `segments`)

8. **Canal & format préférentiel**
   - Tech-heavy → X threads, YouTube, newsletters dev
   - Business-focused → LinkedIn, podcasts, webinars
   - Niche étroite → micro-KOLs spécialisés

### Phase 4 : Output structuré (sans simulation)
9. **Besoin spécifique**
   - `niche` : string normalisé (ex: "AI Tools - Code Gen")
   - `persona` : tableau (ex: ["CTO", "Developer"])
   - `pain_points` : liste extraite
   - `recommended_channels` : ["X", "Newsletter", "YouTube"]
   - `differentiators` : 3–5 points de différenciation détectés
   - `suggested_hooks` : angles de contenu (générés à partir des pain points + differentiators)

10. **Validation & feedback**
    - Présenter le résumé à l'utilisateur, permettre correction manuelle
    - Les corrections alimentent un fine-tuning (optionnel) pour les prochains analysés

### Points critiques (sans simulation)
- **Aucune donnée fictive** : tout repose sur le repo réel
- **Fallback explicite** : si README absent ou vide, marquer `confidence: low` et demander saisie manuelle
- **RGPD** : ne pas stocker le code ; stocker uniquement les métadonnées et le résumé d'analyse (anonymisable)

---

## Schéma récapitulatif

```
[Utilisateur] → Clic "Connecter GitHub"
       ↓
[Frontend] → Redirection OAuth GitHub
       ↓
[GitHub] → Consentement → Callback avec code
       ↓
[Backend] → Échange code → access_token
       ↓
[Backend] → Liste repos → Utilisateur choisit repo
       ↓
[Backend] → Pipeline analyse (Phase 1→4)
       ↓
[Output] → Besoin spécifique → KOL matching → Génération contenu
```
