import { defineEventHandler } from 'h3'
import { db } from '../../db'
import { throwPublicAssetNotFound, tryServePublicAssetByPath } from '../../utils/publicAsset'
import { PRESS_DOSSIER_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  const item = await db.query.pressDossier.findFirst()

  if (!item?.active || !item.pdfUrl) {
    throwPublicAssetNotFound()
  }

  const asset = await tryServePublicAssetByPath(event, PRESS_DOSSIER_PUBLIC_PATH)

  if (asset === null) {
    throwPublicAssetNotFound()
  }

  return asset
})
