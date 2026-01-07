/**
 * Password Utilities
 *
 * Password hashing and validation using bcrypt.
 */

import bcrypt from 'bcrypt'
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
 * Validate password meets requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  if (!password) {
    return {
      valid: false,
      error: 'Password is required',
    }
  }

  if (typeof password !== 'string') {
    return {
      valid: false,
      error: 'Password must be a string',
    }
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    }
  }

  // Bcrypt has a maximum length of 72 bytes, but we don't enforce a max
  // If the password is too long, bcrypt will handle it by truncating

  return { valid: true }
}

/**
 * Hash a password using bcrypt
 *
 * @param password - Plain text password to hash
 * @returns Promise resolving to the password hash
 */
export async function hashPassword(password: string): Promise<string> {
  const validation = validatePassword(password)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 *
 * @param password - Plain text password to verify
 * @param hash - Password hash to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false
  }

  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    // If bcrypt throws an error (e.g., invalid hash format), return false
    return false
  }
}
