import { extractPossibleDuplicate, type PossibleDuplicate } from '~~/shared/utils/possibleDuplicate'

/**
 * Create pages: hold a create the server refused as a possible duplicate (409 `possibleDuplicate`,
 * see `shared/utils/possibleDuplicate.ts`) while the editor decides, then hand it back flagged
 * `confirmDuplicate: true` for the resend. Pair with `AdminPossibleDuplicateModal`.
 */
export function useAdminPossibleDuplicate<TPayload extends Record<string, unknown>>() {
  const duplicate = ref<PossibleDuplicate | null>(null)
  const pendingPayload = shallowRef<TPayload | null>(null)

  const dismiss = () => {
    duplicate.value = null
    pendingPayload.value = null
  }

  const isOpen = computed({
    get: () => duplicate.value !== null,
    set: (open: boolean) => {
      if (!open) dismiss()
    },
  })

  /** True when `error` is the duplicate warning: the payload is held and the modal opens. */
  const hold = (error: unknown, payload: TPayload) => {
    const found = extractPossibleDuplicate(error)
    if (!found) return false

    duplicate.value = found
    pendingPayload.value = payload
    return true
  }

  /** The held payload marked as confirmed, closing the warning; `null` when nothing is held. */
  const confirm = (): (TPayload & { confirmDuplicate: true }) | null => {
    const payload = pendingPayload.value
    dismiss()
    return payload ? { ...payload, confirmDuplicate: true } : null
  }

  return { duplicate, isOpen, hold, confirm, dismiss }
}
