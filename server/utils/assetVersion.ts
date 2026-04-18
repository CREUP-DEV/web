function normalizeAssetVersion(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null
  }

  const date = value instanceof Date ? value : new Date(value)
  const timestamp = date.getTime()

  if (!Number.isFinite(timestamp)) {
    return null
  }

  return String(timestamp)
}

export function appendAssetVersion(
  url: string | null | undefined,
  updatedAt: Date | string | null | undefined
) {
  if (!url) {
    return null
  }

  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url
  }

  const version = normalizeAssetVersion(updatedAt)
  if (!version) {
    return url
  }

  try {
    const parsed = new URL(url, 'http://internal.local')
    parsed.searchParams.set('v', version)

    if (/^https?:\/\//i.test(url)) {
      return parsed.toString()
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}v=${encodeURIComponent(version)}`
  }
}
