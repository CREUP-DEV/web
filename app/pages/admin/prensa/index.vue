<script setup lang="ts">
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import {
  PRESS_ARTICLE_ADMIN_CREATE_PATHS,
  getPressArticlePublicListPath,
} from '~~/shared/constants/pressRoutes'
import { PRESS_ARTICLE_TYPES } from '~~/shared/constants/pressTypes'
import { getApiErrorMessage } from '~~/shared/utils/apiError'
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
  removeItem,
} = useAdminPress(currentType, searchQuery)

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

const confirmDelete = (item: AdminPressArticle) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/admin/press/${itemToDelete.value.id}`, { method: 'DELETE' })
    removeItem(itemToDelete.value.id)
    decrementTotal()
    await refreshAllClientAsyncData()
    showDeleteModal.value = false
    itemToDelete.value = null
    toast.add({ title: t('admin.press.toast.deleted'), color: 'success' })
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, t('admin.press.toast.deleteError')),
      color: 'error',
    })
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
const tabPanelId = 'admin-press-results'

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
        role="tablist"
        :aria-label="t('admin.press.list.filterByTypeAria')"
      >
        <UButton
          v-for="tab in tabItems"
          :id="`press-tab-${tab.key}`"
          :key="tab.key"
          :icon="tab.icon"
          :variant="activeTab === tab.key ? 'solid' : 'outline'"
          role="tab"
          :aria-selected="activeTab === tab.key"
          :aria-controls="tabPanelId"
          :tabindex="activeTab === tab.key ? 0 : -1"
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

    <div
      v-else
      :id="tabPanelId"
      role="tabpanel"
      :aria-labelledby="`press-tab-${activeTab}`"
      class="space-y-3"
    >
      <div v-if="pending" aria-hidden="true" class="space-y-3">
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
        <article
          v-for="item in items"
          :key="item.id"
          class="group rounded-xl border transition-shadow hover:shadow-md"
        >
          <NuxtLink
            :to="localePath(`${ADMIN_ROUTES.press}/${item.id}`)"
            class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
          >
            <div class="shrink-0">
              <img
                v-if="item.listThumbnailUrl"
                :src="item.listThumbnailUrl"
                :alt="getItemTitle(item)"
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
                  {{ getItemTitle(item) }}
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

            <div
              class="flex shrink-0 items-center gap-1 self-start sm:self-center"
              @click.prevent.stop
            >
              <UButton
                :to="localePath(`${getPressArticlePublicListPath(item.type)}/${item.slug}`)"
                icon="i-tabler-external-link"
                variant="ghost"
                size="sm"
                target="_blank"
                :title="t('admin.press.list.viewOnWebTitle')"
                :aria-label="t('admin.press.viewOnWebAria')"
              />
              <UButton
                :to="localePath(`${ADMIN_ROUTES.press}/${item.id}`)"
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
          </NuxtLink>
        </article>

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
