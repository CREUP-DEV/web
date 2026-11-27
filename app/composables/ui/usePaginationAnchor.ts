import type { Ref } from 'vue'

/**
 * Keeps the pagination controls where they are when the page changes.
 *
 * Paginated lists render items of uneven height, so a new page shifts everything below it and the
 * reader loses the controls they just clicked. Record where the pagination sits in the viewport
 * before the change and scroll by the same amount once the new items land, which pins it in place.
 *
 * Layout settles in several steps (the results container animates its height, images reserve their
 * boxes), so follow the changes with a ResizeObserver instead of correcting once. Following stops
 * after a short window: within it any body resize realigns, so scrolling by hand right after
 * clicking a page number is briefly overridden.
 */
const SETTLE_TIMEOUT_MS = 700

/**
 * The element that scrolls the anchor: the admin panel body it sits in (UDashboardGroup `admin-dashboard`: the admin layout never
 * scrolls the window), else the nearest ancestor that scrolls vertically on its own, else null for
 * the window (public pages). An `overflow-x: hidden` wrapper computes `overflow-y: auto` too, so a
 * generic ancestor only counts when its content overflows it.
 */
function getScrollContainer(el: HTMLElement): HTMLElement | null {
  const panelBody = el.closest<HTMLElement>('[id^="admin-dashboard-panel-"] > [data-slot="body"]')
  if (panelBody) return panelBody

  for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node)
    const scrollable = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay'
    if (scrollable && node.scrollHeight > node.clientHeight) {
      return node
    }
  }
  return null
}

export function usePaginationAnchor(page: Ref<number>, anchorRef: Ref<HTMLElement | null>) {
  if (import.meta.server) {
    return
  }

  let anchorTop: number | null = null
  let scroller: HTMLElement | null = null
  let observer: ResizeObserver | null = null
  let settleTimer: ReturnType<typeof setTimeout> | null = null

  const stopFollowing = () => {
    observer?.disconnect()
    observer = null

    if (settleTimer) {
      clearTimeout(settleTimer)
      settleTimer = null
    }

    anchorTop = null
  }

  const realign = () => {
    const el = anchorRef.value
    if (!el || anchorTop === null) {
      return
    }

    const delta = el.getBoundingClientRect().top - anchorTop
    if (Math.abs(delta) < 1) {
      return
    }

    ;(scroller ?? window).scrollBy({ top: delta, behavior: 'instant' })
  }

  watch(page, async () => {
    const el = anchorRef.value
    if (!el) {
      return
    }

    stopFollowing()
    anchorTop = el.getBoundingClientRect().top
    scroller = getScrollContainer(el)

    // A scroll container keeps its own height while its content grows, so watch what it holds.
    observer = new ResizeObserver(realign)
    for (const target of scroller ? Array.from(scroller.children) : [document.body]) {
      observer.observe(target)
    }

    settleTimer = setTimeout(() => {
      // A last correction before letting go, in case the observer missed the final frame.
      realign()
      stopFollowing()
    }, SETTLE_TIMEOUT_MS)

    // The observer only reports once the browser paints. Correct straight after the new items
    // render too, which covers the common case where both pages are the same height.
    await nextTick()
    realign()
  })

  onScopeDispose(stopFollowing)
}
