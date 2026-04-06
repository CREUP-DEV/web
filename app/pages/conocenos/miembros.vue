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
  useFetch<MembersResponse>('/api/members'),
  useFetch<SectorialesResponse>('/api/sectoriales'),
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

type OrganizationModalData = {
  eyebrow: string
  heading: string
  aboutTitle: string
  imageAlt: string
  description: string | null
  initials: string | null
  communityLabel: string | null
  logoSrc: string | null
  website: ReturnType<typeof getWebsiteData>
  email: ReturnType<typeof getEmailData>
  socialButtons: ReturnType<typeof getSocialButtons>
  copyEmailAriaLabel: string | null
}

const buildOrganizationModalData = (
  entity: SocialEntity,
  options: {
    eyebrow: string
    heading: string
    aboutTitle: string
    imageAlt: string
    description?: string | null
    initials?: string | null
    communityLabel?: string | null
  }
): OrganizationModalData => {
  const website = getWebsiteData(entity)
  const email = getEmailData(entity)

  return {
    eyebrow: options.eyebrow,
    heading: options.heading,
    aboutTitle: options.aboutTitle,
    imageAlt: options.imageAlt,
    description: options.description ?? null,
    initials: options.initials ?? null,
    communityLabel: options.communityLabel ?? null,
    logoSrc: getEntityLogo(entity),
    website,
    email,
    socialButtons: getSocialButtons(entity),
    copyEmailAriaLabel: email ? getCopyEmailAriaLabel(email.email) : null,
  }
}

const selectedMemberModalData = computed(() => {
  if (!selectedMember.value) {
    return null
  }

  const member = selectedMember.value

  return buildOrganizationModalData(member, {
    eyebrow: getMemberUniversityLabel(member),
    heading: getMemberDenominationLabel(member),
    aboutTitle: t('members.descriptionLabel'),
    imageAlt: getMemberImageAlt(member),
    description: member.description,
    initials: member.initials,
    communityLabel: getCommunityLabel(member.autonomousCommunity, member.autonomousCommunityName),
  })
})

const selectedSectorialModalData = computed(() => {
  if (!selectedSectorial.value) {
    return null
  }

  const sectorial = selectedSectorial.value

  return buildOrganizationModalData(sectorial, {
    eyebrow: t('members.sectoriales.title'),
    heading: getSectorialDenominationLabel(sectorial),
    aboutTitle: t('members.descriptionLabel'),
    imageAlt: getSectorialImageAlt(sectorial),
    description: sectorial.description,
    initials: sectorial.initials,
  })
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
              <button
                v-for="(member, index) in filteredMembers"
                :key="member.id"
                class="motion-card-strong group bg-surface/50 hover:bg-surface rounded-2xl p-5 ring-1 ring-gray-200/50 sm:p-6 dark:ring-gray-800/50"
                :style="getMemberAnimationStyle(index)"
                type="button"
                :aria-label="getMemberDetailsAriaLabel(member)"
                @click="openMemberModal(member)"
              >
                <div class="flex items-start gap-4">
                  <div
                    class="ring-primary/20 group-hover:ring-primary/40 flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-2 transition-all dark:bg-gray-800"
                  >
                    <NuxtImg
                      v-if="getEntityLogo(member)"
                      :src="getEntityLogo(member)!"
                      :alt="getMemberImageAlt(member)"
                      class="size-full object-contain p-2"
                      @error="handleLogoError(getEntityLogo(member))"
                    />
                    <UIcon v-else name="i-tabler-building" class="text-muted size-10" />
                  </div>

                  <div class="min-w-0 flex-1">
                    <h3 class="text-base leading-tight font-semibold sm:text-lg">
                      {{ getMemberUniversityLabel(member) }}
                    </h3>
                    <p class="text-muted mt-2 text-sm leading-snug">
                      {{ getMemberDenominationLabel(member) }}
                    </p>
                    <div class="mt-3 flex flex-wrap items-center justify-center gap-2">
                      <UBadge
                        v-if="member.initials"
                        size="sm"
                        color="neutral"
                        variant="soft"
                        class="px-2 py-0.5 text-xs font-semibold"
                      >
                        {{ member.initials }}
                      </UBadge>
                      <UBadge
                        size="sm"
                        color="neutral"
                        variant="outline"
                        class="px-2 py-0.5 text-xs font-semibold"
                      >
                        {{
                          getCommunityLabel(
                            member.autonomousCommunity,
                            member.autonomousCommunityName
                          )
                        }}
                      </UBadge>
                    </div>
                  </div>

                  <UIcon
                    name="i-tabler-chevron-right"
                    class="text-muted group-hover:text-primary mt-1 size-5 shrink-0 transition-colors"
                  />
                </div>
              </button>
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
          <button
            v-for="(sectorial, index) in allSectoriales"
            :key="sectorial.id"
            class="motion-card-strong group bg-surface/50 hover:bg-surface rounded-2xl p-5 ring-1 ring-gray-200/50 sm:p-6 dark:ring-gray-800/50"
            :style="getMemberAnimationStyle(index)"
            type="button"
            :aria-label="getSectorialDetailsAriaLabel(sectorial)"
            @click="openSectorialModal(sectorial)"
          >
            <div class="flex items-start gap-4">
              <div
                class="ring-primary/20 group-hover:ring-primary/40 flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-2 transition-all dark:bg-gray-800"
              >
                <NuxtImg
                  v-if="getEntityLogo(sectorial)"
                  :src="getEntityLogo(sectorial)!"
                  :alt="getSectorialImageAlt(sectorial)"
                  class="size-full object-contain p-2"
                  @error="handleLogoError(getEntityLogo(sectorial))"
                />
                <UIcon v-else name="i-tabler-building" class="text-muted size-10" />
              </div>

              <div class="min-w-0 flex-1">
                <h3 class="text-base leading-tight font-semibold sm:text-lg">
                  {{ getSectorialDenominationLabel(sectorial) }}
                </h3>
                <div class="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <UBadge
                    v-if="sectorial.initials"
                    size="sm"
                    color="neutral"
                    variant="soft"
                    class="px-2 py-0.5 text-xs font-semibold"
                  >
                    {{ sectorial.initials }}
                  </UBadge>
                </div>
              </div>

              <UIcon
                name="i-tabler-chevron-right"
                class="text-muted group-hover:text-primary mt-1 size-5 shrink-0 transition-colors"
              />
            </div>
          </button>
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
