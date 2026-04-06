import type { ComponentPublicInstance } from 'vue'
import type { ObservableTarget } from './useEntranceObserver'
import { resolveObservableElement } from './useEntranceObserver'

interface VisibilityRegistryOptions {
  animateVisibleOnMount?: boolean
  threshold?: number
}

export function useVisibilityRegistry(options: number | VisibilityRegistryOptions = 0.1) {
  const threshold = typeof options === 'number' ? options : (options.threshold ?? 0.1)
  const animateVisibleOnMount =
    typeof options === 'number' ? false : (options.animateVisibleOnMount ?? false)

  const visibleIds = ref(new Set<string>())
  const pendingIds = ref(new Set<string>())
  const animatedIds = ref(new Set<string>())
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const elementsById = new Map<string, HTMLElement | SVGElement>()
  const idsByElement = new WeakMap<Element, string>()
  let observer: IntersectionObserver | null = null

  function cloneSet(source: Set<string>) {
    return new Set(source)
  }

  const resolveElement = resolveObservableElement

  function markVisible(id: string) {
    const next = cloneSet(visibleIds.value)
    next.add(id)
    visibleIds.value = next
  }

  function markPending(id: string) {
    const next = cloneSet(pendingIds.value)
    next.add(id)
    pendingIds.value = next
  }

  function clearPending(id: string) {
    if (!pendingIds.value.has(id)) {
      return
    }

    const next = cloneSet(pendingIds.value)
    next.delete(id)
    pendingIds.value = next
  }

  function markAnimated(id: string) {
    const next = cloneSet(animatedIds.value)
    next.add(id)
    animatedIds.value = next
  }

  function disconnectElement(id: string) {
    const previous = elementsById.get(id)
    if (!previous) {
      return
    }

    observer?.unobserve(previous)
    elementsById.delete(id)
  }

  function observeRegisteredElements() {
    if (!observer) {
      return
    }

    for (const element of elementsById.values()) {
      observer.observe(element)
    }
  }

  function createObserver() {
    observer?.disconnect()
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue
          }

          const id = idsByElement.get(entry.target)
          if (!id) {
            continue
          }

          markVisible(id)
          clearPending(id)
          observer?.unobserve(entry.target)
        }
      },
      { threshold }
    )

    observeRegisteredElements()
  }

  function setRef(id: string | number) {
    const key = String(id)

    return (target: Element | ComponentPublicInstance | null) => {
      disconnectElement(key)

      if (!import.meta.client) {
        markVisible(key)
        clearPending(key)
        return
      }

      const el = resolveElement(target as ObservableTarget)

      if (!el || prefersReducedMotion.value) {
        markVisible(key)
        clearPending(key)
        return
      }

      elementsById.set(key, el)
      idsByElement.set(el, key)

      const rect = el.getBoundingClientRect()
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight
      const isInViewport = rect.top < viewportHeight && rect.bottom > 0

      if (isInViewport) {
        if (animateVisibleOnMount) {
          markAnimated(key)
          markPending(key)
          observer?.observe(el)
        } else {
          markVisible(key)
          clearPending(key)
        }
        return
      }

      markAnimated(key)
      markPending(key)
      observer?.observe(el)
    }
  }

  onMounted(() => {
    if (prefersReducedMotion.value) {
      return
    }

    createObserver()
  })

  watch(prefersReducedMotion, (reduced) => {
    if (reduced) {
      observer?.disconnect()
      observer = null

      pendingIds.value = new Set()
      visibleIds.value = new Set([...visibleIds.value, ...animatedIds.value])
      return
    }

    if (import.meta.client) {
      createObserver()
    }
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
  })

  const isVisible = (id: string | number) => visibleIds.value.has(String(id))
  const isPending = (id: string | number) => pendingIds.value.has(String(id))
  const shouldAnimate = (id: string | number) => animatedIds.value.has(String(id))

  return { setRef, isVisible, isPending, shouldAnimate }
}
