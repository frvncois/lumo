/**
 * Admin Media API
 *
 * GET /api/admin/media - List media
 * POST /api/admin/media - Upload media
 * PUT /api/admin/media/:id/replace - Replace media (same ID)
 * DELETE /api/admin/media/:id - Delete media (owner only)
 */

import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/auth.js'
import { requireOwner } from '../../middleware/permissions.js'
import {
  listMedia,
  getMediaById,
  createMedia,
  replaceMedia,
  deleteMedia,
  getMediaReferences,
} from '@lumo/db'
import { generateId } from '../../utils/tokens.js'
import {
  saveFile,
  deleteFile,
  getFileMetadata,
} from '../../utils/media.js'
import { getMediaType, getMaxSize, formatBytes, validateFileUpload } from '../../utils/fileValidation.js'
import { errors } from '../../utils/errors.js'
import {
  adminListMediaSchema,
  adminReplaceMediaSchema,
  adminDeleteMediaSchema,
} from '../../schemas/index.js'

export async function registerAdminMediaRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/admin/media
   * List media with optional filters
   */
  app.get<{
    Querystring: {
      type?: 'image' | 'video' | 'audio' | 'document'
      limit?: number
    }
  }>('/api/admin/media', { preHandler: requireAuth, schema: adminListMediaSchema }, async (request) => {
    const { type, limit } = request.query

    const media = listMedia(app.db, { type, limit })

    return { items: media }
  })

  /**
   * POST /api/admin/media
   * Upload new media (multipart)
   */
  app.post('/api/admin/media', { preHandler: requireAuth }, async (request, reply) => {
    // Get uploaded file
    const data = await request.file()
    if (!data) {
      return errors.validation(reply, 'No file provided')
    }

    // Validate file upload (MIME type and extension)
    const validation = validateFileUpload(data.mimetype, data.filename)
    if (!validation.valid) {
      return errors.validation(reply, validation.error!)
    }

    // Check type-specific size limit
    const mediaType = getMediaType(data.mimetype)
    const maxSize = getMaxSize(mediaType, app.config.media)
    const buffer = await data.toBuffer()

    if (buffer.length > maxSize) {
      return errors.validation(
        reply,
        `File size (${formatBytes(buffer.length)}) exceeds ${mediaType} limit (${formatBytes(maxSize)})`
      )
    }

    // Generate ID and save file
    const mediaId = generateId('media')
    const filename = await saveFile(data, mediaId)

    // Extract metadata
    const metadata = await getFileMetadata(data, filename)

    // Create database record
    const media = createMedia(app.db, {
      id: mediaId,
      url: `/uploads/${filename}`,
      mimeType: data.mimetype,
      width: metadata.width,
      height: metadata.height,
      duration: metadata.duration,
    })

    return reply.code(201).send(media)
  })

  /**
   * PUT /api/admin/media/:id/replace
   * Replace media file while keeping same ID (multipart)
   */
  app.put<{
    Params: { id: string }
  }>('/api/admin/media/:id/replace', { preHandler: requireAuth, schema: adminReplaceMediaSchema }, async (request, reply) => {
    const { id } = request.params

    const existing = getMediaById(app.db, id)
    if (!existing) {
      return errors.notFound(reply, 'Media')
    }

    // Get uploaded file
    const data = await request.file()
    if (!data) {
      return errors.validation(reply, 'No file provided')
    }

    const oldFilename = existing.url.replace('/uploads/', '')
    let newFilename: string

    try {
      // Save new file first
      newFilename = await saveFile(data, id)
    } catch (error) {
      app.log.error(error, 'Failed to save replacement file')
      return errors.internal(reply, 'Failed to save file')
    }

    try {
      // Delete old file
      await deleteFile(oldFilename)
    } catch (error) {
      // Log but don't fail - old file might already be gone
      app.log.warn(error, `Failed to delete old media file: ${oldFilename}`)
    }

    try {
      const metadata = await getFileMetadata(data, newFilename)

      replaceMedia(app.db, id, {
        url: `/uploads/${newFilename}`,
        mimeType: data.mimetype,
        width: metadata.width,
        height: metadata.height,
        duration: metadata.duration,
      })

      const updated = getMediaById(app.db, id)
      return updated
    } catch (error) {
      app.log.error(error, 'Failed to update media record')
      return errors.internal(reply, 'Failed to update media')
    }
  })

  /**
   * DELETE /api/admin/media/:id
   * Delete media (owner only)
   */
  app.delete<{
    Params: { id: string }
  }>('/api/admin/media/:id', { preHandler: [requireAuth, requireOwner], schema: adminDeleteMediaSchema }, async (request, reply) => {
    const { id } = request.params

    const media = getMediaById(app.db, id)
    if (!media) {
      return errors.notFound(reply, 'Media')
    }

    // Check if media is in use
    const references = getMediaReferences(app.db, id)
    if (references.length > 0) {
      // Warn but allow deletion (explicit deletion as per spec)
      app.log.warn(`Deleting media ${id} which is referenced in ${references.length} locations`)
    }

    const filename = media.url.replace('/uploads/', '')

    try {
      // Delete file first, then database record
      await deleteFile(filename)
      deleteMedia(app.db, id)
      return { ok: true }
    } catch (error) {
      app.log.error(error, `Failed to delete media file: ${filename}`)
      return errors.internal(reply, 'Failed to delete media file')
    }
  })
}
