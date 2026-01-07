<template>
  <header class="bg-white sticky top-0 z-50 grid items-center h-16" style="grid-template-columns: auto 1fr auto;">
    <!-- Left: App Logo -->
    <div class="flex items-center justify-center px-10">
      <h1 class="text-xl font-bold text-gray-900">LUMO</h1>
    </div>

    <!-- Center: Breadcrumb -->
    <nav v-if="breadcrumbs.length > 0" class="flex items-center gap-2 text-sm px-10">
      <span class="text-gray-400">/</span>
      <template v-for="(crumb, index) in breadcrumbs" :key="index">
        <router-link
          v-if="crumb.to && index < breadcrumbs.length - 1"
          :to="crumb.to"
          class="text-gray-600 hover:text-gray-900 transition-colors"
        >
          {{ crumb.label }}
        </router-link>
        <span
          v-else
          class="text-gray-900 font-medium"
        >
          {{ crumb.label }}
        </span>
        <span v-if="index < breadcrumbs.length - 1" class="text-gray-400">/</span>
      </template>
    </nav>
    <div v-else class="px-10"></div>

    <!-- Right: Action Buttons -->
    <div id="header-actions" class="flex items-center justify-end gap-3 px-10">
      <slot name="actions">
        <!-- Default actions slot - can be overridden -->
      </slot>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

interface Breadcrumb {
  label: string
  to?: string
}

interface Props {
  breadcrumbs?: Breadcrumb[]
}

const props = withDefaults(defineProps<Props>(), {
  breadcrumbs: () => [],
})

const route = useRoute()

// Auto-generate breadcrumbs if not provided
const breadcrumbs = computed(() => {
  if (props.breadcrumbs.length > 0) {
    return props.breadcrumbs
  }

  // Auto-generate from route
  const crumbs: Breadcrumb[] = []

  if (route.name === 'Dashboard') {
    crumbs.push({ label: 'Content' })
  } else if (route.name === 'PageEditor') {
    crumbs.push({ label: 'Content', to: '/admin' })
    crumbs.push({ label: 'Edit Page' })
  } else if (route.name === 'PostList') {
    crumbs.push({ label: 'Posts' })
  } else if (route.name === 'PostEditor') {
    crumbs.push({ label: 'Posts', to: `/admin/posts/${route.params.type}` })
    crumbs.push({ label: 'Edit Post' })
  } else if (route.name === 'MediaLibrary') {
    crumbs.push({ label: 'Files' })
  }

  return crumbs
})
</script>
