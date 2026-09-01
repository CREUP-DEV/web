<script setup lang="ts">
import type { EditorToolbarItem } from '@nuxt/ui'
import {
  ADMIN_RICH_TEXT_MAX_HTML_LENGTH,
  countRichTextWords,
  getRichTextPlainText,
} from '~~/shared/utils/richText'

const props = withDefaults(
  defineProps<{
    /**
     * `inline` trims the toolbar to paragraph, bold, italic and link — the only markup the
     * newsletter sanitizer keeps, since headings, lists and quotes render inconsistently in mail
     * clients and would be stripped server-side anyway.
     */
    variant?: 'full' | 'inline'
    /** Character budget shown in the footer. Defaults to the site's rich-text limit. */
    maxHtmlLength?: number
  }>(),
  {
    variant: 'full',
    maxHtmlLength: ADMIN_RICH_TEXT_MAX_HTML_LENGTH,
  }
)

const { t } = useI18n()

const model = defineModel<string>({ required: true })

const plainText = computed(() => getRichTextPlainText(model.value))
const visibleCharacterCount = computed(() => plainText.value.length)
const wordCount = computed(() => countRichTextWords(model.value))
const htmlCharacterCount = computed(() => model.value.length)
const remainingHtmlCharacters = computed(() => props.maxHtmlLength - htmlCharacterCount.value)
const countStateClass = computed(() => {
  if (remainingHtmlCharacters.value < 0) {
    return 'text-error'
  }

  // Warn over the last 5% of the budget, so the threshold scales with the limit in use.
  if (remainingHtmlCharacters.value <= props.maxHtmlLength * 0.05) {
    return 'text-warning'
  }

  return 'text-muted'
})
const countFormatter = new Intl.NumberFormat('es-ES')

const FULL_TOOLBAR_ITEMS: EditorToolbarItem[][] = [
  [
    { kind: 'mark', mark: 'bold', icon: 'i-tabler-bold' },
    { kind: 'mark', mark: 'italic', icon: 'i-tabler-italic' },
    { kind: 'link', slot: 'link', icon: 'i-tabler-link' },
  ],
  [
    { kind: 'heading', level: 2, icon: 'i-tabler-h-2' },
    { kind: 'heading', level: 3, icon: 'i-tabler-h-3' },
    { kind: 'paragraph', icon: 'i-tabler-pilcrow' },
  ],
  [
    { kind: 'bulletList', icon: 'i-tabler-list' },
    { kind: 'orderedList', icon: 'i-tabler-list-numbers' },
    { kind: 'blockquote', icon: 'i-tabler-blockquote' },
    { kind: 'horizontalRule', icon: 'i-tabler-minus' },
  ],
  [
    { kind: 'undo', icon: 'i-tabler-arrow-back-up' },
    { kind: 'redo', icon: 'i-tabler-arrow-forward-up' },
    { kind: 'clearFormatting', icon: 'i-tabler-clear-formatting' },
  ],
]

const INLINE_TOOLBAR_ITEMS: EditorToolbarItem[][] = [
  [
    { kind: 'mark', mark: 'bold', icon: 'i-tabler-bold' },
    { kind: 'mark', mark: 'italic', icon: 'i-tabler-italic' },
    { kind: 'link', slot: 'link', icon: 'i-tabler-link' },
  ],
  [{ kind: 'paragraph', icon: 'i-tabler-pilcrow' }],
  [
    { kind: 'undo', icon: 'i-tabler-arrow-back-up' },
    { kind: 'redo', icon: 'i-tabler-arrow-forward-up' },
    { kind: 'clearFormatting', icon: 'i-tabler-clear-formatting' },
  ],
]

const editorToolbarItems = computed(() =>
  props.variant === 'inline' ? INLINE_TOOLBAR_ITEMS : FULL_TOOLBAR_ITEMS
)

const editorUi = computed(() =>
  props.variant === 'inline'
    ? {
        root: 'min-h-40',
        content: 'min-h-32',
        base: 'press-rich-text min-h-32 px-4 py-3 text-[15px] focus:outline-none',
      }
    : {
        root: 'min-h-96',
        content: 'min-h-80',
        base: 'press-rich-text min-h-80 px-4 py-4 text-[15px] focus:outline-none',
      }
)
</script>

<template>
  <div class="overflow-hidden rounded-xl border">
    <UEditor
      v-model="model"
      content-type="html"
      :placeholder="{
        placeholder: t('admin.editor.contentPlaceholder'),
        mode: 'firstLine',
      }"
      :image="false"
      :mention="false"
      :ui="editorUi"
    >
      <template #default="{ editor }">
        <UEditorToolbar :editor="editor" :items="editorToolbarItems">
          <template #link>
            <AdminEditorLinkModal :editor="editor" />
          </template>
        </UEditorToolbar>
      </template>
    </UEditor>

    <div
      class="bg-muted/40 flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2 text-xs"
      :class="countStateClass"
    >
      <span>
        {{
          t('admin.editor.visibleCharacters', {
            count: countFormatter.format(visibleCharacterCount),
          })
        }}
        ·
        {{ t('admin.editor.words', { count: countFormatter.format(wordCount) }) }}
      </span>
      <span>
        HTML:
        {{ countFormatter.format(htmlCharacterCount) }} /
        {{ countFormatter.format(props.maxHtmlLength) }}
      </span>
    </div>
  </div>
</template>
