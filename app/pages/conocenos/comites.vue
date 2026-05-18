<script setup lang="ts">
import { detailModalUi } from '@/utils/detailModalUi'
import type { SocialNetworkEntry } from '~~/shared/utils/social'
import { pickLocalizedValue } from '~~/shared/utils/locale'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { fallbackLocale } = useLocales()
const localeApiHeaders = useLocaleApiHeaders()
const { getDisplayName: getMemberDisplayName } = usePersonHelpers()

usePageSeo('committees.title', 'committees.description', {
  webPageType: 'CollectionPage',
  breadcrumbs: () => [
    {
      name: t('nav.home'),
      path: localePath('/'),
    },
    {
      name: t('nav.about.committees'),
      path: localePath('/conocenos/comites'),
    },
  ],
})

type SocialNetwork = SocialNetworkEntry

interface CommitteeMember {
  id: string
  order: number
  denomination: string | null
  photo: string | null
  email: string
  name: string
  surname: string
  university: string | null
  degree: string | null
  description: string | null
  publicAgenda: boolean
  socialNetworks: SocialNetwork[]
}

interface Committee {
  id: number
  name: string
  nameTranslations: Record<string, string>
  description: string | null
  descriptionTranslations: Record<string, string>
  order: number
  members: CommitteeMember[]
}

interface CommitteesResponse {
  data: Committee[]
  meta: {
    generatedAt?: string | null
  }
}
interface EnrichedMember extends CommitteeMember {
  committeeName: string
  committeeId: number
}

const { data, pending, error, refresh } = useFetch<CommitteesResponse>('/api/comites', {
  cache: 'no-cache',
  headers: localeApiHeaders,
})

const committees = computed(() => data.value?.data ?? [])
const getEntranceDelay = (index: number) => getEntranceDelayStyle(index, 70)

const getCommitteeName = (committee: Committee) =>
  pickLocalizedValue(committee.nameTranslations ?? {}, locale.value, fallbackLocale) ??
  committee.name

const getCommitteeDescription = (committee: Committee) =>
  pickLocalizedValue(committee.descriptionTranslations ?? {}, locale.value, fallbackLocale) ??
  committee.description ??
  ''

const getViewProfileAriaLabel = (fullName: string) => `${t('committees.viewProfile')}: ${fullName}`
const memberCardClass =
  'motion-card-strong group bg-surface/50 hover:bg-surface w-full max-w-md rounded-xl ring-1 ring-default p-5 md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]'
const memberCardTriggerClass =
  'focus-visible:ring-primary block w-full rounded-xl text-center focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'

const selectedMember = ref<EnrichedMember | null>(null)
const modalOpen = ref(false)
const memberModalUi = detailModalUi

const selectedMemberModalKey = computed(() => {
  if (!selectedMember.value) {
    return 'none'
  }

  return [selectedMember.value.id, selectedMember.value.photo ?? ''].join('|')
})

const openMemberModal = (member: CommitteeMember, committee: Committee) => {
  selectedMember.value = {
    ...member,
    committeeName: getCommitteeName(committee),
    committeeId: committee.id,
  }
  modalOpen.value = true
}

const closeMemberModal = () => {
  modalOpen.value = false
  selectedMember.value = null
}

function encodeEmail(email: string) {
  const [user = '', domain = ''] = email.split('@')
  return { eu: btoa(user), ed: btoa(domain) }
}
</script>

<template>
  <div>
    <UContainer class="py-8 sm:py-12">
      <header class="mb-8 text-center sm:mb-12">
        <h1 class="text-3xl font-bold sm:text-4xl">{{ t('committees.title') }}</h1>
        <p class="text-muted mx-auto mt-3 max-w-2xl text-lg">
          {{ t('committees.description') }}
        </p>
      </header>

      <div v-if="pending" aria-hidden="true" class="space-y-16">
        <div v-for="n in 3" :key="n" class="space-y-6">
          <div class="space-y-3">
            <USkeleton class="h-8 w-48 rounded-lg" />
            <USkeleton class="h-4 w-full max-w-2xl rounded" />
          </div>

          <div class="flex flex-wrap justify-center gap-6">
            <div
              v-for="m in 4"
              :key="m"
              class="bg-surface/50 ring-default w-full max-w-md rounded-xl p-5 ring-1 md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
            >
              <div class="space-y-4">
                <USkeleton class="mx-auto size-24 rounded-full sm:size-28" />

                <div class="space-y-2 text-center">
                  <USkeleton class="mx-auto h-4 w-28 rounded" />
                  <USkeleton class="mx-auto h-5 w-40 rounded" />
                </div>

                <div class="flex justify-center">
                  <USkeleton class="h-4 w-32 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="error" class="mb-6 space-y-3">
        <UAlert
          color="error"
          variant="soft"
          icon="i-tabler-alert-triangle"
          :title="t('committees.loadError')"
        />
        <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
          {{ t('home.retry') }}
        </UButton>
      </div>

      <div v-else class="space-y-16">
        <section
          v-for="committee in committees"
          :key="committee.id"
          :aria-labelledby="`committee-heading-${committee.id}`"
        >
          <div class="mb-6">
            <h2
              :id="`committee-heading-${committee.id}`"
              class="border-primary border-b-2 pb-2 text-2xl font-semibold"
            >
              {{ getCommitteeName(committee) }}
            </h2>
            <p v-if="getCommitteeDescription(committee)" class="text-muted mt-3 text-base">
              {{ getCommitteeDescription(committee) }}
            </p>
          </div>

          <TransitionGroup
            v-if="committee.members.length > 0"
            appear
            tag="div"
            name="stagger-list"
            class="flex flex-wrap justify-center gap-6"
          >
            <article
              v-for="(member, idx) in committee.members"
              :key="member.id"
              :class="memberCardClass"
              :style="getEntranceDelay(idx)"
            >
              <button
                type="button"
                :class="memberCardTriggerClass"
                :aria-label="getViewProfileAriaLabel(getMemberDisplayName(member))"
                @click="openMemberModal(member, committee)"
              >
                <div class="mb-4 flex justify-center">
                  <div
                    class="ring-primary/20 group-hover:ring-primary/40 size-24 overflow-hidden rounded-full ring-2 transition-all sm:size-28"
                  >
                    <AdaptiveImage
                      v-if="member.photo"
                      :key="`${member.id}-${member.photo}`"
                      :src="member.photo"
                      :alt="getMemberDisplayName(member)"
                      class="size-full object-cover"
                    />
                    <div
                      v-else
                      class="bg-primary/10 text-primary flex size-full items-center justify-center"
                    >
                      <UIcon name="i-tabler-user" class="size-12" />
                    </div>
                  </div>
                </div>

                <div class="text-center">
                  <p v-if="member.denomination" class="text-primary text-sm font-medium">
                    {{ member.denomination }}
                  </p>
                  <p class="text-foreground mt-1 font-semibold">
                    {{ getMemberDisplayName(member) }}
                  </p>
                </div>
              </button>

              <div class="mt-3 flex flex-wrap items-center justify-center gap-2">
                <div v-if="member.email" class="text-muted inline-flex items-center gap-1 text-sm">
                  <UIcon name="i-tabler-mail" class="size-4" />
                  <ObfuscatedEmail
                    v-bind="encodeEmail(member.email)"
                    class="hover:text-primary transition-colors"
                  />
                </div>
              </div>
            </article>
          </TransitionGroup>

          <div v-else class="flex flex-col items-center py-8 text-center">
            <UIcon name="i-tabler-users-group" class="text-muted mb-2 size-10" />
            <p class="text-muted text-sm">{{ t('committees.noMembers') }}</p>
          </div>
        </section>
      </div>
    </UContainer>

    <UModal
      v-model:open="modalOpen"
      :ui="memberModalUi"
      :title="t('team.memberModalTitle')"
      @close="closeMemberModal"
    >
      <template #body>
        <TeamPersonModal
          v-if="selectedMember"
          :key="selectedMemberModalKey"
          :member="selectedMember"
          :display-name="getMemberDisplayName(selectedMember)"
          @close="closeMemberModal"
        />
      </template>
    </UModal>
  </div>
</template>
