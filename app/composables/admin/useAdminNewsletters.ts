import { getApiErrorMessage } from '~~/shared/utils/apiError'

export interface Newsletter {
  id: string
  month: string
  monthKey: string
  coverImage: string | null
  pdfUrl: string
  publicVisible: boolean
  isSending: boolean
  sentAt: string | null
  createdAt: string
  updatedAt: string
  lastDeliverySentCount: number | null
  lastDeliveryTotal: number | null
  lastDeliveryErrorCount: number | null
}

interface NewsletterListResponse {
  data: Newsletter[]
  meta: {
    total: number
    maxDeliveryAttempts: number
  }
}

/** Aligns a newsletter row from API (POST/GET) with list `Newsletter` shape including `isSending`. */
export function toNewsletterListItem(raw: Record<string, unknown>): Newsletter {
  return {
    id: String(raw.id),
    monthKey: String(raw.monthKey),
    month: String(raw.month),
    coverImage: (raw.coverImage as string | null) ?? null,
    pdfUrl: String(raw.pdfUrl),
    publicVisible: Boolean(raw.publicVisible),
    isSending: Boolean(raw.isSending),
    sentAt: (raw.sentAt as string | null) ?? null,
    createdAt: String(raw.createdAt),
    updatedAt: String(raw.updatedAt),
    lastDeliverySentCount:
      raw.lastDeliverySentCount != null ? Number(raw.lastDeliverySentCount) : null,
    lastDeliveryTotal: raw.lastDeliveryTotal != null ? Number(raw.lastDeliveryTotal) : null,
    lastDeliveryErrorCount:
      raw.lastDeliveryErrorCount != null ? Number(raw.lastDeliveryErrorCount) : null,
  }
}

const sortNewsletters = (left: Newsletter, right: Newsletter) => {
  const rightMonth = new Date(right.month).getTime() || 0
  const leftMonth = new Date(left.month).getTime() || 0

  if (leftMonth !== rightMonth) {
    return rightMonth - leftMonth
  }

  return right.id.localeCompare(left.id, 'es')
}

/**
 * Data + send/cancel layer for the admin newsletter list: list fetch, the mutable collection,
 * the manual-send and cancel flows (state + handlers), and the polling timer that refreshes while
 * any newsletter is sending. The page keeps form/modal/submit/delete logic and reaches the
 * collection mutators through this composable's return.
 */
export function useAdminNewsletters() {
  const localeApiHeaders = useLocaleApiHeaders()
  const toast = useAdminToast()

  const {
    data,
    error: fetchError,
    pending,
    refresh,
  } = useFetch<NewsletterListResponse>('/api/admin/newsletter', {
    headers: localeApiHeaders,
    lazy: true,
  })

  const { items, prependItem, removeItem, replaceItem, updateItem, updateMeta } =
    useAdminMutableCollection(data, { sortItems: sortNewsletters })

  const maxDeliveryAttempts = computed(() => data.value?.meta.maxDeliveryAttempts ?? 3)

  const sendingItemId = ref<string | null>(null)
  const itemToManualSend = ref<Newsletter | null>(null)
  const showManualSendModal = ref(false)
  const itemToCancel = ref<Newsletter | null>(null)
  const showCancelModal = ref(false)
  const isCancelling = ref(false)

  let sendingRefreshTimer: ReturnType<typeof setInterval> | null = null

  function confirmManualSend(item: Newsletter) {
    itemToManualSend.value = item
    showManualSendModal.value = true
  }

  async function handleManualSend() {
    if (!itemToManualSend.value) return

    const item = itemToManualSend.value
    sendingItemId.value = item.id

    try {
      await $fetch(`/api/admin/newsletter/${item.id}/send`, { method: 'POST' })

      updateItem(item.id, (current) => ({ ...current, isSending: true }))
      await refresh()
      showManualSendModal.value = false
      itemToManualSend.value = null
      toast.add({ title: 'Envío iniciado', color: 'success' })
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, 'No se pudo enviar la newsletter'),
        color: 'error',
      })
    } finally {
      sendingItemId.value = null
    }
  }

  function confirmCancel(item: Newsletter) {
    itemToCancel.value = item
    showCancelModal.value = true
  }

  async function handleCancelSend() {
    if (!itemToCancel.value) return
    isCancelling.value = true
    try {
      await $fetch(`/api/admin/newsletter/${itemToCancel.value.id}/send`, { method: 'DELETE' })
      updateItem(itemToCancel.value.id, (current) => ({ ...current, isSending: false }))
      showCancelModal.value = false
      itemToCancel.value = null
      toast.add({ title: 'Envío cancelado', color: 'success' })
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, 'No se pudo cancelar el envío'),
        color: 'error',
      })
    } finally {
      isCancelling.value = false
    }
  }

  onMounted(() => {
    sendingRefreshTimer = setInterval(() => {
      if (items.value.some((item) => item.isSending)) {
        void refresh()
      }
    }, 10_000)
  })

  onBeforeUnmount(() => {
    if (sendingRefreshTimer) {
      clearInterval(sendingRefreshTimer)
      sendingRefreshTimer = null
    }
  })

  return {
    // list + collection
    data,
    fetchError,
    pending,
    refresh,
    items,
    prependItem,
    removeItem,
    replaceItem,
    updateItem,
    updateMeta,
    maxDeliveryAttempts,
    toNewsletterListItem,
    // manual send
    sendingItemId,
    itemToManualSend,
    showManualSendModal,
    confirmManualSend,
    handleManualSend,
    // cancel
    itemToCancel,
    showCancelModal,
    isCancelling,
    confirmCancel,
    handleCancelSend,
  }
}
