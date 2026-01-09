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
      <!-- Post Title -->
      <Card>
        <CardHeader title="Title" />
        <CardContent>
          <Input
            v-model="translationTitle"
            placeholder="Post title"
            variant="ghost"
            size="lg"
          />
        </CardContent>
      </Card>

      <!-- Form Fields -->
      <Card v-for="field in postTypeSchema.fields" :key="field.key">
        <CardHeader>
          <h2 class="text-gray-900">
            {{ field.label || field.key }}
            <span v-if="field.required" class="text-red-500">*</span>
          </h2>
        </CardHeader>
        <CardContent>
          <FieldRenderer
            :field="field"
            :modelValue="translationFields[field.key]"
            @update:modelValue="updateField(field.key, $event)"
          />
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
      <!-- Post Settings -->
      <Card>
        <CardHeader title="Post Settings" />
        <CardContent>
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-500 uppercase mb-2">Status</label>
              <select v-model="post.status" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-500 uppercase mb-2">Published Date</label>
              <input
                v-model="publishedDate"
                type="datetime-local"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div v-if="showPositionField">
              <label class="block text-xs font-medium text-gray-500 uppercase mb-2">Position</label>
              <input
                v-model.number="post.position"
                type="number"
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Optional"
              />
              <p class="text-xs text-gray-500 mt-1">
                Lower numbers appear first
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-500 uppercase mb-2">Slug</label>
              <input
                v-model="translationSlug"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                placeholder="post-slug"
              />
            </div>

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
          </div>
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
const { config, getPostTypeSchema, refresh: refreshConfig } = useConfig()
const { isCreatingPreview, createPreview } = usePreview()

const postId = computed(() => route.params.id as string)
const postType = computed(() => route.params.type as string)
const postTypeSchema = computed(() => getPostTypeSchema(postType.value))

const post = ref<any>({ status: 'draft', position: null, translations: {} })
const currentLanguage = ref('')
const publishedDate = ref('')
const isLoading = ref(true)
const isSaving = ref(false)
const isDeleting = ref(false)
const isDeletingTranslation = ref(false)
const error = ref('')
const saveSuccess = ref(false)
const mounted = ref(false)
const isUpdatingDate = ref(false)

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
    if (isUpdatingDate.value) return
    isUpdatingDate.value = true
    if (value) {
      // Convert ISO string to datetime-local format
      const date = new Date(value)
      publishedDate.value = date.toISOString().slice(0, 16)
    } else {
      // Set to current time if not set
      const now = new Date()
      publishedDate.value = now.toISOString().slice(0, 16)
    }
    isUpdatingDate.value = false
  },
  { immediate: true }
)

watch(publishedDate, (value) => {
  if (isUpdatingDate.value) return
  if (post.value && value) {
    isUpdatingDate.value = true
    post.value.publishedAt = new Date(value).toISOString()
    isUpdatingDate.value = false
  }
})

// Watch currentLanguage changes to load translation data
watch(currentLanguage, () => {
  loadTranslationData()
})

onMounted(async () => {
  mounted.value = true
  // Refresh config to ensure we have the latest schema
  await refreshConfig()
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
    // For new translations, set defaults
    translationTitle.value = 'Untitled'
    // Convert postId to slug-friendly format (lowercase, replace underscore with hyphen)
    translationSlug.value = postId.value.toLowerCase().replace(/_/g, '-')

    // Initialize translationFields with defaults only for specific types
    const fieldDefaults: Record<string, any> = {}
    if (postTypeSchema.value?.fields) {
      for (const field of postTypeSchema.value.fields) {
        // Only initialize fields that need non-empty defaults
        if (field.type === 'boolean') {
          fieldDefaults[field.key] = false
        } else if (field.type === 'repeater') {
          fieldDefaults[field.key] = []
        }
        // Don't initialize text/other fields - leave them undefined
        // FieldRenderer will handle undefined values, and updateField will add them as user types
      }
    }
    translationFields.value = fieldDefaults
  }
}

async function loadPost() {
  isLoading.value = true
  error.value = ''

  try {
    post.value = await api.getPost(postId.value)

    // Set default published date to current time if not set
    if (!post.value.publishedAt) {
      post.value.publishedAt = new Date().toISOString()
    }
  } catch (err) {
    // If post doesn't exist yet (new post), set id, type, and publishedAt
    post.value.id = postId.value
    post.value.type = postType.value
    post.value.publishedAt = new Date().toISOString()
    error.value = ''
  } finally {
    isLoading.value = false
  }
}

function updateField(key: string, value: any) {
  translationFields.value[key] = value
}

async function handleSave() {
  if (!post.value || !postTypeSchema.value) return

  console.log('Post type schema:', JSON.stringify(postTypeSchema.value, null, 2))

  // Validate required fields before saving
  if (!translationTitle.value || !translationTitle.value.trim()) {
    error.value = 'Title is required'
    return
  }
  if (!translationSlug.value || !translationSlug.value.trim()) {
    error.value = 'Slug is required'
    return
  }

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
      title: translationTitle.value.trim(),
      slug: translationSlug.value.trim(),
      fields: translationFields.value,
    }

    console.log('Saving translation:', {
      postId: postId.value,
      language: currentLanguage.value,
      slug: translationSlug.value,
      title: translationTitle.value,
      fields: translationFields.value
    })
    console.log('Fields as JSON:', JSON.stringify(translationFields.value, null, 2))
    console.log('Translation content:', JSON.stringify(translationContent, null, 2))

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
  } catch (err: any) {
    console.error('Save failed:', err)
    console.error('Error details:', err.details)
    console.error('Error message:', err.message)
    if (err.details) {
      console.error('Validation errors:', JSON.stringify(err.details, null, 2))
    }
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
