/**
 * Post Validation
 */

import type {
  LumoConfig,
  PostTranslations,
  TranslationContent,
  PostStatus,
  ValidationResult,
  ValidationErrorDetail,
} from '../types.js'
import { ErrorCodes } from '../errors.js'
import { validateFields, validateSlug, validateTitle } from './validate.js'

/**
 * Validate post type
 */
export function validatePostType(
  type: string,
  config: LumoConfig
): ValidationResult<string> {
  const errors: ValidationErrorDetail[] = []

  if (!type || typeof type !== 'string') {
    errors.push({
      path: 'type',
      reason: ErrorCodes.VALIDATION_ERROR,
      message: 'Post type is required and must be a string',
    })
    return { success: false, errors }
  }

  if (!config.postTypes?.[type]) {
    errors.push({
      path: 'type',
      reason: ErrorCodes.INVALID_POST_TYPE,
      message: `Post type "${type}" is not defined in config`,
    })
    return { success: false, errors }
  }

  return { success: true, data: type }
}

/**
 * Validate post translation content
 */
export function validatePostTranslation(
  postType: string,
  language: string,
  content: TranslationContent,
  config: LumoConfig
): ValidationResult<TranslationContent> {
  const errors: ValidationErrorDetail[] = []

  // Validate language
  if (!config.languages.includes(language)) {
    errors.push({
      path: 'language',
      reason: ErrorCodes.VALIDATION_ERROR,
      message: `Language "${language}" is not configured`,
    })
    return { success: false, errors }
  }

  // Get post type schema
  const postTypeSchema = config.postTypes?.[postType]
  if (!postTypeSchema) {
    errors.push({
      path: 'postType',
      reason: ErrorCodes.INVALID_POST_TYPE,
      message: `Post type "${postType}" is not defined in config`,
    })
    return { success: false, errors }
  }

  // Validate slug
  const slugResult = validateSlug(content.slug)
  if (!slugResult.success) {
    errors.push(...slugResult.errors)
  }

  // Validate title
  const titleResult = validateTitle(content.title)
  if (!titleResult.success) {
    errors.push(...titleResult.errors)
  }

  // Validate fields against schema
  const fieldsResult = validateFields(content.fields, postTypeSchema.fields)
  if (!fieldsResult.success) {
    errors.push(...fieldsResult.errors)
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return { success: true, data: content }
}

/**
 * Validate post translations
 * Ensures default language exists
 */
export function validatePostTranslations(
  translations: PostTranslations,
  config: LumoConfig
): ValidationResult<PostTranslations> {
  const errors: ValidationErrorDetail[] = []

  // Check default language exists
  if (!translations[config.defaultLanguage]) {
    errors.push({
      path: 'translations',
      reason: ErrorCodes.DEFAULT_LANGUAGE_MISSING,
      message: `Default language "${config.defaultLanguage}" translation is required`,
    })
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return { success: true, data: translations }
}

/**
 * Validate post status
 */
export function validatePostStatus(
  status: PostStatus,
  publishedAt: string | null
): ValidationResult<PostStatus> {
  const errors: ValidationErrorDetail[] = []

  if (status !== 'draft' && status !== 'published') {
    errors.push({
      path: 'status',
      reason: ErrorCodes.VALIDATION_ERROR,
      message: 'Status must be "draft" or "published"',
    })
  }

  // Published posts must have publishedAt
  if (status === 'published' && !publishedAt) {
    errors.push({
      path: 'publishedAt',
      reason: ErrorCodes.PUBLISHED_WITHOUT_DATE,
      message: 'Published posts must have a publishedAt date',
    })
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return { success: true, data: status }
}
