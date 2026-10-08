<script setup lang="ts">
import type { PressArticle } from '@/composables/press/usePress'
import type { AdminPreviewStatus } from '@/components/admin/AdminPreviewBanner.vue'
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import { getPressArticlePublicListPath } from '~~/shared/constants/pressRoutes'
import { getApiErrorMessage } from '~~/shared/utils/apiError'

/** `GET /api/admin/press/[id]/preview`: the public detail payload plus why it is (not) public. */
interface PressArticlePreviewResponse {
  data: PressArticle
  meta: { active: boolean; publishedAt: string; isPublic: boolean }
}

// The public layout, so the article looks exactly as it will once published. Still an admin page:
// the global admin-auth middleware guards everything under /admin (and /<locale>/admin), and the
// /admin/** route rules and robots disallow keep it out of search engines.
definePageMeta({ layout: 'default' })

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const localeApiHeaders = useLocaleApiHeaders()

const articleId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
if (!articleId) throw createError({ statusCode: 404 })

// useFetch, not $fetch inside useAsyncData: during SSR it forwards the admin session cookie.
const { data, error } = await useFetch<PressArticlePreviewResponse>(
  `/api/admin/press/${encodeURIComponent(articleId)}/preview`,
  { headers: localeApiHeaders }
)

const article = computed(() => data.value?.data ?? null)
const editorPath = computed(() => localePath(`${ADMIN_ROUTES.press}/${articleId}`))

const status = computed<AdminPreviewStatus | null>(() => {
  const meta = data.value?.meta
  if (!meta) return null
  if (meta.isPublic) return 'public'
  return meta.active ? 'scheduled' : 'inactive'
})

const publicPath = computed(() =>
  status.value === 'public' && article.value
    ? localePath(`${getPressArticlePublicListPath(article.value.type)}/${article.value.slug}`)
    : null
)
</script>

<template>
  <div>
    <AdminPreviewBanner
      :status="status"
      :published-at="data?.meta.publishedAt"
      :editor-to="editorPath"
      :public-to="publicPath"
    />

    <UContainer v-if="error || !article" class="py-12">
      <UAlert
        color="error"
        variant="subtle"
        icon="i-tabler-alert-circle"
        :title="t('admin.contentPreview.loadError')"
        :description="getApiErrorMessage(error, t('admin.press.toast.notFound'))"
      />
    </UContainer>

    <PressArticleDetail
      v-else
      :article="article"
      :back-to="editorPath"
      :back-label="t('admin.contentPreview.backToEditor')"
    />
  </div>
</template>
