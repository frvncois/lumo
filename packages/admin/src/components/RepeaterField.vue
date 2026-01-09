<template>
  <div class="space-y-3">
    <!-- Repeater Items -->
    <draggable
      v-model="items"
      item-key="id"
      handle=".drag-handle"
      @end="emitUpdate"
      class="space-y-2"
    >
      <template #item="{ element, index }">
        <div class="border border-gray-200 rounded-lg p-4 bg-white relative group">
          <!-- Item Header -->
          <div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <div class="flex items-center gap-2">
              <span class="drag-handle cursor-move text-gray-400 hover:text-gray-600">⠿</span>
              <span class="text-sm font-medium text-gray-700">Item {{ index + 1 }}</span>
            </div>
            <button
              @click="removeItem(index)"
              class="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
              type="button"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Sub-fields -->
          <div class="space-y-3">
            <div v-for="subField in field.fields" :key="subField.key" class="space-y-1">
              <label class="block text-sm font-medium text-gray-700">
                {{ subField.label }}
                <span v-if="subField.required" class="text-red-500">*</span>
              </label>
              <FieldRenderer
                :field="subField"
                :modelValue="element[subField.key]"
                @update:modelValue="updateItemField(index, subField.key, $event)"
              />
            </div>
          </div>
        </div>
      </template>
    </draggable>

    <!-- Add Item Button -->
    <Button
      @click="addItem"
      variant="outline"
      size="sm"
      type="button"
      :disabled="items.length >= maxItems"
    >
      <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Add Item
      <span v-if="items.length >= maxItems" class="ml-2 text-xs text-red-500">
        (Max {{ maxItems }} items)
      </span>
    </Button>

    <!-- Empty State -->
    <div v-if="items.length === 0" class="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
      <p class="text-sm text-gray-500">No items yet. Click "Add Item" to get started.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
import FieldRenderer from './FieldRenderer.vue'
import { Button } from './ui'
import type { FieldDefinition } from '@lumo/core'

interface RepeaterItem {
  id: string
  [key: string]: any
}

const props = defineProps<{
  field: FieldDefinition & { fields: FieldDefinition[] }
  modelValue: any[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any[]): void
}>()

const maxItems = 50

// Convert model value to items with IDs for draggable
const items = ref<RepeaterItem[]>([])

function initializeItems() {
  if (Array.isArray(props.modelValue) && props.modelValue.length > 0) {
    items.value = props.modelValue.map((item, index) => ({
      ...item,
      id: item.id || `item-${Date.now()}-${index}`,
    }))
  } else {
    items.value = []
  }
}

// Initialize on mount
initializeItems()

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
  if (JSON.stringify(newVal) !== JSON.stringify(items.value.map(({ id, ...rest }) => rest))) {
    initializeItems()
  }
}, { deep: true })

function emitUpdate() {
  // Remove the id property before emitting (it's only used for draggable)
  const cleanItems = items.value.map(({ id, ...rest }) => rest)
  emit('update:modelValue', cleanItems)
}

function addItem() {
  if (items.value.length >= maxItems) {
    return
  }

  // Create empty item with default values for each sub-field
  const newItem: RepeaterItem = {
    id: `item-${Date.now()}`,
  }

  for (const subField of props.field.fields) {
    switch (subField.type) {
      case 'text':
      case 'textarea':
      case 'richtext':
      case 'url':
        newItem[subField.key] = ''
        break
      case 'boolean':
        newItem[subField.key] = false
        break
      case 'image':
        newItem[subField.key] = { mediaId: '', alt: '' }
        break
      case 'gallery':
        newItem[subField.key] = []
        break
      case 'repeater':
        newItem[subField.key] = []
        break
      default:
        newItem[subField.key] = null
    }
  }

  items.value.push(newItem)
  emitUpdate()
}

function removeItem(index: number) {
  items.value.splice(index, 1)
  emitUpdate()
}

function updateItemField(index: number, key: string, value: any) {
  items.value[index][key] = value
  emitUpdate()
}
</script>
