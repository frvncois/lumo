<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-extrabold text-gray-900 dark:text-white">LUMO Setup</h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {{ stepDescriptions[currentStep] }}
        </p>
      </div>

      <!-- Progress Steps -->
      <div class="mb-8">
        <div class="flex items-center justify-center space-x-4">
          <template v-for="(label, index) in stepLabels" :key="index">
            <div class="flex items-center">
              <div
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  currentStep > index
                    ? 'bg-green-500 text-white'
                    : currentStep === index
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                ]"
              >
                <span v-if="currentStep > index">✓</span>
                <span v-else>{{ index + 1 }}</span>
              </div>
              <span
                :class="[
                  'ml-2 text-sm font-medium hidden sm:inline',
                  currentStep >= index ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                ]"
              >
                {{ label }}
              </span>
            </div>
            <div
              v-if="index < stepLabels.length - 1"
              :class="[
                'w-12 h-0.5',
                currentStep > index ? 'bg-green-500' : 'bg-gray-200'
              ]"
            />
          </template>
        </div>
      </div>

      <!-- Step Content -->
      <Card>
        <!-- Step 1: Admin Account -->
        <form v-if="currentStep === 0" @submit.prevent="handleAccountSubmit">
          <CardHeader title="Create Admin Account" />
          <CardContent>
            <div class="space-y-4">
              <Input
                v-model="account.projectName"
                label="Project Name"
                type="text"
                placeholder="My Awesome Website"
                required
              />
              <Input
                v-model="account.email"
                label="Email address"
                type="email"
                placeholder="admin@example.com"
                required
              />
              <Input
                v-model="account.password"
                label="Password"
                type="password"
                placeholder="••••••••"
                required
              />
              <Input
                v-model="account.confirmPassword"
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <template #actions>
              <Button
                type="submit"
                :disabled="isLoading || !isAccountValid"
                variant="primary"
                size="lg"
                class="w-full"
              >
                {{ isLoading ? 'Creating account...' : 'Create Account & Continue' }}
              </Button>
            </template>
          </CardFooter>
        </form>

        <!-- Step 2: Schema Setup -->
        <template v-if="currentStep === 1">
          <CardHeader
            title="Setup Content Schemas"
            subtitle="Define your content structure now, or skip and add schemas later from the dashboard."
          />
          <CardContent>
            <!-- Quick Schema Creator -->
            <div class="space-y-4">
              <div class="border dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <h3 class="font-medium mb-3 dark:text-white">Quick Add Schema</h3>

                <div class="flex gap-2 mb-4">
                  <Button
                    v-for="type in schemaTypes"
                    :key="type"
                    type="button"
                    @click="newSchemaType = type"
                    :variant="newSchemaType === type ? 'primary' : 'ghost'"
                    size="sm"
                  >
                    {{ type === 'postType' ? 'Post Type' : type.charAt(0).toUpperCase() + type.slice(1) }}
                  </Button>
                </div>

                <div class="space-y-3">
                  <Input
                    v-model="newSchemaName"
                    :placeholder="newSchemaType === 'postType' ? 'e.g. Blog Post' : 'e.g. Home'"
                    @keyup.enter="addQuickSchema"
                  />
                  <Button
                    type="button"
                    @click="addQuickSchema"
                    :disabled="!newSchemaName.trim() || isAddingSchema"
                    variant="default"
                    class="w-full"
                  >
                    {{ isAddingSchema ? 'Adding...' : `Add ${newSchemaType === 'postType' ? 'Post Type' : newSchemaType.charAt(0).toUpperCase() + newSchemaType.slice(1)}` }}
                  </Button>
                </div>
              </div>

              <!-- Created Schemas List -->
              <div v-if="createdSchemas.length > 0" class="border dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <h3 class="font-medium mb-3 dark:text-white">Created Schemas</h3>
                <ul class="space-y-2">
                  <li
                    v-for="schema in createdSchemas"
                    :key="schema.slug"
                    class="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border dark:border-gray-700"
                  >
                    <span>
                      <span class="font-medium dark:text-white">{{ schema.name }}</span>
                      <span class="text-gray-500 dark:text-gray-400 text-sm ml-2">({{ schema.type }})</span>
                    </span>
                    <span class="text-green-600 dark:text-green-400 text-sm">✓ Created</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <template #actions>
              <Button type="button" @click="currentStep = 2" variant="outline" size="lg" class="flex-1">
                Skip for Now
              </Button>
              <Button type="button" @click="currentStep = 2" variant="primary" size="lg" class="flex-1">
                Continue
              </Button>
            </template>
          </CardFooter>
        </template>

        <!-- Step 3: API & LLM Instructions -->
        <template v-if="currentStep === 2">
          <CardHeader title="API & LLM Integration" />
          <CardContent>
            <div class="space-y-6">
              <!-- Project Credentials -->
              <div class="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <h3 class="font-medium mb-3 text-yellow-800 dark:text-yellow-300">Project Credentials</h3>
                <p class="text-sm text-yellow-700 dark:text-yellow-400 mb-3">Save these somewhere safe. The Project Key will not be shown again.</p>
                <div class="space-y-2 font-mono text-sm">
                  <div class="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                    <span class="text-gray-500 dark:text-gray-400">Project ID:</span>
                    <span class="font-medium dark:text-white">{{ projectInfo.id }}</span>
                  </div>
                  <div class="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                    <span class="text-gray-500 dark:text-gray-400">Project Key:</span>
                    <span class="font-medium dark:text-white">{{ projectInfo.key }}</span>
                  </div>
                </div>
                <Button
                  type="button"
                  @click="copyCredentials"
                  variant="ghost"
                  size="sm"
                  class="mt-3 text-yellow-700 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300"
                >
                  {{ copiedCredentials ? '✓ Copied!' : '📋 Copy Credentials' }}
                </Button>
              </div>

              <!-- API Info -->
              <div class="border dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <h3 class="font-medium mb-3 dark:text-white">API Endpoints</h3>
                <div class="bg-gray-900 dark:bg-black text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
                  <div class="text-gray-400"># Base URL</div>
                  <div class="text-green-400">{{ apiBaseUrl }}</div>
                  <div class="mt-2 text-gray-400"># Public API (read-only)</div>
                  <div>GET /api/pages/:slug</div>
                  <div>GET /api/posts/:type</div>
                  <div>GET /api/globals/:slug</div>
                  <div class="mt-2 text-gray-400"># Admin API (requires auth)</div>
                  <div>POST /api/admin/pages</div>
                  <div>POST /api/admin/posts/:type</div>
                  <div>POST /api/admin/schemas/pages</div>
                </div>
              </div>

              <!-- LLM Instructions -->
              <div class="border dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="font-medium dark:text-white">LLM Setup Instructions</h3>
                  <Button
                    type="button"
                    @click="copyLLMInstructions"
                    variant="ghost"
                    size="sm"
                  >
                    {{ copied ? '✓ Copied!' : '📋 Copy' }}
                  </Button>
                </div>
                <p class="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  Copy and paste this into your preferred LLM (Claude, ChatGPT, etc.) to help set up your content schemas:
                </p>
                <div class="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded p-4 max-h-64 overflow-y-auto">
                  <pre class="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ llmInstructions }}</pre>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <template #actions>
              <Button type="button" @click="currentStep = 1" variant="outline" size="lg">
                ← Back
              </Button>
              <Button type="button" @click="currentStep = 3" variant="primary" size="lg" class="flex-1">
                Continue
              </Button>
            </template>
          </CardFooter>
        </template>

        <!-- Step 4: Complete -->
        <template v-if="currentStep === 3">
          <CardHeader title="Setup Complete!" />
          <CardContent>
            <div class="text-center py-8">
              <div class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-3xl text-green-700 dark:text-green-400">✓</span>
              </div>
              <p class="text-gray-600 dark:text-gray-400 mb-6">
                Your LUMO CMS is ready. Start adding content to your site.
              </p>

              <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-left">
                <h3 class="font-medium text-blue-900 dark:text-blue-300 mb-2">What's next?</h3>
                <ul class="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                  <li>• Create content schemas in the Schema Editor</li>
                  <li>• Add pages and posts in their respective sections</li>
                  <li>• Upload media files to the Media Library</li>
                  <li>• Invite collaborators to help manage content</li>
                </ul>
              </div>

              <Button type="button" @click="goToDashboard" variant="primary" size="lg" class="px-8">
                Access Dashboard
              </Button>
            </div>
          </CardContent>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../utils/api'
import { useToast } from '../composables/useToast'
import { Card, CardHeader, CardContent, CardFooter, Button, Input } from '../components/ui'

const router = useRouter()
const toast = useToast()

// Step management
const currentStep = ref(0)
const stepLabels = ['Account', 'Schemas', 'API Setup', 'Complete']
const stepDescriptions = [
  'Create your admin account to get started',
  'Define your content structure (optional)',
  'API endpoints and LLM integration',
  'You\'re all set!'
]

// Step 1: Account
const account = reactive({
  projectName: '',
  email: '',
  password: '',
  confirmPassword: ''
})
const isLoading = ref(false)

// Project info from setup response
const projectInfo = reactive({
  id: '',
  key: '',
  name: ''
})

const isAccountValid = computed(() => {
  return (
    account.projectName.trim().length > 0 &&
    account.email.length > 0 &&
    account.password.length >= 8 &&
    account.password === account.confirmPassword
  )
})

async function handleAccountSubmit() {
  if (!isAccountValid.value) return

  isLoading.value = true

  try {
    const response = await api.setup(account.projectName.trim(), account.email, account.password)

    // Store project info from response
    projectInfo.id = response.project.id
    projectInfo.key = response.project.key
    projectInfo.name = response.project.name

    toast.success('Admin account created successfully!')
    currentStep.value = 1
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to create account')
  } finally {
    isLoading.value = false
  }
}

// Step 2: Schema Setup
const schemaTypes = ['page', 'postType', 'global'] as const
const newSchemaType = ref<'page' | 'postType' | 'global'>('page')
const newSchemaName = ref('')
const createdSchemas = ref<Array<{ type: string; name: string; slug: string; namePlural?: string }>>([])
const isAddingSchema = ref(false)

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function simplePluralize(word: string): string {
  if (!word) return ''
  const lower = word.toLowerCase()
  if (lower.endsWith('y') && !['a','e','i','o','u'].includes(lower[lower.length - 2])) {
    return word.slice(0, -1) + 'ies'
  }
  if (lower.endsWith('s') || lower.endsWith('x') || lower.endsWith('ch') || lower.endsWith('sh')) {
    return word + 'es'
  }
  return word + 's'
}

async function addQuickSchema() {
  const name = newSchemaName.value.trim()
  if (!name) return

  const slug = toSlug(name)

  isAddingSchema.value = true

  try {
    if (newSchemaType.value === 'page') {
      await api.createPageSchema({ slug, name, fields: [] })
      createdSchemas.value.push({
        type: newSchemaType.value,
        name,
        slug
      })
    } else if (newSchemaType.value === 'postType') {
      const pluralName = simplePluralize(name)
      await api.createPostTypeSchema({
        slug,
        name: pluralName,
        nameSingular: name,
        fields: []
      })
      createdSchemas.value.push({
        type: newSchemaType.value,
        name,
        slug,
        namePlural: pluralName
      })
    } else if (newSchemaType.value === 'global') {
      await api.createGlobalSchema({ slug, name, fields: [] })
      createdSchemas.value.push({
        type: newSchemaType.value,
        name,
        slug
      })
    }

    newSchemaName.value = ''
    toast.success(`${name} schema created successfully!`)
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to create schema')
  } finally {
    isAddingSchema.value = false
  }
}

// Step 3: API & LLM
const apiBaseUrl = computed(() => window.location.origin)
const copied = ref(false)
const copiedCredentials = ref(false)

function copyCredentials() {
  const text = `Project ID: ${projectInfo.id}\nProject Key: ${projectInfo.key}`
  navigator.clipboard.writeText(text)
  copiedCredentials.value = true
  toast.success('Credentials copied to clipboard!')
  setTimeout(() => { copiedCredentials.value = false }, 2000)
}

const llmInstructions = computed(() => {
  const pages = createdSchemas.value.filter(s => s.type === 'page')
  const postTypes = createdSchemas.value.filter(s => s.type === 'postType')
  const globals = createdSchemas.value.filter(s => s.type === 'global')

  let md = `# ${projectInfo.name} - LUMO CMS Setup

## Project Credentials
- **Project Name**: ${projectInfo.name}
- **Project ID**: ${projectInfo.id}
- **Project Key**: ${projectInfo.key}
- **API Base URL**: ${apiBaseUrl.value}

## Created Schemas
`

  if (pages.length === 0 && postTypes.length === 0 && globals.length === 0) {
    md += `\nNo schemas created yet.\n`
  }

  if (pages.length > 0) {
    md += `\n### Pages\n`
    pages.forEach(p => {
      md += `- **${p.name}** (slug: \`${p.slug}\`)\n`
      md += `  - Endpoint: \`GET ${apiBaseUrl.value}/api/pages/${p.slug}\`\n`
      md += `  - Admin: \`PUT ${apiBaseUrl.value}/api/admin/pages/${p.slug}/translations/:lang\`\n`
    })
  }

  if (postTypes.length > 0) {
    md += `\n### Post Types\n`
    postTypes.forEach(p => {
      md += `- **${p.namePlural || p.name}** (singular: ${p.name}, slug: \`${p.slug}\`)\n`
      md += `  - List: \`GET ${apiBaseUrl.value}/api/posts/${p.slug}\`\n`
      md += `  - Create: \`POST ${apiBaseUrl.value}/api/admin/posts/${p.slug}\`\n`
    })
  }

  if (globals.length > 0) {
    md += `\n### Globals\n`
    globals.forEach(g => {
      md += `- **${g.name}** (slug: \`${g.slug}\`)\n`
      md += `  - Endpoint: \`GET ${apiBaseUrl.value}/api/globals/${g.slug}\`\n`
      md += `  - Admin: \`PUT ${apiBaseUrl.value}/api/admin/globals/${g.slug}/translations/:lang\`\n`
    })
  }

  md += `
## Your Task
Help me add fields to these schemas. The available field types are:
- text, textarea, richtext, image, gallery, url, boolean, date, time, select, repeater

### To update a schema with fields:

**Page Schema:**
\`\`\`
PUT ${apiBaseUrl.value}/api/admin/schemas/pages/:slug
{
  "fields": [
    { "key": "field_key", "type": "text", "label": "Field Label", "required": true }
  ]
}
\`\`\`

**Post Type Schema:**
\`\`\`
PUT ${apiBaseUrl.value}/api/admin/schemas/post-types/:slug
{
  "fields": [
    { "key": "field_key", "type": "text", "label": "Field Label", "required": true }
  ]
}
\`\`\`

**Global Schema:**
\`\`\`
PUT ${apiBaseUrl.value}/api/admin/schemas/globals/:slug
{
  "fields": [
    { "key": "field_key", "type": "text", "label": "Field Label", "required": true }
  ]
}
\`\`\`

Ask me what content I need for each schema and help me define the fields.
`

  return md
})

function copyLLMInstructions() {
  navigator.clipboard.writeText(llmInstructions.value)
  copied.value = true
  toast.success('Instructions copied to clipboard!')
  setTimeout(() => { copied.value = false }, 2000)
}

// Step 4: Complete
function goToDashboard() {
  router.push('/admin')
}
</script>
