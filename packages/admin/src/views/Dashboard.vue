<template>
  <div class="space-y-10">
    <!-- Pages Section -->
    <Card>
      <CardHeader title="Pages" :icon="IconPage" />
      <CardContent>
        <div v-if="!config">
          Loading pages...
        </div>
        <div class="p-1" v-else-if="!config.pages || Object.keys(config.pages).length === 0">
          No pages configured
        </div>
        <List v-else>
          <ListItem
            v-for="[pageId] in Object.entries(config.pages)"
            :key="pageId"
            :to="`/admin/pages/${pageId}`"
            :title="getPageName(pageId)"
            :subtitle="`Page ID: ${pageId}`"
          />
        </List>
      </CardContent>
    </Card>

    <!-- Post Types Section -->
    <Card>
      <CardHeader title="Post Types" :icon="IconPost" />
      <CardContent>
        <div v-if="!config">
          Loading post types...
        </div>
        <div class="p-1" v-else-if="!config.postTypes || Object.keys(config.postTypes).length === 0">
          No post types configured
        </div>
        <List v-else>
          <ListItem
            v-for="[typeId, postType] in Object.entries(config.postTypes)"
            :key="typeId"
            :to="`/admin/posts/${typeId}`"
            :title="postType.name"
            :subtitle="postType.nameSingular"
          />
        </List>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onActivated } from 'vue'
import { useConfig } from '../composables/useConfig'
import { Card, CardHeader, CardContent, List, ListItem } from '../components/ui'
import IconPage from '../components/icons/IconPage.vue'
import IconPost from '../components/icons/IconPost.vue'

const { config, load, refresh } = useConfig()

// Load config on mount
onMounted(() => {
  load()
})

// Refresh config when returning to dashboard (e.g., after editing schemas)
onActivated(() => {
  refresh()
})

function getPageName(pageId: string): string {
  // Page names are just the pageId capitalized since pages don't have names in schema
  return pageId.charAt(0).toUpperCase() + pageId.slice(1)
}
</script>
