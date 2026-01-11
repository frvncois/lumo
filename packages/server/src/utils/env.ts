/**
 * Environment Variable Validation
 *
 * Validates required environment variables at startup
 */

export interface EnvValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate environment configuration
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const nodeEnv = process.env.NODE_ENV || 'development'

  // Production-specific validations
  if (nodeEnv === 'production') {
    // Cookie secret is critical in production
    if (!process.env.COOKIE_SECRET) {
      errors.push('COOKIE_SECRET is required in production')
    } else if (process.env.COOKIE_SECRET.length < 32) {
      errors.push('COOKIE_SECRET must be at least 32 characters')
    } else if (
      process.env.COOKIE_SECRET === 'replace-me-in-production' ||
      process.env.COOKIE_SECRET === 'dev-secret-do-not-use-in-production'
    ) {
      errors.push('COOKIE_SECRET is set to an insecure default value')
    }

    // CORS must be specific in production
    if (!process.env.CORS_ORIGIN) {
      errors.push('CORS_ORIGIN must be set in production (not *)')
    } else if (process.env.CORS_ORIGIN === '*') {
      errors.push('CORS_ORIGIN cannot be * in production - specify allowed origins')
    }

    // Warn if running on default port
    if (!process.env.PORT) {
      warnings.push('PORT not set - using default 3000')
    }

    // Warn if database path not specified
    if (!process.env.LUMO_DB_PATH) {
      warnings.push('LUMO_DB_PATH not set - using ./lumo.db')
    }
  }

  // Development-specific warnings
  if (nodeEnv === 'development') {
    if (!process.env.COOKIE_SECRET) {
      warnings.push('COOKIE_SECRET not set - using development default (sessions will reset on restart)')
    }
  }

  // General validations
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10)
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push(`PORT must be a valid port number (1-65535), got: ${process.env.PORT}`)
    }
  }

  // Validate LUMO_CONFIG_PATH if set
  if (process.env.LUMO_CONFIG_PATH) {
    const path = process.env.LUMO_CONFIG_PATH
    if (!path.endsWith('.ts') && !path.endsWith('.js')) {
      warnings.push('LUMO_CONFIG_PATH should point to a .ts or .js file')
    }
  }

  // Check HOST binding
  if (process.env.HOST) {
    const host = process.env.HOST
    // Warn about 0.0.0.0 in production
    if (nodeEnv === 'production' && host === '0.0.0.0') {
      warnings.push('HOST is set to 0.0.0.0 - ensure firewall is configured correctly')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Print validation results to console
 */
export function printValidationResults(result: EnvValidationResult): void {
  if (result.errors.length > 0) {
    console.error('\n❌ Environment validation failed:')
    result.errors.forEach((error) => console.error(`  - ${error}`))
  }

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment warnings:')
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`))
  }

  if (result.valid && result.warnings.length === 0) {
    console.log('✅ Environment validation passed')
  }

  console.log() // Empty line for readability
}
