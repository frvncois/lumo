/**
 * LUMO Core Types (V1)
 *
 * All type definitions for the LUMO content engine.
 * This file contains NO runtime logic - types only.
 */

/**
 * Field Types
 */
export type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'image'
  | 'gallery'
  | 'url'
  | 'boolean'

/**
 * Media Reference
 * Used for image and gallery field types
 */
export interface MediaReference {
  mediaId: string
  alt?: string
}

/**
 * Field Definition
 */
export interface FieldDefinition {
  key: string
  type: FieldType
  label: string
  required: boolean
}

/**
 * Field Value Types
 */
export type FieldValue =
  | string
  | boolean
  | MediaReference
  | MediaReference[]
  | null
  | undefined

/**
 * Fields Object (dynamic keys)
 */
export type Fields = Record<string, FieldValue>

/**
 * Page Schema Definition
 */
export interface PageSchema {
  slug?: string // Present when loaded from runtime, absent in config file
  fields: FieldDefinition[]
}

/**
 * Post Type Schema Definition
 */
export interface PostTypeSchema {
  slug?: string // Present when loaded from runtime, absent in config file
  name: string
  nameSingular: string
  fields: FieldDefinition[]
}

/**
 * Page Schema Input (for API operations)
 */
export interface PageSchemaInput {
  slug: string
  fields: FieldDefinition[]
}

/**
 * Post Type Schema Input (for API operations)
 */
export interface PostTypeSchemaInput {
  slug: string
  name: string
  nameSingular: string
  fields: FieldDefinition[]
}

/**
 * Configuration Structure (lumo.config.ts)
 */
export interface LumoConfig {
  languages: string[]
  defaultLanguage: string
  pages?: Record<string, PageSchema> // Loaded from database, optional in file
  postTypes?: Record<string, PostTypeSchema> // Loaded from database, optional in file
  media: MediaConfig
}

/**
 * Media Configuration
 */
export interface MediaConfig {
  maxImageSize: number
  maxVideoSize: number
  maxAudioSize: number
  maxDocumentSize: number
}

/**
 * Translation Content
 */
export interface TranslationContent {
  slug: string
  title: string
  fields: Fields
  updatedAt: string
}

/**
 * Page Translations
 */
export type PageTranslations = Record<string, TranslationContent>

/**
 * Post Translations
 */
export type PostTranslations = Record<string, TranslationContent>

/**
 * Page Entity
 */
export interface Page {
  id: string
  translations: PageTranslations
  createdAt: string
  updatedAt: string
}

/**
 * Post Status
 */
export type PostStatus = 'draft' | 'published'

/**
 * Post Entity
 */
export interface Post {
  id: string
  type: string
  status: PostStatus
  position: number | null
  publishedAt: string | null
  translations: PostTranslations
  createdAt: string
  updatedAt: string
}

/**
 * Media Entity
 */
export interface Media {
  id: string
  url: string
  mimeType: string
  width?: number
  height?: number
  duration?: number
  createdAt: string
}

/**
 * User Role
 */
export type UserRole = 'owner' | 'editor'

/**
 * User Entity
 */
export interface User {
  id: string
  email: string
  passwordHash?: string
  createdAt: string
}

/**
 * Collaborator Entity
 */
export interface Collaborator {
  id: string
  userId: string
  role: UserRole
  createdAt: string
}

/**
 * Preview Target Type
 */
export type PreviewTargetType = 'page' | 'post'

/**
 * Preview Entity
 */
export interface Preview {
  id: string
  token: string
  targetType: PreviewTargetType
  targetId: string | null
  postType: string | null
  language: string
  slug: string
  title: string
  fields: Fields
  createdBy: string
  expiresAt: string
  createdAt: string
}

/**
 * Validation Error Detail
 */
export interface ValidationErrorDetail {
  path: string
  reason: string
  message?: string
}

/**
 * Validation Result
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationErrorDetail[] }
