<script setup lang="ts">
import {
  getSocialButtons as resolveSocialButtons,
  socialNetworkIcons,
  type SocialNetworkEntry,
} from '~~/shared/utils/social'

interface TeamMemberModalPerson {
  id?: string
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
  assignmentStart?: string | null
  assignmentEnd?: string | null
  assignmentDuration?: string | null
  showAgendaButton?: boolean
  publicAgendaLabel?: string
  publicAgendaAriaLabel?: string
}>()

const emit = defineEmits<{
  close: []
  openAgenda: []
}>()

function encodeEmail(email: string) {
  const [user = '', domain = ''] = email.split('@')
  return { eu: btoa(user), ed: btoa(domain) }
}

const { t } = useI18n()
const networkIcons = socialNetworkIcons

const socialButtons = computed(() => resolveSocialButtons(props.member.socialNetworks))
const hasSocialButtons = computed(() => socialButtons.value.length > 0)
const hasDescription = computed(() => Boolean(props.member.description?.trim()))
const hasAssignmentInfo = computed(() =>
  Boolean(props.assignmentStart || props.assignmentEnd || props.assignmentDuration)
)
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
      <div class="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-8">
        <div class="space-y-5">
          <div class="space-y-4">
            <div>
              <p
                v-if="member.denomination"
                class="text-primary pr-12 text-lg leading-tight font-semibold sm:text-xl"
              >
                {{ member.denomination }}
              </p>
              <h2 class="mt-2 max-w-3xl pr-12 text-3xl leading-tight font-semibold sm:text-4xl">
                {{ displayName }}
              </h2>
            </div>

            <div class="lg:hidden">
              <div
                class="detail-modal-media bg-surface-elevated dark:bg-surface-elevated mx-auto flex aspect-square w-full max-w-48 items-center justify-center overflow-hidden rounded-full sm:max-w-56"
              >
                <AdaptiveImage
                  v-if="member.photo"
                  :key="`${member.id ?? displayName}-${member.photo}`"
                  :src="member.photo"
                  :alt="displayName"
                  width="224"
                  height="224"
                  sizes="(max-width: 1024px) 192px, 224px"
                  format="webp"
                  quality="76"
                  class="size-full object-cover"
                  decoding="async"
                />
                <div
                  v-else
                  class="bg-primary/10 text-primary flex size-full items-center justify-center"
                >
                  <UIcon name="i-tabler-user" class="size-12 sm:size-14" aria-hidden="true" />
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-start">
              <div
                v-if="member.email"
                class="bg-surface-elevated dark:bg-surface-elevated ring-primary/12 flex min-w-0 items-center justify-center gap-2.5 rounded-full px-3.5 py-2 shadow-sm ring-1 lg:justify-start"
              >
                <span
                  class="bg-primary/12 text-primary flex size-8 shrink-0 items-center justify-center rounded-full"
                >
                  <UIcon name="i-tabler-mail" class="size-4.5" aria-hidden="true" />
                </span>
                <div class="min-w-0 text-center lg:text-left">
                  <p
                    class="text-muted text-[10px] leading-none font-semibold tracking-[0.16em] uppercase"
                  >
                    {{ t('team.email') }}
                  </p>
                  <ObfuscatedEmail
                    v-bind="encodeEmail(member.email)"
                    class="mt-1 block text-sm font-medium break-all hover:underline"
                  />
                </div>
              </div>

              <UButton
                v-if="showAgendaButton"
                color="neutral"
                variant="ghost"
                :aria-label="publicAgendaAriaLabel"
                class="group bg-surface-elevated dark:bg-surface-elevated ring-primary/12 hover:ring-primary/25 hover:bg-primary/8 dark:hover:bg-primary/12 flex items-center justify-center gap-2.5 rounded-full px-3.5 py-2 shadow-sm ring-1 transition-colors"
                @click="emit('openAgenda')"
              >
                <span
                  class="bg-primary/12 text-primary group-hover:bg-primary/18 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors"
                >
                  <UIcon name="i-tabler-calendar" class="size-4.5" aria-hidden="true" />
                </span>
                <span class="text-sm leading-none font-medium">
                  {{ publicAgendaLabel }}
                </span>
              </UButton>
            </div>

            <div
              v-if="hasAssignmentInfo"
              class="grid gap-2.5 sm:grid-cols-[minmax(0,1.8fr)_minmax(200px,1fr)]"
            >
              <div
                v-if="assignmentStart || assignmentEnd"
                class="bg-primary/10 ring-primary/15 flex items-start gap-3 rounded-[1.35rem] px-3.5 py-2.5 ring-1"
              >
                <span
                  class="bg-primary/12 text-primary flex size-10 shrink-0 items-center justify-center rounded-full"
                >
                  <UIcon name="i-tabler-calendar-event" class="size-4.5" aria-hidden="true" />
                </span>
                <span class="min-w-0">
                  <span
                    class="text-muted block text-[11px] font-semibold tracking-[0.16em] uppercase"
                  >
                    {{ t('team.period') }}
                  </span>
                  <span class="mt-1 block text-base leading-tight font-semibold sm:text-[1.1rem]">
                    {{ assignmentStart }} - {{ assignmentEnd }}
                  </span>
                </span>
              </div>

              <div
                v-if="assignmentDuration"
                class="bg-surface-elevated dark:bg-surface-elevated flex items-start gap-3 rounded-[1.35rem] px-3.5 py-2.5 shadow-sm"
              >
                <span
                  class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full"
                >
                  <UIcon name="i-tabler-clock-hour-4" class="size-4.5" aria-hidden="true" />
                </span>
                <span class="min-w-0">
                  <span
                    class="text-muted block text-[11px] font-semibold tracking-[0.16em] uppercase"
                  >
                    {{ t('team.duration') }}
                  </span>
                  <span class="mt-1 block text-sm leading-tight font-semibold sm:text-base">
                    {{ assignmentDuration }}
                  </span>
                </span>
              </div>
            </div>

            <div v-if="hasDescription" class="space-y-3">
              <p class="text-muted text-xs font-semibold tracking-[0.24em] uppercase">
                {{ t('team.about', { name: member.name }) }}
              </p>
              <p class="text-base leading-8 sm:text-[1.05rem]">
                {{ member.description }}
              </p>
            </div>
          </div>
        </div>

        <div class="hidden self-start lg:block">
          <div
            class="detail-modal-media bg-surface-elevated dark:bg-surface-elevated mx-auto flex aspect-square w-full max-w-42.5 items-center justify-center overflow-hidden rounded-full lg:mx-0 lg:max-w-55"
          >
            <AdaptiveImage
              v-if="member.photo"
              :key="`${member.id ?? displayName}-${member.photo}`"
              :src="member.photo"
              :alt="displayName"
              width="220"
              height="220"
              sizes="220px"
              format="webp"
              quality="76"
              class="size-full object-cover"
              decoding="async"
            />
            <div
              v-else
              class="bg-primary/10 text-primary flex size-full items-center justify-center"
            >
              <UIcon name="i-tabler-user" class="size-14" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      <div v-if="member.university || member.degree || hasSocialButtons" class="mt-6 space-y-4">
        <div v-if="member.university || member.degree" class="grid gap-3 sm:grid-cols-2">
          <div
            v-if="member.university"
            class="bg-surface-elevated dark:bg-surface-elevated flex min-w-0 items-start gap-3 rounded-[1.25rem] p-3 shadow-sm"
          >
            <span
              class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full"
            >
              <UIcon name="i-tabler-school" class="size-5" aria-hidden="true" />
            </span>
            <span class="min-w-0 space-y-1">
              <span class="text-muted block text-[11px] font-semibold tracking-[0.16em] uppercase">
                {{ t('team.university') }}
              </span>
              <span class="block text-sm font-medium sm:text-[0.95rem]">{{
                member.university
              }}</span>
            </span>
          </div>

          <div
            v-if="member.degree"
            class="bg-surface-elevated dark:bg-surface-elevated flex min-w-0 items-start gap-3 rounded-[1.25rem] p-3 shadow-sm"
          >
            <span
              class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full"
            >
              <UIcon name="i-tabler-book" class="size-5" aria-hidden="true" />
            </span>
            <span class="min-w-0 space-y-1">
              <span class="text-muted block text-[11px] font-semibold tracking-[0.16em] uppercase">
                {{ t('team.degree') }}
              </span>
              <span class="block text-sm font-medium sm:text-[0.95rem]">{{ member.degree }}</span>
            </span>
          </div>
        </div>

        <div v-if="hasSocialButtons">
          <h3 class="text-muted mb-4 text-xs font-semibold tracking-[0.2em] uppercase">
            {{ t('members.socialNetworks') }}
          </h3>

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
