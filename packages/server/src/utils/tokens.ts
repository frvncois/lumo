/**
 * Token Utilities
 *
 * Sign and verify tokens for sessions and previews.
 */

import { createHmac, randomBytes } from 'node:crypto'

const SECRET = process.env.COOKIE_SECRET
if (!SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('COOKIE_SECRET environment variable must be set in production')
}
const SIGNING_SECRET = SECRET || 'dev-secret-do-not-use-in-production'

export interface SessionPayload {
  userId: string
  role: 'owner' | 'editor'
  issuedAt: number
  expiresAt: number
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

    // Verify signature
    const expectedSignature = createHmac('sha256', SIGNING_SECRET).update(data).digest('hex')
    if (signature !== expectedSignature) {
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
export function createSessionToken(userId: string, role: 'owner' | 'editor'): string {
  const now = Date.now()
  const payload: SessionPayload = {
    userId,
    role,
    issuedAt: now,
    expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
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
