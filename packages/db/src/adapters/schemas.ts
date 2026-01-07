/**
 * Schemas Adapter
 *
 * CRUD operations for page schemas and post type schemas.
 */

import type Database from 'better-sqlite3'
import type { FieldDefinition, PageSchema, PostTypeSchema } from '@lumo/core'
import { randomUUID } from 'node:crypto'

/**
 * Database Row Types
 */
interface PageSchemaRow {
  id: string
  slug: string
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

/**
 * Input Types
 */
export interface PageSchemaInput {
  slug: string
  fields: FieldDefinition[]
}

export interface PostTypeSchemaInput {
  slug: string
  name: string
  nameSingular: string
  fields: FieldDefinition[]
}

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
  const id = randomUUID()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO page_schemas (id, slug, fields, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `)

  stmt.run(id, input.slug, JSON.stringify(input.fields), now, now)

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
    fields: JSON.parse(row.fields),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

/**
 * Update page schema fields
 */
export function updatePageSchema(
  db: Database.Database,
  slug: string,
  fields: FieldDefinition[]
): PageSchemaWithMetadata {
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    UPDATE page_schemas
    SET fields = ?, updated_at = ?
    WHERE slug = ?
  `)

  const result = stmt.run(JSON.stringify(fields), now, slug)

  if (result.changes === 0) {
    throw new Error(`Page schema with slug "${slug}" not found`)
  }

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
  const id = randomUUID()
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
