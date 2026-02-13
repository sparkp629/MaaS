#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/maas/current}"
SERVICE_NAME="${SERVICE_NAME:-maas}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://127.0.0.1:3001/health}"
ROLLBACK_HEALTHCHECK_RETRIES="${ROLLBACK_HEALTHCHECK_RETRIES:-10}"
ROLLBACK_TARGET="${ROLLBACK_TARGET:-}"

log() {
  printf '[rollback] %s\n' "$1"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[rollback] ERREUR: commande '$1' introuvable" >&2
    exit 1
  fi
}

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

require_command git
require_command npm
require_command curl
require_command sudo

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "[rollback] ERREUR: repo git introuvable dans $APP_DIR" >&2
  exit 1
fi

cd "$APP_DIR"

CURRENT_COMMIT="$(git rev-parse HEAD)"
if [[ -n "$ROLLBACK_TARGET" ]]; then
  TARGET_COMMIT="$ROLLBACK_TARGET"
else
  TARGET_COMMIT="$(git rev-parse HEAD~1)"
fi

log "Commit courant: $CURRENT_COMMIT"
log "Rollback vers: $TARGET_COMMIT"

git reset --hard "$TARGET_COMMIT"
npm run setup
npm run build
sudo systemctl restart "$SERVICE_NAME"
sudo systemctl is-active --quiet "$SERVICE_NAME"

healthcheck "$ROLLBACK_HEALTHCHECK_RETRIES"
log "Rollback termine avec succes"
