<template>
  <header class="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-50 grid items-center h-16" style="grid-template-columns: auto 1fr auto;">
    <!-- Left: App Logo -->
    <div class="flex items-center justify-center px-10">
      <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ projectName || 'LUMO' }}</h1>
    </div>

    <!-- Center: Combobox Search -->
    <div class="flex items-center justify-center px-10">
      <ComboboxSearch />
    </div>

    <!-- Right: Action Buttons -->
    <div id="header-actions" class="flex items-center justify-end gap-3 px-10">
      <slot name="actions">
        <!-- Default actions slot - can be overridden -->
      </slot>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ComboboxSearch from './ComboboxSearch.vue'
import { api } from '../utils/api'

const projectName = ref('')

onMounted(async () => {
  try {
    const config = await api.getConfig()
    projectName.value = config.projectName || ''
  } catch (error) {
    console.error('Failed to load project name:', error)
  }
})
</script>
