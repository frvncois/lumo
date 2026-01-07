<template>
  <div class="space-y-6">
    <!-- API Documentation -->
    <Card>
      <CardHeader title="API Endpoints" :icon="IconApi" />
      <CardContent>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
            <div class="flex items-center gap-2">
              <code class="text-sm bg-gray-100 px-3 py-2 rounded flex-1 font-mono">
                {{ baseUrl }}
              </code>
              <Button @click="copyToClipboard(baseUrl)" variant="outline" size="sm">
                Copy
              </Button>
            </div>
          </div>

          <div class="border-t pt-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-3">Public Endpoints</h3>
            <div class="space-y-3">
              <!-- Pages -->
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">GET</span>
                  <code class="text-sm font-mono">/api/pages</code>
                </div>
                <p class="text-xs text-gray-600 ml-12">List all pages for a language</p>
              </div>

              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">GET</span>
                  <code class="text-sm font-mono">/api/pages/:slug</code>
                </div>
                <p class="text-xs text-gray-600 ml-12">Get a page by slug</p>
              </div>

              <!-- Posts -->
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">GET</span>
                  <code class="text-sm font-mono">/api/posts</code>
                </div>
                <p class="text-xs text-gray-600 ml-12">List published posts (requires type parameter)</p>
              </div>

              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">GET</span>
                  <code class="text-sm font-mono">/api/posts/:type/:slug</code>
                </div>
                <p class="text-xs text-gray-600 ml-12">Get a published post by type and slug</p>
              </div>

              <!-- Preview -->
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">GET</span>
                  <code class="text-sm font-mono">/api/preview/:token</code>
                </div>
                <p class="text-xs text-gray-600 ml-12">Access preview content with token</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Code Examples -->
    <Card>
      <CardHeader title="Code Examples" />
      <CardContent>
        <div class="space-y-4">
          <div>
            <h3 class="text-sm font-medium text-gray-700 mb-2">Fetch a Page</h3>
            <div class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre class="text-xs font-mono">{{ fetchPageExample }}</pre>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-medium text-gray-700 mb-2">Fetch Posts</h3>
            <div class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre class="text-xs font-mono">{{ fetchPostsExample }}</pre>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Query Parameters -->
    <Card>
      <CardHeader title="Query Parameters" />
      <CardContent>
        <div class="space-y-3">
          <div>
            <dt class="text-sm font-medium text-gray-700">
              <code class="bg-gray-100 px-2 py-1 rounded text-xs">lang</code>
            </dt>
            <dd class="text-sm text-gray-600 mt-1 ml-4">
              Specify the language for content. Defaults to your configured default language.
              <div class="text-xs text-gray-500 mt-1">
                Example: <code>?lang=en</code> or <code>?lang=fr</code>
              </div>
            </dd>
          </div>

          <div>
            <dt class="text-sm font-medium text-gray-700">
              <code class="bg-gray-100 px-2 py-1 rounded text-xs">limit</code>
            </dt>
            <dd class="text-sm text-gray-600 mt-1 ml-4">
              Number of items to return (posts only). Maximum 100.
              <div class="text-xs text-gray-500 mt-1">
                Example: <code>?limit=20</code>
              </div>
            </dd>
          </div>

          <div>
            <dt class="text-sm font-medium text-gray-700">
              <code class="bg-gray-100 px-2 py-1 rounded text-xs">cursor</code>
            </dt>
            <dd class="text-sm text-gray-600 mt-1 ml-4">
              Pagination cursor for fetching next page (posts only).
              <div class="text-xs text-gray-500 mt-1">
                Example: <code>?cursor=20</code>
              </div>
            </dd>
          </div>

          <div>
            <dt class="text-sm font-medium text-gray-700">
              <code class="bg-gray-100 px-2 py-1 rounded text-xs">order</code>
            </dt>
            <dd class="text-sm text-gray-600 mt-1 ml-4">
              Sort order for posts: <code>auto</code>, <code>date_desc</code>, or <code>position_asc</code>.
              <div class="text-xs text-gray-500 mt-1">
                Example: <code>?order=date_desc</code>
              </div>
            </dd>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Response Format -->
    <Card>
      <CardHeader title="Response Format" />
      <CardContent>
        <div class="space-y-4">
          <div>
            <h3 class="text-sm font-medium text-gray-700 mb-2">Page Response</h3>
            <div class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre class="text-xs font-mono">{{ pageResponseExample }}</pre>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-medium text-gray-700 mb-2">Posts List Response</h3>
            <div class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre class="text-xs font-mono">{{ postsResponseExample }}</pre>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- API Keys Section (Coming Soon) -->
    <Card>
      <CardHeader title="API Keys" />
      <CardContent>
        <div class="text-sm text-gray-600">
          <p class="mb-4">API key authentication is coming soon.</p>
          <p class="text-xs text-gray-500">
            Currently, all public API endpoints are accessible without authentication.
            Future versions will support API keys for rate limiting and access control.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardHeader, CardContent, Button } from '../ui'
import IconApi from '../icons/IconApi.vue'

const baseUrl = computed(() => {
  return window.location.origin
})

const fetchPageExample = computed(() => {
  return `// Fetch a page by slug
const response = await fetch('${baseUrl.value}/api/pages/about?lang=en')
const page = await response.json()

console.log(page.title)
console.log(page.fields)`
})

const fetchPostsExample = computed(() => {
  return `// Fetch blog posts
const response = await fetch('${baseUrl.value}/api/posts?type=blog&lang=en&limit=10')
const data = await response.json()

console.log(data.items) // Array of posts
console.log(data.nextCursor) // For pagination`
})

const pageResponseExample = `{
  "id": "page_abc123",
  "slug": "about",
  "title": "About Us",
  "fields": {
    "content": "Our story...",
    "image": {
      "mediaId": "media_xyz789",
      "alt": "Team photo"
    }
  },
  "updatedAt": "2025-01-07T12:00:00Z"
}`

const postsResponseExample = `{
  "items": [
    {
      "id": "post_def456",
      "type": "blog",
      "slug": "hello-world",
      "title": "Hello World",
      "position": null,
      "publishedAt": "2025-01-07T12:00:00Z",
      "updatedAt": "2025-01-07T12:00:00Z"
    }
  ],
  "nextCursor": "20"
}`

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
}
</script>
