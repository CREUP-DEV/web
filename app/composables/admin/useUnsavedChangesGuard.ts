/**
 * Asks before leaving a page whose form has unsaved changes: a confirm on in-app navigation and
 * the browser's own prompt on reload or tab close. Call it from the page's setup.
 */
export function useUnsavedChangesGuard(hasUnsavedChanges: () => boolean, message: () => string) {
  const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
    if (!hasUnsavedChanges()) return

    event.preventDefault()
    event.returnValue = ''
  }

  onMounted(() => window.addEventListener('beforeunload', beforeUnloadHandler))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnloadHandler))

  onBeforeRouteLeave(() => !hasUnsavedChanges() || window.confirm(message()))
}
