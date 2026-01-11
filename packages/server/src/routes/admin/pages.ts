/**
 * Admin Pages API
 *
 * GET /api/admin/pages - List all pages with all translations
 * GET /api/admin/pages/:id - Get page by ID
 * POST /api/admin/pages - Create page
 * PUT /api/admin/pages/:id/translations/:lang - Upsert translation
 * DELETE /api/admin/pages/:id/translations/:lang - Delete translation (owner only)
 * DELETE /api/admin/pages/:id - Delete page (owner only)
 */

import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/auth.js'
import { requireOwner } from '../../middleware/permissions.js'
import {
  listPages,
  getPageById,
  createPage,
  upsertPageTranslation,
  deletePageTranslation,
  deletePage,
  getPageSchema,
} from '@lumo/db'
import { validatePageTranslation } from '@lumo/core'
import { generateId } from '../../utils/tokens.js'
import type { PageTranslations, TranslationContent } from '@lumo/core'
import { errors } from '../../utils/errors.js'
import { sanitizeContentFields } from '../../utils/sanitize.js'
import {
  adminListPagesSchema,
  adminGetPageByIdSchema,
  adminCreatePageSchema,
  adminUpsertPageTranslationSchema,
  adminDeletePageTranslationSchema,
  adminDeletePageSchema,
} from '../../schemas/index.js'

export async function registerAdminPagesRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/admin/pages
   * List all pages with all translations
   */
  app.get('/api/admin/pages', { preHandler: requireAuth, schema: adminListPagesSchema }, async () => {
    const pages = listPages(app.db)
    return { items: pages }
  })

  /**
   * GET /api/admin/pages/:id
   * Get page by ID with all translations
   */
  app.get<{
    Params: { id: string }
  }>('/api/admin/pages/:id', { preHandler: requireAuth, schema: adminGetPageByIdSchema }, async (request, reply) => {
    const { id } = request.params
    let page = getPageById(app.db, id)

    // If page doesn't exist but schema exists, create empty page record
    if (!page) {
      const schema = getPageSchema(app.db, id)
      if (!schema) {
        return errors.notFound(reply, `Page schema "${id}" not found`)
      }

      // Create empty page record with schema slug as ID
      page = createPage(app.db, id, {})
    }

    return page
  })

  /**
   * POST /api/admin/pages
   * Create new page
   */
  app.post<{
    Body: {
      id: string
      translations: PageTranslations
    }
  }>('/api/admin/pages', { preHandler: requireAuth, schema: adminCreatePageSchema }, async (request, reply) => {
    const { id, translations } = request.body

    // Validate schema exists (page ID = schema slug)
    const schema = getPageSchema(app.db, id)
    if (!schema) {
      return errors.validation(reply, `Page schema "${id}" does not exist`)
    }

    // Validate default language exists
    if (!translations[app.config.defaultLanguage]) {
      return errors.validation(reply, `Default language "${app.config.defaultLanguage}" translation is required`)
    }

    // Build temporary config with just this schema for validation
    const tempConfig = {
      ...app.config,
      pages: { [id]: schema },
    }

    // Validate and sanitize each translation
    const sanitizedTranslations: PageTranslations = {}
    for (const [lang, content] of Object.entries(translations)) {
      const result = validatePageTranslation(id, lang, content, tempConfig)
      if (!result.success) {
        return errors.validation(reply, 'Validation failed', result.errors)
      }

      // Sanitize richtext fields
      const sanitizedFields = sanitizeContentFields(content.fields || {}, schema.fields)
      sanitizedTranslations[lang] = {
        ...content,
        fields: sanitizedFields
      }
    }

    try {
      const page = createPage(app.db, id, sanitizedTranslations)
      return reply.code(201).send(page)
    } catch (error: any) {
      // Handle unique constraint violation
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message?.includes('UNIQUE constraint failed')) {
        return errors.conflict(reply, 'A slug already exists for one of the translations')
      }
      throw error
    }
  })

  /**
   * PUT /api/admin/pages/:id/translations/:lang
   * Upsert page translation
   */
  app.put<{
    Params: { id: string; lang: string }
    Body: TranslationContent
  }>('/api/admin/pages/:id/translations/:lang', { preHandler: requireAuth, schema: adminUpsertPageTranslationSchema }, async (request, reply) => {
    const { id, lang } = request.params
    const content = request.body

    let page = getPageById(app.db, id)

    // If page doesn't exist but schema exists, create empty page record
    if (!page) {
      const schema = getPageSchema(app.db, id)
      if (!schema) {
        return errors.notFound(reply, `Page schema "${id}" not found`)
      }

      // Create empty page record with schema slug as ID
      page = createPage(app.db, id, {})
    }

    // Get schema from database (page ID = schema slug)
    const schema = getPageSchema(app.db, id)
    if (!schema) {
      return errors.validation(reply, `Page schema "${id}" does not exist`)
    }

    // Build temporary config with just this schema for validation
    const tempConfig = {
      ...app.config,
      pages: { [id]: schema },
    }

    // Validate translation
    const result = validatePageTranslation(id, lang, content, tempConfig)
    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: result.errors,
        },
      })
    }

    // Sanitize richtext fields
    const sanitizedFields = sanitizeContentFields(content.fields || {}, schema.fields)
    const sanitizedContent = {
      ...content,
      fields: sanitizedFields
    }

    // Attempt upsert - let database handle uniqueness
    try {
      upsertPageTranslation(app.db, id, lang, sanitizedContent)
      const updated = getPageById(app.db, id)
      return updated
    } catch (error: any) {
      // Handle unique constraint violation
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message?.includes('UNIQUE constraint failed')) {
        return errors.conflict(reply, `Slug "${content.slug}" already exists for language "${lang}"`)
      }
      throw error
    }
  })

  /**
   * DELETE /api/admin/pages/:id/translations/:lang
   * Delete page translation (owner only)
   */
  app.delete<{
    Params: { id: string; lang: string }
  }>('/api/admin/pages/:id/translations/:lang', { preHandler: [requireAuth, requireOwner], schema: adminDeletePageTranslationSchema }, async (request, reply) => {
    const { id, lang } = request.params

    // Cannot delete default language
    if (lang === app.config.defaultLanguage) {
      return errors.forbidden(reply, 'Cannot delete default language translation')
    }

    const page = getPageById(app.db, id)
    if (!page) {
      return errors.notFound(reply, 'Page')
    }

    if (!page.translations[lang]) {
      return errors.notFound(reply, 'Translation')
    }

    deletePageTranslation(app.db, id, lang)

    return { success: true }
  })

  /**
   * DELETE /api/admin/pages/:id
   * Delete page (owner only)
   */
  app.delete<{
    Params: { id: string }
  }>('/api/admin/pages/:id', { preHandler: [requireAuth, requireOwner], schema: adminDeletePageSchema }, async (request, reply) => {
    const page = getPageById(app.db, request.params.id)
    if (!page) {
      return errors.notFound(reply, 'Page')
    }

    deletePage(app.db, request.params.id)

    return { success: true }
  })
}
