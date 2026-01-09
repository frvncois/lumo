<template>
  <div>
    <div v-if="isLoading" class="text-gray-600">Loading media...</div>

    <Card v-else>
      <CardHeader :title="currentFilterLabel">
        <template #actions>
          <Button variant="default" size="sm" @click="triggerFileUpload">
            Upload Media
          </Button>
          <input
            ref="fileInputRef"
            type="file"
            @change="handleFileSelect"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            class="hidden"
          />
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
              <Button
                variant="outline"
                size="sm"
                @click.stop="triggerReplaceFile(item.id)"
              >
                Replace
              </Button>
              <input
                :ref="el => setReplaceInputRef(item.id, el)"
                type="file"
                @change="handleReplace(item, $event)"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                class="hidden"
              />
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
import { Card, CardHeader, CardContent, Button, List, ListItem } from '../components/ui'
import { api } from '../utils/api'
import { useDialog } from '../composables/useDialog'
import { useToast } from '../composables/useToast'

const dialog = useDialog()
const toast = useToast()

const media = ref<any[]>([])
const filterType = ref<'all' | 'image' | 'video' | 'audio' | 'document'>('all')
const isLoading = ref(true)
const isUploading = ref(false)
const mounted = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const replaceInputRefs = ref<Map<string, HTMLInputElement>>(new Map())

const filteredMedia = computed(() => {
  if (filterType.value === 'all') return media.value
  return media.value.filter((item) => getMediaType(item.mimeType) === filterType.value)
})

const currentFilterLabel = computed(() => {
  const labels = {
    all: 'All Media',
    image: 'Images',
    video: 'Videos',
    audio: 'Audio',
    document: 'Documents'
  }
  return labels[filterType.value]
})

watch(filterType, () => {
  loadMedia()
})

onMounted(async () => {
  mounted.value = true
  await loadMedia()
})

async function loadMedia() {
  isLoading.value = true

  try {
    const options = filterType.value === 'all' ? {} : { type: filterType.value }
    const result = await api.listMedia(options)
    media.value = result.items
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to load media')
  } finally {
    isLoading.value = false
  }
}

function triggerFileUpload() {
  fileInputRef.value?.click()
}

function setReplaceInputRef(itemId: string, el: any) {
  if (el) {
    replaceInputRefs.value.set(itemId, el as HTMLInputElement)
  }
}

function triggerReplaceFile(itemId: string) {
  const input = replaceInputRefs.value.get(itemId)
  input?.click()
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  isUploading.value = true

  try {
    await api.uploadMedia(file)
    await loadMedia()
    toast.success('Media uploaded successfully!')

    // Reset file input
    target.value = ''
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to upload media')
  } finally {
    isUploading.value = false
  }
}

async function handleReplace(item: any, event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  const confirmed = await dialog.confirm(
    'Replace this media file? The URL will stay the same but the content will be updated.',
    {
      title: 'Replace Media',
      confirmText: 'Replace',
      variant: 'primary'
    }
  )

  if (!confirmed) {
    target.value = ''
    return
  }

  isUploading.value = true

  try {
    await api.replaceMedia(item.id, file)
    await loadMedia()
    toast.success('Media replaced successfully!')

    // Reset file input
    target.value = ''
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to replace media')
  } finally {
    isUploading.value = false
  }
}

async function handleDelete(item: any) {
  const confirmed = await dialog.confirm(
    'Are you sure you want to delete this media? This cannot be undone.',
    {
      title: 'Delete Media',
      confirmText: 'Delete',
      variant: 'danger'
    }
  )

  if (!confirmed) return


  try {
    await api.deleteMedia(item.id)
    await loadMedia()
    toast.success('Media deleted successfully!')
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to delete media')
  }
}

function getMediaType(mimeType: string): 'image' | 'video' | 'audio' | 'document' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'document'
}

function getMediaSubtitle(item: any): string {
  const parts = [item.mimeType]

  if (item.width && item.height) {
    parts.push(`${item.width} × ${item.height}`)
  }

  if (item.duration) {
    parts.push(formatDuration(item.duration))
  }

  parts.push(new Date(item.createdAt).toLocaleDateString())

  return parts.join(' • ')
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
</script>
