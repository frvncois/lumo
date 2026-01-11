/**
 * Database Backup Command
 *
 * Creates a backup of the SQLite database
 */

import Database from 'better-sqlite3'
import { resolve, dirname, basename } from 'path'
import { existsSync, mkdirSync, copyFileSync } from 'fs'

export interface BackupOptions {
  dbPath?: string
  outputDir?: string
  timestamp?: boolean
}

export async function backup(options: BackupOptions = {}) {
  const dbPath = options.dbPath || resolve(process.cwd(), 'lumo.db')
  const outputDir = options.outputDir || resolve(process.cwd(), 'backups')
  const useTimestamp = options.timestamp ?? true

  console.log(`Database path: ${dbPath}`)

  // Check if database exists
  if (!existsSync(dbPath)) {
    console.error(`Error: Database file not found at ${dbPath}`)
    process.exit(1)
  }

  // Create backups directory if it doesn't exist
  if (!existsSync(outputDir)) {
    console.log(`Creating backups directory: ${outputDir}`)
    mkdirSync(outputDir, { recursive: true })
  }

  // Generate backup filename
  const dbBasename = basename(dbPath, '.db')
  const timestamp = useTimestamp ? `-${new Date().toISOString().replace(/[:.]/g, '-')}` : ''
  const backupFilename = `${dbBasename}${timestamp}.backup.db`
  const backupPath = resolve(outputDir, backupFilename)

  try {
    console.log('Opening database...')
    const db = new Database(dbPath, { readonly: true })

    // Use SQLite VACUUM INTO for atomic backup
    console.log('Creating backup...')
    const startTime = Date.now()

    // VACUUM INTO creates a clean, optimized copy
    db.exec(`VACUUM INTO '${backupPath.replace(/'/g, "''")}'`)

    const duration = Date.now() - startTime

    db.close()

    console.log(`✅ Backup created successfully in ${duration}ms`)
    console.log(`   Location: ${backupPath}`)

    // Get file sizes
    const fs = await import('fs/promises')
    const originalStat = await fs.stat(dbPath)
    const backupStat = await fs.stat(backupPath)

    console.log(`   Original size: ${formatBytes(originalStat.size)}`)
    console.log(`   Backup size: ${formatBytes(backupStat.size)}`)

    if (backupStat.size < originalStat.size) {
      const savings = ((originalStat.size - backupStat.size) / originalStat.size) * 100
      console.log(`   Space saved: ${savings.toFixed(1)}% (VACUUM optimization)`)
    }

  } catch (error) {
    console.error('Error creating backup:', error)
    process.exit(1)
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
