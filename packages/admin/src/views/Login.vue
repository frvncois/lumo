<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white rounded-3xl p-10">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          LUMO Admin
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          {{ useMagicLink ? 'Sign in with magic link' : 'Sign in to your account' }}
        </p>
      </div>

      <div v-if="!emailSent" class="mt-8 space-y-6">
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

            <div v-if="!useMagicLink">
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
              {{ isLoading ? (useMagicLink ? 'Sending...' : 'Signing in...') : (useMagicLink ? 'Send magic link' : 'Sign in') }}
            </button>
          </div>
        </form>

        <div v-if="emailEnabled" class="text-center">
          <button
            @click="toggleLoginMethod"
            class="text-sm text-gray-600 hover:text-gray-500"
          >
            {{ useMagicLink ? 'Sign in with password instead' : 'Or sign in with magic link' }}
          </button>
        </div>
      </div>

      <div v-else class="mt-8 rounded-md bg-green-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-green-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800">
              Magic link sent!
            </h3>
            <p class="mt-2 text-sm text-green-700">
              Check your email for a sign-in link. The link will expire in 15 minutes.
            </p>
          </div>
        </div>
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
const emailSent = ref(false)
const isLoading = ref(false)
const error = ref('')
const emailEnabled = ref(false)
const useMagicLink = ref(false)

const isFormValid = computed(() => {
  if (useMagicLink.value) {
    return email.value.length > 0
  }
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

    emailEnabled.value = status.emailEnabled
  } catch (err) {
    // If status check fails, continue with login
  }
})

function toggleLoginMethod() {
  useMagicLink.value = !useMagicLink.value
  error.value = ''
  password.value = ''
}

async function handleSubmit() {
  if (!isFormValid.value) return

  isLoading.value = true
  error.value = ''

  try {
    if (useMagicLink.value) {
      await api.requestMagicLink(email.value)
      emailSent.value = true
    } else {
      await api.login(email.value, password.value)
      // Redirect to dashboard on success
      router.push('/admin')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : (useMagicLink.value ? 'Failed to send magic link' : 'Invalid email or password')
  } finally {
    isLoading.value = false
  }
}
</script>
