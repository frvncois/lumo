/**
 * Admin Globals API
 *
 * GET /api/admin/globals - List all globals with translations
 * GET /api/admin/globals/:slug - Get global by schema slug
 * PUT /api/admin/globals/:slug/translations/:lang - Update translation
 * DELETE /api/admin/globals/:slug/translations/:lang - Delete translation
 */

import type { FastifyInstance } from 'fastify'
import type { Fields } from '@lumo/core'
import { validateGlobalTranslation } from '@lumo/core'
import {
  getGlobalBySchemaSlug,
  getGlobalWithTranslations,
  createGlobal,
  upsertGlobalTranslation,
  deleteGlobalTranslation,
} from '@lumo/db'

export async function registerAdminGlobalRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/admin/globals
   * List all globals with translations
   */
  app.get('/api/admin/globals', async (request, reply) => {
    const schemas = app.config.globals || {}
    const items = []

    for (const [slug, schema] of Object.entries(schemas)) {
      const global = getGlobalWithTranslations(app.db, slug)
      items.push({
        schemaSlug: slug,
        name: schema.name,
        translations: global?.translations || {},
        createdAt: global?.createdAt,
        updatedAt: global?.updatedAt,
      })
    }

    return { items }
  })

  /**
   * GET /api/admin/globals/:slug
   * Get global by schema slug with schema and translations
   */
  app.get<{
    Params: { slug: string }
  }>('/api/admin/globals/:slug', async (request, reply) => {
    const { slug } = request.params

    const schema = app.config.globals?.[slug]
    if (!schema) {
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Global schema not found',
        },
      })
    }

    const global = getGlobalWithTranslations(app.db, slug)

    return {
      schemaSlug: slug,
      name: schema.name,
      fields: schema.fields,
      translations: global?.translations || {},
      createdAt: global?.createdAt,
      updatedAt: global?.updatedAt,
    }
  })

  /**
   * PUT /api/admin/globals/:slug/translations/:lang
   * Create or update global translation
   */
  app.put<{
    Params: { slug: string; lang: string }
    Body: { fields: Fields }
  }>('/api/admin/globals/:slug/translations/:lang', async (request, reply) => {
    const { slug, lang } = request.params
    const { fields } = request.body

    const schema = app.config.globals?.[slug]
    if (!schema) {
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Global schema not found',
        },
      })
    }

    // Validate language
    if (!app.config.languages.includes(lang)) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: `Language "${lang}" is not configured`,
        },
      })
    }

    // Validate fields against schema
    const validation = validateGlobalTranslation({ fields }, schema.fields)
    if (!validation.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: validation.errors,
        },
      })
    }

    // Get or create global instance
    let global = getGlobalBySchemaSlug(app.db, slug)
    if (!global) {
      global = createGlobal(app.db, slug)
    }

    // Upsert translation
    const translation = upsertGlobalTranslation(app.db, global.id, lang, fields)

    return {
      schemaSlug: slug,
      lang,
      fields: JSON.parse(translation.fields),
      updatedAt: translation.updated_at,
    }
  })

  /**
   * DELETE /api/admin/globals/:slug/translations/:lang
   * Delete global translation (owner only)
   */
  app.delete<{
    Params: { slug: string; lang: string }
  }>('/api/admin/globals/:slug/translations/:lang', async (request, reply) => {
    const { slug, lang } = request.params

    const global = getGlobalBySchemaSlug(app.db, slug)
    if (!global) {
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Global not found',
        },
      })
    }

    // Don't allow deleting default language
    if (lang === app.config.defaultLanguage) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cannot delete default language translation',
        },
      })
    }

    deleteGlobalTranslation(app.db, global.id, lang)

    return { ok: true }
  })
}
