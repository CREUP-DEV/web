<script setup lang="ts">
import { DEFAULT_MIC_MANIFEST } from '@/composables/useMicManifest'

const { t } = useI18n()
const { copyToClipboard } = useCopyToClipboard()
const { data: micManifest } = await useMicManifest()

usePageSeo('mic.title', 'mic.description')

interface CorporateColor {
  nameKey: string
  hex: string
  rgb: string
  cmyk: string
  pantone: string
}

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

const micAssets = computed(() => micManifest.value ?? DEFAULT_MIC_MANIFEST)

const assetUrl = (path: string) => `${micAssets.value.basePath}/${path}`
const previewAssetUrl = (sectionSlug: string, variantSlug: string) =>
  assetUrl(`${sectionSlug}-${variantSlug}.png`)
const previewSurfaceStyle = (variantSlug: string) => ({
  backgroundColor: variantSlug === 'blanco' || variantSlug === 'beige' ? '#163866' : '#F5EEE6',
})

const {
  elRef: introRef,
  isVisible: introVisible,
  isPending: introPending,
  shouldAnimate: introShouldAnimate,
} = useEntranceObserver(0.15)
const {
  elRef: logosRef,
  isVisible: logosVisible,
  isPending: logosPending,
  shouldAnimate: logosShouldAnimate,
} = useEntranceObserver(0.1)
const {
  elRef: colorsRef,
  isVisible: colorsVisible,
  isPending: colorsPending,
  shouldAnimate: colorsShouldAnimate,
} = useEntranceObserver(0.1)
const {
  elRef: downloadRef,
  isVisible: downloadVisible,
  isPending: downloadPending,
  shouldAnimate: downloadShouldAnimate,
} = useEntranceObserver(0.1)
const copyColorToClipboard = (text: string) =>
  copyToClipboard(text, t('mic.copied', { value: text }))
</script>

<template>
  <UContainer class="py-12">
    <article class="mx-auto max-w-5xl space-y-12">
      <header class="text-center">
        <h1 class="text-3xl font-bold sm:text-4xl">
          {{ t('mic.title') }}
        </h1>
        <p class="text-muted mt-2 text-lg">
          {{ t('mic.description') }}
        </p>
      </header>

      <section
        ref="introRef"
        aria-labelledby="mic-intro"
        :class="entranceClasses(introShouldAnimate, introVisible, introPending)"
      >
        <h2 id="mic-intro" class="text-2xl font-semibold">
          {{ t('mic.introTitle') }}
        </h2>
        <div class="text-muted mt-3 space-y-3 text-base leading-relaxed">
          <p>{{ t('mic.introParagraph1') }}</p>
          <p>{{ t('mic.introParagraph2') }}</p>
          <p>{{ t('mic.introParagraph3') }}</p>
        </div>
      </section>

      <section
        ref="logosRef"
        aria-labelledby="mic-logos"
        :class="entranceClasses(logosShouldAnimate, logosVisible, logosPending)"
      >
        <h2 id="mic-logos" class="text-2xl font-semibold">
          {{ t('mic.logosTitle') }}
        </h2>
        <p class="text-muted mt-2 text-base leading-relaxed">
          {{ t('mic.logosDescription') }}
          <strong>{{ t('mic.logosWarning') }}</strong>
        </p>

        <div
          v-for="(section, index) in micAssets.logoSections"
          :key="section.slug"
          class="mt-8 space-y-4"
          :class="entranceClasses(logosShouldAnimate, logosVisible, logosPending)"
          :style="entranceStyle(logosVisible, logosShouldAnimate, index + 1)"
        >
          <h3 class="text-xl font-medium">
            {{ t(section.titleKey) }}
          </h3>

          <div class="hidden overflow-x-auto lg:block">
            <table class="w-full min-w-200 table-fixed text-sm">
              <thead>
                <tr class="border-default border-b">
                  <th
                    v-for="variant in micAssets.logoVariants"
                    :key="variant.key"
                    class="text-muted px-2 py-2 text-center font-medium"
                  >
                    {{ t(variant.labelKey) }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-default border-b">
                  <td
                    v-for="variant in micAssets.logoVariants"
                    :key="`preview-${variant.key}`"
                    class="px-2 py-3 text-center"
                  >
                    <div
                      class="border-default mx-auto flex min-h-24 max-w-48 items-center justify-center rounded-lg border p-4"
                      :style="previewSurfaceStyle(variant.slug)"
                    >
                      <NuxtImg
                        :src="previewAssetUrl(section.slug, variant.slug)"
                        :alt="t(`mic.logoAlt`, { version: t(variant.labelKey) })"
                        class="h-auto max-h-16 w-auto max-w-full"
                        width="320"
                        height="120"
                        sizes="(min-width: 1024px) 192px, 160px"
                        loading="lazy"
                      />
                    </div>
                  </td>
                </tr>
                <tr class="border-default border-b">
                  <td
                    v-for="variant in micAssets.logoVariants"
                    :key="`svg-${variant.key}`"
                    class="px-2 py-2 text-center"
                  >
                    <UButton
                      :href="assetUrl(`${section.slug}-${variant.slug}.svg`)"
                      external
                      variant="link"
                      size="xs"
                      icon="i-tabler-download"
                      download
                      target="_blank"
                      :label="t('mic.downloadSvg')"
                    />
                  </td>
                </tr>
                <tr>
                  <td
                    v-for="variant in micAssets.logoVariants"
                    :key="`png-${variant.key}`"
                    class="px-2 py-2 text-center"
                  >
                    <UButton
                      :href="assetUrl(`${section.slug}-${variant.slug}.png`)"
                      external
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

          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:hidden">
            <div
              v-for="variant in micAssets.logoVariants"
              :key="`card-${variant.key}`"
              class="bg-elevated border-default flex flex-col items-center gap-2 rounded-lg border p-3"
            >
              <span class="text-muted text-xs font-medium">
                {{ t(variant.labelKey) }}
              </span>
              <div
                class="border-default flex min-h-24 w-full items-center justify-center rounded-lg border p-4"
                :style="previewSurfaceStyle(variant.slug)"
              >
                <NuxtImg
                  :src="previewAssetUrl(section.slug, variant.slug)"
                  :alt="t(`mic.logoAlt`, { version: t(variant.labelKey) })"
                  class="h-auto max-h-14 w-auto max-w-full"
                  width="240"
                  height="96"
                  sizes="160px"
                  loading="lazy"
                />
              </div>
              <div class="flex gap-1">
                <UButton
                  :href="assetUrl(`${section.slug}-${variant.slug}.svg`)"
                  external
                  variant="soft"
                  size="xs"
                  icon="i-tabler-download"
                  download
                  target="_blank"
                  label="SVG"
                />
                <UButton
                  :href="assetUrl(`${section.slug}-${variant.slug}.png`)"
                  external
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

          <div class="flex justify-center">
            <UButton
              :href="assetUrl(section.zip)"
              external
              variant="soft"
              icon="i-tabler-file-zip"
              download
              target="_blank"
              :label="t(section.zipLabelKey)"
            />
          </div>
        </div>
      </section>

      <section
        ref="colorsRef"
        aria-labelledby="mic-colors"
        :class="entranceClasses(colorsShouldAnimate, colorsVisible, colorsPending)"
      >
        <h2 id="mic-colors" class="text-2xl font-semibold">
          {{ t('mic.colorsTitle') }}
        </h2>
        <p class="text-muted mt-2 text-base">
          {{ t('mic.colorsDescription') }}
        </p>

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
                    @click="copyColorToClipboard(color.hex)"
                  />
                </td>
                <td class="px-3 py-2">
                  <UButton
                    variant="ghost"
                    size="xs"
                    :label="color.rgb"
                    @click="copyColorToClipboard(color.rgb)"
                  />
                </td>
                <td class="px-3 py-2">
                  <UButton
                    variant="ghost"
                    size="xs"
                    :label="color.cmyk"
                    @click="copyColorToClipboard(color.cmyk)"
                  />
                </td>
                <td class="px-3 py-2">
                  <UButton
                    variant="ghost"
                    size="xs"
                    :label="color.pantone"
                    @click="copyColorToClipboard(color.pantone)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

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
                  @click="copyColorToClipboard(color.hex)"
                />
              </dd>
              <dt class="font-medium">RGB</dt>
              <dd>
                <UButton
                  variant="ghost"
                  size="xs"
                  :label="color.rgb"
                  @click="copyColorToClipboard(color.rgb)"
                />
              </dd>
              <dt class="font-medium">CMYK</dt>
              <dd>
                <UButton
                  variant="ghost"
                  size="xs"
                  :label="color.cmyk"
                  @click="copyColorToClipboard(color.cmyk)"
                />
              </dd>
              <dt class="font-medium">PANTONE</dt>
              <dd>
                <UButton
                  variant="ghost"
                  size="xs"
                  :label="color.pantone"
                  @click="copyColorToClipboard(color.pantone)"
                />
              </dd>
            </dl>
          </div>
        </div>
      </section>

      <section
        ref="downloadRef"
        aria-labelledby="mic-download"
        class="text-center"
        :class="entranceClasses(downloadShouldAnimate, downloadVisible, downloadPending)"
      >
        <h2 id="mic-download" class="text-2xl font-semibold">
          {{ t('mic.downloadTitle') }}
        </h2>
        <p class="text-muted mt-2 text-base">
          {{ t('mic.downloadDescription') }}
        </p>
        <div class="mt-6">
          <UButton
            :href="assetUrl(micAssets.pdf)"
            external
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
