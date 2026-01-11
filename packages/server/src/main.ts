#!/usr/bin/env node
/**
 * LUMO Server Entry Point
 *
 * This file is the executable entry point for the server.
 * It imports from index.ts and calls start().
 *
 * DO NOT import this file from other packages.
 * Other packages should import from '@lumo/server' (index.ts).
 */

import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createApp } from './app.js'
import { loadConfig } from './config.js'
import { createDatabase, closeDatabase } from '@lumo/db'
import { startCleanupScheduler, stopCleanupScheduler } from './jobs/cleanup.js'
import { createConfigLoader, type ConfigLoader } from './config/loader.js'
import { ServerDefaults } from './constants.js'
import { validateEnvironment, printValidationResults } from './utils/env.js'
import type Database from 'better-sqlite3'

// Track resources for cleanup
let cleanupInterval: NodeJS.Timeout | null = null
let configLoader: ConfigLoader | null = null
let database: Database.Database | null = null
let fastifyApp: Awaited<ReturnType<typeof createApp>> | null = null

/**
 * Get or create the cookie secret.
 *
 * Priority:
 * 1. COOKIE_SECRET environment variable (for production/containers)
 * 2. .lumo-secret file (auto-generated, stored alongside DB)
 *
 * The secret is stored in a separate file, NOT the database.
 * This way, a database leak doesn't expose the signing secret.
 */
function getOrCreateCookieSecret(dbPath: string): string {
  // 1. Check environment variable first (highest priority)
  if (process.env.COOKIE_SECRET) {
    return process.env.COOKIE_SECRET
  }

  // 2. Check/create secret file alongside the database
  const secretPath = join(dirname(dbPath), '.lumo-secret')

  if (existsSync(secretPath)) {
    const secret = readFileSync(secretPath, 'utf-8').trim()
    if (secret.length >= 32) {
      return secret
    }
    // Invalid secret file, regenerate
  }

  // Generate new secure secret
  const secret = randomBytes(32).toString('hex')

  try {
    writeFileSync(secretPath, secret, { mode: 0o600 }) // Read/write only for owner
    console.log(`Generated new cookie secret: ${secretPath}`)
    console.log('Add .lumo-secret to your .gitignore!')
  } catch (err) {
    console.error('Warning: Could not write .lumo-secret file:', err)
    console.error('Using ephemeral secret (sessions will invalidate on restart)')
  }

  return secret
}

/**
 * Start server
 */
async function start() {
  try {
    // Validate environment variables
    console.log('Validating environment...')
    const envValidation = validateEnvironment()
    printValidationResults(envValidation)

    if (!envValidation.valid) {
      console.error('Cannot start server with invalid environment configuration')
      process.exit(1)
    }

    // Load file configuration
    console.log('Loading configuration from file...')
    const configPath = process.env.LUMO_CONFIG_PATH || './lumo.config.ts'
    const fileConfig = await loadConfig(configPath)
    console.log('File configuration loaded successfully')

    // Create database connection
    console.log('Connecting to database...')
    const dbPath = process.env.LUMO_DB_PATH || './lumo.db'
    database = createDatabase({
      filename: dbPath,
    })
    console.log('Database connected')

    // Get or create cookie secret (stored in file, not DB)
    const cookieSecret = getOrCreateCookieSecret(dbPath)
    process.env.COOKIE_SECRET = cookieSecret

    // Create config loader (merges file + database schemas)
    console.log('Loading schemas from database...')
    configLoader = createConfigLoader(fileConfig, database)
    const config = configLoader.getConfig()
    console.log('Configuration merged successfully')

    // Start cleanup scheduler
    cleanupInterval = startCleanupScheduler(database)

    // Create Fastify app
    console.log('Creating application...')
    fastifyApp = await createApp({ config, db: database, configLoader })

    // Start server
    const port = parseInt(process.env.PORT || String(ServerDefaults.PORT), 10)
    const host = process.env.HOST || ServerDefaults.HOST

    await fastifyApp.listen({ port, host })

    console.log(`Server listening on http://${host}:${port}`)
  } catch (error) {
    console.error('Failed to start server:', error)
    await cleanup()
    process.exit(1)
  }
}

/**
 * Cleanup resources
 */
async function cleanup() {
  console.log('Cleaning up resources...')

  // Close Fastify server gracefully (stop accepting new connections)
  if (fastifyApp) {
    try {
      console.log('Closing HTTP server...')
      await fastifyApp.close()
      console.log('HTTP server closed')
      fastifyApp = null
    } catch (err) {
      console.error('Error closing HTTP server:', err)
    }
  }

  // Stop scheduled jobs
  if (cleanupInterval) {
    stopCleanupScheduler(cleanupInterval)
    cleanupInterval = null
  }

  // Dispose config loader
  if (configLoader) {
    configLoader.dispose()
    configLoader = null
  }

  // Close database connection
  if (database) {
    closeDatabase(database)
    database = null
  }

  console.log('Cleanup complete')
}

// Handle shutdown signals
process.on('SIGINT', async () => {
  await cleanup()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await cleanup()
  process.exit(0)
})

// Start the server
start()
