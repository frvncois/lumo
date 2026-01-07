<template>
  <div :class="headerClasses">
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

const headerClasses = computed(() => {
  const base = 'font-semibold text-gray-900 bg-gray-50'

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  }

  return [base, sizes[props.size]].join(' ')
})
</script>
