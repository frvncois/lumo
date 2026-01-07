import { ref, readonly } from 'vue'
import { api } from '../utils/api'

interface Field {
  key: string
  type: 'text' | 'textarea' | 'richtext' | 'image' | 'gallery' | 'url' | 'boolean'
  label: string
  required: boolean
}

interface PageSchema {
  slug: string
  fields: Field[]
}

interface PostTypeSchema {
  slug: string
  name: string
  nameSingular: string
  fields: Field[]
}

interface Config {
  languages: string[]
  defaultLanguage: string
  pages?: Record<string, PageSchema>
  postTypes?: Record<string, PostTypeSchema>
}

const config = ref<Config | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

export function useConfig() {
  async function load() {
    if (config.value) return config.value
    return refresh()
  }

  async function refresh() {
    loading.value = true
    error.value = null
    try {
      const data = await api.getConfig()
      config.value = data
      return data
    } catch (e) {
      error.value = 'Failed to load config'
      throw e
    } finally {
      loading.value = false
    }
  }

  function getPageSchema(slug: string) {
    return config.value?.pages?.[slug] || null
  }

  function getPostTypeSchema(slug: string) {
    return config.value?.postTypes?.[slug] || null
  }

  return {
    config: readonly(config),
    loading: readonly(loading),
    error: readonly(error),
    load,
    refresh,
    getPageSchema,
    getPostTypeSchema,
  }
}
