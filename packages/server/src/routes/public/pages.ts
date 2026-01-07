/**
 * Public Pages API
 *
 * GET /api/pages - List pages
 * GET /api/pages/:slug - Get page by slug
 */

import type { FastifyInstance } from 'fastify'
import { getPageBySlug, listPages } from '@lumo/db'
import { errors } from '../../utils/errors.js'
import { publicListPagesSchema, publicGetPageBySlugSchema } from '../../schemas/index.js'

export async function registerPublicPagesRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/pages
   * List all pages (with translations for specified language)
   */
  app.get<{
    Querystring: { lang?: string }
  }>('/api/pages', { schema: publicListPagesSchema }, async (request, reply) => {
    const language = request.query.lang || app.config.defaultLanguage

    // Validate language
    if (!app.config.languages.includes(language)) {
      return errors.validation(reply, `Language "${language}" is not configured`)
    }

    // Get all pages from database
    const allPages = listPages(app.db)

    const items = allPages
      .map((page) => {
        const translation = page.translations[language]
        if (!translation) {
          return null
        }

        return {
          id: page.id,
          slug: translation.slug,
          title: translation.title,
          updatedAt: page.updatedAt,
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
  }>('/api/pages/:slug', { schema: publicGetPageBySlugSchema }, async (request, reply) => {
    const { slug } = request.params
    const language = request.query.lang || app.config.defaultLanguage

    // Validate language
    if (!app.config.languages.includes(language)) {
      return errors.validation(reply, `Language "${language}" is not configured`)
    }

    const page = getPageBySlug(app.db, slug, language)

    if (!page || !page.translations[language]) {
      return errors.notFound(reply, 'Page')
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
