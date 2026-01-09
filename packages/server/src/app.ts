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
import { csrfProtection } from './utils/csrf.js'

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

  // Security headers
  app.addHook('onSend', async (_request, reply, payload) => {
    reply.header('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '))
    reply.header('X-Content-Type-Options', 'nosniff')
    reply.header('X-Frame-Options', 'DENY')
    reply.header('X-XSS-Protection', '1; mode=block')
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    return payload
  })

  // Register plugins
  const cookieSecret = process.env.COOKIE_SECRET
  if (!cookieSecret || cookieSecret === 'replace-me-in-production') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('COOKIE_SECRET environment variable must be set in production')
    }
    console.warn('⚠️  WARNING: Using default COOKIE_SECRET. Set COOKIE_SECRET env var for production.')
  }

  await app.register(cookie, {
    secret: cookieSecret || 'dev-secret-do-not-use-in-production',
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

  const corsOrigin = process.env.CORS_ORIGIN
  if (process.env.NODE_ENV === 'production' && (!corsOrigin || corsOrigin === '*')) {
    throw new Error('CORS_ORIGIN must be set to specific origins in production (not *)')
  }

  await app.register(cors, {
    origin: corsOrigin || (process.env.NODE_ENV === 'production' ? false : true),
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

  // CSRF protection
  app.addHook('preHandler', csrfProtection)

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
    setHeaders: (res, filepath) => {
      const ext = path.extname(filepath).toLowerCase()
      const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
      if (!imageExts.includes(ext)) {
        res.setHeader('Content-Disposition', 'attachment')
      }
      res.setHeader('X-Content-Type-Options', 'nosniff')
    },
  })

  // Register static file serving for admin UI
  const adminPath = path.resolve(__dirname, '../../admin/dist')
  await app.register(staticFiles, {
    root: adminPath,
    prefix: '/admin/',
    decorateReply: false, // Don't decorate since we already registered staticFiles above
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff')
    },
  })

  // Serve admin UI index.html for all /admin/* routes (SPA support)
  app.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/admin')) {
      reply.sendFile('index.html', adminPath)
    } else {
      reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found',
        },
      })
    }
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

  // Redirect root to admin
  app.get('/', async (request, reply) => {
    reply.redirect('/admin')
  })

  // Register routes
  const { registerPublicPagesRoutes } = await import('./routes/public/pages.js')
  const { registerPublicPostsRoutes } = await import('./routes/public/posts.js')
  const { registerPublicGlobalRoutes } = await import('./routes/public/globals.js')
  const { registerAdminPagesRoutes } = await import('./routes/admin/pages.js')
  const { registerAdminPostsRoutes } = await import('./routes/admin/posts.js')
  const { registerAdminGlobalRoutes } = await import('./routes/admin/globals.js')
  const { registerAdminMediaRoutes } = await import('./routes/admin/media.js')
  const { registerAdminSchemaRoutes } = await import('./routes/admin/schemas.js')
  const { registerAdminSettingsRoutes } = await import('./routes/admin/settings.js')
  const { registerPreviewRoutes } = await import('./routes/preview/index.js')
  const { registerAuthRoutes } = await import('./routes/auth/index.js')

  await registerPublicPagesRoutes(app)
  await registerPublicPostsRoutes(app)
  await registerPublicGlobalRoutes(app)
  await registerAdminPagesRoutes(app)
  await registerAdminPostsRoutes(app)
  await registerAdminGlobalRoutes(app)
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
