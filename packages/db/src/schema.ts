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

    -- Pages
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
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

    -- Posts
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
      position INTEGER,
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (type) REFERENCES post_type_schemas(slug)
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
      FOREIGN KEY (created_by) REFERENCES users(id)
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
    DROP TABLE IF EXISTS page_translations;
    DROP TABLE IF EXISTS pages;
    DROP TABLE IF EXISTS page_schemas;
  `)
}
