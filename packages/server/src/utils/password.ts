/**
 * Password Utilities
 *
 * Password hashing and validation using bcrypt.
 */

import bcrypt from 'bcrypt'
import { createHash } from 'node:crypto'
import { PasswordConfig } from '../constants.js'

const SALT_ROUNDS = PasswordConfig.BCRYPT_ROUNDS
const MIN_PASSWORD_LENGTH = PasswordConfig.MIN_LENGTH

/**
 * Validation result
 */
export interface PasswordValidationResult {
  valid: boolean
  error?: string
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): {
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (password.length < 12) {
    feedback.push('Consider using 12+ characters')
  }
  if (!/[A-Z]/.test(password)) {
    feedback.push('Add uppercase letters')
  }
  if (!/\d/.test(password)) {
    feedback.push('Add numbers')
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    feedback.push('Add special characters')
  }

  const commonPatterns = [/^12345/, /password/i, /qwerty/i, /^(.)\1+$/]
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      score = Math.max(0, score - 1)
      feedback.push('Avoid common patterns')
      break
    }
  }

  return { score: Math.min(4, score), feedback }
}

/**
 * Validate password meets requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  if (!password) {
    return { valid: false, error: 'Password is required' }
  }

  if (typeof password !== 'string') {
    return { valid: false, error: 'Password must be a string' }
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
    }
  }

  const strength = checkPasswordStrength(password)
  if (strength.score < 2) {
    return {
      valid: false,
      error: `Password is too weak. ${strength.feedback.slice(0, 2).join('. ')}`,
    }
  }

  return { valid: true }
}

/**
 * Hash a password using bcrypt
 * Pre-hashes with SHA-256 to handle passwords longer than bcrypt's 72-byte limit
 */
export async function hashPassword(password: string): Promise<string> {
  const validation = validatePassword(password)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const preHash = createHash('sha256').update(password).digest('base64')
  return bcrypt.hash(preHash, SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false
  }

  try {
    const preHash = createHash('sha256').update(password).digest('base64')
    return await bcrypt.compare(preHash, hash)
  } catch (error) {
    return false
  }
}
