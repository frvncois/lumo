<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md overflow-hidden">
      <div class="p-4 border-b dark:border-gray-700 flex justify-between items-center">
        <h2 class="text-lg font-semibold dark:text-white">Account Settings</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>

      <div class="p-6 space-y-6">
        <!-- Email (read-only) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input
            :value="user.email"
            type="email"
            class="input w-full bg-gray-50 dark:bg-gray-800 dark:text-white"
            readonly
          />
        </div>

        <!-- Role (read-only) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
          <input
            :value="user.role"
            type="text"
            class="input w-full bg-gray-50 dark:bg-gray-800 dark:text-white capitalize"
            readonly
          />
        </div>

        <!-- Theme -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Theme</label>
          <select
            v-model="selectedTheme"
            @change="handleThemeChange"
            class="input w-full dark:bg-gray-800 dark:text-white dark:border-gray-700"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <!-- Change Password Section -->
        <div class="border-t dark:border-gray-700 pt-6">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Change Password</h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
              <input
                v-model="passwordForm.currentPassword"
                type="password"
                class="input w-full dark:bg-gray-800 dark:text-white dark:border-gray-700"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
              <input
                v-model="passwordForm.newPassword"
                type="password"
                class="input w-full dark:bg-gray-800 dark:text-white dark:border-gray-700"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
              <input
                v-model="passwordForm.confirmPassword"
                type="password"
                class="input w-full dark:bg-gray-800 dark:text-white dark:border-gray-700"
                placeholder="Confirm new password"
              />
            </div>

            <div v-if="error" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-800 dark:text-red-200 text-sm">
              {{ error }}
            </div>

            <div v-if="success" class="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-800 dark:text-green-200 text-sm">
              {{ success }}
            </div>

            <button
              @click="handleChangePassword"
              :disabled="isChangingPassword"
              class="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isChangingPassword ? 'Changing...' : 'Change Password' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { api } from '../utils/api'
import { useTheme } from '../composables/useTheme'

const props = defineProps<{
  user: {
    email: string
    role: string
  }
}>()

const emit = defineEmits<{
  close: []
}>()

const { theme, setTheme } = useTheme()
const selectedTheme = ref(theme.value)

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const isChangingPassword = ref(false)
const error = ref('')
const success = ref('')

function handleThemeChange() {
  setTheme(selectedTheme.value)
}

async function handleChangePassword() {
  error.value = ''
  success.value = ''

  // Validation
  if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
    error.value = 'All fields are required'
    return
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    error.value = 'New passwords do not match'
    return
  }

  if (passwordForm.newPassword.length < 8) {
    error.value = 'New password must be at least 8 characters'
    return
  }

  isChangingPassword.value = true

  try {
    await api.changePassword(passwordForm.currentPassword, passwordForm.newPassword)
    success.value = 'Password changed successfully!'

    // Reset form
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''

    // Close modal after 2 seconds
    setTimeout(() => {
      emit('close')
    }, 2000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to change password'
  } finally {
    isChangingPassword.value = false
  }
}
</script>
