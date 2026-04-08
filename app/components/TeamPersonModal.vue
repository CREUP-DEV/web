<script setup lang="ts">
import {
  getSocialButtons as resolveSocialButtons,
  socialNetworkIcons,
  type SocialNetworkEntry,
} from '~~/shared/utils/social'

interface TeamMemberModalPerson {
  photo: string | null
  denomination: string | null
  email: string
  name: string
  surname: string
  university?: string | null
  degree?: string | null
  description?: string | null
  socialNetworks: SocialNetworkEntry[]
}

const props = defineProps<{
  member: TeamMemberModalPerson
  displayName: string
  badgeLabel: string
  contactEmail?: string | null
  copyEmailAriaLabel?: string
  assignmentStart?: string | null
  assignmentEnd?: string | null
  assignmentDuration?: string | null
}>()

const emit = defineEmits<{
  copyEmail: [email: string]
}>()

const { t } = useI18n()
const networkIcons = socialNetworkIcons

const socialButtons = computed(() => resolveSocialButtons(props.member.socialNetworks))
const hasSocialButtons = computed(() => socialButtons.value.length > 0)
const hasDescription = computed(() => Boolean(props.member.description?.trim()))
const hasAcademicInfo = computed(() => Boolean(props.member.university || props.member.degree))
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

        <div class="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-8">
          <div class="space-y-5">
            <UBadge
              color="neutral"
              variant="soft"
              size="md"
              icon="i-tabler-building-community"
              class="bg-surface/80 dark:bg-surface/70 inline-flex max-w-full px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-gray-200/70 backdrop-blur dark:ring-gray-800/70"
            >
              <span class="truncate">{{ badgeLabel }}</span>
            </UBadge>

            <div class="space-y-3">
              <div>
                <p v-if="member.denomination" class="text-primary text-sm font-medium">
                  {{ member.denomination }}
                </p>
                <h3 class="mt-1 max-w-3xl text-3xl leading-tight font-semibold sm:text-4xl">
                  {{ displayName }}
                </h3>
              </div>

              <div class="flex flex-wrap gap-2">
                <UBadge v-if="member.university" size="sm" color="neutral" variant="soft">
                  {{ member.university }}
                </UBadge>
                <UBadge v-if="member.degree" size="sm" color="neutral" variant="outline">
                  {{ member.degree }}
                </UBadge>
              </div>

              <div
                v-if="assignmentStart || assignmentEnd || assignmentDuration"
                class="flex flex-wrap items-center gap-2 text-sm"
              >
                <UBadge
                  v-if="assignmentStart || assignmentEnd"
                  size="sm"
                  color="primary"
                  variant="soft"
                >
                  {{ assignmentStart }} - {{ assignmentEnd }}
                </UBadge>
                <span v-if="assignmentDuration" class="text-muted">{{ assignmentDuration }}</span>
              </div>
            </div>
          </div>

          <div class="self-start">
            <div
              class="bg-surface/90 dark:bg-surface/80 mx-auto flex aspect-square w-full max-w-42.5 items-center justify-center overflow-hidden rounded-[1.75rem] shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)] ring-1 ring-gray-200/70 backdrop-blur lg:mx-0 lg:max-w-55 dark:ring-gray-800/70"
            >
              <NuxtImg
                v-if="member.photo"
                :src="member.photo"
                :alt="displayName"
                class="size-full object-cover"
              />
              <div
                v-else
                class="bg-primary/10 text-primary flex size-full items-center justify-center"
              >
                <UIcon name="i-tabler-user" class="size-14" />
              </div>
            </div>
          </div>
        </div>

        <div v-if="hasDescription" class="mt-6 max-w-3xl space-y-3">
          <p class="text-muted text-xs font-semibold tracking-[0.24em] uppercase">
            {{ t('team.about', { name: displayName }) }}
          </p>
          <p class="text-base leading-8 sm:text-[1.05rem]">
            {{ member.description }}
          </p>
        </div>

        <div
          v-if="contactEmail || hasAcademicInfo || hasSocialButtons"
          class="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
        >
          <div
            v-if="contactEmail || hasAcademicInfo"
            class="bg-surface/80 dark:bg-surface/70 rounded-[1.5rem] p-4 shadow-sm ring-1 ring-gray-200/70 backdrop-blur dark:ring-gray-800/70"
          >
            <p class="text-muted text-xs font-semibold tracking-[0.2em] uppercase">
              {{ t('members.info') }}
            </p>

            <div class="mt-4 space-y-3">
              <div
                v-if="contactEmail"
                class="group flex items-center gap-3 rounded-2xl px-1 py-1.5 transition-colors hover:bg-white/60 dark:hover:bg-gray-800/40"
              >
                <span
                  class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full"
                >
                  <UIcon name="i-tabler-mail" class="size-5" />
                </span>
                <div class="min-w-0 space-y-1">
                  <p class="text-muted text-[11px] font-semibold tracking-[0.16em] uppercase">
                    {{ t('team.email') }}
                  </p>
                  <div class="flex items-center gap-2">
                    <a
                      :href="`mailto:${contactEmail}`"
                      class="block text-sm font-medium break-all hover:underline"
                    >
                      {{ contactEmail }}
                    </a>
                    <UButton
                      variant="ghost"
                      color="neutral"
                      size="sm"
                      icon="i-tabler-copy"
                      class="shrink-0"
                      :aria-label="copyEmailAriaLabel"
                      @click="emit('copyEmail', contactEmail)"
                    />
                  </div>
                </div>
              </div>

              <div v-if="member.university" class="flex items-start gap-3 rounded-2xl px-1 py-1.5">
                <span
                  class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full"
                >
                  <UIcon name="i-tabler-school" class="size-5" />
                </span>
                <span class="min-w-0 space-y-1">
                  <span
                    class="text-muted block text-[11px] font-semibold tracking-[0.16em] uppercase"
                  >
                    {{ t('team.university') }}
                  </span>
                  <span class="block text-sm font-medium">{{ member.university }}</span>
                </span>
              </div>

              <div v-if="member.degree" class="flex items-start gap-3 rounded-2xl px-1 py-1.5">
                <span
                  class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full"
                >
                  <UIcon name="i-tabler-book" class="size-5" />
                </span>
                <span class="min-w-0 space-y-1">
                  <span
                    class="text-muted block text-[11px] font-semibold tracking-[0.16em] uppercase"
                  >
                    {{ t('team.degree') }}
                  </span>
                  <span class="block text-sm font-medium">{{ member.degree }}</span>
                </span>
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
