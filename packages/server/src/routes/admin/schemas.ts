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
  withTransaction,
} from '@lumo/db'
import { requireAuth } from '../../middleware/auth.js'
import { requireOwner } from '../../middleware/permissions.js'
import { errors } from '../../utils/errors.js'
import {
  adminCreatePageSchemaSchema,
  adminUpdatePageSchemaSchema,
  adminDeletePageSchemaSchema,
  adminCreatePostTypeSchemaSchema,
  adminUpdatePostTypeSchemaSchema,
  adminDeletePostTypeSchemaSchema,
} from '../../schemas/index.js'

export async function registerAdminSchemaRoutes(app: FastifyInstance) {
  // Get all schemas from database
  app.get('/api/admin/schemas', { preHandler: [requireAuth, requireOwner] }, async (request, reply) => {
    const pages = getAllPageSchemas(app.db)
    const postTypes = getAllPostTypeSchemas(app.db)

    return { pages, postTypes }
  })

  // Create page schema
  app.post('/api/admin/schemas/pages', { preHandler: [requireAuth, requireOwner], schema: adminCreatePageSchemaSchema }, async (request, reply) => {
    const { slug, fields } = request.body as { slug: string; fields: any[] }

    // Check if slug already exists in database
    const existing = getPageSchema(app.db, slug)
    if (existing) {
      return errors.conflict(reply, 'A page schema with this slug already exists')
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
  app.put('/api/admin/schemas/pages/:slug', { preHandler: [requireAuth, requireOwner], schema: adminUpdatePageSchemaSchema }, async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const { fields } = request.body as { fields: any[] }

    // Check if schema exists in database
    const existing = getPageSchema(app.db, slug)
    if (!existing) {
      return errors.notFound(reply, 'Page schema')
    }

    // Detect field key changes
    const keyChanges = detectFieldKeyChanges(existing.fields, fields)

    app.log.info(`[Schema Update] Page schema "${slug}" - detected ${keyChanges.size} field key changes`)

    // Use transaction for migration + update
    const schema = withTransaction(app.db, () => {
      // Migrate content if keys changed
      if (keyChanges.size > 0) {
        app.log.info(`[Schema Update] Starting migration for page schema "${slug}"...`)
        const migratedCount = migratePageTranslations(app.db, slug, keyChanges)
        app.log.info(`[Schema Update] Migrated ${migratedCount} page translations`)
      }
      return updatePageSchema(app.db, slug, fields)
    })

    // Reload config to reflect schema changes
    if (app.configLoader) {
      const newConfig = app.configLoader.reload()
      app.config = newConfig
      app.log.info('Configuration reloaded after schema update')
    }

    return schema
  })

  // Delete page schema
  app.delete('/api/admin/schemas/pages/:slug', { preHandler: [requireAuth, requireOwner], schema: adminDeletePageSchemaSchema }, async (request, reply) => {
    const { slug } = request.params as { slug: string }

    const deleted = deletePageSchema(app.db, slug)

    if (!deleted) {
      return errors.notFound(reply, 'Page schema')
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
  app.post('/api/admin/schemas/post-types', { preHandler: [requireAuth, requireOwner], schema: adminCreatePostTypeSchemaSchema }, async (request, reply) => {
    const { slug, name, nameSingular, fields } = request.body as {
      slug: string
      name: string
      nameSingular: string
      fields: any[]
    }

    // Check if slug already exists in database
    const existing = getPostTypeSchema(app.db, slug)
    if (existing) {
      return errors.conflict(reply, 'A post type schema with this slug already exists')
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
  app.put('/api/admin/schemas/post-types/:slug', { preHandler: [requireAuth, requireOwner], schema: adminUpdatePostTypeSchemaSchema }, async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const body = request.body as { name?: string; nameSingular?: string; fields?: any[] }

    // Check if schema exists in database
    const existing = getPostTypeSchema(app.db, slug)
    if (!existing) {
      return errors.notFound(reply, 'Post type schema')
    }

    // Detect field key changes (only if fields are being updated)
    let keyChanges: Map<string, string> | undefined
    if (body.fields) {
      keyChanges = detectFieldKeyChanges(existing.fields, body.fields)
      app.log.info(`[Schema Update] Post type schema "${slug}" - detected ${keyChanges.size} field key changes`)
    }

    // Use transaction for migration + update
    const schema = withTransaction(app.db, () => {
      // Migrate content if keys changed
      if (keyChanges && keyChanges.size > 0) {
        app.log.info(`[Schema Update] Starting migration for post type "${slug}"...`)
        const migratedCount = migratePostTranslations(app.db, slug, keyChanges)
        app.log.info(`[Schema Update] Migrated ${migratedCount} post translations`)
      }
      return updatePostTypeSchema(app.db, slug, body)
    })

    // Reload config to reflect schema changes
    if (app.configLoader) {
      const newConfig = app.configLoader.reload()
      app.config = newConfig
      app.log.info('Configuration reloaded after schema update')
    }

    return schema
  })

  // Delete post type schema
  app.delete('/api/admin/schemas/post-types/:slug', { preHandler: [requireAuth, requireOwner], schema: adminDeletePostTypeSchemaSchema }, async (request, reply) => {
    const { slug } = request.params as { slug: string }

    const deleted = deletePostTypeSchema(app.db, slug)

    if (!deleted) {
      return errors.notFound(reply, 'Post type schema')
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
