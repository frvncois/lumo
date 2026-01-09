<template>
  <div v-if="loading" class="text-gray-600 dark:text-gray-400">
    {{ loadingText }}
  </div>
  <div v-else class="p-3 text-sm text-gray-600 dark:text-gray-400">
    {{ message }}
    <button @click="$emit('action')" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline">
      {{ actionText }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean
  loadingText: string
  message: string
  actionText: string
}>()

defineEmits<{
  action: []
}>()
</script>
