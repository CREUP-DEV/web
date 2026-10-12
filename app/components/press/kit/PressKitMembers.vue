<script setup lang="ts">
import type { OrganizationMember } from '@/types/members'

const props = defineProps<{
  members: OrganizationMember[]
  pending: boolean
  failed: boolean
  imageLoading: 'lazy' | 'eager'
}>()

const emit = defineEmits<{
  retry: []
}>()

const { t, locale } = useI18n()
const { getLanguageTag } = useLocales()
const { getCommunityLabel, getMemberDenominationLabel, getMemberUniversityLabel } =
  useMembersDirectory({
    members: toRef(props, 'members'),
    sectoriales: computed(() => []),
  })

const tiles = computed(() => {
  const collator = new Intl.Collator(getLanguageTag(locale.value))

  return props.members
    .map((member) => ({
      id: member.id,
      logo: member.logoLight ?? member.logoDark,
      title: getMemberUniversityLabel(member),
      subtitle: getMemberDenominationLabel(member),
      details: [
        member.initials,
        getCommunityLabel(member.autonomousCommunity, member.autonomousCommunityName),
      ]
        .filter(Boolean)
        .join(' · '),
    }))
    .sort((a, b) => collator.compare(a.title, b.title))
})
</script>

<template>
  <PressKitAsyncState
    :pending="pending"
    :failed="failed"
    :error-title="t('members.loadError')"
    @retry="emit('retry')"
  >
    <template #skeleton>
      <USkeleton class="mb-6 h-5 w-2/3 rounded" />
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <USkeleton v-for="n in 9" :key="n" class="h-20 rounded-xl" />
      </div>
    </template>

    <p class="mb-6 leading-relaxed">
      {{ t('pressKit.members.intro', { count: tiles.length }) }}
    </p>

    <ul
      class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-2"
      :aria-label="t('pressKit.sections.members')"
    >
      <li v-for="tile in tiles" :key="tile.id">
        <PressKitOrganizationTile
          :logo="tile.logo"
          :title="tile.title"
          :subtitle="tile.subtitle"
          :details="tile.details"
          :image-loading="imageLoading"
        />
      </li>
    </ul>
  </PressKitAsyncState>
</template>
