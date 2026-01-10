/**
 * @lumo/core
 *
 * LUMO Core Domain Engine (V1)
 *
 * Core is the authoritative source for:
 * - Content validation
 * - Schema validation
 * - Business rules
 * - Domain invariants
 *
 * Core contains:
 * - ZERO runtime dependencies
 * - NO Node.js APIs
 * - NO HTTP knowledge
 * - NO database knowledge
 * - NO filesystem access
 *
 * Core operates on plain data structures and returns:
 * - Validated domain objects
 * - Explicit errors
 */

// Types
export type {
  FieldType,
  MediaReference,
  FieldDefinition,
  FieldValue,
  Fields,
  PageSchema,
  PostTypeSchema,
  PageSchemaInput,
  PostTypeSchemaInput,
  GlobalSchema,
  GlobalSchemaInput,
  GlobalTranslationContent,
  GlobalTranslations,
  Global,
  LumoConfig,
  MediaConfig,
  TranslationContent,
  PageTranslations,
  PostTranslations,
  Page,
  PostStatus,
  Post,
  Media,
  UserRole,
  User,
  Collaborator,
  PreviewTargetType,
  Preview,
  GeneralSEO,
  SEOFields,
  ValidationErrorDetail,
  ValidationResult,
} from './types.js'

// Errors
export { ErrorCodes, ValidationError, SchemaValidationError } from './errors.js'

// Schema validation
export { validateConfig, validatePageSchema, validatePostTypeSchema, validateGlobalSchema } from './schema/validate.js'
export {
  ALLOWED_FIELD_TYPES,
  RESERVED_KEYS,
  FIELD_KEY_PATTERN,
  MAX_FIELD_KEY_LENGTH,
  MAX_FIELDS_PER_SCHEMA,
  MAX_REPEATER_DEPTH,
  MAX_REPEATER_ITEMS,
} from './schema/constants.js'

// Content validation
export { validateFields, validateSlug, validateTitle, validateGlobalTranslation } from './content/validate.js'
export { validatePageTranslation, validatePageTranslations } from './content/page.js'
export {
  validatePostType,
  validatePostTranslation,
  validatePostTranslations,
  validatePostStatus,
} from './content/post.js'
export { validateMediaReference, validateMediaReferenceArray } from './content/media.js'

// Translation validation
export {
  validateDefaultLanguageExists,
  validateTranslationContent,
  isLanguageConfigured,
} from './translation/validate.js'
