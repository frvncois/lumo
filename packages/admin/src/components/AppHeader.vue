<template>
  <header class="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-50">
    <div class="flex items-center h-16 px-6 gap-6">
      <!-- Left: Logo -->
      <div class="flex items-center flex-shrink-0">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ projectName || 'LUMO' }}</h1>
      </div>

      <!-- Center: Max-width container for routes and search -->
      <div class="flex-1 flex justify-center">
        <div class="max-w-6xl w-full flex items-center justify-between gap-6 px-8">
          <!-- Navigation Routes -->
          <nav class="flex items-center gap-1">
            <Button
              @click="router.push('/admin')"
              variant="outline"
              size="sm"
              :class="isActive('Dashboard') ? 'bg-gray-100 dark:bg-gray-800' : ''"
            >
              <svg class="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path d="M14,21H6a2,2,0,0,1-2-2V9A2,2,0,0,1,6,7h8a2,2,0,0,1,2,2V19A2,2,0,0,1,14,21Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
                <path d="M16,17h2a2,2,0,0,0,2-2V5a2,2,0,0,0-2-2H10A2,2,0,0,0,8,5V7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
                <path d="M8,12h4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
                <path d="M8,16h4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
              </svg>
              Content
            </Button>

            <Button
              @click="router.push('/admin/media')"
              variant="outline"
              size="sm"
              :class="isActive('MediaLibrary') ? 'bg-gray-100 dark:bg-gray-800' : ''"
            >
              <svg class="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path d="M12,20h7a2,2,0,0,0,2-2V8.94a2,2,0,0,0-2-2H12.529A1,1,0,0,1,11.7,6.5L10.3,4.437A1,1,0,0,0,9.471,4H5A2,2,0,0,0,3,6v4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
                <path d="M6,17V13.5A1.5,1.5,0,0,1,7.5,12h0A1.5,1.5,0,0,1,9,13.5V17a3,3,0,0,1-3,3H6a3,3,0,0,1-3-3V14" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
              </svg>
              Files
            </Button>

            <Button
              v-if="userRole === 'owner'"
              @click="router.push('/admin/settings')"
              variant="outline"
              size="sm"
              :class="isActive('Settings') ? 'bg-gray-100 dark:bg-gray-800' : ''"
            >
              <svg class="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path d="M12.8,3a1,1,0,0,1,.941.662l.508,1.415a1.006,1.006,0,0,0,.442.528l1.507.87a1,1,0,0,0,.677.118l1.48-.267A1,1,0,0,1,19.4,6.81l.8,1.38a1,1,0,0,1-.1,1.146l-.971,1.148a1,1,0,0,0-.237.646v1.74a1,1,0,0,0,.237.646l.971,1.148a1,1,0,0,1,.1,1.146l-.8,1.38a1,1,0,0,1-1.044.484l-1.48-.267a1,1,0,0,0-.677.118l-1.507.87a1.006,1.006,0,0,0-.442.528l-.508,1.415A1,1,0,0,1,12.8,21H11.2a1,1,0,0,1-.941-.662l-.508-1.415A1.009,1.009,0,0,0,9.31,18.4L7.8,17.525a1,1,0,0,0-.677-.118l-1.48.267A1,1,0,0,1,4.6,17.19l-.8-1.38a1,1,0,0,1,.1-1.146l.971-1.148a1,1,0,0,0,.237-.646V11.13a1,1,0,0,0-.237-.646L3.91,9.336a1,1,0,0,1-.1-1.146l.8-1.38a1,1,0,0,1,1.044-.484l1.48.267a1,1,0,0,0,.677-.118l1.508-.87a1.009,1.009,0,0,0,.441-.528l.508-1.415A1,1,0,0,1,11.2,3Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
                <circle cx="2.75" cy="2.75" r="2.75" transform="translate(9.25 9.25)" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
              </svg>
              Settings
            </Button>
          </nav>

          <!-- Search -->
          <div class="w-64">
            <ComboboxSearch />
          </div>
        </div>
      </div>

      <!-- Right: User -->
      <div class="flex items-center flex-shrink-0">
        <UserPopover
          :user="{ email: userEmail, role: userRole }"
          @account-settings="showAccountSettings = true"
          @logout="handleLogout"
        >
          <Button
            variant="outline"
            size="sm"
            class="!w-9 !h-9 !p-0"
          >
            <span class="text-sm font-medium">
              {{ userInitial }}
            </span>
          </Button>
        </UserPopover>
      </div>
    </div>

    <!-- Account Settings Modal -->
    <AccountSettingsModal
      v-if="showAccountSettings"
      :user="{ email: userEmail, role: userRole }"
      @close="showAccountSettings = false"
    />
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ComboboxSearch from './ComboboxSearch.vue'
import UserPopover from './UserPopover.vue'
import AccountSettingsModal from './AccountSettingsModal.vue'
import { Button } from './ui'
import { api } from '../utils/api'

const route = useRoute()
const router = useRouter()

const projectName = ref('')
const userEmail = ref('')
const userRole = ref('')
const showAccountSettings = ref(false)

const userInitial = computed(() => {
  return userEmail.value.charAt(0).toUpperCase() || 'U'
})

function isActive(routeName: string) {
  return route.name === routeName
}

onMounted(async () => {
  try {
    const config = await api.getConfig()
    projectName.value = config.projectName || ''

    const user = await api.getMe()
    userEmail.value = user.email
    userRole.value = user.role
  } catch (error) {
    console.error('Failed to load header data:', error)
  }
})

async function handleLogout() {
  try {
    await api.logout()
    router.push({ name: 'Login' })
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>
