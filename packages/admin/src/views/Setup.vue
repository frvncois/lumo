<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          LUMO Admin
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Create your admin account
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="mt-8 space-y-6">
        <div class="rounded-md shadow-sm space-y-4">
          <div>
            <label for="email" class="sr-only">Email address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              class="input"
              placeholder="Email address"
            />
          </div>

          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="new-password"
              required
              class="input"
              placeholder="Password"
            />
          </div>

          <div>
            <label for="confirmPassword" class="sr-only">Confirm password</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              class="input"
              placeholder="Confirm password"
            />
          </div>
        </div>

        <div class="rounded-md bg-blue-50 p-4">
          <p class="text-sm font-medium text-blue-800 mb-2">Password requirements:</p>
          <ul class="text-sm text-blue-700 space-y-1">
            <li :class="password.length >= 8 ? 'text-green-700' : ''">
              {{ password.length >= 8 ? '✓' : '•' }} At least 8 characters
            </li>
          </ul>
        </div>

        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <p class="text-sm text-red-800">{{ error }}</p>
        </div>

        <div>
          <button
            type="submit"
            :disabled="isLoading || !isValid"
            class="w-full btn btn-primary"
          >
            {{ isLoading ? 'Creating account...' : 'Create admin account' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../utils/api'

const router = useRouter()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const error = ref('')

const isValid = computed(() => {
  return (
    email.value.length > 0 &&
    password.value.length >= 8 &&
    password.value === confirmPassword.value
  )
})

async function handleSubmit() {
  if (!isValid.value) return

  isLoading.value = true
  error.value = ''

  try {
    await api.setup(email.value, password.value)
    // Redirect to dashboard on success
    router.push('/admin')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create account'
  } finally {
    isLoading.value = false
  }
}
</script>
