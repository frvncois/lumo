<template>
  <div>
    <!-- Single Reference -->
    <div v-if="!field.reference?.multiple">
      <select
        :value="modelValue"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value || null)"
        class="input w-full"
      >
        <option value="">-- Select {{ postTypeName }} --</option>
        <option v-for="post in posts" :key="post.id" :value="post.id">
          {{ post.title }}
        </option>
      </select>
    </div>

    <!-- Multiple References -->
    <div v-else class="space-y-2">
      <div v-if="selectedPosts.length > 0" class="space-y-1">
        <div
          v-for="(postId, index) in selectedPosts"
          :key="postId"
          class="flex items-center gap-2 p-2 bg-gray-50 rounded"
        >
          <span class="flex-1 text-sm">{{ getPostTitle(postId) }}</span>
          <button
            @click="removePost(index)"
            type="button"
            class="text-red-500 hover:text-red-700 text-sm"
          >
            ✕
          </button>
        </div>
      </div>

      <select
        @change="addPost(($event.target as HTMLSelectElement).value); ($event.target as HTMLSelectElement).value = ''"
        class="input w-full"
      >
        <option value="">-- Add {{ postTypeName }} --</option>
        <option
          v-for="post in availablePosts"
          :key="post.id"
          :value="post.id"
        >
          {{ post.title }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../utils/api'

const props = defineProps<{
  field: {
    key: string
    type: string
    label: string
    required: boolean
    reference?: { postType: string; multiple?: boolean }
  }
  modelValue: string | string[] | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | string[] | null]
}>()

const posts = ref<{ id: string; title: string }[]>([])
const postTypeName = ref('')

// Load posts for the referenced post type
onMounted(async () => {
  if (!props.field.reference?.postType) return

  try {
    // Get post type name
    const config = await api.getConfig()
    const pt = config.postTypes?.[props.field.reference.postType]
    postTypeName.value = pt?.nameSingular || props.field.reference.postType

    // Get posts
    const response = await api.listPosts(props.field.reference.postType, {})
    posts.value = response.items.map((p: any) => ({
      id: p.id,
      title: p.translations?.[config.defaultLanguage]?.title || p.id
    }))
  } catch (err) {
    console.error('Failed to load posts:', err)
  }
})

// For multiple selection
const selectedPosts = computed(() => {
  if (!props.modelValue) return []
  return Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue]
})

const availablePosts = computed(() => {
  return posts.value.filter(p => !selectedPosts.value.includes(p.id))
})

function getPostTitle(postId: string): string {
  return posts.value.find(p => p.id === postId)?.title || postId
}

function addPost(postId: string) {
  if (!postId) return
  const current = selectedPosts.value
  emit('update:modelValue', [...current, postId])
}

function removePost(index: number) {
  const current = [...selectedPosts.value]
  current.splice(index, 1)
  emit('update:modelValue', current.length > 0 ? current : null)
}
</script>
