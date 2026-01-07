<template>
  <div class="border rounded-lg p-4 bg-white">
    <div class="flex justify-between items-start mb-3">
      <div class="flex items-center gap-2">
        <span v-if="type === 'page'" class="text-xl">📄</span>
        <span v-else class="text-xl">📝</span>
        <div>
          <h3 class="font-semibold">{{ slug }}</h3>
          <p v-if="schema.name" class="text-sm text-gray-500">{{ schema.name }}</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button
          @click="$emit('edit', slug)"
          class="btn btn-secondary text-sm"
        >
          Edit
        </button>
        <button
          @click="$emit('delete', slug)"
          class="btn text-sm text-red-600"
        >
          Delete
        </button>
      </div>
    </div>

    <!-- Fields List -->
    <div class="space-y-1">
      <div
        v-for="field in schema.fields"
        :key="field.key"
        class="flex items-center gap-2 text-sm text-gray-600 py-1 px-2 bg-gray-50 rounded"
      >
        <span class="font-mono text-xs bg-gray-200 px-1 rounded">{{ field.key }}</span>
        <span class="text-gray-400">{{ field.type }}</span>
        <span v-if="field.required" class="text-red-500 text-xs">required</span>
        <span class="ml-auto text-gray-400">{{ field.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  type: 'page' | 'postType'
  slug: string
  schema: any
}>()

defineEmits<{
  edit: [slug: string]
  delete: [slug: string]
}>()
</script>
