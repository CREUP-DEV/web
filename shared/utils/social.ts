export const supportedSocialNetworks = [
  'website',
  'email',
  'instagram',
  'twitter',
  'tiktok',
  'bluesky',
  'linkedin',
  'telegram',
  'discord',
  'facebook',
  'github',
] as const

export type SupportedSocialNetwork = (typeof supportedSocialNetworks)[number]
export type SocialButtonNetwork = Exclude<SupportedSocialNetwork, 'website' | 'email'>

export interface SocialNetworkEntry {
  network: SupportedSocialNetwork
  value: string
}

export interface RawSocialNetworkEntry {
  network?: string | null
  value?: string | null
}

export const socialNetworkIcons: Record<SupportedSocialNetwork, string> = {
  website: 'i-tabler-world',
  email: 'i-tabler-mail',
  instagram: 'i-tabler-brand-instagram',
  twitter: 'i-tabler-brand-x',
  tiktok: 'i-tabler-brand-tiktok',
  bluesky: 'i-tabler-brand-bluesky',
  linkedin: 'i-tabler-brand-linkedin',
  telegram: 'i-tabler-brand-telegram',
  discord: 'i-tabler-brand-discord',
  facebook: 'i-tabler-brand-facebook',
  github: 'i-tabler-brand-github',
}

const socialNetworkAliasMap: Record<string, SupportedSocialNetwork> = {
  website: 'website',
  webpage: 'website',
  web: 'website',
  sitioweb: 'website',
  paginaweb: 'website',

  email: 'email',
  mail: 'email',
  correo: 'email',
  correoelectronico: 'email',

  instagram: 'instagram',

  twitter: 'twitter',
  x: 'twitter',
  twitterx: 'twitter',

  tiktok: 'tiktok',

  bluesky: 'bluesky',

  linkedin: 'linkedin',

  telegram: 'telegram',

  discord: 'discord',

  facebook: 'facebook',

  github: 'github',
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value)

const cleanHandle = (value: string) => value.trim().replace(/^@/, '')

const normalizeSocialKey = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '')
}

export function normalizeSocialText(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeSocialNetwork(network: string): SupportedSocialNetwork | null {
  const normalized = normalizeSocialKey(network)
  if (socialNetworkAliasMap[normalized]) {
    return socialNetworkAliasMap[normalized]
  }

  if (normalized.includes('correo') || normalized.includes('email')) {
    return 'email'
  }

  if (normalized.includes('web') || normalized.includes('pagina') || normalized.includes('sitio')) {
    return 'website'
  }

  return null
}

export function inferSocialNetwork(
  networkValue: string,
  value: string
): SupportedSocialNetwork | null {
  const inferred = normalizeSocialNetwork(networkValue)
  if (inferred) {
    return inferred
  }

  if (emailPattern.test(value)) {
    return 'email'
  }

  return null
}

export function collectSocialNetworks(
  entries: readonly RawSocialNetworkEntry[] | null | undefined
): SocialNetworkEntry[] {
  const socialMap = new Map<SupportedSocialNetwork, string>()

  for (const entry of entries ?? []) {
    const value = normalizeSocialText(entry.value)
    const network = inferSocialNetwork(normalizeSocialText(entry.network), value)

    if (!network || !value || socialMap.has(network)) {
      continue
    }

    socialMap.set(network, value)
  }

  return supportedSocialNetworks.flatMap((network) => {
    const value = socialMap.get(network)
    if (!value) {
      return []
    }

    return [{ network, value }]
  })
}

export function buildSocialUrl(network: SupportedSocialNetwork, rawValue: string) {
  const value = rawValue.trim()
  if (!value) {
    return null
  }

  if (network === 'email') {
    return value.startsWith('mailto:') ? value : `mailto:${value}`
  }

  if (isAbsoluteUrl(value)) {
    return value
  }

  switch (network) {
    case 'website':
      return `https://${value}`
    case 'instagram':
      return `https://instagram.com/${cleanHandle(value)}`
    case 'twitter':
      return `https://x.com/${cleanHandle(value)}`
    case 'tiktok':
      return `https://www.tiktok.com/@${cleanHandle(value)}`
    case 'bluesky':
      return `https://bsky.app/profile/${cleanHandle(value)}`
    case 'linkedin':
      return `https://www.linkedin.com/${value.replace(/^\/+/, '')}`
    case 'telegram':
      return `https://t.me/${cleanHandle(value)}`
    case 'discord':
      return `https://discord.gg/${cleanHandle(value)}`
    case 'facebook':
      return `https://facebook.com/${cleanHandle(value)}`
    case 'github':
      return `https://github.com/${cleanHandle(value)}`
    default:
      return null
  }
}

export function getSocialEntry(
  socialNetworks: readonly SocialNetworkEntry[],
  network: SupportedSocialNetwork
) {
  return socialNetworks.find((socialNetwork) => socialNetwork.network === network) ?? null
}

export function getWebsiteData(socialNetworks: readonly SocialNetworkEntry[]) {
  const website = getSocialEntry(socialNetworks, 'website')
  if (!website) {
    return null
  }

  const href = buildSocialUrl('website', website.value)
  if (!href) {
    return null
  }

  return {
    href,
    label: website.value.replace(/^https?:\/\//i, ''),
  }
}

export function getEmailData(socialNetworks: readonly SocialNetworkEntry[], fallbackEmail = '') {
  const email = getSocialEntry(socialNetworks, 'email')
  const value = email?.value || fallbackEmail

  if (!value.trim()) {
    return null
  }

  const href = buildSocialUrl('email', value)
  if (!href) {
    return null
  }

  return {
    href,
    email: value.replace(/^mailto:/i, '').trim(),
  }
}

export function getSocialButtons(socialNetworks: readonly SocialNetworkEntry[]) {
  return socialNetworks.flatMap((socialNetwork) => {
    if (socialNetwork.network === 'website' || socialNetwork.network === 'email') {
      return []
    }

    const href = buildSocialUrl(socialNetwork.network, socialNetwork.value)
    if (!href) {
      return []
    }

    return [{ network: socialNetwork.network, href }]
  })
}
