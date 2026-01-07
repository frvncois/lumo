/**
 * Error Response Utilities
 */

import type { FastifyReply } from 'fastify'
import { ErrorCodes } from '@lumo/core'
import type { ValidationErrorDetail } from '@lumo/core'

export type ApiErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]

export interface ApiError {
  code: ApiErrorCode
  message: string
  details?: ValidationErrorDetail[]
}

/**
 * Send standardized error response
 */
export function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: ApiErrorCode,
  message: string,
  details?: ValidationErrorDetail[]
): void {
  const error: ApiError = { code, message }
  if (details && details.length > 0) {
    error.details = details
  }
  reply.code(statusCode).send({ error })
}

/**
 * Common error responses
 */
export const errors = {
  notFound: (reply: FastifyReply, resource: string) =>
    sendError(reply, 404, ErrorCodes.NOT_FOUND, `${resource} not found`),

  unauthorized: (reply: FastifyReply, message = 'Authentication required') =>
    sendError(reply, 401, ErrorCodes.UNAUTHORIZED, message),

  forbidden: (reply: FastifyReply, message = 'Access denied') =>
    sendError(reply, 403, ErrorCodes.FORBIDDEN, message),

  validation: (reply: FastifyReply, message: string, details?: ValidationErrorDetail[]) =>
    sendError(reply, 400, ErrorCodes.VALIDATION_ERROR, message, details),

  conflict: (reply: FastifyReply, message: string) =>
    sendError(reply, 409, ErrorCodes.CONFLICT, message),

  internal: (reply: FastifyReply, message = 'Internal server error') =>
    sendError(reply, 500, ErrorCodes.INTERNAL_ERROR, message),

  invalidCredentials: (reply: FastifyReply) =>
    sendError(reply, 401, ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password'),
}
