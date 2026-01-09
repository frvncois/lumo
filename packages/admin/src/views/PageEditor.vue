<template>
  <div>
    <div v-if="isLoading" class="text-gray-600">Loading page...</div>

    <div v-else-if="page && pageSchema" class="space-y-6">
      <!-- Page Title -->
      <Card>
        <CardHeader title="Title" />
        <CardContent>
          <Input
            v-model="translationTitle"
            placeholder="Page title"
            variant="ghost"
            size="lg"
          />
        </CardContent>
      </Card>

      <!-- No Fields Schema Setup Card -->
      <Card v-if="!pageSchema.fields || pageSchema.fields.length === 0">
        <CardContent>
          <div class="text-center py-8">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Set up your page schema</h3>
            <p class="text-gray-600 mb-4">
              Add fields to this page schema to start creating content.
            </p>
            <Button
              @click="goToSchemaEditor"
              variant="default"
              size="sm"
            >
              Go to Schema Editor
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Form Fields - Each in own Card -->
      <Card v-for="field in pageSchema.fields" :key="field.key">
        <CardHeader>
          <h2 class="text-gray-900">
            {{ field.label || field.key }}
            <span v-if="field.required" class="text-red-500">*</span>
          </h2>
        </CardHeader>
        <CardContent>
          <FieldRenderer
            :field="field"
            :modelValue="translationFields[field.key]"
            @update:modelValue="updateField(field.key, $event)"
          />
        </CardContent>
      </Card>

      <!-- SEO Card -->
      <SEOCard
        v-model="translationSeo"
        :fallback-title="translationTitle"
        :fallback-slug="translationSlug"
      />
    </div>

    <!-- Teleport Header Actions -->
    <Teleport to="#header-actions" v-if="mounted">
      <Button
        @click="handlePreview"
        :disabled="isCreatingPreview"
        variant="outline"
        size="sm"
      >
        {{ isCreatingPreview ? 'Creating...' : 'Preview' }}
      </Button>
      <Button
        @click="handleSave"
        :disabled="isSaving"
        variant="default"
        size="sm"
      >
        {{ isSaving ? 'Saving...' : 'Save' }}
      </Button>
    </Teleport>

    <!-- Teleport Details Panel -->
    <Teleport to="#details-panel" v-if="mounted">
      <!-- Language Selection -->
      <Card>
        <CardHeader title="Language" />
        <CardContent>
          <div class="space-y-2">
            <button
              v-for="lang in config?.languages || []"
              :key="lang"
              @click="currentLanguage = lang"
              :class="[
                currentLanguage === lang
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
                'w-full px-3 py-2 border rounded-lg font-medium text-sm uppercase transition-colors text-left flex items-center justify-between',
              ]"
            >
              <span>{{ lang }}</span>
              <span v-if="lang === config?.defaultLanguage" class="text-xs opacity-60">(default)</span>
            </button>
          </div>

          <Button
            v-if="currentLanguage !== config?.defaultLanguage && currentTranslation"
            @click="handleDeleteTranslation"
            :disabled="isDeleting"
            variant="outline"
            size="sm"
            class="w-full mt-3 !text-red-600 !border-red-300 hover:!bg-red-50"
          >
            {{ isDeleting ? 'Deleting...' : 'Delete Translation' }}
          </Button>
        </CardContent>
      </Card>

      <!-- Page Information -->
      <Card>
        <CardHeader title="Page Information" />
        <CardContent>
          <dl class="space-y-3">
            <div>
              <dt class="text-xs font-medium text-gray-500 uppercase">Page ID</dt>
              <dd class="text-sm text-gray-900 mt-1 font-mono">{{ pageId }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-gray-500 uppercase">Current Language</dt>
              <dd class="text-sm text-gray-900 mt-1 uppercase">{{ currentLanguage }}</dd>
            </div>
            <div v-if="currentTranslation">
              <dt class="text-xs font-medium text-gray-500 uppercase">Last Updated</dt>
              <dd class="text-sm text-gray-900 mt-1">
                {{ new Date(currentTranslation.updatedAt || Date.now()).toLocaleDateString() }}
              </dd>
            </div>
            <div v-if="translationSlug">
              <dt class="text-xs font-medium text-gray-500 uppercase">Public API</dt>
              <dd class="text-xs text-gray-700 mt-1 font-mono break-all">
                /api/pages/{{ translationSlug }}?lang={{ currentLanguage }}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../utils/api'
import { useConfig } from '../composables/useConfig'
import { usePreview } from '../composables/usePreview'
import { useDialog } from '../composables/useDialog'
import { useToast } from '../composables/useToast'
import FieldRenderer from '../components/FieldRenderer.vue'
import SEOCard from '../components/SEOCard.vue'
import { Card, CardHeader, CardContent, Button, Input } from '../components/ui'

const route = useRoute()
const router = useRouter()
const { config, refresh: refreshConfig, getPageSchema } = useConfig()
const { isCreatingPreview, createPreview } = usePreview()
const dialog = useDialog()
const toast = useToast()

const pageId = computed(() => route.params.id as string)
const pageSchema = computed(() => getPageSchema(pageId.value))

const page = ref<any>(null)
const currentLanguage = ref('')
const isLoading = ref(true)
const isSaving = ref(false)
const isDeleting = ref(false)
const mounted = ref(false)

// Translation fields
const translationTitle = ref('')
const translationSlug = ref('')
const translationFields = ref<Record<string, any>>({})
const translationSeo = ref<any>({})

const currentTranslation = computed(() => {
  if (!page.value || !currentLanguage.value) return null
  return page.value.translations[currentLanguage.value] || null
})

// Watch currentLanguage changes to load translation data
watch(currentLanguage, () => {
  loadTranslationData()
})

onMounted(async () => {
  mounted.value = true
  // Refresh config to ensure we have the latest schema
  await refreshConfig()
  currentLanguage.value = config.value?.defaultLanguage || 'en'
  await loadPage()
  loadTranslationData()
})

function loadTranslationData() {
  const translation = currentTranslation.value

  // Title is the page schema name, not per-translation
  if (pageSchema.value) {
    translationTitle.value = pageSchema.value.name || ''
  }

  if (translation) {
    translationSlug.value = translation.slug || ''
    translationFields.value = translation.fields || {}
    translationSeo.value = translation.seo || {}
  } else {
    // Reset to empty for new translation
    translationSlug.value = pageId.value // Default slug to page ID
    translationFields.value = {}
    translationSeo.value = {}
  }
}

async function loadPage() {
  isLoading.value = true

  try {
    page.value = await api.getPage(pageId.value)
  } catch (err) {
    // If page doesn't exist in database yet (404), create empty page structure
    // This is normal for pages defined in config but without content yet
    if (err instanceof Error && err.message.includes('not found')) {
      page.value = {
        id: pageId.value,
        translations: {},
      }
    } else {
      toast.error(err instanceof Error ? err.message : 'Failed to load page')
    }
  } finally {
    isLoading.value = false
  }
}

function updateField(key: string, value: any) {
  translationFields.value[key] = value
}

async function handleSave() {
  if (!page.value || !pageSchema.value) return

  isSaving.value = true

  try {
    // Update page schema name if changed
    if (translationTitle.value !== pageSchema.value.name) {
      await api.updatePageSchema(pageId.value, {
        name: translationTitle.value,
      })
    }

    // Construct proper TranslationContent structure
    const translationContent = {
      title: translationTitle.value,
      slug: translationSlug.value,
      fields: translationFields.value,
      seo: translationSeo.value,
    }

    await api.updatePageTranslation(
      pageId.value,
      currentLanguage.value,
      translationContent
    )

    // Reload config and page to get updated data
    await refreshConfig()
    await loadPage()
    loadTranslationData()

    toast.success('Page saved successfully!')
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to save page')
  } finally {
    isSaving.value = false
  }
}

async function handlePreview() {
  if (!page.value) return

  try {
    await createPreview({
      targetType: 'page',
      targetId: pageId.value,
      postType: null,
      language: currentLanguage.value,
      slug: translationSlug.value || pageId.value,
      title: translationTitle.value || '',
      fields: translationFields.value,
    })
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to create preview')
  }
}

async function handleDeleteTranslation() {
  if (!page.value || currentLanguage.value === config.value?.defaultLanguage) return

  const confirmed = await dialog.confirm(
    `Are you sure you want to delete the ${currentLanguage.value.toUpperCase()} translation? This cannot be undone.`,
    {
      title: 'Delete Translation',
      confirmText: 'Delete',
      variant: 'danger'
    }
  )

  if (!confirmed) return

  isDeleting.value = true

  try {
    await api.deletePageTranslation(pageId.value, currentLanguage.value)
    // Switch to default language
    currentLanguage.value = config.value?.defaultLanguage || 'en'
    // Reload page to get updated translations
    await loadPage()
    toast.success('Translation deleted successfully!')
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to delete translation')
  } finally {
    isDeleting.value = false
  }
}

function goToSchemaEditor() {
  router.push({ path: '/admin/settings', query: { tab: 'schema' } })
}
</script>
