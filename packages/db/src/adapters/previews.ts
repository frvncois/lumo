/**
 * Previews Adapter
 *
 * CRUD operations for preview snapshots.
 */

import type Database from 'better-sqlite3'
import type { PreviewRow } from '../types.js'
import type { Preview, PreviewTargetType, Fields } from '@lumo/core'

export interface CreatePreviewData {
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
}

/**
 * Create new preview
 */
export function createPreview(db: Database.Database, data: CreatePreviewData): Preview {
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO previews (
      id, token, target_type, target_id, post_type, language,
      slug, title, fields, created_by, expires_at, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.id,
    data.token,
    data.targetType,
    data.targetId,
    data.postType,
    data.language,
    data.slug,
    data.title,
    JSON.stringify(data.fields),
    data.createdBy,
    data.expiresAt,
    now
  )

  return getPreviewByToken(db, data.token)!
}

/**
 * Get preview by token
 */
export function getPreviewByToken(db: Database.Database, token: string): Preview | null {
  const row = db
    .prepare<[string], PreviewRow>('SELECT * FROM previews WHERE token = ?')
    .get(token)

  if (!row) {
    return null
  }

  // Check if expired
  if (new Date(row.expires_at) < new Date()) {
    return null
  }

  return rowToPreview(row)
}

/**
 * Get preview by ID
 */
export function getPreviewById(db: Database.Database, id: string): Preview | null {
  const row = db
    .prepare<[string], PreviewRow>('SELECT * FROM previews WHERE id = ?')
    .get(id)

  if (!row) {
    return null
  }

  return rowToPreview(row)
}

/**
 * Delete preview
 */
export function deletePreview(db: Database.Database, id: string): void {
  db.prepare('DELETE FROM previews WHERE id = ?').run(id)
}

/**
 * Delete expired previews (cleanup job)
 */
export function deleteExpiredPreviews(db: Database.Database): number {
  const now = new Date().toISOString()
  const result = db.prepare('DELETE FROM previews WHERE expires_at < ?').run(now)
  return result.changes
}

/**
 * List previews created by user
 */
export function listPreviewsByUser(
  db: Database.Database,
  userId: string,
  includeExpired: boolean = false
): Preview[] {
  let query = 'SELECT * FROM previews WHERE created_by = ?'
  const params: any[] = [userId]

  if (!includeExpired) {
    query += ' AND expires_at > ?'
    params.push(new Date().toISOString())
  }

  query += ' ORDER BY created_at DESC'

  const rows = db.prepare(query).all(...params) as PreviewRow[]
  return rows.map(rowToPreview)
}

/**
 * Convert database row to Preview object
 */
function rowToPreview(row: PreviewRow): Preview {
  return {
    id: row.id,
    token: row.token,
    targetType: row.target_type,
    targetId: row.target_id,
    postType: row.post_type,
    language: row.language,
    slug: row.slug,
    title: row.title,
    fields: JSON.parse(row.fields),
    createdBy: row.created_by,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }
}
