import { reconcileAdminAssetPublication } from '../utils/adminAssetPublication'

let hasReconciledAdminAssetPublication = false

export default defineNitroPlugin(async () => {
  if (hasReconciledAdminAssetPublication) {
    return
  }

  hasReconciledAdminAssetPublication = true
  await reconcileAdminAssetPublication()
})
