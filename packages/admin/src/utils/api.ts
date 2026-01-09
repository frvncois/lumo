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
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    }

    if (options.body) {
      headers['Content-Type'] = 'application/json'
    }

    // Add CSRF token for mutations
    if (options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method)) {
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf='))
        ?.split('=')[1]

      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken
      }
    }

    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      credentials: 'include',
      headers,
    })

    if (!response.ok) {
      const error: { error: ApiError } = await response.json()
      const err = new Error(error.error.message || 'Request failed')
      // Attach validation details if present
      if (error.error.details) {
        ;(err as any).details = error.error.details
      }
      throw err
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

  async setup(projectName: string, email: string, password: string) {
    return this.request<{
      user: { id: string; email: string; role: string }
      project: { id: string; key: string; name: string }
    }>('/auth/setup', {
      method: 'POST',
      body: JSON.stringify({ projectName, email, password }),
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

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/me/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
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
    return this.request<{ pages: PageSchema[]; postTypes: PostTypeSchema[]; globals: any[] }>('/admin/schemas')
  }

  // Page schemas
  async createPageSchema(data: { slug: string; name: string; fields: Field[] }) {
    return this.request<PageSchema>('/admin/schemas/pages', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updatePageSchema(slug: string, data: Partial<{ name: string; fields: Field[] }>) {
    return this.request<PageSchema>(`/admin/schemas/pages/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(data),
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

  // Global schemas
  async createGlobalSchema(data: { slug: string; name: string; fields: Field[] }) {
    return this.request('/admin/schemas/globals', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateGlobalSchema(slug: string, data: Partial<{ name: string; fields: Field[] }>) {
    return this.request(`/admin/schemas/globals/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteGlobalSchema(slug: string) {
    return this.request<void>(`/admin/schemas/globals/${slug}`, {
      method: 'DELETE',
    })
  }

  // Globals
  async listGlobals() {
    return this.request<{ items: any[] }>('/admin/globals')
  }

  async getGlobal(slug: string) {
    return this.request(`/admin/globals/${slug}`)
  }

  async updateGlobalTranslation(slug: string, lang: string, data: any) {
    return this.request(`/admin/globals/${slug}/translations/${lang}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteGlobalTranslation(slug: string, lang: string) {
    return this.request(`/admin/globals/${slug}/translations/${lang}`, { method: 'DELETE' })
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
