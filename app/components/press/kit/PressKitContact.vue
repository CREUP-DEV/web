<script setup lang="ts">
import type { OrgArea } from '@/types/team'
import { encodeObfuscatedEmail } from '@/utils/obfuscatedEmail'
import {
  CONTACT_TYPE_QUERY_KEY,
  PRESS_CONTACT_TYPE_QUERY_VALUE,
} from '~~/shared/utils/contactShared'

const props = defineProps<{
  areas: OrgArea[]
  areasPending: boolean
  areasFailed: boolean
  siteUrl: string
}>()

const emit = defineEmits<{
  retryAreas: []
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const { getAreaName, getMemberDisplayName } = useTeamDirectory({ areas: toRef(props, 'areas') })

const GENERAL_EMAIL = 'info@creup.es'
const PRESS_EMAIL = 'prensa@creup.es'

const mailboxes = computed(() => [
  {
    key: 'press',
    icon: 'i-tabler-speakerphone',
    label: t('contactPage.contactType.press'),
    description: t('contactPage.contactType.pressDescription'),
    email: PRESS_EMAIL,
  },
  {
    key: 'general',
    icon: 'i-tabler-mail',
    label: t('contactPage.contactType.general'),
    description: t('contactPage.contactType.generalDescription'),
    email: GENERAL_EMAIL,
  },
])

const pressContactPath = computed(() =>
  localePath({
    path: '/contacto',
    query: { [CONTACT_TYPE_QUERY_KEY]: PRESS_CONTACT_TYPE_QUERY_VALUE },
  })
)

// People the Intranet marks as press contacts, once each even if they sit in several areas.
const pressContacts = computed(() => {
  const seen = new Set<string>()

  return props.areas.flatMap((area) =>
    area.members.flatMap((member) => {
      const personKey = member.email.trim().toLowerCase() || member.id

      if (!member.pressContact || seen.has(personKey)) {
        return []
      }

      seen.add(personKey)
      const name = getMemberDisplayName(member)

      return [
        {
          id: member.id,
          name,
          role: member.denomination || getAreaName(area),
          email: member.email || null,
          encodedPhone: member.encodedPhone,
        },
      ]
    })
  )
})
</script>

<template>
  <div class="space-y-8">
    <p class="leading-relaxed">{{ t('pressKit.contact.intro') }}</p>

    <ul class="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
      <li
        v-for="mailbox in mailboxes"
        :key="mailbox.key"
        class="bg-default ring-default flex items-start gap-3 rounded-xl p-4 ring-1 print:break-inside-avoid"
      >
        <div
          class="bg-primary/8 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl"
          aria-hidden="true"
        >
          <UIcon :name="mailbox.icon" class="size-5" />
        </div>
        <div class="min-w-0">
          <p class="font-semibold">{{ mailbox.label }}</p>
          <a
            :href="`mailto:${mailbox.email}`"
            class="text-primary font-medium break-all hover:underline"
          >
            {{ mailbox.email }}
          </a>
          <p class="text-muted mt-1 text-sm leading-snug">{{ mailbox.description }}</p>
        </div>
      </li>
    </ul>

    <!-- Kept while loading or failed, so the error says which list is missing. -->
    <div v-if="areasPending || areasFailed || pressContacts.length > 0" class="space-y-4">
      <h3 class="text-xl font-semibold">{{ t('pressKit.contact.peopleTitle') }}</h3>
      <PressKitAsyncState
        :pending="areasPending"
        :failed="areasFailed"
        :error-title="t('team.loadError')"
        @retry="emit('retryAreas')"
      >
        <template #skeleton>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <USkeleton v-for="n in 3" :key="n" class="h-28 rounded-xl" />
          </div>
        </template>

        <ul
          class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-3"
          :aria-label="t('pressKit.contact.peopleTitle')"
        >
          <li
            v-for="contact in pressContacts"
            :key="contact.id"
            class="bg-default ring-default rounded-xl p-4 ring-1 print:break-inside-avoid"
          >
            <p class="font-semibold">{{ contact.name }}</p>
            <p class="text-primary text-sm font-medium">{{ contact.role }}</p>
            <dl class="text-muted mt-2 space-y-1 text-sm">
              <div v-if="contact.email" class="flex items-center gap-1.5">
                <dt>
                  <UIcon name="i-tabler-mail" class="size-4" aria-hidden="true" />
                  <span class="sr-only">{{ t('team.email') }}</span>
                </dt>
                <dd class="min-w-0">
                  <ObfuscatedEmail
                    v-bind="encodeObfuscatedEmail(contact.email)"
                    class="hover:text-primary break-all transition-colors"
                  />
                </dd>
              </div>
              <div v-if="contact.encodedPhone" class="flex items-center gap-1.5">
                <dt>
                  <UIcon name="i-tabler-phone" class="size-4" aria-hidden="true" />
                  <span class="sr-only">{{ t('pressKit.contact.phone') }}</span>
                </dt>
                <dd>
                  <ObfuscatedPhone
                    :encoded="contact.encodedPhone"
                    class="hover:text-primary tabular-nums transition-colors"
                  />
                </dd>
              </div>
            </dl>
          </li>
        </ul>
      </PressKitAsyncState>
    </div>

    <ul class="flex flex-wrap gap-3 print:block print:space-y-1">
      <li>
        <PressKitLink
          :to="pressContactPath"
          icon="i-tabler-forms"
          :label="t('pressKit.contact.form')"
          :site-url="siteUrl"
        />
      </li>
      <li>
        <PressKitLink
          :to="siteUrl"
          icon="i-tabler-world-www"
          color="neutral"
          :label="t('common.visitWebsite')"
          :site-url="siteUrl"
        />
      </li>
    </ul>
  </div>
</template>
