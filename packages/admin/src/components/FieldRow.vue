<template>
  <div class="flex items-center gap-2 p-2 bg-gray-50 rounded mb-2 group">
    <!-- Drag Handle -->
    <span class="drag-handle cursor-move text-gray-400 hover:text-gray-600">⠿</span>

    <!-- Label (FIRST) -->
    <input
      v-model="localField.label"
      @input="onLabelInput"
      @blur="emitUpdate"
      class="input flex-1 text-sm"
      placeholder="Label"
    />

    <!-- Type (SECOND) -->
    <select
      v-model="localField.type"
      @change="onTypeChange"
      class="input w-28 text-sm"
    >
      <option value="text">text</option>
      <option value="textarea">textarea</option>
      <option value="richtext">richtext</option>
      <option value="image">image</option>
      <option value="gallery">gallery</option>
      <option value="url">url</option>
      <option value="boolean">boolean</option>
      <option value="date">date</option>
      <option value="time">time</option>
      <option value="select">select</option>
      <option value="repeater">repeater</option>
      <option value="reference">reference</option>
    </select>

    <!-- Key (THIRD, auto-suggested) -->
    <input
      v-model="localField.key"
      @blur="emitUpdate"
      class="input w-32 text-sm font-mono"
      placeholder="auto_key"
    />

    <!-- Required (FOURTH) -->
    <label class="flex items-center gap-1 text-sm">
      <input
        type="checkbox"
        v-model="localField.required"
        @change="emitUpdate"
      />
      Required
    </label>

    <!-- Delete -->
    <button
      @click="$emit('delete')"
      class="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      ✕
    </button>
  </div>

  <!-- Options for Select -->
  <div v-if="localField.type === 'select'" class="ml-8 mt-2 space-y-2 border-l-2 border-green-200 pl-4">
    <div class="flex justify-between items-center">
      <span class="text-xs font-medium text-gray-600">Select Options</span>
      <button
        @click="addOption"
        class="text-xs text-green-600 hover:text-green-800 font-medium"
      >
        + Add Option
      </button>
    </div>

    <div v-if="!localField.options || localField.options.length === 0" class="text-xs text-gray-500 text-center py-4 border border-dashed rounded">
      No options yet. Click "Add Option" to get started.
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="(option, index) in localField.options"
        :key="index"
        class="flex items-center gap-2 p-2 bg-white rounded border border-gray-200"
      >
        <input
          v-model="option.label"
          @blur="emitUpdate"
          class="input flex-1 text-xs"
          placeholder="Label (shown to user)"
        />
        <input
          v-model="option.value"
          @blur="emitUpdate"
          class="input flex-1 text-xs font-mono"
          placeholder="Value (saved)"
        />
        <button
          @click="removeOption(index)"
          class="text-red-500 hover:text-red-700"
        >
          ✕
        </button>
      </div>
    </div>
  </div>

  <!-- Reference Configuration -->
  <div v-if="localField.type === 'reference'" class="ml-8 mt-2 space-y-2 border-l-2 border-purple-200 pl-4">
    <div class="flex items-center gap-4">
      <div class="flex-1">
        <label class="text-xs font-medium text-gray-600 block mb-1">Post Type</label>
        <select
          v-model="localField.reference.postType"
          @change="emitUpdate"
          class="input w-full text-sm"
        >
          <option value="" disabled>Select post type...</option>
          <option v-for="pt in postTypes" :key="pt.slug" :value="pt.slug">
            {{ pt.name }}
          </option>
        </select>
      </div>
      <div>
        <label class="text-xs font-medium text-gray-600 block mb-1">Multiple</label>
        <input
          type="checkbox"
          v-model="localField.reference.multiple"
          @change="emitUpdate"
          class="mt-1"
        />
      </div>
    </div>
  </div>

  <!-- Sub-fields for Repeater -->
  <div v-if="localField.type === 'repeater'" class="ml-8 mt-2 space-y-2 border-l-2 border-blue-200 pl-4">
    <div class="flex justify-between items-center">
      <span class="text-xs font-medium text-gray-600">Repeater Sub-fields</span>
      <button
        @click="addSubField"
        class="text-xs text-blue-600 hover:text-blue-800 font-medium"
      >
        + Add Sub-field
      </button>
    </div>

    <div v-if="!localField.fields || localField.fields.length === 0" class="text-xs text-gray-500 text-center py-4 border border-dashed rounded">
      No sub-fields yet. Click "Add Sub-field" to get started.
    </div>

    <div v-else class="space-y-2">
      <FieldRow
        v-for="(subField, index) in localField.fields"
        :key="index"
        :field="subField"
        @update="updateSubField(index, $event)"
        @delete="removeSubField(index)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, ref, inject } from 'vue'

const props = defineProps<{
  field: {
    key: string
    type: string
    label: string
    required: boolean
    fields?: any[]
    options?: any[]
    reference?: { postType: string; multiple?: boolean }
  }
}>()

const emit = defineEmits<{
  update: [field: typeof props.field]
  delete: []
}>()

// Inject post types from parent (SchemaModal provides this)
const postTypes = inject<{ slug: string; name: string }[]>('postTypes', [])

const localField = reactive({ ...props.field })
const previousLabel = ref(props.field.label)

watch(() => props.field, (newVal) => {
  Object.assign(localField, newVal)
  previousLabel.value = newVal.label
}, { deep: true })

// Helper function to convert label to field key
function toFieldKey(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
}

// Auto-suggest key from label
function onLabelInput() {
  // Only auto-suggest if key is empty or was previously auto-generated
  const autoKey = toFieldKey(localField.label)
  const previousAutoKey = toFieldKey(previousLabel.value)

  if (!localField.key || localField.key === previousAutoKey) {
    localField.key = autoKey
  }

  previousLabel.value = localField.label
}

function emitUpdate() {
  emit('update', { ...localField })
}

function onTypeChange() {
  // Initialize fields array when changing to repeater type
  if (localField.type === 'repeater' && !localField.fields) {
    localField.fields = []
  }
  // Remove fields array when changing away from repeater type
  if (localField.type !== 'repeater' && localField.fields) {
    delete localField.fields
  }

  // Initialize options array when changing to select type
  if (localField.type === 'select' && !localField.options) {
    localField.options = []
  }
  // Remove options array when changing away from select type
  if (localField.type !== 'select' && localField.options) {
    delete localField.options
  }

  // Initialize reference config when changing to reference type
  if (localField.type === 'reference' && !localField.reference) {
    localField.reference = { postType: '', multiple: false }
  }
  // Remove reference config when changing away from reference type
  if (localField.type !== 'reference' && localField.reference) {
    delete localField.reference
  }

  emitUpdate()
}

function addSubField() {
  if (!localField.fields) {
    localField.fields = []
  }
  localField.fields.push({
    key: '',  // Empty - will be auto-suggested from label
    type: 'text',
    label: '',
    required: false,
  })
  emitUpdate()
}

function updateSubField(index: number, updatedField: any) {
  if (localField.fields) {
    localField.fields[index] = updatedField
    emitUpdate()
  }
}

function removeSubField(index: number) {
  if (localField.fields) {
    localField.fields.splice(index, 1)
    emitUpdate()
  }
}

function addOption() {
  if (!localField.options) {
    localField.options = []
  }
  localField.options.push({
    label: `Option ${localField.options.length + 1}`,
    value: `option_${localField.options.length + 1}`,
  })
  emitUpdate()
}

function removeOption(index: number) {
  if (localField.options) {
    localField.options.splice(index, 1)
    emitUpdate()
  }
}
</script>
