/**
 * Public Posts API
 *
 * GET /api/posts - List published posts
 * GET /api/posts/:type/:slug - Get post by type and slug
 */

import type { FastifyInstance } from 'fastify'
import { listPublishedPosts, getPostBySlug } from '@lumo/db'
import { errors } from '../../utils/errors.js'
import { publicListPostsSchema, publicGetPostBySlugSchema } from '../../schemas/index.js'

export async function registerPublicPostsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/posts
   * List published posts with filtering and pagination
   */
  app.get<{
    Querystring: {
      type: string
      lang?: string
      limit?: string
      cursor?: string
      order?: 'auto' | 'date_desc' | 'position_asc'
    }
  }>('/api/posts', { schema: publicListPostsSchema }, async (request, reply) => {
    const { type, order = 'auto' } = request.query
    const language = request.query.lang || app.config.defaultLanguage
    const limit = Math.min(parseInt(request.query.limit || '20'), 100)
    const offset = parseInt(request.query.cursor || '0')

    // Validate type
    if (!type) {
      return errors.validation(reply, 'Type parameter is required')
    }

    if (!app.config.postTypes?.[type]) {
      return errors.validation(reply, `Post type "${type}" is not configured`)
    }

    // Validate language
    if (!app.config.languages.includes(language)) {
      return errors.validation(reply, `Language "${language}" is not configured`)
    }

    const posts = listPublishedPosts(app.db, type, language, {
      limit: limit + 1, // Fetch one extra to determine if there's a next page
      offset,
      order,
    })

    const hasMore = posts.length > limit
    const items = hasMore ? posts.slice(0, limit) : posts

    return {
      items: items.map((post) => ({
        id: post.id,
        type: post.type,
        slug: post.slug,
        title: post.title,
        position: post.position,
        publishedAt: post.publishedAt,
        updatedAt: post.updatedAt,
      })),
      nextCursor: hasMore ? String(offset + limit) : null,
    }
  })

  /**
   * GET /api/posts/:type/:slug
   * Get published post by type and slug
   */
  app.get<{
    Params: { type: string; slug: string }
    Querystring: { lang?: string }
  }>('/api/posts/:type/:slug', { schema: publicGetPostBySlugSchema }, async (request, reply) => {
    const { type, slug } = request.params
    const language = request.query.lang || app.config.defaultLanguage

    // Validate type
    if (!app.config.postTypes?.[type]) {
      return errors.notFound(reply, 'Post')
    }

    // Validate language
    if (!app.config.languages.includes(language)) {
      return errors.validation(reply, `Language "${language}" is not configured`)
    }

    const post = getPostBySlug(app.db, type, slug, language)

    if (!post || post.status !== 'published' || !post.translations[language]) {
      return errors.notFound(reply, 'Post')
    }

    const translation = post.translations[language]

    return {
      id: post.id,
      type: post.type,
      slug: translation.slug,
      title: translation.title,
      fields: translation.fields,
      position: post.position,
      publishedAt: post.publishedAt,
      updatedAt: translation.updatedAt,
    }
  })
}
