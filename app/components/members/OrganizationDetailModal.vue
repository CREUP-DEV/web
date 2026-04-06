<script setup lang="ts">
import { socialNetworkIcons, type SupportedSocialNetwork } from '~~/shared/utils/social'

const props = defineProps<{
  eyebrow: string
  heading: string
  aboutTitle: string
  imageAlt: string
  description?: string | null
  initials?: string | null
  communityLabel?: string | null
  logoSrc?: string | null
  website?: {
    href: string
    label: string
  } | null
  email?: {
    href: string
    email: string
  } | null
  socialButtons?: Array<{
    network: SupportedSocialNetwork
    href: string
  }>
  copyEmailAriaLabel?: string | null
}>()

const emit = defineEmits<{
  (e: 'copy-email', email: string): void
  (e: 'logo-error', logoSrc: string | null): void
}>()

const { t } = useI18n()
const networkIcons = socialNetworkIcons

const hasDescription = computed(() => Boolean(props.description?.trim().length))
const hasInfoPanel = computed(() => Boolean(props.website || props.email))
const hasSocialButtons = computed(() => (props.socialButtons?.length ?? 0) > 0)
</script>

<template>
  <div class="space-y-6">
    <section
      class="bg-surface/95 dark:bg-surface/90 overflow-hidden rounded-4xl border border-white/60 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.35)] ring-1 ring-gray-200/70 dark:border-white/10 dark:ring-gray-800/70"
    >
      <div class="relative px-5 py-6 sm:px-8 sm:py-8">
        <div
          class="pointer-events-none absolute top-0 right-0 h-44 w-44 rounded-full bg-red-200/35 blur-3xl dark:bg-red-500/8"
          aria-hidden="true"
        />
        <div
          class="pointer-events-none absolute bottom-0 left-0 h-36 w-36 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/8"
          aria-hidden="true"
        />

        <div class="relative grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_240px] lg:gap-8">
          <div class="space-y-6">
            <div
              class="bg-surface/80 dark:bg-surface/70 inline-flex max-w-full items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-gray-200/70 backdrop-blur dark:ring-gray-800/70"
            >
              <UIcon name="i-tabler-building-community" class="text-primary size-4 shrink-0" />
              <span class="truncate">{{ eyebrow }}</span>
            </div>

            <div class="space-y-4">
              <h3 class="max-w-3xl text-3xl leading-tight font-semibold sm:text-4xl">
                {{ heading }}
              </h3>

              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-if="initials"
                  size="sm"
                  color="neutral"
                  variant="soft"
                  class="px-3 py-1 text-sm font-semibold"
                >
                  {{ initials }}
                </UBadge>
                <UBadge
                  v-if="communityLabel"
                  size="sm"
                  color="neutral"
                  variant="outline"
                  class="px-3 py-1 text-sm"
                >
                  {{ communityLabel }}
                </UBadge>
              </div>
            </div>
          </div>

          <div class="self-start">
            <div
              class="bg-surface/90 dark:bg-surface/80 mx-auto flex aspect-square w-full max-w-42.5 items-center justify-center rounded-[1.75rem] p-5 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)] ring-1 ring-gray-200/70 backdrop-blur lg:mx-0 lg:max-w-55 lg:p-6 dark:ring-gray-800/70"
            >
              <NuxtImg
                v-if="logoSrc"
                :src="logoSrc"
                :alt="imageAlt"
                class="size-full object-contain"
                @error="emit('logo-error', logoSrc)"
              />
              <UIcon v-else name="i-tabler-building" class="text-muted size-14" />
            </div>
          </div>
        </div>

        <div v-if="hasDescription" class="mt-6 max-w-3xl space-y-3">
          <p class="text-muted text-xs font-semibold tracking-[0.24em] uppercase">
            {{ aboutTitle }}
          </p>
          <p class="text-base leading-8 sm:text-[1.05rem]">
            {{ description }}
          </p>
        </div>

        <div
          v-if="hasInfoPanel || hasSocialButtons"
          class="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
        >
          <div
            v-if="hasInfoPanel"
            class="bg-surface/80 dark:bg-surface/70 rounded-[1.5rem] p-4 shadow-sm ring-1 ring-gray-200/70 backdrop-blur dark:ring-gray-800/70"
          >
            <p class="text-muted text-xs font-semibold tracking-[0.2em] uppercase">
              {{ t('members.info') }}
            </p>

            <div class="mt-4 space-y-3">
              <a
                v-if="website"
                :href="website.href"
                target="_blank"
                rel="noopener noreferrer"
                class="group flex items-start gap-3 rounded-2xl px-1 py-1.5 transition-colors hover:bg-white/60 dark:hover:bg-gray-800/40"
              >
                <span
                  class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full"
                >
                  <UIcon name="i-tabler-world-www" class="size-5" />
                </span>
                <span class="min-w-0 space-y-1">
                  <span
                    class="text-muted block text-[11px] font-semibold tracking-[0.16em] uppercase"
                  >
                    {{ t('members.networks.website') }}
                  </span>
                  <span class="block truncate text-sm font-medium group-hover:underline">
                    {{ website.label }}
                  </span>
                </span>
              </a>

              <div
                v-if="email"
                class="group flex items-center gap-3 rounded-2xl px-1 py-1.5 transition-colors hover:bg-white/60 dark:hover:bg-gray-800/40"
              >
                <span
                  class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full"
                >
                  <UIcon name="i-tabler-mail" class="size-5" />
                </span>
                <div class="min-w-0 space-y-1">
                  <p class="text-muted text-[11px] font-semibold tracking-[0.16em] uppercase">
                    {{ t('members.networks.email') }}
                  </p>
                  <div class="flex items-center gap-2">
                    <a
                      :href="email.href"
                      class="block truncate text-sm font-medium hover:underline"
                    >
                      {{ email.email }}
                    </a>
                    <UButton
                      variant="ghost"
                      color="neutral"
                      size="sm"
                      icon="i-tabler-copy"
                      class="shrink-0"
                      :aria-label="copyEmailAriaLabel ?? undefined"
                      @click="emit('copy-email', email.email)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="hasSocialButtons"
            class="bg-surface/70 dark:bg-surface/65 rounded-[1.5rem] p-4 ring-1 ring-gray-200/70 dark:ring-gray-800/70"
          >
            <h4 class="text-muted mb-4 text-xs font-semibold tracking-[0.2em] uppercase">
              {{ t('members.socialNetworks') }}
            </h4>

            <div class="grid gap-3 sm:grid-cols-2">
              <UButton
                v-for="socialNetwork in socialButtons"
                :key="`${socialNetwork.network}-${socialNetwork.href}`"
                :to="socialNetwork.href"
                target="_blank"
                rel="noopener noreferrer"
                :icon="networkIcons[socialNetwork.network]"
                color="neutral"
                variant="outline"
                size="lg"
                class="bg-surface/85 dark:bg-surface/75 justify-start rounded-2xl px-4 py-3"
              >
                {{ t(`members.networks.${socialNetwork.network}`) }}
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
