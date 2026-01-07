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
  }>('/api/admin/media', { preHandler: requireAuth }, async (request) => {
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
      return reply.code(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'No file provided' },
      })
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
  }>('/api/admin/media/:id/replace', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params

    const existing = getMediaById(app.db, id)
    if (!existing) {
      return reply.code(404).send({
        error: { code: 'NOT_FOUND', message: 'Media not found' },
      })
    }

    // Get uploaded file
    const data = await request.file()
    if (!data) {
      return reply.code(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'No file provided' },
      })
    }

    // Delete old file
    const oldFilename = existing.url.replace('/uploads/', '')
    await deleteFile(oldFilename)

    // Save new file with same ID
    const filename = await saveFile(data, id)

    // Extract metadata
    const metadata = await getFileMetadata(data, filename)

    // Update database record
    replaceMedia(app.db, id, {
      url: `/uploads/${filename}`,
      mimeType: data.mimetype,
      width: metadata.width,
      height: metadata.height,
      duration: metadata.duration,
    })

    const updated = getMediaById(app.db, id)
    return updated
  })

  /**
   * DELETE /api/admin/media/:id
   * Delete media (owner only)
   */
  app.delete<{
    Params: { id: string }
  }>('/api/admin/media/:id', { preHandler: [requireAuth, requireOwner] }, async (request, reply) => {
    const { id } = request.params

    const media = getMediaById(app.db, id)
    if (!media) {
      return reply.code(404).send({
        error: { code: 'NOT_FOUND', message: 'Media not found' },
      })
    }

    // Check if media is in use
    const references = getMediaReferences(app.db, id)
    if (references.length > 0) {
      // Warn but allow deletion (explicit deletion as per spec)
      console.warn(`Warning: Deleting media ${id} which is referenced in ${references.length} locations`)
    }

    // Delete file from disk
    const filename = media.url.replace('/uploads/', '')
    await deleteFile(filename)

    // Delete from database
    deleteMedia(app.db, id)

    return { ok: true }
  })
}
