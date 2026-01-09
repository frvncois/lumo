/**
 * Content Validation
 *
 * Validates content against schema definitions.
 * Core enforces all invariants - never auto-fixes.
 */

import type {
  Fields,
  FieldDefinition,
  FieldValue,
  ValidationErrorDetail,
  ValidationResult,
} from '../types.js'
import { ErrorCodes } from '../errors.js'
import { MAX_REPEATER_ITEMS } from '../schema/constants.js'
import { validateMediaReference as validateMediaRef, validateMediaReferenceArray } from './media.js'

/**
 * Validate fields against schema
 */
export function validateFields(
  fields: Fields,
  schema: FieldDefinition[]
): ValidationResult<Fields> {
  const errors: ValidationErrorDetail[] = []

  // Treat undefined/null fields as empty object
  const safeFields = fields || {}

  // Check required fields
  for (const fieldDef of schema) {
    if (fieldDef.required) {
      const value = safeFields[fieldDef.key]
      if (value === null || value === undefined || value === '') {
        errors.push({
          path: `fields.${fieldDef.key}`,
          reason: ErrorCodes.REQUIRED_FIELD_MISSING,
          message: `Required field "${fieldDef.key}" is missing`,
        })
      }
    }
  }

  // Validate field types
  for (const [key, value] of Object.entries(safeFields)) {
    const fieldDef = schema.find((f) => f.key === key)

    // Unknown fields are ignored (not rejected)
    if (!fieldDef) {
      continue
    }

    // Skip null/undefined for optional fields
    if (!fieldDef.required && (value === null || value === undefined)) {
      continue
    }

    const typeErrors = validateFieldType(key, value, fieldDef)
    errors.push(...typeErrors)
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return { success: true, data: safeFields }
}

/**
 * Validate field value type
 */
function validateFieldType(
  key: string,
  value: FieldValue,
  fieldDef: FieldDefinition
): ValidationErrorDetail[] {
  const errors: ValidationErrorDetail[] = []
  const path = `fields.${key}`
  const type = fieldDef.type

  switch (type) {
    case 'text':
    case 'textarea':
      if (typeof value !== 'string') {
        errors.push({
          path,
          reason: ErrorCodes.INVALID_FIELD_TYPE,
          message: `Field "${key}" must be a string`,
        })
      }
      break

    case 'richtext':
      if (typeof value !== 'string') {
        errors.push({
          path,
          reason: ErrorCodes.INVALID_FIELD_TYPE,
          message: `Field "${key}" must be a JSON string`,
        })
      } else {
        // Validate JSON structure
        try {
          JSON.parse(value)
        } catch {
          errors.push({
            path,
            reason: ErrorCodes.INVALID_RICHTEXT,
            message: `Field "${key}" must be valid JSON`,
          })
        }
      }
      break

    case 'url':
      if (typeof value !== 'string') {
        errors.push({
          path,
          reason: ErrorCodes.INVALID_FIELD_TYPE,
          message: `Field "${key}" must be a string`,
        })
      } else {
        const urlErrors = validateUrl(key, value)
        errors.push(...urlErrors)
      }
      break

    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push({
          path,
          reason: ErrorCodes.INVALID_FIELD_TYPE,
          message: `Field "${key}" must be a boolean`,
        })
      }
      break

    case 'date':
    case 'time':
      if (typeof value !== 'string') {
        errors.push({
          path,
          reason: ErrorCodes.INVALID_FIELD_TYPE,
          message: `Field "${key}" must be a string`,
        })
      }
      break

    case 'select':
      if (typeof value !== 'string') {
        errors.push({
          path,
          reason: ErrorCodes.INVALID_FIELD_TYPE,
          message: `Field "${key}" must be a string`,
        })
      }
      // Optionally validate against allowed options if defined
      if (fieldDef.options && Array.isArray(fieldDef.options) && value !== '') {
        const validValues = fieldDef.options.map(opt => opt.value)
        if (!validValues.includes(value as string)) {
          errors.push({
            path,
            reason: ErrorCodes.INVALID_FIELD_TYPE,
            message: `Field "${key}" must be one of: ${validValues.join(', ')}`,
          })
        }
      }
      break

    case 'image':
      const mediaResult = validateMediaRef(value, `fields.${key}`)
      if (!mediaResult.success) {
        errors.push(...mediaResult.errors)
      }
      break

    case 'gallery':
      const galleryResult = validateMediaReferenceArray(value, `fields.${key}`)
      if (!galleryResult.success) {
        errors.push(...galleryResult.errors)
      }
      break

    case 'repeater':
      const repeaterErrors = validateRepeaterValue(key, value, fieldDef)
      errors.push(...repeaterErrors)
      break

    case 'reference':
      const isMultiple = fieldDef.reference?.multiple === true

      if (isMultiple) {
        // Multiple: expect array of post IDs
        if (!Array.isArray(value)) {
          errors.push({
            path,
            reason: ErrorCodes.INVALID_FIELD_TYPE,
            message: `Field "${key}" must be an array of post IDs`,
          })
        } else {
          for (let i = 0; i < value.length; i++) {
            if (typeof value[i] !== 'string') {
              errors.push({
                path: `${path}[${i}]`,
                reason: ErrorCodes.INVALID_FIELD_TYPE,
                message: `Reference ID must be a string`,
              })
            }
          }
        }
      } else {
        // Single: expect string (post ID) or null
        if (value !== null && typeof value !== 'string') {
          errors.push({
            path,
            reason: ErrorCodes.INVALID_FIELD_TYPE,
            message: `Field "${key}" must be a post ID string or null`,
          })
        }
      }
      break

    default:
      errors.push({
        path,
        reason: ErrorCodes.UNKNOWN_FIELD_TYPE,
        message: `Unknown field type "${type}"`,
      })
  }

  return errors
}

/**
 * Validate repeater field value
 */
function validateRepeaterValue(
  key: string,
  value: FieldValue,
  fieldDef: FieldDefinition
): ValidationErrorDetail[] {
  const errors: ValidationErrorDetail[] = []
  const path = `fields.${key}`

  // Value must be an array
  if (!Array.isArray(value)) {
    errors.push({
      path,
      reason: ErrorCodes.INVALID_FIELD_TYPE,
      message: `Field "${key}" must be an array`,
    })
    return errors
  }

  // Check max items
  if (value.length > MAX_REPEATER_ITEMS) {
    errors.push({
      path,
      reason: ErrorCodes.REPEATER_MAX_ITEMS,
      message: `Field "${key}" exceeds maximum of ${MAX_REPEATER_ITEMS} items`,
    })
    return errors
  }

  // Validate each item
  if (!fieldDef.fields || fieldDef.fields.length === 0) {
    errors.push({
      path,
      reason: ErrorCodes.REPEATER_NO_FIELDS,
      message: `Repeater field "${key}" has no sub-fields defined`,
    })
    return errors
  }

  value.forEach((item, index) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      errors.push({
        path: `${path}[${index}]`,
        reason: ErrorCodes.REPEATER_INVALID_ITEM,
        message: 'Repeater item must be an object',
      })
      return
    }

    // Validate item fields against sub-field schema
    const itemFields = item as Record<string, unknown>
    const itemErrors = validateFieldsInternal(itemFields, fieldDef.fields!, `${path}[${index}]`)
    errors.push(...itemErrors)
  })

  return errors
}

/**
 * Internal field validation with custom path prefix
 */
function validateFieldsInternal(
  fields: Record<string, unknown>,
  schema: FieldDefinition[],
  pathPrefix: string
): ValidationErrorDetail[] {
  const errors: ValidationErrorDetail[] = []
  const safeFields = fields || {}

  // Check required fields
  for (const fieldDef of schema) {
    if (fieldDef.required) {
      const value = safeFields[fieldDef.key]
      if (value === null || value === undefined || value === '') {
        errors.push({
          path: `${pathPrefix}.${fieldDef.key}`,
          reason: ErrorCodes.REQUIRED_FIELD_MISSING,
          message: `Required field "${fieldDef.key}" is missing`,
        })
      }
    }
  }

  // Validate field types
  for (const [key, value] of Object.entries(safeFields)) {
    const fieldDef = schema.find((f) => f.key === key)

    // Unknown fields are ignored
    if (!fieldDef) {
      continue
    }

    // Skip null/undefined for optional fields
    if (!fieldDef.required && (value === null || value === undefined)) {
      continue
    }

    // Update path for nested validation
    const typeErrors = validateFieldType(key, value as FieldValue, fieldDef)
    const updatedErrors = typeErrors.map((err) => ({
      ...err,
      path: err.path.replace(`fields.${key}`, `${pathPrefix}.${key}`),
    }))
    errors.push(...updatedErrors)
  }

  return errors
}

/**
 * Validate URL
 * Allowed schemes: http, https, mailto, tel
 */
function validateUrl(key: string, value: string): ValidationErrorDetail[] {
  const errors: ValidationErrorDetail[] = []
  const path = `fields.${key}`

  try {
    const url = new URL(value)
    const allowedSchemes = ['http:', 'https:', 'mailto:', 'tel:']

    if (!allowedSchemes.includes(url.protocol)) {
      errors.push({
        path,
        reason: ErrorCodes.INVALID_URL,
        message: `URL scheme must be one of: ${allowedSchemes.join(', ')}`,
      })
    }
  } catch {
    errors.push({
      path,
      reason: ErrorCodes.INVALID_URL,
      message: 'Invalid URL format',
    })
  }

  return errors
}

/**
 * Validate slug format
 */
export function validateSlug(slug: string): ValidationResult<string> {
  const errors: ValidationErrorDetail[] = []

  if (!slug || typeof slug !== 'string') {
    errors.push({
      path: 'slug',
      reason: ErrorCodes.VALIDATION_ERROR,
      message: 'Slug is required and must be a string',
    })
  } else if (slug.length === 0) {
    errors.push({
      path: 'slug',
      reason: ErrorCodes.VALIDATION_ERROR,
      message: 'Slug cannot be empty',
    })
  } else if (!/^[a-z0-9-]+$/.test(slug)) {
    errors.push({
      path: 'slug',
      reason: ErrorCodes.VALIDATION_ERROR,
      message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    })
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return { success: true, data: slug }
}

/**
 * Validate title
 */
export function validateTitle(title: string): ValidationResult<string> {
  const errors: ValidationErrorDetail[] = []

  if (!title || typeof title !== 'string') {
    errors.push({
      path: 'title',
      reason: ErrorCodes.VALIDATION_ERROR,
      message: 'Title is required and must be a string',
    })
  } else if (title.trim().length === 0) {
    errors.push({
      path: 'title',
      reason: ErrorCodes.VALIDATION_ERROR,
      message: 'Title cannot be empty',
    })
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return { success: true, data: title }
}

/**
 * Validate global translation
 */
export function validateGlobalTranslation(
  translation: { fields: Fields },
  schema: FieldDefinition[]
): ValidationResult<{ fields: Fields }> {
  const errors: ValidationErrorDetail[] = []

  const fieldsResult = validateFields(translation.fields, schema)
  if (!fieldsResult.success) {
    errors.push(...fieldsResult.errors)
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return { success: true, data: translation }
}
