#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/maas/current}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
SERVICE_NAME="${SERVICE_NAME:-maas}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://127.0.0.1:3001/health}"
ROLLBACK_HEALTHCHECK_RETRIES="${ROLLBACK_HEALTHCHECK_RETRIES:-10}"

PREV_COMMIT=""
DEPLOY_UPDATED=0
ROLLBACK_ATTEMPTED=0

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

healthcheck() {
  local retries="$1"
  for attempt in $(seq 1 "$retries"); do
    if curl -fsS "$HEALTHCHECK_URL" >/dev/null; then
      return 0
    fi
    sleep 2
  done
  return 1
}

rollback_last_commit() {
  if [[ "$ROLLBACK_ATTEMPTED" -eq 1 ]]; then
    return
  fi
  ROLLBACK_ATTEMPTED=1

  if [[ "$DEPLOY_UPDATED" -ne 1 || -z "$PREV_COMMIT" ]]; then
    log "Rollback ignore (aucun commit precedent deploye)"
    return
  fi

  log "Echec detecte -> rollback automatique vers $PREV_COMMIT"
  set +e
  trap - ERR

  git reset --hard "$PREV_COMMIT"
  npm run setup
  npm run build
  sudo systemctl restart "$SERVICE_NAME"
  sudo systemctl is-active --quiet "$SERVICE_NAME"

  if healthcheck "$ROLLBACK_HEALTHCHECK_RETRIES"; then
    log "Rollback N-1 OK"
  else
    echo "[deploy] ERREUR: rollback effectue mais healthcheck encore KO" >&2
  fi
}

on_error() {
  local code="$1"
  local line="$2"
  echo "[deploy] ERREUR ligne $line (code $code)" >&2
  rollback_last_commit
  exit "$code"
}

trap 'on_error $? $LINENO' ERR

log "Déploiement de la branche '$DEPLOY_BRANCH' dans $APP_DIR"
cd "$APP_DIR"

PREV_COMMIT="$(git rev-parse HEAD)"
log "Commit courant avant deploy: $PREV_COMMIT"

git fetch origin "$DEPLOY_BRANCH"
git checkout "$DEPLOY_BRANCH"
git pull --ff-only origin "$DEPLOY_BRANCH"
DEPLOY_UPDATED=1

log "Installation/MAJ dépendances"
npm run setup

log "Build frontend"
npm run build

log "Redémarrage service systemd: $SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"
sudo systemctl is-active --quiet "$SERVICE_NAME"

log "Contrôle de santé: $HEALTHCHECK_URL"
healthcheck "$ROLLBACK_HEALTHCHECK_RETRIES"
log "Déploiement OK"
