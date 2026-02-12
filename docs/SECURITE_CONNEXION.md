# Sécurité des connexions utilisateurs — MaaS

Prérequis et bonnes pratiques pour la connexion GitHub (OAuth / SSH) et la sécurité générale du MaaS.

---

## Connexion GitHub

### Choix du flux d'authentification

| Contexte | Flux recommandé | Documentation |
|----------|------------------|---------------|
| App web (utilisateur dans navigateur) | **Web Application Flow** (OAuth 2.0 Authorization Code) | [Authorizing OAuth apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#web-application-flow) |
| CLI / outil sans navigateur | **Device Flow** | [Device flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow) |
| Déploiement, scripts serveur | **Personal Access Token (PAT)** ou **SSH** | [Clés SSH](https://docs.github.com/fr/authentication/connecting-to-github-with-ssh) |

### Pour MaaS (Campaign Engine, push vers GitHub)

MaaS utilise une connexion GitHub pour :
- Lier le repo de l'utilisateur
- Pousser le contenu généré (threads, BIP, etc.)

**Flux adapté** : **Web Application Flow** (OAuth) — l'utilisateur clique « Connecter GitHub » dans le navigateur, est redirigé vers GitHub, puis revient avec un token.

### Ce dont vous avez besoin pour OAuth GitHub

1. **OAuth App** sur GitHub : [Settings > Developer settings > OAuth Apps > New](https://github.com/settings/applications/new)
   - **Homepage URL** : `https://votredomaine.com` (ou `http://localhost:5173` en dev)
   - **Authorization callback URL** : `https://votredomaine.com/callback/github` (ou `http://localhost:5173/callback/github`)
   - **Client ID** et **Client Secret** générés

2. **Variables d'environnement** :
   ```
   GITHUB_CLIENT_ID=xxx
   GITHUB_CLIENT_SECRET=xxx
   GITHUB_CALLBACK_URL=http://localhost:5173/callback/github
   ```

3. **Flux côté backend** :
   - `GET /auth/github` → redirige vers `https://github.com/login/oauth/authorize?client_id=...&scope=repo,user&state=...`
   - `GET /callback/github?code=...&state=...` → échange `code` contre `access_token` via `POST https://github.com/login/oauth/access_token`
   - Stocker le token de manière sécurisée (session chiffrée, DB, etc.)

### Principes de sécurité pour la connexion

| Niveau | Pratique |
|--------|----------|
| **Base** | PKCE (Proof Key for Code Exchange) pour le flow OAuth |
| **Base** | Paramètre `state` aléatoire pour prévenir CSRF |
| **Base** | Stocker les tokens côté serveur, jamais en cookie non HttpOnly |
| **Base** | Scopes minimaux : `repo`, `user` uniquement si nécessaire |
| **Avancé** | Refresh des tokens avant expiration |
| **Avancé** | Revocation des tokens en cas de déconnexion |
| **Avancé** | Limitation des IP / User-Agent si exposé |

---

## Clés SSH (alternative pour déploiement)

Si vous préférez une authentification par clé SSH pour les opérations Git :

1. **Vérifier les clés existantes** : `ls -al ~/.ssh`
2. **Générer une clé** : `ssh-keygen -t ed25519 -C "votre_email@example.com"`
3. **Ajouter à l'agent** : `ssh-add ~/.ssh/id_ed25519`
4. **Ajouter à GitHub** : [Settings > SSH and GPG keys](https://github.com/settings/keys)
5. **Tester** : `ssh -T git@github.com`

Documentation : [Connexion SSH GitHub](https://docs.github.com/fr/authentication/connecting-to-github-with-ssh)

---

## Alternatives à GitHub OAuth

- **GitHub App** : permissions plus fines, tokens court terme, adapté aux intégrations pro.
- **PAT (Personal Access Token)** : l'utilisateur crée un token manuellement et le colle dans MaaS — plus simple mais moins fluide.
