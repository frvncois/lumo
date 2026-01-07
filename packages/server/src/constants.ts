/**
 * Application Constants
 */

// User Roles
export const UserRoles = {
  OWNER: 'owner',
  EDITOR: 'editor',
} as const

export type UserRole = typeof UserRoles[keyof typeof UserRoles]

// Session Configuration
export const SessionConfig = {
  COOKIE_NAME: 'session',
  MAX_AGE_SECONDS: 7 * 24 * 60 * 60, // 7 days
  TOKEN_EXPIRY: '7d',
} as const

// Preview Configuration
export const PreviewConfig = {
  TOKEN_EXPIRY_MINUTES: 30,
} as const

// Pagination Defaults
export const PaginationDefaults = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MEDIA_DEFAULT_LIMIT: 50,
  MEDIA_MAX_LIMIT: 200,
} as const

// Server Configuration
export const ServerDefaults = {
  PORT: 3000,
  HOST: '0.0.0.0',
} as const

// Cleanup Job Configuration
export const CleanupConfig = {
  INTERVAL_MS: 10 * 60 * 1000, // 10 minutes
} as const

// Password Configuration
export const PasswordConfig = {
  MIN_LENGTH: 8,
  BCRYPT_ROUNDS: 12,
} as const
