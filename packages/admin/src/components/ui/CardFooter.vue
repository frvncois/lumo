<template>
  <div class="p-4">
    <div v-if="$slots.default" class="flex items-center justify-between">
      <slot />
    </div>
    <div v-else-if="$slots.actions || actions" class="flex items-center justify-end gap-2">
      <slot name="actions">
        <button
          v-for="action in actions"
          :key="action.label"
          @click="action.onClick"
          :class="[
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
            action.variant === 'primary' ? 'bg-gray-900 text-white hover:bg-gray-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          ]"
        >
          {{ action.label }}
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Action {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

defineProps<{
  actions?: Action[]
}>()
</script>
