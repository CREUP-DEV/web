<script setup lang="ts">
export interface AdminMemberOrg {
  source: 'asociado' | 'sectorial'
  id: string
  denomination: string
  initials: string
  logoLight: string | null
  logoDark: string | null
  order: number
}

const props = defineProps<{
  /** Combined member organisations from /api/admin/member-orgs */
  organisations: AdminMemberOrg[]
  /** Whether the supporting data failed to load (disables the select) */
  hasError: boolean
  /** Field error for the organiser select */
  organiserError?: string
}>()

const { t } = useI18n()

/** Composite "source:id" — the external id is a text-derived slug, not unique across sources. */
const selectedKey = defineModel<string | null>('selectedKey', { required: true })

const selectItems = computed(() =>
  props.organisations.map((org) => ({
    value: `${org.source}:${org.id}`,
    label: org.denomination,
  }))
)

const selectedOrg = computed(() =>
  props.organisations.find((org) => `${org.source}:${org.id}` === selectedKey.value)
)
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

    <div v-if="selectedOrg" class="bg-muted/30 flex items-center gap-3 rounded-lg border p-3">
      <img
        v-if="selectedOrg.logoLight || selectedOrg.logoDark"
        :src="(selectedOrg.logoLight || selectedOrg.logoDark) as string"
        :alt="selectedOrg.denomination"
        class="size-10 shrink-0 rounded object-contain"
        loading="lazy"
      />
      <div
        v-else
        class="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded text-xs font-semibold"
        aria-hidden="true"
      >
        {{ selectedOrg.initials }}
      </div>
      <div class="min-w-0">
        <p class="truncate text-sm font-medium">{{ selectedOrg.denomination }}</p>
        <p class="text-muted text-xs">
          {{
            selectedOrg.source === 'asociado'
              ? t('admin.activity.form.sourceAssociated')
              : t('admin.activity.form.sourceSectorial')
          }}
        </p>
      </div>
    </div>
  </div>
</template>
