<template>
  <div class="space-y-6">
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900">Users & Collaborators</h2>
          <Button variant="default" size="sm" disabled>
            Invite User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div class="text-sm text-gray-600">
          <p class="mb-4">User management coming soon.</p>
          <p class="text-xs text-gray-500">
            This feature will allow you to invite collaborators and manage user permissions.
          </p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <h2 class="text-xl font-semibold text-gray-900">Current User</h2>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          <div>
            <dt class="text-sm font-medium text-gray-700">Email</dt>
            <dd class="text-sm text-gray-900 mt-1">{{ user?.email || 'Loading...' }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-700">Role</dt>
            <dd class="text-sm text-gray-900 mt-1 capitalize">{{ user?.role || 'Loading...' }}</dd>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Card, CardHeader, CardContent, Button } from '../ui'
import { api } from '../../utils/api'

const user = ref<any>(null)

onMounted(async () => {
  try {
    user.value = await api.getMe()
  } catch (error) {
    console.error('Failed to get user:', error)
  }
})
</script>
