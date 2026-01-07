/**
 * Fastify Application Setup
 */

import Fastify, { type FastifyInstance } from 'fastify'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import staticFiles from '@fastify/static'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { LumoConfig } from '@lumo/core'
import type Database from 'better-sqlite3'
import type { ConfigLoader } from './config/loader.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface AppOptions {
  config: LumoConfig
  db: Database.Database
  configLoader?: ConfigLoader
  logger?: boolean
}

/**
 * Create and configure Fastify application
 */
export async function createApp(options: AppOptions): Promise<FastifyInstance> {
  const { config, db, configLoader, logger = true } = options

  // Create Fastify instance
  const app = Fastify({
    logger,
  })

  // Register plugins
  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'replace-me-in-production',
  })

  await app.register(multipart, {
    limits: {
      fileSize: Math.max(
        config.media.maxImageSize,
        config.media.maxVideoSize,
        config.media.maxAudioSize,
        config.media.maxDocumentSize
      ),
    },
  })

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })

  // Register rate limiting
  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      const user = (request as any).user
      return user?.id || request.ip
    },
    errorResponseBuilder: (_request, context) => ({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests. Retry in ${Math.ceil(context.ttl / 1000)} seconds.`,
      },
    }),
  })

  // Error handler for validation errors
  app.setErrorHandler((error: any, request, reply) => {
    if (error.validation) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.validation.map((v: any) => ({
            path: v.instancePath || v.params?.missingProperty || 'body',
            reason: v.keyword,
            message: v.message,
          })),
        },
      })
    }

    app.log.error(error)
    return reply.code(error.statusCode || 500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error.message || 'Internal server error'),
      },
    })
  })

  // Register static file serving for uploads
  const uploadsPath = path.resolve(__dirname, '../../..', 'uploads')
  await app.register(staticFiles, {
    root: uploadsPath,
    prefix: '/uploads/',
  })

  // Store config, db, and configLoader in Fastify instance
  app.decorate('config', config)
  app.decorate('db', db)
  if (configLoader) {
    app.decorate('configLoader', configLoader)
  }

  // Health check endpoint
  app.get('/health', async () => {
    return { status: 'ok' }
  })

  // Register routes
  const { registerPublicPagesRoutes } = await import('./routes/public/pages.js')
  const { registerPublicPostsRoutes } = await import('./routes/public/posts.js')
  const { registerAdminPagesRoutes } = await import('./routes/admin/pages.js')
  const { registerAdminPostsRoutes } = await import('./routes/admin/posts.js')
  const { registerAdminMediaRoutes } = await import('./routes/admin/media.js')
  const { registerAdminSchemaRoutes } = await import('./routes/admin/schemas.js')
  const { registerAdminSettingsRoutes } = await import('./routes/admin/settings.js')
  const { registerPreviewRoutes } = await import('./routes/preview/index.js')
  const { registerAuthRoutes } = await import('./routes/auth/index.js')

  await registerPublicPagesRoutes(app)
  await registerPublicPostsRoutes(app)
  await registerAdminPagesRoutes(app)
  await registerAdminPostsRoutes(app)
  await registerAdminMediaRoutes(app)
  await registerAdminSchemaRoutes(app)
  await registerAdminSettingsRoutes(app)
  await registerPreviewRoutes(app)
  await registerAuthRoutes(app)

  // TODO: Register admin collaborators routes

  return app
}

// Extend Fastify types
declare module 'fastify' {
  interface FastifyInstance {
    config: LumoConfig
    db: Database.Database
    configLoader?: ConfigLoader
  }
}
