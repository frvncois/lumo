/**
 * Database Connection
 *
 * Manages SQLite database connection and initialization.
 */

import Database from 'better-sqlite3'
import fs from 'node:fs'
import { initializeSchema } from './schema.js'

/**
 * Database connection options
 */
export interface DatabaseOptions {
  filename: string
  readonly?: boolean
  fileMustExist?: boolean
  verbose?: (message?: unknown, ...additionalArgs: unknown[]) => void
}

/**
 * Create and initialize database connection
 */
export function createDatabase(options: DatabaseOptions): Database.Database {
  // Only pass defined options to better-sqlite3
  const dbOptions: Database.Options = {}
  if (options.readonly !== undefined) {
    dbOptions.readonly = options.readonly
  }
  if (options.fileMustExist !== undefined) {
    dbOptions.fileMustExist = options.fileMustExist
  }
  if (options.verbose !== undefined) {
    dbOptions.verbose = options.verbose
  }

  const db = new Database(options.filename, dbOptions)

  // Set restrictive file permissions (owner read/write only)
  if (options.filename !== ':memory:') {
    try {
      fs.chmodSync(options.filename, 0o600)
    } catch (err) {
      console.warn(`Warning: Could not set database file permissions: ${err}`)
    }
  }

  // Initialize schema if not readonly
  if (!options.readonly) {
    initializeSchema(db)
  }

  return db
}

/**
 * Create in-memory database (for testing)
 */
export function createInMemoryDatabase(): Database.Database {
  const db = new Database(':memory:')
  initializeSchema(db)
  return db
}

/**
 * Close database connection
 */
export function closeDatabase(db: Database.Database): void {
  db.close()
}
