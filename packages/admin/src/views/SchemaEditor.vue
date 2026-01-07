<template>
  <div>
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4 text-red-800 mb-6">
      {{ error }}
    </div>

    <div v-if="isLoading" class="text-gray-600">Loading schemas...</div>

    <div v-else class="space-y-10">
      <!-- Page Schemas Section -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900">Page Schemas</h2>
            <Button @click="createPageSchema" variant="default" size="sm">
              Add Page Schema
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="pageSchemas.length === 0" class="text-gray-600">
            No page schemas configured
          </div>
          <div v-else class="space-y-3">
            <SchemaCard
              v-for="schema in pageSchemas"
              :key="schema.slug"
              type="page"
              :slug="schema.slug"
              :schema="schema"
              @edit="editPageSchema"
              @delete="deletePageSchemaConfirm"
            />
          </div>
        </CardContent>
      </Card>

      <!-- Post Type Schemas Section -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900">Post Type Schemas</h2>
            <Button @click="createPostTypeSchema" variant="default" size="sm">
              Add Post Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="postTypeSchemas.length === 0" class="text-gray-600">
            No post type schemas configured
          </div>
          <div v-else class="space-y-3">
            <SchemaCard
              v-for="schema in postTypeSchemas"
              :key="schema.slug"
              type="postType"
              :slug="schema.slug"
              :schema="schema"
              @edit="editPostTypeSchema"
              @delete="deletePostTypeSchemaConfirm"
            />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Schema Modal -->
    <SchemaModal
      v-if="showModal"
      :type="modalType"
      :schema="editingSchema"
      :isNew="isCreatingNew"
      @save="handleSave"
      @cancel="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Card, CardHeader, CardContent, Button } from '../components/ui'
import SchemaCard from '../components/SchemaCard.vue'
import SchemaModal from '../components/SchemaModal.vue'
import { api } from '../utils/api'
import { useConfig } from '../composables/useConfig'
import type { Field, PageSchema, PostTypeSchema } from '@lumo/core'

const { refresh: refreshConfig } = useConfig()

const pageSchemas = ref<PageSchema[]>([])
const postTypeSchemas = ref<PostTypeSchema[]>([])
const isLoading = ref(true)
const error = ref('')

const showModal = ref(false)
const modalType = ref<'page' | 'postType'>('page')
const editingSchema = ref<PageSchema | PostTypeSchema | undefined>(undefined)
const isCreatingNew = ref(false)

onMounted(async () => {
  await loadSchemas()
})

async function loadSchemas() {
  isLoading.value = true
  error.value = ''

  try {
    const data = await api.getSchemas()
    pageSchemas.value = data.pages || []
    postTypeSchemas.value = data.postTypes || []
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load schemas'
  } finally {
    isLoading.value = false
  }
}

function createPageSchema() {
  modalType.value = 'page'
  editingSchema.value = undefined
  isCreatingNew.value = true
  showModal.value = true
}

function editPageSchema(slug: string) {
  const schema = pageSchemas.value.find((s) => s.slug === slug)
  if (!schema) return

  modalType.value = 'page'
  editingSchema.value = schema
  isCreatingNew.value = false
  showModal.value = true
}

async function deletePageSchemaConfirm(slug: string) {
  const schema = pageSchemas.value.find((s) => s.slug === slug)
  if (!schema) return

  if (!confirm(`Are you sure you want to delete the page schema "${slug}"? This cannot be undone.`)) {
    return
  }

  try {
    await api.deletePageSchema(slug)
    await loadSchemas()
    await refreshConfig()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete page schema'
  }
}

function createPostTypeSchema() {
  modalType.value = 'postType'
  editingSchema.value = undefined
  isCreatingNew.value = true
  showModal.value = true
}

function editPostTypeSchema(slug: string) {
  const schema = postTypeSchemas.value.find((s) => s.slug === slug)
  if (!schema) return

  modalType.value = 'postType'
  editingSchema.value = schema
  isCreatingNew.value = false
  showModal.value = true
}

async function deletePostTypeSchemaConfirm(slug: string) {
  const schema = postTypeSchemas.value.find((s) => s.slug === slug)
  if (!schema) return

  if (!confirm(`Are you sure you want to delete the post type "${schema.name}"? This cannot be undone.`)) {
    return
  }

  try {
    await api.deletePostTypeSchema(slug)
    await loadSchemas()
    await refreshConfig()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete post type schema'
  }
}

async function handleSave(data: any) {
  error.value = ''

  try {
    if (modalType.value === 'page') {
      if (isCreatingNew.value) {
        await api.createPageSchema(data)
      } else if (editingSchema.value) {
        await api.updatePageSchema((editingSchema.value as PageSchema).slug, data.fields)
      }
    } else {
      if (isCreatingNew.value) {
        await api.createPostTypeSchema(data)
      } else if (editingSchema.value) {
        await api.updatePostTypeSchema((editingSchema.value as PostTypeSchema).slug, data)
      }
    }

    closeModal()
    await loadSchemas()
    await refreshConfig()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save schema'
  }
}

function closeModal() {
  showModal.value = false
  editingSchema.value = undefined
}
</script>
