import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import prompts from 'prompts'
import chalk from 'chalk'
import { createDatabase, closeDatabase } from '@lumo/db'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEFAULT_CONFIG = `export default {
  // Languages are managed in Settings (Admin UI)
  // These are fallback values used if database settings are not found
  languages: ['en'],
  defaultLanguage: 'en',

  media: {
    maxImageSize: 10 * 1024 * 1024,
    maxVideoSize: 100 * 1024 * 1024,
    maxAudioSize: 50 * 1024 * 1024,
    maxDocumentSize: 20 * 1024 * 1024
  }
}
`

export async function initCommand() {
  console.log(chalk.bold('Initialize LUMO Project'))
  console.log()

  const cwd = process.cwd()
  const configPath = path.join(cwd, 'lumo.config.ts')
  const dbPath = path.join(cwd, 'lumo.db')

  // Check if config already exists
  if (fs.existsSync(configPath)) {
    const response = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: 'lumo.config.ts already exists. Overwrite?',
      initial: false,
    })

    if (!response.overwrite) {
      console.log(chalk.dim('Cancelled.'))
      return
    }
  }

  // Check if database already exists
  if (fs.existsSync(dbPath)) {
    const response = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: 'lumo.db already exists. Overwrite? (All data will be lost)',
      initial: false,
    })

    if (!response.overwrite) {
      console.log(chalk.dim('Cancelled.'))
      return
    }
  }

  try {
    // Create config file
    fs.writeFileSync(configPath, DEFAULT_CONFIG, 'utf-8')
    console.log(chalk.green('✓ Created lumo.config.ts'))

    // Create database using @lumo/db
    const db = createDatabase({ filename: dbPath })
    closeDatabase(db)
    console.log(chalk.green('✓ Created lumo.db'))

    console.log()
    console.log(chalk.green('✅ Lumo initialized!'))
    console.log()
    console.log(chalk.bold('Next steps:'))
    console.log(chalk.dim('  1. Run: lumo dev'))
    console.log(chalk.dim('  2. Visit: http://localhost:5173/admin/setup'))
    console.log(chalk.dim('  3. Create your admin account'))
    console.log(chalk.dim('  4. Go to Schema Editor to create your first page or post type'))
    console.log()
  } catch (error) {
    console.error(chalk.red('\\nError: Initialization failed'))
    console.error(chalk.dim(String(error)))
    process.exit(1)
  }
}
