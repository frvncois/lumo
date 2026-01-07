/**
 * Media Validation
 *
 * Validates MediaReference objects used in image and gallery fields.
 */

import type { MediaReference, ValidationResult, ValidationErrorDetail } from '../types.js'
import { ErrorCodes } from '../errors.js'

/**
 * Validate single MediaReference
 */
export function validateMediaReference(
  ref: unknown,
  fieldPath: string = 'mediaReference'
): ValidationResult<MediaReference> {
  const errors: ValidationErrorDetail[] = []

  // Must be an object
  if (typeof ref !== 'object' || ref === null || Array.isArray(ref)) {
    errors.push({
      path: fieldPath,
      reason: ErrorCodes.INVALID_MEDIA_REFERENCE,
      message: 'MediaReference must be an object',
    })
    return { success: false, errors }
  }

  const mediaRef = ref as Record<string, unknown>

  // Validate mediaId
  if (!mediaRef.mediaId || typeof mediaRef.mediaId !== 'string') {
    errors.push({
      path: `${fieldPath}.mediaId`,
      reason: ErrorCodes.INVALID_MEDIA_REFERENCE,
      message: 'mediaId is required and must be a non-empty string',
    })
  } else if (mediaRef.mediaId.trim().length === 0) {
    errors.push({
      path: `${fieldPath}.mediaId`,
      reason: ErrorCodes.INVALID_MEDIA_REFERENCE,
      message: 'mediaId cannot be empty',
    })
  }

  // Validate alt (optional)
  if (mediaRef.alt !== undefined && mediaRef.alt !== null) {
    if (typeof mediaRef.alt !== 'string') {
      errors.push({
        path: `${fieldPath}.alt`,
        reason: ErrorCodes.INVALID_MEDIA_REFERENCE,
        message: 'alt must be a string when provided',
      })
    }
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return {
    success: true,
    data: {
      mediaId: mediaRef.mediaId as string,
      alt: mediaRef.alt as string | undefined,
    },
  }
}

/**
 * Validate array of MediaReference (for gallery fields)
 */
export function validateMediaReferenceArray(
  refs: unknown,
  fieldPath: string = 'gallery'
): ValidationResult<MediaReference[]> {
  const errors: ValidationErrorDetail[] = []

  // Must be an array
  if (!Array.isArray(refs)) {
    errors.push({
      path: fieldPath,
      reason: ErrorCodes.INVALID_FIELD_TYPE,
      message: 'Gallery must be an array',
    })
    return { success: false, errors }
  }

  const validatedRefs: MediaReference[] = []

  // Validate each item
  for (let i = 0; i < refs.length; i++) {
    const result = validateMediaReference(refs[i], `${fieldPath}[${i}]`)
    if (!result.success) {
      errors.push(...result.errors)
    } else {
      validatedRefs.push(result.data)
    }
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return { success: true, data: validatedRefs }
}
