/**
 * Schema Constants
 */

/**
 * Allowed field types in V1
 */
export const ALLOWED_FIELD_TYPES = [
  'text',
  'textarea',
  'richtext',
  'image',
  'gallery',
  'url',
  'boolean',
  'date',
  'time',
  'select',
  'repeater',
  'reference',
] as const

/**
 * Reserved field keys that cannot be used in schemas
 */
export const RESERVED_KEYS = [
  'id',
  'slug',
  'title',
  'type',
  'status',
  'position',
  'publishedAt',
  'createdAt',
  'updatedAt',
  'translations',
  'fields',
] as const

/**
 * Field key validation pattern
 * Format: lowercase, starting with letter, alphanumeric + underscores allowed
 */
export const FIELD_KEY_PATTERN = /^[a-z][a-z0-9_]*$/

/**
 * Maximum field key length
 */
export const MAX_FIELD_KEY_LENGTH = 32

/**
 * Maximum fields per schema
 */
export const MAX_FIELDS_PER_SCHEMA = 50

/**
 * Maximum nesting depth for repeater fields
 */
export const MAX_REPEATER_DEPTH = 5

/**
 * Maximum items per repeater instance
 */
export const MAX_REPEATER_ITEMS = 50
