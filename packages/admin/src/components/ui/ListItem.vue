<template>
  <component
    :is="to || editUrl ? 'router-link' : 'div'"
    :to="to || editUrl"
    :class="[
      'flex items-center justify-between px-4 py-3 transition-colors border rounded-2xl',
      to || editUrl ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''
    ]"
  >
    <div class="flex-1">
      <h3 class="font-medium text-gray-900 dark:text-white">{{ name || title }}</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ slug || subtitle }}</p>
      <slot />
    </div>
    <div class="flex items-center gap-2">
      <slot name="actions" />
      <IconNext v-if="showArrow" />
    </div>
  </component>
</template>

<script setup lang="ts">
import IconNext from '../icons/IconNext.vue'

withDefaults(defineProps<{
  to?: string
  editUrl?: string
  title?: string
  name?: string
  subtitle?: string
  slug?: string
  updatedAt?: string
  status?: 'published' | 'draft'
  showArrow?: boolean
}>(), {
  showArrow: true
})

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>
