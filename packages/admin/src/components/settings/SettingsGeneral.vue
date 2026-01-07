<template>
  <div class="space-y-6">
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
      {{ error }}
    </div>

    <div v-if="success" class="bg-green-50 border border-green-200 rounded-md p-4 text-green-800">
      Settings saved successfully!
    </div>

    <Card>
      <CardHeader title="Languages" :icon="IconLanguage" />
      <CardContent>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Languages</label>
            <div class="space-y-2">
              <div v-for="(lang, index) in languages" :key="index" class="flex items-center gap-2">
                <Input
                  v-model="languages[index]"
                  placeholder="en"
                  variant="outline"
                  class="flex-1"
                />
                <Button
                  v-if="languages.length > 1"
                  @click="removeLanguage(index)"
                  variant="ghost"
                  size="sm"
                  class="!text-red-600"
                >
                  Remove
                </Button>
              </div>
            </div>
            <Button
              @click="addLanguage"
              variant="outline"
              size="sm"
              class="mt-2"
            >
              Add Language
            </Button>
            <p class="text-xs text-gray-500 mt-2">
              Use ISO 639-1 language codes (e.g., "en", "fr", "es", "en-US")
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Default Language</label>
            <select v-model="defaultLanguage" class="input">
              <option v-for="lang in languages" :key="lang" :value="lang">
                {{ lang.toUpperCase() }}
              </option>
            </select>
            <p class="text-xs text-gray-500 mt-1">
              Content must exist in the default language
            </p>
          </div>

          <Button
            @click="saveLanguages"
            :disabled="isSaving"
            variant="default"
            size="sm"
          >
            {{ isSaving ? 'Saving...' : 'Save Languages' }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Card, CardHeader, CardContent, Input, Button } from '../ui'
import { useConfig } from '../../composables/useConfig'
import { api } from '../../utils/api'
import IconLanguage from '../icons/IconLanguage.vue'

const { config, load, refresh } = useConfig()

const languages = ref<string[]>(['en'])
const defaultLanguage = ref('en')
const isSaving = ref(false)
const error = ref('')
const success = ref(false)

onMounted(async () => {
  await load()
  if (config.value) {
    languages.value = [...(config.value.languages || ['en'])]
    defaultLanguage.value = config.value.defaultLanguage || 'en'
  }
})

function addLanguage() {
  languages.value.push('')
}

function removeLanguage(index: number) {
  if (languages.value.length > 1) {
    languages.value.splice(index, 1)
  }
}

async function saveLanguages() {
  isSaving.value = true
  error.value = ''
  success.value = false

  try {
    // Filter out empty strings
    const cleanedLanguages = languages.value.filter(lang => lang.trim() !== '')

    if (cleanedLanguages.length === 0) {
      error.value = 'At least one language is required'
      return
    }

    if (!cleanedLanguages.includes(defaultLanguage.value)) {
      error.value = 'Default language must be in the languages list'
      return
    }

    await api.updateLanguages(cleanedLanguages, defaultLanguage.value)
    await refresh()

    success.value = true
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save languages'
  } finally {
    isSaving.value = false
  }
}
</script>
