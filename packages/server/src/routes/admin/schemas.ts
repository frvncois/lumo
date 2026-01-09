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
  createGlobalSchema,
  getGlobalSchema,
  getAllGlobalSchemas,
  updateGlobalSchema,
  deleteGlobalSchema,
  detectFieldKeyChanges,
  migratePageTranslations,
  migratePostTranslations,
  withTransaction,
  getPageById,
  deletePage,
  listPosts,
  getGlobalBySchemaSlug,
  deleteGlobal,
} from '@lumo/db'
import { validatePageSchema, validatePostTypeSchema, validateGlobalSchema } from '@lumo/core'
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

/**
 * Validate slug format
 */
function validateSlugFormat(slug: string): { valid: boolean; error?: string } {
  if (!slug || typeof slug !== 'string') {
    return { valid: false, error: 'Slug is required' }
  }
  if (!/^[a-z][a-z0-9-]*$/.test(slug)) {
    return { valid: false, error: 'Slug must start with lowercase letter and contain only lowercase letters, numbers, and hyphens' }
  }
  if (slug.length > 64) {
    return { valid: false, error: 'Slug exceeds 64 character limit' }
  }
  return { valid: true }
}

export async function registerAdminSchemaRoutes(app: FastifyInstance) {
  // Get all schemas from database
  app.get('/api/admin/schemas', { preHandler: [requireAuth, requireOwner] }, async (request, reply) => {
    const pages = getAllPageSchemas(app.db)
    const postTypes = getAllPostTypeSchemas(app.db)
    const globals = getAllGlobalSchemas(app.db)

    return { pages, postTypes, globals }
  })

  // Create page schema
  app.post('/api/admin/schemas/pages', { preHandler: [requireAuth, requireOwner], schema: adminCreatePageSchemaSchema }, async (request, reply) => {
    const { slug, name, fields } = request.body as { slug: string; name: string; fields: any[] }

    // Validate slug format
    const slugValidation = validateSlugFormat(slug)
    if (!slugValidation.valid) {
      return errors.validation(reply, slugValidation.error!)
    }

    // Validate schema using core validator
    const validationErrors = validatePageSchema(slug, { name, fields })
    if (validationErrors.length > 0) {
      return errors.validation(reply, 'Schema validation failed', validationErrors)
    }

    // Check if slug already exists in database
    const existing = getPageSchema(app.db, slug)
    if (existing) {
      return errors.conflict(reply, 'A page schema with this slug already exists')
    }

    const schema = createPageSchema(app.db, { slug, name, fields })

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
    const body = request.body as { name?: string; fields?: any[] }

    // Check if schema exists in database
    const existing = getPageSchema(app.db, slug)
    if (!existing) {
      return errors.notFound(reply, 'Page schema')
    }

    // Build complete schema for validation (merge existing with updates)
    const schemaToValidate = {
      name: body.name ?? existing.name,
      fields: body.fields ?? existing.fields,
    }

    // Validate schema using core validator
    const validationErrors = validatePageSchema(slug, schemaToValidate)
    if (validationErrors.length > 0) {
      return errors.validation(reply, 'Schema validation failed', validationErrors)
    }

    // Detect field key changes (only if fields are being updated)
    let keyChanges: Map<string, string> | undefined
    if (body.fields) {
      keyChanges = detectFieldKeyChanges(existing.fields, body.fields)
      app.log.info(`[Schema Update] Page schema "${slug}" - detected ${keyChanges.size} field key changes`)
    }

    // Use transaction for migration + update
    const schema = withTransaction(app.db, () => {
      // Migrate content if keys changed
      if (keyChanges && keyChanges.size > 0) {
        app.log.info(`[Schema Update] Starting migration for page schema "${slug}"...`)
        const migratedCount = migratePageTranslations(app.db, slug, keyChanges)
        app.log.info(`[Schema Update] Migrated ${migratedCount} page translations`)
      }
      return updatePageSchema(app.db, slug, body)
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

    // Use transaction to delete both schema and page
    const result = withTransaction(app.db, () => {
      // Check if page exists for this schema (page ID = schema slug)
      const page = getPageById(app.db, slug)
      if (page) {
        app.log.info(`[Schema Delete] Deleting page "${slug}" along with its schema`)
        deletePage(app.db, slug)
      }

      // Delete the schema
      const deleted = deletePageSchema(app.db, slug)
      if (!deleted) {
        throw new Error('Schema not found')
      }

      return true
    })

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

    // Validate slug format
    const slugValidation = validateSlugFormat(slug)
    if (!slugValidation.valid) {
      return errors.validation(reply, slugValidation.error!)
    }

    // Validate schema using core validator
    const validationErrors = validatePostTypeSchema(slug, { name, nameSingular, fields })
    if (validationErrors.length > 0) {
      return errors.validation(reply, 'Schema validation failed', validationErrors)
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

    // Build complete schema for validation (merge existing with updates)
    const schemaToValidate = {
      name: body.name ?? existing.name,
      nameSingular: body.nameSingular ?? existing.nameSingular,
      fields: body.fields ?? existing.fields,
    }

    // Validate schema using core validator
    const validationErrors = validatePostTypeSchema(slug, schemaToValidate)
    if (validationErrors.length > 0) {
      return errors.validation(reply, 'Schema validation failed', validationErrors)
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

    // Check if posts exist for this type
    const posts = listPosts(app.db, { type: slug })
    if (posts.length > 0) {
      return errors.conflict(reply, `Cannot delete post type schema: ${posts.length} posts still exist. Delete posts first.`)
    }

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

  // ========================================
  // Global Schema Routes
  // ========================================

  // Create global schema
  app.post('/api/admin/schemas/globals', { preHandler: [requireAuth, requireOwner] }, async (request, reply) => {
    const { slug, name, fields } = request.body as { slug: string; name: string; fields: any[] }

    // Validate slug format
    const slugValidation = validateSlugFormat(slug)
    if (!slugValidation.valid) {
      return errors.validation(reply, slugValidation.error!)
    }

    // Validate schema using core validator
    const validation = validateGlobalSchema({ slug, name, fields })
    if (!validation.success) {
      return errors.validation(reply, 'Schema validation failed', validation.errors)
    }

    // Check if slug already exists
    const existing = getGlobalSchema(app.db, slug)
    if (existing) {
      return errors.conflict(reply, 'A global schema with this slug already exists')
    }

    const schema = createGlobalSchema(app.db, { slug, name, fields })

    // Reload config to reflect schema changes
    if (app.configLoader) {
      const newConfig = app.configLoader.reload()
      app.config = newConfig
      app.log.info('Configuration reloaded after global schema creation')
    }

    return schema
  })

  // Update global schema
  app.put('/api/admin/schemas/globals/:slug', { preHandler: [requireAuth, requireOwner] }, async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const { name, fields } = request.body as { name?: string; fields?: any[] }

    const existing = getGlobalSchema(app.db, slug)
    if (!existing) {
      return errors.notFound(reply, 'Global schema')
    }

    // Validate if fields provided
    if (fields) {
      const validation = validateGlobalSchema({
        slug,
        name: name || existing.name,
        fields
      })
      if (!validation.success) {
        return errors.validation(reply, 'Schema validation failed', validation.errors)
      }
    }

    const schema = updateGlobalSchema(app.db, slug, { name, fields })

    // Reload config to reflect schema changes
    if (app.configLoader) {
      const newConfig = app.configLoader.reload()
      app.config = newConfig
      app.log.info('Configuration reloaded after global schema update')
    }

    return schema
  })

  // Delete global schema
  app.delete('/api/admin/schemas/globals/:slug', { preHandler: [requireAuth, requireOwner] }, async (request, reply) => {
    const { slug } = request.params as { slug: string }

    const existing = getGlobalSchema(app.db, slug)
    if (!existing) {
      return errors.notFound(reply, 'Global schema')
    }

    // Use transaction to delete schema and global instance
    const result = withTransaction(app.db, () => {
      // Delete global instance if exists
      const global = getGlobalBySchemaSlug(app.db, slug)
      if (global) {
        app.log.info(`[Schema Delete] Deleting global "${slug}" along with its schema`)
        deleteGlobal(app.db, global.id)
      }

      // Delete schema
      const deleted = deleteGlobalSchema(app.db, slug)
      if (!deleted) {
        throw new Error('Schema not found')
      }

      return true
    })

    // Reload config to reflect schema changes
    if (app.configLoader) {
      const newConfig = app.configLoader.reload()
      app.config = newConfig
      app.log.info('Configuration reloaded after global schema deletion')
    }

    return { success: true }
  })
}
