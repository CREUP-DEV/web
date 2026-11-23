#!/usr/bin/env bash
set -euo pipefail

# Each step says when it started, counted from the script's start, so a slow deploy shows which
# step took the time.
log() {
  printf '== %s (+%ss) ==\n' "$1" "$SECONDS"
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

# CI's checks minus the build, which the image does (scripts/verify.mjs). Under WSL the tree's
# node_modules were installed by Windows' pnpm, with Windows native binaries (esbuild, rollup), so
# it runs through Windows too.
run_verify() {
  if [ -n "${WSL_DISTRO_NAME:-}" ] && command -v cmd.exe >/dev/null 2>&1; then
    cmd.exe /c pnpm verify
    return
  fi
  require_command pnpm
  pnpm verify
}

# Where a passing `pnpm verify` leaves the tree it checked (scripts/verify.mjs).
VERIFIED_TREE_FILE=node_modules/.cache/verify/tree

# The git tree of the working directory as it is, uncommitted and untracked files included, built
# in a copy of the index (the real one is never touched); scripts/verify.mjs works it out the same
# way. Fails when git cannot tell.
working_tree_hash() {
  local index tree status=1
  index="$(mktemp)"
  if cp "$(git rev-parse --git-path index)" "$index" 2>/dev/null &&
    GIT_INDEX_FILE="$index" git add -A >/dev/null 2>&1 &&
    tree="$(GIT_INDEX_FILE="$index" git write-tree 2>/dev/null)"; then
    printf '%s\n' "$tree"
    status=0
  fi
  rm -f "$index"
  return "$status"
}

# True when `pnpm verify` already passed on this very tree: a deploy that failed on the VPS and is
# run again, or a verify run by hand just before. Under WSL the stamp comes from Windows' git, whose
# line endings may differ: then the hashes never match and it verifies again, the safe side.
already_verified() {
  local tree
  [ "${DEPLOY_REVERIFY:-}" != 1 ] || return 1
  [ -s "$VERIFIED_TREE_FILE" ] || return 1
  tree="$(working_tree_hash)" || return 1
  [ "$tree" = "$(tr -d '\r\n' <"$VERIFIED_TREE_FILE")" ]
}

# The image is built into the local Docker, in the background, while verify runs, and pushed only
# once both have passed: nothing that failed verify reaches the registry. Its output goes to
# BUILD_LOG, so the two logs never interleave.
BUILD_PID=
BUILD_LOG=
BUILD_STARTED=

image_build_args() {
  # Embed public origin in the bundle at build time. When local .env keeps
  # NUXT_SITE_URL on localhost, set NUXT_DEPLOY_SITE_URL to the production URL.
  printf '%s\n' \
    --platform "$DOCKER_PLATFORM" \
    --build-arg "NUXT_SITE_URL=${NUXT_DEPLOY_SITE_URL:-$NUXT_SITE_URL}" \
    --build-arg "NUXT_UMAMI_HOST=${NUXT_UMAMI_HOST:-}" \
    --build-arg "NUXT_UMAMI_ID=${NUXT_UMAMI_ID:-}"
}

start_build() {
  local args
  mapfile -t args < <(image_build_args)
  args+=(-t "$IMAGE")
  # :latest only ever names a committed build.
  if [ "$DIRTY" = false ]; then
    args+=(-t "${IMAGE_NAME}:latest")
  fi

  BUILD_LOG="$(mktemp)"
  BUILD_STARTED=$SECONDS
  log "Build $IMAGE in the background, log in $BUILD_LOG"
  if docker buildx version >/dev/null 2>&1; then
    docker buildx build "${args[@]}" --load . >"$BUILD_LOG" 2>&1 &
  else
    docker build "${args[@]}" . >"$BUILD_LOG" 2>&1 &
  fi
  BUILD_PID=$!
}

# Stops a build still running (verify failed, Ctrl-C, any error). Under Git Bash the docker client
# is a Windows process that a signal does not reach, so its whole tree goes through taskkill;
# BuildKit cancels the build when its client goes.
stop_build() {
  [ -n "$BUILD_PID" ] || return 0
  if kill -0 "$BUILD_PID" 2>/dev/null; then
    printf 'Stopping the image build\n' >&2
    if [ -r "/proc/$BUILD_PID/winpid" ] && command -v taskkill >/dev/null 2>&1; then
      taskkill //T //F //PID "$(cat "/proc/$BUILD_PID/winpid")" >/dev/null 2>&1 || true
    else
      pkill -TERM -P "$BUILD_PID" 2>/dev/null || true
      kill "$BUILD_PID" 2>/dev/null || true
    fi
  fi
  wait "$BUILD_PID" 2>/dev/null || true
  BUILD_PID=
}

finish_build() {
  local status=0
  if kill -0 "$BUILD_PID" 2>/dev/null; then
    log "Wait for the image build"
  fi
  wait "$BUILD_PID" || status=$?
  BUILD_PID=
  if [ "$status" -ne 0 ]; then
    printf 'ERROR: the image build failed (exit %s); its last lines, the whole log in %s:\n' "$status" "$BUILD_LOG" >&2
    tail -n 60 "$BUILD_LOG" >&2
    exit 1
  fi
  printf '    image built in %ss\n' $((SECONDS - BUILD_STARTED))
  rm -f "$BUILD_LOG"
}

push_image() {
  log "Push $IMAGE"
  docker push "$IMAGE"
  if [ "$DIRTY" = false ]; then
    docker push "${IMAGE_NAME}:latest"
  fi
}

# The debug variant (Dockerfile runner-debug), built and pushed after the real image: with a shell
# and curl, for inspecting a problem on the VPS by hand. Never what the deploy runs.
build_and_push_debug_image() {
  local args
  mapfile -t args < <(image_build_args)
  args+=(--target runner-debug -t "${IMAGE}-debug" -t "${IMAGE_NAME}:latest-debug")

  log "Build and push ${IMAGE}-debug"
  if docker buildx version >/dev/null 2>&1; then
    docker buildx build "${args[@]}" --push .
    return
  fi
  docker build "${args[@]}" .
  docker push "${IMAGE}-debug"
  docker push "${IMAGE_NAME}:latest-debug"
}

sync_public_uploads() {
  rsync -avz --mkpath -e "$SSH_BIN" public/ "$VPS_HOST:${REMOTE_DIR}/data/public-uploads/"
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

  # The deployed image and the one saved for rollback always stay, whatever their age.
  local keep_ids kept=0 removed=0 image_id full_id
  keep_ids=" \$(docker image inspect --format '{{.Id}}' "${IMAGE}" 2>/dev/null || true) "
  if [ -s "\$ROLLBACK_IMAGE_FILE" ]; then
    keep_ids+=" \$(docker image inspect --format '{{.Id}}' "\$(cat "\$ROLLBACK_IMAGE_FILE")" 2>/dev/null || true) "
  fi

  echo "== Remove old app images =="
  # Newest first, sorted here: the containerd image store does not list them in creation order.
  while read -r image_id; do
    [ -n "\$image_id" ] || continue
    full_id="\$(docker image inspect --format '{{.Id}}' "\$image_id")"
    if [[ "\$keep_ids" == *" \$full_id "* ]] || [ "\$kept" -lt "\$keep_count" ]; then
      kept=\$((kept + 1))
      continue
    fi
    if docker image rm "\$image_id" >/dev/null 2>&1; then
      removed=\$((removed + 1))
    fi
  done < <(docker image ls "\$image_name" --format '{{.CreatedAt}}|{{.ID}}' | sort -r | cut -d'|' -f2 | awk '!seen[\$0]++')
  echo "    kept \$kept, removed \$removed"
}

resolve_current_app_image() {
  local service="\$1"
  local image_name="\$2"
  local container_id
  local current_image
  local current_image_id
  local current_digest

  container_id="\$(docker compose ps -q "\$service" </dev/null 2>/dev/null || true)"
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
  local container_id
  local health

  # A failed deploy leaves a broken container behind: keep the last good image instead.
  container_id="\$(docker compose ps -q "\$service" </dev/null 2>/dev/null || true)"
  if [ -n "\$container_id" ]; then
    health="\$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "\$container_id")"
    if [ "\$health" != healthy ] && [ "\$health" != none ]; then
      echo "== Rollback image: current app is \$health, keeping \$(cat "\$rollback_file" 2>/dev/null || echo 'none') =="
      return
    fi
  fi

  current_image="\$(resolve_current_app_image "\$service" "\$image_name")"
  if [ -z "\$current_image" ]; then
    echo "== Rollback image: no running app container found =="
    return
  fi

  printf '%s\n' "\$current_image" > "\$rollback_file"
  echo "== Rollback image saved: \$current_image =="
}

# Every docker compose call below reads /dev/null: bash reads this script from stdin, and a child
# that reads it (docker compose exec and run do, even with -T) swallows the rest of the script, which
# then ends early with status 0. Compose reads the root .env itself, so it is not sourced here.
cd "${COMPOSE_DIR}"

# The services the app depends on, as \`docker compose config <service>\` lists them.
app_dependencies() {
  docker compose config "${COMPOSE_APP_SERVICE}" </dev/null | awk '
    /^[^ #]/ { section = \$1; next }
    section == "services:" && /^  [A-Za-z0-9._-]+:\$/ { sub(/^  /, ""); sub(/:\$/, ""); print }
  ' | grep -vx "${COMPOSE_APP_SERVICE}" || true
}

# Per-project var (compose reads ${WEB_IMAGE:-...}), never a bare IMAGE.
export WEB_IMAGE="${IMAGE}"

echo "== Ensure host data directories =="
ensure_host_data_dirs

echo "== Save current app image for rollback =="
save_current_app_image_for_rollback "${COMPOSE_APP_SERVICE}" "${IMAGE_NAME}" "\$ROLLBACK_IMAGE_FILE"

echo "== Pull images (+\${SECONDS}s) =="
docker compose pull "${COMPOSE_APP_SERVICE}" </dev/null

echo "== Ensure the app's dependencies are running =="
# Started if stopped, never recreated: postgresql is shared by every project on the VPS, and a
# plain \`up -d\`, or a run/up of the app without --no-deps, recreates any dependency whose config
# drifted. Everything below therefore runs with --no-deps.
mapfile -t deps < <(app_dependencies)
if [ "\${#deps[@]}" -gt 0 ]; then
  echo "    \${deps[*]}"
  docker compose up -d --no-recreate --wait --wait-timeout 120 "\${deps[@]}" </dev/null
fi

# The web database's name, read from DATABASE_URL in the app's env file as clone-prod-db.sh does.
web_db_name() {
  local url netloc name
  [ -f "${PROD_ENV_FILE_ABS}" ] || return 1
  url="\$(sed -n 's/^DATABASE_URL=//p' "${PROD_ENV_FILE_ABS}" | tail -n1)"
  url="\${url%\"}"; url="\${url#\"}"; url="\${url%\'}"; url="\${url#\'}"
  netloc="\${url##*@}"     # strip scheme + user:pass@ (the password may contain @)
  name="\${netloc#*/}"     # host[:port]/NAME?params -> NAME?params
  name="\${name%%\?*}"     # drop ?params
  [ -n "\$name" ] || return 1
  printf '%s\n' "\$name"
}

# A query on the web database, as the postgres container's own superuser over its local socket
# (what clone-prod-db.sh dumps with), so it sees every table whatever role owns it.
psql_web_db() {
  docker compose exec -T -e TARGET_DB="\$DB_NAME" "${COMPOSE_POSTGRES_SERVICE}" \
    sh -c 'exec psql -X -A -t -v ON_ERROR_STOP=1 -U "\$POSTGRES_USER" -d "\$TARGET_DB" -c "\$1"' sh "\$1" \
    </dev/null 2>/dev/null | tr -d '\r'
}

applied_migrations() {
  psql_web_db 'SELECT count(*) FROM drizzle.__drizzle_migrations' || true
}

dump_file=""
migrations_before=""
if [ "${APPLY_MIGRATIONS_ON_DEPLOY}" = "true" ]; then
  echo "== Dump the database before migrating (+\${SECONDS}s) =="
  # A migration that succeeds but transforms data wrongly cannot be undone: no dump, no deploy.
  # Retention only ever touches this script's own files, as the directory may be shared with other
  # dumps and manual copies.
  if ! DB_NAME="\$(web_db_name)"; then
    echo "ERROR: no database name in DATABASE_URL of ${PROD_ENV_FILE_ABS} (set PROD_ENV_FILE); nothing was migrated" >&2
    exit 1
  fi
  mkdir -p "${DEPLOY_DUMP_DIR}"
  # Left by a dump cut short (a dropped connection, Ctrl-C): never a usable one.
  find "${DEPLOY_DUMP_DIR}" -maxdepth 1 -type f -name "\${DB_NAME}-predeploy-*.dump.partial" -delete
  dump_file="${DEPLOY_DUMP_DIR}/\${DB_NAME}-predeploy-\$(date -u +%Y%m%d-%H%M%S).dump"
  if ! (umask 077 && docker compose exec -T -e TARGET_DB="\$DB_NAME" "${COMPOSE_POSTGRES_SERVICE}" \
    sh -c 'exec pg_dump -U "\$POSTGRES_USER" -Fc "\$TARGET_DB"' </dev/null >"\$dump_file.partial") ||
    [ ! -s "\$dump_file.partial" ]; then
    rm -f "\$dump_file.partial"
    echo "ERROR: pg_dump of \$DB_NAME failed; nothing was migrated" >&2
    exit 1
  fi
  mv "\$dump_file.partial" "\$dump_file"
  echo "    \$dump_file (\$(du -h "\$dump_file" | cut -f1))"
  if [[ "${DEPLOY_DUMP_RETENTION}" =~ ^[0-9]+\$ ]] && [ "${DEPLOY_DUMP_RETENTION}" -ge 1 ]; then
    removed=0
    # The UTC timestamp in the name sorts by date.
    while read -r old_dump; do
      [ -n "\$old_dump" ] || continue
      rm -f "\$old_dump"
      removed=\$((removed + 1))
    done < <(find "${DEPLOY_DUMP_DIR}" -maxdepth 1 -type f -name "\${DB_NAME}-predeploy-*.dump" | sort -r | tail -n +\$((${DEPLOY_DUMP_RETENTION} + 1)))
    echo "    kept the last ${DEPLOY_DUMP_RETENTION}, removed \$removed"
  fi

  echo "== Apply database migrations (+\${SECONDS}s) =="
  migrations_before="\$(applied_migrations)"
  docker compose run -T --rm --no-deps "${COMPOSE_APP_SERVICE}" /app/ops/migrate.mjs </dev/null

  # Idempotent: backfills seed-content translations (tags, carousel, links, equality
  # docs) onto existing rows via onConflictDoNothing. Non-destructive and safe every
  # deploy, so new locales land without the destructive full seed (SEED_ON_DEPLOY).
  echo "== Seed content translations (idempotent) =="
  docker compose run -T --rm --no-deps "${COMPOSE_APP_SERVICE}" /app/ops/seed-content.mjs </dev/null
fi

if [ "${SEED_ON_DEPLOY}" = "true" ]; then
  echo "== Seed database =="
  docker compose run -T --rm --no-deps -e ALLOW_PRODUCTION_SEED=true "${COMPOSE_APP_SERVICE}" /app/ops/seed.mjs --confirm </dev/null
fi

echo "== Recreate containers =="
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
    # rollback.sh refuses an image older than the database's migrations, so say which way out
    # applies, with the dump this deploy just wrote.
    if [ -n "\$dump_file" ]; then
      echo "Pre-deploy dump: \$dump_file" >&2
      migrations_after="\$(applied_migrations)"
      if [[ "\$migrations_before" =~ ^[0-9]+\$ ]] && [[ "\$migrations_after" =~ ^[0-9]+\$ ]] &&
        [ "\$migrations_after" -gt "\$migrations_before" ]; then
        echo "This deploy applied \$((migrations_after - migrations_before)) migration(s), so bash ./rollback.sh refuses: restore \$dump_file first (DEPLOYMENT.md, Rollback), then roll back; or bash ./rollback.sh --force if the previous release works with them" >&2
        exit 1
      fi
    fi
    echo "Roll back with: bash ./rollback.sh" >&2
    exit 1
    ;;
esac

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
  # Never glue the line onto another project's last key.
  if [ -s .env ] && [ -n "\$(tail -c1 .env)" ]; then
    printf '\n' >> .env
  fi
  printf '%s\n' "\$WEB_IMAGE_ENV_LINE" >> .env
fi
echo "    \$WEB_IMAGE_ENV_LINE"

services="\$(docker compose config --services </dev/null)"
if grep -qx "${COMPOSE_NGINX_SERVICE}" <<< "\$services"; then
  echo "== Reload NGINX =="
  # \`nginx -s reload\` exits 0 even when the new config is broken (the old one stays loaded), so
  # the config is tested first to make a bad one fail the deploy instead of passing unnoticed.
  if ! docker compose exec -T "${COMPOSE_NGINX_SERVICE}" nginx -t </dev/null; then
    echo "ERROR: the NGINX config does not pass nginx -t; NGINX keeps the config it had loaded." >&2
    echo "The app itself is deployed and healthy: fix the NGINX config, do not roll back." >&2
    exit 1
  fi
  docker compose exec -T "${COMPOSE_NGINX_SERVICE}" nginx -s reload </dev/null
fi

cleanup_old_app_images "${IMAGE_NAME}" "${DEPLOY_IMAGE_RETENTION}"

echo "    the VPS took \${SECONDS}s"
echo "${REMOTE_DONE_MARKER}"
EOF
}

# The remote side must say it finished: a script cut short (a swallowed stdin, a dropped
# connection) cannot pass for a successful deploy.
REMOTE_DONE_MARKER="== Remote deploy done =="

load_env_file ".env"

usage() {
  cat <<'USAGE'
Usage: bash ./deploy.sh [--seed] [--debug]
  --seed    also run the destructive full seed (first deploy only)
  --debug   also build and push the runner-debug image (<tag>-debug)

Environment:
  DEPLOY_SKIP_VERIFY=1         skip `pnpm verify` (lint, types, i18n)
  DEPLOY_REVERIFY=1            run `pnpm verify` even when it already passed on this exact tree
  DEPLOY_BUILD_AFTER_VERIFY=1  build the image after verify instead of during it (both share the
                               CPU and memory: for a machine short of either)
  DEPLOY_SKIP_BUILD=1          deploy IMAGE (or IMAGE_TAG) without building it; it must already be
                               in the registry
USAGE
}

SEED_ON_DEPLOY=false
BUILD_DEBUG=false
for arg in "$@"; do
  case "$arg" in
    --seed) SEED_ON_DEPLOY=true ;;
    --debug) BUILD_DEBUG=true ;;
    -h | --help) usage; exit 0 ;;
    *) printf 'ERROR: unknown argument: %s\n' "$arg" >&2; usage >&2; exit 1 ;;
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
# Untracked files count too: they are in the build context, so they change the image.
DIRTY=false
if [ -n "$(git status --porcelain)" ]; then
  DIRTY=true
fi
if [ -z "${IMAGE_TAG:-}" ]; then
  IMAGE_TAG="$(git rev-parse --short HEAD)"
  # The image carries the working tree, not the commit. Tagged as the bare commit, a build with
  # uncommitted changes would overwrite the tag a clean deploy of that commit (and the rollback file
  # on the VPS) points at.
  if [ "$DIRTY" = true ]; then
    IMAGE_TAG="${IMAGE_TAG}-dirty-$(date +%Y%m%d%H%M%S)"
    if [ "${DEPLOY_SKIP_BUILD:-}" != 1 ]; then
      printf 'WARNING: uncommitted changes; deploying them as %s\n' "$IMAGE_TAG" >&2
    fi
  fi
fi
IMAGE="${IMAGE:-${IMAGE_NAME}:${IMAGE_TAG}}"
DOCKER_PLATFORM="${DOCKER_PLATFORM:-linux/amd64}"
APPLY_MIGRATIONS_ON_DEPLOY="${APPLY_MIGRATIONS_ON_DEPLOY:-true}"
COMPOSE_DIR="${COMPOSE_DIR:-$REMOTE_DIR}"
COMPOSE_APP_SERVICE="${COMPOSE_APP_SERVICE:-app}"
COMPOSE_POSTGRES_SERVICE="${COMPOSE_POSTGRES_SERVICE:-postgres}"
COMPOSE_NGINX_SERVICE="${COMPOSE_NGINX_SERVICE:-nginx}"
DEPLOY_IMAGE_RETENTION="${DEPLOY_IMAGE_RETENTION:-2}"
ROLLBACK_IMAGE_FILE="${ROLLBACK_IMAGE_FILE:-.last_app_image}"
# The env file on the VPS that holds the app's DATABASE_URL, as in clone-prod-db.sh: on the CREUP
# VPS the app lives in a subdirectory of a shared Compose project.
PROD_ENV_FILE="${PROD_ENV_FILE:-web/.env}"
case "$PROD_ENV_FILE" in
  /*) PROD_ENV_FILE_ABS="$PROD_ENV_FILE" ;;
  *) PROD_ENV_FILE_ABS="$COMPOSE_DIR/$PROD_ENV_FILE" ;;
esac
# Pre-migration dumps, relative to COMPOSE_DIR, and how many of them to keep.
DEPLOY_DUMP_DIR="${DEPLOY_DUMP_DIR:-backups/db}"
DEPLOY_DUMP_RETENTION="${DEPLOY_DUMP_RETENTION:-10}"

VERIFY=true
if [ "${DEPLOY_SKIP_VERIFY:-}" = 1 ]; then
  printf 'WARNING: DEPLOY_SKIP_VERIFY=1: lint, types and i18n not checked\n' >&2
  VERIFY=false
elif already_verified; then
  log "Verify: skipped, pnpm verify already passed on this exact tree (DEPLOY_REVERIFY=1 runs it again)"
  VERIFY=false
fi

verify() {
  log "Verify: pnpm verify"
  if ! run_verify; then
    printf 'ERROR: pnpm verify failed; nothing was pushed nor deployed\n' >&2
    exit 1
  fi
}

remote_log=""
trap 'stop_build; rm -f "$remote_log"' EXIT

if [ "${DEPLOY_SKIP_BUILD:-}" = 1 ]; then
  log "Skip build: $IMAGE must already be in the registry"
  if [ "$VERIFY" = true ]; then
    verify
  fi
else
  if [ -n "${GHCR_USERNAME:-}" ] && [ -n "${GHCR_TOKEN:-}" ]; then
    log "GHCR login"
    echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin
  fi

  if [ -n "${NUXT_DEPLOY_SITE_URL:-}" ]; then
    log "Docker build embeds $NUXT_DEPLOY_SITE_URL (VPS runtime still uses its Compose NUXT_SITE_URL)"
  fi
  if [ "$VERIFY" = true ] && [ "${DEPLOY_BUILD_AFTER_VERIFY:-}" = 1 ]; then
    verify
    VERIFY=false
  fi
  start_build
  if [ "$VERIFY" = true ]; then
    verify
  fi
  finish_build
  push_image

  if [ "$BUILD_DEBUG" = "true" ]; then
    build_and_push_debug_image
  fi
fi

if [ "$SEED_ON_DEPLOY" = "true" ]; then
  log "Sync public uploads to VPS"
  sync_public_uploads

  # The image already carries the seed, bundled with its packages (pnpm build:ops). The copy beside
  # the Compose project is the same self-contained bundle, so it runs wherever it is mounted.
  log "Copy seed script to VPS"
  pnpm run build:ops
  rsync -az --mkpath -e "$SSH_BIN" dist/ops/seed.mjs "$VPS_HOST:${REMOTE_DIR}/ops/seed.mjs"
fi

log "Deploy to VPS with docker compose"
remote_log="$(mktemp)"
remote_compose_up | tee "$remote_log"
if ! grep -qxF "$REMOTE_DONE_MARKER" "$remote_log"; then
  printf 'ERROR: the remote deploy stopped before its last step\n' >&2
  exit 1
fi

printf 'Deploy finished successfully in %ss\n' "$SECONDS"
