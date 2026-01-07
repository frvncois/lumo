<template>
  <div class="space-y-2">
    <div
      v-if="modelValue?.mediaId"
      class="relative border border-gray-200 rounded-md p-4 bg-gray-50"
    >
      <img
        :src="`/api/media/${modelValue.mediaId}/file`"
        :alt="modelValue.alt || ''"
        class="max-h-48 rounded"
      />
      <button
        @click="removeImage"
        type="button"
        class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div class="mt-2">
        <label class="block text-sm font-medium text-gray-700">Alt Text</label>
        <input
          :value="modelValue.alt || ''"
          @input="updateAlt"
          type="text"
          placeholder="Describe this image"
          class="input mt-1"
        />
      </div>
    </div>

    <button
      v-if="!modelValue?.mediaId"
      @click="showPicker = true"
      type="button"
      class="btn btn-secondary w-full"
    >
      Select Image
    </button>
    <button
      v-else
      @click="showPicker = true"
      type="button"
      class="btn btn-secondary"
    >
      Change Image
    </button>

    <MediaPicker
      v-if="showPicker"
      @select="handleSelect"
      @close="showPicker = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MediaPicker from './MediaPicker.vue'

interface MediaReference {
  mediaId: string
  alt?: string
}

const props = defineProps<{
  modelValue: MediaReference | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: MediaReference | null): void
}>()

const showPicker = ref(false)

function handleSelect(media: any) {
  emit('update:modelValue', {
    mediaId: media.id,
    alt: props.modelValue?.alt || '',
  })
  showPicker.value = false
}

function removeImage() {
  emit('update:modelValue', null)
}

function updateAlt(event: Event) {
  const target = event.target as HTMLInputElement
  if (!props.modelValue) return

  emit('update:modelValue', {
    ...props.modelValue,
    alt: target.value,
  })
}
</script>
