<script setup lang="ts">
import { detailModalUi } from '@/utils/detailModalUi'

const { t } = useI18n()
const localePath = useLocalePath()

usePageSeo('members.title', 'members.description', {
  webPageType: 'CollectionPage',
  breadcrumbs: () => [
    {
      name: t('nav.home'),
      path: localePath('/'),
    },
    {
      name: t('nav.about.members'),
      path: localePath('/conocenos/miembros'),
    },
  ],
})

const { allMembers, allSectoriales, pending, error } = await useMembersPageData()
const { buildMemberDetailData, buildSectorialDetailData } = useOrganizationDetailData()

const communityQuery = useSyncedQueryParam<string | null>('community', {
  parse: (rawValue) => rawValue,
  serialize: (value) => value ?? null,
})
const {
  communityFilters,
  filteredMembers,
  getCommunityLabel,
  getMemberAnimationStyle,
  getMemberDenominationLabel,
  getMemberDetailsAriaLabel,
  getMemberImageAlt,
  getMemberUniversityLabel,
  getSectorialDenominationLabel,
  getSectorialDetailsAriaLabel,
  getSectorialImageAlt,
  handleCommunitySelect,
  memberCounts,
  resolvedMemberLogos,
  resolvedSectorialLogos,
  sectionTitle,
  selectedCommunity: selectedCommunityState,
} = useMembersDirectory({
  members: allMembers,
  sectoriales: allSectoriales,
  selectedCommunity: computed<string | null>({
    get: () => {
      const selected = communityQuery.value
      if (!selected) {
        return null
      }

      return communityFilters.value.some((filter) => filter.slug === selected) ? selected : null
    },
    set: (value) => {
      communityQuery.value = value
    },
  }),
})

const selectedCommunity = selectedCommunityState
const selectedMember = ref<(typeof allMembers.value)[number] | null>(null)
const selectedSectorial = ref<(typeof allSectoriales.value)[number] | null>(null)
const organizationModalOpen = ref(false)
const organizationModalUi = detailModalUi

const selectedOrganizationDetailData = computed(() => {
  if (selectedMember.value) {
    return buildMemberDetailData(selectedMember.value)
  }

  if (selectedSectorial.value) {
    return buildSectorialDetailData(selectedSectorial.value)
  }

  return null
})

const openMemberModal = (member: (typeof allMembers.value)[number]) => {
  selectedMember.value = member
  selectedSectorial.value = null
  organizationModalOpen.value = true
}

const openSectorialModal = (sectorial: (typeof allSectoriales.value)[number]) => {
  selectedMember.value = null
  selectedSectorial.value = sectorial
  organizationModalOpen.value = true
}

const closeOrganizationModal = () => {
  organizationModalOpen.value = false
  selectedMember.value = null
  selectedSectorial.value = null
}

watch(
  [communityQuery, communityFilters],
  ([community, filters]) => {
    if (community && !filters.some((filter) => filter.slug === community)) {
      communityQuery.value = null
    }
  },
  { immediate: true }
)

const membersContainerRef = ref<HTMLElement | null>(null)
let cleanupMembersTransition: (() => void) | null = null

watch(filteredMembers, async (_, __, onCleanup) => {
  cleanupMembersTransition?.()
  cleanupMembersTransition = null

  const el = membersContainerRef.value
  if (!el) return

  const startHeight = el.offsetHeight

  await nextTick()

  if (membersContainerRef.value !== el) return

  el.style.height = 'auto'
  const endHeight = el.offsetHeight

  if (startHeight === endHeight) return

  el.style.overflow = 'hidden'
  el.style.height = `${startHeight}px`
  void el.offsetHeight

  let onEnd: (() => void) | null = null
  const cleanup = () => {
    el.style.height = ''
    el.style.overflow = ''
    el.style.transition = ''

    if (onEnd) {
      el.removeEventListener('transitionend', onEnd)
    }

    if (cleanupMembersTransition === cleanup) {
      cleanupMembersTransition = null
    }
  }

  onEnd = () => {
    cleanup()
  }

  cleanupMembersTransition = cleanup
  el.style.transition = 'height 350ms ease-out'
  el.style.height = `${endHeight}px`
  el.addEventListener('transitionend', onEnd)
  onCleanup(cleanup)
})

onBeforeUnmount(() => {
  cleanupMembersTransition?.()
})
</script>

<template>
  <div>
    <UContainer class="py-8 sm:py-12">
      <header class="mb-8 text-center sm:mb-12">
        <h1 class="text-3xl font-bold sm:text-4xl">{{ t('members.title') }}</h1>
        <p class="text-muted mt-3 text-lg">{{ t('members.description') }}</p>
      </header>

      <section class="mb-10">
        <div class="bg-surface/50 ring-default rounded-xl p-5 ring-1 sm:p-6">
          <p class="mb-4 text-base leading-relaxed">{{ t('members.introText') }}</p>
          <ul class="space-y-4 text-sm leading-relaxed">
            <li>
              <p class="mb-2">
                <span class="font-medium">1.</span>
                {{ t('members.introAssociated') }}
              </p>
              <UButton to="#members-list" size="xs" variant="soft" icon="i-tabler-arrow-down">
                {{ t('members.introAssociatedCta') }}
              </UButton>
            </li>
            <li>
              <p class="mb-2">
                <span class="font-medium">2.</span>
                {{ t('members.introSectoriales') }}
              </p>
              <UButton to="#sectoriales-list" size="xs" variant="soft" icon="i-tabler-arrow-down">
                {{ t('members.introSectorialesCta') }}
              </UButton>
            </li>
          </ul>
        </div>
      </section>

      <UAlert
        v-if="error"
        class="mb-6"
        color="error"
        variant="soft"
        icon="i-tabler-alert-triangle"
        :title="t('members.loadError')"
      />

      <div v-if="pending" class="space-y-10" aria-hidden="true">
        <section class="space-y-6">
          <div class="space-y-4">
            <USkeleton class="h-8 w-56 rounded" />
            <USkeleton class="h-4 w-80 rounded" />
          </div>

          <div class="bg-surface/50 ring-default space-y-5 rounded-xl p-4 ring-1 sm:p-6">
            <div class="space-y-2">
              <USkeleton class="h-4 w-52 rounded" />
              <USkeleton class="h-7 w-72 rounded" />
            </div>

            <USkeleton class="aspect-16/10 w-full rounded-xl" />
          </div>

          <div class="space-y-4">
            <USkeleton class="h-7 w-64 rounded" />
          </div>

          <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <USkeleton v-for="n in 6" :key="n" class="h-48 rounded-xl" />
          </div>
        </section>
      </div>

      <template v-else-if="!error">
        <section aria-labelledby="associated-heading">
          <h2
            id="associated-heading"
            class="border-primary mb-6 border-b-2 pb-2 text-2xl font-semibold"
          >
            {{ t('members.associatedTitle') }}
            <span class="text-muted text-lg font-normal">({{ allMembers.length }})</span>
          </h2>
          <p class="text-muted mb-6 text-sm">{{ t('members.associatedDescription') }}</p>

          <MembersDirectoryMapPanel
            :selected-community="selectedCommunity"
            :member-counts="memberCounts"
            :community-filters="communityFilters"
            @select="handleCommunitySelect"
          />

          <section id="members-list" aria-labelledby="members-heading" class="mt-10">
            <h3 id="members-heading" class="mb-6 pb-2 text-xl font-semibold">
              {{ sectionTitle }}
              <span class="text-muted text-lg font-normal">({{ filteredMembers.length }})</span>
            </h3>

            <div ref="membersContainerRef">
              <div
                v-if="filteredMembers.length === 0"
                class="bg-surface/50 ring-default flex flex-col items-center justify-center rounded-xl p-8 text-center ring-1"
              >
                <UIcon name="i-tabler-users-group" class="text-muted mb-4 size-12" />
                <p class="text-muted">{{ t('members.noMembers') }}</p>
              </div>

              <TransitionGroup
                v-else
                :key="selectedCommunity ?? 'all'"
                appear
                tag="div"
                name="stagger-list"
                class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
              >
                <MembersOrganizationCard
                  v-for="(member, index) in filteredMembers"
                  :key="member.id"
                  :logo-light="resolvedMemberLogos.get(member.id)?.logoLight ?? null"
                  :logo-dark="resolvedMemberLogos.get(member.id)?.logoDark ?? null"
                  :image-alt="getMemberImageAlt(member)"
                  :title="getMemberUniversityLabel(member)"
                  :subtitle="getMemberDenominationLabel(member)"
                  :initials="member.initials"
                  :community-label="
                    getCommunityLabel(member.autonomousCommunity, member.autonomousCommunityName)
                  "
                  :details-aria-label="getMemberDetailsAriaLabel(member)"
                  :animation-style="getMemberAnimationStyle(index)"
                  @click="openMemberModal(member)"
                />
              </TransitionGroup>
            </div>
          </section>
        </section>
      </template>
    </UContainer>

    <UContainer class="pb-8 sm:pb-12">
      <template v-if="!pending && !error">
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
      </template>

      <div v-else-if="pending" class="mt-2 space-y-8" aria-hidden="true">
        <div class="space-y-4">
          <USkeleton class="h-8 w-64 rounded" />
          <USkeleton class="h-4 w-96 rounded" />
        </div>
        <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <USkeleton v-for="n in 4" :key="n" class="h-48 rounded-xl" />
        </div>
      </div>
    </UContainer>

    <UModal
      v-model:open="organizationModalOpen"
      :ui="organizationModalUi"
      :title="t('members.memberModalTitle')"
      @close="closeOrganizationModal"
    >
      <template #body>
        <MembersOrganizationDetailModal
          v-if="selectedOrganizationDetailData"
          v-bind="selectedOrganizationDetailData"
          @close="closeOrganizationModal"
        />
      </template>
    </UModal>
  </div>
</template>
