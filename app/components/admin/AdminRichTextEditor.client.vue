<script setup lang="ts">
import type { EditorToolbarItem } from '@nuxt/ui'
import {
  ADMIN_RICH_TEXT_MAX_HTML_LENGTH,
  countRichTextWords,
  getRichTextPlainText,
} from '~~/shared/utils/richText'

const model = defineModel<string>({ required: true })

const plainText = computed(() => getRichTextPlainText(model.value))
const visibleCharacterCount = computed(() => plainText.value.length)
const wordCount = computed(() => countRichTextWords(model.value))
const htmlCharacterCount = computed(() => model.value.length)
const remainingHtmlCharacters = computed(
  () => ADMIN_RICH_TEXT_MAX_HTML_LENGTH - htmlCharacterCount.value
)
const countStateClass = computed(() => {
  if (remainingHtmlCharacters.value < 0) {
    return 'text-error'
  }

  if (remainingHtmlCharacters.value <= 10_000) {
    return 'text-warning'
  }

  return 'text-muted'
})
const countFormatter = new Intl.NumberFormat('es-ES')

const editorToolbarItems: EditorToolbarItem[][] = [
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
</script>

<template>
  <div class="overflow-hidden rounded-xl border">
    <UEditor
      v-model="model"
      content-type="html"
      :placeholder="{
        placeholder: 'Escribe aquí el contenido...',
        mode: 'firstLine',
      }"
      :image="false"
      :mention="false"
      :ui="{
        root: 'min-h-96',
        content: 'min-h-80',
        base: 'press-rich-text min-h-80 px-4 py-4 text-[15px] focus:outline-none',
      }"
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
        {{ countFormatter.format(visibleCharacterCount) }} caracteres visibles ·
        {{ countFormatter.format(wordCount) }} palabras
      </span>
      <span>
        HTML:
        {{ countFormatter.format(htmlCharacterCount) }} /
        {{ countFormatter.format(ADMIN_RICH_TEXT_MAX_HTML_LENGTH) }}
      </span>
    </div>
  </div>
</template>
