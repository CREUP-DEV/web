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
  logoLight?: string | null
  logoDark?: string | null
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
}>()

const emit = defineEmits<{
  close: []
}>()

const lightLogo = computed(() => props.logoLight ?? props.logoDark ?? '')
const darkLogo = computed(() => props.logoDark ?? props.logoLight ?? '')

const { t } = useI18n()
const networkIcons = socialNetworkIcons

const hasDescription = computed(() => Boolean(props.description?.trim().length))
const hasInfoPanel = computed(() => Boolean(props.website || props.email))
const hasIdentityMeta = computed(() => Boolean(props.initials || props.communityLabel))
const hasSocialButtons = computed(() => (props.socialButtons?.length ?? 0) > 0)
</script>

<template>
  <div class="detail-modal-shell bg-default relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
    <UButton
      :aria-label="t('common.close')"
      icon="i-tabler-x"
      color="neutral"
      variant="ghost"
      class="absolute top-4 right-4 z-10 rounded-full"
      @click="emit('close')"
    />

    <div
      class="bg-primary/[0.14] dark:bg-primary/8 pointer-events-none absolute top-0 right-0 h-44 w-44 rounded-full blur-3xl"
      aria-hidden="true"
    />
    <div
      class="bg-secondary/16 dark:bg-secondary/10 pointer-events-none absolute bottom-0 left-0 h-36 w-36 rounded-full blur-3xl"
      aria-hidden="true"
    />

    <div class="relative">
      <div class="relative grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_240px] lg:gap-8">
        <div class="space-y-6">
          <div class="space-y-4">
            <p class="text-primary pr-12 text-lg leading-tight font-semibold sm:text-xl">
              {{ eyebrow }}
            </p>

            <h3 class="max-w-3xl pr-12 text-3xl leading-tight font-semibold sm:text-4xl">
              {{ heading }}
            </h3>

            <div class="lg:hidden">
              <div
                class="detail-modal-media bg-surface-elevated dark:bg-surface-elevated mx-auto flex aspect-square w-full max-w-48 items-center justify-center rounded-[1.75rem] p-5 sm:max-w-56 sm:p-6"
              >
                <UColorModeImage
                  v-if="lightLogo || darkLogo"
                  :light="lightLogo"
                  :dark="darkLogo"
                  :alt="imageAlt"
                  class="size-full object-contain"
                />
                <UIcon
                  v-else
                  name="i-tabler-building"
                  class="text-muted size-12 sm:size-14"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div v-if="hasIdentityMeta" class="grid gap-3 sm:grid-cols-2">
              <div
                v-if="initials"
                class="bg-surface-elevated dark:bg-surface-elevated flex min-w-0 items-start gap-3 rounded-[1.25rem] p-3 shadow-sm"
              >
                <span
                  class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full"
                >
                  <UIcon name="i-tabler-building-community" class="size-5" aria-hidden="true" />
                </span>
                <span class="min-w-0 space-y-1">
                  <span
                    class="text-muted block text-[11px] font-semibold tracking-[0.16em] uppercase"
                  >
                    {{ t('members.initials') }}
                  </span>
                  <span class="block text-sm font-medium sm:text-[0.95rem]">{{ initials }}</span>
                </span>
              </div>

              <div
                v-if="communityLabel"
                class="bg-surface-elevated dark:bg-surface-elevated flex min-w-0 items-start gap-3 rounded-[1.25rem] p-3 shadow-sm"
              >
                <span
                  class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full"
                >
                  <UIcon name="i-tabler-map-pin" class="size-5" aria-hidden="true" />
                </span>
                <span class="min-w-0 space-y-1">
                  <span
                    class="text-muted block text-[11px] font-semibold tracking-[0.16em] uppercase"
                  >
                    {{ t('members.community') }}
                  </span>
                  <span class="block text-sm font-medium sm:text-[0.95rem]">
                    {{ communityLabel }}
                  </span>
                </span>
              </div>
            </div>

            <div v-if="hasDescription" class="space-y-3">
              <p class="text-muted text-xs font-semibold tracking-[0.24em] uppercase">
                {{ aboutTitle }}
              </p>
              <p class="text-base leading-8 sm:text-[1.05rem]">
                {{ description }}
              </p>
            </div>
          </div>
        </div>

        <div class="hidden self-start lg:block">
          <div
            class="detail-modal-media bg-surface-elevated dark:bg-surface-elevated mx-auto flex aspect-square w-full max-w-42.5 items-center justify-center rounded-[1.75rem] p-5 lg:mx-0 lg:max-w-55 lg:p-6"
          >
            <UColorModeImage
              v-if="lightLogo || darkLogo"
              :light="lightLogo"
              :dark="darkLogo"
              :alt="imageAlt"
              class="size-full object-contain"
            />
            <UIcon v-else name="i-tabler-building" class="text-muted size-14" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div v-if="hasInfoPanel || hasSocialButtons" class="mt-6 space-y-4">
        <div v-if="hasInfoPanel" class="grid gap-3 sm:grid-cols-2">
          <a
            v-if="website"
            :href="website.href"
            target="_blank"
            rel="noopener noreferrer"
            class="bg-surface-elevated dark:bg-surface-elevated ring-primary/12 group flex w-full min-w-0 items-start gap-3 rounded-[1.35rem] px-4 py-3 shadow-sm ring-1"
          >
            <span
              class="bg-primary/12 text-primary flex size-10 shrink-0 items-center justify-center rounded-full"
            >
              <UIcon name="i-tabler-world-www" class="size-5" aria-hidden="true" />
            </span>
            <span class="min-w-0 space-y-1">
              <span class="text-muted block text-[11px] font-semibold tracking-[0.16em] uppercase">
                {{ t('members.networks.website') }}
              </span>
              <span class="block text-sm font-medium break-all group-hover:underline">
                {{ website.label }}
              </span>
            </span>
          </a>

          <div
            v-if="email"
            class="bg-surface-elevated dark:bg-surface-elevated ring-primary/12 flex w-full min-w-0 items-center gap-3 rounded-[1.35rem] px-4 py-3 shadow-sm ring-1"
          >
            <span
              class="bg-primary/12 text-primary flex size-10 shrink-0 items-center justify-center rounded-full"
            >
              <UIcon name="i-tabler-mail" class="size-5" aria-hidden="true" />
            </span>
            <div class="min-w-0 space-y-1">
              <p class="text-muted text-[11px] font-semibold tracking-[0.16em] uppercase">
                {{ t('members.networks.email') }}
              </p>
              <a :href="email.href" class="block text-sm font-medium break-all hover:underline">
                {{ email.email }}
              </a>
            </div>
          </div>
        </div>

        <div v-if="hasSocialButtons">
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
              class="bg-surface dark:bg-surface justify-start rounded-2xl px-4 py-3"
            >
              {{ t(`members.networks.${socialNetwork.network}`) }}
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
