/**
 * Preview Routes
 *
 * POST /api/admin/preview - Create preview snapshot
 * GET /api/preview/:token - Get preview content by token
 */

import type { FastifyInstance } from 'fastify'
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js'
import { createPreview, getPreviewByToken } from '@lumo/db'
import { validatePageTranslation, validatePostTranslation } from '@lumo/core'
import { generateRandomToken, generateId } from '../../utils/tokens.js'
import type { Fields, PreviewTargetType } from '@lumo/core'

export async function registerPreviewRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /api/admin/preview
   * Create preview snapshot
   */
  app.post<{
    Body: {
      targetType: PreviewTargetType
      targetId: string | null
      postType?: string | null
      language: string
      slug: string
      title: string
      fields: Fields
    }
  }>('/api/admin/preview', { preHandler: requireAuth }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest
    const { targetType, targetId, postType, language, slug, title, fields } = request.body

    // Validate language
    if (!app.config.languages.includes(language)) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: `Language "${language}" is not configured`,
        },
      })
    }

    // Validate content based on target type
    if (targetType === 'page') {
      // For pages, validate against page schema
      const result = validatePageTranslation(
        slug,
        language,
        { slug, title, fields, updatedAt: new Date().toISOString() },
        app.config
      )
      if (!result.success) {
        return reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: result.errors,
          },
        })
      }
    } else if (targetType === 'post') {
      if (!postType) {
        return reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'postType is required for post previews',
          },
        })
      }

      const result = validatePostTranslation(
        postType,
        language,
        { slug, title, fields, updatedAt: new Date().toISOString() },
        app.config
      )
      if (!result.success) {
        return reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: result.errors,
          },
        })
      }
    }

    // Create preview
    const token = generateRandomToken(32)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes

    const preview = createPreview(app.db, {
      id: generateId('preview'),
      token,
      targetType,
      targetId,
      postType: postType || null,
      language,
      slug,
      title,
      fields,
      createdBy: user.id,
      expiresAt,
    })

    // Build preview URL (path only, not full URL)
    let previewUrl: string

    if (targetType === 'page') {
      previewUrl = `/${slug}?preview=${token}`
    } else {
      previewUrl = `/${postType}/${slug}?preview=${token}`
    }

    return {
      token: preview.token,
      previewUrl,
      expiresAt: preview.expiresAt,
    }
  })

  /**
   * GET /api/preview/:token
   * Get preview content by token (no auth required, token is credential)
   */
  app.get<{
    Params: { token: string }
  }>('/api/preview/:token', async (request, reply) => {
    const { token } = request.params

    const preview = getPreviewByToken(app.db, token)

    if (!preview) {
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Preview not found or expired',
        },
      })
    }

    return {
      targetType: preview.targetType,
      targetId: preview.targetId,
      postType: preview.postType,
      language: preview.language,
      slug: preview.slug,
      title: preview.title,
      fields: preview.fields,
    }
  })
}
