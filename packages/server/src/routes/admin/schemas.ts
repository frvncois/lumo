/**
 * Admin Schema Management Routes
 */

import type { FastifyInstance } from 'fastify'
import {
  createPageSchema,
  getPageSchema,
  getAllPageSchemas,
  updatePageSchema,
  deletePageSchema,
  createPostTypeSchema,
  getPostTypeSchema,
  getAllPostTypeSchemas,
  updatePostTypeSchema,
  deletePostTypeSchema,
  detectFieldKeyChanges,
  migratePageTranslations,
  migratePostTranslations,
} from '@lumo/db'
import { requireAuth } from '../../middleware/auth.js'
import { requireOwner } from '../../middleware/permissions.js'

export async function registerAdminSchemaRoutes(app: FastifyInstance) {
  // Get all schemas from database
  app.get('/api/admin/schemas', { preHandler: [requireAuth, requireOwner] }, async (request, reply) => {
    const pages = getAllPageSchemas(app.db)
    const postTypes = getAllPostTypeSchemas(app.db)

    return { pages, postTypes }
  })

  // Create page schema
  app.post('/api/admin/schemas/pages', { preHandler: [requireAuth, requireOwner] }, async (request, reply) => {
    const { slug, fields } = request.body as { slug: string; fields: any[] }

    // Check if slug already exists in database
    const existing = getPageSchema(app.db, slug)
    if (existing) {
      return reply.code(400).send({
        error: {
          code: 'SCHEMA_EXISTS',
          message: 'A page schema with this slug already exists',
        },
      })
    }

    const schema = createPageSchema(app.db, { slug, fields })

    // Reload config to reflect schema changes
    if (app.configLoader) {
      const newConfig = app.configLoader.reload()
      app.config = newConfig
      app.log.info('Configuration reloaded after schema creation')
    }

    return schema
  })

  // Update page schema
  app.put('/api/admin/schemas/pages/:slug', { preHandler: [requireAuth, requireOwner] }, async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const { fields } = request.body as { fields: any[] }

    // Check if schema exists in database
    const existing = getPageSchema(app.db, slug)
    if (!existing) {
      return reply.code(404).send({
        error: {
          code: 'SCHEMA_NOT_FOUND',
          message: 'Page schema not found',
        },
      })
    }

    // Detect field key changes
    const keyChanges = detectFieldKeyChanges(existing.fields, fields)

    app.log.info(`[Schema Update] Page schema "${slug}" - detected ${keyChanges.size} field key changes`)

    // Migrate content if keys changed
    if (keyChanges.size > 0) {
      app.log.info(`[Schema Update] Starting migration for page schema "${slug}"...`)
      const migratedCount = migratePageTranslations(app.db, slug, keyChanges)
      app.log.info(`[Schema Update] Migrated ${migratedCount} page translations after field key changes`)
    }

    const schema = updatePageSchema(app.db, slug, fields)

    // Reload config to reflect schema changes
    if (app.configLoader) {
      const newConfig = app.configLoader.reload()
      app.config = newConfig
      app.log.info('Configuration reloaded after schema update')
    }

    return schema
  })

  // Delete page schema
  app.delete('/api/admin/schemas/pages/:slug', { preHandler: [requireAuth, requireOwner] }, async (request, reply) => {
    const { slug } = request.params as { slug: string }

    const deleted = deletePageSchema(app.db, slug)

    if (!deleted) {
      return reply.code(404).send({
        error: {
          code: 'SCHEMA_NOT_FOUND',
          message: 'Page schema not found',
        },
      })
    }

    // Reload config to reflect schema changes
    if (app.configLoader) {
      const newConfig = app.configLoader.reload()
      app.config = newConfig
      app.log.info('Configuration reloaded after schema deletion')
    }

    return { success: true }
  })

  // Create post type schema
  app.post('/api/admin/schemas/post-types', { preHandler: [requireAuth, requireOwner] }, async (request, reply) => {
    const { slug, name, nameSingular, fields } = request.body as {
      slug: string
      name: string
      nameSingular: string
      fields: any[]
    }

    // Check if slug already exists in database
    const existing = getPostTypeSchema(app.db, slug)
    if (existing) {
      return reply.code(400).send({
        error: {
          code: 'SCHEMA_EXISTS',
          message: 'A post type schema with this slug already exists',
        },
      })
    }

    const schema = createPostTypeSchema(app.db, { slug, name, nameSingular, fields })

    // Reload config to reflect schema changes
    if (app.configLoader) {
      const newConfig = app.configLoader.reload()
      app.config = newConfig
      app.log.info('Configuration reloaded after schema creation')
    }

    return schema
  })

  // Update post type schema
  app.put('/api/admin/schemas/post-types/:slug', { preHandler: [requireAuth, requireOwner] }, async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const body = request.body as { name?: string; nameSingular?: string; fields?: any[] }

    // Check if schema exists in database
    const existing = getPostTypeSchema(app.db, slug)
    if (!existing) {
      return reply.code(404).send({
        error: {
          code: 'SCHEMA_NOT_FOUND',
          message: 'Post type schema not found',
        },
      })
    }

    // Detect field key changes (only if fields are being updated)
    if (body.fields) {
      const keyChanges = detectFieldKeyChanges(existing.fields, body.fields)

      app.log.info(`[Schema Update] Post type schema "${slug}" - detected ${keyChanges.size} field key changes`)

      // Migrate content if keys changed
      if (keyChanges.size > 0) {
        app.log.info(`[Schema Update] Starting migration for post type "${slug}"...`)
        const migratedCount = migratePostTranslations(app.db, slug, keyChanges)
        app.log.info(`[Schema Update] Migrated ${migratedCount} post translations after field key changes`)
      }
    }

    const schema = updatePostTypeSchema(app.db, slug, body)

    // Reload config to reflect schema changes
    if (app.configLoader) {
      const newConfig = app.configLoader.reload()
      app.config = newConfig
      app.log.info('Configuration reloaded after schema update')
    }

    return schema
  })

  // Delete post type schema
  app.delete('/api/admin/schemas/post-types/:slug', { preHandler: [requireAuth, requireOwner] }, async (request, reply) => {
    const { slug } = request.params as { slug: string }

    const deleted = deletePostTypeSchema(app.db, slug)

    if (!deleted) {
      return reply.code(404).send({
        error: {
          code: 'SCHEMA_NOT_FOUND',
          message: 'Post type schema not found',
        },
      })
    }

    // Reload config to reflect schema changes
    if (app.configLoader) {
      const newConfig = app.configLoader.reload()
      app.config = newConfig
      app.log.info('Configuration reloaded after schema deletion')
    }

    return { success: true }
  })
}
