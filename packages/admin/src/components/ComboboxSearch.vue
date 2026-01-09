<template>
  <div class="relative w-full max-w-2xl">
    <!-- Search Input -->
    <div class="relative">
      <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        ref="inputRef"
        v-model="searchQuery"
        type="text"
        placeholder="Search pages, posts, settings..."
        class="w-full pl-10 pr-20 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        @focus="showResults = true"
        @blur="handleBlur"
        @keydown.down.prevent="navigateDown"
        @keydown.up.prevent="navigateUp"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.esc="closeResults"
      />
      <div class="absolute inset-y-0 right-3 flex items-center pointer-events-none">
        <kbd class="px-2 py-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
          {{ isMac ? '⌘' : 'Ctrl' }}K
        </kbd>
      </div>
    </div>

    <!-- Results Dropdown -->
    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="showResults && (filteredResults.length > 0 || quickActions.length > 0)"
        class="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50"
      >
        <!-- Quick Actions -->
        <div v-if="quickActions.length > 0 && searchQuery.length === 0" class="border-b border-gray-100 dark:border-gray-800">
          <div class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Quick Actions</div>
          <button
            v-for="(action, index) in quickActions"
            :key="`action-${index}`"
            @click="handleAction(action)"
            @mouseenter="highlightedIndex = index"
            :class="[
              'w-full px-3 py-2 text-left text-sm flex items-center gap-3 transition-colors',
              highlightedIndex === index ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            ]"
          >
            <span class="text-lg">{{ action.icon }}</span>
            <div class="flex-1">
              <div class="font-medium">{{ action.label }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ action.description }}</div>
            </div>
          </button>
        </div>

        <!-- Search Results -->
        <div v-if="filteredResults.length > 0">
          <template v-for="(group, groupIndex) in groupedResults" :key="group.type">
            <div v-if="group.items.length > 0">
              <div class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase border-t border-gray-100 dark:border-gray-800">
                {{ group.label }}
              </div>
              <button
                v-for="(item, itemIndex) in group.items"
                :key="item.id"
                @click="handleSelect(item)"
                @mouseenter="highlightedIndex = getItemIndex(groupIndex, itemIndex)"
                :class="[
                  'w-full px-3 py-2 text-left text-sm flex items-center gap-3 transition-colors',
                  highlightedIndex === getItemIndex(groupIndex, itemIndex)
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                ]"
              >
                <span class="text-lg">{{ item.icon }}</span>
                <div class="flex-1 min-w-0">
                  <div class="font-medium truncate">{{ item.title }}</div>
                  <div v-if="item.subtitle" class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ item.subtitle }}</div>
                </div>
              </button>
            </div>
          </template>
        </div>

        <!-- No Results -->
        <div v-if="searchQuery.length > 0 && filteredResults.length === 0" class="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No results found for "{{ searchQuery }}"
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../utils/api'

interface SearchItem {
  id: string
  title: string
  subtitle?: string
  icon: string
  route: string
  type: 'page' | 'post' | 'global' | 'setting' | 'schema'
}

interface QuickAction {
  label: string
  description: string
  icon: string
  action: () => void
}

const router = useRouter()
const inputRef = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
const showResults = ref(false)
const highlightedIndex = ref(0)

const isMac = computed(() => navigator.platform.toUpperCase().indexOf('MAC') >= 0)

// Data
const pages = ref<any[]>([])
const postsByType = ref<Record<string, any[]>>({})
const globals = ref<any[]>([])
const config = ref<any>(null)

// Load data on mount
onMounted(async () => {
  try {
    // Load config
    config.value = await api.getConfig()

    // Load pages
    const pagesData = await api.listPages()
    pages.value = pagesData.items

    // Load posts by type
    if (config.value.postTypes) {
      for (const [slug, postType] of Object.entries(config.value.postTypes)) {
        const postsData = await api.listPosts(slug)
        postsByType.value[slug] = postsData.items
      }
    }

    // Load globals
    const globalsData = await api.listGlobals()
    globals.value = globalsData.items
  } catch (error) {
    console.error('Failed to load search data:', error)
  }

  // Add keyboard shortcut
  document.addEventListener('keydown', handleKeyboardShortcut)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboardShortcut)
})

// Keyboard shortcut (⌘K / Ctrl+K)
function handleKeyboardShortcut(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    inputRef.value?.focus()
  }
}

// Quick Actions (shown when no search query)
const quickActions = computed<QuickAction[]>(() => [
  {
    label: 'Create New Page',
    description: 'Add a new page to your site',
    icon: '📄',
    action: () => router.push('/admin/pages/new')
  },
  {
    label: 'Upload Media',
    description: 'Upload images and files',
    icon: '📁',
    action: () => router.push('/admin/media')
  },
  {
    label: 'Schema Editor',
    description: 'Manage content schemas',
    icon: '⚙️',
    action: () => router.push({ path: '/admin/settings', query: { tab: 'schema' } })
  },
  {
    label: 'Project Settings',
    description: 'Configure your project',
    icon: '🔧',
    action: () => router.push({ path: '/admin/settings', query: { tab: 'general' } })
  }
])

// Build search items
const searchItems = computed<SearchItem[]>(() => {
  const items: SearchItem[] = []

  // Add pages
  for (const page of pages.value) {
    const pageSchema = config.value?.pages?.find((p: any) => p.slug === page.type)
    items.push({
      id: page.id,
      title: page.title || 'Untitled Page',
      subtitle: pageSchema?.name || page.type,
      icon: '📄',
      route: `/admin/pages/${page.id}`,
      type: 'page'
    })
  }

  // Add posts
  for (const [typeSlug, posts] of Object.entries(postsByType.value)) {
    const postType = config.value?.postTypes?.find((pt: any) => pt.slug === typeSlug)
    for (const post of posts) {
      items.push({
        id: post.id,
        title: post.title || 'Untitled Post',
        subtitle: postType?.name || typeSlug,
        icon: '📝',
        route: `/admin/posts/${typeSlug}/${post.id}`,
        type: 'post'
      })
    }
  }

  // Add globals
  for (const global of globals.value) {
    const globalSchema = config.value?.globals?.find((g: any) => g.slug === global.slug)
    items.push({
      id: global.slug,
      title: globalSchema?.name || global.slug,
      subtitle: 'Global Content',
      icon: '🌐',
      route: `/admin/globals/${global.slug}`,
      type: 'global'
    })
  }

  // Add settings pages
  items.push(
    {
      id: 'settings-general',
      title: 'General Settings',
      subtitle: 'Project configuration',
      icon: '⚙️',
      route: '/admin/settings?tab=general',
      type: 'setting'
    },
    {
      id: 'settings-schema',
      title: 'Schema Editor',
      subtitle: 'Manage content schemas',
      icon: '📋',
      route: '/admin/settings?tab=schema',
      type: 'schema'
    }
  )

  return items
})

// Filter results based on search query
const filteredResults = computed(() => {
  if (!searchQuery.value) return []

  const query = searchQuery.value.toLowerCase()
  return searchItems.value.filter(item => {
    const titleMatch = item.title.toLowerCase().includes(query)
    const subtitleMatch = item.subtitle?.toLowerCase().includes(query)
    return titleMatch || subtitleMatch
  })
})

// Group results by type
const groupedResults = computed(() => {
  return [
    {
      type: 'page',
      label: 'Pages',
      items: filteredResults.value.filter(item => item.type === 'page')
    },
    {
      type: 'post',
      label: 'Posts',
      items: filteredResults.value.filter(item => item.type === 'post')
    },
    {
      type: 'global',
      label: 'Globals',
      items: filteredResults.value.filter(item => item.type === 'global')
    },
    {
      type: 'setting',
      label: 'Settings',
      items: filteredResults.value.filter(item => item.type === 'setting' || item.type === 'schema')
    }
  ]
})

// Get flat index for an item in grouped results
function getItemIndex(groupIndex: number, itemIndex: number): number {
  let index = quickActions.value.length // Start after quick actions

  for (let i = 0; i < groupIndex; i++) {
    index += groupedResults.value[i].items.length
  }

  return index + itemIndex
}

// Navigation
function navigateDown() {
  const maxIndex = searchQuery.value.length === 0
    ? quickActions.value.length - 1
    : filteredResults.value.length - 1

  if (highlightedIndex.value < maxIndex) {
    highlightedIndex.value++
  }
}

function navigateUp() {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
  }
}

function selectHighlighted() {
  if (searchQuery.value.length === 0 && highlightedIndex.value < quickActions.value.length) {
    // Select quick action
    handleAction(quickActions.value[highlightedIndex.value])
  } else if (filteredResults.value.length > 0) {
    // Select search result
    let currentIndex = 0
    for (const group of groupedResults.value) {
      for (const item of group.items) {
        if (currentIndex === highlightedIndex.value) {
          handleSelect(item)
          return
        }
        currentIndex++
      }
    }
  }
}

function handleSelect(item: SearchItem) {
  router.push(item.route)
  closeResults()
}

function handleAction(action: QuickAction) {
  action.action()
  closeResults()
}

function closeResults() {
  showResults.value = false
  searchQuery.value = ''
  highlightedIndex.value = 0
  inputRef.value?.blur()
}

function handleBlur() {
  // Delay to allow click events to fire
  setTimeout(() => {
    showResults.value = false
  }, 200)
}

// Reset highlighted index when search query changes
watch(searchQuery, () => {
  highlightedIndex.value = 0
})
</script>
