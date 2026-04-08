import { z } from 'zod'

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

export const MIC_MANIFEST_PATH = '/documentos/imagen/MIC/manifest.json'

const micLogoVariantSchema = z.object({
  key: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  labelKey: z.string().trim().min(1),
})

const micLogoSectionSchema = z.object({
  titleKey: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  zip: z.string().trim().min(1),
  zipLabelKey: z.string().trim().min(1),
})

const micManifestSchema = z.object({
  basePath: z.string().trim().min(1),
  logoVariants: z.array(micLogoVariantSchema).min(1),
  logoSections: z.array(micLogoSectionSchema).min(1),
  pdf: z.string().trim().min(1),
})

export const DEFAULT_MIC_MANIFEST: MicManifest = {
  basePath: '/documentos/imagen/MIC',
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

export function useMicManifest() {
  return useAsyncData<MicManifest>(
    'mic-manifest',
    async () => {
      try {
        const manifest = await $fetch<unknown>(MIC_MANIFEST_PATH)
        return micManifestSchema.parse(manifest)
      } catch {
        return DEFAULT_MIC_MANIFEST
      }
    },
    {
      default: () => DEFAULT_MIC_MANIFEST,
    }
  )
}
