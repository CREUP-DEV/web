<script setup lang="ts">
/**
 * The «Preferencias» dialog (AdminShellPreferences), opened from the account menu. It lives in the
 * layout, not in the menu: on phones the menu sits in the sidebar drawer, which closes when the
 * language change navigates, and would take the dialog with it mid-choice.
 *
 * The menu item that opened it is gone once the menu closes, so on close focus goes back to the
 * account button still on screen, instead of the page body.
 */
const { t } = useI18n()
const open = useAdminPreferencesOpen()

const content = {
  onCloseAutoFocus: (event: Event) => {
    const button = Array.from(
      document.querySelectorAll<HTMLElement>('[data-admin-user-menu-button]')
    ).find((element) => element.offsetParent !== null)
    if (!button) return
    event.preventDefault()
    button.focus()
  },
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="t('admin.layout.preferences')"
    :description="t('admin.layout.preferencesDescription')"
    :content="content"
  >
    <template #body>
      <AdminShellPreferences />
    </template>
    <template #footer="{ close }">
      <div class="flex w-full justify-end">
        <UButton color="neutral" variant="soft" @click="close">
          {{ t('admin.layout.done') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
