<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <!-- Full Width Header -->
    <AppHeader :breadcrumbs="breadcrumbs">
      <template #actions>
        <slot name="actions" />
      </template>
    </AppHeader>

    <!-- Main Layout: Sidebar + Content + Details -->
    <div class="grid overflow-hidden" style="grid-template-columns: auto 1fr auto;">
      <!-- Left Sidebar -->
      <AppSidebar />

      <!-- Center Content -->
      <AppContent>
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </AppContent>

      <!-- Right Details Panel -->
      <AppDetails>
        <slot name="details" />
      </AppDetails>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import AppContent from './AppContent.vue'
import AppDetails from './AppDetails.vue'

interface Breadcrumb {
  label: string
  to?: string
}

interface Props {
  breadcrumbs?: Breadcrumb[]
}

const props = withDefaults(defineProps<Props>(), {
  breadcrumbs: () => [],
})

const route = useRoute()

// Computed breadcrumbs - can be overridden by prop
const breadcrumbs = computed(() => {
  if (props.breadcrumbs.length > 0) {
    return props.breadcrumbs
  }
  // Will use auto-generated breadcrumbs from AppHeader
  return []
})
</script>
