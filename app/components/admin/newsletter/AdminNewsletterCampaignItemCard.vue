<script setup lang="ts">
import {
  NEWSLETTER_CAMPAIGN_ITEM_EXCERPT_MAX_LENGTH,
  NEWSLETTER_CAMPAIGN_ITEM_TITLE_MAX_LENGTH,
} from '~~/shared/constants/newsletterCampaigns'
import type { CampaignEditorItem } from '@/composables/admin/useAdminCampaignEditor'

const props = defineProps<{
  item: CampaignEditorItem
  index: number
  total: number
  /** Set while the send has flagged this piece as unavailable, with the localized reason. */
  unavailableReason?: string | null
}>()

const emit = defineEmits<{
  move: [offset: number]
  remove: []
}>()

const { t } = useI18n()
const { getLocaleFlag, getLocaleName, isDefaultLocale } = useLocales()
const { itemTypeLabel, itemTypeIcon, subtypeLabel, formatEntryDate } =
  useAdminCampaignPresentation()

const overridesId = useId()
const showOverrides = ref(false)

const title = computed(
  () => props.item.entry?.title || t('admin.newsletterCampaigns.editor.unknownPiece')
)
const subtype = computed(() => subtypeLabel(props.item.entry?.subtype ?? null))
const isUnavailable = computed(() => !props.item.entry)

/** Area reports never carry a summary of their own, so writing one is recommended, not required. */
const recommendsExcerpt = computed(() => props.item.entry?.needsExcerptOverride ?? false)

const overrideCount = computed(
  () =>
    props.item.translations.filter(
      (translation) => translation.titleOverride?.trim() || translation.excerptOverride?.trim()
    ).length
)

const canMoveUp = computed(() => props.index > 0)
const canMoveDown = computed(() => props.index < props.total - 1)
</script>

<template>
  <li
    class="bg-surface ring-default rounded-xl p-3 shadow-sm ring-1"
    :class="isUnavailable || unavailableReason ? 'ring-error/60' : ''"
  >
    <div class="flex items-start gap-3">
      <!-- Drag handle and the keyboard equivalent sit together and are always visible: the move
           buttons are the only way to reorder without a pointer. -->
      <div class="flex shrink-0 flex-col items-center gap-0.5 pt-0.5">
        <span
          class="drag-handle text-dimmed hover:text-default cursor-grab active:cursor-grabbing"
          aria-hidden="true"
        >
          <UIcon name="i-tabler-grip-vertical" class="size-5" />
        </span>
        <UButton
          icon="i-tabler-chevron-up"
          variant="ghost"
          color="neutral"
          size="xs"
          :disabled="!canMoveUp"
          :aria-label="t('admin.newsletterCampaigns.editor.moveUpAria', { title })"
          @click="emit('move', -1)"
        />
        <span class="text-dimmed text-[11px] tabular-nums">{{ index + 1 }}</span>
        <UButton
          icon="i-tabler-chevron-down"
          variant="ghost"
          color="neutral"
          size="xs"
          :disabled="!canMoveDown"
          :aria-label="t('admin.newsletterCampaigns.editor.moveDownAria', { title })"
          @click="emit('move', 1)"
        />
      </div>

      <img
        v-if="item.entry?.imageUrl"
        :src="item.entry.imageUrl"
        alt=""
        class="h-20 w-28 shrink-0 rounded-lg object-cover"
        loading="lazy"
      />
      <div
        v-else
        class="bg-muted text-dimmed flex h-20 w-28 shrink-0 items-center justify-center rounded-lg"
        aria-hidden="true"
      >
        <UIcon :name="itemTypeIcon(item.itemType)" class="size-8 opacity-60" />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-1.5">
          <UBadge variant="subtle" size="sm">
            <UIcon :name="itemTypeIcon(item.itemType)" class="mr-1 size-3" aria-hidden="true" />
            {{ itemTypeLabel(item.itemType) }}
          </UBadge>
          <UBadge v-if="subtype" variant="outline" size="sm">{{ subtype }}</UBadge>
          <UBadge v-if="item.entry" variant="outline" size="sm" color="neutral">
            {{ formatEntryDate(item.entry.date) }}
          </UBadge>
          <!--
            `text-toned` overrides the variant's own amber text, which sits at 2:1 against the
            amber tint behind it. Set here rather than in app.config because a badge takes its
            colour from a compound color+variant rule, which wins over any variant override.
          -->
          <UBadge
            v-if="recommendsExcerpt"
            variant="subtle"
            color="warning"
            size="sm"
            :ui="{ base: 'text-toned' }"
          >
            <UIcon name="i-tabler-info-circle" class="mr-1 size-3" aria-hidden="true" />
            {{ t('admin.newsletterCampaigns.editor.excerptRecommended') }}
          </UBadge>
          <UBadge v-if="overrideCount > 0" variant="subtle" color="info" size="sm">
            {{ t('admin.newsletterCampaigns.editor.overrideCount', { count: overrideCount }) }}
          </UBadge>
        </div>

        <h4 class="mt-1 truncate text-sm font-semibold">{{ title }}</h4>
        <p v-if="item.entry?.excerpt" class="text-muted mt-0.5 line-clamp-2 text-xs">
          {{ item.entry.excerpt }}
        </p>

        <p v-if="isUnavailable" class="text-error mt-1 text-xs">
          {{ t('admin.newsletterCampaigns.editor.unavailableInEditor') }}
        </p>
        <p v-else-if="unavailableReason" class="text-error mt-1 text-xs">
          {{ unavailableReason }}
        </p>

        <UButton
          class="mt-2"
          variant="link"
          color="neutral"
          size="xs"
          :icon="showOverrides ? 'i-tabler-chevron-up' : 'i-tabler-chevron-down'"
          :aria-expanded="showOverrides"
          :aria-controls="overridesId"
          @click="showOverrides = !showOverrides"
        >
          {{ t('admin.newsletterCampaigns.editor.toggleOverrides') }}
        </UButton>
      </div>

      <UButton
        icon="i-tabler-x"
        variant="ghost"
        color="error"
        size="sm"
        class="shrink-0"
        :aria-label="t('admin.newsletterCampaigns.editor.removeItemAria', { title })"
        :title="t('admin.newsletterCampaigns.editor.removeItem')"
        @click="emit('remove')"
      />
    </div>

    <!-- The id lives on the root, which stays mounted: the collapsible drops its content when
         closed, and `aria-controls` must resolve in both states. -->
    <UCollapsible :id="overridesId" v-model:open="showOverrides">
      <template #content>
        <div class="mt-3 space-y-3 border-t pt-3">
          <p class="text-muted text-xs">
            {{ t('admin.newsletterCampaigns.editor.overridesHint') }}
          </p>

          <div
            v-for="translation in item.translations"
            :key="translation.locale"
            class="grid gap-2 sm:grid-cols-[8rem_1fr_1fr] sm:items-start"
          >
            <span class="flex items-center gap-1.5 pt-1.5 text-xs font-medium">
              <UIcon :name="getLocaleFlag(translation.locale)" class="size-4" aria-hidden="true" />
              {{ getLocaleName(translation.locale) }}
            </span>

            <UFormField
              :label="t('admin.newsletterCampaigns.editor.titleOverride')"
              :ui="{ label: 'sr-only' }"
            >
              <UInput
                v-model="translation.titleOverride"
                class="w-full"
                size="sm"
                :maxlength="NEWSLETTER_CAMPAIGN_ITEM_TITLE_MAX_LENGTH"
                :placeholder="t('admin.newsletterCampaigns.editor.titleOverride')"
                :aria-label="
                  t('admin.newsletterCampaigns.editor.titleOverrideAria', {
                    locale: getLocaleName(translation.locale),
                    title,
                  })
                "
              />
            </UFormField>

            <UFormField
              :label="t('admin.newsletterCampaigns.editor.excerptOverride')"
              :ui="{ label: 'sr-only' }"
            >
              <UTextarea
                v-model="translation.excerptOverride"
                class="w-full"
                size="sm"
                :rows="2"
                :maxlength="NEWSLETTER_CAMPAIGN_ITEM_EXCERPT_MAX_LENGTH"
                :placeholder="
                  recommendsExcerpt && isDefaultLocale(translation.locale)
                    ? t('admin.newsletterCampaigns.editor.excerptOverrideRecommendedPlaceholder')
                    : t('admin.newsletterCampaigns.editor.excerptOverride')
                "
                :aria-label="
                  t('admin.newsletterCampaigns.editor.excerptOverrideAria', {
                    locale: getLocaleName(translation.locale),
                    title,
                  })
                "
              />
            </UFormField>
          </div>
        </div>
      </template>
    </UCollapsible>
  </li>
</template>
