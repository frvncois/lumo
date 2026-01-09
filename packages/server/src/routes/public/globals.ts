/**
 * Public Globals API
 *
 * GET /api/globals/:slug - Get global content by schema slug
 */

import type { FastifyInstance } from 'fastify'
import { getGlobalWithTranslations } from '@lumo/db'

export async function registerPublicGlobalRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/globals/:slug
   * Get global content by schema slug
   */
  app.get<{
    Params: { slug: string }
    Querystring: { lang?: string }
  }>('/api/globals/:slug', async (request, reply) => {
    const { slug } = request.params
    const lang = request.query.lang || app.config.defaultLanguage

    // Check if global schema exists
    if (!app.config.globals?.[slug]) {
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Global schema not found',
        },
      })
    }

    const global = getGlobalWithTranslations(app.db, slug)

    // Return empty content if global instance doesn't exist yet
    if (!global) {
      return {
        schemaSlug: slug,
        fields: {},
      }
    }

    const translation = global.translations[lang]
    if (!translation) {
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Global translation not found',
        },
      })
    }

    return {
      schemaSlug: slug,
      fields: translation.fields,
      updatedAt: translation.updatedAt,
    }
  })
}
