<script setup lang="ts">
const { t } = useI18n()
const { copyToClipboard } = useCopyToClipboard()

usePageSeo('members.title', 'members.description')

const { allMembers, allSectoriales } = await useMembersPageData()
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
const organizationModalUi = {
  content: 'sm:max-w-5xl',
}

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

const copyEmail = (email: string) => copyToClipboard(email, t('common.emailCopied'))

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

watch(filteredMembers, async () => {
  const el = membersContainerRef.value
  if (!el) return

  const startHeight = el.offsetHeight

  await nextTick()

  el.style.height = 'auto'
  const endHeight = el.offsetHeight

  if (startHeight === endHeight) return

  el.style.overflow = 'hidden'
  el.style.height = `${startHeight}px`
  void el.offsetHeight

  el.style.transition = 'height 350ms ease-out'
  el.style.height = `${endHeight}px`

  const onEnd = () => {
    el.style.height = ''
    el.style.overflow = ''
    el.style.transition = ''
    el.removeEventListener('transitionend', onEnd)
  }
  el.addEventListener('transitionend', onEnd)
})
</script>

<template>
  <div>
    <UContainer class="py-8 sm:py-12">
      <header class="mb-8 text-center sm:mb-12">
        <h1 class="text-3xl font-bold sm:text-4xl">{{ t('members.title') }}</h1>
        <p class="text-muted mt-3 text-lg">{{ t('members.description') }}</p>
      </header>

      <section aria-labelledby="intro-heading" class="mb-10">
        <h2 id="intro-heading" class="sr-only">{{ t('members.title') }}</h2>
        <div
          class="bg-surface/50 rounded-xl p-5 ring-1 ring-gray-200/50 sm:p-6 dark:ring-gray-800/50"
        >
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
              class="bg-surface/50 flex flex-col items-center justify-center rounded-xl p-8 text-center ring-1 ring-gray-200/50 dark:ring-gray-800/50"
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
    </UContainer>

    <UContainer class="pb-8 sm:pb-12">
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
          class="bg-surface/50 flex flex-col items-center justify-center rounded-xl p-8 text-center ring-1 ring-gray-200/50 dark:ring-gray-800/50"
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
          @copy-email="copyEmail"
        />
      </template>
    </UModal>
  </div>
</template>
