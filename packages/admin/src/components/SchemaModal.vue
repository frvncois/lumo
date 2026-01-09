<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="$emit('cancel')">
    <div class="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
      <div class="p-4 border-b flex justify-between items-center">
        <h2 class="text-lg font-semibold">
          {{ isNew ? 'Create' : 'Edit' }} {{ getTypeLabel() }}
        </h2>
        <button @click="$emit('cancel')" class="text-gray-500 hover:text-gray-700">✕</button>
      </div>

      <div class="p-4 overflow-y-auto max-h-[70vh]">
        <!-- Error Message -->
        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          <div class="font-medium mb-1">{{ error }}</div>
          <ul v-if="validationErrors.length > 0" class="list-disc list-inside text-xs space-y-1 mt-2">
            <li v-for="(err, i) in validationErrors" :key="i">
              <span class="font-mono">{{ err.path }}</span>: {{ err.message || err.reason }}
            </li>
          </ul>
        </div>

        <!-- Slug (only for new) -->
        <div v-if="isNew" class="mb-4">
          <label class="block text-sm font-medium mb-1">Slug *</label>
          <input
            v-model="form.slug"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. home, blog"
          />
          <p class="text-xs text-gray-500 mt-1">Lowercase, no spaces, use hyphens</p>
        </div>

        <!-- Name field for pages and globals -->
        <div v-if="type === 'page' || type === 'global'" class="mb-4">
          <label class="block text-sm font-medium mb-1">Name *</label>
          <input
            v-model="form.name"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            :placeholder="type === 'page' ? 'e.g. Home Page, About Us' : 'e.g. Site Header, Footer'"
          />
        </div>

        <!-- Name fields for post types -->
        <div v-if="type === 'postType'" class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium mb-1">Name (Plural) *</label>
            <input
              v-model="form.name"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Blog Posts"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Name (Singular) *</label>
            <input
              v-model="form.nameSingular"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Blog Post"
            />
          </div>
        </div>

        <!-- Built-in Fields Info (Post Types Only) -->
        <div v-if="type === 'postType'" class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <p class="text-blue-800">
            <strong>Note:</strong> Post types automatically include a built-in <span class="font-mono">title</span> field.
            Define additional fields below.
          </p>
        </div>

        <!-- Fields -->
        <div class="mb-4">
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium">Fields</label>
            <button
              @click="addField"
              class="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              + Add Field
            </button>
          </div>

          <div v-if="form.fields.length === 0" class="text-sm text-gray-500 text-center py-8 border border-dashed rounded">
            No fields yet. Click "Add Field" to get started.
          </div>

          <draggable
            v-else
            v-model="form.fields"
            item-key="key"
            handle=".drag-handle"
            class="space-y-2"
          >
            <template #item="{ element, index }">
              <FieldRow
                :field="element"
                @update="updateField(index, $event)"
                @delete="removeField(index)"
              />
            </template>
          </draggable>
        </div>
      </div>

      <div class="p-4 border-t flex justify-end gap-2">
        <button
          @click="$emit('cancel')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          @click="save"
          :disabled="isSaving"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSaving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import draggable from 'vuedraggable'
import FieldRow from './FieldRow.vue'
import { api } from '../utils/api'
import type { Field, PageSchema, PostTypeSchema } from '@lumo/core'

const props = defineProps<{
  type: 'page' | 'postType' | 'global'
  schema?: PageSchema | PostTypeSchema | any
  isNew: boolean
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const isSaving = ref(false)
const error = ref('')
const validationErrors = ref<any[]>([])

const form = reactive<{
  slug: string
  name: string
  nameSingular: string
  fields: Field[]
}>({
  slug: '',
  name: '',
  nameSingular: '',
  fields: [],
})

function getTypeLabel(): string {
  if (props.type === 'page') return 'Page Schema'
  if (props.type === 'postType') return 'Post Type'
  if (props.type === 'global') return 'Global Schema'
  return ''
}

// Initialize form with existing schema data
watch(
  () => props.schema,
  (schema) => {
    if (schema) {
      form.slug = schema.slug || ''
      if ((props.type === 'page' || props.type === 'global') && 'name' in schema) {
        form.name = schema.name || ''
      }
      if (props.type === 'postType' && 'name' in schema) {
        form.name = schema.name || ''
        form.nameSingular = schema.nameSingular || ''
      }
      form.fields = schema.fields ? JSON.parse(JSON.stringify(schema.fields)) : []
    }
  },
  { immediate: true }
)

function addField() {
  form.fields.push({
    key: `field_${form.fields.length + 1}`,
    type: 'text',
    label: '',
    required: false,
  })
}

function updateField(index: number, updatedField: Field) {
  form.fields[index] = updatedField
}

function removeField(index: number) {
  form.fields.splice(index, 1)
}

function validate(): boolean {
  error.value = ''

  // Validate slug
  if (props.isNew && !form.slug.trim()) {
    error.value = 'Slug is required'
    return false
  }

  if (props.isNew && !/^[a-z0-9-]+$/.test(form.slug)) {
    error.value = 'Slug must be lowercase letters, numbers, and hyphens only'
    return false
  }

  // Validate post type names
  if (props.type === 'postType') {
    if (!form.name.trim()) {
      error.value = 'Name (Plural) is required'
      return false
    }
    if (!form.nameSingular.trim()) {
      error.value = 'Name (Singular) is required'
      return false
    }
  }

  // Validate page or global name
  if (props.type === 'page' || props.type === 'global') {
    if (!form.name.trim()) {
      error.value = 'Name is required'
      return false
    }
  }

  // Validate fields
  if (form.fields.length === 0) {
    error.value = 'At least one field is required'
    return false
  }

  // Validate field keys are unique and not empty
  const keys = new Set<string>()
  for (const field of form.fields) {
    if (!field.key.trim()) {
      error.value = 'All fields must have a key'
      return false
    }
    if (!/^[a-z0-9_]+$/.test(field.key)) {
      error.value = `Field key "${field.key}" must be lowercase letters, numbers, and underscores only`
      return false
    }
    if (keys.has(field.key)) {
      error.value = `Duplicate field key: ${field.key}`
      return false
    }
    keys.add(field.key)

    if (!field.label.trim()) {
      error.value = `Field "${field.key}" must have a label`
      return false
    }
  }

  return true
}

async function save() {
  if (!validate()) {
    return
  }

  error.value = ''
  validationErrors.value = []
  isSaving.value = true

  const data: any = {
    fields: form.fields,
  }

  if (props.isNew) {
    data.slug = form.slug
  }

  if (props.type === 'page' || props.type === 'global') {
    data.name = form.name
  }

  if (props.type === 'postType') {
    data.name = form.name
    data.nameSingular = form.nameSingular
  }

  try {
    // Make API call
    if (props.type === 'page') {
      if (props.isNew) {
        await api.createPageSchema(data)
      } else if (props.schema) {
        await api.updatePageSchema((props.schema as PageSchema).slug!, data)
      }
    } else if (props.type === 'postType') {
      if (props.isNew) {
        await api.createPostTypeSchema(data)
      } else if (props.schema) {
        await api.updatePostTypeSchema((props.schema as PostTypeSchema).slug!, data)
      }
    } else if (props.type === 'global') {
      if (props.isNew) {
        await api.createGlobalSchema(data)
      } else if (props.schema) {
        await api.updateGlobalSchema(props.schema.slug, data)
      }
    }

    // Success - emit saved event to close modal and refresh
    emit('saved')
  } catch (err: any) {
    error.value = err.message || 'Failed to save schema'
    // Extract validation details if present
    if (err.details) {
      validationErrors.value = err.details
    }
  } finally {
    isSaving.value = false
  }
}
</script>
