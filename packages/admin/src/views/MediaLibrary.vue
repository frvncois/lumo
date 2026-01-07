<template>
  <div>
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4 text-red-800 mb-6">
      {{ error }}
    </div>

    <div v-if="uploadSuccess" class="bg-green-50 border border-green-200 rounded-md p-4 text-green-800 mb-6">
      Media uploaded successfully!
    </div>

    <div v-if="isUploading" class="bg-blue-50 border border-blue-200 rounded-md p-4 text-blue-800 mb-6">
      Uploading...
    </div>

    <div v-if="isLoading" class="text-gray-600">Loading media...</div>

    <Card v-else>
      <CardHeader :title="currentFilterLabel">
        <template #actions>
          <label class="cursor-pointer">
            <Button variant="default" size="sm">
              Upload Media
            </Button>
            <input
              type="file"
              @change="handleFileSelect"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              class="hidden"
            />
          </label>
        </template>
      </CardHeader>
      <CardContent>
        <div v-if="filteredMedia.length === 0" class="p-1">
          No media found. Upload your first file.
        </div>
        <List v-else>
          <ListItem
            v-for="item in filteredMedia"
            :key="item.id"
            :title="item.id"
            :subtitle="getMediaSubtitle(item)"
            :showArrow="false"
          >
            <template #actions>
              <a
                :href="item.url"
                download
                @click.stop
              >
                <Button variant="outline" size="sm">
                  Download
                </Button>
              </a>
              <label class="cursor-pointer" @click.stop>
                <Button variant="outline" size="sm">
                  Replace
                </Button>
                <input
                  type="file"
                  @change="handleReplace(item, $event)"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                  class="hidden"
                />
              </label>
              <Button
                @click.stop="handleDelete(item)"
                variant="outline"
                size="sm"
                class="!text-red-600 !border-red-300 hover:!bg-red-50"
              >
                Delete
              </Button>
            </template>
          </ListItem>
        </List>
      </CardContent>
    </Card>

    <!-- Teleport Details Panel -->
    <Teleport to="#details-panel" v-if="mounted">
      <Card>
        <CardHeader title="Filter by Type" />
        <CardContent>
          <div class="space-y-2">
            <button
              @click="filterType = 'all'"
              :class="[
                filterType === 'all'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
                'w-full px-3 py-2 border rounded-lg font-medium text-sm transition-colors text-left',
              ]"
            >
              All Media
            </button>
            <button
              @click="filterType = 'image'"
              :class="[
                filterType === 'image'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
                'w-full px-3 py-2 border rounded-lg font-medium text-sm transition-colors text-left',
              ]"
            >
              Images
            </button>
            <button
              @click="filterType = 'video'"
              :class="[
                filterType === 'video'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
                'w-full px-3 py-2 border rounded-lg font-medium text-sm transition-colors text-left',
              ]"
            >
              Videos
            </button>
            <button
              @click="filterType = 'audio'"
              :class="[
                filterType === 'audio'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
                'w-full px-3 py-2 border rounded-lg font-medium text-sm transition-colors text-left',
              ]"
            >
              Audio
            </button>
            <button
              @click="filterType = 'document'"
              :class="[
                filterType === 'document'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
                'w-full px-3 py-2 border rounded-lg font-medium text-sm transition-colors text-left',
              ]"
            >
              Documents
            </button>
          </div>
        </CardContent>
      </Card>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { api } from '../utils/api'

const media = ref<any[]>([])
const filterType = ref<'all' | 'image' | 'video' | 'audio' | 'document'>('all')
const isLoading = ref(true)
const isUploading = ref(false)
const error = ref('')
const uploadSuccess = ref(false)

const filteredMedia = computed(() => {
  if (filterType.value === 'all') return media.value
  return media.value.filter((item) => getMediaType(item.mimeType) === filterType.value)
})

watch(filterType, () => {
  loadMedia()
})

onMounted(async () => {
  await loadMedia()
})

async function loadMedia() {
  isLoading.value = true
  error.value = ''

  try {
    const options = filterType.value === 'all' ? {} : { type: filterType.value }
    const result = await api.listMedia(options)
    media.value = result.items
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load media'
  } finally {
    isLoading.value = false
  }
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  isUploading.value = true
  error.value = ''
  uploadSuccess.value = false

  try {
    await api.uploadMedia(file)
    uploadSuccess.value = true
    await loadMedia()

    setTimeout(() => {
      uploadSuccess.value = false
    }, 3000)

    // Reset file input
    target.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to upload media'
  } finally {
    isUploading.value = false
  }
}

async function handleReplace(item: any, event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  if (!confirm(`Replace this media file? The URL will stay the same but the content will be updated.`)) {
    target.value = ''
    return
  }

  isUploading.value = true
  error.value = ''
  uploadSuccess.value = false

  try {
    await api.replaceMedia(item.id, file)
    uploadSuccess.value = true
    await loadMedia()

    setTimeout(() => {
      uploadSuccess.value = false
    }, 3000)

    // Reset file input
    target.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to replace media'
  } finally {
    isUploading.value = false
  }
}

async function handleDelete(item: any) {
  if (!confirm(`Are you sure you want to delete this media? This cannot be undone.`)) {
    return
  }

  error.value = ''

  try {
    await api.deleteMedia(item.id)
    await loadMedia()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete media'
  }
}

function getMediaType(mimeType: string): 'image' | 'video' | 'audio' | 'document' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'document'
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>
