<script setup lang="ts">
import { socialNetworkIcons, type SocialNetworkEntry } from '~~/shared/utils/social'
import { pickLocalizedValue } from '~~/shared/utils/locale'

const { t, locale } = useI18n()
const { fallbackLocale } = useLocales()
const localeApiHeaders = useLocaleApiHeaders()
const { copyToClipboard } = useCopyToClipboard()
const {
  getDisplayName: getMemberDisplayName,
  getContactEmail,
  getSocialButtons,
  getCopyEmailAriaLabel,
} = usePersonHelpers()

usePageSeo('committees.title', 'committees.description')

type SocialNetwork = SocialNetworkEntry

interface CommitteeMember {
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
  committees: Committee[]
  generatedAt?: string | null
}
interface EnrichedMember extends CommitteeMember {
  committeeName: string
  committeeId: number
}

const { data, error } = await useFetch<CommitteesResponse>('/api/comites', {
  headers: localeApiHeaders,
})

const committees = computed(() => data.value?.committees ?? [])
const getEntranceDelay = (index: number) => useEntranceDelay(index, 70)

const getCommitteeName = (committee: Committee) =>
  pickLocalizedValue(committee.nameTranslations ?? {}, locale.value, fallbackLocale) ??
  committee.name

const getCommitteeDescription = (committee: Committee) =>
  pickLocalizedValue(committee.descriptionTranslations ?? {}, locale.value, fallbackLocale) ??
  committee.description ??
  ''

const networkIcons = socialNetworkIcons

const getViewProfileAriaLabel = (fullName: string) => `${t('committees.viewProfile')}: ${fullName}`
const memberCardClass =
  'motion-card-strong group bg-surface/50 hover:bg-surface w-full max-w-md rounded-xl p-5 ring-1 ring-gray-200/50 md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] dark:ring-gray-800/50'
const memberCardTriggerClass =
  'focus-visible:ring-primary block w-full rounded-xl text-center focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'

const selectedMember = ref<EnrichedMember | null>(null)
const modalOpen = ref(false)

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

const copyEmail = (email: string) => copyToClipboard(email, t('common.emailCopied'))

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

      <UAlert
        v-if="error"
        class="mb-6"
        color="error"
        variant="soft"
        icon="i-tabler-alert-triangle"
        :title="t('committees.loadError')"
      />

      <div class="space-y-16">
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
              :key="`committee-${committee.id}-member-${idx}`"
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
                    <NuxtImg
                      v-if="member.photo"
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
                <button
                  v-if="member.email"
                  type="button"
                  class="text-muted hover:text-primary inline-flex items-center gap-1 text-sm transition-colors"
                  :aria-label="getCopyEmailAriaLabel(member.email)"
                  @click="copyEmail(member.email)"
                >
                  <UIcon name="i-tabler-mail" class="size-4" />
                  <ObfuscatedEmail v-bind="encodeEmail(member.email)" />
                </button>
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
      :title="selectedMember?.denomination || selectedMember?.committeeName"
      :description="t('committees.memberModalDescription')"
      @close="closeMemberModal"
    >
      <template #body>
        <div v-if="selectedMember" class="space-y-6">
          <div class="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div
              class="ring-primary/30 size-28 shrink-0 overflow-hidden rounded-full ring-2 sm:size-32"
            >
              <NuxtImg
                v-if="selectedMember.photo"
                :src="selectedMember.photo"
                :alt="getMemberDisplayName(selectedMember)"
                class="size-full object-cover"
              />
              <div
                v-else
                class="bg-primary/10 text-primary flex size-full items-center justify-center"
              >
                <UIcon name="i-tabler-user" class="size-14" />
              </div>
            </div>

            <div class="text-center sm:text-left">
              <p v-if="selectedMember.denomination" class="text-primary text-lg font-medium">
                {{ selectedMember.denomination }}
              </p>
              <p class="text-foreground text-xl font-bold">
                {{ getMemberDisplayName(selectedMember) }}
              </p>
              <UBadge size="sm" color="neutral" variant="soft" class="mt-1">
                {{ selectedMember.committeeName }}
              </UBadge>

              <button
                v-if="getContactEmail(selectedMember)"
                type="button"
                class="text-muted hover:text-primary mt-2 flex items-center gap-1.5 text-sm transition-colors"
                :aria-label="getCopyEmailAriaLabel(getContactEmail(selectedMember))"
                @click="copyEmail(getContactEmail(selectedMember))"
              >
                <UIcon name="i-tabler-mail" class="size-4" />
                <span>{{ getContactEmail(selectedMember) }}</span>
                <UIcon name="i-tabler-copy" class="size-3.5 opacity-50" />
              </button>

              <div v-if="selectedMember.university || selectedMember.degree" class="mt-3 space-y-1">
                <p
                  v-if="selectedMember.university"
                  class="text-muted flex items-center gap-1.5 text-sm"
                >
                  <UIcon name="i-tabler-building" class="size-4 shrink-0" />
                  <span>{{ selectedMember.university }}</span>
                </p>
                <p
                  v-if="selectedMember.degree"
                  class="text-muted flex items-center gap-1.5 text-sm"
                >
                  <UIcon name="i-tabler-school" class="size-4 shrink-0" />
                  <span>{{ selectedMember.degree }}</span>
                </p>
              </div>
            </div>
          </div>

          <div v-if="selectedMember.description">
            <h4 class="text-foreground mb-2 font-semibold">
              {{ t('team.about', { name: selectedMember.name }) }}
            </h4>
            <div class="text-muted prose prose-sm dark:prose-invert max-w-none whitespace-pre-line">
              {{ selectedMember.description }}
            </div>
          </div>

          <div v-if="getSocialButtons(selectedMember).length > 0">
            <h4 class="text-foreground mb-3 font-semibold">{{ t('members.socialNetworks') }}</h4>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="sn in getSocialButtons(selectedMember)"
                :key="`${sn.network}-${sn.href}`"
                :to="sn.href"
                target="_blank"
                rel="noopener noreferrer"
                :icon="networkIcons[sn.network]"
                color="neutral"
                variant="soft"
                size="sm"
              >
                {{ t(`members.networks.${sn.network}`) }}
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
