<script setup lang="ts">
import type { Committee } from '@/types/committees'
import type { OrgArea, OrgMember } from '@/types/team'

const props = defineProps<{
  areas: OrgArea[]
  areasPending: boolean
  areasFailed: boolean
  committees: Committee[]
  committeesPending: boolean
  committeesFailed: boolean
  getCommitteeName: (committee: Committee) => string
}>()

const emit = defineEmits<{
  retryAreas: []
  retryCommittees: []
}>()

const { t } = useI18n()
const { getAreaName, getMemberDisplayName, splitAreaMembers } = useTeamDirectory({
  areas: toRef(props, 'areas'),
})

const normalizeEmail = (email: string | null | undefined) => (email ?? '').trim().toLowerCase()

/** Org chart members the Intranet flags as the responsible of some committee. */
const committeeResponsibleEmails = computed(
  () =>
    new Set(
      props.areas
        .flatMap((area) => area.members)
        .filter((member) => member.isCommitteeResponsible)
        .map((member) => normalizeEmail(member.email))
        .filter(Boolean)
    )
)

/**
 * The committees API lists a committee's responsible first, numbered 1 (the other members follow
 * from 2), and the org chart flags that same person with `isCommitteeResponsible`: either tells.
 */
const getCommitteeResponsible = (committee: Committee) => {
  const [first] = committee.members

  if (!first) {
    return null
  }

  return first.order === 1 || committeeResponsibleEmails.value.has(normalizeEmail(first.email))
    ? first
    : null
}

const committeeItems = computed(() =>
  props.committees.map((committee) => {
    const responsible = getCommitteeResponsible(committee)

    return {
      id: committee.id,
      name: props.getCommitteeName(committee),
      responsible: responsible
        ? { name: getMemberDisplayName(responsible), role: responsible.denomination }
        : null,
      memberCount: committee.members.length,
    }
  })
)

const committeeNamesByResponsibleEmail = computed(() => {
  const names = new Map<string, string[]>()

  for (const committee of props.committees) {
    const email = normalizeEmail(getCommitteeResponsible(committee)?.email)

    if (email) {
      names.set(email, [...(names.get(email) ?? []), props.getCommitteeName(committee)])
    }
  }

  return names
})

const toPersonNode = (member: OrgMember) => ({
  id: member.id,
  name: getMemberDisplayName(member),
  role: member.denomination,
  committees: committeeNamesByResponsibleEmail.value.get(normalizeEmail(member.email)) ?? [],
})

// Each area's responsible (Executive Committee) heads it; the area's other members (Extended
// Executive Committee) report to them. An area left without a responsible shows that, not a head.
const areaNodes = computed(() =>
  props.areas.flatMap((area) => {
    const { responsible, members } = splitAreaMembers(area)

    if (!responsible && members.length === 0) {
      return []
    }

    return [
      {
        id: area.id,
        name: getAreaName(area),
        responsible: responsible ? toPersonNode(responsible) : null,
        members: members.map(toPersonNode),
      },
    ]
  })
)
</script>

<template>
  <div class="space-y-10">
    <div class="space-y-6">
      <p class="max-w-3xl leading-relaxed print:max-w-none">
        {{ t('pressKit.organization.intro') }}
      </p>

      <PressKitAsyncState
        :pending="areasPending"
        :failed="areasFailed"
        :error-title="t('team.loadError')"
        @retry="emit('retryAreas')"
      >
        <template #skeleton>
          <div class="grid gap-4 md:grid-cols-2">
            <USkeleton v-for="n in 6" :key="n" class="h-36 rounded-xl" />
          </div>
        </template>

        <ul
          class="text-muted mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm"
          :aria-label="t('pressKit.organization.legend')"
        >
          <li class="flex items-center gap-2">
            <UIcon name="i-tabler-user-star" class="text-primary size-4" aria-hidden="true" />
            {{ t('team.executiveCommission') }}
          </li>
          <li class="flex items-center gap-2">
            <span class="border-default h-4 border-l-2" aria-hidden="true" />
            {{ t('team.extendedCommission') }}
          </li>
        </ul>

        <ul
          class="grid items-start gap-4 md:grid-cols-2 print:grid-cols-2 print:gap-3"
          :aria-label="t('pressKit.organization.areas')"
        >
          <li
            v-for="area in areaNodes"
            :key="area.id"
            class="bg-default ring-default rounded-xl p-4 ring-1 print:break-inside-avoid print:p-3"
          >
            <p class="text-muted text-xs font-semibold tracking-wide uppercase">{{ area.name }}</p>

            <p v-if="!area.responsible" class="text-muted mt-2 leading-snug">
              {{ t('pressKit.organization.noResponsible') }}
            </p>
            <div v-else class="mt-2 flex items-start gap-2">
              <UIcon
                name="i-tabler-user-star"
                class="text-primary mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <p class="leading-snug">
                <span class="font-semibold">{{ area.responsible.name }}</span>
                <span v-if="area.responsible.role" class="text-muted">
                  · {{ area.responsible.role }}</span
                >
                <span
                  v-for="committee in area.responsible.committees"
                  :key="committee"
                  class="text-primary block text-xs"
                >
                  {{ t('pressKit.organization.committeeResponsible', { committee }) }}
                </span>
              </p>
            </div>

            <ul
              v-if="area.members.length > 0"
              class="border-default mt-3 ml-2 space-y-2 border-l-2 pl-4 text-sm leading-snug"
            >
              <li v-for="member in area.members" :key="member.id">
                <span class="font-medium">{{ member.name }}</span>
                <span v-if="member.role" class="text-muted"> · {{ member.role }}</span>
                <span
                  v-for="committee in member.committees"
                  :key="committee"
                  class="text-primary block text-xs"
                >
                  {{ t('pressKit.organization.committeeResponsible', { committee }) }}
                </span>
              </li>
            </ul>
          </li>
        </ul>
      </PressKitAsyncState>
    </div>

    <div class="space-y-4">
      <h3 class="text-xl font-semibold">{{ t('committees.title') }}</h3>
      <p class="text-muted max-w-3xl leading-relaxed print:max-w-none">
        {{ t('committees.description') }}
      </p>

      <PressKitAsyncState
        :pending="committeesPending"
        :failed="committeesFailed"
        :error-title="t('committees.loadError')"
        @retry="emit('retryCommittees')"
      >
        <template #skeleton>
          <div class="grid gap-3 sm:grid-cols-2">
            <USkeleton v-for="n in 4" :key="n" class="h-24 rounded-xl" />
          </div>
        </template>

        <ul class="grid gap-3 sm:grid-cols-2 print:grid-cols-2" :aria-label="t('committees.title')">
          <li
            v-for="committee in committeeItems"
            :key="committee.id"
            class="bg-default ring-default rounded-xl p-4 ring-1 print:break-inside-avoid print:p-3"
          >
            <p class="font-semibold">{{ committee.name }}</p>
            <p class="mt-1 text-sm leading-snug">
              <span class="text-muted">{{ t('pressKit.organization.responsible') }}:</span>
              {{ ' ' }}
              <template v-if="committee.responsible">
                {{ committee.responsible.name }}
                <span v-if="committee.responsible.role" class="text-muted">
                  · {{ committee.responsible.role }}</span
                >
              </template>
              <span v-else class="text-muted">{{ t('pressKit.organization.noResponsible') }}</span>
            </p>
            <p class="text-muted mt-1 text-xs">
              {{ t('pressKit.organization.memberCount', committee.memberCount) }}
            </p>
          </li>
        </ul>
      </PressKitAsyncState>
    </div>
  </div>
</template>
