<script setup lang="ts">
import { detailModalUi } from '@/utils/detailModalUi'
import type { OrganizationMember, SectorialMember, SectorialesResponse } from '@/types/members'
import type { SocialNetworkEntry } from '~~/shared/utils/social'
import { pickLocalizedValue } from '~~/shared/utils/locale'

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
  socialNetworks: SocialNetworkEntry[]
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

const { t, locale } = useI18n()
const { fallbackLocale } = useLocales()
const localeApiHeaders = useLocaleApiHeaders()
const { getContactEmail, getDisplayName: getMemberDisplayName } = usePersonHelpers()

// This is a hidden compatibility route used to keep firu.es running by mirroring content from this URL.
definePageMeta({
  sitemap: false,
})

usePageSeo('sectorialCommitteePage.title', 'sectorialCommitteePage.description')
useSeoMeta({
  robots: 'noindex, nofollow',
})

const [
  {
    data: committeesData,
    error: committeesError,
    pending: committeesPending,
    refresh: refreshCommittees,
  },
  {
    data: sectorialesData,
    error: sectorialesError,
    pending: sectorialesPending,
    refresh: refreshSectoriales,
  },
] = await Promise.all([
  useFetch<CommitteesResponse>('/api/comites', {
    headers: localeApiHeaders,
    lazy: true,
  }),
  useFetch<SectorialesResponse>('/api/sectoriales', {
    headers: localeApiHeaders,
    lazy: true,
  }),
])

const allCommittees = computed(() => committeesData.value?.committees ?? [])
const allSectoriales = computed(() => sectorialesData.value?.sectoriales ?? [])

const emptyMembers = computed<OrganizationMember[]>(() => [])
const {
  buildSectorialDetailData,
  getMemberAnimationStyle,
  getSectorialDenominationLabel,
  getSectorialDetailsAriaLabel,
  getSectorialImageAlt,
  resolvedSectorialLogos,
} = useMembersDirectory({
  members: emptyMembers,
  sectoriales: allSectoriales,
})

const normalizeForMatch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const committeeMatchFragments = ['asuntos-sectoriales', 'sectorial-affairs', 'sectoral-affairs']

const isSectorialCommittee = (committee: Committee) => {
  const names = [committee.name, ...Object.values(committee.nameTranslations ?? {})]
  return names.some((name) => {
    const normalizedName = normalizeForMatch(name)
    return committeeMatchFragments.some((fragment) => normalizedName.includes(fragment))
  })
}

const sectorialCommittee = computed(() => allCommittees.value.find(isSectorialCommittee) ?? null)
const committeeMembers = computed(() => sectorialCommittee.value?.members ?? [])

const getCommitteeName = (committee: Committee) =>
  pickLocalizedValue(committee.nameTranslations ?? {}, locale.value, fallbackLocale) ??
  committee.name

const getCommitteeDescription = (committee: Committee) =>
  pickLocalizedValue(committee.descriptionTranslations ?? {}, locale.value, fallbackLocale) ??
  committee.description ??
  ''

const committeeTitle = computed(
  () =>
    (sectorialCommittee.value && getCommitteeName(sectorialCommittee.value)) ||
    t('sectorialCommitteePage.fallbackCommitteeTitle')
)

const committeeIntro = computed(
  () =>
    (sectorialCommittee.value && getCommitteeDescription(sectorialCommittee.value)) ||
    t('sectorialCommitteePage.intro')
)

const pending = computed(() => committeesPending.value || sectorialesPending.value)
const hasLoadError = computed(() => Boolean(committeesError.value || sectorialesError.value))
const refreshData = async () => {
  await Promise.all([refreshCommittees(), refreshSectoriales()])
}

const selectedSectorial = ref<SectorialMember | null>(null)
const sectorialModalOpen = ref(false)
const organizationModalUi = detailModalUi

const selectedSectorialDetailData = computed(() => {
  if (!selectedSectorial.value) {
    return null
  }

  return buildSectorialDetailData(selectedSectorial.value)
})

const openSectorialModal = (sectorial: SectorialMember) => {
  selectedSectorial.value = sectorial
  sectorialModalOpen.value = true
}

const closeSectorialModal = () => {
  sectorialModalOpen.value = false
  selectedSectorial.value = null
}

const selectedCommitteeMember = ref<CommitteeMember | null>(null)
const committeeMemberModalOpen = ref(false)
const committeeModalUi = detailModalUi

const openCommitteeMemberModal = (member: CommitteeMember) => {
  selectedCommitteeMember.value = member
  committeeMemberModalOpen.value = true
}

const closeCommitteeMemberModal = () => {
  committeeMemberModalOpen.value = false
  selectedCommitteeMember.value = null
}

const getCommitteeMemberViewProfileAriaLabel = (fullName: string) =>
  `${t('committees.viewProfile')}: ${fullName}`
</script>

<template>
  <div>
    <UContainer class="py-8 sm:py-12">
      <header class="mb-8 text-center sm:mb-12">
        <h1 class="text-3xl font-bold sm:text-4xl">{{ t('sectorialCommitteePage.title') }}</h1>
        <p class="text-muted mx-auto mt-3 max-w-3xl text-lg">
          {{ committeeIntro }}
        </p>
      </header>

      <div v-if="pending" class="space-y-12" aria-hidden="true">
        <section class="space-y-4">
          <USkeleton class="h-8 w-72 rounded" />
          <USkeleton class="h-4 w-96 rounded" />
          <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <USkeleton v-for="n in 4" :key="`sectorial-skeleton-${n}`" class="h-48 rounded-xl" />
          </div>
        </section>

        <section class="space-y-4">
          <USkeleton class="h-8 w-48 rounded" />
          <USkeleton class="h-4 w-72 rounded" />
          <div class="flex flex-wrap justify-center gap-6">
            <USkeleton v-for="n in 3" :key="`team-skeleton-${n}`" class="h-64 w-72 rounded-xl" />
          </div>
        </section>
      </div>

      <div v-else-if="hasLoadError" class="mb-6 space-y-3">
        <UAlert
          color="error"
          variant="soft"
          icon="i-tabler-alert-triangle"
          :title="t('sectorialCommitteePage.loadError')"
        />
        <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refreshData()">
          {{ t('home.retry') }}
        </UButton>
      </div>

      <template v-else>
        <section id="sectoriales-list" aria-labelledby="sectoriales-heading" class="mt-2">
          <h2
            id="sectoriales-heading"
            class="border-primary mb-6 border-b-2 pb-2 text-2xl font-semibold"
          >
            {{ t('members.sectoriales.title') }}
            <span class="text-muted text-lg font-normal">({{ allSectoriales.length }})</span>
          </h2>
          <p class="text-muted mb-6 text-sm">{{ t('members.sectoriales.description') }}</p>

          <div
            v-if="allSectoriales.length === 0"
            class="bg-surface/50 ring-default flex flex-col items-center justify-center rounded-xl p-8 text-center ring-1"
          >
            <UIcon name="i-tabler-users-group" class="text-muted mb-4 size-12" />
            <p class="text-muted">{{ t('members.sectoriales.noSectoriales') }}</p>
          </div>

          <TransitionGroup
            v-else
            key="sectoriales"
            appear
            tag="div"
            name="stagger-list"
            class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            <MembersOrganizationCard
              v-for="(sectorial, index) in allSectoriales"
              :key="sectorial.id"
              :logo-light="resolvedSectorialLogos.get(sectorial.id)?.logoLight ?? null"
              :logo-dark="resolvedSectorialLogos.get(sectorial.id)?.logoDark ?? null"
              :image-alt="getSectorialImageAlt(sectorial)"
              :title="getSectorialDenominationLabel(sectorial)"
              :initials="sectorial.initials"
              :details-aria-label="getSectorialDetailsAriaLabel(sectorial)"
              :animation-style="getMemberAnimationStyle(index)"
              @click="openSectorialModal(sectorial)"
            />
          </TransitionGroup>
        </section>

        <section id="team-list" aria-labelledby="team-heading" class="mt-14">
          <h2 id="team-heading" class="border-primary mb-6 border-b-2 pb-2 text-2xl font-semibold">
            {{ t('team.title') }}
            <span class="text-muted text-lg font-normal">({{ committeeMembers.length }})</span>
          </h2>
          <p class="text-muted mb-6 text-sm">
            {{ t('sectorialCommitteePage.teamDescription', { committee: committeeTitle }) }}
          </p>

          <UAlert
            v-if="!sectorialCommittee"
            color="warning"
            variant="soft"
            icon="i-tabler-alert-circle"
            :title="t('sectorialCommitteePage.committeeNotFound')"
          />

          <div
            v-else-if="committeeMembers.length === 0"
            class="flex flex-col items-center py-8 text-center"
          >
            <UIcon name="i-tabler-users-group" class="text-muted mb-2 size-10" />
            <p class="text-muted text-sm">{{ t('committees.noMembers') }}</p>
          </div>

          <TransitionGroup
            v-else
            appear
            tag="div"
            name="stagger-list"
            class="flex flex-wrap justify-center gap-6"
          >
            <TeamMemberCard
              v-for="(member, index) in committeeMembers"
              :key="`committee-member-${index}`"
              :member="{ ...member, publicAgenda: false }"
              :display-name="getMemberDisplayName(member)"
              :view-profile-aria-label="
                getCommitteeMemberViewProfileAriaLabel(getMemberDisplayName(member))
              "
              :entrance-delay="getEntranceDelayStyle(index, 70)"
              @click-card="openCommitteeMemberModal(member)"
            />
          </TransitionGroup>
        </section>
      </template>
    </UContainer>

    <UModal
      v-model:open="sectorialModalOpen"
      :ui="organizationModalUi"
      :title="t('members.memberModalTitle')"
      @close="closeSectorialModal"
    >
      <template #body>
        <MembersOrganizationDetailModal
          v-if="selectedSectorialDetailData"
          v-bind="selectedSectorialDetailData"
          @close="closeSectorialModal"
        />
      </template>
    </UModal>

    <UModal
      v-model:open="committeeMemberModalOpen"
      :ui="committeeModalUi"
      :title="t('team.memberModalTitle')"
      @close="closeCommitteeMemberModal"
    >
      <template #body>
        <TeamPersonModal
          v-if="selectedCommitteeMember"
          :member="selectedCommitteeMember"
          :display-name="getMemberDisplayName(selectedCommitteeMember)"
          :contact-email="getContactEmail(selectedCommitteeMember)"
          @close="closeCommitteeMemberModal"
        />
      </template>
    </UModal>
  </div>
</template>
