<script setup lang="ts">
/**
 * Committees Page
 * Displays CREUP's committees with their members,
 * fetched dynamically from the external committees API.
 */

const { t, locale } = useI18n()

useSeoMeta({
  title: () => t('committees.title'),
  description: () => t('committees.description'),
  ogTitle: () => t('committees.title'),
  ogDescription: () => t('committees.description'),
})

// ============================================================================
// Types
// ============================================================================

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

// Enriched member type with committee context
interface EnrichedMember extends CommitteeMember {
  committeeName: string
  committeeId: number
}

// ============================================================================
// Data fetching
// ============================================================================

const { data, error } = await useFetch<CommitteesResponse>('/api/comites')

const committees = computed(() => data.value?.committees ?? [])

const getCommitteeName = (committee: Committee) =>
  committee.nameTranslations?.[locale.value] ?? committee.nameTranslations?.es ?? committee.name

const getCommitteeDescription = (committee: Committee) =>
  committee.descriptionTranslations?.[locale.value] ??
  committee.descriptionTranslations?.es ??
  committee.description ??
  ''

// ============================================================================
// Social network helpers
// ============================================================================

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
  if (!value) return null

  if (network === 'email') {
    return value.startsWith('mailto:') ? value : `mailto:${value}`
  }

  if (isAbsoluteUrl(value)) return value

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

interface SocialButton {
  network: Exclude<SupportedSocialNetwork, 'website' | 'email'>
  href: string
}

const getSocialButtons = (member: CommitteeMember): SocialButton[] => {
  return member.socialNetworks.flatMap((sn) => {
    if (sn.network === 'website' || sn.network === 'email') return []
    const href = buildSocialUrl(sn.network, sn.value)
    if (!href) return []
    return [{ network: sn.network as SocialButton['network'], href }]
  })
}

const getContactEmail = (member: CommitteeMember) => {
  const contactEmail = member.socialNetworks.find((sn) => sn.network === 'email')
  return (contactEmail?.value || member.email).replace(/^mailto:/i, '').trim()
}

const getFullName = (member: Pick<CommitteeMember, 'name' | 'surname'>) => {
  return [member.name, member.surname].filter(Boolean).join(' ').trim()
}
const getMemberDisplayName = (member: Pick<CommitteeMember, 'name' | 'surname' | 'email'>) =>
  getFullName(member) || member.email

const getViewProfileAriaLabel = (fullName: string) => `${t('committees.viewProfile')}: ${fullName}`
const getCopyEmailAriaLabel = (email: string) => `${t('committees.copyEmail')}: ${email}`

// ============================================================================
// Modal state
// ============================================================================

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

const onMemberCardKeydown = (
  event: KeyboardEvent,
  member: CommitteeMember,
  committee: Committee
) => {
  if (event.target !== event.currentTarget) {
    return
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    openMemberModal(member, committee)
  }
}

const closeMemberModal = () => {
  modalOpen.value = false
  selectedMember.value = null
}

// ============================================================================
// Copy email
// ============================================================================

const toast = useToast()

const copyEmail = async (email: string) => {
  try {
    await navigator.clipboard.writeText(email)
    toast.add({
      title: t('common.emailCopied'),
      color: 'success',
    })
  } catch (e) {
    console.error('Error copying email:', e)
  }
}
</script>

<template>
  <div>
    <UContainer class="py-8 sm:py-12">
      <!-- Page Header -->
      <header class="mb-8 text-center sm:mb-12">
        <h1 class="text-3xl font-bold sm:text-4xl">{{ t('committees.title') }}</h1>
        <p class="text-muted mx-auto mt-3 max-w-2xl text-lg">
          {{ t('committees.description') }}
        </p>
      </header>

      <!-- Error -->
      <UAlert
        v-if="error"
        class="mb-6"
        color="error"
        variant="soft"
        icon="i-tabler-alert-triangle"
        :title="t('committees.loadError')"
      />

      <!-- Committees -->
      <div class="space-y-16">
        <section
          v-for="committee in committees"
          :key="committee.id"
          :aria-labelledby="`committee-heading-${committee.id}`"
        >
          <!-- Committee heading and description -->
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

          <!-- Members grid -->
          <div v-if="committee.members.length > 0" class="flex flex-wrap justify-center gap-6">
            <article
              v-for="(member, idx) in committee.members"
              :key="`committee-${committee.id}-member-${idx}`"
              class="group bg-surface/50 hover:bg-surface focus-visible:ring-primary w-full max-w-md cursor-pointer rounded-xl p-5 ring-1 ring-gray-200/50 transition-all hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] dark:ring-gray-800/50"
              tabindex="0"
              :aria-label="getViewProfileAriaLabel(getMemberDisplayName(member))"
              @click="openMemberModal(member, committee)"
              @keydown="onMemberCardKeydown($event, member, committee)"
            >
              <!-- Photo -->
              <div class="mb-4 flex justify-center">
                <div
                  class="ring-primary/20 group-hover:ring-primary/40 size-24 overflow-hidden rounded-full ring-2 transition-all sm:size-28"
                >
                  <img
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

              <!-- Info -->
              <div class="text-center">
                <p v-if="member.denomination" class="text-primary text-sm font-medium">
                  {{ member.denomination }}
                </p>
                <p class="text-foreground mt-1 font-semibold">
                  {{ getMemberDisplayName(member) }}
                </p>

                <div class="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <button
                    v-if="member.email"
                    type="button"
                    class="text-muted hover:text-primary inline-flex items-center gap-1 text-sm transition-colors"
                    :aria-label="getCopyEmailAriaLabel(member.email)"
                    @click.stop="copyEmail(member.email)"
                  >
                    <UIcon name="i-tabler-mail" class="size-4" />
                    <span>{{ member.email }}</span>
                  </button>
                </div>
              </div>
            </article>
          </div>

          <!-- No members -->
          <div v-else class="flex flex-col items-center py-8 text-center">
            <UIcon name="i-tabler-users-group" class="text-muted mb-2 size-10" />
            <p class="text-muted text-sm">{{ t('committees.noMembers') }}</p>
          </div>
        </section>
      </div>
    </UContainer>

    <!-- ================================================================ -->
    <!-- Member Detail Modal -->
    <!-- ================================================================ -->
    <UModal
      v-model:open="modalOpen"
      :title="selectedMember?.denomination || selectedMember?.committeeName"
      :description="t('committees.memberModalDescription')"
      @close="closeMemberModal"
    >
      <template #body>
        <div v-if="selectedMember" class="space-y-6">
          <!-- Header with photo and basic info -->
          <div class="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div
              class="ring-primary/30 size-28 shrink-0 overflow-hidden rounded-full ring-2 sm:size-32"
            >
              <img
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

              <!-- Email -->
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

              <!-- University & Degree -->
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

          <!-- Description -->
          <div v-if="selectedMember.description">
            <h4 class="text-foreground mb-2 font-semibold">
              {{ t('team.about', { name: selectedMember.name }) }}
            </h4>
            <div class="text-muted prose prose-sm dark:prose-invert max-w-none whitespace-pre-line">
              {{ selectedMember.description }}
            </div>
          </div>

          <!-- Social Networks -->
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
