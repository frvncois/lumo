/**
 * LUMO Core Errors (V1)
 *
 * Domain error types for validation and invariant enforcement.
 */

import type { ValidationErrorDetail } from './types.js'

/**
 * Error Codes
 * Includes both validation and API error codes
 */
export const ErrorCodes = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SCHEMA_INVALID: 'SCHEMA_INVALID',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  INVALID_FIELD_TYPE: 'INVALID_FIELD_TYPE',
  INVALID_FIELD_KEY: 'INVALID_FIELD_KEY',
  RESERVED_KEY: 'RESERVED_KEY',
  DUPLICATE_FIELD_KEY: 'DUPLICATE_FIELD_KEY',
  UNKNOWN_FIELD_TYPE: 'UNKNOWN_FIELD_TYPE',
  INVALID_MEDIA_REFERENCE: 'INVALID_MEDIA_REFERENCE',
  INVALID_URL: 'INVALID_URL',
  INVALID_RICHTEXT: 'INVALID_RICHTEXT',
  DEFAULT_LANGUAGE_MISSING: 'DEFAULT_LANGUAGE_MISSING',
  INVALID_POST_TYPE: 'INVALID_POST_TYPE',
  PUBLISHED_WITHOUT_DATE: 'PUBLISHED_WITHOUT_DATE',
  TOO_MANY_FIELDS: 'TOO_MANY_FIELDS',

  // API errors
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SCHEMA_NOT_FOUND: 'SCHEMA_NOT_FOUND',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

/**
 * Validation Error
 */
export class ValidationError extends Error {
  public readonly code: ErrorCode
  public readonly details: ValidationErrorDetail[]

  constructor(code: ErrorCode, message: string, details: ValidationErrorDetail[] = []) {
    super(message)
    this.name = 'ValidationError'
    this.code = code
    this.details = details
  }
}

/**
 * Schema Validation Error
 */
export class SchemaValidationError extends Error {
  public readonly details: ValidationErrorDetail[]

  constructor(message: string, details: ValidationErrorDetail[] = []) {
    super(message)
    this.name = 'SchemaValidationError'
    this.details = details
  }
}
