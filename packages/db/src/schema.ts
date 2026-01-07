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
  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Create tables
  createPagesTables(db)
  createPostsTables(db)
  createSchemasTables(db)
  createMediaTable(db)
  createPreviewsTable(db)
  createUsersTables(db)

  // Create indexes
  createIndexes(db)
}

/**
 * Create pages tables
 */
function createPagesTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    );
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS page_translations (
      id TEXT PRIMARY KEY,
      page_id TEXT NOT NULL,
      language TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      fields TEXT NOT NULL,
      updated_at DATETIME NOT NULL,

      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
      UNIQUE (page_id, language),
      UNIQUE (language, slug)
    );
  `)
}

/**
 * Create posts tables
 */
function createPostsTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
      position INTEGER,
      published_at DATETIME,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    );
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS post_translations (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      language TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      fields TEXT NOT NULL,
      updated_at DATETIME NOT NULL,

      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      UNIQUE (post_id, language)
    );
  `)
}

/**
 * Create schemas tables
 */
function createSchemasTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS page_schemas (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      fields TEXT NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    );
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS post_type_schemas (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      name_singular TEXT NOT NULL,
      fields TEXT NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    );
  `)
}

/**
 * Create media table
 */
function createMediaTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      duration INTEGER,
      created_at DATETIME NOT NULL
    );
  `)
}

/**
 * Create previews table
 */
function createPreviewsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS previews (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      target_type TEXT NOT NULL CHECK (target_type IN ('page', 'post')),
      target_id TEXT,
      post_type TEXT,
      language TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      fields TEXT NOT NULL,
      created_by TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL,

      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );
  `)
}

/**
 * Create users tables
 */
function createUsersTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      created_at DATETIME NOT NULL
    );
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS collaborators (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('owner', 'editor')),
      created_at DATETIME NOT NULL,

      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (user_id)
    );
  `)
}

/**
 * Create indexes
 */
function createIndexes(db: Database.Database): void {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_page_translations_page_id
      ON page_translations(page_id);
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_post_translations_post_id
      ON post_translations(post_id);
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_posts_type
      ON posts(type);
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_posts_status
      ON posts(status);
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_posts_position
      ON posts(position);
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_posts_published_at
      ON posts(published_at);
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_media_mime_type
      ON media(mime_type);
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_previews_token
      ON previews(token);
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_previews_expires_at
      ON previews(expires_at);
  `)
}

/**
 * Drop all tables (for testing)
 */
export function dropSchema(db: Database.Database): void {
  db.exec(`
    DROP TABLE IF EXISTS collaborators;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS previews;
    DROP TABLE IF EXISTS media;
    DROP TABLE IF EXISTS post_type_schemas;
    DROP TABLE IF EXISTS page_schemas;
    DROP TABLE IF EXISTS post_translations;
    DROP TABLE IF EXISTS posts;
    DROP TABLE IF EXISTS page_translations;
    DROP TABLE IF EXISTS pages;
  `)
}
