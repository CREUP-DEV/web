<script setup lang="ts">
/**
 * Corporate Identity Manual (MIC) page.
 * Displays brand assets (logo variants, corporate colors) with download links.
 */

const { t } = useI18n()
const toast = useToast()

useSeoMeta({
  title: () => t('mic.title'),
  description: () => t('mic.description'),
  ogTitle: () => t('mic.title'),
  ogDescription: () => t('mic.description'),
})

// ============================================================================
// Types
// ============================================================================

interface LogoVariant {
  key: string
  preview: string
  svg: string
  png: string
}

interface LogoSection {
  titleKey: string
  prefix: string
  zipUrl: string
  zipLabelKey: string
}

interface CorporateColor {
  nameKey: string
  hex: string
  rgb: string
  cmyk: string
  pantone: string
}

// ============================================================================
// Data
// ============================================================================

const colorKeys = ['granate', 'grisOscuro', 'grisClaro', 'azul', 'beige', 'blancoPuro'] as const

const BASE = 'https://www.creup.es/documentos/imagen/MIC'

/** Helper to build a full variant set for a logo section */
function buildVariants(prefix: string): LogoVariant[] {
  const variants: { slug: string; key: string }[] = [
    { slug: 'granate', key: 'granate' },
    { slug: 'gris-oscuro', key: 'grisOscuro' },
    { slug: 'gris-claro', key: 'grisClaro' },
    { slug: 'azul', key: 'azul' },
    { slug: 'beige', key: 'beige' },
    { slug: 'blanco', key: 'blancoPuro' },
  ]
  return variants.map((v) => ({
    key: v.key,
    preview: `${BASE}/${prefix}-${v.slug}-preview.jpg`,
    svg: `${BASE}/${prefix}-${v.slug}.svg`,
    png: `${BASE}/${prefix}-${v.slug}.png`,
  }))
}

const logoSections: LogoSection[] = [
  {
    titleKey: 'mic.logos.horizontalFull',
    prefix: 'horizontal-completo',
    zipUrl: `${BASE}/horizontal-completo.zip`,
    zipLabelKey: 'mic.logos.downloadAllHorizontalFull',
  },
  {
    titleKey: 'mic.logos.horizontalShort',
    prefix: 'horizontal-corto',
    zipUrl: `${BASE}/horizontal-corto.zip`,
    zipLabelKey: 'mic.logos.downloadAllHorizontalShort',
  },
  {
    titleKey: 'mic.logos.vertical',
    prefix: 'vertical',
    zipUrl: `${BASE}/vertical.zip`,
    zipLabelKey: 'mic.logos.downloadAllVertical',
  },
]

const corporateColors: CorporateColor[] = [
  {
    nameKey: 'mic.colors.burgundy',
    hex: '#792225',
    rgb: '121, 34, 37',
    cmyk: '0%, 72%, 69%, 53%',
    pantone: 'PANTONE 1815 C',
  },
  {
    nameKey: 'mic.colors.blue',
    hex: '#163866',
    rgb: '22, 56, 102',
    cmyk: '78%, 45%, 0%, 60%',
    pantone: 'PANTONE 534 C',
  },
  {
    nameKey: 'mic.colors.beige',
    hex: '#F5EEE6',
    rgb: '245, 238, 230',
    cmyk: '0%, 3%, 6%, 4%',
    pantone: 'PANTONE 663 C',
  },
  {
    nameKey: 'mic.colors.darkGray',
    hex: '#424242',
    rgb: '66, 66, 66',
    cmyk: '0%, 0%, 0%, 74%',
    pantone: 'PANTONE 4287 C',
  },
  {
    nameKey: 'mic.colors.lightGray',
    hex: '#A6A6A6',
    rgb: '166, 166, 166',
    cmyk: '0%, 0%, 0%, 35%',
    pantone: 'PANTONE Cool Gray 6 C',
  },
]

// ============================================================================
// Clipboard helper
// ============================================================================

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({
      title: t('mic.copied', { value: text }),
      color: 'success',
      icon: 'i-tabler-clipboard-check',
    })
  } catch {
    // Silently ignore clipboard errors (e.g. permission denied)
  }
}
</script>

<template>
  <UContainer class="py-12">
    <article class="mx-auto max-w-5xl space-y-12">
      <!-- Page title -->
      <header class="text-center">
        <h1 class="text-3xl font-bold sm:text-4xl">
          {{ t('mic.title') }}
        </h1>
        <p class="text-muted mt-2 text-lg">
          {{ t('mic.description') }}
        </p>
      </header>

      <!-- Introduction -->
      <section aria-labelledby="mic-intro">
        <h2 id="mic-intro" class="text-2xl font-semibold">
          {{ t('mic.introTitle') }}
        </h2>
        <div class="text-muted mt-3 space-y-3 text-base leading-relaxed">
          <p>{{ t('mic.introParagraph1') }}</p>
          <p>{{ t('mic.introParagraph2') }}</p>
          <p>{{ t('mic.introParagraph3') }}</p>
        </div>
      </section>

      <!-- Logo download section -->
      <section aria-labelledby="mic-logos">
        <h2 id="mic-logos" class="text-2xl font-semibold">
          {{ t('mic.logosTitle') }}
        </h2>
        <p class="text-muted mt-2 text-base leading-relaxed">
          {{ t('mic.logosDescription') }}
          <strong>{{ t('mic.logosWarning') }}</strong>
        </p>

        <!-- Logo variant tables -->
        <div v-for="section in logoSections" :key="section.prefix" class="mt-8 space-y-4">
          <h3 class="text-xl font-medium">
            {{ t(section.titleKey) }}
          </h3>

          <!-- Desktop: table layout -->
          <div class="hidden overflow-x-auto lg:block">
            <table class="w-full min-w-200 table-fixed text-sm">
              <thead>
                <tr class="border-default border-b">
                  <th
                    v-for="colorKey in colorKeys"
                    :key="colorKey"
                    class="text-muted px-2 py-2 text-center font-medium"
                  >
                    {{ t(`mic.variants.${colorKey}`) }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <!-- Preview row -->
                <tr class="border-default border-b">
                  <td
                    v-for="variant in buildVariants(section.prefix)"
                    :key="`preview-${variant.key}`"
                    class="px-2 py-3 text-center"
                  >
                    <img
                      :src="variant.preview"
                      :alt="t(`mic.logoAlt`, { version: t(`mic.variants.${variant.key}`) })"
                      class="mx-auto h-auto max-h-20 w-auto max-w-full rounded"
                      loading="lazy"
                    />
                  </td>
                </tr>
                <!-- SVG download row -->
                <tr class="border-default border-b">
                  <td
                    v-for="variant in buildVariants(section.prefix)"
                    :key="`svg-${variant.key}`"
                    class="px-2 py-2 text-center"
                  >
                    <UButton
                      :to="variant.svg"
                      variant="link"
                      size="xs"
                      icon="i-tabler-download"
                      download
                      target="_blank"
                      :label="t('mic.downloadSvg')"
                    />
                  </td>
                </tr>
                <!-- PNG download row -->
                <tr>
                  <td
                    v-for="variant in buildVariants(section.prefix)"
                    :key="`png-${variant.key}`"
                    class="px-2 py-2 text-center"
                  >
                    <UButton
                      :to="variant.png"
                      variant="link"
                      size="xs"
                      icon="i-tabler-download"
                      download
                      target="_blank"
                      :label="t('mic.downloadPng')"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile: card grid -->
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:hidden">
            <div
              v-for="variant in buildVariants(section.prefix)"
              :key="`card-${variant.key}`"
              class="bg-elevated border-default flex flex-col items-center gap-2 rounded-lg border p-3"
            >
              <span class="text-muted text-xs font-medium">
                {{ t(`mic.variants.${variant.key}`) }}
              </span>
              <img
                :src="variant.preview"
                :alt="t(`mic.logoAlt`, { version: t(`mic.variants.${variant.key}`) })"
                class="h-auto max-h-16 w-auto max-w-full rounded"
                loading="lazy"
              />
              <div class="flex gap-1">
                <UButton
                  :to="variant.svg"
                  variant="soft"
                  size="xs"
                  icon="i-tabler-download"
                  download
                  target="_blank"
                  label="SVG"
                />
                <UButton
                  :to="variant.png"
                  variant="soft"
                  size="xs"
                  icon="i-tabler-download"
                  download
                  target="_blank"
                  label="PNG"
                />
              </div>
            </div>
          </div>

          <!-- ZIP download -->
          <div class="flex justify-center">
            <UButton
              :to="section.zipUrl"
              variant="soft"
              icon="i-tabler-file-zip"
              download
              target="_blank"
              :label="t(section.zipLabelKey)"
            />
          </div>
        </div>
      </section>

      <!-- Corporate colors -->
      <section aria-labelledby="mic-colors">
        <h2 id="mic-colors" class="text-2xl font-semibold">
          {{ t('mic.colorsTitle') }}
        </h2>
        <p class="text-muted mt-2 text-base">
          {{ t('mic.colorsDescription') }}
        </p>

        <!-- Desktop: color table -->
        <div class="mt-6 hidden overflow-x-auto md:block">
          <table class="w-full min-w-175 text-sm">
            <thead>
              <tr class="border-default border-b">
                <th class="text-muted px-3 py-2 text-left font-medium">
                  {{ t('mic.colorsTable.color') }}
                </th>
                <th class="text-muted px-3 py-2 text-left font-medium">
                  {{ t('mic.colorsTable.preview') }}
                </th>
                <th class="text-muted px-3 py-2 text-left font-medium">HEX</th>
                <th class="text-muted px-3 py-2 text-left font-medium">RGB</th>
                <th class="text-muted px-3 py-2 text-left font-medium">CMYK</th>
                <th class="text-muted px-3 py-2 text-left font-medium">PANTONE</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="color in corporateColors" :key="color.hex" class="border-default border-b">
                <td class="px-3 py-2 font-medium">
                  {{ t(color.nameKey) }}
                </td>
                <td class="px-3 py-2">
                  <div
                    class="border-default size-8 rounded border"
                    :style="{ backgroundColor: color.hex }"
                    role="img"
                    :aria-label="t(color.nameKey)"
                  />
                </td>
                <td class="px-3 py-2">
                  <UButton
                    variant="ghost"
                    size="xs"
                    :label="color.hex"
                    @click="copyToClipboard(color.hex)"
                  />
                </td>
                <td class="px-3 py-2">
                  <UButton
                    variant="ghost"
                    size="xs"
                    :label="color.rgb"
                    @click="copyToClipboard(color.rgb)"
                  />
                </td>
                <td class="px-3 py-2">
                  <UButton
                    variant="ghost"
                    size="xs"
                    :label="color.cmyk"
                    @click="copyToClipboard(color.cmyk)"
                  />
                </td>
                <td class="px-3 py-2">
                  <UButton
                    variant="ghost"
                    size="xs"
                    :label="color.pantone"
                    @click="copyToClipboard(color.pantone)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile: color cards -->
        <div class="mt-6 grid gap-3 md:hidden">
          <div
            v-for="color in corporateColors"
            :key="`card-${color.hex}`"
            class="bg-elevated border-default rounded-lg border p-4"
          >
            <div class="flex items-center gap-3">
              <div
                class="border-default size-10 shrink-0 rounded border"
                :style="{ backgroundColor: color.hex }"
                role="img"
                :aria-label="t(color.nameKey)"
              />
              <span class="text-base font-medium">{{ t(color.nameKey) }}</span>
            </div>
            <dl class="text-muted mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt class="font-medium">HEX</dt>
              <dd>
                <UButton
                  variant="ghost"
                  size="xs"
                  :label="color.hex"
                  @click="copyToClipboard(color.hex)"
                />
              </dd>
              <dt class="font-medium">RGB</dt>
              <dd>
                <UButton
                  variant="ghost"
                  size="xs"
                  :label="color.rgb"
                  @click="copyToClipboard(color.rgb)"
                />
              </dd>
              <dt class="font-medium">CMYK</dt>
              <dd>
                <UButton
                  variant="ghost"
                  size="xs"
                  :label="color.cmyk"
                  @click="copyToClipboard(color.cmyk)"
                />
              </dd>
              <dt class="font-medium">PANTONE</dt>
              <dd>
                <UButton
                  variant="ghost"
                  size="xs"
                  :label="color.pantone"
                  @click="copyToClipboard(color.pantone)"
                />
              </dd>
            </dl>
          </div>
        </div>
      </section>

      <!-- Download full manual -->
      <section aria-labelledby="mic-download" class="text-center">
        <h2 id="mic-download" class="text-2xl font-semibold">
          {{ t('mic.downloadTitle') }}
        </h2>
        <p class="text-muted mt-2 text-base">
          {{ t('mic.downloadDescription') }}
        </p>
        <div class="mt-6">
          <UButton
            to="https://www.creup.es/documentos/MIC.pdf"
            size="lg"
            icon="i-tabler-file-type-pdf"
            download
            target="_blank"
            :label="t('mic.downloadButton')"
          />
        </div>
      </section>
    </article>
  </UContainer>
</template>
