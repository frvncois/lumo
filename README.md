# LUMO

A lightweight content engine (CMS) with a strict, opinionated content model.

## What is LUMO?

LUMO is a content management system that provides:
- A content editor (admin UI)
- A content API
- A strict, opinionated content model

LUMO is **not**:
- A site builder
- A hosting platform
- A theme system
- A page builder

> **Lumo lets clients manage content, not structure.**

## Project Structure

This is a monorepo containing the following packages:

```
lumo/
├── packages/
│   ├── core/          # Domain logic, validation, schemas (ZERO dependencies)
│   ├── db/            # Database adapters (SQLite)
│   ├── server/        # Fastify API server
│   ├── admin/         # Vue 3 admin application (TODO)
│   └── cli/           # CLI tools (TODO)
├── docs/              # Specification documents
├── lumo.config.ts     # Example configuration
└── package.json       # Root package with workspaces
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Packages

```bash
npm run build
```

### 3. Configure System Settings

Edit `lumo.config.ts` to configure languages and media limits. Content schemas (pages and post types) are managed via the admin UI and stored in the database.

### 4. Start the Development Server

```bash
npm run dev
```

The server will start on http://localhost:3000

## Package Descriptions

### @lumo/core

The domain engine. Contains:
- Type definitions
- Schema validation
- Content validation
- Business rules
- **ZERO runtime dependencies** (pure TypeScript)

### @lumo/db

Database layer. Contains:
- SQLite schema
- Database connection management
- Repository patterns
- Uses `better-sqlite3`

### @lumo/server

API server. Contains:
- Fastify application
- HTTP routes (public read, admin write, auth, preview)
- Middleware
- Services

## Configuration

The `lumo.config.ts` file defines system settings:

```typescript
export default {
  // Language configuration
  languages: ['en', 'fr'],
  defaultLanguage: 'en',

  // Media upload limits
  media: {
    maxImageSize: 10 * 1024 * 1024,
    maxVideoSize: 100 * 1024 * 1024,
    maxAudioSize: 50 * 1024 * 1024,
    maxDocumentSize: 25 * 1024 * 1024
  }
}
```

**Note:** Content schemas (pages and post types) are managed via the admin UI and stored in the database. They are automatically loaded into `app.config.pages` and `app.config.postTypes` at runtime.

## Environment Variables

```bash
# Server
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_PATH=./data/lumo.db

# Security
COOKIE_SECRET=your-secret-key

# CORS
CORS_ORIGIN=*
```

## Core Principles

1. **Content ≠ Structure** - Clients edit content, not layout
2. **Schemas are managed centrally** - Defined via admin UI, stored in database, validated strictly
3. **No structured repeaters** - Lists are modeled as collections (Posts)
4. **Explicit validation** - Core never auto-fixes, always rejects invalid data
5. **Translations duplicate content** - No field-level translations, no fallback chains

## Field Types (V1)

- `text` - Single-line text
- `textarea` - Multi-line plain text
- `richtext` - TipTap/ProseMirror JSON
- `image` - Single media reference with alt text
- `gallery` - Array of media references
- `url` - Valid URL (http, https, mailto, tel)
- `boolean` - True/false toggle

## Content Types

### Pages
- Manually created
- Always live when saved
- No draft state

### Posts
- Belong to a logical collection via `type`
- Support `draft` and `published` status
- Optional manual ordering via `position`

## Specifications

See the `docs/` folder for complete specifications:
- `LUMO_MASTER.MD` - Product spec and content model
- `LUMO_API.MD` - Complete HTTP API
- `LUMO_CORE.MD` - Domain rules and invariants
- `LUMO_DB.MD` - Database schema
- `LUMO_STACK.MD` - Technical stack
- `CLAUDE.MD` - Development instructions

## License

TBD

## Status

LUMO V1 - In Development
# lumo
