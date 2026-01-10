/**
 * @lumo/server
 *
 * LUMO Server Package
 *
 * This file exports utilities and functions for other packages.
 * The server entry point is in main.ts.
 */

// Password utilities (for CLI and other packages)
export { hashPassword, verifyPassword, validatePassword } from './utils/password.js'

// App creation (for programmatic use)
export { createApp } from './app.js'
export type { AppOptions } from './app.js'

// Config loading
export { loadConfig } from './config.js'
export { createConfigLoader } from './config/loader.js'
export type { ConfigLoader } from './config/loader.js'

// Constants
export { ServerDefaults, SessionConfig, UserRoles } from './constants.js'

// Types re-exported for convenience
export type { LumoConfig } from '@lumo/core'
