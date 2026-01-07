/**
 * Cleanup Jobs
 *
 * Background jobs for cleaning up expired data.
 */

import type Database from 'better-sqlite3'
import { deleteExpiredPreviews } from '@lumo/db'

/**
 * Delete expired preview snapshots
 */
export function cleanupExpiredPreviews(db: Database.Database): void {
  const deletedCount = deleteExpiredPreviews(db)

  if (deletedCount > 0) {
    console.log(`[Cleanup] Deleted ${deletedCount} expired preview${deletedCount === 1 ? '' : 's'}`)
  }
}

/**
 * Start cleanup scheduler
 * Runs immediately on start, then every 10 minutes
 */
export function startCleanupScheduler(db: Database.Database): NodeJS.Timeout {
  // Run immediately on startup
  console.log('[Cleanup] Starting cleanup scheduler')
  cleanupExpiredPreviews(db)

  // Then run every 10 minutes
  const interval = setInterval(() => {
    cleanupExpiredPreviews(db)
  }, 10 * 60 * 1000) // 10 minutes in milliseconds

  return interval
}
