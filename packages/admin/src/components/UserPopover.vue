<template>
  <div class="relative" @mouseenter="showPopover = true" @mouseleave="showPopover = false">
    <!-- Trigger Button -->
    <slot />

    <!-- Popover -->
    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="showPopover"
        class="absolute left-full ml-2 bottom-0 z-50 w-64 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4"
        @mouseenter="showPopover = true"
        @mouseleave="showPopover = false"
      >
        <!-- User Info -->
        <div class="mb-4 pb-4 border-b dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gray-800 dark:bg-gray-700 text-white flex items-center justify-center font-medium">
              {{ userInitial }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ user.email }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {{ user.role }}
              </p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="space-y-2">
          <button
            @click="handleAccountSettings"
            class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Account Settings
          </button>

          <button
            @click="handleLogout"
            class="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  user: {
    email: string
    role: string
  }
}>()

const emit = defineEmits<{
  accountSettings: []
  logout: []
}>()

const showPopover = ref(false)

const userInitial = computed(() => {
  return props.user.email.charAt(0).toUpperCase() || 'U'
})

function handleAccountSettings() {
  showPopover.value = false
  emit('accountSettings')
}

function handleLogout() {
  showPopover.value = false
  emit('logout')
}
</script>
