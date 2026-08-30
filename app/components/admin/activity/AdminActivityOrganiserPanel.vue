<script setup lang="ts">
import type { AdminMemberOrgSnapshot } from '@/composables/admin/useAdminActivity'

export interface AdminMemberOrg {
  source: 'asociado' | 'sectorial'
  id: string
  denomination: string
  initials: string
  logoLight: string | null
  logoDark: string | null
  order: number
  active: boolean
}

const props = defineProps<{
  /** Combined member organisations from /api/admin/member-orgs */
  organisations: AdminMemberOrg[]
  /** Whether the supporting data failed to load (disables the select) */
  hasError: boolean
  /** Field error for the organiser select */
  organiserError?: string
  /** The entry's own frozen snapshot — falls back to it for the preview card when the selected
   * organiser predates the local catalog and isn't found in `organisations` at all. */
  frozenSnapshot?: AdminMemberOrgSnapshot | null
}>()

const { t } = useI18n()

/** Composite "source:id" — the external id is a text-derived slug, not unique across sources. */
const selectedKey = defineModel<string | null>('selectedKey', { required: true })

const selectedOrg = computed(() =>
  props.organisations.find((org) => `${org.source}:${org.id}` === selectedKey.value)
)

const selectItems = computed(() => {
  const toOption = (org: AdminMemberOrg) => ({
    value: `${org.source}:${org.id}`,
    label: org.denomination,
  })
  const active = props.organisations.filter((org) => org.active)
  const historical = props.organisations.filter((org) => !org.active)
  const groups: Array<Array<{ type?: 'label'; label: string; value?: string }>> = []
  if (active.length) {
    groups.push([
      { type: 'label', label: t('admin.activity.form.organiserActiveGroup') },
      ...active.map(toOption),
    ])
  }
  if (historical.length) {
    groups.push([
      { type: 'label', label: t('admin.activity.form.organiserHistoricalGroup') },
      ...historical.map(toOption),
    ])
  }
  // The selected organiser predates the local catalog entirely (not present in `organisations` at
  // all) — inject a synthetic, single-item group from the frozen snapshot so the select's own
  // trigger displays the resolved name instead of falling back to the raw internal key.
  if (!selectedOrg.value && selectedKey.value && props.frozenSnapshot) {
    groups.push([
      { type: 'label', label: t('admin.activity.form.organiserHistoricalGroup') },
      { value: selectedKey.value, label: props.frozenSnapshot.denomination },
    ])
  }
  return groups
})

/** Falls back to the entry's own frozen snapshot when the selected organiser isn't present in
 * `organisations` at all — e.g. it predates the local catalog (created before this feature's
 * migration ran, so it was never captured by a sync). Without this, the preview silently
 * disappears even though the activity still has a valid, frozen organiser reference. */
const displayOrg = computed(() => {
  if (selectedOrg.value) return selectedOrg.value
  if (!selectedKey.value || !props.frozenSnapshot) return null

  const separatorIndex = selectedKey.value.indexOf(':')
  const source =
    separatorIndex === -1
      ? 'asociado'
      : (selectedKey.value.slice(0, separatorIndex) as 'asociado' | 'sectorial')
  const id = separatorIndex === -1 ? selectedKey.value : selectedKey.value.slice(separatorIndex + 1)

  return {
    source,
    id,
    denomination: props.frozenSnapshot.denomination,
    initials: props.frozenSnapshot.initials,
    logoLight: props.frozenSnapshot.logoLight,
    logoDark: props.frozenSnapshot.logoDark,
    order: 0,
    active: false,
  }
})
</script>

<template>
  <div class="space-y-4 rounded-xl border p-5" :class="organiserError ? 'border-error/50' : ''">
    <div>
      <h3 class="flex items-center gap-2 text-sm font-semibold">
        <UIcon name="i-tabler-building-community" class="text-muted size-4" />
        {{ t('admin.activity.form.organiserTitle') }}
      </h3>
      <p class="text-muted mt-1 text-xs">{{ t('admin.activity.form.organiserHint') }}</p>
    </div>

    <UFormField :label="`${t('admin.activity.form.organiserLabel')} *`" :error="organiserError">
      <USelectMenu
        :model-value="selectedKey ?? undefined"
        :items="selectItems"
        value-key="value"
        class="w-full"
        :placeholder="t('admin.activity.form.organiserPlaceholder')"
        :disabled="hasError"
        @update:model-value="selectedKey = $event ?? null"
      />
    </UFormField>

    <div v-if="displayOrg" class="bg-muted/30 flex items-center gap-3 rounded-lg border p-3">
      <img
        v-if="displayOrg.logoLight || displayOrg.logoDark"
        :src="(displayOrg.logoLight || displayOrg.logoDark) as string"
        :alt="displayOrg.denomination"
        class="size-10 shrink-0 rounded object-contain"
        loading="lazy"
      />
      <div
        v-else
        class="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded text-xs font-semibold"
        aria-hidden="true"
      >
        {{ displayOrg.initials }}
      </div>
      <div class="min-w-0">
        <p class="truncate text-sm font-medium">{{ displayOrg.denomination }}</p>
        <p class="text-muted text-xs">
          {{
            displayOrg.source === 'asociado'
              ? t('admin.activity.form.sourceAssociated')
              : t('admin.activity.form.sourceSectorial')
          }}
        </p>
      </div>
    </div>
  </div>
</template>
