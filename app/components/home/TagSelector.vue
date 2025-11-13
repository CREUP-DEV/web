<script setup lang="ts">
const { data: tagsData } = useTags()

const tagList = computed(() => tagsData.value?.tags ?? [])

const selected = ref<string>('')
watch(
  tagList,
  (list) => {
    if (!list.length) return
    if (!list.includes(selected.value)) selected.value = list[0] ?? ''
  },
  { immediate: true }
)

const onSelect = (tag: string) => {
  selected.value = tag
}
</script>

<template>
  <div class="w-full">
    <div
      class="flex flex-wrap items-center gap-2 sm:gap-3"
      role="tablist"
      aria-label="Filtrar por etiqueta"
    >
      <UButton
        v-for="tag in tagList"
        :key="tag"
        class="rounded-full"
        size="sm"
        color="secondary"
        :variant="tag === selected ? 'solid' : 'outline'"
        role="tab"
        :aria-selected="tag === selected"
        type="button"
        @click="onSelect(tag)"
      >
        {{ tag }}
      </UButton>
    </div>
  </div>
</template>
