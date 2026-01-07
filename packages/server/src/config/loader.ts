/**
 * Config Loader
 *
 * Loads configuration from file (lumo.config.ts) for system settings
 * and from database for schemas.
 */

import type Database from 'better-sqlite3'
import type { LumoConfig, PageSchema, PostTypeSchema } from '@lumo/core'
import { getAllPageSchemas, getAllPostTypeSchemas, getSetting } from '@lumo/db'

export interface ConfigLoader {
  load(): LumoConfig
  reload(): LumoConfig
  getConfig(): LumoConfig
  dispose(): void
}

/**
 * Create a config loader that loads system settings from file
 * and schemas from database
 */
export function createConfigLoader(
  fileConfig: LumoConfig,
  db: Database.Database
): ConfigLoader {
  let currentConfig: LumoConfig

  function load(): LumoConfig {
    // Load languages from database (with fallback to file config)
    const dbLanguages = getSetting<string[]>(db, 'languages')
    const dbDefaultLanguage = getSetting<string>(db, 'defaultLanguage')

    // Load database schemas
    const dbPageSchemas = getAllPageSchemas(db)
    const dbPostTypeSchemas = getAllPostTypeSchemas(db)

    // Convert to record format
    const pages: Record<string, PageSchema> = {}
    for (const schema of dbPageSchemas) {
      pages[schema.slug] = {
        slug: schema.slug,
        fields: schema.fields,
      }
    }

    const postTypes: Record<string, PostTypeSchema> = {}
    for (const schema of dbPostTypeSchemas) {
      postTypes[schema.slug] = {
        slug: schema.slug,
        name: schema.name,
        nameSingular: schema.nameSingular,
        fields: schema.fields,
      }
    }

    currentConfig = {
      // Use database languages if available, otherwise fall back to file config
      languages: dbLanguages || fileConfig.languages,
      defaultLanguage: dbDefaultLanguage || fileConfig.defaultLanguage,
      media: fileConfig.media,
      pages,
      postTypes,
    }

    return currentConfig
  }

  function reload(): LumoConfig {
    return load()
  }

  function getConfig(): LumoConfig {
    return currentConfig
  }

  function dispose(): void {
    // Clear cached config to free memory
    currentConfig = null as any
  }

  // Initial load
  load()

  return { load, reload, getConfig, dispose }
}
