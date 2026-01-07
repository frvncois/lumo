import { ref } from 'vue'
import { api } from '../utils/api'

export function usePreview() {
  const isCreatingPreview = ref(false)
  const previewError = ref<string | null>(null)

  async function createPreview(data: {
    targetType: 'page' | 'post'
    targetId: string | null
    postType?: string | null
    language: string
    slug: string
    title: string
    fields: Record<string, any>
  }) {
    isCreatingPreview.value = true
    previewError.value = null

    try {
      const result = await api.createPreview(data)

      // Open preview in new tab
      window.open(result.previewUrl, '_blank')

      return result
    } catch (error) {
      previewError.value = error instanceof Error ? error.message : 'Failed to create preview'
      throw error
    } finally {
      isCreatingPreview.value = false
    }
  }

  return {
    isCreatingPreview,
    previewError,
    createPreview,
  }
}
