<script setup lang="ts">
import { useAutoAnimate } from '@formkit/auto-animate/vue'
import { SPAIN_REGION_PATHS } from '@/components/members/spainRegions'
import {
  getEmailData as resolveEmailData,
  getSocialButtons as resolveSocialButtons,
  getWebsiteData as resolveWebsiteData,
  type SocialNetworkEntry,
} from '~~/shared/utils/social'

const { t, locale } = useI18n()
const { getLanguageTag } = useLocales()
const localeApiHeaders = useLocaleApiHeaders()
const colorMode = useColorMode()
const hasMounted = ref(false)
const { copyToClipboard } = useCopyToClipboard()
const { getCopyEmailAriaLabel } = usePersonHelpers()

onMounted(() => {
  hasMounted.value = true
})

usePageSeo('members.title', 'members.description')

type SocialNetwork = SocialNetworkEntry

interface OrganizationMember {
  id: string
  slug: string
  order: number
  denomination: string
  initials: string
  university: string
  autonomousCommunity: string
  autonomousCommunityName: string
  description: string | null
  logoLight: string | null
  logoDark: string | null
  socialNetworks: SocialNetwork[]
}

interface MembersResponse {
  members: OrganizationMember[]
  generatedAt?: string | null
}

interface SectorialMember {
  id: string
  order: number
  denomination: string
  initials: string
  description: string | null
  logoLight: string | null
  logoDark: string | null
  socialNetworks: SocialNetwork[]
}

interface SectorialesResponse {
  sectoriales: SectorialMember[]
  generatedAt?: string | null
}

interface SocialEntity {
  socialNetworks: SocialNetwork[]
  logoLight: string | null
  logoDark: string | null
}

const getCommunityLabel = (community: string, fallback?: string) => {
  const key = `members.communities.${community}`
  const translated = t(key)
  return translated === key ? (fallback ?? community) : translated
}

const getWebsiteData = (entity: SocialEntity) => resolveWebsiteData(entity.socialNetworks)

const getEmailData = (entity: SocialEntity) => resolveEmailData(entity.socialNetworks)

const getSocialButtons = (entity: SocialEntity) => resolveSocialButtons(entity.socialNetworks)

const getEntityLogo = (entity: SocialEntity) => {
  const preferredLogo =
    hasMounted.value && colorMode.value === 'dark'
      ? (entity.logoDark ?? entity.logoLight)
      : (entity.logoLight ?? entity.logoDark)

  if (!preferredLogo || failedLogos.value.has(preferredLogo)) {
    return null
  }

  return preferredLogo
}

const getMemberUniversityLabel = (member: OrganizationMember) =>
  member.university || t('members.unknownUniversity')

const getMemberDenominationLabel = (member: OrganizationMember) =>
  member.denomination || t('members.unknownDenomination')

const getMemberImageAlt = (member: OrganizationMember) =>
  `${getMemberUniversityLabel(member)}, ${getMemberDenominationLabel(member)}`
const getMemberDetailsAriaLabel = (member: OrganizationMember) =>
  `${t('members.viewDetails')}: ${getMemberImageAlt(member)}`

const normalizeComparable = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

const isUniversidadGranada = (value: string) => {
  const normalized = normalizeComparable(value)
  return normalized === 'universidaddegranada' || normalized === 'universityofgranada'
}

const [{ data, error }, { data: sectorialesData }] = await Promise.all([
  useFetch<MembersResponse>('/api/members', {
    headers: localeApiHeaders,
  }),
  useFetch<SectorialesResponse>('/api/sectoriales', {
    headers: localeApiHeaders,
  }),
])

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode === 404 ? 404 : 503,
    fatal: true,
    message: error.value.statusCode === 404 ? t('error.notFound') : t('members.loadError'),
  })
}

const allMembers = computed(() => data.value?.members ?? [])
const allSectoriales = computed(() => sectorialesData.value?.sectoriales ?? [])

const selectedCommunity = ref<string | null>(null)

const filteredMembers = computed(() => {
  if (!selectedCommunity.value) {
    return allMembers.value
  }

  if (selectedCommunity.value === 'ceuta' || selectedCommunity.value === 'melilla') {
    return allMembers.value.filter((member: OrganizationMember) =>
      isUniversidadGranada(member.university)
    )
  }

  return allMembers.value.filter(
    (member: OrganizationMember) => member.autonomousCommunity === selectedCommunity.value
  )
})

const memberCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const member of allMembers.value) {
    counts[member.autonomousCommunity] = (counts[member.autonomousCommunity] ?? 0) + 1
  }

  const hasGranada = allMembers.value.some((member: OrganizationMember) =>
    isUniversidadGranada(member.university)
  )
  const ceutaAndMelillaCount = hasGranada ? 1 : 0
  counts.ceuta = ceutaAndMelillaCount
  counts.melilla = ceutaAndMelillaCount

  return counts
})

const handleCommunitySelect = (community: string | null) => {
  selectedCommunity.value = community
}

const mapCommunities = Array.from(new Set(SPAIN_REGION_PATHS.map((region) => region.community)))

const communityFilters = computed(() =>
  mapCommunities
    .map((community) => ({
      slug: community,
      label: getCommunityLabel(community),
      count: memberCounts.value[community] ?? 0,
    }))
    .filter((community) => community.count > 0)
    .sort((a, b) => a.label.localeCompare(b.label, getLanguageTag(locale.value)))
)

const [mapActionsRef] = useAutoAnimate()

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

const selectedMember = ref<OrganizationMember | null>(null)
const modalOpen = ref(false)
const failedLogos = ref(new Set<string>())

const handleLogoError = (logoSrc: string | null) => {
  if (!logoSrc) {
    return
  }

  failedLogos.value.add(logoSrc)
}

const openMemberModal = (member: OrganizationMember) => {
  selectedMember.value = member
  modalOpen.value = true
}

const closeMemberModal = () => {
  modalOpen.value = false
  selectedMember.value = null
}

const selectedSectorial = ref<SectorialMember | null>(null)
const sectorialModalOpen = ref(false)

const openSectorialModal = (sectorial: SectorialMember) => {
  selectedSectorial.value = sectorial
  sectorialModalOpen.value = true
}

const closeSectorialModal = () => {
  sectorialModalOpen.value = false
  selectedSectorial.value = null
}

const getSectorialDenominationLabel = (sectorial: SectorialMember) =>
  sectorial.denomination || t('members.unknownDenomination')

const getSectorialImageAlt = (sectorial: SectorialMember) =>
  getSectorialDenominationLabel(sectorial)
const getSectorialDetailsAriaLabel = (sectorial: SectorialMember) =>
  `${t('members.sectoriales.viewDetails')}: ${getSectorialImageAlt(sectorial)}`
const copyEmail = (email: string) => copyToClipboard(email, t('common.emailCopied'))

const sectionTitle = computed(() => {
  if (!selectedCommunity.value) {
    return t('members.allMembers')
  }

  return t('members.membersIn', {
    community: getCommunityLabel(selectedCommunity.value),
  })
})

const getMemberAnimationStyle = (index: number) => {
  const step = 50
  const maxDelay = 450

  const enterDelay = Math.min(index * step, maxDelay)

  return {
    '--member-enter-delay': `${Math.max(0, enterDelay)}ms`,
  }
}

// Resolve logo once per entity to avoid calling getEntityLogo multiple times per render.
// Keys are entity IDs; values are the resolved logo URL (or null).
const resolvedMemberLogos = computed(() => {
  const map = new Map<string, string | null>()
  for (const member of allMembers.value) {
    map.set(member.id, getEntityLogo(member))
  }
  return map
})

const resolvedSectorialLogos = computed(() => {
  const map = new Map<string, string | null>()
  for (const sectorial of allSectoriales.value) {
    map.set(sectorial.id, getEntityLogo(sectorial))
  }
  return map
})

const selectedMemberModalData = computed(() => {
  if (!selectedMember.value) {
    return null
  }

  const member = selectedMember.value
  const website = getWebsiteData(member)
  const email = getEmailData(member)

  return {
    eyebrow: getMemberUniversityLabel(member),
    heading: getMemberDenominationLabel(member),
    aboutTitle: t('members.descriptionLabel'),
    imageAlt: getMemberImageAlt(member),
    description: member.description,
    initials: member.initials,
    communityLabel: getCommunityLabel(member.autonomousCommunity, member.autonomousCommunityName),
    logoSrc: resolvedMemberLogos.value.get(member.id) ?? null,
    website,
    email,
    socialButtons: getSocialButtons(member),
    copyEmailAriaLabel: email ? getCopyEmailAriaLabel(email.email) : null,
  }
})

const selectedSectorialModalData = computed(() => {
  if (!selectedSectorial.value) {
    return null
  }

  const sectorial = selectedSectorial.value
  const website = getWebsiteData(sectorial)
  const email = getEmailData(sectorial)

  return {
    eyebrow: t('members.sectoriales.title'),
    heading: getSectorialDenominationLabel(sectorial),
    aboutTitle: t('members.descriptionLabel'),
    imageAlt: getSectorialImageAlt(sectorial),
    description: sectorial.description,
    initials: sectorial.initials,
    communityLabel: null,
    logoSrc: resolvedSectorialLogos.value.get(sectorial.id) ?? null,
    website,
    email,
    socialButtons: getSocialButtons(sectorial),
    copyEmailAriaLabel: email ? getCopyEmailAriaLabel(email.email) : null,
  }
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

        <section aria-labelledby="map-heading">
          <h3 id="map-heading" class="sr-only">{{ t('members.selectCommunity') }}</h3>
          <div
            class="bg-surface/50 rounded-xl p-4 ring-1 ring-gray-200/50 sm:p-6 dark:ring-gray-800/50"
          >
            <div class="mb-5 space-y-3 border-b border-gray-200/60 pb-4 dark:border-gray-800/60">
              <div
                class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs"
                :aria-label="t('members.mapLegendLabel')"
              >
                <span class="inline-flex items-center gap-2">
                  <span class="h-3 w-3 rounded-full bg-red-600" aria-hidden="true" />
                  {{ t('members.mapLegendSelected') }}
                </span>
                <span class="inline-flex items-center gap-2">
                  <span class="h-3 w-3 rounded-full bg-red-200" aria-hidden="true" />
                  {{ t('members.mapLegendActive') }}
                </span>
                <span class="inline-flex items-center gap-2">
                  <span class="h-3 w-3 rounded-full bg-gray-300" aria-hidden="true" />
                  {{ t('members.mapLegendInactive') }}
                </span>
              </div>
            </div>

            <LazyMembersSpainMap
              :selected-community="selectedCommunity"
              :member-counts="memberCounts"
              @select="handleCommunitySelect"
            />

            <div ref="mapActionsRef" class="mt-6 space-y-4">
              <div v-if="communityFilters.length" class="space-y-3">
                <p class="text-muted text-sm font-medium">{{ t('members.mapFilterTitle') }}</p>
                <div class="flex flex-wrap gap-2">
                  <UButton
                    v-for="community in communityFilters"
                    :key="community.slug"
                    type="button"
                    size="sm"
                    :color="selectedCommunity === community.slug ? 'primary' : 'neutral'"
                    :variant="selectedCommunity === community.slug ? 'solid' : 'outline'"
                    :aria-pressed="selectedCommunity === community.slug"
                    @click="
                      handleCommunitySelect(
                        selectedCommunity === community.slug ? null : community.slug
                      )
                    "
                  >
                    {{ community.label }} ({{ community.count }})
                  </UButton>
                </div>
              </div>

              <div class="flex flex-wrap items-center justify-center gap-3">
                <UButton
                  v-if="selectedCommunity"
                  variant="soft"
                  icon="i-tabler-map"
                  @click="handleCommunitySelect(null)"
                >
                  {{ t('members.showAll') }}
                </UButton>

                <UButton
                  variant="ghost"
                  color="neutral"
                  icon="i-tabler-list-search"
                  to="#members-list"
                >
                  {{ t('members.skipMap') }}
                </UButton>
              </div>
            </div>
          </div>
        </section>

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
                :logo-src="resolvedMemberLogos.get(member.id) ?? null"
                :image-alt="getMemberImageAlt(member)"
                :title="getMemberUniversityLabel(member)"
                :subtitle="getMemberDenominationLabel(member)"
                :initials="member.initials"
                :community-label="
                  getCommunityLabel(member.autonomousCommunity, member.autonomousCommunityName)
                "
                :aria-label="getMemberDetailsAriaLabel(member)"
                :animation-style="getMemberAnimationStyle(index)"
                @click="openMemberModal(member)"
                @logo-error="handleLogoError"
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
            :logo-src="resolvedSectorialLogos.get(sectorial.id) ?? null"
            :image-alt="getSectorialImageAlt(sectorial)"
            :title="getSectorialDenominationLabel(sectorial)"
            :initials="sectorial.initials"
            :aria-label="getSectorialDetailsAriaLabel(sectorial)"
            :animation-style="getMemberAnimationStyle(index)"
            @click="openSectorialModal(sectorial)"
            @logo-error="handleLogoError"
          />
        </TransitionGroup>
      </section>
    </UContainer>

    <UModal
      v-model:open="modalOpen"
      :title="
        selectedMember
          ? `${getMemberUniversityLabel(selectedMember)} · ${getMemberDenominationLabel(selectedMember)}`
          : undefined
      "
      :description="t('members.memberModalDescription')"
      :ui="{ content: 'sm:max-w-5xl' }"
      @close="closeMemberModal"
    >
      <template #body>
        <MembersOrganizationDetailModal
          v-if="selectedMemberModalData"
          v-bind="selectedMemberModalData"
          @copy-email="copyEmail"
          @logo-error="handleLogoError"
        />
      </template>
    </UModal>

    <UModal
      v-model:open="sectorialModalOpen"
      :title="selectedSectorial ? getSectorialDenominationLabel(selectedSectorial) : undefined"
      :description="t('members.memberModalDescription')"
      :ui="{ content: 'sm:max-w-5xl' }"
      @close="closeSectorialModal"
    >
      <template #body>
        <MembersOrganizationDetailModal
          v-if="selectedSectorialModalData"
          v-bind="selectedSectorialModalData"
          @copy-email="copyEmail"
          @logo-error="handleLogoError"
        />
      </template>
    </UModal>
  </div>
</template>
