<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    index?: number
    step?: number
    threshold?: number
    tag?: string
  }>(),
  {
    index: 0,
    step: 80,
    threshold: 0.1,
    tag: 'div',
  }
)

const { elRef, animClasses, animStyle } = useEntranceObserver({ threshold: props.threshold })
</script>

<template>
  <component :is="tag" :ref="elRef" :class="animClasses" :style="animStyle(index, step)">
    <slot />
  </component>
</template>
