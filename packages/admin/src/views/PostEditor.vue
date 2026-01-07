<template>
  <div>
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4 text-red-800 mb-6">
      {{ error }}
    </div>

    <div v-if="saveSuccess" class="bg-green-50 border border-green-200 rounded-md p-4 text-green-800 mb-6">
      Post saved successfully!
    </div>

    <div v-if="isLoading" class="text-gray-600">Loading post...</div>

    <div v-else-if="post && postTypeSchema" class="space-y-6">
      <!-- Post Metadata -->
      <Card>
        <CardHeader title="Post Settings" />
        <CardContent>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select v-model="post.status" class="input">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Published Date</label>
                <input
                  v-model="publishedDate"
                  type="datetime-local"
                  class="input"
                />
              </div>
            </div>

            <div v-if="showPositionField">
              <label class="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input
                v-model.number="post.position"
                type="number"
                min="0"
                class="input"
                placeholder="Optional manual ordering"
              />
              <p class="text-sm text-gray-500 mt-1">
                Lower numbers appear first. Leave empty for automatic ordering.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>


      <!-- Translation Metadata -->
      <Card>
        <CardHeader title="Post Info" />
        <CardContent>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                v-model="translationTitle"
                type="text"
                class="input"
                placeholder="Post title"
                required
              />
            </div>

          </div>
        </CardContent>
      </Card>

      <!-- Form Fields -->
      <Card>
        <CardHeader title="Content" />
        <CardContent>
          <div class="space-y-6">
            <FieldRenderer
              v-for="field in postTypeSchema.fields"
              :key="field.key"
              :field="field"
              :modelValue="translationFields[field.key]"
              @update:modelValue="updateField(field.key, $event)"
            />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Teleport Header Actions -->
    <Teleport to="#header-actions" v-if="mounted">
      <Button
        @click="handlePreview"
        :disabled="isCreatingPreview"
        variant="outline"
        size="sm"
      >
        {{ isCreatingPreview ? 'Creating...' : 'Preview' }}
      </Button>
      <Button
        @click="handleDelete"
        :disabled="isDeleting"
        variant="outline"
        size="sm"
        class="!text-red-600 !border-red-300 hover:!bg-red-50"
      >
        {{ isDeleting ? 'Deleting...' : 'Delete' }}
      </Button>
      <Button
        @click="handleSave"
        :disabled="isSaving"
        variant="default"
        size="sm"
      >
        {{ isSaving ? 'Saving...' : 'Save' }}
      </Button>
    </Teleport>

    <!-- Teleport Details Panel -->
    <Teleport to="#details-panel" v-if="mounted">
      <!-- Language Selection -->
      <Card>
        <CardHeader title="Language" />
        <CardContent>
          <div class="space-y-2">
            <button
              v-for="lang in config?.languages || []"
              :key="lang"
              @click="currentLanguage = lang"
              :class="[
                currentLanguage === lang
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
                'w-full px-3 py-2 border rounded-lg font-medium text-sm uppercase transition-colors text-left flex items-center justify-between',
              ]"
            >
              <span>{{ lang }}</span>
              <span v-if="lang === config?.defaultLanguage" class="text-xs opacity-60">(default)</span>
            </button>
          </div>

          <Button
            v-if="currentLanguage !== config?.defaultLanguage && currentTranslation"
            @click="handleDeleteTranslation"
            :disabled="isDeletingTranslation"
            variant="outline"
            size="sm"
            class="w-full mt-3 !text-red-600 !border-red-300 hover:!bg-red-50"
          >
            {{ isDeletingTranslation ? 'Deleting...' : 'Delete Translation' }}
          </Button>
        </CardContent>
      </Card>

      <!-- Post Information -->
      <Card>
        <CardHeader title="Post Information" />
        <CardContent>
          <dl class="space-y-3">
            <div>
              <dt class="text-xs font-medium text-gray-500 uppercase">Post ID</dt>
              <dd class="text-sm text-gray-900 mt-1 font-mono">{{ postId }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-gray-500 uppercase">Post Type</dt>
              <dd class="text-sm text-gray-900 mt-1 font-mono">{{ postType }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-gray-500 uppercase">Current Language</dt>
              <dd class="text-sm text-gray-900 mt-1 uppercase">{{ currentLanguage }}</dd>
            </div>
            <div v-if="translationSlug">
              <dt class="text-xs font-medium text-gray-500 uppercase">Public API</dt>
              <dd class="text-xs text-gray-700 mt-1 font-mono break-all">
                /api/posts/{{ postType }}/{{ translationSlug }}?lang={{ currentLanguage }}
              </dd>
            </div>
            <div v-if="currentTranslation">
              <dt class="text-xs font-medium text-gray-500 uppercase">Last Updated</dt>
              <dd class="text-sm text-gray-900 mt-1">
                {{ new Date(currentTranslation.updatedAt || Date.now()).toLocaleDateString() }}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../utils/api'
import { useConfig } from '../composables/useConfig'
import { usePreview } from '../composables/usePreview'
import FieldRenderer from '../components/FieldRenderer.vue'
import { Card, CardHeader, CardContent, Button, Input } from '../components/ui'

const route = useRoute()
const router = useRouter()
const { config, getPostTypeSchema } = useConfig()
const { isCreatingPreview, createPreview } = usePreview()

const postId = computed(() => route.params.id as string)
const postType = computed(() => route.params.type as string)
const postTypeSchema = computed(() => getPostTypeSchema(postType.value))

const post = ref<any>(null)
const currentLanguage = ref('')
const publishedDate = ref('')
const isLoading = ref(true)
const isSaving = ref(false)
const isDeleting = ref(false)
const isDeletingTranslation = ref(false)
const error = ref('')
const saveSuccess = ref(false)
const mounted = ref(false)

// Translation fields
const translationTitle = ref('')
const translationSlug = ref('')
const translationFields = ref<Record<string, any>>({})

const currentTranslation = computed(() => {
  if (!post.value || !currentLanguage.value) return null
  return post.value.translations[currentLanguage.value] || null
})

const showPositionField = computed(() => {
  return postTypeSchema.value?.order === 'auto' || postTypeSchema.value?.order === 'position_asc'
})

watch(
  () => post.value?.publishedAt,
  (value) => {
    if (value) {
      // Convert ISO string to datetime-local format
      const date = new Date(value)
      publishedDate.value = date.toISOString().slice(0, 16)
    }
  }
)

watch(publishedDate, (value) => {
  if (post.value && value) {
    post.value.publishedAt = new Date(value).toISOString()
  }
})

// Watch currentLanguage changes to load translation data
watch(currentLanguage, () => {
  loadTranslationData()
})

onMounted(async () => {
  mounted.value = true
  currentLanguage.value = config.value?.defaultLanguage || 'en'
  await loadPost()
  loadTranslationData()
})

function loadTranslationData() {
  const translation = currentTranslation.value
  if (translation) {
    translationTitle.value = translation.title || ''
    translationSlug.value = translation.slug || ''
    translationFields.value = translation.fields || {}
  } else {
    // Reset to empty for new translation
    translationTitle.value = ''
    translationSlug.value = ''
    translationFields.value = {}
  }
}

async function loadPost() {
  isLoading.value = true
  error.value = ''

  try {
    post.value = await api.getPost(postId.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load post'
  } finally {
    isLoading.value = false
  }
}

function updateField(key: string, value: any) {
  translationFields.value[key] = value
}

async function handleSave() {
  if (!post.value || !postTypeSchema.value) return

  isSaving.value = true
  error.value = ''
  saveSuccess.value = false

  try {
    // Save metadata first
    await api.updatePost(postId.value, {
      status: post.value.status,
      publishedAt: post.value.publishedAt,
      position: post.value.position,
    })

    // Construct proper TranslationContent structure
    const translationContent = {
      title: translationTitle.value,
      slug: translationSlug.value,
      fields: translationFields.value,
    }

    // Save translation
    await api.updatePostTranslation(
      postId.value,
      currentLanguage.value,
      translationContent
    )

    // Reload post to get updated data
    await loadPost()
    loadTranslationData()

    saveSuccess.value = true
    setTimeout(() => {
      saveSuccess.value = false
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save post'
  } finally {
    isSaving.value = false
  }
}

async function handleDelete() {
  if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) {
    return
  }

  isDeleting.value = true
  error.value = ''

  try {
    await api.deletePost(postId.value)
    router.push(`/admin/posts/${postType.value}`)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete post'
  } finally {
    isDeleting.value = false
  }
}

async function handlePreview() {
  if (!post.value) return

  try {
    await createPreview({
      targetType: 'post',
      targetId: postId.value,
      postType: post.value.type,
      language: currentLanguage.value,
      slug: translationSlug.value || '',
      title: translationTitle.value || '',
      fields: translationFields.value,
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create preview'
  }
}

async function handleDeleteTranslation() {
  if (!post.value || currentLanguage.value === config.value?.defaultLanguage) return

  if (!confirm(`Are you sure you want to delete the ${currentLanguage.value.toUpperCase()} translation? This cannot be undone.`)) {
    return
  }

  isDeletingTranslation.value = true
  error.value = ''

  try {
    await api.deletePostTranslation(postId.value, currentLanguage.value)
    // Switch to default language
    currentLanguage.value = config.value?.defaultLanguage || 'en'
    // Reload post to get updated translations
    await loadPost()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete translation'
  } finally {
    isDeletingTranslation.value = false
  }
}
</script>
