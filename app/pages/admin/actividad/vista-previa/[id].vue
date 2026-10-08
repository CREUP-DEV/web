<script setup lang="ts">
import type { ActivityDetail } from '@/composables/activity/useActivity'
import type { AdminPreviewStatus } from '@/components/admin/AdminPreviewBanner.vue'
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import { ACTIVITY_PUBLIC_BASE_PATH } from '~~/shared/constants/activity'
import { getApiErrorMessage } from '~~/shared/utils/apiError'

/** `GET /api/admin/activity/[id]/preview`: the public detail payload plus whether it is public. */
interface ActivityEntryPreviewResponse {
  data: ActivityDetail
  meta: { active: boolean; isPublic: boolean }
}

// The public layout, so the entry looks exactly as it will once published. Still an admin page:
// the global admin-auth middleware guards everything under /admin (and /<locale>/admin), and the
// /admin/** route rules and robots disallow keep it out of search engines.
definePageMeta({ layout: 'default' })

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const localeApiHeaders = useLocaleApiHeaders()

const entryId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
if (!entryId) throw createError({ statusCode: 404 })

// useFetch, not $fetch inside useAsyncData: during SSR it forwards the admin session cookie.
const { data, error } = await useFetch<ActivityEntryPreviewResponse>(
  `/api/admin/activity/${encodeURIComponent(entryId)}/preview`,
  { headers: localeApiHeaders }
)

const entry = computed(() => data.value?.data ?? null)
const editorPath = computed(() => localePath(`${ADMIN_ROUTES.activity}/${entryId}`))

// Activity has no scheduled publication: an entry is public exactly while it is active.
const status = computed<AdminPreviewStatus | null>(() => {
  const meta = data.value?.meta
  if (!meta) return null
  return meta.isPublic ? 'public' : 'inactive'
})

const publicPath = computed(() =>
  status.value === 'public' && entry.value
    ? localePath(`${ACTIVITY_PUBLIC_BASE_PATH}/${entry.value.slug}`)
    : null
)
</script>

<template>
  <div>
    <AdminPreviewBanner :status="status" :editor-to="editorPath" :public-to="publicPath" />

    <UContainer v-if="error || !entry" class="py-12">
      <UAlert
        color="error"
        variant="subtle"
        icon="i-tabler-alert-circle"
        :title="t('admin.contentPreview.loadError')"
        :description="getApiErrorMessage(error, t('admin.activity.toast.notFound'))"
      />
    </UContainer>

    <ActivityDetail
      v-else
      :entry="entry"
      :back-to="editorPath"
      :back-label="t('admin.contentPreview.backToEditor')"
    />
  </div>
</template>
