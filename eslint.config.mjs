// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
// Use eslint-config-prettier to disable formatting-related ESLint rules
// and let Prettier handle formatting separately (via the editor/CI).
import eslintConfigPrettier from 'eslint-config-prettier'

// Combine Nuxt's defaults with Prettier compatibility.
export default withNuxt([eslintConfigPrettier])
