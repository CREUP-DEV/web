<script setup lang="ts">
import type { EditorToolbarItem } from '@nuxt/ui'

const model = defineModel<string>({ required: true })

const editorToolbarItems: EditorToolbarItem[][] = [
  [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold' },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic' },
    { kind: 'link', icon: 'i-lucide-link' },
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
        placeholder: 'Escribe aquí el contenido completo de la noticia...',
        mode: 'firstLine',
      }"
      :image="false"
      :mention="false"
      :ui="{
        root: 'min-h-80',
        content: 'min-h-64',
        base: 'press-rich-text min-h-64 px-4 py-4 text-[15px] focus:outline-none',
      }"
    >
      <template #default="{ editor }">
        <UEditorToolbar :editor="editor" :items="editorToolbarItems" />
      </template>
    </UEditor>
  </div>
</template>
