/**
 * Settings Adapter
 *
 * CRUD operations for dynamic settings stored in database.
 */

import type Database from 'better-sqlite3'

export interface SettingRow {
  key: string
  value: string // JSON string
  updated_at: string
}

/**
 * Get a setting value by key
 */
export function getSetting<T>(db: Database.Database, key: string): T | null {
  const row = db
    .prepare<[string], SettingRow>('SELECT * FROM settings WHERE key = ?')
    .get(key)

  if (!row) {
    return null
  }

  return JSON.parse(row.value) as T
}

/**
 * Set a setting value
 */
export function setSetting<T>(db: Database.Database, key: string, value: T): void {
  const now = new Date().toISOString()
  const valueJson = JSON.stringify(value)

  db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `).run(key, valueJson, now)
}

/**
 * Get all settings as an object
 */
export function getAllSettings(db: Database.Database): Record<string, any> {
  const rows = db
    .prepare<[], SettingRow>('SELECT * FROM settings')
    .all()

  const settings: Record<string, any> = {}
  for (const row of rows) {
    settings[row.key] = JSON.parse(row.value)
  }

  return settings
}

/**
 * Delete a setting
 */
export function deleteSetting(db: Database.Database, key: string): boolean {
  const result = db
    .prepare('DELETE FROM settings WHERE key = ?')
    .run(key)

  return result.changes > 0
}
