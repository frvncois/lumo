/**
 * Auth Routes
 *
 * GET /api/auth/status - Check auth status
 * POST /api/auth/setup - Initial setup (first user)
 * POST /api/auth/login - Login with password
 * POST /api/auth/magic-link - Request magic link
 * GET /api/auth/verify - Verify magic link and create session
 * GET /api/me - Get current user
 * POST /api/logout - Logout
 */

import type { FastifyInstance } from 'fastify'
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js'
import { createMagicLinkToken, verifyMagicLinkToken, createSessionToken } from '../../utils/tokens.js'
import {
  hasAnyUsers,
  getUserByEmail,
  createUser,
  createCollaborator,
  getOrCreateUser,
  getCollaboratorByUserId,
  isUserCollaborator,
} from '@lumo/db'
import { generateId } from '../../utils/tokens.js'
import { createEmailService } from '../../services/email.js'
import { hashPassword, verifyPassword, validatePassword } from '../../utils/password.js'

// Create email service instance
const emailService = createEmailService()

/**
 * Check if email is configured
 */
function isEmailConfigured(): boolean {
  const provider = process.env.LUMO_EMAIL_PROVIDER || 'console'
  return provider !== 'console'
}

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/config
   * Get LUMO configuration (languages, pages, postTypes)
   */
  app.get('/api/config', async () => {
    return {
      languages: app.config.languages,
      defaultLanguage: app.config.defaultLanguage,
      pages: app.config.pages,
      postTypes: app.config.postTypes,
    }
  })

  /**
   * GET /api/auth/status
   * Check authentication status and capabilities
   */
  app.get('/api/auth/status', async () => {
    const needsSetup = !hasAnyUsers(app.db)
    const emailEnabled = isEmailConfigured()

    return {
      needsSetup,
      emailEnabled,
    }
  })

  /**
   * POST /api/auth/setup
   * Initial setup - create first user with owner role
   */
  app.post<{
    Body: { email: string; password: string }
  }>('/api/auth/setup', async (request, reply) => {
    const { email, password } = request.body

    // Check if setup is needed
    if (hasAnyUsers(app.db)) {
      return reply.code(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'Setup already completed',
        },
      })
    }

    // Validate inputs
    if (!email || typeof email !== 'string') {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required',
        },
      })
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: passwordValidation.error,
        },
      })
    }

    // Create user with password
    const userId = generateId('user')
    const passwordHash = await hashPassword(password)
    const user = createUser(app.db, userId, email, passwordHash)

    // Create owner collaborator
    const collaboratorId = generateId('collaborator')
    const collaborator = createCollaborator(app.db, collaboratorId, userId, 'owner')

    // Create session token
    const sessionToken = createSessionToken(user.id, collaborator.role)

    // Set cookie
    reply.setCookie('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        role: collaborator.role,
      },
    }
  })

  /**
   * POST /api/auth/login
   * Login with email and password
   */
  app.post<{
    Body: { email: string; password: string }
  }>('/api/auth/login', async (request, reply) => {
    const { email, password } = request.body

    // Validate inputs
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return reply.code(401).send({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      })
    }

    // Get user by email
    const user = getUserByEmail(app.db, email)
    if (!user || !user.passwordHash) {
      // Don't reveal if user exists
      return reply.code(401).send({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      })
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return reply.code(401).send({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      })
    }

    // Check if user is a collaborator
    const collaborator = getCollaboratorByUserId(app.db, user.id)
    if (!collaborator) {
      return reply.code(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'User is not authorized',
        },
      })
    }

    // Create session token
    const sessionToken = createSessionToken(user.id, collaborator.role)

    // Set cookie
    reply.setCookie('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        role: collaborator.role,
      },
    }
  })

  /**
   * POST /api/auth/magic-link
   * Request magic link email
   */
  app.post<{
    Body: { email: string }
  }>('/api/auth/magic-link', async (request, reply) => {
    const { email } = request.body

    // Check if email is configured
    if (!isEmailConfigured()) {
      return reply.code(400).send({
        error: {
          code: 'EMAIL_NOT_CONFIGURED',
          message: 'Email service is not configured. Please use password login or configure an email provider.',
        },
      })
    }

    if (!email || typeof email !== 'string') {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required',
        },
      })
    }

    // Check if user is a collaborator
    const user = getOrCreateUser(app.db, email, generateId('user'))
    if (!isUserCollaborator(app.db, user.id)) {
      // User exists but is not a collaborator
      return reply.code(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'User is not authorized',
        },
      })
    }

    // Create magic link token
    const token = createMagicLinkToken(email)
    const magicLink = `${process.env.BASE_URL || 'http://localhost:3000'}/api/auth/verify?token=${token}`

    // Get site name from environment or use default
    const siteName = process.env.LUMO_SITE_NAME || 'Lumo CMS'

    // Send email with magic link
    try {
      await emailService.sendMagicLink(email, magicLink, siteName)
    } catch (error) {
      app.log.error(error, 'Failed to send magic link email')
      return reply.code(500).send({
        error: {
          code: 'EMAIL_ERROR',
          message: 'Failed to send magic link email',
        },
      })
    }

    return {
      message: 'Magic link sent to email',
      // For development, return the link
      ...(process.env.NODE_ENV === 'development' && { magicLink }),
    }
  })

  /**
   * GET /api/auth/verify
   * Verify magic link and create session
   */
  app.get<{
    Querystring: { token: string }
  }>('/api/auth/verify', async (request, reply) => {
    const { token } = request.query

    if (!token) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Token is required',
        },
      })
    }

    const payload = verifyMagicLinkToken(token)
    if (!payload) {
      return reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired magic link',
        },
      })
    }

    // Get user
    const user = getOrCreateUser(app.db, payload.email, generateId('user'))
    const collaborator = getCollaboratorByUserId(app.db, user.id)

    if (!collaborator) {
      return reply.code(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'User is not a collaborator',
        },
      })
    }

    // Create session token
    const sessionToken = createSessionToken(user.id, collaborator.role)

    // Set cookie
    reply.setCookie('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    // Redirect to admin or return success
    if (request.headers.accept?.includes('text/html')) {
      return reply.redirect('/admin')
    }

    return {
      message: 'Authentication successful',
      user: {
        id: user.id,
        email: user.email,
        role: collaborator.role,
      },
    }
  })

  /**
   * GET /api/me
   * Get current authenticated user
   */
  app.get('/api/me', { preHandler: requireAuth }, async (request) => {
    const { user } = request as AuthenticatedRequest

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    }
  })

  /**
   * POST /api/logout
   * Logout and clear session
   */
  app.post('/api/logout', async (request, reply) => {
    reply.clearCookie('session', { path: '/' })

    return { ok: true }
  })
}
