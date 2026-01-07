<template>
  <aside
    v-if="$slots.default || hasDetailsContent"
    class="overflow-auto max-w-sm"
  >
    <div id="details-panel" class="p-10 space-y-6">
      <slot />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Right sidebar for contextual details
// Only renders if slot content is provided or teleported
const hasDetailsContent = ref(false)

function checkDetailsContent() {
  const detailsPanel = document.getElementById('details-panel')
  if (detailsPanel) {
    hasDetailsContent.value = detailsPanel.childElementCount > 0
  }
}

onMounted(() => {
  // Check periodically for teleported content
  const interval = setInterval(checkDetailsContent, 100)
  onUnmounted(() => clearInterval(interval))
})
</script>
