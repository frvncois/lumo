/**
 * Database Schema (V1)
 *
 * SQLite schema for LUMO CMS.
 * Implements storage for the domain model defined in @lumo/core.
 */

import type Database from 'better-sqlite3'

/**
 * Initialize database schema
 */
export function initializeSchema(db: Database.Database): void {
  db.exec(`
    -- Page schemas (managed by owners)
    CREATE TABLE IF NOT EXISTS page_schemas (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      fields TEXT NOT NULL, -- JSON array of field definitions
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Post type schemas (managed by owners)
    CREATE TABLE IF NOT EXISTS post_type_schemas (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      name_singular TEXT NOT NULL,
      fields TEXT NOT NULL, -- JSON array of field definitions
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Global schemas (managed by owners)
    CREATE TABLE IF NOT EXISTS global_schemas (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      fields TEXT NOT NULL, -- JSON array of field definitions
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Globals (one instance per schema)
    CREATE TABLE IF NOT EXISTS globals (
      id TEXT PRIMARY KEY,
      schema_slug TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (schema_slug) REFERENCES global_schemas(slug) ON DELETE CASCADE
    );

    -- Global translations
    CREATE TABLE IF NOT EXISTS global_translations (
      id TEXT PRIMARY KEY,
      global_id TEXT NOT NULL,
      lang TEXT NOT NULL,
      fields TEXT NOT NULL, -- JSON object
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (global_id) REFERENCES globals(id) ON DELETE CASCADE,
      UNIQUE(global_id, lang)
    );

    CREATE INDEX IF NOT EXISTS idx_global_translation_lang ON global_translations(lang);
    -- Composite index for global translation lookups by global_id and lang
    CREATE INDEX IF NOT EXISTS idx_global_translations_global_lang ON global_translations(global_id, lang);

    -- Pages
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      schema_slug TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (schema_slug) REFERENCES page_schemas(slug) ON DELETE RESTRICT
    );

    -- Page translations
    CREATE TABLE IF NOT EXISTS page_translations (
      page_id TEXT NOT NULL,
      language TEXT NOT NULL,
      slug TEXT NOT NULL,
      content TEXT NOT NULL, -- JSON object with title and fields
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (page_id, language),
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_page_translation_slug ON page_translations(slug, language);

    -- Index for page translation lookups by page_id
    CREATE INDEX IF NOT EXISTS idx_page_translation_page_id ON page_translations(page_id);

    -- Posts
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
      position INTEGER,
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (type) REFERENCES post_type_schemas(slug) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_post_type ON posts(type);
    CREATE INDEX IF NOT EXISTS idx_post_status ON posts(status);

    -- Post translations
    CREATE TABLE IF NOT EXISTS post_translations (
      post_id TEXT NOT NULL,
      language TEXT NOT NULL,
      slug TEXT NOT NULL,
      content TEXT NOT NULL, -- JSON object with title and fields
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (post_id, language),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_post_translation_slug ON post_translations(slug, language);

    -- Composite index for post queries with type and status
    CREATE INDEX IF NOT EXISTS idx_post_type_status_published ON posts(type, status, published_at DESC);

    -- Index for post translation lookups by post_id
    CREATE INDEX IF NOT EXISTS idx_post_translation_post_id ON post_translations(post_id);

    -- Media
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      duration REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Index for media type filtering and sorting
    CREATE INDEX IF NOT EXISTS idx_media_mime_created ON media(mime_type, created_at DESC);

    -- Previews
    CREATE TABLE IF NOT EXISTS previews (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      target_type TEXT NOT NULL CHECK (target_type IN ('page', 'post')),
      target_id TEXT,
      post_type TEXT,
      language TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      fields TEXT NOT NULL, -- JSON object
      created_by TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_preview_token ON previews(token);
    CREATE INDEX IF NOT EXISTS idx_preview_expires ON previews(expires_at);

    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      password_changed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Collaborators
    CREATE TABLE IF NOT EXISTS collaborators (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('owner', 'editor')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_collaborator_role ON collaborators(role);

    -- Settings
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Insert default settings if not exist
    INSERT OR IGNORE INTO settings (key, value) VALUES ('languages', '["en"]');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('defaultLanguage', '"en"');
  `)

  // Migration: Add schema_slug to pages if missing
  const pageColumns = db.prepare("PRAGMA table_info(pages)").all() as Array<{ name: string }>
  const hasSchemaSlug = pageColumns.some(col => col.name === 'schema_slug')

  if (!hasSchemaSlug) {
    console.log('[Migration] Adding schema_slug column to pages table')

    // Add column (nullable first for migration)
    db.exec('ALTER TABLE pages ADD COLUMN schema_slug TEXT')

    // Backfill: In current LUMO design, page.id is used to determine schema
    // For existing databases, we need to derive schema_slug from page data
    // The safe approach is to look at page_translations to infer the schema
    const pages = db.prepare('SELECT id FROM pages').all() as Array<{ id: string }>

    for (const page of pages) {
      // Get the first translation to infer schema from slug pattern
      const translation = db.prepare('SELECT slug FROM page_translations WHERE page_id = ? LIMIT 1')
        .get(page.id) as { slug: string } | undefined

      if (translation) {
        // In LUMO, page slug matches schema slug (simple 1:1 relationship)
        // For migration, use the translation slug as schema_slug
        db.prepare('UPDATE pages SET schema_slug = ? WHERE id = ?')
          .run(translation.slug, page.id)
      }
    }

    // Verify all pages now have schema_slug
    const nullCount = db.prepare('SELECT COUNT(*) as count FROM pages WHERE schema_slug IS NULL')
      .get() as { count: number }

    if (nullCount.count > 0) {
      throw new Error(`Migration failed: ${nullCount.count} pages still have NULL schema_slug`)
    }

    console.log('[Migration] schema_slug column added and backfilled for', pages.length, 'pages')
  }

  // Migration: Add unique constraints on (language, slug) for post_translations and page_translations
  // This prevents duplicate slugs within the same language
  const postIndexes = db.prepare("PRAGMA index_list(post_translations)").all() as Array<{ name: string, unique: number }>
  const hasPostSlugUnique = postIndexes.some(idx => idx.name === 'idx_post_translation_unique_slug' && idx.unique === 1)

  if (!hasPostSlugUnique) {
    console.log('[Migration] Adding UNIQUE constraint to post_translations(language, slug)')

    // Check for existing duplicates before adding constraint
    const postDupes = db.prepare(`
      SELECT language, slug, COUNT(*) as count
      FROM post_translations
      GROUP BY language, slug
      HAVING count > 1
    `).all() as Array<{ language: string, slug: string, count: number }>

    if (postDupes.length > 0) {
      console.error('[Migration] ERROR: Found duplicate post slugs. Run "lumo repair-duplicates --live" first.')
      console.error('Duplicates found:')
      for (const dupe of postDupes) {
        console.error(`  - Language: ${dupe.language}, Slug: "${dupe.slug}", Count: ${dupe.count}`)
      }
      throw new Error('Cannot add UNIQUE constraint: duplicate slugs exist in post_translations')
    }

    db.exec('CREATE UNIQUE INDEX idx_post_translation_unique_slug ON post_translations(language, slug)')
    console.log('[Migration] UNIQUE constraint added to post_translations(language, slug)')
  }

  const pageIndexes = db.prepare("PRAGMA index_list(page_translations)").all() as Array<{ name: string, unique: number }>
  const hasPageSlugUnique = pageIndexes.some(idx => idx.name === 'idx_page_translation_unique_slug' && idx.unique === 1)

  if (!hasPageSlugUnique) {
    console.log('[Migration] Adding UNIQUE constraint to page_translations(language, slug)')

    // Check for existing duplicates before adding constraint
    const pageDupes = db.prepare(`
      SELECT language, slug, COUNT(*) as count
      FROM page_translations
      GROUP BY language, slug
      HAVING count > 1
    `).all() as Array<{ language: string, slug: string, count: number }>

    if (pageDupes.length > 0) {
      console.error('[Migration] ERROR: Found duplicate page slugs. Run "lumo repair-duplicates --live" first.')
      console.error('Duplicates found:')
      for (const dupe of pageDupes) {
        console.error(`  - Language: ${dupe.language}, Slug: "${dupe.slug}", Count: ${dupe.count}`)
      }
      throw new Error('Cannot add UNIQUE constraint: duplicate slugs exist in page_translations')
    }

    db.exec('CREATE UNIQUE INDEX idx_page_translation_unique_slug ON page_translations(language, slug)')
    console.log('[Migration] UNIQUE constraint added to page_translations(language, slug)')
  }
}

/**
 * Drop all tables (for testing)
 */
export function dropSchema(db: Database.Database): void {
  db.exec(`
    DROP TABLE IF EXISTS settings;
    DROP TABLE IF EXISTS collaborators;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS previews;
    DROP TABLE IF EXISTS media;
    DROP TABLE IF EXISTS post_translations;
    DROP TABLE IF EXISTS posts;
    DROP TABLE IF EXISTS post_type_schemas;
    DROP TABLE IF EXISTS global_translations;
    DROP TABLE IF EXISTS globals;
    DROP TABLE IF EXISTS global_schemas;
    DROP TABLE IF EXISTS page_translations;
    DROP TABLE IF EXISTS pages;
    DROP TABLE IF EXISTS page_schemas;
  `)
}
