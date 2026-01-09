/**
 * Posts Adapter
 *
 * CRUD operations for posts and post translations.
 */

import type Database from 'better-sqlite3'
import type { PostRow, PostTranslationRow } from '../types.js'
import type { Post, PostTranslations, PostStatus, TranslationContent } from '@lumo/core'

export interface CreatePostData {
  id: string
  type: string
  status: PostStatus
  position?: number | null
  publishedAt?: string | null
  translations: PostTranslations
}

export interface UpdatePostData {
  status?: PostStatus
  position?: number | null
  publishedAt?: string | null
}

export interface ListPostsOptions {
  type?: string
  status?: PostStatus
  language?: string
  limit?: number
  offset?: number
  order?: 'auto' | 'date_desc' | 'position_asc'
}

/**
 * Create a new post
 */
export function createPost(db: Database.Database, data: CreatePostData): Post {
  const now = new Date().toISOString()

  // Insert post
  db.prepare(`
    INSERT INTO posts (id, type, status, position, published_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.id,
    data.type,
    data.status,
    data.position ?? null,
    data.publishedAt ?? null,
    now,
    now
  )

  // Insert translations
  for (const [language, content] of Object.entries(data.translations)) {
    insertPostTranslation(db, data.id, language, content)
  }

  return getPostById(db, data.id)!
}

/**
 * Get post by ID with all translations
 */
export function getPostById(db: Database.Database, id: string): Post | null {
  const postRow = db
    .prepare<[string], PostRow>('SELECT * FROM posts WHERE id = ?')
    .get(id)

  if (!postRow) {
    return null
  }

  const translationRows = db
    .prepare<[string], PostTranslationRow>('SELECT * FROM post_translations WHERE post_id = ?')
    .all(id)

  const translations: PostTranslations = {}
  for (const row of translationRows) {
    const content = JSON.parse(row.content)
    translations[row.language] = {
      slug: row.slug,
      title: content.title,
      fields: content.fields,
      seo: content.seo,
      updatedAt: row.updated_at,
    }
  }

  return {
    id: postRow.id,
    type: postRow.type,
    status: postRow.status,
    position: postRow.position,
    publishedAt: postRow.published_at,
    translations,
    createdAt: postRow.created_at,
    updatedAt: postRow.updated_at,
  }
}

/**
 * Get post by type, slug, and language
 */
export function getPostBySlug(
  db: Database.Database,
  type: string,
  slug: string,
  language: string
): Post | null {
  const translationRow = db
    .prepare<[string, string, string], PostTranslationRow>(
      `SELECT pt.* FROM post_translations pt
       JOIN posts p ON pt.post_id = p.id
       WHERE p.type = ? AND pt.slug = ? AND pt.language = ?`
    )
    .get(type, slug, language)

  if (!translationRow) {
    return null
  }

  return getPostById(db, translationRow.post_id)
}

/**
 * List posts with filtering and pagination
 */
export function listPosts(
  db: Database.Database,
  options: ListPostsOptions = {}
): Post[] {
  const {
    type,
    status,
    language,
    limit = 20,
    offset = 0,
    order = 'auto',
  } = options

  let query = 'SELECT * FROM posts WHERE 1=1'
  const params: any[] = []

  if (type) {
    query += ' AND type = ?'
    params.push(type)
  }

  if (status) {
    query += ' AND status = ?'
    params.push(status)
  }

  // Apply ordering
  if (order === 'auto') {
    // Posts with position first (ASC), then by publishedAt (DESC)
    query += ' ORDER BY CASE WHEN position IS NULL THEN 1 ELSE 0 END, position ASC, published_at DESC'
  } else if (order === 'date_desc') {
    query += ' ORDER BY published_at DESC'
  } else if (order === 'position_asc') {
    query += ' ORDER BY CASE WHEN position IS NULL THEN 1 ELSE 0 END, position ASC'
  }

  query += ' LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const postRows = db.prepare(query).all(...params) as PostRow[]

  // If language filter, only include posts with that translation
  if (language) {
    const postsWithTranslation: Post[] = []
    for (const row of postRows) {
      const post = getPostById(db, row.id)
      if (post && post.translations[language]) {
        postsWithTranslation.push(post)
      }
    }
    return postsWithTranslation
  }

  return postRows.map((row) => getPostById(db, row.id)!)
}

/**
 * List published posts only (for public API)
 */
export function listPublishedPosts(
  db: Database.Database,
  type: string,
  language: string,
  options: { limit?: number; offset?: number; order?: 'auto' | 'date_desc' | 'position_asc' } = {}
): Array<{
  id: string
  type: string
  slug: string
  title: string
  position: number | null
  publishedAt: string
  updatedAt: string
}> {
  const { limit = 20, offset = 0, order = 'auto' } = options

  let query = `
    SELECT p.id, p.type, p.position, p.published_at, pt.slug, pt.title, pt.updated_at
    FROM posts p
    JOIN post_translations pt ON p.id = pt.post_id
    WHERE p.type = ? AND p.status = 'published' AND pt.language = ?
  `

  const params: any[] = [type, language]

  // Apply ordering
  if (order === 'auto') {
    query += ' ORDER BY CASE WHEN p.position IS NULL THEN 1 ELSE 0 END, p.position ASC, p.published_at DESC'
  } else if (order === 'date_desc') {
    query += ' ORDER BY p.published_at DESC'
  } else if (order === 'position_asc') {
    query += ' ORDER BY CASE WHEN p.position IS NULL THEN 1 ELSE 0 END, p.position ASC'
  }

  query += ' LIMIT ? OFFSET ?'
  params.push(limit, offset)

  return db.prepare(query).all(...params) as any[]
}

/**
 * Update post metadata
 */
export function updatePost(
  db: Database.Database,
  id: string,
  data: UpdatePostData
): void {
  const updates: string[] = []
  const params: any[] = []

  if (data.status !== undefined) {
    updates.push('status = ?')
    params.push(data.status)
  }

  if (data.position !== undefined) {
    updates.push('position = ?')
    params.push(data.position)
  }

  if (data.publishedAt !== undefined) {
    updates.push('published_at = ?')
    params.push(data.publishedAt)
  }

  if (updates.length === 0) {
    return
  }

  const now = new Date().toISOString()
  updates.push('updated_at = ?')
  params.push(now)

  params.push(id)

  const query = `UPDATE posts SET ${updates.join(', ')} WHERE id = ?`
  db.prepare(query).run(...params)
}

/**
 * Upsert post translation
 */
export function upsertPostTranslation(
  db: Database.Database,
  postId: string,
  language: string,
  content: TranslationContent
): void {
  const now = new Date().toISOString()

  // Check if translation exists
  const existing = db
    .prepare<[string, string], { post_id: string }>(
      'SELECT post_id FROM post_translations WHERE post_id = ? AND language = ?'
    )
    .get(postId, language)

  const contentJson = JSON.stringify({
    title: content.title,
    fields: content.fields,
    seo: content.seo || {},
  })

  if (existing) {
    // Update existing translation
    db.prepare(`
      UPDATE post_translations
      SET slug = ?, content = ?, updated_at = ?
      WHERE post_id = ? AND language = ?
    `).run(content.slug, contentJson, now, postId, language)
  } else {
    // Insert new translation
    insertPostTranslation(db, postId, language, content)
  }

  // Update post updated_at
  db.prepare('UPDATE posts SET updated_at = ? WHERE id = ?').run(now, postId)
}

/**
 * Insert post translation (internal)
 */
function insertPostTranslation(
  db: Database.Database,
  postId: string,
  language: string,
  content: TranslationContent
): void {
  const now = new Date().toISOString()

  const contentJson = JSON.stringify({
    title: content.title,
    fields: content.fields,
    seo: content.seo || {},
  })

  db.prepare(`
    INSERT INTO post_translations (post_id, language, slug, content, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    postId,
    language,
    content.slug,
    contentJson,
    now
  )
}

/**
 * Delete post translation
 */
export function deletePostTranslation(
  db: Database.Database,
  postId: string,
  language: string
): void {
  db.prepare('DELETE FROM post_translations WHERE post_id = ? AND language = ?').run(
    postId,
    language
  )

  // Update post updated_at
  const now = new Date().toISOString()
  db.prepare('UPDATE posts SET updated_at = ? WHERE id = ?').run(now, postId)
}

/**
 * Delete post and all translations (cascades)
 */
export function deletePost(db: Database.Database, id: string): void {
  db.prepare('DELETE FROM posts WHERE id = ?').run(id)
}

