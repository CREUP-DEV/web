<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { useAuth } from '@/composables/security/useAuth'

/**
 * Admin sidebar footer: who is signed in (avatar, name, email) and a menu with the public site,
 * «Preferencias» (language and theme: AdminShellPreferencesDialog, held by the layout) and sign
 * out.
 *
 * In the button a long name wraps to two lines at most and the email keeps one; each shows whole
 * on hover (a native title) and the menu wraps every line, so nothing is ever cut for good.
 */
const props = defineProps<{ collapsed?: boolean }>()

const { t } = useI18n()
const localePath = useLocalePath()
const { session, signOut } = useAuth()

const preferencesOpen = useAdminPreferencesOpen()
const sidebarOpen = useState<boolean>('admin-sidebar-open', () => false)
const signingOut = ref(false)

const user = computed(() => session.value.data?.user ?? null)
/**
 * The session is read on the client, so the server and the first client render have no user yet:
 * a skeleton stands in for the name and avatar while it is being read, instead of a generic label.
 * Once read without a user (an expired session, a failed request) the generic label shows.
 */
const loadingUser = computed(() => !user.value && session.value.isPending)
const name = computed(
  () => user.value?.name?.trim() || user.value?.email || t('admin.layout.adminTitle')
)
const email = computed(() => user.value?.email ?? '')

/** The Google photo or, without one, UAvatar draws the initials of `alt`. */
const avatar = computed(() => ({
  src: user.value?.image ?? undefined,
  alt: name.value,
  size: 'sm' as const,
}))

async function handleSignOut() {
  if (signingOut.value) return
  signingOut.value = true
  try {
    await signOut()
  } finally {
    signingOut.value = false
  }
}

const items = computed<DropdownMenuItem[][]>(() => [
  [{ type: 'label', label: name.value, description: email.value, avatar: avatar.value }],
  [
    {
      label: t('admin.layout.viewSite'),
      icon: 'i-tabler-external-link',
      to: localePath('/'),
      target: '_blank',
      'aria-label': t('admin.layout.viewSiteAria'),
    },
  ],
  [
    {
      label: t('admin.layout.preferences'),
      icon: 'i-tabler-adjustments-horizontal',
      onSelect: () => {
        // On phones the menu is in the sidebar drawer: close it so the dialog is on top.
        sidebarOpen.value = false
        preferencesOpen.value = true
      },
    },
  ],
  [{ label: t('admin.layout.signOut'), icon: 'i-tabler-logout', onSelect: handleSignOut }],
])
</script>

<template>
  <div class="w-full">
    <UDropdownMenu
      :items="items"
      :content="{
        align: props.collapsed ? 'end' : 'center',
        side: props.collapsed ? 'right' : 'top',
        collisionPadding: 12,
      }"
      :ui="{
        content: props.collapsed ? 'w-72' : 'w-(--reka-dropdown-menu-trigger-width) min-w-64',
        itemLabel: 'text-clip whitespace-normal wrap-anywhere',
        itemDescription: 'text-clip whitespace-normal wrap-anywhere',
      }"
    >
      <UButton
        data-admin-user-menu-button
        color="neutral"
        variant="ghost"
        :block="!props.collapsed"
        :square="props.collapsed"
        :loading="signingOut"
        class="data-[state=open]:bg-elevated w-full justify-start gap-2.5 py-1.5"
        :class="props.collapsed ? 'justify-center' : ''"
        :aria-label="t('admin.layout.userMenuFor', { name })"
      >
        <USkeleton v-if="loadingUser" class="size-8 shrink-0 rounded-full" aria-hidden="true" />
        <UAvatar v-else v-bind="avatar" class="shrink-0" />
        <span
          v-if="!props.collapsed && loadingUser"
          class="min-w-0 flex-1 space-y-1.5"
          aria-hidden="true"
        >
          <USkeleton class="h-3.5 w-28" />
          <USkeleton class="h-3 w-36" />
        </span>
        <span v-else-if="!props.collapsed" class="min-w-0 flex-1 text-start">
          <span
            class="text-highlighted line-clamp-2 text-sm font-medium wrap-break-word"
            :title="name"
          >
            {{ name }}
          </span>
          <span v-if="email" class="text-muted block truncate text-xs" :title="email">
            {{ email }}
          </span>
        </span>
        <UIcon
          v-if="!props.collapsed"
          name="i-tabler-selector"
          class="text-dimmed size-4 shrink-0"
          aria-hidden="true"
        />
      </UButton>
    </UDropdownMenu>
  </div>
</template>
