<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  title: 'Prensa',
})

type PressArticleType = 'press_release' | 'statement' | 'media_appearance'

interface Translation {
  locale: string
  title: string
  description: string
  contentHtml: string
  alt: string
}

interface TagTranslation {
  locale: string
  name: string
}

interface Tag {
  id: string
  slug: string
  translations: TagTranslation[]
}

interface MediaOutlet {
  id: string
  name: string
  website: string
  logo: string
}

interface PressArticle {
  id: string
  type: PressArticleType
  slug: string
  image: string
  pdfUrl: string | null
  externalUrl: string | null
  mediaOutletId: string | null
  active: boolean
  publishedAt: string
  translations: Translation[]
  tags: Array<{
    id: string
    pressArticleId: string
    tagId: string
    tag: Tag
  }>
  mediaOutlet: MediaOutlet | null
}

const toast = useToast()
const { formatDate: formatLocaleDate } = useLocaleFormatting()
const { getDefaultTranslationValue } = useLocales()

// Current type tab
const currentType = ref<PressArticleType | null>(null)

// Search query
const searchQuery = ref('')

const typeLabels: Record<PressArticleType, string> = {
  press_release: 'Notas de prensa',
  statement: 'Comunicados',
  media_appearance: 'En los medios',
}

const typeIcons: Record<PressArticleType, string> = {
  press_release: 'i-tabler-file-text',
  statement: 'i-tabler-speakerphone',
  media_appearance: 'i-tabler-broadcast',
}

const typeUrlPrefix: Record<PressArticleType, string> = {
  press_release: '/prensa/notas-prensa',
  statement: '/prensa/comunicados',
  media_appearance: '/prensa/en-los-medios',
}

const createPathByType: Record<PressArticleType, string> = {
  press_release: '/admin/press/create?type=press_release',
  statement: '/admin/press/create?type=statement',
  media_appearance: '/admin/press/create?type=media_appearance',
}

// Fetch all data
const { data, refresh } = await useFetch<{ items: PressArticle[] }>('/api/admin/press')
const allItems = computed(() => data.value?.items ?? [])

// Filter items by type and search query
const items = computed(() => {
  let result = allItems.value

  if (currentType.value) {
    result = result.filter((item: PressArticle) => item.type === currentType.value)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter((item: PressArticle) => {
      const title = getItemTitle(item).toLowerCase()
      const description = getItemDescription(item).toLowerCase()
      return title.includes(query) || description.includes(query)
    })
  }

  return result
})

const getTypeCount = (type: PressArticleType) =>
  allItems.value.filter((i: PressArticle) => i.type === type).length

// Delete confirmation
const showDeleteModal = ref(false)
const itemToDelete = ref<PressArticle | null>(null)
const isDeleting = ref(false)

// Helpers
const hasMeaningfulHtmlContent = (value: string | null | undefined) =>
  String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(nbsp|#160);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim().length > 0

const getTagName = (tag: Tag) => {
  return getDefaultTranslationValue(tag.translations, 'name') ?? tag.slug
}

const getItemTitle = (item: PressArticle) => {
  return getDefaultTranslationValue(item.translations, 'title') ?? item.translations[0]?.title ?? ''
}

const getItemDescription = (item: PressArticle) => {
  return (
    getDefaultTranslationValue(item.translations, 'description') ??
    item.translations[0]?.description ??
    ''
  )
}

const hasItemContent = (item: PressArticle) =>
  item.translations.some((translation) => hasMeaningfulHtmlContent(translation.contentHtml))

const formatDate = (iso: string) => {
  return formatLocaleDate(iso, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Actions
const confirmDelete = (item: PressArticle) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/admin/press/${itemToDelete.value.id}`, { method: 'DELETE' })
    showDeleteModal.value = false
    itemToDelete.value = null
    await refresh()
    toast.add({ title: 'Artículo eliminado', color: 'success' })
  } catch {
    toast.add({ title: 'No se pudo eliminar el artículo', color: 'error' })
  } finally {
    isDeleting.value = false
  }
}

const tabItems = computed(
  (): Array<{ key: 'all' | PressArticleType; label: string; icon: string; count: number }> => [
    {
      key: 'all',
      label: 'Todos',
      icon: 'i-tabler-list',
      count: allItems.value.length,
    },
    ...Object.entries(typeLabels).map(([type, label]) => ({
      key: type as PressArticleType,
      label,
      icon: typeIcons[type as PressArticleType],
      count: getTypeCount(type as PressArticleType),
    })),
  ]
)

const activeTab = computed({
  get: () => currentType.value ?? 'all',
  set: (val: string) => {
    currentType.value = val === 'all' ? null : (val as PressArticleType)
  },
})

const emptyStateCreatePath = computed(() =>
  currentType.value ? createPathByType[currentType.value] : createPathByType.press_release
)
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <h1 class="text-2xl font-bold">Artículos de prensa</h1>
        <p class="text-muted mt-1 text-sm">
          Crea nuevas piezas con el tipo ya preparado para reducir pasos en el flujo diario.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton
          to="/admin/press/create?type=press_release"
          icon="i-tabler-writing-sign"
          variant="outline"
          color="neutral"
        >
          Nueva nota de prensa
        </UButton>
        <UButton
          to="/admin/press/create?type=statement"
          icon="i-tabler-speakerphone"
          variant="outline"
          color="neutral"
        >
          Nuevo comunicado
        </UButton>
        <UButton
          to="/admin/press/create?type=media_appearance"
          icon="i-tabler-broadcast"
          variant="outline"
          color="neutral"
        >
          Añadir aparición
        </UButton>
      </div>
    </div>

    <div class="mb-6 space-y-4">
      <div class="flex gap-2 overflow-x-auto">
        <UButton
          v-for="tab in tabItems"
          :key="tab.key"
          :icon="tab.icon"
          :variant="activeTab === tab.key ? 'solid' : 'outline'"
          size="sm"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <UBadge
            v-if="tab.count"
            :label="String(tab.count)"
            size="sm"
            :variant="activeTab === tab.key ? 'solid' : 'subtle'"
            :class="activeTab === tab.key ? 'bg-white/20 text-white' : ''"
            class="ml-1"
          />
        </UButton>
      </div>

      <UInput
        v-model="searchQuery"
        icon="i-tabler-search"
        placeholder="Buscar artículos..."
        class="max-w-sm"
      />
    </div>

    <div class="space-y-3">
      <article
        v-for="item in items"
        :key="item.id"
        class="group rounded-xl border transition-shadow hover:shadow-md"
      >
        <NuxtLink
          :to="`/admin/press/${item.id}`"
          class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
        >
          <div class="shrink-0">
            <img
              :src="item.image"
              :alt="getItemTitle(item)"
              class="h-24 w-full rounded-lg object-cover sm:w-40"
              loading="lazy"
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
                {{ item.active ? 'Activo' : 'Inactivo' }}
              </UBadge>

              <UBadge v-if="item.pdfUrl" variant="subtle" color="warning" size="sm">
                <UIcon name="i-tabler-file-type-pdf" class="mr-0.5 size-3" />
                PDF
              </UBadge>

              <UBadge v-if="hasItemContent(item)" variant="subtle" color="info" size="sm">
                <UIcon name="i-tabler-file-text" class="mr-0.5 size-3" />
                Texto
              </UBadge>

              <UBadge v-if="item.mediaOutlet" variant="subtle" size="sm">
                <UIcon name="i-tabler-broadcast" class="mr-0.5 size-3" />
                {{ item.mediaOutlet.name }}
              </UBadge>

              <UBadge v-for="pressTag in item.tags" :key="pressTag.id" variant="outline" size="sm">
                {{ getTagName(pressTag.tag) }}
              </UBadge>
            </div>
          </div>

          <div
            class="flex shrink-0 items-center gap-1 self-start sm:self-center"
            @click.prevent.stop
          >
            <UButton
              :to="`${typeUrlPrefix[item.type]}/${item.slug}`"
              icon="i-tabler-external-link"
              variant="ghost"
              size="sm"
              target="_blank"
              title="Ver en la web"
              aria-label="Ver artículo en la web"
            />
            <UButton
              :to="`/admin/press/${item.id}`"
              icon="i-tabler-pencil"
              variant="ghost"
              size="sm"
              title="Editar artículo"
              aria-label="Editar artículo"
            />
            <UButton
              icon="i-tabler-trash"
              variant="ghost"
              color="error"
              size="sm"
              title="Eliminar artículo"
              aria-label="Eliminar artículo"
              @click="confirmDelete(item)"
            />
          </div>
        </NuxtLink>
      </article>

      <div v-if="!items.length && searchQuery.trim()" class="py-16 text-center">
        <UIcon name="i-tabler-search-off" class="text-muted mx-auto mb-3 size-10 opacity-40" />
        <p class="text-muted text-sm">No se encontraron artículos para "{{ searchQuery }}"</p>
        <UButton variant="link" size="sm" class="mt-2" @click="searchQuery = ''">
          Limpiar búsqueda
        </UButton>
      </div>

      <div v-else-if="!items.length" class="py-16 text-center">
        <UIcon name="i-tabler-news-off" class="text-muted mx-auto mb-3 size-10 opacity-40" />
        <p class="text-muted mb-4 text-sm">
          No hay
          {{ currentType ? typeLabels[currentType].toLowerCase() : 'artículos de prensa' }} todavía
        </p>
        <UButton :to="emptyStateCreatePath" icon="i-tabler-plus" size="sm">
          Crear primer artículo
        </UButton>
      </div>
    </div>

    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <div class="bg-error/10 flex size-10 shrink-0 items-center justify-center rounded-full">
              <UIcon name="i-tabler-alert-triangle" class="text-error size-6" />
            </div>
            <h2 class="text-lg font-bold">Confirmar eliminación</h2>
          </div>
          <p class="text-muted mb-6">
            ¿Estás seguro de que deseas eliminar "{{ getItemTitle(itemToDelete!) }}"? Esta acción no
            se puede deshacer.
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showDeleteModal = false">Cancelar</UButton>
            <UButton color="error" :loading="isDeleting" @click="handleDelete">Eliminar</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
