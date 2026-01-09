/**
 * Globals Adapter
 *
 * CRUD operations for globals and global translations.
 */

import type Database from 'better-sqlite3'
import type { GlobalRow, GlobalTranslationRow } from '../types.js'
import type { Global, GlobalTranslations, GlobalTranslationContent } from '@lumo/core'
import { nanoid } from 'nanoid'

/**
 * Create global instance
 */
export function createGlobal(db: Database.Database, schemaSlug: string): GlobalRow {
  const now = new Date().toISOString()
  const id = nanoid()

  const stmt = db.prepare(`
    INSERT INTO globals (id, schema_slug, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `)
  stmt.run(id, schemaSlug, now, now)

  return {
    id,
    schema_slug: schemaSlug,
    created_at: now,
    updated_at: now,
  }
}

/**
 * Get global by schema slug
 */
export function getGlobalBySchemaSlug(
  db: Database.Database,
  schemaSlug: string
): GlobalRow | null {
  const stmt = db.prepare<[string], GlobalRow>(`
    SELECT * FROM globals WHERE schema_slug = ?
  `)
  return stmt.get(schemaSlug) || null
}

/**
 * Get global by ID
 */
export function getGlobalById(db: Database.Database, id: string): GlobalRow | null {
  const stmt = db.prepare<[string], GlobalRow>(`
    SELECT * FROM globals WHERE id = ?
  `)
  return stmt.get(id) || null
}

/**
 * List all globals
 */
export function listGlobals(db: Database.Database): GlobalRow[] {
  const stmt = db.prepare<[], GlobalRow>(`
    SELECT * FROM globals ORDER BY schema_slug ASC
  `)
  return stmt.all()
}

/**
 * Upsert global translation
 */
export function upsertGlobalTranslation(
  db: Database.Database,
  globalId: string,
  lang: string,
  fields: Record<string, unknown>
): GlobalTranslationRow {
  const now = new Date().toISOString()
  const id = nanoid()

  const stmt = db.prepare(`
    INSERT INTO global_translations (id, global_id, lang, fields, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(global_id, lang)
    DO UPDATE SET fields = excluded.fields, updated_at = excluded.updated_at
  `)
  stmt.run(id, globalId, lang, JSON.stringify(fields), now)

  return getGlobalTranslation(db, globalId, lang)!
}

/**
 * Get global translation
 */
export function getGlobalTranslation(
  db: Database.Database,
  globalId: string,
  lang: string
): GlobalTranslationRow | null {
  const stmt = db.prepare<[string, string], GlobalTranslationRow>(`
    SELECT * FROM global_translations WHERE global_id = ? AND lang = ?
  `)
  return stmt.get(globalId, lang) || null
}

/**
 * Get all translations for a global
 */
export function getGlobalTranslations(
  db: Database.Database,
  globalId: string
): GlobalTranslationRow[] {
  const stmt = db.prepare<[string], GlobalTranslationRow>(`
    SELECT * FROM global_translations WHERE global_id = ?
  `)
  return stmt.all(globalId)
}

/**
 * Delete global translation
 */
export function deleteGlobalTranslation(
  db: Database.Database,
  globalId: string,
  lang: string
): void {
  const stmt = db.prepare(`
    DELETE FROM global_translations WHERE global_id = ? AND lang = ?
  `)
  stmt.run(globalId, lang)
}

/**
 * Delete global (and translations via CASCADE)
 */
export function deleteGlobal(db: Database.Database, id: string): void {
  const stmt = db.prepare(`
    DELETE FROM globals WHERE id = ?
  `)
  stmt.run(id)
}

/**
 * Get global with all translations (for API response)
 */
export function getGlobalWithTranslations(
  db: Database.Database,
  schemaSlug: string
): Global | null {
  const globalRow = getGlobalBySchemaSlug(db, schemaSlug)
  if (!globalRow) {
    return null
  }

  const translationRows = getGlobalTranslations(db, globalRow.id)

  const translations: GlobalTranslations = {}
  for (const row of translationRows) {
    translations[row.lang] = {
      fields: JSON.parse(row.fields),
      updatedAt: row.updated_at,
    }
  }

  return {
    id: globalRow.id,
    schemaSlug: globalRow.schema_slug,
    translations,
    createdAt: globalRow.created_at,
    updatedAt: globalRow.updated_at,
  }
}
