// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'

export default withNuxt([
  eslintPluginPrettierRecommended,
  // @nuxt/eslint applies unanchored ignore globs (e.g. `public/**`, `data/**`) that also
  // wrongly exclude server/utils/public and drizzle/seed (both linted, imported TS) from
  // linting. Re-include them.
  { ignores: ['!**/server/utils/public/**', '!**/drizzle/seed/**'] },
])
