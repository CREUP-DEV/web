#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '== %s ==\n' "$1"
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    printf 'ERROR: %s is not available locally\n' "$1" >&2
    exit 1
  }
}

load_env_file() {
  local env_file="$1"

  if [ -f "$env_file" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$env_file"
    set +a
  fi
}

load_env_file ".env"

: "${VPS_HOST:?ERROR: VPS_HOST is required}"
: "${REMOTE_DIR:?ERROR: REMOTE_DIR is required}"

require_command ssh

IMAGE_NAME="${IMAGE_NAME:-ghcr.io/creup-dev/web}"
COMPOSE_DIR="${COMPOSE_DIR:-$REMOTE_DIR}"
COMPOSE_APP_SERVICE="${COMPOSE_APP_SERVICE:-app}"
COMPOSE_NGINX_SERVICE="${COMPOSE_NGINX_SERVICE:-nginx}"
ROLLBACK_IMAGE_FILE="${ROLLBACK_IMAGE_FILE:-.last_app_image}"

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  cat <<'EOF'
Usage:
  bash ./rollback.sh
  IMAGE_TAG=<tag> bash ./rollback.sh
  WEB_IMAGE=<image-ref> bash ./rollback.sh

Without WEB_IMAGE or IMAGE_TAG, the script uses the image saved by the last deploy.
EOF
  exit 0
fi

if [ -n "${1:-}" ]; then
  if [ -n "${WEB_IMAGE:-}" ] || [ -n "${IMAGE_TAG:-}" ]; then
    printf 'ERROR: pass either an argument, WEB_IMAGE, or IMAGE_TAG; not multiple image selectors\n' >&2
    exit 1
  fi

  IMAGE_TAG="$1"
fi

if [ -n "${WEB_IMAGE:-}" ]; then
  ROLLBACK_IMAGE="$WEB_IMAGE"
elif [ -n "${IMAGE_TAG:-}" ]; then
  ROLLBACK_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"
else
  log "Read saved rollback image"
  ROLLBACK_IMAGE="$(
    ssh "$VPS_HOST" "cd '$COMPOSE_DIR' && test -s '$ROLLBACK_IMAGE_FILE' && cat '$ROLLBACK_IMAGE_FILE'"
  )"
fi

if [ -z "$ROLLBACK_IMAGE" ]; then
  printf 'ERROR: rollback image is empty\n' >&2
  exit 1
fi

log "Rollback to: $ROLLBACK_IMAGE"

ssh "$VPS_HOST" 'bash -se' <<EOF
set -euo pipefail

cd "${COMPOSE_DIR}"

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

export WEB_IMAGE="${ROLLBACK_IMAGE}"

echo "== Pull rollback image if needed =="
docker compose pull "${COMPOSE_APP_SERVICE}" || true

echo "== Recreate app container =="
docker compose up -d "${COMPOSE_APP_SERVICE}"

if docker compose config --services | grep -qx "${COMPOSE_NGINX_SERVICE}"; then
  echo "== Reload NGINX =="
  docker compose exec -T "${COMPOSE_NGINX_SERVICE}" nginx -s reload
fi
EOF

printf 'Rollback finished successfully\n'
