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
 * Migrate page translation content
 */
export function migratePageTranslations(
  db: Database.Database,
  pageSchemaSlug: string,
  keyChanges: Map<string, string>
): number {
  if (keyChanges.size === 0) {
    return 0
  }

  // Get all page translations
  const translations = db
    .prepare<[], { page_id: string; language: string; content: string }>(
      'SELECT page_id, language, content FROM page_translations'
    )
    .all()

  const updateStmt = db.prepare(`
    UPDATE page_translations
    SET content = ?, updated_at = ?
    WHERE page_id = ? AND language = ?
  `)

  let migratedCount = 0
  const now = new Date().toISOString()

  for (const translation of translations) {
    try {
      const content = JSON.parse(translation.content)
      const migratedContent = migrateContentFieldKeys(content, keyChanges)

      // Only update if content actually changed
      if (JSON.stringify(content.fields) !== JSON.stringify(migratedContent.fields)) {
        console.log(`[Migration] Migrating page ${translation.page_id} (${translation.language}):`, {
          before: content.fields,
          after: migratedContent.fields
        })
        updateStmt.run(
          JSON.stringify(migratedContent),
          now,
          translation.page_id,
          translation.language
        )
        migratedCount++
      }
    } catch (error) {
      console.error(`[Migration] Error migrating page translation ${translation.page_id}:`, error)
    }
  }

  return migratedCount
}

/**
 * Migrate post translation content for a specific post type
 */
export function migratePostTranslations(
  db: Database.Database,
  postTypeSlug: string,
  keyChanges: Map<string, string>
): number {
  if (keyChanges.size === 0) {
    return 0
  }

  // Get all post translations for posts of this type
  const translations = db
    .prepare<
      [string],
      { post_id: string; language: string; content: string }
    >(
      `SELECT pt.post_id, pt.language, pt.content
       FROM post_translations pt
       JOIN posts p ON p.id = pt.post_id
       WHERE p.type = ?`
    )
    .all(postTypeSlug)

  const updateStmt = db.prepare(`
    UPDATE post_translations
    SET content = ?, updated_at = ?
    WHERE post_id = ? AND language = ?
  `)

  let migratedCount = 0
  const now = new Date().toISOString()

  for (const translation of translations) {
    try {
      const content = JSON.parse(translation.content)
      const migratedContent = migrateContentFieldKeys(content, keyChanges)

      // Only update if content actually changed
      if (JSON.stringify(content.fields) !== JSON.stringify(migratedContent.fields)) {
        console.log(`[Migration] Migrating post ${translation.post_id} (${translation.language}):`, {
          before: content.fields,
          after: migratedContent.fields
        })
        updateStmt.run(
          JSON.stringify(migratedContent),
          now,
          translation.post_id,
          translation.language
        )
        migratedCount++
      }
    } catch (error) {
      console.error(`[Migration] Error migrating post translation ${translation.post_id}:`, error)
    }
  }

  return migratedCount
}
