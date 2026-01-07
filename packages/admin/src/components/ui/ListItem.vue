<template>
  <router-link
    v-if="to"
    :to="to"
    class="flex items-center justify-between px-4 py-3 transition-colors"
  >
    <div class="flex-1">
      <h3 v-if="title" class="font-medium text-gray-900">{{ title }}</h3>
      <p v-if="subtitle" class="text-sm text-gray-500 mt-0.5">{{ subtitle }}</p>
      <slot />
    </div>
    <div class="flex items-center gap-2">
      <slot name="actions" />
      <svg
        v-if="showArrow"
        class="h-5 w-5 text-gray-400"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
          clip-rule="evenodd"
        />
      </svg>
    </div>
  </router-link>
  <div
    v-else
    class="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
    @click="$emit('click', $event)"
  >
    <div class="flex-1">
      <h3 v-if="title" class="font-medium text-gray-900">{{ title }}</h3>
      <p v-if="subtitle" class="text-sm text-gray-500 mt-0.5">{{ subtitle }}</p>
      <slot />
    </div>
    <div class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  to?: string
  title?: string
  subtitle?: string
  showArrow?: boolean
}>(), {
  showArrow: true
})

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>
