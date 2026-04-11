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
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold' },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic' },
    { kind: 'link', slot: 'link', icon: 'i-lucide-link' },
  ],
  [
    { kind: 'heading', level: 2, icon: 'i-lucide-heading-2' },
    { kind: 'heading', level: 3, icon: 'i-lucide-heading-3' },
    { kind: 'paragraph', icon: 'i-lucide-pilcrow' },
  ],
  [
    { kind: 'bulletList', icon: 'i-lucide-list' },
    { kind: 'orderedList', icon: 'i-lucide-list-ordered' },
    { kind: 'blockquote', icon: 'i-lucide-quote' },
    { kind: 'horizontalRule', icon: 'i-lucide-minus' },
  ],
  [
    { kind: 'undo', icon: 'i-lucide-undo-2' },
    { kind: 'redo', icon: 'i-lucide-redo-2' },
    { kind: 'clearFormatting', icon: 'i-lucide-remove-formatting' },
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
