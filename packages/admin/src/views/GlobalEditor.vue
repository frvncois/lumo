<template>
  <div>
    <div v-if="isLoading" class="text-gray-600">Loading global...</div>

    <div v-else-if="globalData && globalSchema" class="space-y-6">
      <!-- No Fields Schema Setup Card -->
      <Card v-if="!globalSchema.fields || globalSchema.fields.length === 0">
        <CardContent>
          <div class="text-center py-8">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Set up your global schema</h3>
            <p class="text-gray-600 mb-4">
              Add fields to this global schema to start creating content.
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
      <Card v-for="field in globalSchema.fields" :key="field.key">
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
    </div>

    <!-- Teleport Action Buttons to Details Sidebar -->
    <Teleport to="#details-actions" v-if="mounted">
      <Button
        @click="handleSave"
        :disabled="isSaving"
        variant="default"
        size="sm"
        class="w-full"
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

      <!-- Global Information -->
      <Card>
        <CardHeader title="Global Information" />
        <CardContent>
          <dl class="space-y-3">
            <div>
              <dt class="text-xs font-medium text-gray-500 uppercase">Schema</dt>
              <dd class="text-sm text-gray-900 mt-1 font-mono">{{ schemaSlug }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-gray-500 uppercase">Name</dt>
              <dd class="text-sm text-gray-900 mt-1">{{ globalSchema?.name }}</dd>
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
            <div>
              <dt class="text-xs font-medium text-gray-500 uppercase">Public API</dt>
              <dd class="text-xs text-gray-700 mt-1 font-mono break-all">
                /api/globals/{{ schemaSlug }}?lang={{ currentLanguage }}
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
import { useDialog } from '../composables/useDialog'
import { useToast } from '../composables/useToast'
import FieldRenderer from '../components/FieldRenderer.vue'
import { Card, CardHeader, CardContent, Button } from '../components/ui'

const route = useRoute()
const router = useRouter()
const { config, getGlobalSchema, refresh: refreshConfig } = useConfig()
const dialog = useDialog()
const toast = useToast()

const schemaSlug = computed(() => route.params.slug as string)
const globalSchema = computed(() => getGlobalSchema(schemaSlug.value))

const globalData = ref<any>(null)
const currentLanguage = ref('')
const mounted = ref(false)
const isLoading = ref(true)
const isSaving = ref(false)
const isDeleting = ref(false)

const translationFields = ref<Record<string, any>>({})

const currentTranslation = computed(() => {
  return globalData.value?.translations?.[currentLanguage.value]
})

onMounted(async () => {
  mounted.value = true
  // Refresh config to ensure we have the latest schema
  await refreshConfig()
  currentLanguage.value = config.value?.defaultLanguage || 'en'
  await loadGlobal()
})

watch(currentLanguage, () => {
  loadTranslation()
})

async function loadGlobal() {
  isLoading.value = true

  try {
    const result = await api.getGlobal(schemaSlug.value)
    globalData.value = result
    loadTranslation()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to load global')
  } finally {
    isLoading.value = false
  }
}

function loadTranslation() {
  if (!globalData.value || !globalSchema.value) return

  const translation = globalData.value.translations?.[currentLanguage.value]

  // Initialize fields with defaults
  translationFields.value = {}
  for (const field of globalSchema.value.fields) {
    translationFields.value[field.key] = translation?.fields?.[field.key] || getDefaultValueForField(field)
  }
}

function getDefaultValueForField(field: any): any {
  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'richtext':
    case 'url':
    case 'date':
    case 'time':
    case 'select':
      return ''
    case 'boolean':
      return false
    case 'image':
      return { mediaId: '', alt: '' }
    case 'gallery':
    case 'repeater':
      return []
    case 'reference':
      // Single reference defaults to null, multiple defaults to []
      return field.reference?.multiple ? [] : null
    default:
      return null
  }
}

function updateField(key: string, value: any) {
  translationFields.value[key] = value
}

async function handleSave() {
  isSaving.value = true

  try {
    await api.updateGlobalTranslation(schemaSlug.value, currentLanguage.value, {
      fields: translationFields.value,
    })

    // Reload to get updated data
    await loadGlobal()

    toast.success('Global saved successfully!')
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to save global')
  } finally {
    isSaving.value = false
  }
}

async function handleDeleteTranslation() {
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
    await api.deleteGlobalTranslation(schemaSlug.value, currentLanguage.value)

    // Switch to default language
    currentLanguage.value = config.value?.defaultLanguage || 'en'

    // Reload global
    await loadGlobal()
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
