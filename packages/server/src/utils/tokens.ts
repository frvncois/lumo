/**
 * Token Utilities
 *
 * Sign and verify tokens for sessions and previews.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Get the signing secret for tokens.
 *
 * Security rules:
 * 1. In production (NODE_ENV === 'production'), COOKIE_SECRET is REQUIRED
 * 2. In development (NODE_ENV === 'development'), a warning is logged if missing
 * 3. In any OTHER environment (staging, test, undefined), COOKIE_SECRET is REQUIRED
 *
 * This prevents accidental use of insecure defaults in non-development environments.
 */
function getSigningSecret(): string {
  const secret = process.env.COOKIE_SECRET
  const nodeEnv = process.env.NODE_ENV

  // Explicit development mode: allow insecure default with warning
  if (nodeEnv === 'development') {
    if (!secret) {
      console.warn('⚠️  WARNING: COOKIE_SECRET not set. Using insecure default. DO NOT deploy this configuration.')
      return 'dev-secret-do-not-use-in-production'
    }
    return secret
  }

  // Production or ANY other environment: require proper secret
  if (!secret) {
    throw new Error(
      'COOKIE_SECRET environment variable is required. ' +
      'Set NODE_ENV=development to use an insecure default for local development only.'
    )
  }

  // Validate minimum secret length
  if (secret.length < 32) {
    throw new Error(
      'COOKIE_SECRET must be at least 32 characters long. ' +
      'Generate a secure secret with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    )
  }

  return secret
}

const SIGNING_SECRET = getSigningSecret()

export interface SessionPayload {
  userId: string
  role: 'owner' | 'editor'
  issuedAt: number
  expiresAt: number
  passwordChangedAt?: string
}

/**
 * Sign a payload to create a token
 */
export function signToken(payload: Record<string, any>): string {
  const data = JSON.stringify(payload)
  const signature = createHmac('sha256', SIGNING_SECRET).update(data).digest('hex')

  const token = Buffer.from(JSON.stringify({ data, signature })).toString('base64url')
  return token
}

/**
 * Verify and decode a token
 */
export function verifyToken<T = Record<string, any>>(token: string): T | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'))
    const { data, signature } = decoded

    // Verify signature using timing-safe comparison
    const expectedSignature = createHmac('sha256', SIGNING_SECRET).update(data).digest('hex')

    // Convert to buffers for timing-safe comparison
    const signatureBuffer = Buffer.from(signature, 'hex')
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')

    // Check length first (also constant-time via buffer comparison)
    if (signatureBuffer.length !== expectedBuffer.length) {
      return null
    }

    // Timing-safe comparison prevents timing attacks
    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return null
    }

    const payload = JSON.parse(data)

    // Check expiration
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return null
    }

    return payload as T
  } catch {
    return null
  }
}

/**
 * Create session token
 */
export function createSessionToken(
  userId: string,
  role: 'owner' | 'editor',
  passwordChangedAt?: string
): string {
  const now = Date.now()
  const payload: SessionPayload = {
    userId,
    role,
    issuedAt: now,
    expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
    passwordChangedAt,
  }

  return signToken(payload)
}

/**
 * Verify session token
 */
export function verifySessionToken(token: string): SessionPayload | null {
  return verifyToken<SessionPayload>(token)
}

/**
 * Generate random token (for previews, etc.)
 */
export function generateRandomToken(length: number = 32): string {
  return randomBytes(length).toString('base64url')
}

/**
 * Generate ID (nanoid-like)
 */
export function generateId(prefix: string = ''): string {
  const random = randomBytes(12).toString('base64url').slice(0, 16)
  return prefix ? `${prefix}_${random}` : random
}
