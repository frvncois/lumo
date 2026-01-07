/**
 * Auth Middleware
 *
 * Validates session cookies and attaches user info to request.
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifySessionToken } from '../utils/tokens.js'
import { getUserWithRole } from '@lumo/db'
import type { UserRole } from '@lumo/core'

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string
    email: string
    role: UserRole
  }
}

/**
 * Require authentication (session must be valid)
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = request.cookies.session

  if (!token) {
    reply.code(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    })
    return
  }

  const payload = verifySessionToken(token)
  if (!payload) {
    reply.code(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired session',
      },
    })
    return
  }

  // Get user from database
  const user = getUserWithRole(request.server.db, payload.userId)
  if (!user || !user.role) {
    reply.code(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: 'User not found or not a collaborator',
      },
    })
    return
  }

  // Attach user to request
  ;(request as AuthenticatedRequest).user = {
    id: user.id,
    email: user.email,
    role: user.role,
  }
}

/**
 * Optional auth (doesn't fail if not authenticated)
 */
export async function optionalAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = request.cookies.session

  if (!token) {
    return
  }

  const payload = verifySessionToken(token)
  if (!payload) {
    return
  }

  const user = getUserWithRole(request.server.db, payload.userId)
  if (!user || !user.role) {
    return
  }

  ;(request as AuthenticatedRequest).user = {
    id: user.id,
    email: user.email,
    role: user.role,
  }
}
