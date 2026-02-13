# MaaS — 3 approches de mise en production

Ce dépôt propose désormais **3 approches distinctes** pour exécuter le produit.

## Approche 1 — VPS classique (Node + systemd + Nginx)

### Profil
- coût minimal
- contrôle complet serveur
- sans Docker

### Fichiers clés
- `infra/systemd/maas.service`
- `infra/nginx/maas.conf`
- `.github/workflows/deploy-vps.yml`
- `infra/scripts/deploy.sh`

### Commandes
```bash
npm run setup
npm run build
npm run start:approach1
```

---

## Approche 2 — Docker monolith (1 conteneur applicatif)

### Profil
- déploiement portable
- un seul conteneur expose l'app complète
- frontend servi par le backend Express

### Fichiers clés
- `infra/docker/monolith/Dockerfile`
- `infra/docker/monolith/docker-compose.yml`

### Commandes
```bash
npm run start:approach2
# app: http://localhost:3001
npm run stop:approach2
```

---

## Approche 3 — Docker split (2 conteneurs: frontend + backend)

### Profil
- séparation stricte front/back
- frontend Nginx dédié
- backend API séparé (SQLite persistée en volume)

### Fichiers clés
- `infra/docker/split/Dockerfile.frontend`
- `infra/docker/split/Dockerfile.backend`
- `infra/docker/split/nginx.frontend.conf`
- `infra/docker/split/docker-compose.yml`

### Commandes
```bash
npm run start:approach3
# app: http://localhost:8080
npm run stop:approach3
```

---

## Notes runtime

- Le fichier `.env` à la racine est réutilisé pour les approches Docker.
- Pour Docker, `DATABASE_PATH=/data/maas.db` est injecté automatiquement via compose.
- Vérification de santé API:
```bash
curl http://localhost:3001/health
```
