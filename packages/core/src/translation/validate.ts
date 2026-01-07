/**
 * Translation Validation
 *
 * Validates translation rules and invariants.
 * Core principle: Translations duplicate content, not structure.
 */

import type {
  PageTranslations,
  PostTranslations,
  TranslationContent,
  ValidationResult,
  ValidationErrorDetail,
} from '../types.js'
import { ErrorCodes } from '../errors.js'

/**
 * Validate that default language translation exists
 */
export function validateDefaultLanguageExists(
  translations: Record<string, unknown>,
  defaultLanguage: string,
  contentType: 'page' | 'post' = 'page'
): ValidationResult<void> {
  const errors: ValidationErrorDetail[] = []

  if (!translations[defaultLanguage]) {
    errors.push({
      path: 'translations',
      reason: ErrorCodes.DEFAULT_LANGUAGE_MISSING,
      message: `Default language "${defaultLanguage}" translation is required for ${contentType}`,
    })
    return { success: false, errors }
  }

  return { success: true, data: undefined }
}

/**
 * Validate translation content structure
 */
export function validateTranslationContent(
  content: unknown,
  language: string
): ValidationResult<TranslationContent> {
  const errors: ValidationErrorDetail[] = []
  const path = `translations.${language}`

  if (typeof content !== 'object' || content === null) {
    errors.push({
      path,
      reason: ErrorCodes.VALIDATION_ERROR,
      message: 'Translation content must be an object',
    })
    return { success: false, errors }
  }

  const translation = content as Record<string, unknown>

  // Validate required fields
  if (!translation.slug || typeof translation.slug !== 'string') {
    errors.push({
      path: `${path}.slug`,
      reason: ErrorCodes.VALIDATION_ERROR,
      message: 'slug is required and must be a string',
    })
  }

  if (!translation.title || typeof translation.title !== 'string') {
    errors.push({
      path: `${path}.title`,
      reason: ErrorCodes.VALIDATION_ERROR,
      message: 'title is required and must be a string',
    })
  }

  if (!translation.fields || typeof translation.fields !== 'object') {
    errors.push({
      path: `${path}.fields`,
      reason: ErrorCodes.VALIDATION_ERROR,
      message: 'fields is required and must be an object',
    })
  }

  if (!translation.updatedAt || typeof translation.updatedAt !== 'string') {
    errors.push({
      path: `${path}.updatedAt`,
      reason: ErrorCodes.VALIDATION_ERROR,
      message: 'updatedAt is required and must be a string',
    })
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return {
    success: true,
    data: {
      slug: translation.slug as string,
      title: translation.title as string,
      fields: translation.fields,
      updatedAt: translation.updatedAt as string,
    } as TranslationContent,
  }
}

/**
 * Validate page translations
 */
export function validatePageTranslations(
  translations: unknown,
  defaultLanguage: string,
  configuredLanguages: string[]
): ValidationResult<PageTranslations> {
  const errors: ValidationErrorDetail[] = []

  if (typeof translations !== 'object' || translations === null) {
    errors.push({
      path: 'translations',
      reason: ErrorCodes.VALIDATION_ERROR,
      message: 'Translations must be an object',
    })
    return { success: false, errors }
  }

  const trans = translations as Record<string, unknown>

  // Check default language exists
  const defaultCheck = validateDefaultLanguageExists(trans, defaultLanguage, 'page')
  if (!defaultCheck.success) {
    errors.push(...defaultCheck.errors)
    return { success: false, errors }
  }

  // Validate each translation content
  for (const [lang, content] of Object.entries(trans)) {
    // Warn about unconfigured languages but don't reject
    if (!configuredLanguages.includes(lang)) {
      errors.push({
        path: `translations.${lang}`,
        reason: ErrorCodes.VALIDATION_ERROR,
        message: `Language "${lang}" is not configured in config.languages`,
      })
      continue
    }

    const contentResult = validateTranslationContent(content, lang)
    if (!contentResult.success) {
      errors.push(...contentResult.errors)
    }
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return { success: true, data: trans as PageTranslations }
}

/**
 * Validate post translations
 */
export function validatePostTranslations(
  translations: unknown,
  defaultLanguage: string,
  configuredLanguages: string[]
): ValidationResult<PostTranslations> {
  const errors: ValidationErrorDetail[] = []

  if (typeof translations !== 'object' || translations === null) {
    errors.push({
      path: 'translations',
      reason: ErrorCodes.VALIDATION_ERROR,
      message: 'Translations must be an object',
    })
    return { success: false, errors }
  }

  const trans = translations as Record<string, unknown>

  // Check default language exists
  const defaultCheck = validateDefaultLanguageExists(trans, defaultLanguage, 'post')
  if (!defaultCheck.success) {
    errors.push(...defaultCheck.errors)
    return { success: false, errors }
  }

  // Validate each translation content
  for (const [lang, content] of Object.entries(trans)) {
    // Warn about unconfigured languages but don't reject
    if (!configuredLanguages.includes(lang)) {
      errors.push({
        path: `translations.${lang}`,
        reason: ErrorCodes.VALIDATION_ERROR,
        message: `Language "${lang}" is not configured in config.languages`,
      })
      continue
    }

    const contentResult = validateTranslationContent(content, lang)
    if (!contentResult.success) {
      errors.push(...contentResult.errors)
    }
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return { success: true, data: trans as PostTranslations }
}

/**
 * Check if a language is configured
 */
export function isLanguageConfigured(
  language: string,
  configuredLanguages: string[]
): boolean {
  return configuredLanguages.includes(language)
}
