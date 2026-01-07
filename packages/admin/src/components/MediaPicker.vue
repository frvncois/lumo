<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
      <div class="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">Select Media</h2>
        <button @click="emit('close')" class="text-gray-400 hover:text-gray-600">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="p-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
        <div v-if="isLoading" class="text-center py-8 text-gray-600">
          Loading media...
        </div>
        <div v-else-if="error" class="text-center py-8 text-red-600">
          {{ error }}
        </div>
        <div v-else-if="media.length === 0" class="text-center py-8 text-gray-600">
          No media found. Upload images from the Media Library.
        </div>
        <div v-else class="grid grid-cols-3 gap-4">
          <button
            v-for="item in media"
            :key="item.id"
            @click="emit('select', item)"
            class="relative aspect-square border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-500 transition-colors"
          >
            <img
              :src="`/api/media/${item.id}/file`"
              :alt="item.filename"
              class="w-full h-full object-cover"
            />
            <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 truncate">
              {{ item.filename }}
            </div>
          </button>
        </div>
      </div>

      <div class="p-4 border-t border-gray-200 flex justify-end">
        <button @click="emit('close')" class="btn btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../utils/api'

const emit = defineEmits<{
  (e: 'select', media: any): void
  (e: 'close'): void
}>()

const media = ref<any[]>([])
const isLoading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const result = await api.listMedia({ type: 'image' })
    media.value = result.items
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load media'
  } finally {
    isLoading.value = false
  }
})
</script>
