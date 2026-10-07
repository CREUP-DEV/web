<script setup lang="ts">
/**
 * What a person or organisation detail modal shows, as a native popover that opens and closes
 * without JavaScript. Only reachable inside a web archive, where the app never mounts and the
 * replay plugin points each card at its popover; on the live site it stays hidden and inert.
 *
 * Rendered with `hydrate-never`, so the live site pays for its markup but not for any script, and
 * its images are lazy, so a closed popover downloads nothing.
 */
defineProps<{
  id: string
  heading: string
  eyebrow?: string | null
  imageSrc?: string | null
  /** Logos ship a variant for dark backgrounds; CSS picks one, since no script runs here. */
  imageDarkSrc?: string | null
  imageAlt?: string
  imageShape?: 'round' | 'logo'
  facts?: Array<{ label: string; value: string; icon: string }>
  aboutTitle?: string
  description?: string | null
  linksTitle?: string
  links?: Array<{ label: string; href: string; icon: string }>
}>()

const { t } = useI18n()
</script>

<template>
  <div
    :id="id"
    popover
    class="bg-default text-default ring-default m-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border-0 p-6 shadow-xl ring backdrop:bg-black/50 sm:p-8"
  >
    <div class="mb-5 flex items-start justify-between gap-3">
      <p class="text-primary min-w-0 text-sm font-semibold">{{ eyebrow }}</p>
      <button
        type="button"
        :popovertarget="id"
        popovertargetaction="hide"
        :aria-label="t('common.close')"
        class="text-muted hover:text-highlighted hover:bg-elevated/50 -mt-1 -mr-1 shrink-0 rounded-full p-1.5"
      >
        <UIcon name="i-tabler-x" class="block size-5" />
      </button>
    </div>

    <div
      class="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left"
    >
      <div
        v-if="imageSrc"
        :class="imageShape === 'logo' ? 'bg-elevated rounded-2xl p-3' : 'rounded-full'"
        class="size-28 shrink-0 overflow-hidden"
      >
        <AdaptiveImage
          :src="imageSrc"
          :alt="imageAlt ?? heading"
          width="112"
          height="112"
          sizes="112px"
          format="webp"
          :fit="imageShape === 'logo' ? 'inside' : undefined"
          :class="[
            imageShape === 'logo' ? 'object-contain' : 'object-cover',
            imageDarkSrc ? 'dark:hidden' : '',
          ]"
          class="block size-full"
        />
        <AdaptiveImage
          v-if="imageDarkSrc"
          :src="imageDarkSrc"
          :alt="imageAlt ?? heading"
          width="112"
          height="112"
          sizes="112px"
          format="webp"
          fit="inside"
          class="hidden size-full object-contain dark:block"
        />
      </div>

      <div class="min-w-0">
        <h2 class="text-2xl leading-tight font-semibold">{{ heading }}</h2>
        <dl v-if="facts?.length" class="mt-3 space-y-1.5 text-sm">
          <div v-for="fact in facts" :key="fact.label">
            <dt class="sr-only">{{ fact.label }}</dt>
            <dd class="flex items-start justify-center gap-2 sm:justify-start">
              <UIcon
                :name="fact.icon"
                class="text-primary mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              {{ fact.value }}
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <div v-if="description?.trim()" class="mt-6 space-y-2">
      <p v-if="aboutTitle" class="text-muted text-xs font-semibold tracking-[0.2em] uppercase">
        {{ aboutTitle }}
      </p>
      <p class="leading-7">{{ description }}</p>
    </div>

    <div v-if="links?.length" class="mt-6">
      <p v-if="linksTitle" class="text-muted mb-3 text-xs font-semibold tracking-[0.2em] uppercase">
        {{ linksTitle }}
      </p>
      <ul class="grid gap-2 sm:grid-cols-2">
        <li v-for="link in links" :key="link.href">
          <a
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
            class="ring-default hover:bg-elevated/50 flex items-center gap-2 rounded-xl px-3 py-2 text-sm ring"
          >
            <UIcon :name="link.icon" class="size-4 shrink-0" aria-hidden="true" />
            <span class="min-w-0 truncate">{{ link.label }}</span>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>
