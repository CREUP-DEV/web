# syntax=docker/dockerfile:1.7

FROM node:24 AS base
WORKDIR /app

RUN corepack enable \
  && npm cache clean --force

FROM base AS builder

ARG SITE_URL
ARG NUXT_UMAMI_HOST
ARG NUXT_UMAMI_ID

ENV SITE_URL=$SITE_URL \
  NUXT_UMAMI_HOST=$NUXT_UMAMI_HOST \
  NUXT_UMAMI_ID=$NUXT_UMAMI_ID \
  npm_config_nodedir=/usr/local

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm config set store-dir /pnpm/store \
  && pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

# Ensure writable runtime roots exist in the final image.
RUN mkdir -p /app/.output/.data/admin-assets /app/.output/public

FROM gcr.io/distroless/nodejs24-debian12:nonroot AS runner

WORKDIR /app/.output

ENV NODE_ENV=production \
  NITRO_PORT=3000 \
  HOST=0.0.0.0

USER 1000:1000

COPY --from=builder --chown=1000:1000 /app/.output /app/.output
COPY --from=builder --chown=1000:1000 /app/ops/migrate.mjs /app/ops/migrate.mjs
COPY --from=builder --chown=1000:1000 /app/ops/start.mjs /app/ops/start.mjs
COPY --from=builder --chown=1000:1000 /app/drizzle /app/ops/drizzle

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD ["node", "-e", "const port=process.env.NITRO_PORT||'3000';fetch('http://127.0.0.1:'+port+'/health').then((response)=>process.exit(response.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["/app/ops/start.mjs"]
