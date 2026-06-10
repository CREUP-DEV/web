// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'

export default withNuxt([
  eslintPluginPrettierRecommended,
  // @nuxt/eslint ignores the Nuxt public dir with an unanchored `public/**` glob,
  // which also (wrongly) excludes server/utils/public from linting. Re-include it.
  { ignores: ['!**/server/utils/public/**'] },
])
