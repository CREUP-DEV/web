<script setup lang="ts">
import type Sortable from 'sortablejs'
import type { CampaignEditorItem } from '@/composables/admin/useAdminCampaignEditor'

const props = defineProps<{
  items: CampaignEditorItem[]
  /** Localized reason per item key, populated when a send reported the piece as unavailable. */
  unavailableReasons: Record<string, string>
  loading?: boolean
}>()

const emit = defineEmits<{
  move: [index: number, offset: number]
  remove: [index: number]
  reorder: [keys: string[]]
  add: []
}>()

const { t } = useI18n()

const listRef = ref<HTMLElement | null>(null)
/**
 * Announced after a keyboard move. Dragging is not the only way to reorder — the per-row up/down
 * buttons are always visible, and this is what tells a screen-reader user where the row landed.
 */
const moveAnnouncement = ref('')

let sortableInstance: Sortable | null = null

const stopSortableWatch = watch(
  listRef,
  async (element) => {
    sortableInstance?.destroy()
    sortableInstance = null

    if (!element) return

    const { default: SortableJs } = await import('sortablejs')

    if (!listRef.value) return

    sortableInstance = SortableJs.create(listRef.value, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'opacity-50',
      onEnd: (event) => {
        if (event.oldIndex === undefined || event.newIndex === undefined) {
          return
        }

        const keys = props.items.map((item) => item.key)
        const [moved] = keys.splice(event.oldIndex, 1)

        if (!moved) return

        keys.splice(event.newIndex, 0, moved)
        // Sortable mutates the DOM directly; emitting the key order lets the owner rebuild the
        // array so Vue's rendering and the saved payload agree again.
        emit('reorder', keys)
      },
    })
  },
  { immediate: true }
)

onUnmounted(() => {
  stopSortableWatch()
  sortableInstance?.destroy()
})

const handleMove = (index: number, offset: number) => {
  const item = props.items[index]
  const target = index + offset

  if (!item || target < 0 || target >= props.items.length) {
    return
  }

  emit('move', index, offset)

  moveAnnouncement.value = t('admin.newsletterCampaigns.editor.movedAnnouncement', {
    title: item.entry?.title || t('admin.newsletterCampaigns.editor.unknownPiece'),
    position: target + 1,
    total: props.items.length,
  })
}
</script>

<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-lg font-semibold">
          {{ t('admin.newsletterCampaigns.editor.contentTitle') }}
        </h2>
        <p class="text-muted mt-0.5 text-sm">
          {{ t('admin.newsletterCampaigns.editor.contentHint') }}
        </p>
      </div>
      <UButton icon="i-tabler-plus" size="sm" variant="outline" @click="emit('add')">
        {{ t('admin.newsletterCampaigns.editor.addContent') }}
      </UButton>
    </div>

    <div v-if="loading" class="space-y-2" aria-hidden="true">
      <USkeleton v-for="n in 3" :key="n" class="h-28 w-full rounded-xl" />
    </div>

    <div v-else-if="!items.length" class="rounded-xl border border-dashed py-12 text-center">
      <UIcon name="i-tabler-layout-list" class="text-muted mx-auto mb-3 size-8 opacity-40" />
      <p class="text-muted mb-4 text-sm">
        {{ t('admin.newsletterCampaigns.editor.contentEmpty') }}
      </p>
      <UButton icon="i-tabler-plus" size="sm" @click="emit('add')">
        {{ t('admin.newsletterCampaigns.editor.addContent') }}
      </UButton>
    </div>

    <ul v-else ref="listRef" class="space-y-2">
      <AdminNewsletterCampaignItemCard
        v-for="(item, index) in items"
        :key="item.key"
        :item="item"
        :index="index"
        :total="items.length"
        :unavailable-reason="unavailableReasons[item.key] ?? null"
        @move="(offset: number) => handleMove(index, offset)"
        @remove="emit('remove', index)"
      />
    </ul>

    <p aria-live="polite" class="sr-only">{{ moveAnnouncement }}</p>
  </div>
</template>
