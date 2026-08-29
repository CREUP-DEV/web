#!/usr/bin/env bash
set -euo pipefail

# Replaces the local development database and admin-uploaded files with a fresh
# copy of production's, so a real-data bug can be reproduced locally (or local
# dev data just kept current). Runs from a developer machine, over SSH, against
# the VPS that deploy.sh already targets.
#
# What it does, in order (each part can be skipped, see flags):
#   1. Dumps the current local database to backups/local-<timestamp>.sql.gz
#      (so an accidental run is always recoverable).
#   2. Dumps the production database over SSH to backups/prod-<timestamp>.sql.gz.
#      Aborts if the dump looks empty/truncated instead of importing garbage.
#   3. Wipes every non-system schema locally and restores the production dump in
#      a single transaction: if anything fails, the local database is left
#      exactly as it was.
#   4. rsyncs production's uploaded files into the local tree
#      (public/ additively, .data/admin-assets/ mirrored).
#   5. Flushes the local Redis (SSR/API cache, Better Auth sessions, BullMQ)
#      so nothing serves content that no longer matches the new database.
#   6. Runs `pnpm db:migrate` locally, so migrations that exist locally but
#      aren't deployed yet are re-applied on top of production's schema.
#
# Configuration is read from .env, shared with deploy.sh / rollback.sh:
#   VPS_HOST, REMOTE_DIR, COMPOSE_DIR, COMPOSE_POSTGRES_SERVICE
# Optional clone-only knobs:
#   SSH_PORT       - if the VPS SSH port isn't 22 / an ~/.ssh/config alias
#   BACKUP_DIR     - where the .sql.gz dumps go (default: backups/)
#   PROD_ENV_FILE  - remote file (rel. to COMPOSE_DIR, or absolute) holding the
#                    app's DATABASE_URL and APP_*_DIR (default: web/.env)
#   PROD_PUBLIC_UPLOADS_DIR / PROD_ADMIN_ASSETS_DIR - override the upload paths
#
# The production role / database / password are parsed from DATABASE_URL inside
# PROD_ENV_FILE on the VPS and never leave it. The local restore runs inside the
# local Postgres container over its socket, so no local password is needed.
#
# Usage:
#   bash ./clone-prod-db.sh                 # db + files + redis flush + migrate
#   bash ./clone-prod-db.sh --skip-files    # database only
#   bash ./clone-prod-db.sh --skip-db       # files only (no redis flush, no migrate)
#   bash ./clone-prod-db.sh --skip-migrate  # don't run migrations afterwards
#   bash ./clone-prod-db.sh --skip-redis    # don't flush the local Redis

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

SKIP_DB=false
SKIP_FILES=false
SKIP_MIGRATE=false
SKIP_REDIS=false
for arg in "$@"; do
  case "$arg" in
    --help | -h)
      cat <<'EOF'
Replace the local dev database + admin files with a copy of production's.
Reads VPS_HOST / REMOTE_DIR / COMPOSE_DIR / COMPOSE_POSTGRES_SERVICE from .env
(shared with deploy.sh). Optional in .env:
  SSH_PORT, BACKUP_DIR
  PROD_ENV_FILE   remote file with the app's DATABASE_URL + APP_*_DIR
                  (rel. to COMPOSE_DIR or absolute; default web/.env)
  PROD_PUBLIC_UPLOADS_DIR / PROD_ADMIN_ASSETS_DIR  override the upload paths

Steps: back up local db -> dump prod db over SSH (role/db from DATABASE_URL in
PROD_ENV_FILE) -> wipe + restore locally in one transaction -> rsync prod
uploads -> flush local Redis -> pnpm db:migrate.

Usage:
  bash ./clone-prod-db.sh                 # everything
  bash ./clone-prod-db.sh --skip-files    # database only
  bash ./clone-prod-db.sh --skip-db       # files only
  bash ./clone-prod-db.sh --skip-migrate  # skip the final pnpm db:migrate
  bash ./clone-prod-db.sh --skip-redis    # skip the local Redis flush
EOF
      exit 0
      ;;
    --skip-db) SKIP_DB=true ;;
    --skip-files) SKIP_FILES=true ;;
    --skip-migrate) SKIP_MIGRATE=true ;;
    --skip-redis) SKIP_REDIS=true ;;
    *)
      printf 'ERROR: unknown argument: %s (use --help)\n' "$arg" >&2
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

load_env_file ".env"

: "${VPS_HOST:?ERROR: VPS_HOST is required (set it in .env, same as deploy.sh)}"
: "${REMOTE_DIR:?ERROR: REMOTE_DIR is required (set it in .env, same as deploy.sh)}"

COMPOSE_DIR="${COMPOSE_DIR:-$REMOTE_DIR}"
COMPOSE_POSTGRES_SERVICE="${COMPOSE_POSTGRES_SERVICE:-postgres}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
# Remote env file that holds the web app's DATABASE_URL and APP_*_DIR. On the
# CREUP VPS the app lives in a subdir of a shared Compose project, so its own
# env is COMPOSE_DIR/web/.env; a standalone deploy would use ".env".
PROD_ENV_FILE="${PROD_ENV_FILE:-web/.env}"
case "$PROD_ENV_FILE" in
  /*) PROD_ENV_FILE_ABS="$PROD_ENV_FILE" ;;
  *) PROD_ENV_FILE_ABS="$COMPOSE_DIR/$PROD_ENV_FILE" ;;
esac
LOCAL_COMPOSE_FILE="docker-compose.yml"
LOCAL_POSTGRES_SERVICE="postgres"
LOCAL_REDIS_SERVICE="redis"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

SSH_OPTS=(-o ConnectTimeout=10)
RSYNC_RSH="ssh -o ConnectTimeout=10"
if [ -n "${SSH_PORT:-}" ]; then
  SSH_OPTS+=(-p "$SSH_PORT")
  RSYNC_RSH="ssh -o ConnectTimeout=10 -p $SSH_PORT"
fi

require_command ssh
require_command docker
if [ "$SKIP_DB" != "true" ]; then
  require_command gzip
  require_command gunzip
fi
if [ "$SKIP_FILES" != "true" ]; then
  require_command rsync
fi
if [ "$SKIP_DB" != "true" ] && [ "$SKIP_MIGRATE" != "true" ]; then
  require_command pnpm
fi

dc_local() {
  docker compose -f "$LOCAL_COMPOSE_FILE" "$@"
}

if ! dc_local exec -T "$LOCAL_POSTGRES_SERVICE" true 2>/dev/null; then
  printf "ERROR: local '%s' container is not reachable. Start it with: docker compose up -d\n" \
    "$LOCAL_POSTGRES_SERVICE" >&2
  exit 1
fi

# --- Resolve where production keeps its uploaded files -----------------------
# APP_PUBLIC_UPLOADS_DIR / APP_ADMIN_ASSETS_DIR are read from PROD_ENV_FILE on
# the VPS; when unset there they default to ./data/... relative to COMPOSE_DIR
# (see deploy.sh ensure_host_data_dirs).
remote_env_get() {
  ssh "${SSH_OPTS[@]}" "$VPS_HOST" \
    "sed -n 's/^$1=//p' '$PROD_ENV_FILE_ABS' 2>/dev/null | tail -n1" |
    sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

resolve_remote_dir() {
  local value="$1" fallback="$2"
  [ -n "$value" ] || value="$fallback"
  value="${value#./}"
  case "$value" in
    /*) printf '%s' "$value" ;;
    *) printf '%s/%s' "$COMPOSE_DIR" "$value" ;;
  esac
}

if [ "$SKIP_FILES" != "true" ]; then
  # Precedence: explicit PROD_PUBLIC_UPLOADS_DIR / PROD_ADMIN_ASSETS_DIR from the
  # local .env, else APP_* read from the VPS's $COMPOSE_DIR/.env, else the
  # ./data/... default (all resolved to an absolute path on the VPS).
  PROD_PUBLIC_UPLOADS_DIR="$(resolve_remote_dir "${PROD_PUBLIC_UPLOADS_DIR:-$(remote_env_get APP_PUBLIC_UPLOADS_DIR)}" "data/public-uploads")"
  PROD_ADMIN_ASSETS_DIR="$(resolve_remote_dir "${PROD_ADMIN_ASSETS_DIR:-$(remote_env_get APP_ADMIN_ASSETS_DIR)}" "data/admin-assets")"
fi

mkdir -p "$BACKUP_DIR"

# ---------------------------------------------------------------------------
# 1 + 2 + 3: database
# ---------------------------------------------------------------------------
if [ "$SKIP_DB" != "true" ]; then
  log "Back up the local database"
  LOCAL_BACKUP_FILE="${BACKUP_DIR}/local-${TIMESTAMP}.sql.gz"
  dc_local exec -T "$LOCAL_POSTGRES_SERVICE" \
    sh -c 'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl' |
    gzip >"$LOCAL_BACKUP_FILE"
  printf '   saved %s\n' "$LOCAL_BACKUP_FILE"

  log "Dump the production database over SSH ($VPS_HOST)"
  PROD_DUMP_FILE="${BACKUP_DIR}/prod-${TIMESTAMP}.sql.gz"
  # Only the database NAME is taken from DATABASE_URL in PROD_ENV_FILE (parsed in
  # the remote shell: quoted heredoc, no local expansion; COMPOSE_DIR / env file
  # / service name arrive as positional args). The dump runs as the Postgres
  # container's own superuser ($POSTGRES_USER over the local socket = `trust`),
  # so every table is visible no matter which role owns it on the shared
  # instance. Passing -d "$POSTGRES_DB" was the earlier bug: that var is unset in
  # this service's container, so libpq fell back to dumping the empty `postgres`.
  ssh "${SSH_OPTS[@]}" "$VPS_HOST" bash -s -- \
    "$COMPOSE_DIR" "$PROD_ENV_FILE_ABS" "$COMPOSE_POSTGRES_SERVICE" <<'REMOTE' | gzip >"$PROD_DUMP_FILE"
set -euo pipefail
compose_dir=$1
env_file=$2
pg_service=$3
cd "$compose_dir"
[ -f "$env_file" ] || { echo "clone-prod-db: $env_file not found on the VPS (set PROD_ENV_FILE)" >&2; exit 1; }
url=$(sed -n 's/^DATABASE_URL=//p' "$env_file" | tail -n1)
url=${url%\"}; url=${url#\"}
url=${url%\'}; url=${url#\'}
[ -n "$url" ] || { echo "clone-prod-db: no DATABASE_URL in $env_file" >&2; exit 1; }
netloc=${url##*@}          # strip scheme + user:pass@ (password may contain @)
db_name=${netloc#*/}       # host[:port]/NAME?params  ->  NAME?params
db_name=${db_name%%\?*}    # drop ?params
[ -n "$db_name" ] || { echo "clone-prod-db: could not read the database name from DATABASE_URL" >&2; exit 1; }
exec docker compose exec -T -e TARGET_DB="$db_name" "$pg_service" \
  sh -c 'exec pg_dump -U "$POSTGRES_USER" -d "$TARGET_DB" --no-owner --no-acl'
REMOTE

  # grep -c consumes the whole stream (no SIGPIPE back to gzip, unlike grep -q,
  # which under `set -o pipefail` would mark this pipeline failed on a match).
  prod_table_count="$(gzip -dc "$PROD_DUMP_FILE" 2>/dev/null | grep -c 'CREATE TABLE ' || true)"
  if [ "${prod_table_count:-0}" -lt 1 ]; then
    printf 'ERROR: the production dump has no tables; nothing was imported.\n' >&2
    printf '       Check COMPOSE_POSTGRES_SERVICE (%s) and DATABASE_URL in %s on the VPS.\n' \
      "$COMPOSE_POSTGRES_SERVICE" "$PROD_ENV_FILE_ABS" >&2
    exit 1
  fi
  printf '   %s tables in the dump\n' "$prod_table_count"
  printf '   saved %s\n' "$PROD_DUMP_FILE"

  log "Replace the local database with the production dump"
  # Wipe every non-system schema (public + drizzle's migrations schema + any
  # other), then load the plain dump. Prepended to the dump so the whole thing
  # runs as ONE transaction under ON_ERROR_STOP: a failure (e.g. a lock held by
  # `pnpm dev`) rolls everything back and the local database is untouched.
  {
    cat <<'WIPE_SQL'
SET lock_timeout = '5s';
SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
 WHERE datname = current_database()
   AND pid <> pg_backend_pid();
DO $$
DECLARE schema_name text;
BEGIN
  FOR schema_name IN
    SELECT nspname FROM pg_namespace
     WHERE nspname NOT LIKE 'pg\_%'
       AND nspname <> 'information_schema'
  LOOP
    EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', schema_name);
  END LOOP;
END $$;
CREATE SCHEMA public;
WIPE_SQL
    gzip -dc "$PROD_DUMP_FILE"
  } | dc_local exec -T "$LOCAL_POSTGRES_SERVICE" sh -c '
        exec psql --single-transaction -v ON_ERROR_STOP=1 \
          -U "$POSTGRES_USER" -d "$POSTGRES_DB" -q
      ' || {
    printf 'ERROR: restore failed and was rolled back; the local database is unchanged.\n' >&2
    printf '       If it looks empty, stop `pnpm dev` / Drizzle Studio and re-run,\n' >&2
    printf '       or recover from: %s\n' "$LOCAL_BACKUP_FILE" >&2
    exit 1
  }
  printf '   imported.\n'
fi

# ---------------------------------------------------------------------------
# 4: uploaded files
# ---------------------------------------------------------------------------
sync_dir() {
  # $1 remote absolute dir, $2 local dest, rest: extra rsync args
  local remote="$1" dest="$2"
  shift 2
  mkdir -p "$dest"
  local out
  if ! out="$(rsync -az -e "$RSYNC_RSH" --stats "$@" "${VPS_HOST}:${remote}/" "$dest/" 2>&1)"; then
    printf '%s\n' "$out" >&2
    printf 'ERROR: rsync from %s failed (does the path exist on the VPS?).\n' "$remote" >&2
    printf '       Set PROD_PUBLIC_UPLOADS_DIR / PROD_ADMIN_ASSETS_DIR in .env to the real paths.\n' >&2
    exit 1
  fi
  printf '%s\n' "$out" | grep -E 'files transferred|Total transferred file size' >&2 || true
  local transferred
  transferred="$(printf '%s\n' "$out" | grep -Eo 'files transferred: [0-9]+' | grep -Eo '[0-9]+' || true)"
  if [ "${transferred:-0}" -eq 0 ]; then
    printf 'NOTE: nothing transferred from %s — it is empty, or the path is wrong for this VPS.\n' "$remote" >&2
    printf '      If wrong, set PROD_PUBLIC_UPLOADS_DIR / PROD_ADMIN_ASSETS_DIR in .env.\n' >&2
  fi
}

if [ "$SKIP_FILES" != "true" ]; then
  log "Sync production public uploads ($PROD_PUBLIC_UPLOADS_DIR) -> public/"
  # No --delete: public/ also holds tracked static assets (logos, fonts,
  # og/default.jpg, marca/manifest.json) that are not in production's
  # public-uploads tree.
  sync_dir "$PROD_PUBLIC_UPLOADS_DIR" public

  log "Sync production admin assets ($PROD_ADMIN_ASSETS_DIR) -> .data/admin-assets/"
  # --delete is safe here: .data/ is fully app-managed and git-ignored.
  sync_dir "$PROD_ADMIN_ASSETS_DIR" .data/admin-assets --delete
fi

# ---------------------------------------------------------------------------
# 5: local Redis
# ---------------------------------------------------------------------------
if [ "$SKIP_DB" != "true" ] && [ "$SKIP_REDIS" != "true" ]; then
  log "Flush the local Redis (cache, sessions, queues)"
  dc_local exec -T "$LOCAL_REDIS_SERVICE" \
    sh -c 'redis-cli ${REDIS_PASSWORD:+-a "$REDIS_PASSWORD"} --no-auth-warning FLUSHALL' || {
    printf 'WARNING: could not flush the local Redis; do it manually if stale data shows up.\n' >&2
  }
fi

# ---------------------------------------------------------------------------
# 6: local migrations
# ---------------------------------------------------------------------------
if [ "$SKIP_DB" != "true" ] && [ "$SKIP_MIGRATE" != "true" ]; then
  log "Apply pending local migrations"
  pnpm db:migrate
fi

log "Done"
[ "$SKIP_DB" = "true" ] || printf '   local backup: %s\n' "$LOCAL_BACKUP_FILE"
[ "$SKIP_DB" = "true" ] || printf '   prod dump:    %s\n' "$PROD_DUMP_FILE"
cat <<'EOF'

Notes:
  - The dumps under backups/ contain production personal data (newsletter
    subscribers with GDPR consent evidence, admin emails). Keep them out of
    any synced/backed-up location; set BACKUP_DIR in .env to move them.
  - Data signed with production's APP_SECRET (newsletter unsubscribe links,
    other HMAC tokens) will not verify locally if your APP_SECRET differs.
  - The Redis flush logs you out of the local admin; sign in again.
EOF
