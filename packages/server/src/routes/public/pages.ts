/**
 * Public Pages API
 *
 * GET /api/pages - List pages
 * GET /api/pages/:slug - Get page by slug
 */

import type { FastifyInstance } from 'fastify'
import { getPageBySlug } from '@lumo/db'

export async function registerPublicPagesRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/pages
   * List all pages (with translations for specified language)
   */
  app.get<{
    Querystring: { lang?: string }
  }>('/api/pages', async (request, reply) => {
    const language = request.query.lang || app.config.defaultLanguage

    // Validate language
    if (!app.config.languages.includes(language)) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: `Language "${language}" is not configured`,
        },
      })
    }

    // Get all pages
    const allPages = Object.keys(app.config.pages || {})

    const items = allPages
      .map((pageSlug) => {
        const page = getPageBySlug(app.db, pageSlug, language)
        if (!page || !page.translations[language]) {
          return null
        }

        const translation = page.translations[language]
        return {
          id: page.id,
          slug: translation.slug,
          title: translation.title,
          updatedAt: translation.updatedAt,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    return { items }
  })

  /**
   * GET /api/pages/:slug
   * Get page by slug for specified language
   */
  app.get<{
    Params: { slug: string }
    Querystring: { lang?: string }
  }>('/api/pages/:slug', async (request, reply) => {
    const { slug } = request.params
    const language = request.query.lang || app.config.defaultLanguage

    // Validate language
    if (!app.config.languages.includes(language)) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: `Language "${language}" is not configured`,
        },
      })
    }

    const page = getPageBySlug(app.db, slug, language)

    if (!page || !page.translations[language]) {
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: `Page not found`,
        },
      })
    }

    const translation = page.translations[language]

    return {
      id: page.id,
      slug: translation.slug,
      title: translation.title,
      fields: translation.fields,
      updatedAt: translation.updatedAt,
    }
  })
}
