<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Settings</h1>
      <p class="text-gray-600 mt-1">Manage your Lumo configuration</p>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex space-x-8">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="currentTab = tab.id"
          :class="[
            currentTab === tab.id
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
          ]"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div>
      <component :is="currentTabComponent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SettingsGeneral from '../components/settings/SettingsGeneral.vue'
import SettingsSchema from '../components/settings/SettingsSchema.vue'
import SettingsAPI from '../components/settings/SettingsAPI.vue'
import SettingsUsers from '../components/settings/SettingsUsers.vue'

const route = useRoute()
const router = useRouter()

const tabs = [
  { id: 'general', label: 'General' },
  { id: 'schema', label: 'Schema' },
  { id: 'api', label: 'API' },
  { id: 'users', label: 'Users' },
]

const currentTab = ref('general')

// Initialize tab from query parameter
onMounted(() => {
  const tabParam = route.query.tab as string
  if (tabParam && tabs.some(t => t.id === tabParam)) {
    currentTab.value = tabParam
  }
})

// Update URL when tab changes
watch(currentTab, (newTab) => {
  router.replace({ query: { tab: newTab } })
})

const currentTabComponent = computed(() => {
  switch (currentTab.value) {
    case 'general':
      return SettingsGeneral
    case 'schema':
      return SettingsSchema
    case 'api':
      return SettingsAPI
    case 'users':
      return SettingsUsers
    default:
      return SettingsGeneral
  }
})
</script>
