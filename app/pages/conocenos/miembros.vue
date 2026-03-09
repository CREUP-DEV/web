<script setup lang="ts">
/**
 * Members Page
 * Displays associated members grouped by autonomous community
 * and sectorial associations as a separate list.
 */

import { useAutoAnimate } from '@formkit/auto-animate/vue'

const { t } = useI18n()
const colorMode = useColorMode()
const hasMounted = ref(false)

onMounted(() => {
  hasMounted.value = true
})

useSeoMeta({
  title: () => t('members.title'),
  description: () => t('members.description'),
  ogTitle: () => t('members.title'),
  ogDescription: () => t('members.description'),
})

type SupportedSocialNetwork =
  | 'website'
  | 'email'
  | 'instagram'
  | 'twitter'
  | 'tiktok'
  | 'bluesky'
  | 'linkedin'
  | 'telegram'
  | 'discord'
  | 'facebook'
  | 'github'

interface SocialNetwork {
  network: SupportedSocialNetwork
  value: string
}

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

/**
 * Common shape shared by associated members and sectorial entities.
 * Used to type helper functions that work with social networks and logos.
 */
interface SocialEntity {
  socialNetworks: SocialNetwork[]
  logoLight: string | null
  logoDark: string | null
}

interface SocialButton {
  network: Exclude<SupportedSocialNetwork, 'website' | 'email'>
  href: string
}

const networkIcons: Record<SupportedSocialNetwork, string> = {
  website: 'i-tabler-world',
  email: 'i-tabler-mail',
  instagram: 'i-tabler-brand-instagram',
  twitter: 'i-tabler-brand-x',
  tiktok: 'i-tabler-brand-tiktok',
  bluesky: 'i-tabler-brand-bluesky',
  linkedin: 'i-tabler-brand-linkedin',
  telegram: 'i-tabler-brand-telegram',
  discord: 'i-tabler-brand-discord',
  facebook: 'i-tabler-brand-facebook',
  github: 'i-tabler-brand-github',
}

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value)

const cleanHandle = (value: string) => value.trim().replace(/^@/, '')

const buildSocialUrl = (network: SupportedSocialNetwork, rawValue: string) => {
  const value = rawValue.trim()
  if (!value) {
    return null
  }

  if (network === 'email') {
    return value.startsWith('mailto:') ? value : `mailto:${value}`
  }

  if (isAbsoluteUrl(value)) {
    return value
  }

  switch (network) {
    case 'website':
      return `https://${value}`
    case 'instagram':
      return `https://instagram.com/${cleanHandle(value)}`
    case 'twitter':
      return `https://x.com/${cleanHandle(value)}`
    case 'tiktok':
      return `https://www.tiktok.com/@${cleanHandle(value)}`
    case 'bluesky':
      return `https://bsky.app/profile/${cleanHandle(value)}`
    case 'linkedin':
      return `https://www.linkedin.com/${value.replace(/^\/+/, '')}`
    case 'telegram':
      return `https://t.me/${cleanHandle(value)}`
    case 'discord':
      return `https://discord.gg/${cleanHandle(value)}`
    case 'facebook':
      return `https://facebook.com/${cleanHandle(value)}`
    case 'github':
      return `https://github.com/${cleanHandle(value)}`
    default:
      return null
  }
}

const getCommunityLabel = (community: string, fallback?: string) => {
  const key = `members.communities.${community}`
  const translated = t(key)
  return translated === key ? (fallback ?? community) : translated
}

const getSocialByNetwork = (entity: SocialEntity, network: SupportedSocialNetwork) => {
  return entity.socialNetworks.find((socialNetwork) => socialNetwork.network === network)
}

const getWebsiteData = (entity: SocialEntity) => {
  const website = getSocialByNetwork(entity, 'website')
  if (!website) {
    return null
  }

  const href = buildSocialUrl('website', website.value)
  if (!href) {
    return null
  }

  return {
    href,
    label: website.value.replace(/^https?:\/\//i, ''),
  }
}

const getEmailData = (entity: SocialEntity) => {
  const email = getSocialByNetwork(entity, 'email')
  if (!email) {
    return null
  }

  const href = buildSocialUrl('email', email.value)
  if (!href) {
    return null
  }

  return {
    href,
    email: email.value.replace(/^mailto:/i, ''),
  }
}

const getSocialButtons = (entity: SocialEntity): SocialButton[] => {
  return entity.socialNetworks.flatMap((socialNetwork) => {
    if (socialNetwork.network === 'website' || socialNetwork.network === 'email') {
      return []
    }

    const href = buildSocialUrl(socialNetwork.network, socialNetwork.value)
    if (!href) {
      return []
    }

    return [{ network: socialNetwork.network, href }]
  })
}

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

const hasSocialButtons = (entity: SocialEntity) => getSocialButtons(entity).length > 0

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

const { data, error } = await useFetch<MembersResponse>('/api/members')

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode === 404 ? 404 : 503,
    fatal: true,
    message: error.value.statusMessage ?? '',
  })
}

const { data: sectorialesData } = await useFetch<SectorialesResponse>('/api/sectoriales')

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

const [mapActionsRef] = useAutoAnimate()

const membersContainerRef = ref<HTMLElement | null>(null)

/**
 * Smoothly animate the members container height when the filtered list changes,
 * so the sectoriales section below slides into its new position instead of jumping.
 */
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

const selectedSectorial = ref<SectorialMember | null>(null)
const sectorialModalOpen = ref(false)

const openSectorialModal = (sectorial: SectorialMember) => {
  selectedSectorial.value = sectorial
  sectorialModalOpen.value = true
}

const getSectorialDenominationLabel = (sectorial: SectorialMember) =>
  sectorial.denomination || t('members.unknownDenomination')

const getSectorialImageAlt = (sectorial: SectorialMember) =>
  getSectorialDenominationLabel(sectorial)
const getSectorialDetailsAriaLabel = (sectorial: SectorialMember) =>
  `${t('members.sectoriales.viewDetails')}: ${getSectorialImageAlt(sectorial)}`
const getCopyEmailAriaLabel = (email: string) => `${t('common.copyEmail')}: ${email}`

const toast = useToast()

const copyEmail = async (email: string) => {
  try {
    await navigator.clipboard.writeText(email)
    toast.add({
      title: t('common.emailCopied'),
      color: 'success',
    })
  } catch (copyError) {
    console.error('Error copying email:', copyError)
  }
}

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
            <LazyMembersSpainMap
              :selected-community="selectedCommunity"
              :member-counts="memberCounts"
              @select="handleCommunitySelect"
            />

            <div ref="mapActionsRef" class="mt-5 flex flex-wrap items-center justify-center gap-3">
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
              tag="div"
              name="members-seq"
              class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
            >
              <button
                v-for="(member, index) in filteredMembers"
                :key="member.id"
                class="group bg-surface/50 hover:bg-surface rounded-2xl p-5 ring-1 ring-gray-200/50 transition-all hover:shadow-lg sm:p-6 dark:ring-gray-800/50"
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
          tag="div"
          name="members-seq"
          class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          <button
            v-for="(sectorial, index) in allSectoriales"
            :key="sectorial.id"
            class="group bg-surface/50 hover:bg-surface rounded-2xl p-5 ring-1 ring-gray-200/50 transition-all hover:shadow-lg sm:p-6 dark:ring-gray-800/50"
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
      v-if="modalOpen && selectedMember"
      v-model:open="modalOpen"
      :title="getMemberUniversityLabel(selectedMember)"
      :description="t('members.memberModalDescription')"
    >
      <template #body>
        <div v-if="selectedMember" class="space-y-5">
          <div class="bg-surface/50 rounded-2xl p-4 ring-1 ring-gray-200/50 dark:ring-gray-800/50">
            <div class="grid gap-5 md:grid-cols-[minmax(0,200px)_minmax(0,1fr)] md:items-center">
              <div
                class="mx-auto flex h-44 w-44 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white ring-2 ring-gray-200 md:h-52 md:w-52 dark:bg-gray-800 dark:ring-gray-700"
              >
                <NuxtImg
                  v-if="getEntityLogo(selectedMember)"
                  :src="getEntityLogo(selectedMember)!"
                  :alt="getMemberImageAlt(selectedMember)"
                  class="size-full object-contain p-4"
                  @error="handleLogoError(getEntityLogo(selectedMember))"
                />
                <UIcon v-else name="i-tabler-building" class="text-muted size-12" />
              </div>

              <div class="min-w-0 text-center md:text-left">
                <h3 class="text-2xl leading-tight font-bold">
                  {{ getMemberDenominationLabel(selectedMember) }}
                </h3>

                <div class="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <UBadge
                    v-if="selectedMember.initials"
                    size="sm"
                    color="neutral"
                    variant="soft"
                    class="px-3 py-1 text-sm font-semibold"
                  >
                    {{ selectedMember.initials }}
                  </UBadge>
                  <UBadge size="sm" color="neutral" variant="outline" class="px-3 py-1 text-sm">
                    {{
                      getCommunityLabel(
                        selectedMember.autonomousCommunity,
                        selectedMember.autonomousCommunityName
                      )
                    }}
                  </UBadge>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="selectedMember.description"
            class="bg-surface/30 rounded-xl p-4 ring-1 ring-gray-200/50 dark:ring-gray-800/50"
          >
            <p class="text-sm leading-relaxed">{{ selectedMember.description }}</p>
          </div>

          <div class="space-y-4">
            <div
              v-if="getWebsiteData(selectedMember) || getEmailData(selectedMember)"
              class="rounded-xl p-4 ring-1 ring-gray-200/50 dark:ring-gray-800/50"
            >
              <h4 class="mb-3 text-sm font-semibold">
                {{ t('members.info') }}
              </h4>

              <div class="space-y-3">
                <div v-if="getWebsiteData(selectedMember)" class="flex items-center gap-3">
                  <UIcon :name="networkIcons.website" class="text-muted size-5 shrink-0" />
                  <a
                    :href="getWebsiteData(selectedMember)!.href"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-primary truncate hover:underline"
                  >
                    {{ getWebsiteData(selectedMember)!.label }}
                  </a>
                </div>

                <div v-if="getEmailData(selectedMember)" class="flex items-center gap-3">
                  <UIcon :name="networkIcons.email" class="text-muted size-5 shrink-0" />
                  <a
                    :href="getEmailData(selectedMember)!.href"
                    class="text-primary truncate hover:underline"
                  >
                    {{ getEmailData(selectedMember)!.email }}
                  </a>
                  <UButton
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    icon="i-tabler-copy"
                    :aria-label="getCopyEmailAriaLabel(getEmailData(selectedMember)!.email)"
                    @click.stop="copyEmail(getEmailData(selectedMember)!.email)"
                  />
                </div>
              </div>
            </div>

            <div
              v-if="hasSocialButtons(selectedMember)"
              class="rounded-xl p-4 ring-1 ring-gray-200/50 dark:ring-gray-800/50"
            >
              <h4 class="mb-3 text-sm font-semibold">{{ t('members.socialNetworks') }}</h4>
              <div class="flex flex-wrap gap-2">
                <UButton
                  v-for="socialNetwork in getSocialButtons(selectedMember)"
                  :key="`${socialNetwork.network}-${socialNetwork.href}`"
                  :to="socialNetwork.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  :icon="networkIcons[socialNetwork.network]"
                  color="neutral"
                  variant="soft"
                  size="sm"
                >
                  {{ t(`members.networks.${socialNetwork.network}`) }}
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <UModal
      v-if="sectorialModalOpen && selectedSectorial"
      v-model:open="sectorialModalOpen"
      :title="getSectorialDenominationLabel(selectedSectorial)"
      :description="t('members.memberModalDescription')"
    >
      <template #body>
        <div v-if="selectedSectorial" class="space-y-5">
          <div class="bg-surface/50 rounded-2xl p-4 ring-1 ring-gray-200/50 dark:ring-gray-800/50">
            <div class="grid gap-5 md:grid-cols-[minmax(0,200px)_minmax(0,1fr)] md:items-center">
              <div
                class="mx-auto flex h-44 w-44 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white ring-2 ring-gray-200 md:h-52 md:w-52 dark:bg-gray-800 dark:ring-gray-700"
              >
                <NuxtImg
                  v-if="getEntityLogo(selectedSectorial)"
                  :src="getEntityLogo(selectedSectorial)!"
                  :alt="getSectorialImageAlt(selectedSectorial)"
                  class="size-full object-contain p-4"
                  @error="handleLogoError(getEntityLogo(selectedSectorial))"
                />
                <UIcon v-else name="i-tabler-building" class="text-muted size-12" />
              </div>

              <div class="min-w-0 text-center md:text-left">
                <h3 class="text-2xl leading-tight font-bold">
                  {{ getSectorialDenominationLabel(selectedSectorial) }}
                </h3>

                <div class="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <UBadge
                    v-if="selectedSectorial.initials"
                    size="sm"
                    color="neutral"
                    variant="soft"
                    class="px-3 py-1 text-sm font-semibold"
                  >
                    {{ selectedSectorial.initials }}
                  </UBadge>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="selectedSectorial.description"
            class="bg-surface/30 rounded-xl p-4 ring-1 ring-gray-200/50 dark:ring-gray-800/50"
          >
            <p class="text-sm leading-relaxed">{{ selectedSectorial.description }}</p>
          </div>

          <div class="space-y-4">
            <div
              v-if="getWebsiteData(selectedSectorial) || getEmailData(selectedSectorial)"
              class="rounded-xl p-4 ring-1 ring-gray-200/50 dark:ring-gray-800/50"
            >
              <h4 class="mb-3 text-sm font-semibold">
                {{ t('members.info') }}
              </h4>

              <div class="space-y-3">
                <div v-if="getWebsiteData(selectedSectorial)" class="flex items-center gap-3">
                  <UIcon :name="networkIcons.website" class="text-muted size-5 shrink-0" />
                  <a
                    :href="getWebsiteData(selectedSectorial)!.href"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-primary truncate hover:underline"
                  >
                    {{ getWebsiteData(selectedSectorial)!.label }}
                  </a>
                </div>

                <div v-if="getEmailData(selectedSectorial)" class="flex items-center gap-3">
                  <UIcon :name="networkIcons.email" class="text-muted size-5 shrink-0" />
                  <a
                    :href="getEmailData(selectedSectorial)!.href"
                    class="text-primary truncate hover:underline"
                  >
                    {{ getEmailData(selectedSectorial)!.email }}
                  </a>
                  <UButton
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    icon="i-tabler-copy"
                    :aria-label="getCopyEmailAriaLabel(getEmailData(selectedSectorial)!.email)"
                    @click.stop="copyEmail(getEmailData(selectedSectorial)!.email)"
                  />
                </div>
              </div>
            </div>

            <div
              v-if="hasSocialButtons(selectedSectorial)"
              class="rounded-xl p-4 ring-1 ring-gray-200/50 dark:ring-gray-800/50"
            >
              <h4 class="mb-3 text-sm font-semibold">{{ t('members.socialNetworks') }}</h4>
              <div class="flex flex-wrap gap-2">
                <UButton
                  v-for="socialNetwork in getSocialButtons(selectedSectorial)"
                  :key="`${socialNetwork.network}-${socialNetwork.href}`"
                  :to="socialNetwork.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  :icon="networkIcons[socialNetwork.network]"
                  color="neutral"
                  variant="soft"
                  size="sm"
                >
                  {{ t(`members.networks.${socialNetwork.network}`) }}
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.members-seq-enter-active {
  transition:
    opacity 180ms ease-out,
    transform 180ms ease-out;
  transition-delay: var(--member-enter-delay, 0ms);
}

.members-seq-enter-from,
.members-seq-leave-to {
  opacity: 0;
  transform: scale(0.97);
  transform-origin: center;
}

.members-seq-leave-active {
  display: none;
}

.members-seq-move {
  transition: transform 120ms ease;
}
</style>
