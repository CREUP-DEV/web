# syntax=docker/dockerfile:1.7

FROM node:24 AS base
WORKDIR /app

RUN corepack enable \
  && npm cache clean --force

FROM base AS builder

ARG NUXT_SITE_URL
ARG NUXT_UMAMI_HOST
ARG NUXT_UMAMI_ID

ENV npm_config_nodedir=/usr/local
ENV NUXT_SITE_URL=${NUXT_SITE_URL}
ENV NUXT_UMAMI_HOST=${NUXT_UMAMI_HOST}
ENV NUXT_UMAMI_ID=${NUXT_UMAMI_ID}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm config set store-dir /pnpm/store \
  && pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build && pnpm run build:seed && pnpm run build:cache-purge

RUN pnpm prune --prod --ignore-scripts

# Ensure writable runtime roots exist in the final image.
RUN mkdir -p /app/.output/.data/admin-assets /app/.output/public

FROM gcr.io/distroless/nodejs24-debian12:nonroot AS runner

WORKDIR /app/.output

ENV NODE_ENV=production \
  NITRO_PORT=3000 \
  HOST=0.0.0.0

USER 1000:1000

COPY --from=builder --chown=1000:1000 /app/.output /app/.output
COPY --from=builder --chown=1000:1000 /app/node_modules /app/node_modules
COPY --from=builder --chown=1000:1000 /app/ops/migrate.mjs /app/ops/migrate.mjs
COPY --from=builder --chown=1000:1000 /app/ops/seed.mjs /app/ops/seed.mjs
COPY --from=builder --chown=1000:1000 /app/ops/cache-purge.mjs /app/ops/cache-purge.mjs
COPY --from=builder --chown=1000:1000 /app/ops/start.mjs /app/ops/start.mjs
COPY --from=builder --chown=1000:1000 /app/drizzle /app/drizzle

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD ["node", "-e", "const port=process.env.NITRO_PORT||'3000';fetch('http://127.0.0.1:'+port+'/health').then((response)=>process.exit(response.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["/app/ops/start.mjs"]

# Debug variant — NOT for routine production use.
# Build with: docker build --target runner-debug -t image:tag-debug .
# Use to: docker exec -it container bash, curl endpoints, inspect processes/files.
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
COPY --from=builder --chown=node:node /app/node_modules /app/node_modules
COPY --from=builder --chown=node:node /app/ops/migrate.mjs /app/ops/migrate.mjs
COPY --from=builder --chown=node:node /app/ops/seed.mjs /app/ops/seed.mjs
COPY --from=builder --chown=node:node /app/ops/cache-purge.mjs /app/ops/cache-purge.mjs
COPY --from=builder --chown=node:node /app/ops/start.mjs /app/ops/start.mjs
COPY --from=builder --chown=node:node /app/drizzle /app/drizzle

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://127.0.0.1:${NITRO_PORT:-3000}/health || exit 1
ENTRYPOINT ["node"]
CMD ["/app/ops/start.mjs"]
