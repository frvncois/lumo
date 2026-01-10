/**
 * Standardized Error Responses
 *
 * All API responses MUST follow these formats:
 *
 * Success: { success: true, data?: T }
 * Error: { error: { code: string, message: string, details?: ValidationErrorDetail[] } }
 */

import type { FastifyReply } from 'fastify'
import { ErrorCodes } from '@lumo/core'
import type { ValidationErrorDetail } from '@lumo/core'

export type ApiErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]

interface ApiError {
  error: {
    code: string
    message: string
    details?: ValidationErrorDetail[]
  }
}

interface ApiSuccess<T = undefined> {
  success: true
  data?: T
}

/**
 * Send a standardized success response
 */
export function success<T>(reply: FastifyReply, data?: T): ApiSuccess<T> {
  return data !== undefined ? { success: true, data } : { success: true } as ApiSuccess<T>
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
): ApiError {
  reply.code(statusCode)
  return {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  }
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
