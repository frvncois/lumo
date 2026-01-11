/**
 * Admin Collaborators API
 *
 * GET /api/admin/collaborators - List all collaborators
 * POST /api/admin/collaborators - Add collaborator (owner only)
 * PUT /api/admin/collaborators/:userId/role - Update collaborator role (owner only)
 * DELETE /api/admin/collaborators/:userId - Remove collaborator (owner only)
 */

import type { FastifyInstance } from 'fastify'
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js'
import { requireOwner } from '../../middleware/permissions.js'
import {
  listCollaborators,
  getUserByEmail,
  createUser,
  createCollaborator,
  updateCollaboratorRole,
  deleteCollaborator,
  countOwners,
  getCollaboratorByUserId,
} from '@lumo/db'
import { generateId } from '../../utils/tokens.js'
import { errors } from '../../utils/errors.js'
import { logAuditEvent } from '../../utils/audit.js'
import type { UserRole } from '@lumo/core'
import {
  adminListCollaboratorsSchema,
  adminCreateCollaboratorSchema,
  adminUpdateCollaboratorRoleSchema,
  adminDeleteCollaboratorSchema,
} from '../../schemas/index.js'

export async function registerAdminCollaboratorsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/admin/collaborators
   * List all collaborators (authenticated users only)
   */
  app.get('/api/admin/collaborators', { preHandler: requireAuth, schema: adminListCollaboratorsSchema }, async (request, reply) => {
    const collaborators = listCollaborators(app.db)

    return {
      items: collaborators.map((c) => ({
        userId: c.userId,
        email: c.email,
        role: c.role,
        createdAt: c.createdAt,
      })),
    }
  })

  /**
   * POST /api/admin/collaborators
   * Add new collaborator (owner only)
   */
  app.post<{
    Body: { email: string; role: UserRole }
  }>('/api/admin/collaborators', { preHandler: [requireAuth, requireOwner], schema: adminCreateCollaboratorSchema }, async (request, reply) => {
    const { email, role } = request.body

    // Validate inputs
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return errors.validation(reply, 'Email is required')
    }

    if (!role || (role !== 'owner' && role !== 'editor')) {
      return errors.validation(reply, 'Role must be "owner" or "editor"')
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    let user = getUserByEmail(app.db, normalizedEmail)
    let isNew = false

    if (!user) {
      // Create new user without password (they'll need to set one or use email link)
      const userId = generateId('user')
      user = createUser(app.db, userId, normalizedEmail)
      isNew = true
    }

    // Check if user is already a collaborator
    const existing = getCollaboratorByUserId(app.db, user.id)
    if (existing) {
      return errors.validation(reply, `User "${normalizedEmail}" is already a collaborator with role "${existing.role}"`)
    }

    // Create collaborator
    const collaboratorId = generateId('collaborator')
    const collaborator = createCollaborator(app.db, collaboratorId, user.id, role)

    const { user: currentUser } = request as AuthenticatedRequest
    logAuditEvent(app, {
      event: 'USER_CREATED',
      userId: currentUser.id,
      targetUserId: user.id,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      details: { email: normalizedEmail, role, isNew },
    })

    return reply.code(201).send({
      userId: user.id,
      email: user.email,
      role: collaborator.role,
      createdAt: collaborator.createdAt,
      isNew,
    })
  })

  /**
   * PUT /api/admin/collaborators/:userId/role
   * Update collaborator role (owner only)
   */
  app.put<{
    Params: { userId: string }
    Body: { role: UserRole }
  }>('/api/admin/collaborators/:userId/role', { preHandler: [requireAuth, requireOwner], schema: adminUpdateCollaboratorRoleSchema }, async (request, reply) => {
    const { userId } = request.params
    const { role } = request.body
    const { user: currentUser } = request as AuthenticatedRequest

    // Validate role
    if (!role || (role !== 'owner' && role !== 'editor')) {
      return errors.validation(reply, 'Role must be "owner" or "editor"')
    }

    // Check if collaborator exists
    const collaborator = getCollaboratorByUserId(app.db, userId)
    if (!collaborator) {
      return errors.notFound(reply, 'Collaborator')
    }

    // Prevent demoting the last owner
    if (collaborator.role === 'owner' && role === 'editor') {
      const ownerCount = countOwners(app.db)
      if (ownerCount <= 1) {
        return errors.validation(reply, 'Cannot demote the last owner. Add another owner first.')
      }
    }

    // Prevent self-demotion
    if (userId === currentUser.id && collaborator.role === 'owner' && role === 'editor') {
      return errors.validation(reply, 'Cannot demote yourself. Ask another owner to change your role.')
    }

    // Update role
    updateCollaboratorRole(app.db, userId, role)

    logAuditEvent(app, {
      event: 'ROLE_CHANGE',
      userId: currentUser.id,
      targetUserId: userId,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      details: { oldRole: collaborator.role, newRole: role },
    })

    return {
      userId,
      role,
      updatedAt: new Date().toISOString(),
    }
  })

  /**
   * DELETE /api/admin/collaborators/:userId
   * Remove collaborator (owner only)
   */
  app.delete<{
    Params: { userId: string }
  }>('/api/admin/collaborators/:userId', { preHandler: [requireAuth, requireOwner], schema: adminDeleteCollaboratorSchema }, async (request, reply) => {
    const { userId } = request.params
    const { user: currentUser } = request as AuthenticatedRequest

    // Check if collaborator exists
    const collaborator = getCollaboratorByUserId(app.db, userId)
    if (!collaborator) {
      return errors.notFound(reply, 'Collaborator')
    }

    // Prevent removing the last owner
    if (collaborator.role === 'owner') {
      const ownerCount = countOwners(app.db)
      if (ownerCount <= 1) {
        return errors.validation(reply, 'Cannot remove the last owner')
      }
    }

    // Prevent self-removal
    if (userId === currentUser.id) {
      return errors.validation(reply, 'Cannot remove yourself. Ask another owner to remove you.')
    }

    // Remove collaborator
    deleteCollaborator(app.db, userId)

    logAuditEvent(app, {
      event: 'USER_DELETED',
      userId: currentUser.id,
      targetUserId: userId,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      details: { role: collaborator.role },
    })

    return { success: true }
  })
}
