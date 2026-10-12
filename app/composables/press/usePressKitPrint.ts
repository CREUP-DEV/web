import { useEventListener } from '@vueuse/core'

/**
 * Printing the page from the browser's own menu still gives a dossier, through the print styles
 * of `/prensa/dossier`. Images below the fold load lazily on screen, so printing turns them eager
 * first; Chromium loads lazy images before printing on its own, and elsewhere this at least has
 * them loaded for the next attempt. `generatedAt` is the date the printed cover states.
 */
export function usePressKitPrint() {
  const imageLoading = ref<'lazy' | 'eager'>('lazy')
  const generatedAt = ref(new Date())

  useEventListener('beforeprint', () => {
    imageLoading.value = 'eager'
    generatedAt.value = new Date()
  })

  onMounted(() => {
    // Date the copy by the visitor's clock rather than the server render.
    generatedAt.value = new Date()
  })

  return { imageLoading, generatedAt }
}
