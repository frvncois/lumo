/**
 * LUMO Server Entry Point
 */

import { createApp } from './app.js'
import { loadConfig } from './config.js'
import { createDatabase } from '@lumo/db'
import { startCleanupScheduler } from './jobs/cleanup.js'
import { createConfigLoader, type ConfigLoader } from './config/loader.js'

// Store cleanup interval for graceful shutdown
let cleanupInterval: NodeJS.Timeout | null = null

// Store config loader globally for reload access
let globalConfigLoader: ConfigLoader | null = null

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
    const db = createDatabase({
      filename: dbPath,
    })
    console.log('Database connected')

    // Create config loader (merges file + database schemas)
    console.log('Loading schemas from database...')
    const configLoader = createConfigLoader(fileConfig, db)
    globalConfigLoader = configLoader
    const config = configLoader.getConfig()
    console.log('Configuration merged successfully')

    // Start cleanup scheduler
    cleanupInterval = startCleanupScheduler(db)

    // Create Fastify app
    console.log('Creating application...')
    const app = await createApp({ config, db, configLoader })

    // Start server
    const port = parseInt(process.env.PORT || '3000', 10)
    const host = process.env.HOST || '0.0.0.0'

    await app.listen({ port, host })

    console.log(`Server listening on http://${host}:${port}`)
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('Shutting down...')
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
  }
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Shutting down...')
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
  }
  process.exit(0)
})

// Start the server
start()

/**
 * Reload configuration from database
 * Call this after making changes to schemas in the database
 */
export function reloadConfig(): void {
  if (!globalConfigLoader) {
    throw new Error('Config loader not initialized')
  }
  globalConfigLoader.reload()
  console.log('Configuration reloaded')
}
