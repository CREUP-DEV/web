<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { SocialNetworkEntry } from '~~/shared/utils/social'

interface Member {
  id: string
  photo: string | null
  denomination: string | null
  email: string
  publicAgenda: boolean
  socialNetworks: SocialNetworkEntry[]
}

defineProps<{
  member: Member
  displayName: string
  viewProfileAriaLabel: string
  publicAgendaAriaLabel?: string
  entranceDelay?: string | Record<string, string>
  to?: RouteLocationRaw
}>()

const emit = defineEmits<{
  clickCard: []
  openAgenda: []
}>()

const { t } = useI18n()

function encodeEmail(email: string) {
  const [user = '', domain = ''] = email.split('@')
  return { eu: btoa(user), ed: btoa(domain) }
}

const cardClass =
  'motion-card-strong group bg-surface/50 hover:bg-surface w-full max-w-md rounded-xl ring-1 ring-default p-5 md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]'
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
          <AdaptiveImage
            v-if="member.photo"
            :key="`${member.id}-${member.photo}`"
            :src="member.photo"
            :alt="displayName"
            width="112"
            height="112"
            sizes="(max-width: 639px) 96px, 112px"
            format="webp"
            quality="70"
            class="size-full object-cover"
            loading="lazy"
            decoding="async"
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
      </div>
    </component>

    <div class="mt-3 flex flex-col items-center gap-2">
      <div class="text-muted inline-flex items-center gap-1 text-sm">
        <UIcon name="i-tabler-mail" class="size-4" />
        <ObfuscatedEmail
          v-bind="encodeEmail(member.email)"
          class="hover:text-primary text-center break-all transition-colors"
        />
      </div>

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
