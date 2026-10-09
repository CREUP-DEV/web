import type { Ref } from 'vue'
import { useEventListener } from '@vueuse/core'

/** Longest wait for the images before printing anyway, so a broken one never blocks the dialog. */
const PRINT_IMAGE_WAIT_TIMEOUT_MS = 8000

/** Resolves once every image under `root` has loaded or failed, or after `timeoutMs`. */
function waitForImages(root: HTMLElement, timeoutMs: number) {
  const pendingImages = Array.from(root.querySelectorAll('img')).filter((image) => !image.complete)

  if (pendingImages.length === 0) {
    return Promise.resolve()
  }

  const allSettled = Promise.all(
    pendingImages.map(
      (image) =>
        new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true })
          image.addEventListener('error', () => resolve(), { once: true })
        })
    )
  )
  const timeout = new Promise<void>((resolve) => {
    setTimeout(resolve, timeoutMs)
  })

  return Promise.race([allSettled, timeout]).then(() => undefined)
}

/**
 * Printing the press kit is how its PDF is made. Images below the fold load lazily on screen, so
 * printing turns them eager first and, from the download button, waits for them before opening the
 * print dialog. `generatedAt` is the date the printed cover states.
 */
export function usePressKitPrint(root: Readonly<Ref<HTMLElement | null>>) {
  const imageLoading = ref<'lazy' | 'eager'>('lazy')
  const isPreparingPrint = ref(false)
  const generatedAt = ref(new Date())

  const prepareForPrint = () => {
    imageLoading.value = 'eager'
    generatedAt.value = new Date()
  }

  const printPressKit = async () => {
    if (isPreparingPrint.value) {
      return
    }

    isPreparingPrint.value = true

    try {
      prepareForPrint()
      await nextTick()

      if (root.value) {
        await waitForImages(root.value, PRINT_IMAGE_WAIT_TIMEOUT_MS)
      }

      window.print()
    } finally {
      isPreparingPrint.value = false
    }
  }

  // Printing from the browser menu skips the button. Chromium loads lazy images before printing on
  // its own; elsewhere this at least has them loaded for the next attempt.
  useEventListener('beforeprint', prepareForPrint)

  onMounted(() => {
    // Date the copy by the visitor's clock rather than the server render.
    generatedAt.value = new Date()
  })

  return {
    imageLoading,
    isPreparingPrint,
    generatedAt,
    printPressKit,
  }
}
