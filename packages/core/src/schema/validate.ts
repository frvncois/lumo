/**
 * Schema Validation
 *
 * Validates lumo.config.ts schema definitions at startup.
 * Invalid schemas cause Lumo to fail fast.
 */

import type {
  LumoConfig,
  PageSchema,
  PostTypeSchema,
  GlobalSchema,
  GlobalSchemaInput,
  FieldDefinition,
  ValidationErrorDetail,
  ValidationResult,
} from '../types.js'
import { SchemaValidationError, ErrorCodes } from '../errors.js'
import {
  ALLOWED_FIELD_TYPES,
  RESERVED_KEYS,
  FIELD_KEY_PATTERN,
  MAX_FIELD_KEY_LENGTH,
  MAX_FIELDS_PER_SCHEMA,
  MAX_REPEATER_DEPTH,
} from './constants.js'

/**
 * Validate complete Lumo configuration
 */
export function validateConfig(config: LumoConfig): void {
  const errors: ValidationErrorDetail[] = []

  // Validate languages
  if (!Array.isArray(config.languages) || config.languages.length === 0) {
    errors.push({
      path: 'languages',
      reason: 'Languages must be a non-empty array',
    })
  }

  if (!config.defaultLanguage) {
    errors.push({
      path: 'defaultLanguage',
      reason: 'Default language is required',
    })
  }

  if (config.defaultLanguage && !config.languages.includes(config.defaultLanguage)) {
    errors.push({
      path: 'defaultLanguage',
      reason: 'Default language must be in languages array',
    })
  }

  // Validate pages
  if (config.pages) {
    for (const [pageKey, pageSchema] of Object.entries(config.pages)) {
      const pageErrors = validatePageSchema(pageKey, pageSchema)
      errors.push(...pageErrors)
    }
  }

  // Validate post types
  if (config.postTypes) {
    for (const [typeKey, postTypeSchema] of Object.entries(config.postTypes)) {
      const postTypeErrors = validatePostTypeSchema(typeKey, postTypeSchema)
      errors.push(...postTypeErrors)
    }
  }

  // Validate media config
  if (config.media) {
    if (
      typeof config.media.maxImageSize !== 'number' ||
      config.media.maxImageSize <= 0
    ) {
      errors.push({
        path: 'media.maxImageSize',
        reason: 'Must be a positive number',
      })
    }
    if (
      typeof config.media.maxVideoSize !== 'number' ||
      config.media.maxVideoSize <= 0
    ) {
      errors.push({
        path: 'media.maxVideoSize',
        reason: 'Must be a positive number',
      })
    }
    if (
      typeof config.media.maxAudioSize !== 'number' ||
      config.media.maxAudioSize <= 0
    ) {
      errors.push({
        path: 'media.maxAudioSize',
        reason: 'Must be a positive number',
      })
    }
    if (
      typeof config.media.maxDocumentSize !== 'number' ||
      config.media.maxDocumentSize <= 0
    ) {
      errors.push({
        path: 'media.maxDocumentSize',
        reason: 'Must be a positive number',
      })
    }
  }

  if (errors.length > 0) {
    throw new SchemaValidationError('Invalid Lumo configuration', errors)
  }
}

/**
 * Validate page schema
 */
export function validatePageSchema(
  pageKey: string,
  schema: PageSchema
): ValidationErrorDetail[] {
  const errors: ValidationErrorDetail[] = []

  if (!schema.fields || !Array.isArray(schema.fields)) {
    errors.push({
      path: `pages.${pageKey}.fields`,
      reason: 'Fields must be an array',
    })
    return errors
  }

  if (schema.fields.length > MAX_FIELDS_PER_SCHEMA) {
    errors.push({
      path: `pages.${pageKey}.fields`,
      reason: `Maximum ${MAX_FIELDS_PER_SCHEMA} fields allowed`,
    })
  }

  const fieldErrors = validateFields(`pages.${pageKey}`, schema.fields)
  errors.push(...fieldErrors)

  return errors
}

/**
 * Validate post type schema
 */
export function validatePostTypeSchema(
  typeKey: string,
  schema: PostTypeSchema
): ValidationErrorDetail[] {
  const errors: ValidationErrorDetail[] = []

  if (!schema.name || typeof schema.name !== 'string') {
    errors.push({
      path: `postTypes.${typeKey}.name`,
      reason: 'Name is required and must be a string',
    })
  }

  if (!schema.nameSingular || typeof schema.nameSingular !== 'string') {
    errors.push({
      path: `postTypes.${typeKey}.nameSingular`,
      reason: 'Name singular is required and must be a string',
    })
  }

  if (!schema.fields || !Array.isArray(schema.fields)) {
    errors.push({
      path: `postTypes.${typeKey}.fields`,
      reason: 'Fields must be an array',
    })
    return errors
  }

  if (schema.fields.length > MAX_FIELDS_PER_SCHEMA) {
    errors.push({
      path: `postTypes.${typeKey}.fields`,
      reason: `Maximum ${MAX_FIELDS_PER_SCHEMA} fields allowed`,
    })
  }

  const fieldErrors = validateFields(`postTypes.${typeKey}`, schema.fields)
  errors.push(...fieldErrors)

  return errors
}

/**
 * Validate field definitions (with repeater depth tracking)
 */
export function validateFields(
  basePath: string,
  fields: FieldDefinition[],
  depth: number = 0
): ValidationErrorDetail[] {
  const errors: ValidationErrorDetail[] = []
  const seenKeys = new Set<string>()

  // Check nesting depth for repeater fields
  if (depth > MAX_REPEATER_DEPTH) {
    errors.push({
      path: basePath,
      reason: ErrorCodes.REPEATER_MAX_DEPTH,
      message: `Repeater nesting exceeds maximum depth of ${MAX_REPEATER_DEPTH}`,
    })
    return errors
  }

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]
    const fieldPath = `${basePath}.fields[${i}]`

    // Validate key
    if (!field.key || typeof field.key !== 'string') {
      errors.push({
        path: `${fieldPath}.key`,
        reason: 'Field key is required and must be a string',
      })
      continue
    }

    // Check key format
    if (!FIELD_KEY_PATTERN.test(field.key)) {
      errors.push({
        path: `${fieldPath}.key`,
        reason: `Field key must match pattern ${FIELD_KEY_PATTERN.toString()}`,
      })
    }

    // Check key length
    if (field.key.length > MAX_FIELD_KEY_LENGTH) {
      errors.push({
        path: `${fieldPath}.key`,
        reason: `Field key must be ${MAX_FIELD_KEY_LENGTH} characters or less`,
      })
    }

    // Check reserved keys
    if (RESERVED_KEYS.includes(field.key as any)) {
      errors.push({
        path: `${fieldPath}.key`,
        reason: `Field key "${field.key}" is reserved and cannot be used`,
      })
    }

    // Check duplicates
    if (seenKeys.has(field.key)) {
      errors.push({
        path: `${fieldPath}.key`,
        reason: `Duplicate field key "${field.key}"`,
      })
    }
    seenKeys.add(field.key)

    // Validate type
    if (!field.type) {
      errors.push({
        path: `${fieldPath}.type`,
        reason: 'Field type is required',
      })
    } else if (!ALLOWED_FIELD_TYPES.includes(field.type as any)) {
      errors.push({
        path: `${fieldPath}.type`,
        reason: `Unknown field type "${field.type}". Allowed: ${ALLOWED_FIELD_TYPES.join(', ')}`,
      })
    }

    // Validate label
    if (!field.label || typeof field.label !== 'string') {
      errors.push({
        path: `${fieldPath}.label`,
        reason: 'Field label is required and must be a string',
      })
    }

    // Validate required
    if (typeof field.required !== 'boolean') {
      errors.push({
        path: `${fieldPath}.required`,
        reason: 'Field required must be a boolean',
      })
    }

    // Validate select options
    if (field.type === 'select') {
      if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
        errors.push({
          path: `${fieldPath}.options`,
          reason: ErrorCodes.VALIDATION_ERROR,
          message: 'Select field must have at least one option',
        })
      } else {
        // Validate each option has label and value
        for (let optionIndex = 0; optionIndex < field.options.length; optionIndex++) {
          const option = field.options[optionIndex]
          if (!option.label || typeof option.label !== 'string' || option.label.trim() === '') {
            errors.push({
              path: `${fieldPath}.options[${optionIndex}].label`,
              reason: ErrorCodes.VALIDATION_ERROR,
              message: 'Option label is required',
            })
          }
          if (!option.value || typeof option.value !== 'string' || option.value.trim() === '') {
            errors.push({
              path: `${fieldPath}.options[${optionIndex}].value`,
              reason: ErrorCodes.VALIDATION_ERROR,
              message: 'Option value is required',
            })
          }
        }
      }
    }

    // Validate repeater sub-fields
    if (field.type === 'repeater') {
      if (!field.fields || !Array.isArray(field.fields) || field.fields.length === 0) {
        errors.push({
          path: `${fieldPath}.fields`,
          reason: ErrorCodes.REPEATER_NO_FIELDS,
          message: 'Repeater field must have at least one sub-field',
        })
      } else {
        // Recursively validate sub-fields with incremented depth
        const subFieldErrors = validateFields(`${fieldPath}`, field.fields, depth + 1)
        errors.push(...subFieldErrors)
      }
    }
  }

  return errors
}

/**
 * Validate global schema
 */
export function validateGlobalSchema(schema: GlobalSchemaInput): ValidationResult<GlobalSchemaInput> {
  const errors: ValidationErrorDetail[] = []

  if (!schema.name || typeof schema.name !== 'string' || schema.name.trim().length === 0) {
    errors.push({
      path: 'name',
      reason: ErrorCodes.VALIDATION_ERROR,
      message: 'Global name is required',
    })
  }

  if (!schema.fields || !Array.isArray(schema.fields)) {
    errors.push({
      path: 'fields',
      reason: ErrorCodes.VALIDATION_ERROR,
      message: 'Fields array is required',
    })
  } else {
    if (schema.fields.length > MAX_FIELDS_PER_SCHEMA) {
      errors.push({
        path: 'fields',
        reason: ErrorCodes.TOO_MANY_FIELDS,
        message: `Maximum ${MAX_FIELDS_PER_SCHEMA} fields allowed`,
      })
    }
    const fieldErrors = validateFields('global', schema.fields)
    errors.push(...fieldErrors)
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return { success: true, data: schema }
}
