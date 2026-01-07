/**
 * Database Types
 *
 * Type definitions for database operations.
 */

/**
 * Database row types (snake_case matching DB schema)
 */

export interface PageRow {
  id: string
  created_at: string
  updated_at: string
}

export interface PageTranslationRow {
  page_id: string
  language: string
  slug: string
  content: string // JSON string containing {title, fields}
  created_at: string
  updated_at: string
}

export interface PostRow {
  id: string
  type: string
  status: 'draft' | 'published'
  position: number | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface PostTranslationRow {
  post_id: string
  language: string
  slug: string
  content: string // JSON string containing {title, fields}
  created_at: string
  updated_at: string
}

export interface MediaRow {
  id: string
  url: string
  mime_type: string
  width: number | null
  height: number | null
  duration: number | null
  created_at: string
}

export interface PreviewRow {
  id: string
  token: string
  target_type: 'page' | 'post'
  target_id: string | null
  post_type: string | null
  language: string
  slug: string
  title: string
  fields: string // JSON string
  created_by: string
  expires_at: string
  created_at: string
}

export interface UserRow {
  id: string
  email: string
  password_hash: string | null
  created_at: string
}

export interface CollaboratorRow {
  id: string
  user_id: string
  role: 'owner' | 'editor'
  created_at: string
}
