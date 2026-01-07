/**
 * Configuration Loader
 *
 * Loads and validates lumo.config.ts at startup.
 */

import type { LumoConfig } from '@lumo/core'
import { validateConfig } from '@lumo/core'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

/**
 * Load Lumo configuration from file
 */
export async function loadConfig(configPath: string = './lumo.config.ts'): Promise<LumoConfig> {
  try {
    const absolutePath = resolve(configPath)
    const fileUrl = pathToFileURL(absolutePath).href

    // Dynamic import the config file
    const module = await import(fileUrl)
    const config = module.default as LumoConfig

    if (!config) {
      throw new Error('lumo.config.ts must export a default configuration object')
    }

    // Validate configuration
    validateConfig(config)

    return config
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load configuration: ${error.message}`)
    }
    throw error
  }
}
