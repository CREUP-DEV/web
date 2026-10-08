import type { MaybeRefOrGetter } from 'vue'

interface UsePublicDetailCanonicalOptions {
  /** Unlocalized path the page was requested under, e.g. `/prensa/comunicados/<route slug>`. */
  requestedPath: string
  /** Unlocalized path the content lives at now (its current section and slug). */
  canonicalPath: MaybeRefOrGetter<string>
  translatedLocales: MaybeRefOrGetter<string[] | null | undefined>
}

/**
 * One URL per press article and activity entry. The detail APIs also answer a former slug (titles
 * drive slugs) and a press slug under another type's section, so the page sends both to the
 * current URL with a 301 — crawlers move the old URL's ranking over — and points the hreflang
 * alternates at it.
 *
 * Returns the pending navigation when the request was not canonical; the page must `await` it so
 * the server answers with the redirect instead of rendering.
 */
export function usePublicDetailCanonical(options: UsePublicDetailCanonicalOptions) {
  const localePath = useLocalePath()
  const canonicalPath = computed(() => toValue(options.canonicalPath))

  if (options.requestedPath !== canonicalPath.value) {
    return navigateTo(localePath(canonicalPath.value), { redirectCode: 301, replace: true })
  }

  useLocalizedPressDetailSeo({
    path: canonicalPath,
    translatedLocales: computed(() => toValue(options.translatedLocales) ?? null),
  })

  return null
}
