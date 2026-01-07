<template>
  <div>
    <!-- Text Field -->
    <Input
      v-if="field.type === 'text'"
      :modelValue="modelValue"
      @update:modelValue="emit('update:modelValue', $event)"
      type="text"
      :placeholder="field.placeholder"
      variant="ghost"
      size="lg"
    />

    <!-- Textarea Field -->
    <Textarea
      v-else-if="field.type === 'textarea'"
      :modelValue="modelValue"
      @update:modelValue="emit('update:modelValue', $event)"
      :placeholder="field.placeholder"
      variant="ghost"
      size="lg"
      :rows="6"
    />

    <!-- Richtext Field -->
    <RichtextEditor
      v-else-if="field.type === 'richtext'"
      :modelValue="modelValue"
      @update:modelValue="emit('update:modelValue', $event)"
    />

    <!-- Image Field -->
    <ImageField
      v-else-if="field.type === 'image'"
      :modelValue="modelValue"
      @update:modelValue="emit('update:modelValue', $event)"
    />

    <!-- Gallery Field -->
    <div v-else-if="field.type === 'gallery'" class="space-y-2">
      <div v-if="Array.isArray(modelValue) && modelValue.length > 0" class="grid grid-cols-3 gap-4">
        <div
          v-for="(item, index) in modelValue"
          :key="index"
          class="relative border border-gray-200 rounded-md p-2"
        >
          <ImageField
            :modelValue="item"
            @update:modelValue="updateGalleryItem(index, $event)"
          />
          <button
            @click="removeGalleryItem(index)"
            class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <Button @click="addGalleryItem" variant="outline" size="sm">
        Add Image
      </Button>
    </div>

    <!-- URL Field -->
    <Input
      v-else-if="field.type === 'url'"
      :modelValue="modelValue"
      @update:modelValue="emit('update:modelValue', $event)"
      type="url"
      :placeholder="field.placeholder || 'https://'"
      variant="ghost"
      size="lg"
    />

    <!-- Boolean Field -->
    <div v-else-if="field.type === 'boolean'" class="flex items-center gap-3 p-2">
      <input
        :checked="modelValue"
        @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
        type="checkbox"
        class="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <span class="text-sm text-gray-600">{{ field.placeholder || 'Enable' }}</span>
    </div>

    <div v-else class="text-red-600 text-sm">
      Unknown field type: {{ field.type }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import RichtextEditor from './RichtextEditor.vue'
import ImageField from './ImageField.vue'
import { Input, Textarea, Button } from './ui'
import type { Field } from '@lumo/core'

const props = defineProps<{
  field: Field
  modelValue: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

function updateGalleryItem(index: number, value: any) {
  const gallery = Array.isArray(props.modelValue) ? [...props.modelValue] : []
  gallery[index] = value
  emit('update:modelValue', gallery)
}

function removeGalleryItem(index: number) {
  const gallery = Array.isArray(props.modelValue) ? [...props.modelValue] : []
  gallery.splice(index, 1)
  emit('update:modelValue', gallery)
}

function addGalleryItem() {
  const gallery = Array.isArray(props.modelValue) ? [...props.modelValue] : []
  gallery.push({ mediaId: '', alt: '' })
  emit('update:modelValue', gallery)
}
</script>
