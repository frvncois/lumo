<template>
  <div :class="listClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const listClasses = computed(() => {
  const base = 'bg-white rounded-2xl border border-gray-100 divide-y divide-gray-200 hover:bg-gray-50'
  return base
})
</script>
