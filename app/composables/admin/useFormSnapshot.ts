export function useFormSnapshot(getSnapshot: () => string) {
  const initialSnapshot = ref<string | null>(null)

  const hasFormChanges = computed(() => {
    if (initialSnapshot.value === null) {
      return false
    }

    return getSnapshot() !== initialSnapshot.value
  })

  const resetFormSnapshot = () => {
    initialSnapshot.value = getSnapshot()
  }

  return {
    hasFormChanges,
    resetFormSnapshot,
  }
}
