<template>
  <div :class="actionClasses">
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

const actionClasses = computed(() => {
  const base = 'flex items-center gap-2'

  const sizes = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  }

  return [base, sizes[props.size]].join(' ')
})
</script>
