<template>
  <div>
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4 text-red-800 mb-6">
      {{ error }}
    </div>

    <div v-if="isLoading" class="text-gray-600">Loading schemas...</div>

    <div v-else class="space-y-10">
      <!-- Page Schemas Section -->
      <Card>
        <CardHeader title="Page Schemas">
          <template #actions>
            <Button @click="createPageSchema" variant="default" size="sm">
              Add Page Schema
            </Button>
          </template>
        </CardHeader>
        <CardContent>
          <div v-if="pageSchemas.length === 0" class="p-1">
            No page schemas configured
          </div>
          <List v-else>
            <ListItem
              v-for="schema in pageSchemas"
              :key="schema.slug"
              :title="schema.name"
              :subtitle="`Slug: ${schema.slug}`"
              :showArrow="false"
              @click="editPageSchema(schema.slug)"
            >
              <template #actions>
                <Button
                  @click.stop="deletePageSchemaConfirm(schema.slug)"
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

      <!-- Post Type Schemas Section -->
      <Card>
        <CardHeader title="Post Type Schemas">
          <template #actions>
            <Button @click="createPostTypeSchema" variant="default" size="sm">
              Add Post Type
            </Button>
          </template>
        </CardHeader>
        <CardContent>
          <div v-if="postTypeSchemas.length === 0" class="p-1">
            No post type schemas configured
          </div>
          <List v-else>
            <ListItem
              v-for="schema in postTypeSchemas"
              :key="schema.slug"
              :title="schema.name"
              :subtitle="schema.nameSingular"
              :showArrow="false"
              @click="editPostTypeSchema(schema.slug)"
            >
              <template #actions>
                <Button
                  @click.stop="deletePostTypeSchemaConfirm(schema.slug)"
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

      <!-- Global Schemas Section -->
      <Card>
        <CardHeader title="Global Schemas">
          <template #actions>
            <Button @click="createGlobalSchema" variant="default" size="sm">
              Add Global
            </Button>
          </template>
        </CardHeader>
        <CardContent>
          <div v-if="globalSchemas.length === 0" class="p-1">
            No global schemas configured
          </div>
          <List v-else>
            <ListItem
              v-for="schema in globalSchemas"
              :key="schema.slug"
              :title="schema.name"
              :subtitle="`Slug: ${schema.slug}`"
              :showArrow="false"
              @click="editGlobalSchema(schema.slug)"
            >
              <template #actions>
                <Button
                  @click.stop="deleteGlobalSchemaConfirm(schema.slug)"
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
    </div>

    <!-- Schema Modal -->
    <SchemaModal
      v-if="showModal"
      :type="modalType"
      :schema="editingSchema"
      :isNew="isCreatingNew"
      @saved="handleSaved"
      @cancel="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Card, CardHeader, CardContent, Button, List, ListItem } from '../ui'
import SchemaModal from '../SchemaModal.vue'
import { api } from '../../utils/api'
import { useConfig } from '../../composables/useConfig'
import type { Field, PageSchema, PostTypeSchema } from '@lumo/core'

const { refresh: refreshConfig } = useConfig()

const pageSchemas = ref<PageSchema[]>([])
const postTypeSchemas = ref<PostTypeSchema[]>([])
const globalSchemas = ref<any[]>([])
const isLoading = ref(true)
const error = ref('')

const showModal = ref(false)
const modalType = ref<'page' | 'postType' | 'global'>('page')
const editingSchema = ref<PageSchema | PostTypeSchema | any | undefined>(undefined)
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
    globalSchemas.value = data.globals || []
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

function createGlobalSchema() {
  modalType.value = 'global'
  editingSchema.value = undefined
  isCreatingNew.value = true
  showModal.value = true
}

function editGlobalSchema(slug: string) {
  const schema = globalSchemas.value.find((s) => s.slug === slug)
  if (!schema) return

  modalType.value = 'global'
  editingSchema.value = schema
  isCreatingNew.value = false
  showModal.value = true
}

async function deleteGlobalSchemaConfirm(slug: string) {
  const schema = globalSchemas.value.find((s) => s.slug === slug)
  if (!schema) return

  if (!confirm(`Are you sure you want to delete the global schema "${schema.name}"? This cannot be undone.`)) {
    return
  }

  try {
    await api.deleteGlobalSchema(slug)
    await loadSchemas()
    await refreshConfig()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete global schema'
  }
}

async function handleSaved() {
  // Modal already handled the API call - just refresh and close
  closeModal()
  await loadSchemas()
  await refreshConfig()
}

function closeModal() {
  showModal.value = false
  editingSchema.value = undefined
}
</script>
