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

export function useEntranceObserver(options: number | EntranceObserverOptions = 0.1) {
  const threshold = typeof options === 'number' ? options : (options.threshold ?? 0.1)
  const animateVisibleOnMount =
    typeof options === 'number' ? false : (options.animateVisibleOnMount ?? false)
  const elRef = shallowRef<ObservableTarget>(null)
  const isVisible = ref(false)
  const isPending = ref(false)
  const shouldAnimate = ref(false)
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  let observer: IntersectionObserver | null = null

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

    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) {
          return
        }

        isVisible.value = true
        observer?.disconnect()
        observer = null
      },
      { threshold }
    )

    observer.observe(el)
  })

  watch(prefersReducedMotion, (reduced) => {
    if (reduced) {
      shouldAnimate.value = false
      isPending.value = false
      isVisible.value = true
      observer?.disconnect()
      observer = null
    }
  })

  watch(isVisible, (visible) => {
    if (visible) {
      isPending.value = false
    }
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
  })

  return { elRef, isVisible, isPending, shouldAnimate }
}

export function useEntranceDelay(index: number, step = 80) {
  return {
    '--entrance-delay': `${index * step}ms`,
  }
}

export function entranceClasses(shouldAnimate: boolean, isVisible: boolean, isPending: boolean) {
  if (!shouldAnimate) return undefined
  if (isVisible) return 'animate-fade-slide-up'
  if (isPending) return 'opacity-0'
  return undefined
}

export function entranceStyle(
  isVisible: boolean,
  shouldAnimate: boolean,
  index: number,
  step = 80
) {
  if (!isVisible || !shouldAnimate) return undefined
  return useEntranceDelay(index, step)
}
