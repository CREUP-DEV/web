import { isPublicCmsAsyncDataKey } from '~~/shared/constants/publicAsyncDataKeys'
import { onPublicCmsCacheInvalidatedElsewhere } from '@/utils/publicCmsCachedData'

/**
 * Applies admin saves made in another tab. The admin's "view on web" links open new tabs, so a
 * public tab opened earlier would otherwise keep showing the old content until the client cache TTL
 * ran out: the notice expires this tab's cached public reads and refetches those on screen in place.
 */
export default defineNuxtPlugin({
  name: 'public-cms-cache-sync',
  setup(nuxtApp) {
    onPublicCmsCacheInvalidatedElsewhere(() => {
      const keys = Object.keys(nuxtApp._asyncData).filter(isPublicCmsAsyncDataKey)

      // The hook `refreshNuxtData` calls, on the captured app: `refreshNuxtData` looks the app up
      // again after an await, where a channel listener has no Nuxt context, and fails silently.
      if (keys.length > 0) {
        void nuxtApp.hooks.callHookParallel('app:data:refresh', keys)
      }
    })
  },
})
