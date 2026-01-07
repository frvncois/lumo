<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div v-if="isVerifying" class="text-center">
        <h2 class="text-2xl font-bold text-gray-900">Verifying...</h2>
        <p class="mt-2 text-gray-600">Please wait while we sign you in.</p>
      </div>

      <div v-else-if="error" class="rounded-md bg-red-50 p-4">
        <h3 class="text-sm font-medium text-red-800">Verification failed</h3>
        <p class="mt-2 text-sm text-red-700">{{ error }}</p>
        <div class="mt-4">
          <router-link to="/admin/login" class="btn btn-primary">
            Back to login
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const isVerifying = ref(true)
const error = ref('')

onMounted(async () => {
  const token = route.query.token as string

  if (!token) {
    error.value = 'No verification token provided'
    isVerifying.value = false
    return
  }

  try {
    // The verification endpoint sets the session cookie and redirects
    const response = await fetch(`/api/auth/verify?token=${token}`, {
      credentials: 'include',
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error?.message || 'Verification failed')
    }

    // Get redirect path from query or default to dashboard
    const redirect = (route.query.redirect as string) || '/admin'
    router.push(redirect)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Verification failed'
  } finally {
    isVerifying.value = false
  }
})
</script>
