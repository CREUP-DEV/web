export function useCountUp(target: Ref<number> | number, options?: { duration?: number }) {
  const duration = options?.duration ?? 1800
  const displayValue = ref(0)
  const hasAnimated = ref(false)

  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  function start() {
    if (hasAnimated.value) return
    hasAnimated.value = true

    const end = toValue(target)

    if (prefersReducedMotion.value || duration <= 0) {
      displayValue.value = end
      return
    }

    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      displayValue.value = Math.round(eased * end)

      if (progress < 1) {
        requestAnimationFrame(tick)
      } else {
        displayValue.value = end
      }
    }

    requestAnimationFrame(tick)
  }

  return { displayValue, start, hasAnimated }
}
