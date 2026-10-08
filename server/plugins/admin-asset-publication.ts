import { logError } from '../utils/core/logger'
import { reconcileAdminAssetPublication } from '../utils/admin/adminAssetPublication'
import { invalidateAllPublicCmsCaches } from '../utils/admin/adminCacheInvalidation'

let reconciliationPromise: Promise<void> | null = null

export default defineNitroPlugin((nitro) => {
  // Run reconciliation in background after startup to avoid blocking server ready
  nitro.hooks.hookOnce('request', () => {
    if (reconciliationPromise) {
      return
    }

    reconciliationPromise = reconcileAdminAssetPublication()
      // The route cache lives in Redis and survives the restart, so payloads cached before it
      // would keep pointing at files the reconcile just moved.
      .then((changed) => (changed ? invalidateAllPublicCmsCaches() : undefined))
      .catch((error) => {
        logError('admin-assets.reconcile.startup', error)
      })
      .finally(() => {
        reconciliationPromise = null
      })
  })
})
