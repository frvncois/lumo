# LUMO — STACK (V1)

>
> This document defines the **technical stack choices** for Lumo V1 and the rationale
> behind them. Any deviation must be justified against the product principles
> defined in `MASTER.md`.

---

## 1. Overview

Lumo is built with a **boring, proven, minimal stack** optimized for:
- embedded usage
- agency workflows
- client safety
- long-term maintainability

The stack is intentionally conservative and explicit.

---

## 2. Core Stack

### 2.1 Admin UI

**Vue 3 + TypeScript**

- Dedicated admin application
- Served by the Lumo server
- Mounted under `/admin`
- Not shared with the frontend site

**Build tooling:** Vite

> The admin UI is a standalone app, not a plugin or shared component library.

---

### 2.2 Server Runtime

**Node.js + TypeScript**

- Single long-running server
- Handles:
  - Admin UI serving
  - Content API
  - Auth & sessions
  - Media uploads
  - Preview management

**HTTP framework:** Fastify

TypeScript is mandatory across the server.

---

### 2.3 Authentication

**Initial Setup:**

* First owner created via `/admin/setup` (email + password)
* No default admin credentials
* Password-based authentication

**Authentication Flow:**

1. User enters email and password at `/admin/login`
2. Server verifies credentials against stored hash
3. On success, session created as signed HTTP-only cookie
4. Session contains: `userId`, `role`, `issuedAt`, `expiresAt`

**Session Implementation:**

* Stateless signed cookies (no server-side session table)
* Cookie flags: `HttpOnly`, `Secure`, `SameSite=Lax`
* Session duration: 7 days (configurable)

**Security Notes:**

* Passwords hashed with bcrypt (12 rounds)
* Failed login attempts are rate-limited
* Minimum password length: 8 characters

---

### 2.4 Role Capabilities

| Capability | Owner | Editor |
|------------|-------|--------|
| Manage schemas | ✅ | ❌ |
| Create/edit content | ✅ | ✅ |
| Delete content | ✅ | ❌ |
| Manage media | ✅ | ✅ |
| Delete media | ✅ | ❌ |
| Manage collaborators | ✅ | ❌ |

---

## 3. Database Layer

### 3.1 Default Database

**SQLite (plain SQLite, not libSQL)**

- Default database for Lumo V1
- One database per site / instance
- File-based storage

Why SQLite:
- Zero setup
- Ideal for single-site CMS workloads
- Low write concurrency
- Easy backups and portability
- Perfect fit for embedded mode

> SQLite is **not a compromise**.  
> It is the correct database for Lumo V1.

libSQL / Turso compatibility is explicitly out of scope for V1.

---

### 3.2 Database Abstraction

> **Lumo Core must not know or care which database is used.**

- All database access goes through adapters
- SQLite is the default adapter
- Postgres is a future option (Cloud)

Avoid:
- Heavy ORMs
- Active Record patterns
- Implicit lifecycle hooks

Prefer:
- Explicit SQL
- Typed query results
- Minimal abstractions

---

### 3.3 Storage Rules (Security-Relevant)

- SQLite database files **must live outside** any public or frontend directory
- Database files **must not** be exposed by dev servers (Vite, etc.)
- Embedded mode must ensure DB files are never bundled or served
- Persistence in development must be explicit and intentional

These rules are mandatory to prevent accidental data exposure.

---

## 4. Media Storage

### 4.1 Storage Backends

- Embedded mode: local filesystem
- Self-hosted / Cloud: S3-compatible object storage

Media handling is server-side only.

---

### 4.2 Media Philosophy

- Media is opaque
- Media is reusable
- No automatic garbage collection
- Deletion is always explicit

This avoids accidental data loss and hidden behavior.

---

## 5. Architecture Layout

Recommended monorepo structure:

```
/packages
  /core        ← content model, validation, business rules
  /db          ← database adapters (sqlite, future postgres)
  /server      ← Fastify server, auth, uploads, API
  /admin       ← Vue 3 admin application (Vite)
  /cli         ← lumo init / dev / publish
```

### Load-Bearing Constraint

> **Core contains no framework, runtime, or infrastructure assumptions.**

- No Node APIs
- No HTTP knowledge
- No database bindings
- No file system access

This rule is foundational.  
Violating it breaks embedded mode, Cloud mode, and long-term maintainability.

---

### CLI Scope Clarification

The Lumo CLI:
- initializes projects
- runs local development
- **publishes or provisions Lumo itself (e.g. provisioning Lumo Cloud instances)

The CLI **never deploys user websites**.  
Site deployment is always the user's responsibility.

---

### Configuration File

`lumo.config.ts` contains **system settings only**:

* Language settings
* Media upload limits

```typescript
// lumo.config.ts
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
```

**Page, Post Type, and Global schemas are stored in the database**, not in the config file.
Owners manage schemas through the admin UI.

---

## 6. Deployment Compatibility

### Embedded Mode
- Node.js
- Fastify
- SQLite
- Local filesystem
- Single process

### Self-Hosted Mode
- Node.js
- Fastify
- SQLite or Postgres
- Object storage

### Lumo Cloud
- Same server
- Same admin UI
- Same schemas
- Managed runtime

No Cloud-only code paths in Core.

---

## 7. Background Jobs

Lumo V1 requires minimal background processing:

### 7.1 Preview Cleanup

* Runs on a schedule (every 10 minutes recommended)
* Deletes expired previews from database
* Simple SQL: `DELETE FROM previews WHERE expires_at < NOW()`

### 7.2 Implementation Options

* **Embedded mode:** In-process timer (setInterval)
* **Self-hosted:** In-process timer or external cron
* **Lumo Cloud:** Managed scheduled tasks

No external job queue required for V1.

---

## 8. Testing Strategy (V1)

Testing is intentionally lightweight but explicit.

- **Unit tests:** Vitest  
  - Core logic  
  - Schema validation  
  - Utilities  

- **Admin UI e2e:** Playwright  
  - Critical editor flows only  

No strict coverage targets in V1.

---

## 9. What This Stack Is NOT Designed For

- Multi-tenant CMS UIs
- Edge-only runtimes
- Static-only hosting
- Client-side CMS logic
- High-write, high-concurrency workloads

These are explicit non-goals for V1.

---

## 10. Guiding Rule

> **If a feature requires changing the stack, the feature is probably wrong.**

---

## 11. Status

This stack definition applies to **Lumo V1**.
