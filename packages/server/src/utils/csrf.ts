/**
 * CSRF Protection
 *
 * Uses double-submit cookie pattern for stateless CSRF protection.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { FastifyRequest, FastifyReply } from 'fastify'

const CSRF_COOKIE_NAME = 'csrf'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Get the secret for CSRF token signing.
 * Uses the same security rules as the main token signing secret.
 */
function getSecret(): string {
  const secret = process.env.COOKIE_SECRET
  const nodeEnv = process.env.NODE_ENV

  // Explicit development mode: allow insecure default
  if (nodeEnv === 'development') {
    if (!secret) {
      // Warning already logged by tokens.ts, no need to duplicate
      return 'dev-secret-do-not-use-in-production'
    }
    return secret
  }

  // All other environments: secret is required
  // tokens.ts will throw if missing, but we check here too for safety
  if (!secret || secret.length < 32) {
    throw new Error('COOKIE_SECRET environment variable is required and must be at least 32 characters')
  }

  return secret
}

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  const token = randomBytes(32).toString('base64url')
  const signature = createHmac('sha256', getSecret()).update(token).digest('base64url')
  return `${token}.${signature}`
}

/**
 * Verify CSRF token
 */
export function verifyCsrfToken(token: string): boolean {
  const parts = token.split('.')
  if (parts.length !== 2) return false

  const [data, signature] = parts
  const expectedSignature = createHmac('sha256', getSecret()).update(data).digest('base64url')

  // Convert to buffers for timing-safe comparison
  // Use 'utf8' encoding since base64url produces UTF-8 safe characters
  const signatureBuffer = Buffer.from(signature, 'utf8')
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8')

  // Length check (constant time)
  if (signatureBuffer.length !== expectedBuffer.length) {
    return false
  }

  // Timing-safe comparison
  return timingSafeEqual(signatureBuffer, expectedBuffer)
}

/**
 * Paths that are exempt from CSRF validation
 * These are pre-authentication endpoints where no session exists yet
 */
const CSRF_EXEMPT_PATHS = [
  '/api/auth/setup',    // Initial project setup
  '/api/auth/status',   // Auth status check (pre-setup)
  '/api/auth/login',    // User login (CSRF cookie is set but not yet validated)
  '/api/config',        // Public config endpoint
  '/health',            // Health check endpoint
]

/**
 * CSRF middleware - sets cookie and validates on mutations
 */
export async function csrfProtection(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']

  // Check if path is exempt from CSRF validation
  const isExempt = CSRF_EXEMPT_PATHS.some(path => request.url.startsWith(path))
  if (isExempt) {
    // Still set CSRF cookie on GET requests for exempt paths
    if (safeMethods.includes(request.method) && !request.cookies[CSRF_COOKIE_NAME]) {
      const token = generateCsrfToken()
      reply.setCookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
    }
    return
  }

  if (safeMethods.includes(request.method)) {
    if (!request.cookies[CSRF_COOKIE_NAME]) {
      const token = generateCsrfToken()
      reply.setCookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
    }
    return
  }

  const cookieToken = request.cookies[CSRF_COOKIE_NAME]
  const headerToken = request.headers[CSRF_HEADER_NAME] as string

  if (!cookieToken || !headerToken) {
    reply.code(403).send({
      error: {
        code: 'CSRF_MISSING',
        message: 'CSRF token missing',
      },
    })
    return
  }

  // Use timing-safe comparison for cookie vs header token
  const cookieBuffer = Buffer.from(cookieToken, 'utf8')
  const headerBuffer = Buffer.from(headerToken, 'utf8')
  const tokensMatch = cookieBuffer.length === headerBuffer.length &&
                      timingSafeEqual(cookieBuffer, headerBuffer)

  if (!tokensMatch || !verifyCsrfToken(cookieToken)) {
    reply.code(403).send({
      error: {
        code: 'CSRF_INVALID',
        message: 'CSRF token invalid',
      },
    })
    return
  }
}
