<template>
  <div class="flex flex-col space-y-2">
    <label v-if="label" class="text-xs uppercase text-gray-700 dark:text-gray-300 tracking-wide">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :class="inputClasses"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue?: string | number
  type?: string
  placeholder?: string
  label?: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  variant: 'default',
  size: 'md',
  disabled: false,
  required: false,
})

defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputClasses = computed(() => {
  const base = 'w-full rounded-xl focus:outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 dark:text-white'

  const variants = {
    default: 'border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-gray-200 placeholder-gray-500 dark:placeholder-gray-400',
    ghost: 'border border-gray-200 dark:border-gray-700 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-50 dark:focus:bg-gray-800 focus:ring-0',
    outline: 'border-2 border-gray-300 dark:border-gray-700 bg-transparent focus:border-gray-500 focus:ring-0',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  }

  return [base, variants[props.variant], sizes[props.size]].join(' ')
})
</script>
