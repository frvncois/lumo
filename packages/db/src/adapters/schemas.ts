/**
 * Schemas Adapter
 *
 * CRUD operations for page schemas and post type schemas.
 */

import type Database from 'better-sqlite3'
import type {
  FieldDefinition,
  PageSchema,
  PostTypeSchema,
  GlobalSchema,
  PageSchemaInput as CorePageSchemaInput,
  PostTypeSchemaInput as CorePostTypeSchemaInput,
  GlobalSchemaInput as CoreGlobalSchemaInput
} from '@lumo/core'
import { nanoid } from 'nanoid'

/**
 * Generate a prefixed ID for schemas
 */
function generateSchemaId(prefix: string): string {
  return `${prefix}_${nanoid()}`
}

/**
 * Database Row Types
 */
interface PageSchemaRow {
  id: string
  slug: string
  name: string
  fields: string // JSON
  created_at: string
  updated_at: string
}

interface PostTypeSchemaRow {
  id: string
  slug: string
  name: string
  name_singular: string
  fields: string // JSON
  created_at: string
  updated_at: string
}

interface GlobalSchemaRow {
  slug: string
  name: string
  fields: string // JSON
  created_at: string
  updated_at: string
}

/**
 * Input Types (re-export from core)
 */
export type PageSchemaInput = CorePageSchemaInput
export type PostTypeSchemaInput = CorePostTypeSchemaInput
export type GlobalSchemaInput = CoreGlobalSchemaInput

/**
 * Return Types (with metadata)
 */
export interface PageSchemaWithMetadata extends PageSchema {
  id: string
  slug: string
  createdAt: string
  updatedAt: string
}

export interface PostTypeSchemaWithMetadata extends PostTypeSchema {
  id: string
  slug: string
  createdAt: string
  updatedAt: string
}

export interface GlobalSchemaWithMetadata extends GlobalSchema {
  slug: string
  createdAt: string
  updatedAt: string
}

// ========================================
// Page Schemas
// ========================================

/**
 * Create a new page schema
 */
export function createPageSchema(
  db: Database.Database,
  input: PageSchemaInput
): PageSchemaWithMetadata {
  const id = generateSchemaId('pschema')
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO page_schemas (id, slug, name, fields, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  stmt.run(id, input.slug, input.name, JSON.stringify(input.fields), now, now)

  return getPageSchema(db, input.slug)!
}

/**
 * Get page schema by slug
 */
export function getPageSchema(
  db: Database.Database,
  slug: string
): PageSchemaWithMetadata | null {
  const row = db
    .prepare<[string], PageSchemaRow>('SELECT * FROM page_schemas WHERE slug = ?')
    .get(slug)

  if (!row) {
    return null
  }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    fields: JSON.parse(row.fields),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Get all page schemas
 */
export function getAllPageSchemas(db: Database.Database): PageSchemaWithMetadata[] {
  const rows = db
    .prepare<[], PageSchemaRow>('SELECT * FROM page_schemas ORDER BY slug')
    .all()

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    fields: JSON.parse(row.fields),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

/**
 * Update page schema
 */
export function updatePageSchema(
  db: Database.Database,
  slug: string,
  input: Partial<Omit<PageSchemaInput, 'slug'>>
): PageSchemaWithMetadata {
  const existing = getPageSchema(db, slug)
  if (!existing) {
    throw new Error(`Page schema with slug "${slug}" not found`)
  }

  const now = new Date().toISOString()

  // Build update query dynamically based on provided fields
  const updates: string[] = []
  const values: any[] = []

  if (input.name !== undefined) {
    updates.push('name = ?')
    values.push(input.name)
  }
  if (input.fields !== undefined) {
    updates.push('fields = ?')
    values.push(JSON.stringify(input.fields))
  }

  updates.push('updated_at = ?')
  values.push(now)

  values.push(slug) // WHERE clause

  const stmt = db.prepare(`
    UPDATE page_schemas
    SET ${updates.join(', ')}
    WHERE slug = ?
  `)

  stmt.run(...values)

  return getPageSchema(db, slug)!
}

/**
 * Delete page schema
 */
export function deletePageSchema(db: Database.Database, slug: string): boolean {
  const stmt = db.prepare('DELETE FROM page_schemas WHERE slug = ?')
  const result = stmt.run(slug)
  return result.changes > 0
}

// ========================================
// Post Type Schemas
// ========================================

/**
 * Create a new post type schema
 */
export function createPostTypeSchema(
  db: Database.Database,
  input: PostTypeSchemaInput
): PostTypeSchemaWithMetadata {
  const id = generateSchemaId('ptschema')
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO post_type_schemas (id, slug, name, name_singular, fields, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    id,
    input.slug,
    input.name,
    input.nameSingular,
    JSON.stringify(input.fields),
    now,
    now
  )

  return getPostTypeSchema(db, input.slug)!
}

/**
 * Get post type schema by slug
 */
export function getPostTypeSchema(
  db: Database.Database,
  slug: string
): PostTypeSchemaWithMetadata | null {
  const row = db
    .prepare<[string], PostTypeSchemaRow>('SELECT * FROM post_type_schemas WHERE slug = ?')
    .get(slug)

  if (!row) {
    return null
  }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameSingular: row.name_singular,
    fields: JSON.parse(row.fields),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Get all post type schemas
 */
export function getAllPostTypeSchemas(db: Database.Database): PostTypeSchemaWithMetadata[] {
  const rows = db
    .prepare<[], PostTypeSchemaRow>('SELECT * FROM post_type_schemas ORDER BY slug')
    .all()

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameSingular: row.name_singular,
    fields: JSON.parse(row.fields),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

/**
 * Update post type schema
 */
export function updatePostTypeSchema(
  db: Database.Database,
  slug: string,
  input: Partial<PostTypeSchemaInput>
): PostTypeSchemaWithMetadata {
  const existing = getPostTypeSchema(db, slug)
  if (!existing) {
    throw new Error(`Post type schema with slug "${slug}" not found`)
  }

  const now = new Date().toISOString()

  // Build update query dynamically based on provided fields
  const updates: string[] = []
  const values: any[] = []

  if (input.name !== undefined) {
    updates.push('name = ?')
    values.push(input.name)
  }
  if (input.nameSingular !== undefined) {
    updates.push('name_singular = ?')
    values.push(input.nameSingular)
  }
  if (input.fields !== undefined) {
    updates.push('fields = ?')
    values.push(JSON.stringify(input.fields))
  }

  updates.push('updated_at = ?')
  values.push(now)

  values.push(slug) // WHERE clause

  const stmt = db.prepare(`
    UPDATE post_type_schemas
    SET ${updates.join(', ')}
    WHERE slug = ?
  `)

  stmt.run(...values)

  return getPostTypeSchema(db, slug)!
}

/**
 * Delete post type schema
 */
export function deletePostTypeSchema(db: Database.Database, slug: string): boolean {
  const stmt = db.prepare('DELETE FROM post_type_schemas WHERE slug = ?')
  const result = stmt.run(slug)
  return result.changes > 0
}

// ========================================
// Global Schemas
// ========================================

/**
 * Create a new global schema
 */
export function createGlobalSchema(
  db: Database.Database,
  input: GlobalSchemaInput
): GlobalSchemaWithMetadata {
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO global_schemas (slug, name, fields, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `)

  stmt.run(input.slug, input.name, JSON.stringify(input.fields), now, now)

  return getGlobalSchema(db, input.slug)!
}

/**
 * Get global schema by slug
 */
export function getGlobalSchema(
  db: Database.Database,
  slug: string
): GlobalSchemaWithMetadata | null {
  const row = db
    .prepare<[string], GlobalSchemaRow>('SELECT * FROM global_schemas WHERE slug = ?')
    .get(slug)

  if (!row) {
    return null
  }

  return {
    slug: row.slug,
    name: row.name,
    fields: JSON.parse(row.fields),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Get all global schemas
 */
export function getAllGlobalSchemas(db: Database.Database): GlobalSchemaWithMetadata[] {
  const rows = db
    .prepare<[], GlobalSchemaRow>('SELECT * FROM global_schemas ORDER BY slug')
    .all()

  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    fields: JSON.parse(row.fields),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

/**
 * Update global schema
 */
export function updateGlobalSchema(
  db: Database.Database,
  slug: string,
  input: Partial<Omit<GlobalSchemaInput, 'slug'>>
): GlobalSchemaWithMetadata {
  const existing = getGlobalSchema(db, slug)
  if (!existing) {
    throw new Error(`Global schema with slug "${slug}" not found`)
  }

  const now = new Date().toISOString()

  // Build update query dynamically based on provided fields
  const updates: string[] = []
  const values: any[] = []

  if (input.name !== undefined) {
    updates.push('name = ?')
    values.push(input.name)
  }
  if (input.fields !== undefined) {
    updates.push('fields = ?')
    values.push(JSON.stringify(input.fields))
  }

  updates.push('updated_at = ?')
  values.push(now)

  values.push(slug) // WHERE clause

  const stmt = db.prepare(`
    UPDATE global_schemas
    SET ${updates.join(', ')}
    WHERE slug = ?
  `)

  stmt.run(...values)

  return getGlobalSchema(db, slug)!
}

/**
 * Delete global schema
 */
export function deleteGlobalSchema(db: Database.Database, slug: string): boolean {
  const stmt = db.prepare('DELETE FROM global_schemas WHERE slug = ?')
  const result = stmt.run(slug)
  return result.changes > 0
}
