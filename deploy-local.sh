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
    return 0
  fi

  return 1
}

resolve_env_file() {
  local preferred_file="${DEPLOY_ENV_FILE:-.env.local-deploy}"

  if load_env_file "$preferred_file"; then
    DEPLOY_ENV_FILE="$preferred_file"
    return 0
  fi

  if load_env_file ".env"; then
    DEPLOY_ENV_FILE=".env"
    return 0
  fi

  printf 'ERROR: Could not find .env.local-deploy or .env in the project root.\n' >&2
  exit 1
}

build_local_image() {
  local build_site_url="${NUXT_SITE_URL:-${LOCAL_DEPLOY_SITE_URL:-http://localhost:8080}}"

  if docker buildx version >/dev/null 2>&1; then
    docker buildx build \
      --platform "$DOCKER_PLATFORM" \
      --build-arg "NUXT_SITE_URL=$build_site_url" \
      -t "$IMAGE" \
      --load \
      .
    return
  fi

  docker build \
    --platform "$DOCKER_PLATFORM" \
    --build-arg "NUXT_SITE_URL=$build_site_url" \
    -t "$IMAGE" \
    .
}

compose() {
  docker compose \
    -p "$COMPOSE_PROJECT_NAME" \
    --env-file "$DEPLOY_ENV_FILE" \
    -f "$COMPOSE_FILE" \
    "$@"
}

get_service_container_id() {
  compose ps -q "$1"
}

get_service_state() {
  local service="$1"
  local container_id=''

  container_id="$(get_service_container_id "$service")"

  if [ -z "$container_id" ]; then
    printf 'missing\n'
    return 0
  fi

  docker inspect \
    --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
    "$container_id"
}

wait_for_service_ready() {
  local service="$1"
  local timeout_seconds="${2:-90}"
  local poll_interval=2
  local elapsed=0
  local state='unknown'

  while [ "$elapsed" -lt "$timeout_seconds" ]; do
    state="$(get_service_state "$service" 2>/dev/null || printf 'unknown')"

    case "$state" in
      healthy|running)
        return 0
        ;;
      exited|dead|unhealthy)
        printf 'ERROR: Service "%s" entered state "%s".\n' "$service" "$state" >&2
        return 1
        ;;
    esac

    sleep "$poll_interval"
    elapsed=$((elapsed + poll_interval))
  done

  printf 'ERROR: Timed out waiting for service "%s". Last state: %s\n' "$service" "$state" >&2
  return 1
}

show_startup_failure_diagnostics() {
  printf '\nLocal deploy did not become ready. Current status:\n' >&2
  compose ps >&2 || true
  printf '\nRecent logs:\n' >&2
  show_logs app nginx postgres redis --no-follow -n 150 >&2 || true
}

print_service_states() {
  local services=(nginx app postgres redis mailpit)
  local service=''
  local state=''

  for service in "${services[@]}"; do
    state="$(get_service_state "$service" 2>/dev/null || printf 'unknown')"
    printf '  - %s: %s\n' "$service" "$state"
  done
}

inspect_host_request() {
  local request_path="$1"
  local url="${LOCAL_DEPLOY_SITE_URL%/}${request_path}"
  local headers_file=''
  local body_file=''

  if ! command -v curl >/dev/null 2>&1; then
    printf 'Skipping host request inspection for %s because curl is not available.\n' "$url"
    return 0
  fi

  headers_file="$(mktemp)"
  body_file="$(mktemp)"

  printf '\n== Host request ==\n%s\n' "$url"
  if ! curl -sS -D "$headers_file" -o "$body_file" "$url"; then
    printf 'curl failed for %s\n' "$url"
  fi

  sed -n '1p;/^[Cc]ontent-[Ll]ength:/p;/^[Cc]ontent-[Tt]ype:/p;/^[Ee][Tt]ag:/p;/^[Ll]ast-[Mm]odified:/p;/^[Cc]ache-[Cc]ontrol:/p' "$headers_file"
  printf 'body-bytes: %s\n' "$(wc -c < "$body_file" | tr -d ' ')"

  rm -f "$headers_file" "$body_file"
}

run_app_node() {
  if compose exec -T app /nodejs/bin/node --version >/dev/null 2>&1; then
    compose exec -T app /nodejs/bin/node "$@"
    return $?
  fi

  compose exec -T app node "$@"
}

inspect_app_request() {
  local request_path="$1"

  if [ "$(get_service_state app 2>/dev/null || printf 'unknown')" = 'missing' ]; then
    printf '\nApp container is not available, skipping internal request for %s\n' "$request_path"
    return 0
  fi

  printf '\n== App request ==\nhttp://127.0.0.1:3000%s\n' "$request_path"
  run_app_node -e '
const requestPath = process.argv[1]
const url = `http://127.0.0.1:3000${requestPath}`

;(async () => {
  const response = await fetch(url)
  const body = Buffer.from(await response.arrayBuffer())
  const headers = {}

  for (const name of ["content-length", "content-type", "etag", "last-modified", "cache-control"]) {
    const value = response.headers.get(name)
    if (value) {
      headers[name] = value
    }
  }

  console.log(JSON.stringify({
    url,
    status: response.status,
    statusText: response.statusText,
    headers,
    bodyBytes: body.length,
  }, null, 2))
})().catch((error) => {
  console.error(JSON.stringify({
    url,
    error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
  }, null, 2))
  process.exit(1)
})
' -- "$request_path"
}

is_image_path() {
  case "$1" in
    /imagenes/externas/*|/inicio/imagenes/*|/conocenos/imagenes/*|/eventos/imagenes/*|/prensa/imagenes/*|/prensa/newsletter/portadas/*|/prensa/newsletter/imagenes-por-defecto/*)
      return 0
      ;;
    *.avif|*.gif|*.jpeg|*.jpg|*.png|*.svg|*.webp)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

build_ipx_probe_path() {
  printf '/_ipx/f_webp/%s\n' "${1#/}"
}

doctor_local_stack() {
  local request_path=''
  local ipx_probe_path=''

  log "Local deploy diagnostics"
  compose ps

  printf '\nService states:\n'
  print_service_states

  inspect_host_request '/'
  inspect_app_request '/'

  for request_path in "$@"; do
    inspect_host_request "$request_path"
    inspect_app_request "$request_path"

    if [[ "$request_path" != /_ipx/* ]] && is_image_path "$request_path"; then
      ipx_probe_path="$(build_ipx_probe_path "$request_path")"
      inspect_host_request "$ipx_probe_path"
      inspect_app_request "$ipx_probe_path"
    fi
  done
}

up_local_stack() {
  log "Build local production image: $IMAGE"
  build_local_image

  log "Start dependencies"
  compose up -d postgres redis mailpit

  if [ "$APPLY_MIGRATIONS_ON_DEPLOY" = "true" ]; then
    log "Apply database migrations"
    compose run --rm app /app/ops/migrate.mjs
  fi

  log "Start app + nginx"
  compose up -d app nginx

  if ! wait_for_service_ready postgres 60 || ! wait_for_service_ready redis 60 || ! wait_for_service_ready app 90 || ! wait_for_service_ready nginx 30; then
    show_startup_failure_diagnostics
    return 1
  fi

  log "Current containers"
  compose ps

  printf '\nLocal deploy running:\n'
  printf '  - Web: %s\n' "$LOCAL_DEPLOY_SITE_URL"
  printf '  - Mailpit: http://localhost:%s\n' "$LOCAL_DEPLOY_MAILPIT_WEB_PORT"
  printf '\nUseful commands:\n'
  printf '  - Stop: bash ./deploy-local.sh down\n'
  printf '  - Logs: bash ./deploy-local.sh logs\n'
  printf '  - Doctor: bash ./deploy-local.sh doctor\n'
}

seed_database() {
  log "Seed database (destructive)"
  compose run --rm \
    -e ALLOW_PRODUCTION_SEED=true \
    app /app/ops/seed.mjs --confirm
}

down_local_stack() {
  log "Stop local deploy stack"
  compose down --remove-orphans
}

print_logs_usage() {
  cat <<'EOF'
Usage: bash ./deploy-local.sh logs [service ... | all] [options]

Services:
  app nginx postgres redis mailpit
  all                    Follow all services

Options:
  -f, --follow           Follow logs in real time (default)
      --no-follow        Print logs and exit
  -n, --lines <N>        Show last N lines per service (use 0 for all)
      --since <DURATION> Show logs since duration (example: 30m, 2h)
      --until <DURATION> Show logs until duration
  -t, --timestamps       Show timestamps
      --grep <PATTERN>   Filter output locally (case-insensitive)
  -h, --help             Show this help

Examples:
  bash ./deploy-local.sh logs
  bash ./deploy-local.sh logs app nginx
  bash ./deploy-local.sh logs all --no-follow -n 100
  bash ./deploy-local.sh logs app --since 30m --grep error
EOF
}

show_logs() {
  local follow=true
  local timestamps=false
  local lines=''
  local since=''
  local until=''
  local grep_pattern=''
  local use_all=false
  local token=''
  local service=''
  local existing=''
  local seen=false
  local services=()
  local selected_services=()
  local compose_args=(logs)

  while [ "$#" -gt 0 ]; do
    token="$1"

    case "$token" in
      -h|--help)
        print_logs_usage
        return 0
        ;;
      -f|--follow)
        follow=true
        ;;
      --no-follow)
        follow=false
        ;;
      -t|--timestamps)
        timestamps=true
        ;;
      -n|--lines)
        if [ "$#" -lt 2 ]; then
          printf 'ERROR: Missing value for %s\n' "$token" >&2
          return 1
        fi
        lines="$2"
        shift
        if ! [[ "$lines" =~ ^[0-9]+$ ]]; then
          printf 'ERROR: --lines must be a non-negative integer. Got: %s\n' "$lines" >&2
          return 1
        fi
        ;;
      --since)
        if [ "$#" -lt 2 ]; then
          printf 'ERROR: Missing value for --since\n' >&2
          return 1
        fi
        since="$2"
        shift
        ;;
      --until)
        if [ "$#" -lt 2 ]; then
          printf 'ERROR: Missing value for --until\n' >&2
          return 1
        fi
        until="$2"
        shift
        ;;
      --grep)
        if [ "$#" -lt 2 ]; then
          printf 'ERROR: Missing value for --grep\n' >&2
          return 1
        fi
        grep_pattern="$2"
        shift
        ;;
      all)
        if [ "$use_all" = true ] || [ "${#services[@]}" -gt 0 ]; then
          printf 'ERROR: "all" cannot be combined with explicit services.\n' >&2
          return 1
        fi
        use_all=true
        ;;
      app|nginx|postgres|redis|mailpit)
        if [ "$use_all" = true ]; then
          printf 'ERROR: Explicit services cannot be combined with "all".\n' >&2
          return 1
        fi
        services+=("$token")
        ;;
      *)
        printf 'ERROR: Unknown logs argument: %s\n' "$token" >&2
        print_logs_usage >&2
        return 1
        ;;
    esac

    shift
  done

  if [ "$use_all" = true ]; then
    selected_services=(nginx app postgres redis mailpit)
  elif [ "${#services[@]}" -gt 0 ]; then
    for service in "${services[@]}"; do
      seen=false
      for existing in "${selected_services[@]}"; do
        if [ "$existing" = "$service" ]; then
          seen=true
          break
        fi
      done
      if [ "$seen" = false ]; then
        selected_services+=("$service")
      fi
    done
  else
    selected_services=(nginx app)
  fi

  if [ "$follow" = true ]; then
    compose_args+=(-f)
  fi

  if [ "$timestamps" = true ]; then
    compose_args+=(--timestamps)
  fi

  if [ -n "$lines" ]; then
    if [ "$lines" = '0' ]; then
      compose_args+=(--tail all)
    else
      compose_args+=(--tail "$lines")
    fi
  fi

  if [ -n "$since" ]; then
    compose_args+=(--since "$since")
  fi

  if [ -n "$until" ]; then
    compose_args+=(--until "$until")
  fi

  if [ -n "$grep_pattern" ]; then
    require_command grep
    set +e
    compose "${compose_args[@]}" "${selected_services[@]}" | grep -i --line-buffered -- "$grep_pattern"
    local compose_exit=${PIPESTATUS[0]-0}
    local grep_exit=${PIPESTATUS[1]-0}
    set -e

    if [ "$compose_exit" -ne 0 ]; then
      return "$compose_exit"
    fi

    if [ "$grep_exit" -gt 1 ]; then
      return "$grep_exit"
    fi

    return 0
  fi

  compose "${compose_args[@]}" "${selected_services[@]}"
}

show_status() {
  compose ps
}

ACTION="${1:-up}"
ACTION_ARGS=()

if [ "$#" -gt 1 ]; then
  ACTION_ARGS=("${@:2}")
fi

require_command docker
require_command git

resolve_env_file

: "${APP_SECRET:?ERROR: APP_SECRET is required in ${DEPLOY_ENV_FILE}.}"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.local-deploy.yml}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-creup-web-local-deploy}"
DOCKER_PLATFORM="${DOCKER_PLATFORM:-linux/amd64}"
LOCAL_DEPLOY_HTTP_PORT="${LOCAL_DEPLOY_HTTP_PORT:-8080}"
LOCAL_DEPLOY_MAILPIT_WEB_PORT="${LOCAL_DEPLOY_MAILPIT_WEB_PORT:-8025}"
LOCAL_DEPLOY_SITE_URL="${LOCAL_DEPLOY_SITE_URL:-http://localhost:${LOCAL_DEPLOY_HTTP_PORT}}"
IMAGE_NAME="${IMAGE_NAME:-creup-web-local}"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD)}"
IMAGE="${IMAGE:-${IMAGE_NAME}:${IMAGE_TAG}}"
APPLY_MIGRATIONS_ON_DEPLOY="${APPLY_MIGRATIONS_ON_DEPLOY:-true}"

export DEPLOY_ENV_FILE
export IMAGE
export LOCAL_DEPLOY_SITE_URL

case "$ACTION" in
  up)
    up_local_stack
    ;;
  down)
    down_local_stack
    ;;
  seed)
    seed_database
    ;;
  logs)
    show_logs "${ACTION_ARGS[@]}"
    ;;
  status)
    show_status
    ;;
  doctor)
    doctor_local_stack "${ACTION_ARGS[@]}"
    ;;
  *)
    printf 'Usage: bash ./deploy-local.sh [up|down|seed|logs|status|doctor]\n' >&2
    printf 'Logs help: bash ./deploy-local.sh logs --help\n' >&2
    exit 1
    ;;
esac
