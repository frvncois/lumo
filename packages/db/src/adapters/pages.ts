/**
 * Pages Adapter
 *
 * CRUD operations for pages and page translations.
 */

import type Database from 'better-sqlite3'
import type { PageRow, PageTranslationRow } from '../types.js'
import type { Page, PageTranslations, TranslationContent } from '@lumo/core'

/**
 * Create a new page
 */
export function createPage(
  db: Database.Database,
  id: string,
  translations: PageTranslations
): Page {
  const now = new Date().toISOString()

  // For pages, the ID is the schema slug
  const schemaSlug = id

  // Insert page with schema_slug
  const insertPage = db.prepare(`
    INSERT INTO pages (id, schema_slug, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `)
  insertPage.run(id, schemaSlug, now, now)

  // Insert translations
  for (const [language, content] of Object.entries(translations)) {
    insertPageTranslation(db, id, language, content)
  }

  return getPageById(db, id)!
}

/**
 * Get page by ID with all translations
 */
export function getPageById(db: Database.Database, id: string): Page | null {
  const pageRow = db
    .prepare<[string], PageRow>('SELECT * FROM pages WHERE id = ?')
    .get(id)

  if (!pageRow) {
    return null
  }

  const translationRows = db
    .prepare<[string], PageTranslationRow>('SELECT * FROM page_translations WHERE page_id = ?')
    .all(id)

  const translations: PageTranslations = {}
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
    id: pageRow.id,
    translations,
    createdAt: pageRow.created_at,
    updatedAt: pageRow.updated_at,
  }
}

/**
 * Get page by slug and language
 */
export function getPageBySlug(
  db: Database.Database,
  slug: string,
  language: string
): Page | null {
  const translationRow = db
    .prepare<[string, string], PageTranslationRow>(
      'SELECT * FROM page_translations WHERE slug = ? AND language = ?'
    )
    .get(slug, language)

  if (!translationRow) {
    return null
  }

  return getPageById(db, translationRow.page_id)
}

/**
 * List all pages with minimal info
 */
export function listPages(db: Database.Database): Array<{
  id: string
  translations: Record<string, { slug: string; title: string }>
  updatedAt: string
}> {
  const pages = db.prepare<[], PageRow>('SELECT * FROM pages ORDER BY updated_at DESC').all()

  return pages.map((page) => {
    const translationRows = db
      .prepare<[string], PageTranslationRow>(
        'SELECT language, slug, content FROM page_translations WHERE page_id = ?'
      )
      .all(page.id)

    const translations: Record<string, { slug: string; title: string }> = {}
    for (const row of translationRows) {
      const content = JSON.parse(row.content)
      translations[row.language] = {
        slug: row.slug,
        title: content.title,
      }
    }

    return {
      id: page.id,
      translations,
      updatedAt: page.updated_at,
    }
  })
}

/**
 * List pages for a specific language (optimized for public API)
 * Uses a single JOIN query instead of N+1 queries
 */
export function listPagesForLanguage(
  db: Database.Database,
  language: string
): Array<{
  id: string
  slug: string
  title: string
  updatedAt: string
}> {
  const query = `
    SELECT p.id, pt.slug, pt.content, pt.updated_at
    FROM pages p
    JOIN page_translations pt ON p.id = pt.page_id
    WHERE pt.language = ?
    ORDER BY p.updated_at DESC
  `

  const rows = db.prepare(query).all(language) as Array<{
    id: string
    slug: string
    content: string
    updated_at: string
  }>

  return rows.map((row) => {
    const content = JSON.parse(row.content)
    return {
      id: row.id,
      slug: row.slug,
      title: content.title,
      updatedAt: row.updated_at,
    }
  })
}

/**
 * Insert or update page translation
 */
export function upsertPageTranslation(
  db: Database.Database,
  pageId: string,
  language: string,
  content: TranslationContent
): void {
  const now = new Date().toISOString()

  // Check if translation exists
  const existing = db
    .prepare<[string, string], { page_id: string }>(
      'SELECT page_id FROM page_translations WHERE page_id = ? AND language = ?'
    )
    .get(pageId, language)

  const contentJson = JSON.stringify({
    title: content.title,
    fields: content.fields,
    seo: content.seo || {},
  })

  if (existing) {
    // Update existing translation
    db.prepare(`
      UPDATE page_translations
      SET slug = ?, content = ?, updated_at = ?
      WHERE page_id = ? AND language = ?
    `).run(content.slug, contentJson, now, pageId, language)
  } else {
    // Insert new translation
    insertPageTranslation(db, pageId, language, content)
  }

  // Update page updated_at
  db.prepare('UPDATE pages SET updated_at = ? WHERE id = ?').run(now, pageId)
}

/**
 * Insert page translation (internal)
 */
function insertPageTranslation(
  db: Database.Database,
  pageId: string,
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
    INSERT INTO page_translations (page_id, language, slug, content, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    pageId,
    language,
    content.slug,
    contentJson,
    now
  )
}

/**
 * Delete page translation
 */
export function deletePageTranslation(
  db: Database.Database,
  pageId: string,
  language: string
): void {
  db.prepare('DELETE FROM page_translations WHERE page_id = ? AND language = ?').run(
    pageId,
    language
  )

  // Update page updated_at
  const now = new Date().toISOString()
  db.prepare('UPDATE pages SET updated_at = ? WHERE id = ?').run(now, pageId)
}

/**
 * Delete page and all translations (cascades)
 */
export function deletePage(db: Database.Database, id: string): void {
  db.prepare('DELETE FROM pages WHERE id = ?').run(id)
}

