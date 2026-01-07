import { ref, readonly } from 'vue'
import { api } from '../utils/api'
import type { LumoConfig, PageSchema, PostTypeSchema } from '@lumo/core'

type Config = LumoConfig

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
