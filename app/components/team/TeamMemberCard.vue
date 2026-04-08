<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { SocialNetworkEntry } from '~~/shared/utils/social'

interface Member {
  photo: string | null
  denomination: string | null
  email: string
  publicAgenda: boolean
  socialNetworks: SocialNetworkEntry[]
}

defineProps<{
  member: Member
  displayName: string
  areaLabel?: string
  viewProfileAriaLabel: string
  copyEmailAriaLabel: string
  publicAgendaAriaLabel?: string
  entranceDelay?: string | Record<string, string>
  to?: RouteLocationRaw
}>()

const emit = defineEmits<{
  clickCard: []
  copyEmail: [email: string]
  openAgenda: []
}>()

const { t } = useI18n()

const cardClass =
  'motion-card-strong group bg-surface/50 hover:bg-surface w-full max-w-md rounded-xl p-5 ring-1 ring-gray-200/50 md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] dark:ring-gray-800/50'
const triggerClass =
  'focus-visible:ring-primary block w-full rounded-xl text-center focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
</script>

<template>
  <article :class="cardClass" :style="entranceDelay">
    <component
      :is="to ? 'NuxtLink' : 'button'"
      :class="triggerClass"
      :aria-label="viewProfileAriaLabel"
      v-bind="to ? { to } : { type: 'button' }"
      @click="!to && emit('clickCard')"
    >
      <div class="mb-4 flex justify-center">
        <div
          class="ring-primary/20 group-hover:ring-primary/40 size-24 overflow-hidden rounded-full ring-2 transition-all sm:size-28"
        >
          <NuxtImg
            v-if="member.photo"
            :src="member.photo"
            :alt="displayName"
            class="size-full object-cover"
          />
          <div v-else class="bg-primary/10 text-primary flex size-full items-center justify-center">
            <UIcon name="i-tabler-user" class="size-12" />
          </div>
        </div>
      </div>

      <div class="text-center">
        <p v-if="member.denomination" class="text-primary text-sm font-medium">
          {{ member.denomination }}
        </p>
        <p class="text-foreground mt-1 font-semibold">{{ displayName }}</p>
        <p v-if="areaLabel" class="text-muted mt-1 text-xs">{{ areaLabel }}</p>
      </div>
    </component>

    <div class="mt-3 flex flex-col items-center gap-2">
      <button
        type="button"
        class="text-muted hover:text-primary inline-flex items-center gap-1 text-sm transition-colors"
        :aria-label="copyEmailAriaLabel"
        @click="emit('copyEmail', member.email)"
      >
        <UIcon name="i-tabler-mail" class="size-4" />
        <span aria-hidden="true" class="text-center break-all">{{ member.email }}</span>
      </button>

      <UButton
        v-if="member.publicAgenda"
        size="xs"
        variant="soft"
        icon="i-tabler-calendar"
        :aria-label="publicAgendaAriaLabel"
        @click="emit('openAgenda')"
      >
        {{ t('team.publicAgenda') }}
      </UButton>
    </div>
  </article>
</template>
