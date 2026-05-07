export interface MicLogoVariant {
  key: string
  slug: string
  labelKey: string
}

export interface MicLogoSection {
  titleKey: string
  slug: string
  zip: string
  zipLabelKey: string
}

export interface MicManifest {
  basePath: string
  logoVariants: MicLogoVariant[]
  logoSections: MicLogoSection[]
  pdf: string
}

export const MIC_MANIFEST_PATH = '/marca/manifest.json'

export const DEFAULT_MIC_MANIFEST: MicManifest = {
  basePath: '/marca',
  logoVariants: [
    { key: 'granate', slug: 'granate', labelKey: 'mic.variants.granate' },
    { key: 'grisOscuro', slug: 'gris-oscuro', labelKey: 'mic.variants.grisOscuro' },
    { key: 'grisClaro', slug: 'gris-claro', labelKey: 'mic.variants.grisClaro' },
    { key: 'azul', slug: 'azul', labelKey: 'mic.variants.azul' },
    { key: 'beige', slug: 'beige', labelKey: 'mic.variants.beige' },
    { key: 'blancoPuro', slug: 'blanco', labelKey: 'mic.variants.blancoPuro' },
  ],
  logoSections: [
    {
      titleKey: 'mic.logos.horizontalFull',
      slug: 'horizontal-completo',
      zip: 'horizontal-completo.zip',
      zipLabelKey: 'mic.logos.downloadAllHorizontalFull',
    },
    {
      titleKey: 'mic.logos.horizontalShort',
      slug: 'horizontal-corto',
      zip: 'horizontal-corto.zip',
      zipLabelKey: 'mic.logos.downloadAllHorizontalShort',
    },
    {
      titleKey: 'mic.logos.vertical',
      slug: 'vertical',
      zip: 'vertical.zip',
      zipLabelKey: 'mic.logos.downloadAllVertical',
    },
  ],
  pdf: 'MIC.pdf',
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

function isMicLogoVariant(value: unknown): value is MicLogoVariant {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    isNonEmptyString(candidate.key) &&
    isNonEmptyString(candidate.slug) &&
    isNonEmptyString(candidate.labelKey)
  )
}

function isMicLogoSection(value: unknown): value is MicLogoSection {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    isNonEmptyString(candidate.titleKey) &&
    isNonEmptyString(candidate.slug) &&
    isNonEmptyString(candidate.zip) &&
    isNonEmptyString(candidate.zipLabelKey)
  )
}

function isMicManifest(value: unknown): value is MicManifest {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    isNonEmptyString(candidate.basePath) &&
    isNonEmptyString(candidate.pdf) &&
    Array.isArray(candidate.logoVariants) &&
    candidate.logoVariants.length > 0 &&
    candidate.logoVariants.every(isMicLogoVariant) &&
    Array.isArray(candidate.logoSections) &&
    candidate.logoSections.length > 0 &&
    candidate.logoSections.every(isMicLogoSection)
  )
}

export function useMicManifest() {
  return useAsyncData<MicManifest>(
    'mic-manifest',
    async () => {
      try {
        const manifest = await $fetch<unknown>(MIC_MANIFEST_PATH)
        return isMicManifest(manifest) ? manifest : DEFAULT_MIC_MANIFEST
      } catch {
        return DEFAULT_MIC_MANIFEST
      }
    },
    {
      default: () => DEFAULT_MIC_MANIFEST,
    }
  )
}
