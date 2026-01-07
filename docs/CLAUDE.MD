# CLAUDE.md — LUMO Project Instructions

> This file provides instructions for Claude Code to initialize and work on the LUMO CMS project.

---

## Project Overview

**LUMO** is a lightweight content engine (CMS) with:
- Admin UI for content editing
- Content API for frontend consumption
- Strict, opinionated content model

**LUMO is NOT:** a site builder, hosting platform, or theme system.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Admin UI | Vue 3 + TypeScript + Vite |
| Server | Node.js + TypeScript + Fastify |
| Database | SQLite (better-sqlite3) |
| Core | Pure TypeScript (no dependencies) |
| CLI | TypeScript + Commander |

---

## Project Initialization

### Step 1: Create Monorepo Structure

```bash
mkdir lumo && cd lumo
npm init -y
```

### Step 2: Install Root Dependencies

```bash
npm install -D typescript @types/node vitest prettier eslint
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### Step 3: Create Package Structure

```
lumo/
├── packages/
│   ├── core/          # Domain logic, validation, schemas
│   ├── db/            # Database adapters (SQLite)
│   ├── server/        # Fastify API server
│   ├── admin/         # Vue 3 admin application
│   └── cli/           # CLI tools
├── package.json
├── tsconfig.json
├── pnpm-workspace.yaml (or npm workspaces)
└── CLAUDE.md
```

### Step 4: Initialize Each Package

```bash
# Create directories
mkdir -p packages/{core,db,server,admin,cli}

# Initialize each package
cd packages/core && npm init -y && cd ../..
cd packages/db && npm init -y && cd ../..
cd packages/server && npm init -y && cd ../..
cd packages/admin && npm create vite@latest . -- --template vue-ts && cd ../..
cd packages/cli && npm init -y && cd ../..
```

---

## Package Dependencies

### packages/core
```bash
cd packages/core
npm install -D typescript vitest
```
**CRITICAL:** Core has ZERO runtime dependencies. No Node APIs. No external packages.

### packages/db
```bash
cd packages/db
npm install better-sqlite3
npm install -D typescript @types/better-sqlite3 vitest
```

### packages/server
```bash
cd packages/server
npm install fastify @fastify/cookie @fastify/multipart @fastify/static @fastify/cors
npm install nanoid
npm install -D typescript @types/node vitest
```

### packages/admin
```bash
cd packages/admin
npm install @tiptap/vue-3 @tiptap/starter-kit @tiptap/extension-image
npm install -D typescript vite @vitejs/plugin-vue
```

### packages/cli
```bash
cd packages/cli
npm install commander inquirer chalk
npm install -D typescript @types/node @types/inquirer
```

---

## Key Files to Create

### Root tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

### Root package.json (workspaces)
```json
{
  "name": "lumo",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "npm run dev --workspace=packages/server",
    "build": "npm run build --workspaces",
    "test": "vitest"
  }
}
```

---

## Critical Constraints (From Specs)

### Core Package Rules
1. **NO Node APIs** — Core must work in any JS environment
2. **NO external dependencies** — Pure TypeScript only
3. **NO HTTP knowledge** — Core doesn't know about requests
4. **NO database knowledge** — Core doesn't know about SQL
5. Core operates on plain data structures and returns validated objects or errors

### Schema Rules
1. Schemas are stored in the database
2. Schemas are managed by Owners through the admin UI
3. Schemas are validated when created/updated via API
4. Config file only contains: languages, defaultLanguage, media settings

### Field Types (V1)
- `text` — string
- `textarea` — string
- `richtext` — TipTap JSON string
- `image` — MediaReference object
- `gallery` — MediaReference[] array
- `url` — string (http, https, mailto, tel)
- `boolean` — boolean

### MediaReference Structure
```typescript
interface MediaReference {
  mediaId: string
  alt?: string
}
```

### Database Tables
- `pages`
- `page_translations`
- `posts`
- `post_translations`
- `page_schemas`
- `post_type_schemas`
- `media`
- `previews`
- `users`
- `collaborators`

### Authentication
- Magic link only (no passwords)
- Stateless signed cookies for sessions
- First owner created via CLI

---

## File Structure for Core Package

```
packages/core/
├── src/
│   ├── index.ts
│   ├── types.ts           # All type definitions
│   ├── schema/
│   │   ├── validate.ts    # Schema validation
│   │   └── types.ts       # Schema types
│   ├── content/
│   │   ├── page.ts        # Page validation
│   │   ├── post.ts        # Post validation
│   │   └── media.ts       # MediaReference validation
│   ├── translation/
│   │   └── validate.ts    # Translation rules
│   └── errors.ts          # Error types
├── package.json
└── tsconfig.json
```

---

## File Structure for Server Package

```
packages/server/
├── src/
│   ├── index.ts           # Entry point
│   ├── app.ts             # Fastify app setup
│   ├── config.ts          # Load lumo.config.ts
│   ├── routes/
│   │   ├── public/        # Public read API
│   │   ├── admin/         # Admin write API
│   │   ├── auth/          # Auth endpoints
│   │   └── preview/       # Preview endpoints
│   ├── middleware/
│   │   ├── auth.ts        # Session validation
│   │   └── permissions.ts # Role checks
│   ├── services/
│   │   ├── page.ts
│   │   ├── post.ts
│   │   ├── media.ts
│   │   ├── preview.ts
│   │   └── auth.ts
│   └── utils/
│       ├── token.ts       # Token signing/verification
│       └── email.ts       # Magic link emails
├── package.json
└── tsconfig.json
```

---

## Initial Implementation Order

1. **Core types** — Define all TypeScript interfaces
2. **Core schema validation** — Validate lumo.config.ts at startup
3. **Core content validation** — Validate pages, posts, translations
4. **DB schema** — Create SQLite tables
5. **DB adapters** — CRUD operations for all entities
6. **Server setup** — Fastify with routes
7. **Auth flow** — Magic link + sessions
8. **Admin UI** — Vue 3 app with TipTap editor
9. **CLI** — `lumo init` command

---

## Example lumo.config.ts

```typescript
export default {
  languages: ['en', 'fr'],
  defaultLanguage: 'en',

  media: {
    maxImageSize: 10 * 1024 * 1024,
    maxVideoSize: 100 * 1024 * 1024,
    maxAudioSize: 50 * 1024 * 1024,
    maxDocumentSize: 20 * 1024 * 1024
  }
}

// Note: pages and postTypes are NOT in config
// They are managed through the admin UI and stored in database
```

**Pages and Post Types are NOT defined in `lumo.config.ts`.**
They are created and managed by Owners through the admin UI.

---

## Specification Documents

The following documents define LUMO V1 completely:

1. **LUMO_MASTER.MD** — Product spec, content model, principles
2. **LUMO_API.MD** — Complete HTTP API surface
3. **LUMO_CORE.MD** — Domain rules and invariants
4. **LUMO_DB.MD** — Database schema
5. **LUMO_STACK.MD** — Technical stack and architecture

**Read these documents before implementing any feature.**

---

## Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build all packages
npm run test             # Run tests

# CLI (after building)
npx lumo init            # Initialize new project
npx lumo dev             # Start development mode
npx lumo add-owner       # Add first owner
```

---

## Do NOT

- Add features not in the specs
- Use ORMs (use explicit SQL)
- Add Node APIs to Core package
- Implement structured repeaters
- Add password authentication
- Auto-delete media

---

## When In Doubt

> **If Core allows it, the system may persist it.**
> **If Core rejects it, the system must stop.**

> **Lumo lets Editors manage content. Owners manage structure.**