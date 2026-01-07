<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="$emit('cancel')">
    <div class="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
      <div class="p-4 border-b flex justify-between items-center">
        <h2 class="text-lg font-semibold">
          {{ isNew ? 'Create' : 'Edit' }} {{ type === 'page' ? 'Page' : 'Post Type' }}
        </h2>
        <button @click="$emit('cancel')" class="text-gray-500 hover:text-gray-700">✕</button>
      </div>

      <div class="p-4 overflow-y-auto max-h-[70vh]">
        <!-- Error Message -->
        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {{ error }}
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

interface Field {
  key: string
  type: string
  label: string
  required: boolean
}

interface PageSchema {
  slug?: string
  fields: Field[]
}

interface PostTypeSchema {
  slug?: string
  name?: string
  nameSingular?: string
  fields: Field[]
}

const props = defineProps<{
  type: 'page' | 'postType'
  schema?: PageSchema | PostTypeSchema
  isNew: boolean
}>()

const emit = defineEmits<{
  save: [data: any]
  cancel: []
}>()

const isSaving = ref(false)
const error = ref('')

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

// Initialize form with existing schema data
watch(
  () => props.schema,
  (schema) => {
    if (schema) {
      form.slug = schema.slug || ''
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

function save() {
  if (!validate()) {
    return
  }

  isSaving.value = true

  const data: any = {
    fields: form.fields,
  }

  if (props.isNew) {
    data.slug = form.slug
  }

  if (props.type === 'postType') {
    data.name = form.name
    data.nameSingular = form.nameSingular
  }

  emit('save', data)

  // Reset saving state after a short delay (parent should close modal)
  setTimeout(() => {
    isSaving.value = false
  }, 500)
}
</script>
