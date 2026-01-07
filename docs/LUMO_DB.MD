# LUMO — DATABASE SCHEMA (V1)

>
> This document defines the **authoritative database schema** for Lumo V1.
> It implements the domain invariants defined in `CORE.md`.
>
> The database supports Core — it does not replace it.

---

## 1. Database Philosophy

- One database per Lumo instance
- SQLite is the default implementation
- Schema is relational and explicit
- Core enforces domain invariants
- Database constraints assist but never define business rules

---

## 2. Tables Overview

```
pages
page_translations
page_schemas        ← NEW
posts
post_translations
post_type_schemas   ← NEW
media
previews
users
collaborators
```

No polymorphic tables.
No domain logic in SQL.

---

## 3. Pages

### 3.1 `pages`

```sql
CREATE TABLE pages (
  id TEXT PRIMARY KEY,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

* Language-agnostic identity
* Content lives in translations

---

### 3.2 `page_translations`

```sql
CREATE TABLE page_translations (
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
```

Notes:

* Enforces **Page slug uniqueness per language**
* Database does **not** enforce existence of default language
* Default language presence is a **Core invariant**

---

### 3.3 `page_schemas`

```sql
CREATE TABLE page_schemas (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  fields TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

Notes:

* `slug` identifies the page (e.g., 'home', 'about', 'contact')
* `fields` stores JSON array of field definitions
* One schema per unique page
* Schema must exist before page content can be created

---

## 4. Posts

### 4.1 `posts`

```sql
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  position INTEGER,
  published_at DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

Notes:

* `type` is required and validated by Core
* `position` is optional manual ordering
* `published_at` required when `status = 'published'` (Core-enforced)

---

### 4.2 `post_translations`

```sql
CREATE TABLE post_translations (
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
```

Important notes:

* **Slug uniqueness across (`post.type`, `language`, `slug`) is enforced by Core**
* SQLite cannot enforce this constraint without denormalization or triggers
* The database intentionally does **not** attempt to encode this rule

This is a **deliberate design choice**.

---

### 4.3 `post_type_schemas`

```sql
CREATE TABLE post_type_schemas (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_singular TEXT NOT NULL,
  fields TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

Notes:

* `slug` identifies the post type (e.g., 'blog', 'team', 'events')
* `name` is plural display name (e.g., 'Blog Posts')
* `name_singular` is singular display name (e.g., 'Blog Post')
* `fields` stores JSON array of field definitions
* Schema must exist before posts of that type can be created

---

## 5. Media

### 5.1 `media`

```sql
CREATE TABLE media (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  created_at DATETIME NOT NULL
);
```

Notes:

* `mime_type` is required for all media
* `width` and `height` populated for images and video
* `duration` populated for video and audio (in seconds)
* Alt text is **not stored here** — it lives in content fields as part of `MediaReference`
* No usage tracking
* No automatic cleanup

---

### 5.2 `previews`

```sql
CREATE TABLE previews (
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
```

Notes:

* `target_id` is NULL when previewing new (unsaved) content
* `post_type` is NULL for page previews, required for post previews
* `fields` stores JSON snapshot of content
* Previews are time-limited (default 30 minutes)
* Expired previews are cleaned up by scheduled job
* Unlike invites, previews ARE stored in the database

---

## 6. Users & Collaboration

### 6.1 `users`

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at DATETIME NOT NULL
);
```

Notes:

* Auth implementation is external
* Core only cares about identity

---

### 6.2 `collaborators`

```sql
CREATE TABLE collaborators (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor')),
  created_at DATETIME NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id)
);
```

Notes:

* One role per user per site
* Permission checks are Core-enforced

**V2 Note:** `UNIQUE(user_id)` assumes single-site mode.
Multi-site deployments (Lumo Cloud) will require schema revision to support user-to-site mapping.

---

## 7. Invites (Clarification)

Lumo V1 **does not persist invites in the database by default**.

* Invites are implemented as **stateless, signed, time-limited tokens**
* Tokens encode:

  * email
  * role
  * expiration
* Token verification is handled at the server layer
* No `invites` table exists in V1

This avoids:

* cleanup logic
* stale invite rows
* unnecessary persistence

A persistent `invites` table may be considered in V2 if needed.

---

## 8. Previews (Clarification)

Unlike invites, **previews ARE stored in the database**.

* Previews capture a snapshot of unsaved content
* Previews are time-limited (default 30 minutes)
* Previews are cleaned up automatically via scheduled job
* Preview tokens are random, opaque strings (not signed JWTs)

This approach was chosen because:

* Previews may contain substantial content (too large for tokens)
* Database storage enables simple cleanup via `expires_at`
* No cryptographic complexity

See `previews` table in Section 5.2.

---

## 9. Indexes (Performance Only)

```sql
CREATE INDEX idx_page_translations_page_id ON page_translations(page_id);
CREATE INDEX idx_page_schemas_slug ON page_schemas(slug);
CREATE INDEX idx_post_translations_post_id ON post_translations(post_id);
CREATE INDEX idx_post_type_schemas_slug ON post_type_schemas(slug);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_position ON posts(position);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_media_mime_type ON media(mime_type);
CREATE INDEX idx_previews_token ON previews(token);
CREATE INDEX idx_previews_expires_at ON previews(expires_at);
```

Indexes support:

* filtering
* ordering
* joins
* cleanup queries

They do not encode domain rules.

---

## 10. Deletion Semantics

* Pages → translations deleted via FK cascade
* Posts → translations deleted via FK cascade
* Media → never auto-deleted
* Users → collaborator role removed
* Previews → deleted on expiry via cleanup job

All cascading behavior is explicit and minimal.

---

## 11. Validation Responsibility Split

| Concern                          | Enforced by |
| -------------------------------- | ----------- |
| Required fields                  | Core        |
| Field types                      | Core        |
| Page schema validity             | Core        |
| Post type schema validity        | Core        |
| Schema CRUD                      | Server + DB |
| Default language existence       | Core        |
| Page slug uniqueness             | Core + DB   |
| Post slug uniqueness (type+lang) | Core        |
| Post type validity               | Core        |
| Publish rules                    | Core        |
| Media reference validity         | Core        |
| Media lifecycle                  | External    |
| MediaReference.alt               | Content     |
| Preview expiration               | Server      |

The database assists.
**Core decides.**

---

## 12. What This Schema Will NOT Do

* No automatic content migrations when schemas change
* No polymorphic joins
* No business logic in SQL
* No multi-tenant isolation (V1)

---

## 13. Status

This schema defines **Lumo V1 storage**.
