// Bundles the scripts the production image runs outside Nuxt (migrations, both seeds and the cache
// purge) into self-contained files in dist/ops, their packages included, so the image needs no
// node_modules besides the one Nitro traces into .output. The Dockerfile copies them to /app/ops,
// next to /app/drizzle, which migrate.mjs finds as ../drizzle.
import { build } from 'esbuild'

await build({
  entryPoints: {
    migrate: 'ops/migrate.mjs',
    seed: 'drizzle/seed.ts',
    'seed-content': 'drizzle/seed/content.ts',
    'cache-purge': 'scripts/purge-cache.ts',
  },
  outdir: 'dist/ops',
  outExtension: { '.js': '.mjs' },
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  // pg loads its native binding only when asked for (pg.native), which the scripts never do.
  external: ['pg-native'],
  // CommonJS packages (pg, dotenv, ioredis) call require() for Node built-ins, which an ES module
  // bundle does not define.
  banner: {
    js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);',
  },
  logLevel: 'info',
})
