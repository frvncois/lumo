/**
 * Admin Posts API
 *
 * GET /api/admin/posts - List posts (all statuses, all languages)
 * GET /api/admin/posts/:id - Get post by ID
 * POST /api/admin/posts - Create post
 * PUT /api/admin/posts/:id - Update post metadata
 * PUT /api/admin/posts/:id/translations/:lang - Upsert translation
 * DELETE /api/admin/posts/:id/translations/:lang - Delete translation (owner only)
 * DELETE /api/admin/posts/:id - Delete post (owner only)
 */

import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/auth.js'
import { requireOwner } from '../../middleware/permissions.js'
import {
  listPosts,
  getPostById,
  createPost,
  updatePost,
  upsertPostTranslation,
  deletePostTranslation,
  deletePost,
} from '@lumo/db'
import { validatePostTranslation, validatePostStatus } from '@lumo/core'
import { generateId } from '../../utils/tokens.js'
import type { TranslationContent, PostStatus, Post } from '@lumo/core'
import { errors } from '../../utils/errors.js'
import {
  adminListPostsSchema,
  adminGetPostByIdSchema,
  adminCreatePostSchema,
  adminUpdatePostSchema,
  adminUpsertPostTranslationSchema,
  adminDeletePostTranslationSchema,
  adminDeletePostSchema,
} from '../../schemas/index.js'

export async function registerAdminPostsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/admin/posts
   * List posts with filters
   */
  app.get<{
    Querystring: {
      type?: string
      status?: string
      lang?: string
    }
  }>('/api/admin/posts', { preHandler: requireAuth, schema: adminListPostsSchema }, async (request, reply) => {
    const { type, status, lang } = request.query

    if (!type) {
      return errors.validation(reply, 'Type parameter is required')
    }

    if (!app.config.postTypes?.[type]) {
      return errors.validation(reply, `Post type "${type}" not found in config`)
    }

    const posts = listPosts(app.db, {
      type,
      language: lang,
      status: status && status !== 'all' ? (status as PostStatus) : undefined,
    })

    return { items: posts }
  })

  /**
   * GET /api/admin/posts/:id
   * Get post by ID with all translations
   */
  app.get<{
    Params: { id: string }
  }>('/api/admin/posts/:id', { preHandler: requireAuth, schema: adminGetPostByIdSchema }, async (request, reply) => {
    const post = getPostById(app.db, request.params.id)

    if (!post) {
      return errors.notFound(reply, 'Post')
    }

    return post
  })

  /**
   * POST /api/admin/posts
   * Create new post
   */
  app.post<{
    Body: {
      type: string
      status?: PostStatus
      publishedAt?: string | null
      position?: number | null
    }
  }>('/api/admin/posts', { preHandler: requireAuth, schema: adminCreatePostSchema }, async (request, reply) => {
    const { type, status = 'draft', publishedAt = null, position = null } = request.body

    if (!app.config.postTypes?.[type]) {
      return errors.validation(reply, `Post type "${type}" not found in config`)
    }

    // Validate status and publishedAt
    const statusResult = validatePostStatus(status, publishedAt)
    if (!statusResult.success) {
      return errors.validation(reply, 'Validation failed', statusResult.errors)
    }

    const postId = generateId('post')
    const post = createPost(app.db, {
      id: postId,
      type,
      status,
      publishedAt,
      position,
      translations: {},
    })

    return reply.code(201).send(post)
  })

  /**
   * PUT /api/admin/posts/:id
   * Update post metadata (status, publishedAt, position)
   */
  app.put<{
    Params: { id: string }
    Body: {
      status?: PostStatus
      publishedAt?: string | null
      position?: number | null
    }
  }>('/api/admin/posts/:id', { preHandler: requireAuth, schema: adminUpdatePostSchema }, async (request, reply) => {
    const { id } = request.params
    const { status, publishedAt, position } = request.body

    const post = getPostById(app.db, id)
    if (!post) {
      return errors.notFound(reply, 'Post')
    }

    // If status is being updated, validate it
    if (status !== undefined) {
      const effectivePublishedAt = publishedAt !== undefined ? publishedAt : post.publishedAt
      const statusResult = validatePostStatus(status, effectivePublishedAt)
      if (!statusResult.success) {
        return errors.validation(reply, 'Validation failed', statusResult.errors)
      }
    }

    updatePost(app.db, id, { status, publishedAt, position })
    const updated = getPostById(app.db, id)

    return updated
  })

  /**
   * PUT /api/admin/posts/:id/translations/:lang
   * Upsert post translation
   */
  app.put<{
    Params: { id: string; lang: string }
    Body: TranslationContent
  }>('/api/admin/posts/:id/translations/:lang', { preHandler: requireAuth, schema: adminUpsertPostTranslationSchema }, async (request, reply) => {
    const { id, lang } = request.params
    const content = request.body

    const post = getPostById(app.db, id)
    if (!post) {
      return errors.notFound(reply, 'Post')
    }

    // Validate translation
    const result = validatePostTranslation(post.type, lang, content, app.config)
    if (!result.success) {
      return errors.validation(reply, 'Validation failed', result.errors)
    }

    // Attempt upsert - let database handle uniqueness
    try {
      upsertPostTranslation(app.db, id, lang, content)
      const updated = getPostById(app.db, id)
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
   * DELETE /api/admin/posts/:id/translations/:lang
   * Delete post translation (owner only)
   */
  app.delete<{
    Params: { id: string; lang: string }
  }>('/api/admin/posts/:id/translations/:lang', { preHandler: [requireAuth, requireOwner], schema: adminDeletePostTranslationSchema }, async (request, reply) => {
    const { id, lang } = request.params

    // Cannot delete default language
    if (lang === app.config.defaultLanguage) {
      return errors.forbidden(reply, 'Cannot delete default language translation')
    }

    const post = getPostById(app.db, id)
    if (!post) {
      return errors.notFound(reply, 'Post')
    }

    if (!post.translations[lang]) {
      return errors.notFound(reply, 'Translation')
    }

    deletePostTranslation(app.db, id, lang)

    return { success: true }
  })

  /**
   * DELETE /api/admin/posts/:id
   * Delete post (owner only)
   */
  app.delete<{
    Params: { id: string }
  }>('/api/admin/posts/:id', { preHandler: [requireAuth, requireOwner], schema: adminDeletePostSchema }, async (request, reply) => {
    const post = getPostById(app.db, request.params.id)
    if (!post) {
      return errors.notFound(reply, 'Post')
    }

    deletePost(app.db, request.params.id)

    return { success: true }
  })
}
