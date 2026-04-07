import { logError } from '../utils/logger'
import { reconcileAdminAssetPublication } from '../utils/adminAssetPublication'

export default defineNitroPlugin((nitro) => {
  // Run reconciliation in background after startup to avoid blocking server ready
  nitro.hooks.hookOnce('request', () => {
    void reconcileAdminAssetPublication().catch((error) => {
      logError('admin-assets.reconcile.startup', error)
    })
  })
})
