<script setup lang="ts">
import { isExternalNavigationTarget } from '~~/shared/utils/url'

type LinkItem = {
  title: string
  image: string
  to: string
  alt?: string
}

const props = withDefaults(
  defineProps<{
    items: LinkItem[]
    pending?: boolean
  }>(),
  {
    pending: false,
  }
)

const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <section
    v-if="props.pending || props.items.length"
    aria-labelledby="featured-links-heading"
    class="py-4 sm:py-6"
  >
    <UContainer>
      <header class="mb-3 flex items-center justify-between sm:mb-5">
        <h2 id="featured-links-heading" class="text-xl font-semibold sm:text-2xl">
          {{ t('home.featuredLinks') }}
        </h2>
      </header>

      <div aria-live="polite" :aria-busy="props.pending || undefined">
        <div
          v-if="props.pending"
          aria-hidden="true"
          class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        >
          <div v-for="n in 6" :key="n" class="bg-surface/50 overflow-hidden rounded-xl">
            <USkeleton class="aspect-square" />
            <div class="p-2.5 sm:p-3">
              <USkeleton class="h-4 w-3/4" />
            </div>
          </div>
        </div>

        <ul
          v-else
          class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          role="list"
        >
          <li v-for="(item, idx) in props.items" :key="idx">
            <a
              v-if="isExternalNavigationTarget(item.to)"
              :href="item.to"
              class="motion-link-card group focus-visible:ring-primary/60 bg-surface/50 hover:bg-surface ring-default block overflow-hidden rounded-xl ring-1 focus:outline-none focus-visible:ring-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div class="bg-muted aspect-square">
                <NuxtImg
                  :src="item.image"
                  :alt="item.alt ?? ''"
                  width="288"
                  height="288"
                  class="motion-link-media size-full object-cover"
                  loading="lazy"
                />
              </div>
              <div class="p-2.5 sm:p-3">
                <UTooltip :text="item.title">
                  <p
                    class="group-hover:text-primary text-sm leading-tight font-medium transition-colors sm:line-clamp-2"
                  >
                    {{ item.title }}
                  </p>
                </UTooltip>
              </div>
            </a>
            <NuxtLink
              v-else
              :to="localePath(item.to)"
              class="motion-link-card group focus-visible:ring-primary/60 bg-surface/50 hover:bg-surface ring-default block overflow-hidden rounded-xl ring-1 focus:outline-none focus-visible:ring-2"
            >
              <div class="bg-muted aspect-square">
                <NuxtImg
                  :src="item.image"
                  :alt="item.alt ?? ''"
                  width="288"
                  height="288"
                  class="motion-link-media size-full object-cover"
                  loading="lazy"
                />
              </div>
              <div class="p-2.5 sm:p-3">
                <UTooltip :text="item.title">
                  <p
                    class="group-hover:text-primary text-sm leading-tight font-medium transition-colors sm:line-clamp-2"
                  >
                    {{ item.title }}
                  </p>
                </UTooltip>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </UContainer>
  </section>
</template>
