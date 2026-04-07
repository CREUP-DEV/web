<script setup lang="ts">
interface LinkEditorChain {
  focus: () => LinkEditorChain
  extendMarkRange: (mark: string) => LinkEditorChain
  insertContent: (content: { type: 'text'; text: string }) => LinkEditorChain
  setLink: (attrs: { href: string }) => LinkEditorChain
  unsetLink: () => LinkEditorChain
  setMeta: (key: string, value: boolean) => LinkEditorChain
  run: () => void
}

interface LinkEditor {
  isEditable: boolean
  state: {
    selection: {
      empty: boolean
    }
  }
  isActive: (name: string) => boolean
  getAttributes: (name: string) => { href?: unknown }
  chain: () => LinkEditorChain
  on: (event: 'selectionUpdate' | 'transaction', callback: () => void) => void
  off: (event: 'selectionUpdate' | 'transaction', callback: () => void) => void
}

const props = defineProps<{
  editor: LinkEditor
}>()

const open = ref(false)
const url = ref('')
const tooltipOpen = ref(false)
const linkButtonRef = ref<{ $el?: HTMLElement } | null>(null)

const hasUrlProtocol = (value: string) => /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)

const normalizedUrl = computed(() => {
  const trimmedUrl = url.value.trim()
  if (!trimmedUrl) return ''

  return hasUrlProtocol(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`
})

const urlError = computed(() => {
  if (!url.value.trim()) return ''

  try {
    const parsedUrl = new URL(normalizedUrl.value)

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return 'El enlace debe comenzar con http:// o https://'
    }

    if (!parsedUrl.hostname) {
      return 'Introduce un dominio válido'
    }

    return ''
  } catch {
    return 'Introduce una URL válida (por ejemplo, https://ejemplo.com)'
  }
})

const active = computed(() => props.editor.isActive('link'))
const disabled = computed(() => {
  if (!props.editor.isEditable) return true

  const { selection } = props.editor.state
  return selection.empty && !props.editor.isActive('link')
})

const canOpenCurrentLink = computed(() => Boolean(url.value.trim()) && !urlError.value)
const canApply = computed(() => Boolean(url.value.trim()) && !urlError.value)

const updateUrl = () => {
  const { href } = props.editor.getAttributes('link')
  url.value = typeof href === 'string' ? href : ''
}

watch(
  () => props.editor,
  (editor, _, onCleanup) => {
    if (!editor) return

    updateUrl()

    editor.on('selectionUpdate', updateUrl)
    editor.on('transaction', updateUrl)

    onCleanup(() => {
      editor.off('selectionUpdate', updateUrl)
      editor.off('transaction', updateUrl)
    })
  },
  { immediate: true }
)

watch(open, (isOpen) => {
  if (isOpen) {
    updateUrl()
  }
})

const applyLink = () => {
  const finalUrl = normalizedUrl.value
  if (!finalUrl || urlError.value) return

  const { selection } = props.editor.state
  const isEmptySelection = selection.empty

  let chain = props.editor.chain().focus().extendMarkRange('link')

  if (isEmptySelection && !props.editor.isActive('link')) {
    chain = chain.insertContent({ type: 'text', text: finalUrl })
  }

  chain.setLink({ href: finalUrl }).run()
  url.value = finalUrl
  open.value = false
}

const removeLink = () => {
  props.editor
    .chain()
    .focus()
    .extendMarkRange('link')
    .unsetLink()
    .setMeta('preventAutolink', true)
    .run()

  url.value = ''
  open.value = false
}

const openCurrentLink = () => {
  if (!canOpenCurrentLink.value) return
  window.open(normalizedUrl.value, '_blank', 'noopener,noreferrer')
}

const openModal = () => {
  tooltipOpen.value = false
  open.value = true
}

const handleOpenChange = (nextOpen: boolean) => {
  tooltipOpen.value = false
  open.value = nextOpen

  if (!nextOpen) {
    nextTick(() => {
      linkButtonRef.value?.$el?.blur()
    })
  }
}

const handleApply = () => {
  applyLink()
}

const handleEnter = () => {
  applyLink()
}
</script>

<template>
  <UModal :open="open" title="Gestionar enlace" @update:open="handleOpenChange">
    <UTooltip
      v-model:open="tooltipOpen"
      text="Enlace"
      :disabled="open"
      :ignore-non-keyboard-focus="true"
    >
      <UButton
        ref="linkButtonRef"
        icon="i-lucide-link"
        color="neutral"
        active-color="primary"
        variant="ghost"
        active-variant="soft"
        size="sm"
        :active="active"
        :disabled="disabled"
        @click="openModal"
      />
    </UTooltip>

    <template #body>
      <div class="space-y-4">
        <UFormField name="url" label="URL del enlace" :error="urlError || undefined" class="w-full">
          <UInput
            v-model="url"
            type="url"
            placeholder="https://ejemplo.com"
            autofocus
            class="w-full"
            @keydown.enter.prevent="handleEnter"
          />
        </UFormField>

        <p class="text-muted text-xs">
          Selecciona texto para enlazarlo. Si no hay selección, se insertará la URL como texto
          enlazado.
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-2">
        <UButton
          icon="i-lucide-trash"
          color="error"
          variant="soft"
          :disabled="!active"
          @click="removeLink"
        >
          Quitar enlace
        </UButton>

        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-external-link"
            color="neutral"
            variant="outline"
            :disabled="!canOpenCurrentLink"
            @click="openCurrentLink"
          >
            Abrir
          </UButton>

          <UButton icon="i-lucide-check" color="primary" :disabled="!canApply" @click="handleApply">
            Guardar enlace
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
