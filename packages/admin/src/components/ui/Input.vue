<template>
  <input
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :class="inputClasses"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue?: string | number
  type?: string
  placeholder?: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  variant: 'default',
  size: 'md',
  disabled: false,
})

defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputClasses = computed(() => {
  const base = 'w-full rounded-lg focus:outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50'

  const variants = {
    default: 'border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    ghost: 'border-0 bg-transparent hover:bg-gray-50 focus:bg-gray-50 focus:ring-0',
    outline: 'border-2 border-gray-300 bg-transparent focus:border-blue-500 focus:ring-0',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  }

  return [base, variants[props.variant], sizes[props.size]].join(' ')
})
</script>
