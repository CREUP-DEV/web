import type { ComponentPublicInstance } from 'vue'

export type ObservableElement = HTMLElement | SVGElement
export type ObservableComponent = ComponentPublicInstance & { $el: unknown }
export type ObservableTarget = ObservableElement | ObservableComponent | null

interface EntranceObserverOptions {
  animateVisibleOnMount?: boolean
  threshold?: number
}

export function resolveObservableElement(target: ObservableTarget): ObservableElement | null {
  if (target instanceof HTMLElement || target instanceof SVGElement) {
    return target
  }

  if (target && typeof target === 'object' && '$el' in target) {
    const componentEl = (target as ObservableComponent).$el

    return componentEl instanceof HTMLElement || componentEl instanceof SVGElement
      ? componentEl
      : null
  }

  return null
}

// ---------------------------------------------------------------------------
// Shared IntersectionObserver pool — one observer per threshold value.
// Ref-counted: the observer is created on first use and disconnected when the
// last element unobserves, so the pool never leaks idle observers.
// ---------------------------------------------------------------------------
type IOCallback = (isIntersecting: boolean) => void

const _observers = new Map<number, IntersectionObserver>()
const _refCounts = new Map<number, number>()
const _callbacks = new WeakMap<Element, IOCallback>()

function getSharedObserver(threshold: number): IntersectionObserver {
  const existing = _observers.get(threshold)
  if (existing) return existing

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        _callbacks.get(entry.target)?.(entry.isIntersecting)
      }
    },
    { threshold }
  )

  _observers.set(threshold, observer)
  return observer
}

function observeElement(el: Element, threshold: number, callback: IOCallback) {
  _callbacks.set(el, callback)
  _refCounts.set(threshold, (_refCounts.get(threshold) ?? 0) + 1)
  getSharedObserver(threshold).observe(el)
}

function unobserveElement(el: Element, threshold: number) {
  const observer = _observers.get(threshold)
  if (observer) {
    observer.unobserve(el)
  }
  _callbacks.delete(el)

  const count = (_refCounts.get(threshold) ?? 1) - 1
  if (count <= 0) {
    observer?.disconnect()
    _observers.delete(threshold)
    _refCounts.delete(threshold)
  } else {
    _refCounts.set(threshold, count)
  }
}

// ---------------------------------------------------------------------------

export function useEntranceObserver(options: number | EntranceObserverOptions = 0.1) {
  const threshold = typeof options === 'number' ? options : (options.threshold ?? 0.1)
  const animateVisibleOnMount =
    typeof options === 'number' ? false : (options.animateVisibleOnMount ?? false)
  const elRef = shallowRef<ObservableTarget>(null)
  const isVisible = ref(false)
  const isPending = ref(false)
  const shouldAnimate = ref(false)
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  let observedEl: ObservableElement | null = null

  onMounted(() => {
    if (prefersReducedMotion.value) {
      isVisible.value = true
      return
    }

    const el = resolveObservableElement(elRef.value)

    if (!el) {
      isVisible.value = true
      return
    }

    const rect = el.getBoundingClientRect()
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight
    const isInViewport = rect.top < viewportHeight && rect.bottom > 0

    if (isInViewport && !animateVisibleOnMount) {
      isVisible.value = true
      return
    }

    shouldAnimate.value = true
    isPending.value = true

    if (isInViewport) {
      requestAnimationFrame(() => {
        isVisible.value = true
      })
      return
    }

    observedEl = el
    observeElement(el, threshold, (isIntersecting) => {
      if (!isIntersecting) return
      isVisible.value = true
      if (observedEl) {
        unobserveElement(observedEl, threshold)
        observedEl = null
      }
    })
  })

  watch(prefersReducedMotion, (reduced) => {
    if (reduced) {
      shouldAnimate.value = false
      isPending.value = false
      isVisible.value = true
      if (observedEl) {
        unobserveElement(observedEl, threshold)
        observedEl = null
      }
    }
  })

  watch(isVisible, (visible) => {
    if (visible) {
      isPending.value = false
    }
  })

  onBeforeUnmount(() => {
    if (observedEl) {
      unobserveElement(observedEl, threshold)
      observedEl = null
    }
  })

  // Convenience computed / method so consumers never touch the free functions
  // directly. Using `shouldAnimate`, `isVisible`, `isPending` from this scope.
  const animClasses = computed(() =>
    entranceClasses(shouldAnimate.value, isVisible.value, isPending.value)
  )

  function animStyle(index: number, step = 80) {
    return entranceStyle(shouldAnimate.value, isVisible.value, index, step)
  }

  return { elRef, isVisible, isPending, shouldAnimate, animClasses, animStyle }
}

export function getEntranceDelayStyle(index: number, step = 80) {
  return {
    '--entrance-delay': `${index * step}ms`,
  }
}

// Both free functions share the same argument order:
//   (shouldAnimate, isVisible, ...)
// so callers never have to remember which comes first.

export function entranceClasses(shouldAnimate: boolean, isVisible: boolean, isPending: boolean) {
  if (!shouldAnimate) return undefined
  if (isVisible) return 'animate-fade-slide-up'
  if (isPending) return 'opacity-0'
  return undefined
}

export function entranceStyle(
  shouldAnimate: boolean,
  isVisible: boolean,
  index: number,
  step = 80
) {
  if (!isVisible || !shouldAnimate) return undefined
  return getEntranceDelayStyle(index, step)
}
