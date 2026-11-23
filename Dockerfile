# syntax=docker/dockerfile:1.7

FROM node:24 AS base
WORKDIR /app

RUN corepack enable \
  && npm cache clean --force

FROM base AS builder

ARG NUXT_SITE_URL
ARG NUXT_UMAMI_HOST
ARG NUXT_UMAMI_ID
# "true" keeps server sourcemaps in a production build (deploy-local.sh); empty everywhere else.
ARG NUXT_SERVER_SOURCEMAPS

ENV npm_config_nodedir=/usr/local
ENV NUXT_SITE_URL=${NUXT_SITE_URL}
ENV NUXT_UMAMI_HOST=${NUXT_UMAMI_HOST}
ENV NUXT_UMAMI_ID=${NUXT_UMAMI_ID}
ENV NUXT_SERVER_SOURCEMAPS=${NUXT_SERVER_SOURCEMAPS}
# Node's default heap is ~1/4 of the RAM it sees (2 GB in an 8 GB WSL/Docker Desktop VM),
# and `nuxt build` runs out of heap below that. Builder stage only: the runtime images don't
# inherit it and keep Node's default heap.
ENV NODE_OPTIONS=--max-old-space-size=4096

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm config set store-dir /pnpm/store \
  && pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build && pnpm run build:ops

# Ensure writable runtime roots exist in the final image.
RUN mkdir -p /app/.output/.data/admin-assets /app/.output/public

# Debug variant — NOT for routine production use. Same app as `runner`, on a base with a shell.
# Build with: docker build --target runner-debug -t image:tag-debug .
# Use to: docker exec -it container bash, curl endpoints, inspect processes/files.
# Defined before `runner` on purpose: a build without --target builds the last stage, and until
# 2026-11 that was this one, so production ran the debug image with the whole node_modules.
FROM node:24-slim AS runner-debug

RUN apt-get update && apt-get install -y --no-install-recommends \
  curl \
  procps \
  netcat-openbsd \
  iputils-ping \
  less \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/.output

ENV NODE_ENV=production \
  NITRO_PORT=3000 \
  HOST=0.0.0.0

USER node

COPY --from=builder --chown=node:node /app/.output /app/.output
COPY --from=builder --chown=node:node /app/dist/ops/ /app/ops/
COPY --from=builder --chown=node:node /app/ops/start.mjs /app/ops/start.mjs
COPY --from=builder --chown=node:node /app/drizzle /app/drizzle

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://127.0.0.1:${NITRO_PORT:-3000}/health || exit 1
ENTRYPOINT ["node"]
CMD ["/app/ops/start.mjs"]

# The production image, and the default target (it must stay the last stage).
FROM gcr.io/distroless/nodejs24-debian12:nonroot AS runner

WORKDIR /app/.output

ENV NODE_ENV=production \
  NITRO_PORT=3000 \
  HOST=0.0.0.0

USER 1000:1000

COPY --from=builder --chown=1000:1000 /app/.output /app/.output
# Migrations, both seeds and the cache purge, bundled with their packages (pnpm build:ops): the
# image carries no node_modules besides the one Nitro traces into .output.
COPY --from=builder --chown=1000:1000 /app/dist/ops/ /app/ops/
COPY --from=builder --chown=1000:1000 /app/ops/start.mjs /app/ops/start.mjs
COPY --from=builder --chown=1000:1000 /app/drizzle /app/drizzle

EXPOSE 3000
# Distroless has no `node` on PATH (nor a shell): the binary is /nodejs/bin/node, which is also the
# image's entrypoint, so `docker compose run app /app/ops/migrate.mjs` works as on the debug image.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD ["/nodejs/bin/node", "-e", "const port=process.env.NITRO_PORT||'3000';fetch('http://127.0.0.1:'+port+'/health').then((response)=>process.exit(response.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["/app/ops/start.mjs"]
