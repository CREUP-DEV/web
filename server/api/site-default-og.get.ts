import { defineEventHandler } from 'h3'
import { getSiteDefaultOgImageUrlWithVersion } from '../utils/admin/siteDefaultImages'

export default defineEventHandler(async () => ({
  data: {
    image: await getSiteDefaultOgImageUrlWithVersion(),
  },
}))
