/**
 * Media Adapter
 *
 * CRUD operations for media.
 */

import type Database from 'better-sqlite3'
import type { MediaRow } from '../types.js'
import type { Media } from '@lumo/core'

export interface CreateMediaData {
  id: string
  url: string
  mimeType: string
  width?: number
  height?: number
  duration?: number
}

export interface ListMediaOptions {
  type?: 'image' | 'video' | 'audio' | 'document'
  limit?: number
  offset?: number
}

/**
 * Create new media
 */
export function createMedia(db: Database.Database, data: CreateMediaData): Media {
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO media (id, url, mime_type, width, height, duration, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.id,
    data.url,
    data.mimeType,
    data.width ?? null,
    data.height ?? null,
    data.duration ?? null,
    now
  )

  return getMediaById(db, data.id)!
}

/**
 * Get media by ID
 */
export function getMediaById(db: Database.Database, id: string): Media | null {
  const row = db
    .prepare<[string], MediaRow>('SELECT * FROM media WHERE id = ?')
    .get(id)

  if (!row) {
    return null
  }

  return rowToMedia(row)
}

/**
 * List media with filtering and pagination
 */
export function listMedia(
  db: Database.Database,
  options: ListMediaOptions = {}
): Media[] {
  const { type, limit = 50, offset = 0 } = options

  let query = 'SELECT * FROM media WHERE 1=1'
  const params: any[] = []

  if (type) {
    const mimeTypePattern = getMimeTypePattern(type)
    if (mimeTypePattern) {
      query += ' AND mime_type LIKE ?'
      params.push(mimeTypePattern)
    }
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const rows = db.prepare(query).all(...params) as MediaRow[]
  return rows.map(rowToMedia)
}

/**
 * Replace media (updates URL and metadata, keeps ID)
 */
export function replaceMedia(
  db: Database.Database,
  id: string,
  data: Omit<CreateMediaData, 'id'>
): Media {
  db.prepare(`
    UPDATE media
    SET url = ?, mime_type = ?, width = ?, height = ?, duration = ?
    WHERE id = ?
  `).run(
    data.url,
    data.mimeType,
    data.width ?? null,
    data.height ?? null,
    data.duration ?? null,
    id
  )

  return getMediaById(db, id)!
}

/**
 * Delete media
 */
export function deleteMedia(db: Database.Database, id: string): void {
  db.prepare('DELETE FROM media WHERE id = ?').run(id)
}

/**
 * Check if media is referenced in content
 * Returns list of references (page/post IDs)
 */
export function getMediaReferences(
  db: Database.Database,
  mediaId: string
): Array<{ type: 'page' | 'post'; id: string; language: string }> {
  const references: Array<{ type: 'page' | 'post'; id: string; language: string }> = []

  // Check page translations (use LIKE filter first for efficiency)
  const pageTranslations = db
    .prepare<[string], { page_id: string; language: string; content: string }>(
      'SELECT page_id, language, content FROM page_translations WHERE content LIKE ?'
    )
    .all(`%${mediaId}%`)

  for (const row of pageTranslations) {
    try {
      const content = JSON.parse(row.content)
      if (fieldsContainMediaId(content.fields, mediaId)) {
        references.push({
          type: 'page',
          id: row.page_id,
          language: row.language,
        })
      }
    } catch {
      // Ignore invalid JSON
    }
  }

  // Check post translations (use LIKE filter first for efficiency)
  const postTranslations = db
    .prepare<[string], { post_id: string; language: string; content: string }>(
      'SELECT post_id, language, content FROM post_translations WHERE content LIKE ?'
    )
    .all(`%${mediaId}%`)

  for (const row of postTranslations) {
    try {
      const content = JSON.parse(row.content)
      if (fieldsContainMediaId(content.fields, mediaId)) {
        references.push({
          type: 'post',
          id: row.post_id,
          language: row.language,
        })
      }
    } catch {
      // Ignore invalid JSON
    }
  }

  return references
}

/**
 * Convert database row to Media object
 */
function rowToMedia(row: MediaRow): Media {
  return {
    id: row.id,
    url: row.url,
    mimeType: row.mime_type,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    duration: row.duration ?? undefined,
    createdAt: row.created_at,
  }
}

/**
 * Get MIME type pattern for filtering
 */
function getMimeTypePattern(type: 'image' | 'video' | 'audio' | 'document'): string | null {
  switch (type) {
    case 'image':
      return 'image/%'
    case 'video':
      return 'video/%'
    case 'audio':
      return 'audio/%'
    case 'document':
      return 'application/pdf'
    default:
      return null
  }
}

/**
 * Check if fields object contains a media ID reference
 * Recursively searches for MediaReference objects
 */
function fieldsContainMediaId(fields: Record<string, any>, mediaId: string): boolean {
  for (const value of Object.values(fields)) {
    if (!value) continue

    // Check if it's a MediaReference object
    if (typeof value === 'object' && value.mediaId === mediaId) {
      return true
    }

    // Check if it's an array of MediaReference objects (gallery field)
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'object' && item.mediaId === mediaId) {
          return true
        }
      }
    }
  }

  return false
}
