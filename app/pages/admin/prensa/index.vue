<script setup lang="ts">
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import {
  PRESS_ARTICLE_ADMIN_CREATE_PATHS,
  getPressArticlePublicListPath,
} from '~~/shared/constants/pressRoutes'
import { PRESS_ARTICLE_TYPES } from '~~/shared/constants/pressTypes'
import { getApiErrorMessage, getApiErrorStatusCode } from '~~/shared/utils/apiError'
import { isPressArticlePublic } from '~~/shared/utils/publicVisibility'
import type {
  AdminPressArticle,
  AdminPressArticleType,
  AdminPressTag,
} from '@/composables/admin/useAdminPress'

definePageMeta({
  layout: 'admin',
  title: 'Prensa',
})

const { t } = useI18n()
const localePath = useLocalePath()
const toast = useAdminToast()
const { formatDate: formatLocaleDate } = useLocaleFormatting()
const { getDefaultTranslationValue } = useLocales()
const { refreshAllClientAsyncData } = usePublicCmsCacheRefresh()

const currentType = ref<AdminPressArticleType | null>(null)
const searchQuery = ref('')

const {
  decrementTotal,
  items,
  total,
  pageCount,
  page,
  pending,
  error: fetchError,
  refresh,
  refreshAfterRemoval,
  removeItem,
} = useAdminPress(currentType, searchQuery)

// Skeletons only on a first load; a refetch (page, filter, backfill after a delete) dims the rows.
const { resultsRef, isLoading, isRefreshing } = usePaginatedTransition(pending, items, fetchError)

// Keep the pagination controls under the cursor when the page changes.
const paginationRef = ref<HTMLElement | null>(null)
usePaginationAnchor(page, paginationRef)

const typeLabels: Record<AdminPressArticleType, string> = {
  press_release: t('admin.press.types.pressRelease'),
  statement: t('admin.press.types.statement'),
  media_appearance: t('admin.press.types.mediaAppearance'),
}

const typeIcons: Record<AdminPressArticleType, string> = {
  press_release: 'i-tabler-file-text',
  statement: 'i-tabler-speakerphone',
  media_appearance: 'i-tabler-broadcast',
}

// Delete confirmation
const showDeleteModal = ref(false)
const itemToDelete = ref<AdminPressArticle | null>(null)
const isDeleting = ref(false)

const getTagName = (tag: AdminPressTag) =>
  getDefaultTranslationValue(tag.translations, 'name') ?? tag.slug

const getItemTitle = (item: AdminPressArticle) =>
  getDefaultTranslationValue(item.translations, 'title') ?? item.translations[0]?.title ?? ''

const getItemDescription = (item: AdminPressArticle) =>
  getDefaultTranslationValue(item.translations, 'description') ??
  item.translations[0]?.description ??
  ''

const formatDate = (iso: string) =>
  formatLocaleDate(iso, { year: 'numeric', month: 'short', day: 'numeric' })

const getEditPath = (item: AdminPressArticle) => localePath(`${ADMIN_ROUTES.press}/${item.id}`)

const getPublicPath = (item: AdminPressArticle) =>
  localePath(`${getPressArticlePublicListPath(item.type)}/${item.slug}`)

const getPreviewPath = (item: AdminPressArticle) =>
  localePath(`${ADMIN_ROUTES.pressPreview}/${item.id}`)

/** Why the article is not public yet: switched off, or active with a future publication date. */
const getPreviewLabel = (item: AdminPressArticle) =>
  item.active
    ? t('admin.press.previewScheduled', { date: formatDate(item.publishedAt) })
    : t('admin.press.previewInactive')

const confirmDelete = (item: AdminPressArticle) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  itemToDelete.value = null
}

const handleDelete = async () => {
  const item = itemToDelete.value
  if (!item) return
  isDeleting.value = true
  try {
    await $fetch(`/api/admin/press/${item.id}`, {
      method: 'DELETE',
      query: { updatedAt: item.updatedAt },
    })
    removeItem(item.id)
    decrementTotal()
    await refreshAllClientAsyncData()
    closeDeleteModal()
    toast.add({ title: t('admin.press.toast.deleted'), color: 'success' })
    await refreshAfterRemoval()
  } catch (error) {
    // 409: another admin changed the article since this list loaded; show it as it is now.
    const isConflict = getApiErrorStatusCode(error) === 409
    toast.add({
      title: getApiErrorMessage(error, t('admin.press.toast.deleteError')),
      color: isConflict ? 'warning' : 'error',
    })
    if (isConflict) {
      closeDeleteModal()
      await refresh()
    }
  } finally {
    isDeleting.value = false
  }
}

const tabItems = computed(() => [
  { key: 'all' as const, label: t('admin.press.list.allTab'), icon: 'i-tabler-list' },
  ...PRESS_ARTICLE_TYPES.map((t) => ({
    key: t,
    label: typeLabels[t],
    icon: typeIcons[t],
  })),
])

const activeTab = computed({
  get: () => currentType.value ?? 'all',
  set: (val: string) => {
    currentType.value = val === 'all' ? null : (val as AdminPressArticleType)
  },
})

const emptyStateCreatePath = computed(() =>
  localePath(
    currentType.value
      ? PRESS_ARTICLE_ADMIN_CREATE_PATHS[currentType.value]
      : PRESS_ARTICLE_ADMIN_CREATE_PATHS.press_release
  )
)

const emptyStateTypeLabel = computed(() =>
  currentType.value
    ? typeLabels[currentType.value].toLowerCase()
    : t('admin.press.list.emptyTypeFallback')
)
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ t('admin.press.list.heading') }}</h1>
        <p class="text-muted mt-1 text-sm">
          {{ t('admin.press.list.subheading') }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton
          :to="`${localePath(ADMIN_ROUTES.pressCreate)}?type=press_release`"
          icon="i-tabler-writing-sign"
          variant="outline"
          color="neutral"
        >
          {{ t('admin.press.list.newPressRelease') }}
        </UButton>
        <UButton
          :to="`${localePath(ADMIN_ROUTES.pressCreate)}?type=statement`"
          icon="i-tabler-speakerphone"
          variant="outline"
          color="neutral"
        >
          {{ t('admin.press.list.newStatement') }}
        </UButton>
        <UButton
          :to="`${localePath(ADMIN_ROUTES.pressCreate)}?type=media_appearance`"
          icon="i-tabler-broadcast"
          variant="outline"
          color="neutral"
        >
          {{ t('admin.press.list.newMediaAppearance') }}
        </UButton>
      </div>
    </div>

    <div class="mb-6 space-y-4">
      <div
        class="flex gap-2 overflow-x-auto"
        role="group"
        :aria-label="t('admin.press.list.filterByTypeAria')"
      >
        <UButton
          v-for="tab in tabItems"
          :key="tab.key"
          :icon="tab.icon"
          :variant="activeTab === tab.key ? 'solid' : 'outline'"
          :aria-pressed="activeTab === tab.key"
          size="sm"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </UButton>
      </div>

      <UInput
        v-model="searchQuery"
        icon="i-tabler-search"
        :placeholder="t('admin.press.list.searchPlaceholder')"
        class="max-w-sm"
      />
    </div>

    <div v-if="fetchError" class="space-y-3">
      <UAlert
        color="error"
        variant="soft"
        :title="t('admin.press.list.loadErrorTitle')"
        :description="t('admin.common.loadErrorDescription')"
      />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
        {{ t('admin.common.retry') }}
      </UButton>
    </div>

    <div v-else ref="resultsRef" class="space-y-3" :aria-busy="pending || undefined">
      <div v-if="isLoading" aria-hidden="true" class="space-y-3">
        <div v-for="n in 5" :key="n" class="rounded-xl border p-4">
          <div class="flex gap-4">
            <USkeleton class="h-24 w-40 shrink-0 rounded-lg" />
            <div class="flex-1 space-y-2">
              <USkeleton class="h-5 w-3/4" />
              <USkeleton class="h-4 w-1/2" />
              <USkeleton class="h-4 w-1/3" />
            </div>
          </div>
        </div>
      </div>

      <template v-else>
        <div
          v-if="items.length"
          class="space-y-3"
          :class="isRefreshing ? 'opacity-60 transition-opacity duration-200' : ''"
        >
          <!-- Stretched link: the title's ::after overlay makes the whole card open the editor,
               while the actions sit above it as siblings instead of nesting inside the link. -->
          <article
            v-for="item in items"
            :key="item.id"
            class="group has-focus-visible:ring-primary relative flex flex-col gap-4 rounded-xl border p-4 transition-shadow hover:shadow-md has-focus-visible:ring-2 sm:flex-row sm:items-center"
          >
            <div class="shrink-0">
              <img
                v-if="item.listThumbnailUrl"
                :src="item.listThumbnailUrl"
                alt=""
                class="h-24 w-full rounded-lg object-cover sm:w-40"
                loading="lazy"
              />
              <div
                v-else
                class="bg-muted flex h-24 w-full items-center justify-center rounded-lg sm:w-40"
                aria-hidden="true"
              />
            </div>

            <div class="min-w-0 flex-1">
              <div class="mb-1 flex items-start gap-2">
                <h3 class="group-hover:text-primary truncate text-base font-semibold">
                  <NuxtLink
                    :to="getEditPath(item)"
                    class="after:absolute after:inset-0 focus-visible:outline-none"
                  >
                    {{ getItemTitle(item) }}
                  </NuxtLink>
                </h3>
              </div>

              <p v-if="getItemDescription(item)" class="text-muted mb-2 line-clamp-1 text-sm">
                {{ getItemDescription(item) }}
              </p>

              <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span class="text-muted flex items-center gap-1 text-xs">
                  <UIcon name="i-tabler-calendar" class="size-3.5" />
                  {{ formatDate(item.publishedAt) }}
                </span>

                <UBadge variant="subtle" size="sm">
                  <UIcon :name="typeIcons[item.type]" class="mr-1 size-3" />
                  {{ typeLabels[item.type] }}
                </UBadge>

                <UBadge :color="item.active ? 'success' : 'neutral'" variant="subtle" size="sm">
                  {{ item.active ? t('admin.common.active') : t('admin.common.inactive') }}
                </UBadge>

                <UBadge v-if="item.pdfUrl" variant="subtle" color="warning" size="sm">
                  <UIcon name="i-tabler-file-type-pdf" class="mr-0.5 size-3" />
                  PDF
                </UBadge>

                <UBadge v-if="item.mediaOutlet" variant="subtle" size="sm">
                  <UIcon name="i-tabler-broadcast" class="mr-0.5 size-3" />
                  {{ item.mediaOutlet.name }}
                </UBadge>

                <UBadge
                  v-for="pressTag in item.tags"
                  :key="pressTag.id"
                  variant="outline"
                  size="sm"
                >
                  {{ getTagName(pressTag.tag) }}
                </UBadge>
              </div>
            </div>

            <div class="relative z-10 flex shrink-0 items-center gap-1 self-start sm:self-center">
              <UButton
                v-if="isPressArticlePublic(item)"
                :to="getPublicPath(item)"
                icon="i-tabler-external-link"
                variant="ghost"
                size="sm"
                target="_blank"
                :title="t('admin.press.viewOnWebAria')"
                :aria-label="t('admin.press.viewOnWebAria')"
              />
              <UButton
                v-else
                :to="getPreviewPath(item)"
                icon="i-tabler-eye"
                variant="ghost"
                size="sm"
                target="_blank"
                :title="getPreviewLabel(item)"
                :aria-label="getPreviewLabel(item)"
              />
              <UButton
                :to="getEditPath(item)"
                icon="i-tabler-pencil"
                variant="ghost"
                size="sm"
                :title="t('admin.press.list.editTitle')"
                :aria-label="t('admin.press.list.editAria')"
              />
              <UButton
                icon="i-tabler-trash"
                variant="ghost"
                color="error"
                size="sm"
                :title="t('admin.press.list.deleteTitle')"
                :aria-label="t('admin.press.list.deleteAria')"
                @click="confirmDelete(item)"
              />
            </div>
          </article>
        </div>

        <div v-if="!items.length && searchQuery.trim()" class="py-16 text-center">
          <UIcon name="i-tabler-search-off" class="text-muted mx-auto mb-3 size-10 opacity-40" />
          <p class="text-muted text-sm">
            {{ t('admin.press.list.noSearchResults', { query: searchQuery }) }}
          </p>
          <UButton variant="link" size="sm" class="mt-2" @click="searchQuery = ''">
            {{ t('admin.press.list.clearSearch') }}
          </UButton>
        </div>

        <div v-else-if="!items.length" class="py-16 text-center">
          <UIcon name="i-tabler-news-off" class="text-muted mx-auto mb-3 size-10 opacity-40" />
          <p class="text-muted mb-4 text-sm">
            {{ t('admin.press.list.emptyState', { type: emptyStateTypeLabel }) }}
          </p>
          <UButton :to="emptyStateCreatePath" icon="i-tabler-plus" size="sm">
            {{ t('admin.press.list.createFirst') }}
          </UButton>
        </div>

        <nav
          v-if="pageCount > 1"
          ref="paginationRef"
          class="flex justify-center pt-4"
          :aria-label="t('admin.press.list.paginationAria')"
        >
          <UPagination v-model:page="page" :total="total" :items-per-page="20" />
        </nav>
      </template>
    </div>

    <UModal v-model:open="showDeleteModal" :title="t('admin.common.confirmDeleteTitle')">
      <template #content>
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <div class="bg-error/10 flex size-10 shrink-0 items-center justify-center rounded-full">
              <UIcon name="i-tabler-alert-triangle" class="text-error size-6" />
            </div>
            <h2 class="text-lg font-bold">{{ t('admin.common.confirmDeleteTitle') }}</h2>
          </div>
          <p class="text-muted mb-6">
            {{
              t('admin.common.deleteConfirm', {
                name: itemToDelete ? getItemTitle(itemToDelete) : '',
              })
            }}
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showDeleteModal = false">{{
              t('admin.common.cancel')
            }}</UButton>
            <UButton color="error" :loading="isDeleting" @click="handleDelete">{{
              t('admin.common.delete')
            }}</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
