<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">SEO</h3>
        <button
          @click="isExpanded = !isExpanded"
          type="button"
          class="text-sm text-blue-600 hover:text-blue-800"
        >
          {{ isExpanded ? 'Collapse' : 'Expand' }}
        </button>
      </div>
    </CardHeader>

    <CardContent>
      <!-- Preview -->
      <div class="mb-4 p-4 bg-gray-50 rounded border">
        <p class="text-sm text-blue-800 truncate">{{ previewUrl }}</p>
        <p class="text-lg text-blue-600 truncate">{{ previewTitle }}</p>
        <p class="text-sm text-gray-600 line-clamp-2">{{ previewDescription }}</p>
      </div>

      <div v-show="isExpanded" class="space-y-4">
        <!-- Meta Title -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Meta Title
            <span class="text-gray-400 font-normal">({{ (modelValue.metaTitle || '').length }}/60)</span>
          </label>
          <input
            :value="modelValue.metaTitle"
            @input="updateField('metaTitle', ($event.target as HTMLInputElement).value)"
            type="text"
            class="input w-full"
            :placeholder="fallbackTitle"
            maxlength="60"
          />
        </div>

        <!-- Meta Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Meta Description
            <span class="text-gray-400 font-normal">({{ (modelValue.metaDescription || '').length }}/160)</span>
          </label>
          <textarea
            :value="modelValue.metaDescription"
            @input="updateField('metaDescription', ($event.target as HTMLInputElement).value)"
            class="input w-full"
            rows="2"
            placeholder="Page description for search engines"
            maxlength="160"
          />
        </div>

        <hr />

        <!-- OG Title -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">OG Title</label>
          <input
            :value="modelValue.ogTitle"
            @input="updateField('ogTitle', ($event.target as HTMLInputElement).value)"
            type="text"
            class="input w-full"
            :placeholder="modelValue.metaTitle || fallbackTitle"
          />
        </div>

        <!-- OG Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">OG Description</label>
          <textarea
            :value="modelValue.ogDescription"
            @input="updateField('ogDescription', ($event.target as HTMLInputElement).value)"
            class="input w-full"
            rows="2"
            :placeholder="modelValue.metaDescription || 'Social media description'"
          />
        </div>

        <!-- OG Image -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">OG Image</label>
          <ImageField
            :modelValue="ogImageValue"
            @update:modelValue="updateOgImage"
          />
          <p class="text-xs text-gray-500 mt-1">Recommended: 1200x630px. Falls back to default if empty.</p>
        </div>

        <!-- Twitter Card -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Twitter Card</label>
          <select
            :value="modelValue.twitterCard || 'summary_large_image'"
            @change="updateField('twitterCard', ($event.target as HTMLSelectElement).value)"
            class="input w-full"
          >
            <option value="summary">Summary</option>
            <option value="summary_large_image">Summary Large Image</option>
          </select>
        </div>

        <hr />

        <!-- Canonical URL -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Canonical URL</label>
          <input
            :value="modelValue.canonicalUrl"
            @input="updateField('canonicalUrl', ($event.target as HTMLInputElement).value)"
            type="url"
            class="input w-full"
            placeholder="https://..."
          />
          <p class="text-xs text-gray-500 mt-1">Leave empty to use page URL</p>
        </div>

        <!-- Indexing -->
        <div class="flex gap-6">
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              :checked="modelValue.noIndex || false"
              @change="updateField('noIndex', ($event.target as HTMLInputElement).checked)"
            />
            <span class="text-sm">No Index</span>
          </label>
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              :checked="modelValue.noFollow || false"
              @change="updateField('noFollow', ($event.target as HTMLInputElement).checked)"
            />
            <span class="text-sm">No Follow</span>
          </label>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Card, CardHeader, CardContent } from './ui'
import ImageField from './ImageField.vue'
import type { SEOFields } from '@lumo/core'

const props = defineProps<{
  modelValue: SEOFields
  fallbackTitle: string
  fallbackSlug: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SEOFields]
}>()

const isExpanded = ref(false)

const previewUrl = computed(() => {
  return `example.com/${props.fallbackSlug}`
})

const previewTitle = computed(() => {
  return props.modelValue.metaTitle || props.fallbackTitle || 'Page Title'
})

const previewDescription = computed(() => {
  return props.modelValue.metaDescription || 'Add a meta description to improve SEO and click-through rates.'
})

const ogImageValue = computed(() => {
  if (!props.modelValue.ogImage) return null
  return { mediaId: props.modelValue.ogImage, alt: '' }
})

function updateField(key: keyof SEOFields, value: any) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  })
}

function updateOgImage(value: any) {
  updateField('ogImage', value?.mediaId || '')
}
</script>
