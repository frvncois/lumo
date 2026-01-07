import { ref } from 'vue'
import { api } from '../utils/api'

interface User {
  id: string
  email: string
  role: string
}

const user = ref<User | null>(null)
const isAuthenticated = ref(false)
const isLoading = ref(false)

export function useAuth() {
  async function checkAuth() {
    isLoading.value = true
    try {
      const data = await api.getMe()
      user.value = data
      isAuthenticated.value = true
      return true
    } catch (error) {
      user.value = null
      isAuthenticated.value = false
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    try {
      await api.logout()
    } finally {
      user.value = null
      isAuthenticated.value = false
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    checkAuth,
    logout,
  }
}
