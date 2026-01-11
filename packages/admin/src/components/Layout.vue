<template>
  <div class="flex flex-col bg-gray-50 dark:bg-gray-950">
    <AppHeader />
    <div class="grid flex-1 gap-8 p-8 max-w-6xl mx-auto w-full" style="grid-template-columns: 1fr 0.33fr;">
      <AppContent>
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </AppContent>
      <AppDetails>
        <slot name="details" />
      </AppDetails>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from './AppHeader.vue'
import AppContent from './AppContent.vue'
import AppDetails from './AppDetails.vue'
</script>
