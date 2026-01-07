/**
 * Database Transaction Utilities
 */

import type Database from 'better-sqlite3'

/**
 * Execute multiple operations in a transaction
 * Automatically rolls back on error
 */
export function withTransaction<T>(
  db: Database.Database,
  fn: () => T
): T {
  const transaction = db.transaction(fn)
  return transaction()
}

/**
 * Execute async operations with manual transaction control
 * For operations that include async steps between DB calls
 */
export function beginTransaction(db: Database.Database): void {
  db.exec('BEGIN TRANSACTION')
}

export function commitTransaction(db: Database.Database): void {
  db.exec('COMMIT')
}

export function rollbackTransaction(db: Database.Database): void {
  db.exec('ROLLBACK')
}
