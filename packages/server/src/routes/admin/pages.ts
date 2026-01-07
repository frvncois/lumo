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
  isPageSlugAvailable,
} from '@lumo/db'
import { validatePageTranslation } from '@lumo/core'
import { generateId } from '../../utils/tokens.js'
import type { PageTranslations, TranslationContent } from '@lumo/core'

export async function registerAdminPagesRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/admin/pages
   * List all pages with all translations
   */
  app.get('/api/admin/pages', { preHandler: requireAuth }, async () => {
    const pages = listPages(app.db)
    return { items: pages }
  })

  /**
   * GET /api/admin/pages/:id
   * Get page by ID with all translations
   */
  app.get<{
    Params: { id: string }
  }>('/api/admin/pages/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params
    let page = getPageById(app.db, id)

    // If page doesn't exist but is defined in config, create it
    if (!page) {
      // Check if page ID exists in config
      if (!app.config.pages?.[id]) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `Page "${id}" not found in configuration` },
        })
      }

      // Create empty page record
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
      translations: PageTranslations
    }
  }>('/api/admin/pages', { preHandler: requireAuth }, async (request, reply) => {
    const { translations } = request.body

    // Validate default language exists
    if (!translations[app.config.defaultLanguage]) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: `Default language "${app.config.defaultLanguage}" translation is required`,
        },
      })
    }

    // Get page slug from default translation
    const defaultTranslation = translations[app.config.defaultLanguage]
    const pageSlug = defaultTranslation.slug

    // Check if page exists in config
    if (!app.config.pages?.[pageSlug]) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: `Page "${pageSlug}" is not defined in configuration`,
        },
      })
    }

    // Validate each translation
    for (const [lang, content] of Object.entries(translations)) {
      const result = validatePageTranslation(pageSlug, lang, content, app.config)
      if (!result.success) {
        return reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: result.errors,
          },
        })
      }

      // Check slug availability
      if (!isPageSlugAvailable(app.db, content.slug, lang)) {
        return reply.code(409).send({
          error: {
            code: 'CONFLICT',
            message: `Slug "${content.slug}" already exists for language "${lang}"`,
          },
        })
      }
    }

    const pageId = generateId('page')
    const page = createPage(app.db, pageId, translations)

    return reply.code(201).send(page)
  })

  /**
   * PUT /api/admin/pages/:id/translations/:lang
   * Upsert page translation
   */
  app.put<{
    Params: { id: string; lang: string }
    Body: TranslationContent
  }>('/api/admin/pages/:id/translations/:lang', { preHandler: requireAuth }, async (request, reply) => {
    const { id, lang } = request.params
    const content = request.body

    let page = getPageById(app.db, id)

    // If page doesn't exist but is defined in config, create it
    if (!page) {
      // Check if page ID exists in config
      if (!app.config.pages?.[id]) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `Page "${id}" not found in configuration` },
        })
      }

      // Create page record
      page = createPage(app.db, id, {})
    }

    // Determine page slug from content or ID
    const pageSlug = id

    // Validate translation
    const result = validatePageTranslation(pageSlug, lang, content, app.config)
    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: result.errors,
        },
      })
    }

    // Check slug availability
    if (!isPageSlugAvailable(app.db, content.slug, lang, id)) {
      return reply.code(409).send({
        error: {
          code: 'CONFLICT',
          message: `Slug "${content.slug}" already exists for language "${lang}"`,
        },
      })
    }

    upsertPageTranslation(app.db, id, lang, content)
    const updated = getPageById(app.db, id)

    return updated
  })

  /**
   * DELETE /api/admin/pages/:id/translations/:lang
   * Delete page translation (owner only)
   */
  app.delete<{
    Params: { id: string; lang: string }
  }>('/api/admin/pages/:id/translations/:lang', { preHandler: [requireAuth, requireOwner] }, async (request, reply) => {
    const { id, lang } = request.params

    // Cannot delete default language
    if (lang === app.config.defaultLanguage) {
      return reply.code(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot delete default language translation',
        },
      })
    }

    const page = getPageById(app.db, id)
    if (!page) {
      return reply.code(404).send({
        error: { code: 'NOT_FOUND', message: 'Page not found' },
      })
    }

    if (!page.translations[lang]) {
      return reply.code(404).send({
        error: { code: 'NOT_FOUND', message: 'Translation not found' },
      })
    }

    deletePageTranslation(app.db, id, lang)

    return { ok: true }
  })

  /**
   * DELETE /api/admin/pages/:id
   * Delete page (owner only)
   */
  app.delete<{
    Params: { id: string }
  }>('/api/admin/pages/:id', { preHandler: [requireAuth, requireOwner] }, async (request, reply) => {
    const page = getPageById(app.db, request.params.id)
    if (!page) {
      return reply.code(404).send({
        error: { code: 'NOT_FOUND', message: 'Page not found' },
      })
    }

    deletePage(app.db, request.params.id)

    return { ok: true }
  })
}
