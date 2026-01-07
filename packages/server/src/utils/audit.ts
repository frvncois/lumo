/**
 * Audit Logging
 *
 * Logs security-relevant events for monitoring and compliance.
 */

import type { FastifyInstance } from 'fastify'

export type AuditEvent =
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILURE'
  | 'AUTH_LOGOUT'
  | 'AUTH_SETUP'
  | 'PASSWORD_CHANGE'
  | 'ROLE_CHANGE'
  | 'USER_CREATED'
  | 'USER_DELETED'
  | 'MEDIA_DELETED'
  | 'SCHEMA_MODIFIED'

export interface AuditLogEntry {
  event: AuditEvent
  userId?: string
  targetUserId?: string
  ip: string
  userAgent?: string
  details?: Record<string, unknown>
  timestamp: string
}

export function logAuditEvent(
  app: FastifyInstance,
  entry: Omit<AuditLogEntry, 'timestamp'>
): void {
  const logEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  }

  app.log.info({ audit: logEntry }, `AUDIT: ${entry.event}`)
}
