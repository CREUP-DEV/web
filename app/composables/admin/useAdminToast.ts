type ToastInput = Parameters<ReturnType<typeof useToast>['add']>[0]

const ICON_BY_COLOR: Record<string, string> = {
  success: 'i-tabler-circle-check',
  error: 'i-tabler-alert-circle',
  warning: 'i-tabler-alert-triangle',
  info: 'i-tabler-info-circle',
  primary: 'i-tabler-info-circle',
}

/**
 * Drop-in replacement for `useToast()` in the admin panel: `add()` auto-assigns an icon based on
 * the toast `color` so success/error toasts render with a visible colored icon (Nuxt UI shows the
 * color via the icon + progress bar). An explicit `icon` always wins.
 */
export function useAdminToast() {
  const toast = useToast()

  const add = (input: ToastInput) => {
    const defaultIcon = input.color ? ICON_BY_COLOR[input.color] : undefined
    const hasIcon = 'icon' in input
    return toast.add(!hasIcon && defaultIcon ? { ...input, icon: defaultIcon } : input)
  }

  return { ...toast, add }
}
