import path from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'
import prompts from 'prompts'
import { randomBytes } from 'node:crypto'
import { hashPassword, validatePassword } from '@lumo/server'

function generateId(prefix: string = ''): string {
  const random = randomBytes(16).toString('hex')
  return prefix ? `${prefix}_${random}` : random
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function addOwnerCommand(email: string) {
  console.log(chalk.bold.blue('👤 Adding LUMO Owner\\n'))

  const cwd = process.cwd()
  const dbPath = path.join(cwd, 'lumo.db')

  // Check if database exists
  if (!fs.existsSync(dbPath)) {
    console.error(chalk.red('❌ lumo.db not found. Run `lumo init` first.'))
    process.exit(1)
  }

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim()

  // Validate email
  if (!validateEmail(normalizedEmail)) {
    console.error(chalk.red('❌ Invalid email address'))
    process.exit(1)
  }

  // Prompt for password
  const response = await prompts({
    type: 'password',
    name: 'password',
    message: 'Enter password:',
    validate: (value) => {
      const validation = validatePassword(value)
      return validation.valid ? true : validation.error!
    },
  })

  if (!response.password) {
    console.log(chalk.yellow('Operation cancelled.'))
    process.exit(0)
  }

  try {
    const Database = await import('better-sqlite3')
    const db = new Database.default(dbPath)

    // Hash password
    const passwordHash = await hashPassword(response.password)

    // Check if user already exists
    const existingUser = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(normalizedEmail) as { id: string } | undefined

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      console.log(chalk.yellow(`⚠️  User with email ${normalizedEmail} already exists`))

      // Update password
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, userId)
      console.log(chalk.green(`✓ Updated password for ${normalizedEmail}`))

      // Check if already a collaborator
      const existingCollaborator = db
        .prepare('SELECT role FROM collaborators WHERE user_id = ?')
        .get(userId) as { role: string } | undefined

      if (existingCollaborator) {
        if (existingCollaborator.role === 'owner') {
          console.log(chalk.green(`✓ User is already an owner`))
          db.close()
          return
        } else {
          // Update role to owner
          db.prepare('UPDATE collaborators SET role = ? WHERE user_id = ?').run('owner', userId)
          console.log(chalk.green(`✓ Updated user role from ${existingCollaborator.role} to owner`))
          db.close()
          return
        }
      }
    } else {
      // Create new user
      userId = generateId('usr')
      db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(
        userId,
        normalizedEmail,
        passwordHash
      )
      console.log(chalk.green(`✓ Created user: ${normalizedEmail}`))
    }

    // Add as owner
    db.prepare('INSERT INTO collaborators (user_id, role) VALUES (?, ?)').run(userId, 'owner')
    console.log(chalk.green(`✓ Added ${normalizedEmail} as owner`))

    db.close()

    console.log(chalk.bold.green('\\n✅ Owner added successfully!\\n'))
    console.log(chalk.dim('Next steps:'))
    console.log(chalk.dim('  1. Run: lumo dev to start the development server'))
    console.log(chalk.dim(`  2. Sign in at http://localhost:5173/admin with your email and password`))
  } catch (error) {
    console.error(chalk.red('\\n❌ Failed to add owner:'), error)
    process.exit(1)
  }
}
