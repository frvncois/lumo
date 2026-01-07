<template>
  <div class="flex items-center gap-2 p-2 bg-gray-50 rounded mb-2 group">
    <!-- Drag Handle -->
    <span class="drag-handle cursor-move text-gray-400 hover:text-gray-600">⠿</span>

    <!-- Key -->
    <input
      v-model="localField.key"
      @blur="emitUpdate"
      class="input w-32 text-sm font-mono"
      placeholder="key"
    />

    <!-- Type -->
    <select
      v-model="localField.type"
      @change="emitUpdate"
      class="input w-28 text-sm"
    >
      <option value="text">text</option>
      <option value="textarea">textarea</option>
      <option value="richtext">richtext</option>
      <option value="image">image</option>
      <option value="gallery">gallery</option>
      <option value="url">url</option>
      <option value="boolean">boolean</option>
    </select>

    <!-- Label -->
    <input
      v-model="localField.label"
      @blur="emitUpdate"
      class="input flex-1 text-sm"
      placeholder="Label"
    />

    <!-- Required -->
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
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'

const props = defineProps<{
  field: { key: string; type: string; label: string; required: boolean }
}>()

const emit = defineEmits<{
  update: [field: typeof props.field]
  delete: []
}>()

const localField = reactive({ ...props.field })

watch(() => props.field, (newVal) => {
  Object.assign(localField, newVal)
}, { deep: true })

function emitUpdate() {
  emit('update', { ...localField })
}
</script>
