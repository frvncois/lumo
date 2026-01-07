/**
 * Permissions Middleware
 *
 * Role-based access control.
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from './auth.js'
import { errors } from '../utils/errors.js'
import { UserRoles } from '../constants.js'

/**
 * Require owner role
 */
export async function requireOwner(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = (request as AuthenticatedRequest).user

  if (!user) {
    errors.unauthorized(reply)
    return
  }

  if (user.role !== UserRoles.OWNER) {
    errors.forbidden(reply, 'Owner role required')
    return
  }
}

/**
 * Require editor role or higher (editor or owner)
 */
export async function requireEditor(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = (request as AuthenticatedRequest).user

  if (!user) {
    errors.unauthorized(reply)
    return
  }

  if (user.role !== UserRoles.OWNER && user.role !== UserRoles.EDITOR) {
    errors.forbidden(reply, 'Editor or owner role required')
    return
  }
}
