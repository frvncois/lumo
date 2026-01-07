import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import prompts from 'prompts'
import chalk from 'chalk'

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

const SQL_SCHEMA = `-- LUMO Database Schema

-- Pages
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS page_translations (
  page_id TEXT NOT NULL,
  language TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL, -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (page_id, language),
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_page_slug ON page_translations(language, slug);

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  published_at TEXT,
  position INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS post_translations (
  post_id TEXT NOT NULL,
  language TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL, -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (post_id, language),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_post_type_status ON posts(type, status);
CREATE INDEX IF NOT EXISTS idx_post_published_at ON posts(published_at);
CREATE INDEX IF NOT EXISTS idx_post_position ON posts(position);

-- Page Schemas
CREATE TABLE IF NOT EXISTS page_schemas (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  fields TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Post Type Schemas
CREATE TABLE IF NOT EXISTS post_type_schemas (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_singular TEXT NOT NULL,
  fields TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Media
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Previews
CREATE TABLE IF NOT EXISTS previews (
  token TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('page', 'post')),
  content TEXT NOT NULL, -- JSON snapshot
  language TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_preview_expires ON previews(expires_at);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Collaborators (user permissions)
CREATE TABLE IF NOT EXISTS collaborators (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_collaborator_role ON collaborators(role);

-- Settings (key-value storage for dynamic configuration)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL, -- JSON value
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insert default language settings (if not exists)
INSERT OR IGNORE INTO settings (key, value) VALUES ('languages', '["en"]');
INSERT OR IGNORE INTO settings (key, value) VALUES ('defaultLanguage', '"en"');
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

    // Create database
    const Database = await import('better-sqlite3')
    const db = new Database.default(dbPath)
    db.exec(SQL_SCHEMA)
    db.close()
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
