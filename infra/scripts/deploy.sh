#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/maas/current}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
SERVICE_NAME="${SERVICE_NAME:-maas}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://127.0.0.1:3001/health}"

log() {
  printf '[deploy] %s\n' "$1"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[deploy] ERREUR: commande '$1' introuvable" >&2
    exit 1
  fi
}

require_command git
require_command npm
require_command curl
require_command sudo

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "[deploy] ERREUR: repo git introuvable dans $APP_DIR" >&2
  exit 1
fi

log "Déploiement de la branche '$DEPLOY_BRANCH' dans $APP_DIR"
cd "$APP_DIR"

git fetch origin "$DEPLOY_BRANCH"
git checkout "$DEPLOY_BRANCH"
git pull --ff-only origin "$DEPLOY_BRANCH"

log "Installation/MAJ dépendances"
npm run setup

log "Build frontend"
npm run build

log "Redémarrage service systemd: $SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"
sudo systemctl is-active --quiet "$SERVICE_NAME"

log "Contrôle de santé: $HEALTHCHECK_URL"
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "$HEALTHCHECK_URL" >/dev/null; then
    log "Déploiement OK"
    exit 0
  fi
  sleep 2
done

echo "[deploy] ERREUR: healthcheck en échec" >&2
exit 1
