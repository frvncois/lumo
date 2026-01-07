/**
 * API Client
 *
 * Handles all HTTP requests to the LUMO API server.
 */

import type { Field, PageSchema, PostTypeSchema, ValidationErrorDetail } from '@lumo/core'

interface ApiError {
  code: string
  message: string
  details?: ValidationErrorDetail[]
}

class ApiClient {
  private baseUrl = '/api'

  async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    // Only set Content-Type if there's a body
    const headers: Record<string, string> = {
      ...options.headers,
    }

    if (options.body) {
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      credentials: 'include', // Include cookies
      headers,
    })

    if (!response.ok) {
      const error: { error: ApiError } = await response.json()
      throw new Error(error.error.message || 'Request failed')
    }

    return response.json()
  }

  // Config
  async getConfig() {
    return this.request<any>('/config')
  }

  // Auth
  async getAuthStatus() {
    return this.request<{ needsSetup: boolean }>('/auth/status')
  }

  async setup(email: string, password: string) {
    return this.request<{ user: { id: string; email: string; role: string } }>('/auth/setup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async login(email: string, password: string) {
    return this.request<{ user: { id: string; email: string; role: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async getMe() {
    return this.request<{ id: string; email: string; role: string }>('/me')
  }

  async logout() {
    return this.request('/logout', { method: 'POST' })
  }

  // Pages
  async listPages() {
    return this.request<{ items: any[] }>('/admin/pages')
  }

  async getPage(id: string) {
    return this.request(`/admin/pages/${id}`)
  }

  async createPage(data: any) {
    return this.request('/admin/pages', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updatePageTranslation(id: string, lang: string, data: any) {
    return this.request(`/admin/pages/${id}/translations/${lang}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deletePageTranslation(id: string, lang: string) {
    return this.request(`/admin/pages/${id}/translations/${lang}`, { method: 'DELETE' })
  }

  async deletePage(id: string) {
    return this.request(`/admin/pages/${id}`, { method: 'DELETE' })
  }

  // Posts
  async listPosts(type: string, options: { status?: string; lang?: string } = {}) {
    const params = new URLSearchParams({ type, ...options })
    return this.request<{ items: any[] }>(`/admin/posts?${params}`)
  }

  async getPost(id: string) {
    return this.request(`/admin/posts/${id}`)
  }

  async createPost(data: any) {
    return this.request('/admin/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updatePost(id: string, data: any) {
    return this.request(`/admin/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async updatePostTranslation(id: string, lang: string, data: any) {
    return this.request(`/admin/posts/${id}/translations/${lang}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deletePostTranslation(id: string, lang: string) {
    return this.request(`/admin/posts/${id}/translations/${lang}`, { method: 'DELETE' })
  }

  async deletePost(id: string) {
    return this.request(`/admin/posts/${id}`, { method: 'DELETE' })
  }

  // Media
  async listMedia(options: { type?: string; limit?: number } = {}) {
    const params = new URLSearchParams(options as any)
    return this.request<{ items: any[] }>(`/admin/media?${params}`)
  }

  async uploadMedia(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${this.baseUrl}/admin/media`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    return response.json()
  }

  async replaceMedia(id: string, file: File) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${this.baseUrl}/admin/media/${id}/replace`, {
      method: 'PUT',
      body: formData,
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Replace failed')
    }

    return response.json()
  }

  async deleteMedia(id: string) {
    return this.request(`/admin/media/${id}`, { method: 'DELETE' })
  }

  // Preview
  async createPreview(data: any) {
    return this.request<{ token: string; previewUrl: string; expiresAt: string }>('/admin/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Schemas
  async getSchemas() {
    return this.request<{ pages: PageSchema[]; postTypes: PostTypeSchema[] }>('/admin/schemas')
  }

  // Page schemas
  async createPageSchema(data: { slug: string; fields: Field[] }) {
    return this.request<PageSchema>('/admin/schemas/pages', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updatePageSchema(slug: string, fields: Field[]) {
    return this.request<PageSchema>(`/admin/schemas/pages/${slug}`, {
      method: 'PUT',
      body: JSON.stringify({ fields }),
    })
  }

  async deletePageSchema(slug: string) {
    return this.request<void>(`/admin/schemas/pages/${slug}`, {
      method: 'DELETE',
    })
  }

  // Post type schemas
  async createPostTypeSchema(data: { slug: string; name: string; nameSingular: string; fields: Field[] }) {
    return this.request<PostTypeSchema>('/admin/schemas/post-types', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updatePostTypeSchema(slug: string, data: Partial<{ name: string; nameSingular: string; fields: Field[] }>) {
    return this.request<PostTypeSchema>(`/admin/schemas/post-types/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deletePostTypeSchema(slug: string) {
    return this.request<void>(`/admin/schemas/post-types/${slug}`, {
      method: 'DELETE',
    })
  }

  // Settings
  async getSettings() {
    return this.request<Record<string, any>>('/admin/settings')
  }

  async updateLanguages(languages: string[], defaultLanguage: string) {
    return this.request<{ success: boolean; languages: string[]; defaultLanguage: string }>(
      '/admin/settings/languages',
      {
        method: 'PUT',
        body: JSON.stringify({ languages, defaultLanguage }),
      }
    )
  }
}

export const api = new ApiClient()
