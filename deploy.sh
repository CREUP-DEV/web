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
# authenticate against the VPS the same way. rsync takes it as its transport.
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

build_and_push_image() {
  local latest_image="${IMAGE_NAME}:latest"
  # Embed public origin in the bundle at build time. When local .env keeps
  # NUXT_SITE_URL on localhost, set NUXT_DEPLOY_SITE_URL to the production URL.
  local build_site_url="${NUXT_DEPLOY_SITE_URL:-$NUXT_SITE_URL}"

  if docker buildx version >/dev/null 2>&1; then
    docker buildx build \
      --platform "$DOCKER_PLATFORM" \
      --build-arg "NUXT_SITE_URL=$build_site_url" \
      --build-arg "NUXT_UMAMI_HOST=${NUXT_UMAMI_HOST:-}" \
      --build-arg "NUXT_UMAMI_ID=${NUXT_UMAMI_ID:-}" \
      -t "$IMAGE" \
      -t "$latest_image" \
      --push \
      .

    if [ "${BUILD_DEBUG:-false}" = "true" ]; then
      docker buildx build \
        --target runner-debug \
        --platform "$DOCKER_PLATFORM" \
        --build-arg "NUXT_SITE_URL=$build_site_url" \
        --build-arg "NUXT_UMAMI_HOST=${NUXT_UMAMI_HOST:-}" \
        --build-arg "NUXT_UMAMI_ID=${NUXT_UMAMI_ID:-}" \
        -t "${IMAGE}-debug" \
        -t "${IMAGE_NAME}:latest-debug" \
        --push \
        .
    fi
    return
  fi

  docker build \
    --platform "$DOCKER_PLATFORM" \
    --build-arg "NUXT_SITE_URL=$build_site_url" \
    --build-arg "NUXT_UMAMI_HOST=${NUXT_UMAMI_HOST:-}" \
    --build-arg "NUXT_UMAMI_ID=${NUXT_UMAMI_ID:-}" \
    -t "$IMAGE" \
    -t "$latest_image" \
    .
  docker push "$IMAGE"
  docker push "$latest_image"

  if [ "${BUILD_DEBUG:-false}" = "true" ]; then
    docker build \
      --target runner-debug \
      --platform "$DOCKER_PLATFORM" \
      --build-arg "NUXT_SITE_URL=$build_site_url" \
      --build-arg "NUXT_UMAMI_HOST=${NUXT_UMAMI_HOST:-}" \
      --build-arg "NUXT_UMAMI_ID=${NUXT_UMAMI_ID:-}" \
      -t "${IMAGE}-debug" \
      -t "${IMAGE_NAME}:latest-debug" \
      .
    docker push "${IMAGE}-debug"
    docker push "${IMAGE_NAME}:latest-debug"
  fi
}

sync_public_uploads() {
  rsync -avz --mkpath -e "$SSH_BIN" public/ "$VPS_HOST:${REMOTE_DIR}/data/public-uploads/"
}

build_seed() {
  pnpm exec esbuild drizzle/seed.ts \
    --bundle \
    --platform=node \
    --format=esm \
    --outfile=ops/seed.mjs \
    --packages=external
}

remote_compose_up() {
  "$SSH_BIN" "$VPS_HOST" 'bash -se' <<EOF
set -euo pipefail

ROLLBACK_IMAGE_FILE="${ROLLBACK_IMAGE_FILE}"

# Host directories behind the app's data bind mounts, as Compose itself resolves them. Relative
# paths in the app's compose file resolve against that file's own directory, and its \${APP_*_DIR}
# against the .env beside it; when a shared root compose include:s web/docker-compose.yml, neither
# is the directory this script runs from, so building the paths here created them where nothing
# mounts them. The service's dependencies are listed too, hence the filter on the app's targets.
app_data_bind_sources() {
  docker compose config "${COMPOSE_APP_SERVICE}" | awk '
    /^ *- type: / { bind = (\$3 == "bind"); source = ""; next }
    bind && /^ *source: / { source = \$2; next }
    bind && source != "" && /^ *target: \/app\/\.output\// { print source; source = "" }
  '
}

# Created up front so they belong to the deploy user: left to Docker, a missing bind source is
# created as root and the app (uid 1000) cannot write uploads into it.
ensure_host_data_dirs() {
  local sources
  sources="\$(app_data_bind_sources)"

  if [ -z "\$sources" ]; then
    echo "== No data bind mounts found for ${COMPOSE_APP_SERVICE}; nothing to create =="
    return
  fi

  while IFS= read -r dir; do
    mkdir -p "\$dir"
  done <<< "\$sources"
}

cleanup_old_app_images() {
  local image_name="\$1"
  local keep_count="\$2"

  if ! [[ "\$keep_count" =~ ^[0-9]+$ ]] || [ "\$keep_count" -lt 1 ]; then
    echo "== Skip app image cleanup =="
    return
  fi

  mapfile -t image_ids < <(docker image ls "\$image_name" --format '{{.ID}}' | awk '!seen[\$0]++')

  if [ "\${#image_ids[@]}" -le "\$keep_count" ]; then
    echo "== App image cleanup: nothing to remove =="
    return
  fi

  echo "== Remove old app images =="
  for image_id in "\${image_ids[@]:\$keep_count}"; do
    docker image rm "\$image_id" || true
  done
}

resolve_current_app_image() {
  local service="\$1"
  local image_name="\$2"
  local container_id
  local current_image
  local current_image_id
  local current_digest

  container_id="\$(docker compose ps -q "\$service" 2>/dev/null || true)"
  if [ -z "\$container_id" ]; then
    return 0
  fi

  current_image="\$(docker inspect --format '{{.Config.Image}}' "\$container_id")"
  if [ -z "\$current_image" ]; then
    return 0
  fi

  if [ "\${current_image##*:}" != "latest" ]; then
    printf '%s\n' "\$current_image"
    return 0
  fi

  current_image_id="\$(docker inspect --format '{{.Image}}' "\$container_id")"
  current_digest="\$(docker image inspect "\$current_image_id" --format '{{range .RepoDigests}}{{println .}}{{end}}' | grep -F -m 1 "\$image_name@" || true)"

  printf '%s\n' "\${current_digest:-\$current_image}"
}

save_current_app_image_for_rollback() {
  local service="\$1"
  local image_name="\$2"
  local rollback_file="\$3"
  local current_image

  current_image="\$(resolve_current_app_image "\$service" "\$image_name")"
  if [ -z "\$current_image" ]; then
    echo "== Rollback image: no running app container found =="
    return
  fi

  printf '%s\n' "\$current_image" > "\$rollback_file"
  echo "== Rollback image saved: \$current_image =="
}

cd "${COMPOSE_DIR}"

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

# Per-project var (compose reads ${WEB_IMAGE:-...}), never a bare IMAGE.
export WEB_IMAGE="${IMAGE}"

echo "== Ensure host data directories =="
ensure_host_data_dirs

echo "== Save current app image for rollback =="
save_current_app_image_for_rollback "${COMPOSE_APP_SERVICE}" "${IMAGE_NAME}" "\$ROLLBACK_IMAGE_FILE"

echo "== Pull images =="
docker compose pull "${COMPOSE_APP_SERVICE}"

if [ "${APPLY_MIGRATIONS_ON_DEPLOY}" = "true" ]; then
  if docker compose config --services | grep -qx "${COMPOSE_POSTGRES_SERVICE}"; then
    echo "== Ensure postgres is running =="
    docker compose up -d "${COMPOSE_POSTGRES_SERVICE}"
  fi

  echo "== Apply database migrations =="
  docker compose run -T --rm "${COMPOSE_APP_SERVICE}" /app/ops/migrate.mjs </dev/null

  # Idempotent: backfills seed-content translations (tags, carousel, links, equality
  # docs) onto existing rows via onConflictDoNothing. Non-destructive and safe every
  # deploy, so new locales land without the destructive full seed (SEED_ON_DEPLOY).
  echo "== Seed content translations (idempotent) =="
  docker compose run -T --rm "${COMPOSE_APP_SERVICE}" /app/ops/seed-content.mjs </dev/null
fi

if [ "${SEED_ON_DEPLOY}" = "true" ]; then
  echo "== Seed database =="
  docker compose run -T --rm -e ALLOW_PRODUCTION_SEED=true "${COMPOSE_APP_SERVICE}" /app/ops/seed.mjs --confirm </dev/null
fi

echo "== Recreate containers =="
docker compose up -d "${COMPOSE_APP_SERVICE}"

echo "== Persist WEB_IMAGE in .env =="
# Without this, WEB_IMAGE only exists in this SSH session. Any later bare
# \`docker compose up -d\` (a reboot, a manual restart, bringing up another
# service) would resolve \${WEB_IMAGE:-...} back to its ':latest' fallback and
# silently revert this container to whatever ':latest' is cached locally --
# which can be arbitrarily stale, since deploys pull the sha tag, never
# ':latest'. Compose auto-loads .env from the project dir on every invocation.
# The upsert is anchored on ^WEB_IMAGE= so sibling projects' keys
# (INTRANET_IMAGE, RECUENTO_IMAGE) in the same shared .env are left untouched.
WEB_IMAGE_ENV_LINE="WEB_IMAGE=${IMAGE}"
if [ -f .env ] && grep -q '^WEB_IMAGE=' .env; then
  TMP_ENV="\$(mktemp)"
  sed "s|^WEB_IMAGE=.*|\$WEB_IMAGE_ENV_LINE|" .env > "\$TMP_ENV"
  cat "\$TMP_ENV" > .env
  rm -f "\$TMP_ENV"
else
  printf '%s\n' "\$WEB_IMAGE_ENV_LINE" >> .env
fi
echo "    \$WEB_IMAGE_ENV_LINE"

if docker compose config --services | grep -qx "${COMPOSE_NGINX_SERVICE}"; then
  echo "== Reload NGINX =="
  docker compose exec -T "${COMPOSE_NGINX_SERVICE}" nginx -s reload
fi

cleanup_old_app_images "${IMAGE_NAME}" "${DEPLOY_IMAGE_RETENTION}"
EOF
}

load_env_file ".env"

SEED_ON_DEPLOY=false
BUILD_DEBUG=false
for arg in "$@"; do
  case "$arg" in
    --seed) SEED_ON_DEPLOY=true ;;
    --debug) BUILD_DEBUG=true ;;
    *) printf 'ERROR: unknown argument: %s\n' "$arg" >&2; exit 1 ;;
  esac
done

: "${VPS_HOST:?ERROR: VPS_HOST is required}"
: "${REMOTE_DIR:?ERROR: REMOTE_DIR is required}"
: "${NUXT_SITE_URL:?ERROR: NUXT_SITE_URL is required}"

require_command docker
resolve_ssh_bin
require_command git
if [ "$SEED_ON_DEPLOY" = "true" ]; then
  require_command rsync
  require_command pnpm
fi

IMAGE_NAME="${IMAGE_NAME:-ghcr.io/creup-dev/web}"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD)}"
IMAGE="${IMAGE:-${IMAGE_NAME}:${IMAGE_TAG}}"
DOCKER_PLATFORM="${DOCKER_PLATFORM:-linux/amd64}"
APPLY_MIGRATIONS_ON_DEPLOY="${APPLY_MIGRATIONS_ON_DEPLOY:-true}"
COMPOSE_DIR="${COMPOSE_DIR:-$REMOTE_DIR}"
COMPOSE_APP_SERVICE="${COMPOSE_APP_SERVICE:-app}"
COMPOSE_POSTGRES_SERVICE="${COMPOSE_POSTGRES_SERVICE:-postgres}"
COMPOSE_NGINX_SERVICE="${COMPOSE_NGINX_SERVICE:-nginx}"
DEPLOY_IMAGE_RETENTION="${DEPLOY_IMAGE_RETENTION:-2}"
ROLLBACK_IMAGE_FILE="${ROLLBACK_IMAGE_FILE:-.last_app_image}"

if [ -n "${GHCR_USERNAME:-}" ] && [ -n "${GHCR_TOKEN:-}" ]; then
  log "GHCR login"
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin
fi

if [ "$SEED_ON_DEPLOY" = "true" ]; then
  log "Build seed script"
  build_seed
fi

log "Build and push: $IMAGE"
if [ -n "${NUXT_DEPLOY_SITE_URL:-}" ]; then
  log "Docker build embeds $NUXT_DEPLOY_SITE_URL (VPS runtime still uses its Compose NUXT_SITE_URL)"
fi
build_and_push_image

if [ "$SEED_ON_DEPLOY" = "true" ]; then
  log "Sync public uploads to VPS"
  sync_public_uploads

  log "Copy seed script to VPS"
  rsync -az --mkpath -e "$SSH_BIN" ops/seed.mjs "$VPS_HOST:${REMOTE_DIR}/ops/seed.mjs"
fi

log "Deploy to VPS with docker compose"
remote_compose_up

printf 'Deploy finished successfully\n'
