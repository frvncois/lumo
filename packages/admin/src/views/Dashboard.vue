<template>
  <div>
    <div class="space-y-10">
      <!-- Pages Section -->
      <Card>
      <CardHeader title="Pages" :icon="IconPage" />
      <CardContent>
        <List>
          <ListEmpty
            v-if="!config || !config.pages || Object.keys(config.pages).length === 0"
            :loading="!config"
            loading-text="Loading pages..."
            message="No pages configured."
            action-text="Set up schemas"
            @action="goToSchemaEditor"
          />
          <ListItem
            v-else
            v-for="[pageId, pageSchema] in Object.entries(config.pages)"
            :key="pageId"
            :title="pageSchema.name"
            :subtitle="`Slug: ${pageId}`"
            :to="`/admin/pages/${pageId}`"
          />
        </List>
      </CardContent>
    </Card>

    <!-- Post Types Section -->
    <Card>
      <CardHeader title="Post Types" :icon="IconPost" />
      <CardContent>
        <List>
          <ListEmpty
            v-if="!config || !config.postTypes || Object.keys(config.postTypes).length === 0"
            :loading="!config"
            loading-text="Loading post types..."
            message="No post types configured."
            action-text="Set up schemas"
            @action="goToSchemaEditor"
          />
          <ListItem
            v-else
            v-for="[typeId, postType] in Object.entries(config.postTypes)"
            :key="typeId"
            :title="postType.name"
            :subtitle="postType.nameSingular"
            :to="`/admin/posts/${typeId}`"
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
        <List>
          <ListEmpty
            v-if="!config || !config.globals || Object.keys(config.globals).length === 0"
            :loading="!config"
            loading-text="Loading globals..."
            message="No globals configured."
            action-text="Set up schemas"
            @action="goToSchemaEditor"
          />
          <ListItem
            v-else
            v-for="[globalSlug, globalSchema] in Object.entries(config.globals)"
            :key="globalSlug"
            :title="globalSchema.name"
            :subtitle="`Schema: ${globalSlug}`"
            :to="`/admin/globals/${globalSlug}`"
          />
        </List>
      </CardContent>
    </Card>
    </div>

    <!-- Teleport Details Panel -->
    <Teleport to="#details-panel" v-if="mounted">
      <div class="space-y-4">
        <!-- Invite Collaborators Card -->
        <Card>
          <CardContent>
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-gray-900 dark:text-white mb-1">Invite Collaborators</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Add team members to manage content.</p>
                <Button @click="router.push('/admin/settings?tab=users')" variant="outline" size="sm" class="w-full">
                  Invite
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Edit Schema Card -->
        <Card>
          <CardContent>
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="16 18 22 12 16 6"/>
                  <polyline points="8 6 2 12 8 18"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-gray-900 dark:text-white mb-1">Edit Schema</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Customize your content structure.</p>
                <Button @click="router.push({ path: '/admin/settings', query: { tab: 'schema' } })" variant="outline" size="sm" class="w-full">
                  Edit Schema
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Documentation Card -->
        <Card>
          <CardContent>
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-gray-900 dark:text-white mb-1">Documentation</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Learn how to use Lumo.</p>
                <Button @click="window.open('https://docs.lumo.com', '_blank')" variant="outline" size="sm" class="w-full">
                  View Docs
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfig } from '../composables/useConfig'
import { Card, CardHeader, CardContent, List, ListItem, ListEmpty, Button } from '../components/ui'
import IconPage from '../components/icons/IconPage.vue'
import IconPost from '../components/icons/IconPost.vue'

const router = useRouter()
const { config, refresh } = useConfig()
const mounted = ref(false)

onMounted(() => {
  mounted.value = true
  refresh()
})

function goToSchemaEditor() {
  router.push({ path: '/admin/settings', query: { tab: 'schema' } })
}
</script>
