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

# Under WSL (what a bare `bash` typed in PowerShell or cmd resolves to) the Linux
# ssh reads the distro's own ~/.ssh, which has none of the keys or host aliases in
# the Windows user's %USERPROFILE%\.ssh — the ones Git Bash and the Windows
# terminal use. Going through Windows' ssh.exe there makes every shell
# authenticate against the VPS the same way.
resolve_ssh_bin() {
  SSH_BIN=ssh
  if [ -n "${WSL_DISTRO_NAME:-}" ] && command -v ssh.exe >/dev/null 2>&1; then
    SSH_BIN=ssh.exe
  fi
  require_command "$SSH_BIN"
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

resolve_ssh_bin

IMAGE_NAME="${IMAGE_NAME:-ghcr.io/creup-dev/web}"
COMPOSE_DIR="${COMPOSE_DIR:-$REMOTE_DIR}"
COMPOSE_APP_SERVICE="${COMPOSE_APP_SERVICE:-app}"
COMPOSE_POSTGRES_SERVICE="${COMPOSE_POSTGRES_SERVICE:-postgres}"
COMPOSE_NGINX_SERVICE="${COMPOSE_NGINX_SERVICE:-nginx}"
ROLLBACK_IMAGE_FILE="${ROLLBACK_IMAGE_FILE:-.last_app_image}"
# Same as deploy.sh and clone-prod-db.sh: the VPS env file with the app's DATABASE_URL.
PROD_ENV_FILE="${PROD_ENV_FILE:-web/.env}"
case "$PROD_ENV_FILE" in
  /*) PROD_ENV_FILE_ABS="$PROD_ENV_FILE" ;;
  *) PROD_ENV_FILE_ABS="$COMPOSE_DIR/$PROD_ENV_FILE" ;;
esac

usage() {
  cat <<'EOF'
Usage:
  bash ./rollback.sh [--force] [<tag>]
  IMAGE_TAG=<tag> bash ./rollback.sh [--force]
  WEB_IMAGE=<image-ref> bash ./rollback.sh [--force]

Without a tag, WEB_IMAGE or IMAGE_TAG, the script uses the image saved by the last deploy.
Migrations are not reverted, so it refuses an image older than the database (one that does not
know every migration applied) unless --force.
EOF
}

FORCE=false
TAG_ARG=""
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=true ;;
    -h | --help)
      usage
      exit 0
      ;;
    -*)
      printf 'ERROR: unknown argument: %s\n' "$arg" >&2
      usage >&2
      exit 1
      ;;
    *)
      if [ -n "$TAG_ARG" ]; then
        printf 'ERROR: only one image tag may be given\n' >&2
        exit 1
      fi
      TAG_ARG="$arg"
      ;;
  esac
done

if [ -n "$TAG_ARG" ]; then
  if [ -n "${WEB_IMAGE:-}" ] || [ -n "${IMAGE_TAG:-}" ]; then
    printf 'ERROR: pass either an argument, WEB_IMAGE, or IMAGE_TAG; not multiple image selectors\n' >&2
    exit 1
  fi

  IMAGE_TAG="$TAG_ARG"
fi

if [ -n "${WEB_IMAGE:-}" ]; then
  ROLLBACK_IMAGE="$WEB_IMAGE"
elif [ -n "${IMAGE_TAG:-}" ]; then
  ROLLBACK_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"
else
  log "Read saved rollback image"
  ROLLBACK_IMAGE="$(
    "$SSH_BIN" "$VPS_HOST" "cd '$COMPOSE_DIR' && test -s '$ROLLBACK_IMAGE_FILE' && cat '$ROLLBACK_IMAGE_FILE'"
  )"
fi

if [ -z "$ROLLBACK_IMAGE" ]; then
  printf 'ERROR: rollback image is empty\n' >&2
  exit 1
fi

log "Rollback to: $ROLLBACK_IMAGE"

remote_rollback() {
"$SSH_BIN" "$VPS_HOST" 'bash -se' <<EOF
set -euo pipefail

# Same notes as deploy.sh: every docker compose call reads /dev/null (bash reads this script from
# stdin), Compose reads the root .env itself, and --no-deps keeps the shared postgresql from being
# recreated if its config drifted.
cd "${COMPOSE_DIR}"

export WEB_IMAGE="${ROLLBACK_IMAGE}"

echo "== Pull rollback image if needed =="
docker compose pull "${COMPOSE_APP_SERVICE}" </dev/null || true

echo "== Compare migrations: image and database =="
# Drizzle records each migration by its journal timestamp (created_at = the journal's \`when\`). An
# image whose journal ends before the database's last migration predates the schema it would run
# on, and may misread or break on it. Images before 2026-11 are node:24-slim, with node on PATH;
# later ones are distroless, with /nodejs/bin/node.
read_journal='const j=require("/app/drizzle/meta/_journal.json");console.log(Math.max(...j.entries.map((e)=>e.when)))'
image_last="\$(docker run --rm --network none --entrypoint /nodejs/bin/node "${ROLLBACK_IMAGE}" -e "\$read_journal" </dev/null 2>/dev/null ||
  docker run --rm --network none --entrypoint node "${ROLLBACK_IMAGE}" -e "\$read_journal" </dev/null 2>/dev/null || true)"
image_last="\${image_last//\$'\r'/}"
db_applied=""
url="\$(sed -n 's/^DATABASE_URL=//p' "${PROD_ENV_FILE_ABS}" 2>/dev/null | tail -n1)"
url="\${url%\"}"; url="\${url#\"}"; url="\${url%\'}"; url="\${url#\'}"
db_name="\${url##*@}"; db_name="\${db_name#*/}"; db_name="\${db_name%%\?*}"
if [ -n "\$db_name" ]; then
  db_applied="\$(docker compose exec -T -e TARGET_DB="\$db_name" "${COMPOSE_POSTGRES_SERVICE}" \
    sh -c 'exec psql -X -A -t -v ON_ERROR_STOP=1 -U "\$POSTGRES_USER" -d "\$TARGET_DB" -c "SELECT created_at FROM drizzle.__drizzle_migrations ORDER BY created_at"' \
    </dev/null 2>/dev/null | tr -d '\r' || true)"
fi
if ! [[ "\$image_last" =~ ^[0-9]+\$ ]] || [ -z "\$db_applied" ]; then
  if [ "${FORCE}" != true ]; then
    echo "ERROR: could not read the migrations of the image or of the database (${PROD_ENV_FILE_ABS}); nothing changed. Check them, or pass --force" >&2
    exit 1
  fi
  echo "    could not compare them; going on (--force)"
else
  ahead=0
  while read -r applied; do
    if [[ "\$applied" =~ ^[0-9]+\$ ]] && [ "\$applied" -gt "\$image_last" ]; then
      ahead=\$((ahead + 1))
    fi
  done <<<"\$db_applied"
  if [ "\$ahead" -gt 0 ]; then
    if [ "${FORCE}" != true ]; then
      echo "ERROR: the database has \$ahead migration(s) newer than ${ROLLBACK_IMAGE} knows; it could misread the data. Nothing changed. Restore the pre-deploy dump first (DEPLOYMENT.md, Rollback), or pass --force" >&2
      exit 1
    fi
    echo "    the database has \$ahead migration(s) newer than the image; going on (--force)"
  else
    echo "    the image knows every migration applied"
  fi
fi

echo "== Recreate app container =="
docker compose up -d --no-deps "${COMPOSE_APP_SERVICE}" </dev/null

echo "== Wait for the app to be healthy =="
container_id="\$(docker compose ps -q "${COMPOSE_APP_SERVICE}" </dev/null)"
status=missing
for _ in \$(seq 1 50); do
  status="\$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "\$container_id" 2>/dev/null || echo missing)"
  case "\$status" in
    healthy | no-healthcheck | missing) break ;;
  esac
  sleep 3
done
case "\$status" in
  healthy) echo "    healthy" ;;
  no-healthcheck) echo "    no healthcheck defined, not waiting" ;;
  *)
    echo "ERROR: ${COMPOSE_APP_SERVICE} is \$status. Last logs:" >&2
    docker compose logs --tail 80 "${COMPOSE_APP_SERVICE}" </dev/null >&2 || true
    exit 1
    ;;
esac

echo "== Persist WEB_IMAGE in .env =="
# Same reasoning as deploy.sh: without this a later bare \`docker compose up -d\`
# would fall back to ':latest' and undo the rollback. Anchored on ^WEB_IMAGE=
# so sibling projects' keys in the shared .env are untouched.
WEB_IMAGE_ENV_LINE="WEB_IMAGE=${ROLLBACK_IMAGE}"
if [ -f .env ] && grep -q '^WEB_IMAGE=' .env; then
  TMP_ENV="\$(mktemp)"
  sed "s|^WEB_IMAGE=.*|\$WEB_IMAGE_ENV_LINE|" .env > "\$TMP_ENV"
  cat "\$TMP_ENV" > .env
  rm -f "\$TMP_ENV"
else
  if [ -s .env ] && [ -n "\$(tail -c1 .env)" ]; then
    printf '\n' >> .env
  fi
  printf '%s\n' "\$WEB_IMAGE_ENV_LINE" >> .env
fi
echo "    \$WEB_IMAGE_ENV_LINE"

services="\$(docker compose config --services </dev/null)"
if grep -qx "${COMPOSE_NGINX_SERVICE}" <<< "\$services"; then
  echo "== Reload NGINX =="
  docker compose exec -T "${COMPOSE_NGINX_SERVICE}" nginx -s reload </dev/null
fi

echo "== Remote rollback done =="
EOF
}

remote_log="$(mktemp)"
trap 'rm -f "$remote_log"' EXIT
remote_rollback | tee "$remote_log"
if ! grep -qxF "== Remote rollback done ==" "$remote_log"; then
  printf 'ERROR: the remote rollback stopped before its last step\n' >&2
  exit 1
fi

printf 'Rollback finished successfully\n'
