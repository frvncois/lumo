/**
 * CSRF Protection
 *
 * Uses double-submit cookie pattern for stateless CSRF protection.
 */

import { createHmac, randomBytes } from 'node:crypto'
import type { FastifyRequest, FastifyReply } from 'fastify'

const CSRF_COOKIE_NAME = 'csrf'
const CSRF_HEADER_NAME = 'x-csrf-token'

function getSecret(): string {
  return process.env.COOKIE_SECRET || 'dev-secret-do-not-use-in-production'
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

  return signature === expectedSignature
}

/**
 * CSRF middleware - sets cookie and validates on mutations
 */
export async function csrfProtection(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']

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

  if (cookieToken !== headerToken || !verifyCsrfToken(cookieToken)) {
    reply.code(403).send({
      error: {
        code: 'CSRF_INVALID',
        message: 'CSRF token invalid',
      },
    })
    return
  }
}
