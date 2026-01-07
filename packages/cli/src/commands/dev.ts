import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'

export async function devCommand() {
  console.log(chalk.bold('LUMO Development Server'))
  console.log()

  const cwd = process.cwd()
  const configPath = path.join(cwd, 'lumo.config.ts')
  const dbPath = path.join(cwd, 'lumo.db')

  // Check if project is initialized
  if (!fs.existsSync(configPath)) {
    console.error(chalk.red('Error: lumo.config.ts not found'))
    console.error(chalk.dim('Run: lumo init'))
    process.exit(1)
  }

  if (!fs.existsSync(dbPath)) {
    console.error(chalk.red('Error: lumo.db not found'))
    console.error(chalk.dim('Run: lumo init'))
    process.exit(1)
  }

  // Check if users exist
  let hasUsers = false
  try {
    const Database = await import('better-sqlite3')
    const db = new Database.default(dbPath)
    const result = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
    hasUsers = result.count > 0
    db.close()
  } catch (error) {
    console.error(chalk.red('Error: Failed to check database'))
    console.error(chalk.dim(String(error)))
    process.exit(1)
  }

  // Find the LUMO packages
  // Assumes CLI is installed in node_modules/@lumo/cli or is in a monorepo
  const cliDir = path.dirname(new URL(import.meta.url).pathname)
  const packagesDir = path.resolve(cliDir, '../../../')

  const serverDir = path.join(packagesDir, 'server')
  const adminDir = path.join(packagesDir, 'admin')

  // Check if packages exist
  if (!fs.existsSync(serverDir)) {
    console.error(chalk.red('Error: @lumo/server package not found'))
    console.error(chalk.dim(`Expected at: ${serverDir}`))
    process.exit(1)
  }

  if (!fs.existsSync(adminDir)) {
    console.error(chalk.red('Error: @lumo/admin package not found'))
    console.error(chalk.dim(`Expected at: ${adminDir}`))
    process.exit(1)
  }

  // Start server in development mode
  console.log(chalk.cyan('→ Starting API server...'))
  const server = spawn('npm', ['run', 'dev'], {
    cwd: serverDir,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      LUMO_CONFIG_PATH: configPath,
      LUMO_DB_PATH: dbPath,
    },
  })

  // Start admin in development mode
  console.log(chalk.cyan('→ Starting admin UI...'))
  const admin = spawn('npm', ['run', 'dev'], {
    cwd: adminDir,
    stdio: 'inherit',
    shell: true,
  })

  // Handle graceful shutdown
  const cleanup = () => {
    console.log(chalk.dim('\\nShutting down...'))
    server.kill()
    admin.kill()
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  // Handle child process exits
  server.on('exit', (code) => {
    console.error(chalk.red(`\\nServer exited with code ${code}`))
    admin.kill()
    process.exit(code || 1)
  })

  admin.on('exit', (code) => {
    console.error(chalk.red(`\\nAdmin exited with code ${code}`))
    server.kill()
    process.exit(code || 1)
  })

  console.log()
  console.log(chalk.green('✓ Server ready'))
  console.log()
  console.log(chalk.bold('Local:'))
  console.log(chalk.cyan('  API:   ') + 'http://localhost:3000')

  if (hasUsers) {
    console.log(chalk.cyan('  Admin: ') + 'http://localhost:5173/admin')
  } else {
    console.log(chalk.cyan('  Setup: ') + 'http://localhost:5173/admin/setup')
    console.log()
    console.log(chalk.dim('  Create your admin account to get started'))
  }

  console.log()
  console.log(chalk.dim('Press Ctrl+C to stop'))
  console.log()
}
