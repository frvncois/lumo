<template>
  <aside class="bg-white dark:bg-gray-900 dark:border dark:border-gray-800 flex flex-col items-center p-3 gap-2 self-start rounded-2xl m-10">
    <!-- Navigation Icons -->
    <Tooltip text="Content" position="right">
      <Button
        @click="router.push('/admin')"
        variant="ghost"
        class="!w-10 !h-10 !p-0"
        :class="isActive('Dashboard') ? '!bg-gray-800 !text-gray-50' : ''"
      >
        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path d="M14,21H6a2,2,0,0,1-2-2V9A2,2,0,0,1,6,7h8a2,2,0,0,1,2,2V19A2,2,0,0,1,14,21Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
          <path d="M16,17h2a2,2,0,0,0,2-2V5a2,2,0,0,0-2-2H10A2,2,0,0,0,8,5V7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
          <path d="M8,12h4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
          <path d="M8,16h4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
        </svg>
      </Button>
    </Tooltip>

    <Tooltip text="Files" position="right">
      <Button
        @click="router.push('/admin/media')"
        variant="ghost"
        class="!w-10 !h-10 !p-0"
        :class="isActive('MediaLibrary') ? '!bg-gray-800 !text-gray-50' : ''"
      >
        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path d="M12,20h7a2,2,0,0,0,2-2V8.94a2,2,0,0,0-2-2H12.529A1,1,0,0,1,11.7,6.5L10.3,4.437A1,1,0,0,0,9.471,4H5A2,2,0,0,0,3,6v4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
          <path d="M6,17V13.5A1.5,1.5,0,0,1,7.5,12h0A1.5,1.5,0,0,1,9,13.5V17a3,3,0,0,1-3,3H6a3,3,0,0,1-3-3V14" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
        </svg>
      </Button>
    </Tooltip>

    <!-- Settings (Owner only) -->
    <Tooltip v-if="userRole === 'owner'" text="Settings" position="right">
      <Button
        @click="router.push('/admin/settings')"
        variant="ghost"
        class="!w-10 !h-10 !p-0"
        :class="isActive('Settings') ? '!bg-gray-800 !text-gray-50' : ''"
      >
        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path d="M12.8,3a1,1,0,0,1,.941.662l.508,1.415a1.006,1.006,0,0,0,.442.528l1.507.87a1,1,0,0,0,.677.118l1.48-.267A1,1,0,0,1,19.4,6.81l.8,1.38a1,1,0,0,1-.1,1.146l-.971,1.148a1,1,0,0,0-.237.646v1.74a1,1,0,0,0,.237.646l.971,1.148a1,1,0,0,1,.1,1.146l-.8,1.38a1,1,0,0,1-1.044.484l-1.48-.267a1,1,0,0,0-.677.118l-1.507.87a1.006,1.006,0,0,0-.442.528l-.508,1.415A1,1,0,0,1,12.8,21H11.2a1,1,0,0,1-.941-.662l-.508-1.415A1.009,1.009,0,0,0,9.31,18.4L7.8,17.525a1,1,0,0,0-.677-.118l-1.48.267A1,1,0,0,1,4.6,17.19l-.8-1.38a1,1,0,0,1,.1-1.146l.971-1.148a1,1,0,0,0,.237-.646V11.13a1,1,0,0,0-.237-.646L3.91,9.336a1,1,0,0,1-.1-1.146l.8-1.38a1,1,0,0,1,1.044-.484l1.48.267a1,1,0,0,0,.677-.118l1.508-.87a1.009,1.009,0,0,0,.441-.528l.508-1.415A1,1,0,0,1,11.2,3Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
          <circle cx="2.75" cy="2.75" r="2.75" transform="translate(9.25 9.25)" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
        </svg>
      </Button>
    </Tooltip>

    <!-- User -->
    <UserPopover
      :user="{ email: userEmail, role: userRole }"
      @account-settings="showAccountSettings = true"
      @logout="handleLogout"
    >
      <Button
        variant="outline"
        class="!w-10 !h-10 !p-0"
      >
        <span class="text-sm font-medium">
          {{ userInitial }}
        </span>
      </Button>
    </UserPopover>

    <!-- Account Settings Modal -->
    <AccountSettingsModal
      v-if="showAccountSettings"
      :user="{ email: userEmail, role: userRole }"
      @close="showAccountSettings = false"
    />
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../utils/api'
import { Tooltip, Button } from './ui'
import UserPopover from './UserPopover.vue'
import AccountSettingsModal from './AccountSettingsModal.vue'

const route = useRoute()
const router = useRouter()

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
    const user = await api.getMe()
    userEmail.value = user.email
    userRole.value = user.role
  } catch (error) {
    console.error('Failed to get user:', error)
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
