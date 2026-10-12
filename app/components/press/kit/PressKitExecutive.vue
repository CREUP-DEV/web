<script setup lang="ts">
import type { OrgArea } from '@/types/team'

const props = defineProps<{
  areas: OrgArea[]
  pending: boolean
  failed: boolean
  imageLoading: 'lazy' | 'eager'
}>()

const emit = defineEmits<{
  retry: []
}>()

const { t } = useI18n()
// The Executive Committee is each area's responsible, as on the team page.
const { executiveMembers, getMemberDisplayName } = useTeamDirectory({
  areas: toRef(props, 'areas'),
})
</script>

<template>
  <div class="space-y-6">
    <p class="leading-relaxed">{{ t('pressKit.executive.intro') }}</p>

    <PressKitAsyncState
      :pending="pending"
      :failed="failed"
      :error-title="t('team.loadError')"
      @retry="emit('retry')"
    >
      <template #skeleton>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <USkeleton v-for="n in 6" :key="n" class="h-64 rounded-xl" />
        </div>
      </template>

      <ul
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-3"
        :aria-label="t('team.executiveCommission')"
      >
        <li v-for="member in executiveMembers" :key="member.id">
          <PressKitPersonCard
            :name="getMemberDisplayName(member)"
            :role="member.denomination || member.areaName"
            :photo="member.photo"
            :degree="member.degree"
            :university="member.university"
            :email="member.email || null"
            :image-loading="imageLoading"
          />
        </li>
      </ul>
    </PressKitAsyncState>
  </div>
</template>
