/**
 * Auth Routes
 *
 * GET /api/auth/status - Check auth status
 * POST /api/auth/setup - Initial setup (first user)
 * POST /api/auth/login - Login with password
 * GET /api/me - Get current user
 * POST /api/logout - Logout
 */

import type { FastifyInstance } from 'fastify'
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js'
import { createSessionToken } from '../../utils/tokens.js'
import {
  hasAnyUsers,
  getUserByEmail,
  createUser,
  createCollaborator,
  getCollaboratorByUserId,
  getPasswordChangedAt,
  getSetting,
  setSetting,
  updatePassword,
} from '@lumo/db'
import { generateId } from '../../utils/tokens.js'
import { hashPassword, verifyPassword, validatePassword } from '../../utils/password.js'
import { errors } from '../../utils/errors.js'
import { SessionConfig, UserRoles } from '../../constants.js'
import { authSetupSchema, authLoginSchema } from '../../schemas/index.js'
import { logAuditEvent } from '../../utils/audit.js'
import crypto from 'node:crypto'

// Helper functions
function generateProjectId(): string {
  const id = crypto.randomBytes(8).toString('hex')
  return `proj_${id}`
}

function generateProjectKey(): string {
  const key = crypto.randomBytes(16).toString('hex')
  return key
}

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  // Stricter rate limit for auth endpoints
  const authRateLimit = {
    max: 5,
    timeWindow: '15 minutes',
    keyGenerator: (request: any) => {
      return request.ip
    },
    errorResponseBuilder: (_request: any, context: any) => ({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many login attempts. Retry in ${Math.ceil(context.ttl / 1000)} seconds.`,
      },
    }),
  }

  /**
   * GET /api/config
   * Get LUMO configuration (languages, pages, postTypes, globals)
   */
  app.get('/api/config', async () => {
    const projectName = getSetting(app.db, 'projectName')

    return {
      projectName: projectName || null,
      languages: app.config.languages,
      defaultLanguage: app.config.defaultLanguage,
      pages: app.config.pages,
      postTypes: app.config.postTypes,
      globals: app.config.globals,
    }
  })

  /**
   * GET /api/auth/status
   * Check authentication status and capabilities
   */
  app.get('/api/auth/status', async () => {
    const needsSetup = !hasAnyUsers(app.db)

    return {
      needsSetup,
    }
  })

  /**
   * POST /api/auth/setup
   * Initial setup - create first user with owner role
   */
  app.post<{
    Body: { projectName: string; email: string; password: string }
  }>('/api/auth/setup', { ...authRateLimit, schema: authSetupSchema }, async (request, reply) => {
    const { projectName, email, password } = request.body

    // Check if setup is needed
    if (hasAnyUsers(app.db)) {
      return errors.forbidden(reply, 'Setup already completed')
    }

    // Validate project name
    if (!projectName || typeof projectName !== 'string' || projectName.trim().length === 0) {
      return errors.validation(reply, 'Project name is required')
    }

    // Validate email
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return errors.validation(reply, 'Email is required')
    }

    // Normalize email: lowercase and trim whitespace
    const normalizedEmail = email.toLowerCase().trim()

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return errors.validation(reply, passwordValidation.error || 'Invalid password')
    }

    // Generate Project ID and Project Key
    const projectId = generateProjectId()
    const projectKey = generateProjectKey()

    // Save project settings
    setSetting(app.db, 'projectName', projectName.trim())
    setSetting(app.db, 'projectId', projectId)
    setSetting(app.db, 'projectKey', projectKey)

    // Create user with password
    const userId = generateId('user')
    const passwordHash = await hashPassword(password)
    const user = createUser(app.db, userId, normalizedEmail, passwordHash)

    // Create owner collaborator
    const collaboratorId = generateId('collaborator')
    const collaborator = createCollaborator(app.db, collaboratorId, userId, UserRoles.OWNER)

    // Create session token
    const sessionToken = createSessionToken(user.id, collaborator.role, undefined)

    // Set cookie
    reply.setCookie('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SessionConfig.MAX_AGE_SECONDS,
    })

    logAuditEvent(app, {
      event: 'AUTH_SETUP',
      userId: user.id,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        role: collaborator.role,
      },
      project: {
        id: projectId,
        key: projectKey,
        name: projectName.trim(),
      },
    }
  })

  /**
   * POST /api/auth/login
   * Login with email and password
   */
  app.post<{
    Body: { email: string; password: string }
  }>('/api/auth/login', { ...authRateLimit, schema: authLoginSchema }, async (request, reply) => {
    const { email, password } = request.body

    // Validate inputs
    if (!email || typeof email !== 'string' || email.trim().length === 0 || !password || typeof password !== 'string') {
      logAuditEvent(app, {
        event: 'AUTH_LOGIN_FAILURE',
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        details: { email },
      })
      return errors.invalidCredentials(reply)
    }

    // Normalize email: lowercase and trim whitespace
    const normalizedEmail = email.toLowerCase().trim()

    // Get user by email
    const user = getUserByEmail(app.db, normalizedEmail)
    if (!user || !user.passwordHash) {
      // Don't reveal if user exists
      logAuditEvent(app, {
        event: 'AUTH_LOGIN_FAILURE',
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        details: { email: normalizedEmail },
      })
      return errors.invalidCredentials(reply)
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      logAuditEvent(app, {
        event: 'AUTH_LOGIN_FAILURE',
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        details: { email: normalizedEmail },
      })
      return errors.invalidCredentials(reply)
    }

    // Check if user is a collaborator
    const collaborator = getCollaboratorByUserId(app.db, user.id)
    if (!collaborator) {
      return errors.forbidden(reply, 'User is not authorized')
    }

    // Create session token
    const passwordChangedAt = getPasswordChangedAt(app.db, user.id)
    const sessionToken = createSessionToken(user.id, collaborator.role, passwordChangedAt ?? undefined)

    // Set cookie
    reply.setCookie('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SessionConfig.MAX_AGE_SECONDS,
    })

    logAuditEvent(app, {
      event: 'AUTH_LOGIN_SUCCESS',
      userId: user.id,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
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
   * PUT /api/me/password
   * Change current user's password
   * Rate limited to prevent brute-force attacks on currentPassword
   */
  app.put<{
    Body: {
      currentPassword: string
      newPassword: string
    }
  }>('/api/me/password', {
    ...authRateLimit,
    preHandler: requireAuth
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest
    const { currentPassword, newPassword } = request.body

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return errors.validation(reply, 'Current password and new password are required')
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      return errors.validation(reply, passwordValidation.error || 'Invalid password')
    }

    // Get user with password hash
    const dbUser = getUserByEmail(app.db, user.email)
    if (!dbUser || !dbUser.passwordHash) {
      return errors.unauthorized(reply, 'Invalid credentials')
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, dbUser.passwordHash)
    if (!isValid) {
      return errors.unauthorized(reply, 'Current password is incorrect')
    }

    // Hash new password and update
    const newPasswordHash = await hashPassword(newPassword)
    updatePassword(app.db, user.id, newPasswordHash)

    logAuditEvent(app, {
      event: 'PASSWORD_CHANGE',
      userId: user.id,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    })

    return { success: true }
  })

  /**
   * POST /api/logout
   * Logout and clear session
   */
  app.post('/api/logout', async (request, reply) => {
    reply.clearCookie('session', { path: '/' })

    logAuditEvent(app, {
      event: 'AUTH_LOGOUT',
      userId: request.cookies.session ? 'unknown' : undefined,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    })

    return { success: true }
  })
}
