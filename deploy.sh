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
  rsync -avz --mkpath public/ "$VPS_HOST:${REMOTE_DIR}/data/public-uploads/"
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
  ssh "$VPS_HOST" 'bash -se' <<EOF
set -euo pipefail

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

cd "${COMPOSE_DIR}"

export IMAGE="${IMAGE}"

echo "== Pull images =="
docker compose pull "${COMPOSE_APP_SERVICE}"

if [ "${APPLY_MIGRATIONS_ON_DEPLOY}" = "true" ]; then
  if docker compose config --services | grep -qx "${COMPOSE_POSTGRES_SERVICE}"; then
    echo "== Ensure postgres is running =="
    docker compose up -d "${COMPOSE_POSTGRES_SERVICE}"
  fi

  echo "== Apply database migrations =="
  docker compose run -T --rm "${COMPOSE_APP_SERVICE}" /app/ops/migrate.mjs </dev/null
fi

if [ "${SEED_ON_DEPLOY}" = "true" ]; then
  echo "== Seed database =="
  docker compose run -T --rm -e ALLOW_PRODUCTION_SEED=true "${COMPOSE_APP_SERVICE}" /app/ops/seed.mjs --confirm </dev/null
fi

echo "== Recreate containers =="
docker compose up -d "${COMPOSE_APP_SERVICE}"

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
require_command ssh
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
  rsync -az --mkpath ops/seed.mjs "$VPS_HOST:${REMOTE_DIR}/ops/seed.mjs"
fi

log "Deploy to VPS with docker compose"
remote_compose_up

printf 'Deploy finished successfully\n'
