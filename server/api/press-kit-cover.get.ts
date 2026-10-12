import { defineEventHandler } from 'h3'
import { getPressKitCoverImageUrlWithVersion } from '../utils/admin/siteDefaultImages'

/** Photo behind the cover of the press kit PDF; the browser asks for it only when downloading. */
export default defineEventHandler(async () => ({
  data: {
    image: await getPressKitCoverImageUrlWithVersion(),
  },
}))
