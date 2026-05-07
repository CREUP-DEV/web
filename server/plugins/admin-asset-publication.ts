import { logError } from '../utils/core/logger'
import { reconcileAdminAssetPublication } from '../utils/admin/adminAssetPublication'

let reconciliationPromise: Promise<void> | null = null

export default defineNitroPlugin((nitro) => {
  // Run reconciliation in background after startup to avoid blocking server ready
  nitro.hooks.hookOnce('request', () => {
    if (reconciliationPromise) {
      return
    }

    reconciliationPromise = reconcileAdminAssetPublication()
      .catch((error) => {
        logError('admin-assets.reconcile.startup', error)
      })
      .finally(() => {
        reconciliationPromise = null
      })
  })
})
