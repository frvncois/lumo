/**
 * Permissions Middleware
 *
 * Role-based access control.
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from './auth.js'

/**
 * Require owner role
 */
export async function requireOwner(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = (request as AuthenticatedRequest).user

  if (!user) {
    reply.code(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    })
    return
  }

  if (user.role !== 'owner') {
    reply.code(403).send({
      error: {
        code: 'FORBIDDEN',
        message: 'Owner role required',
      },
    })
    return
  }
}

/**
 * Require editor role or higher (editor or owner)
 */
export async function requireEditor(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = (request as AuthenticatedRequest).user

  if (!user) {
    reply.code(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    })
    return
  }

  if (user.role !== 'owner' && user.role !== 'editor') {
    reply.code(403).send({
      error: {
        code: 'FORBIDDEN',
        message: 'Editor or owner role required',
      },
    })
    return
  }
}
