<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">{{ postTypeSchema?.name }}</h1>
        <p class="text-gray-600 mt-1">{{ postTypeSchema?.nameSingular }}</p>
      </div>
      <button @click="createNewPost" class="btn btn-primary">
        Create {{ postTypeSchema?.nameSingular }}
      </button>
    </div>

    <div class="card">
      <div v-if="isLoading" class="text-gray-600">Loading posts...</div>
      <div v-else-if="error" class="text-red-600">{{ error }}</div>
      <div v-else-if="posts.length === 0" class="text-gray-600">
        No posts found. Create your first {{ postTypeSchema?.nameSingular?.toLowerCase() }}.
      </div>
      <div v-else class="space-y-2">
        <router-link
          v-for="post in posts"
          :key="post.id"
          :to="`/admin/posts/${type}/${post.id}`"
          class="block p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          <div class="flex justify-between items-center">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h3 class="font-medium text-gray-900">{{ getPostTitle(post) }}</h3>
                <span
                  v-if="post.status === 'draft'"
                  class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded"
                >
                  Draft
                </span>
                <span
                  v-else
                  class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded"
                >
                  Published
                </span>
              </div>
              <p class="text-sm text-gray-500 mt-1">
                {{ post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'No publish date' }}
              </p>
            </div>
            <svg
              class="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../utils/api'
import { useConfig } from '../composables/useConfig'

const route = useRoute()
const router = useRouter()
const { config, getPostTypeSchema, refresh: refreshConfig } = useConfig()

const type = computed(() => route.params.type as string)
const postTypeSchema = computed(() => getPostTypeSchema(type.value))

const posts = ref<any[]>([])
const isLoading = ref(true)
const error = ref('')

onMounted(async () => {
  // Refresh config to ensure we have the latest schema
  await refreshConfig()
  await loadPosts()
})

async function loadPosts() {
  isLoading.value = true
  error.value = ''

  try {
    const result = await api.listPosts(type.value)
    posts.value = result.items
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load posts'
  } finally {
    isLoading.value = false
  }
}

async function createNewPost() {
  try {
    const newPost = await api.createPost({ type: type.value })
    router.push(`/admin/posts/${type.value}/${newPost.id}`)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create post'
  }
}

function getPostTitle(post: any): string {
  const defaultLang = config.value?.defaultLanguage || 'en'
  const translation = post.translations?.[defaultLang]

  if (!translation) return 'Untitled'

  // Try to find a title-like field
  const titleField = Object.keys(translation).find((key) =>
    key.toLowerCase().includes('title') || key.toLowerCase().includes('name')
  )

  return titleField ? translation[titleField] : 'Untitled'
}
</script>
