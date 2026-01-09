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
            v-for="[pageId, pageSchema] in Object.entries(config.pages)"
            :key="pageId"
            :to="`/admin/pages/${pageId}`"
            :title="pageSchema.name"
            :subtitle="`Slug: ${pageId}`"
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

    <!-- Globals Section -->
    <Card>
      <CardHeader title="Globals">
        <template #icon>
          <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
            <path d="M3.6,9H20.4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
            <path d="M3.6,15H20.4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
            <ellipse cx="12" cy="12" rx="4" ry="9" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
          </svg>
        </template>
      </CardHeader>
      <CardContent>
        <div v-if="!config">
          Loading globals...
        </div>
        <div class="p-1" v-else-if="!config.globals || Object.keys(config.globals).length === 0">
          No globals configured
        </div>
        <List v-else>
          <ListItem
            v-for="[globalSlug, globalSchema] in Object.entries(config.globals)"
            :key="globalSlug"
            :to="`/admin/globals/${globalSlug}`"
            :title="globalSchema.name"
            :subtitle="`Schema: ${globalSlug}`"
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

const { config, refresh } = useConfig()

// Always refresh config on mount to show latest data
onMounted(() => {
  refresh()
})
</script>
