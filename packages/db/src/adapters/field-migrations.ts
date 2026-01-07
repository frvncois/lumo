/**
 * Field Key Migration
 *
 * Handles migrating content when field keys are renamed in schemas.
 */

import type Database from 'better-sqlite3'
import type { FieldDefinition } from '@lumo/core'

/**
 * Detect field key changes between old and new field definitions
 * Returns a map of oldKey -> newKey
 *
 * Uses position-based matching: if a field is at the same position but has a different key,
 * we assume it's the same field being renamed/edited.
 */
export function detectFieldKeyChanges(
  oldFields: FieldDefinition[],
  newFields: FieldDefinition[]
): Map<string, string> {
  const changes = new Map<string, string>()

  // Compare fields by position
  const minLength = Math.min(oldFields.length, newFields.length)

  for (let i = 0; i < minLength; i++) {
    const oldField = oldFields[i]
    const newField = newFields[i]

    // If the key changed at this position, it's a field rename
    if (oldField.key !== newField.key) {
      changes.set(oldField.key, newField.key)
      console.log(`[Migration] Detected field key change at position ${i}: "${oldField.key}" -> "${newField.key}"`)
    }
  }

  return changes
}

/**
 * Migrate field keys in a content object
 */
export function migrateContentFieldKeys(
  content: Record<string, any>,
  keyChanges: Map<string, string>
): Record<string, any> {
  if (!content.fields || typeof content.fields !== 'object') {
    return content
  }

  const migratedFields: Record<string, any> = {}

  for (const [oldKey, value] of Object.entries(content.fields)) {
    const newKey = keyChanges.get(oldKey) || oldKey
    migratedFields[newKey] = value
  }

  return {
    ...content,
    fields: migratedFields,
  }
}

/**
 * Migrate page translations for a specific schema
 * Only updates pages that belong to the given schema
 */
export function migratePageTranslations(
  db: Database.Database,
  pageSchemaSlug: string,
  keyChanges: Map<string, string>
): number {
  if (keyChanges.size === 0) return 0

  // Get only pages that belong to this schema
  const pages = db
    .prepare<[string], { id: string }>('SELECT id FROM pages WHERE schema_slug = ?')
    .all(pageSchemaSlug)

  if (pages.length === 0) return 0

  const pageIds = pages.map(p => p.id)
  const placeholders = pageIds.map(() => '?').join(',')

  // Get translations only for pages with this schema
  const translations = db
    .prepare<string[], { page_id: string; language: string; content: string }>(
      `SELECT page_id, language, content FROM page_translations WHERE page_id IN (${placeholders})`
    )
    .all(...pageIds)

  let migratedCount = 0

  for (const translation of translations) {
    const content = JSON.parse(translation.content)
    const migratedFields = migrateContentFieldKeys(content.fields || {}, keyChanges)

    if (JSON.stringify(migratedFields) !== JSON.stringify(content.fields || {})) {
      const newContent = JSON.stringify({ ...content, fields: migratedFields })
      db.prepare(
        'UPDATE page_translations SET content = ?, updated_at = ? WHERE page_id = ? AND language = ?'
      ).run(newContent, new Date().toISOString(), translation.page_id, translation.language)
      migratedCount++
    }
  }

  return migratedCount
}

/**
 * Migrate post translations for a specific post type
 * Only updates posts that belong to the given post type
 */
export function migratePostTranslations(
  db: Database.Database,
  postTypeSlug: string,
  keyChanges: Map<string, string>
): number {
  if (keyChanges.size === 0) return 0

  // Get only posts that belong to this type
  const posts = db
    .prepare<[string], { id: string }>('SELECT id FROM posts WHERE type = ?')
    .all(postTypeSlug)

  if (posts.length === 0) return 0

  const postIds = posts.map(p => p.id)
  const placeholders = postIds.map(() => '?').join(',')

  // Get translations only for posts with this type
  const translations = db
    .prepare<string[], { post_id: string; language: string; content: string }>(
      `SELECT post_id, language, content FROM post_translations WHERE post_id IN (${placeholders})`
    )
    .all(...postIds)

  let migratedCount = 0

  for (const translation of translations) {
    const content = JSON.parse(translation.content)
    const migratedFields = migrateContentFieldKeys(content.fields || {}, keyChanges)

    if (JSON.stringify(migratedFields) !== JSON.stringify(content.fields || {})) {
      const newContent = JSON.stringify({ ...content, fields: migratedFields })
      db.prepare(
        'UPDATE post_translations SET content = ?, updated_at = ? WHERE post_id = ? AND language = ?'
      ).run(newContent, new Date().toISOString(), translation.post_id, translation.language)
      migratedCount++
    }
  }

  return migratedCount
}
