<template>
  <button
    :type="type"
    :class="buttonClasses"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  type: 'button',
  disabled: false,
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => {
  const base = 'inline-flex items-center justify-center font-medium transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    ghost: 'bg-transparent hover:bg-gray-100 active:bg-gray-200 text-gray-700',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return [base, variants[props.variant], sizes[props.size]].join(' ')
})
</script>
