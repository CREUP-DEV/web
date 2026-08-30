import { toAbsoluteUrl } from '~~/shared/utils/url'

/** Anything shareable: only the title is used, for the share text and the mail subject. */
type ShareableContent = {
  title: string
}

export type PressShareAction = {
  key: string
  label: string
  icon: string
  class?: string
  to?: string
  onClick?: () => void | Promise<void>
}

export function usePressShareActions(content: MaybeRef<ShareableContent>) {
  const { t } = useI18n()
  const toast = useToast()
  const route = useRoute()
  const siteUrl = useRuntimeSiteUrl()
  const canNativeShare = ref(false)

  onMounted(() => {
    canNativeShare.value = typeof navigator.share === 'function'
  })

  const canonicalUrl = computed(() => toAbsoluteUrl(route.path, siteUrl.value) ?? route.path)

  const shareText = computed(() => unref(content).title)
  const twitterShareUrl = computed(
    () =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(canonicalUrl.value)}&text=${encodeURIComponent(shareText.value)}`
  )
  const linkedinShareUrl = computed(
    () =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl.value)}`
  )
  const facebookShareUrl = computed(
    () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl.value)}`
  )
  const telegramShareUrl = computed(
    () =>
      `https://t.me/share/url?url=${encodeURIComponent(canonicalUrl.value)}&text=${encodeURIComponent(shareText.value)}`
  )
  const whatsappShareUrl = computed(
    () => `https://wa.me/?text=${encodeURIComponent(`${shareText.value} ${canonicalUrl.value}`)}`
  )
  const emailShareUrl = computed(
    () =>
      `mailto:?subject=${encodeURIComponent(shareText.value)}&body=${encodeURIComponent(`${shareText.value}\n\n${canonicalUrl.value}`)}`
  )

  const shareNative = async () => {
    if (!import.meta.client || !navigator.share) return
    try {
      await navigator.share({
        title: shareText.value,
        text: shareText.value,
        url: canonicalUrl.value,
      })
    } catch {
      // User cancelled share dialog
    }
  }

  const copyLink = async () => {
    if (!import.meta.client || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(canonicalUrl.value)
      toast.add({
        title: t('press.copy.success'),
        color: 'success',
      })
    } catch {
      toast.add({
        title: t('press.copy.error'),
        color: 'error',
      })
    }
  }

  const printPage = () => {
    if (!import.meta.client) return
    window.print()
  }

  const shareActions = computed<PressShareAction[]>(() => {
    const actions: PressShareAction[] = [
      {
        key: 'copy',
        label: t('press.shareActions.copy'),
        icon: 'i-tabler-link',
        onClick: copyLink,
      },
      {
        key: 'whatsapp',
        label: t('press.shareActions.whatsapp'),
        icon: 'i-tabler-brand-whatsapp',
        to: whatsappShareUrl.value,
      },
      {
        key: 'x',
        label: t('press.shareActions.x'),
        icon: 'i-tabler-brand-x',
        to: twitterShareUrl.value,
      },
      {
        key: 'linkedin',
        label: t('press.shareActions.linkedin'),
        icon: 'i-tabler-brand-linkedin',
        to: linkedinShareUrl.value,
      },
      {
        key: 'facebook',
        label: t('press.shareActions.facebook'),
        icon: 'i-tabler-brand-facebook',
        to: facebookShareUrl.value,
      },
      {
        key: 'telegram',
        label: t('press.shareActions.telegram'),
        icon: 'i-tabler-brand-telegram',
        to: telegramShareUrl.value,
      },
      {
        key: 'email',
        label: t('press.shareActions.email'),
        icon: 'i-tabler-mail',
        to: emailShareUrl.value,
      },
      {
        key: 'print',
        label: t('press.shareActions.print'),
        icon: 'i-tabler-printer',
        onClick: printPage,
      },
    ]

    if (canNativeShare.value) {
      actions.splice(2, 0, {
        key: 'share',
        label: t('press.shareActions.native'),
        icon: 'i-tabler-share',
        class: 'sm:hidden',
        onClick: shareNative,
      })
    }

    return actions
  })

  return {
    canonicalUrl,
    shareActions,
  }
}
