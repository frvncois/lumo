<template>
  <div class="p-4">
    <div v-if="title || $slots.default" class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="bg-gray-100 rounded-full flex items-center justify-center w-8 h-8">
          <component v-if="icon" :is="icon" class="w-3 h-3" />
          <span v-else class="text-xs text-gray-400">?</span>
        </div>
        <div>
          <h2 v-if="title" class="text-gray-900">{{ title }}</h2>
          <p v-if="subtitle" class="text-sm text-gray-600 mt-1">{{ subtitle }}</p>
        </div>
      </div>
      <div v-if="$slots.actions" class="flex items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
    <slot v-if="!title" />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  title?: string
  subtitle?: string
  icon?: Component
}>()
</script>
