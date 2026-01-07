/**
 * LUMO Server Entry Point
 */

import { createApp } from './app.js'
import { loadConfig } from './config.js'
import { createDatabase, closeDatabase } from '@lumo/db'
import { startCleanupScheduler, stopCleanupScheduler } from './jobs/cleanup.js'
import { createConfigLoader, type ConfigLoader } from './config/loader.js'
import { ServerDefaults } from './constants.js'
import type Database from 'better-sqlite3'

// Track resources for cleanup
let cleanupInterval: NodeJS.Timeout | null = null
let configLoader: ConfigLoader | null = null
let database: Database.Database | null = null

/**
 * Start server
 */
async function start() {
  try {
    // Load file configuration
    console.log('Loading configuration from file...')
    const configPath = process.env.LUMO_CONFIG_PATH || '../../lumo.config.ts'
    const fileConfig = await loadConfig(configPath)
    console.log('File configuration loaded successfully')

    // Create database connection
    console.log('Connecting to database...')
    const dbPath = process.env.LUMO_DB_PATH || '../../lumo.db'
    database = createDatabase({
      filename: dbPath,
    })
    console.log('Database connected')

    // Create config loader (merges file + database schemas)
    console.log('Loading schemas from database...')
    configLoader = createConfigLoader(fileConfig, database)
    const config = configLoader.getConfig()
    console.log('Configuration merged successfully')

    // Start cleanup scheduler
    cleanupInterval = startCleanupScheduler(database)

    // Create Fastify app
    console.log('Creating application...')
    const app = await createApp({ config, db: database, configLoader })

    // Start server
    const port = parseInt(process.env.PORT || String(ServerDefaults.PORT), 10)
    const host = process.env.HOST || ServerDefaults.HOST

    await app.listen({ port, host })

    console.log(`Server listening on http://${host}:${port}`)
  } catch (error) {
    console.error('Failed to start server:', error)
    await cleanup()
    process.exit(1)
  }
}

async function cleanup() {
  console.log('Cleaning up resources...')

  if (cleanupInterval) {
    stopCleanupScheduler(cleanupInterval)
    cleanupInterval = null
  }

  if (configLoader) {
    configLoader.dispose()
    configLoader = null
  }

  if (database) {
    closeDatabase(database)
    database = null
  }
}

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down...')
  await cleanup()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down...')
  await cleanup()
  process.exit(0)
})

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error)
  await cleanup()
  process.exit(1)
})

process.on('unhandledRejection', async (reason) => {
  console.error('Unhandled rejection:', reason)
  await cleanup()
  process.exit(1)
})

// Start the server
start()

/**
 * Reload configuration from database
 * Call this after making changes to schemas in the database
 */
export function reloadConfig(): void {
  if (!configLoader) {
    throw new Error('Config loader not initialized')
  }
  configLoader.reload()
  console.log('Configuration reloaded')
}
