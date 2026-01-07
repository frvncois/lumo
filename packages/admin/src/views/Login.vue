<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white rounded-3xl p-10">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          LUMO Admin
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Sign in to your account
        </p>
      </div>

      <div class="mt-8 space-y-6">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-4">
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
                autocomplete="current-password"
                required
                class="input"
                placeholder="Password"
              />
            </div>
          </div>

          <div v-if="error" class="rounded-md bg-red-50 p-4">
            <p class="text-sm text-red-800">{{ error }}</p>
          </div>

          <div>
            <button
              type="submit"
              :disabled="isLoading || !isFormValid"
              class="w-full btn btn-primary"
            >
              {{ isLoading ? 'Signing in...' : 'Sign in' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../utils/api'

const router = useRouter()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref('')

const isFormValid = computed(() => {
  return email.value.length > 0 && password.value.length > 0
})

onMounted(async () => {
  try {
    const status = await api.getAuthStatus()

    // If setup is needed, redirect to setup page
    if (status.needsSetup) {
      router.push('/admin/setup')
      return
    }
  } catch (err) {
    // If status check fails, continue with login
  }
})

async function handleSubmit() {
  if (!isFormValid.value) return

  isLoading.value = true
  error.value = ''

  try {
    await api.login(email.value, password.value)
    // Redirect to dashboard on success
    router.push('/admin')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Invalid email or password'
  } finally {
    isLoading.value = false
  }
}
</script>
