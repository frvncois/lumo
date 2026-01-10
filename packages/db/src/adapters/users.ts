/**
 * Users & Collaborators Adapter
 *
 * CRUD operations for users and collaborators.
 */

import type Database from 'better-sqlite3'
import type { UserRow, CollaboratorRow } from '../types.js'
import type { User, Collaborator, UserRole } from '@lumo/core'

export interface UserWithRole extends User {
  role?: UserRole
}

/**
 * Create new user
 */
export function createUser(
  db: Database.Database,
  id: string,
  email: string,
  passwordHash?: string
): User {
  // Normalize email for storage
  const normalizedEmail = email.toLowerCase().trim()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO users (id, email, password_hash, created_at)
    VALUES (?, ?, ?, ?)
  `).run(id, normalizedEmail, passwordHash ?? null, now)

  return getUserById(db, id)!
}

/**
 * Get user by ID
 */
export function getUserById(db: Database.Database, id: string): User | null {
  const row = db
    .prepare<[string], UserRow>('SELECT * FROM users WHERE id = ?')
    .get(id)

  if (!row) {
    return null
  }

  return rowToUser(row)
}

/**
 * Get user by email
 */
export function getUserByEmail(db: Database.Database, email: string): User | null {
  // Normalize email for lookup
  const normalizedEmail = email.toLowerCase().trim()

  const row = db
    .prepare<[string], UserRow>('SELECT * FROM users WHERE email = ?')
    .get(normalizedEmail)

  if (!row) {
    return null
  }

  return rowToUser(row)
}

/**
 * Get user with their role
 */
export function getUserWithRole(db: Database.Database, id: string): UserWithRole | null {
  const user = getUserById(db, id)
  if (!user) {
    return null
  }

  const collaborator = getCollaboratorByUserId(db, id)

  return {
    ...user,
    role: collaborator?.role,
  }
}

/**
 * Update user password and set password_changed_at
 */
export function updatePassword(
  db: Database.Database,
  userId: string,
  passwordHash: string
): void {
  const now = new Date().toISOString()
  db.prepare(`
    UPDATE users
    SET password_hash = ?, password_changed_at = ?
    WHERE id = ?
  `).run(passwordHash, now, userId)
}

/**
 * Get password changed timestamp
 */
export function getPasswordChangedAt(
  db: Database.Database,
  userId: string
): string | null {
  const row = db
    .prepare<[string], { password_changed_at: string | null }>(
      'SELECT password_changed_at FROM users WHERE id = ?'
    )
    .get(userId)
  return row?.password_changed_at ?? null
}

/**
 * Check if any users exist
 */
export function hasAnyUsers(db: Database.Database): boolean {
  const result = db
    .prepare<[], { count: number }>('SELECT COUNT(*) as count FROM users')
    .get()

  return (result?.count ?? 0) > 0
}

/**
 * Delete user (cascades to collaborators)
 */
export function deleteUser(db: Database.Database, id: string): void {
  db.prepare('DELETE FROM users WHERE id = ?').run(id)
}

/**
 * List all users
 */
export function listUsers(db: Database.Database): User[] {
  const rows = db.prepare<[], UserRow>('SELECT * FROM users ORDER BY created_at DESC').all()
  return rows.map(rowToUser)
}

/**
 * Create collaborator (assign role to user)
 */
export function createCollaborator(
  db: Database.Database,
  id: string,
  userId: string,
  role: UserRole
): Collaborator {
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO collaborators (id, user_id, role, created_at)
    VALUES (?, ?, ?, ?)
  `).run(id, userId, role, now)

  return getCollaboratorById(db, id)!
}

/**
 * Get collaborator by ID
 */
export function getCollaboratorById(db: Database.Database, id: string): Collaborator | null {
  const row = db
    .prepare<[string], CollaboratorRow>('SELECT * FROM collaborators WHERE id = ?')
    .get(id)

  if (!row) {
    return null
  }

  return rowToCollaborator(row)
}

/**
 * Get collaborator by user ID
 */
export function getCollaboratorByUserId(
  db: Database.Database,
  userId: string
): Collaborator | null {
  const row = db
    .prepare<[string], CollaboratorRow>('SELECT * FROM collaborators WHERE user_id = ?')
    .get(userId)

  if (!row) {
    return null
  }

  return rowToCollaborator(row)
}

/**
 * List all collaborators with user info
 */
export function listCollaborators(
  db: Database.Database
): Array<{
  userId: string
  email: string
  role: UserRole
  createdAt: string
}> {
  const rows = db
    .prepare<
      [],
      {
        user_id: string
        email: string
        role: UserRole
        created_at: string
      }
    >(`
    SELECT c.user_id, u.email, c.role, c.created_at
    FROM collaborators c
    JOIN users u ON c.user_id = u.id
    ORDER BY c.created_at ASC
  `)
    .all()

  return rows.map((row) => ({
    userId: row.user_id,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  }))
}

/**
 * Update collaborator role
 */
export function updateCollaboratorRole(
  db: Database.Database,
  userId: string,
  role: UserRole
): void {
  db.prepare('UPDATE collaborators SET role = ? WHERE user_id = ?').run(role, userId)
}

/**
 * Delete collaborator (remove role, user remains)
 */
export function deleteCollaborator(db: Database.Database, userId: string): void {
  db.prepare('DELETE FROM collaborators WHERE user_id = ?').run(userId)
}

/**
 * Count owners
 */
export function countOwners(db: Database.Database): number {
  const result = db
    .prepare<[], { count: number }>("SELECT COUNT(*) as count FROM collaborators WHERE role = 'owner'")
    .get()

  return result?.count ?? 0
}

/**
 * Check if user is owner
 */
export function isUserOwner(db: Database.Database, userId: string): boolean {
  const collaborator = getCollaboratorByUserId(db, userId)
  return collaborator?.role === 'owner'
}

/**
 * Check if user is collaborator (any role)
 */
export function isUserCollaborator(db: Database.Database, userId: string): boolean {
  const collaborator = getCollaboratorByUserId(db, userId)
  return collaborator !== null
}

/**
 * Get or create user by email (for auth flow)
 */
export function getOrCreateUser(db: Database.Database, email: string, userId: string): User {
  const existing = getUserByEmail(db, email)
  if (existing) {
    return existing
  }

  return createUser(db, userId, email)
}

/**
 * Convert database row to User object
 */
function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash ?? undefined,
    createdAt: row.created_at,
  }
}

/**
 * Convert database row to Collaborator object
 */
function rowToCollaborator(row: CollaboratorRow): Collaborator {
  return {
    id: row.id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
  }
}
