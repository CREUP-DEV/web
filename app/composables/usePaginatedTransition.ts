import type { Ref } from 'vue'
import { useMediaQuery } from '@vueuse/core'

export function usePaginatedTransition<T>(
  pending: Ref<boolean>,
  items: Ref<T[]>,
  error: Ref<unknown>
) {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const resultsRef = ref<HTMLElement | null>(null)

  const isLoading = computed(() => pending.value && items.value.length === 0 && !error.value)
  const isRefreshing = computed(() => pending.value && items.value.length > 0)

  watch(items, async () => {
    const el = resultsRef.value
    if (!el || prefersReducedMotion.value) return

    const startHeight = el.offsetHeight
    await nextTick()

    el.style.height = 'auto'
    const endHeight = el.offsetHeight

    if (startHeight === endHeight) return

    el.style.overflow = 'hidden'
    el.style.height = `${startHeight}px`
    void el.offsetHeight

    el.style.transition = 'height 300ms ease-out'
    el.style.height = `${endHeight}px`

    let cleanupTimer: ReturnType<typeof setTimeout> | null = null

    const onEnd = (event?: TransitionEvent) => {
      if (event && (event.target !== el || event.propertyName !== 'height')) {
        return
      }

      if (cleanupTimer) {
        clearTimeout(cleanupTimer)
        cleanupTimer = null
      }

      el.style.height = ''
      el.style.overflow = ''
      el.style.transition = ''
      el.removeEventListener('transitionend', onEnd)
    }

    el.addEventListener('transitionend', onEnd)
    cleanupTimer = setTimeout(() => onEnd(), 350)
  })

  return { resultsRef, isLoading, isRefreshing }
}
