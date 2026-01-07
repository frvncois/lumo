/**
 * Page Validation
 */

import type {
  LumoConfig,
  PageTranslations,
  TranslationContent,
  ValidationResult,
  ValidationErrorDetail,
} from '../types.js'
import { ErrorCodes } from '../errors.js'
import { validateFields, validateSlug, validateTitle } from './validate.js'

/**
 * Validate page translation content
 */
export function validatePageTranslation(
  pageSlug: string,
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

  // Get page schema
  const pageSchema = config.pages?.[pageSlug]
  if (!pageSchema) {
    errors.push({
      path: 'pageSlug',
      reason: ErrorCodes.VALIDATION_ERROR,
      message: `Page "${pageSlug}" is not defined in config`,
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
  const fieldsResult = validateFields(content.fields, pageSchema.fields)
  if (!fieldsResult.success) {
    errors.push(...fieldsResult.errors)
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return { success: true, data: content }
}

/**
 * Validate page translations
 * Ensures default language exists
 */
export function validatePageTranslations(
  translations: PageTranslations,
  config: LumoConfig
): ValidationResult<PageTranslations> {
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
