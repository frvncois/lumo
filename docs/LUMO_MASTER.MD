# LUMO — MASTER SPEC (V1)

>
> This document defines the **complete and authoritative specification** for Lumo V1.
> Any feature, PR, or idea that contradicts this document is **out of scope**.

---

## 1. What Lumo Is

**Lumo is a lightweight content engine.**

It provides:
- a content editor (admin UI)
- a content API
- a strict, opinionated content model

It does **not**:
- deploy websites
- manage hosting
- control layouts
- provide themes
- act as a platform or page builder

---

## 2. Where Lumo Lives (Execution Modes)

Lumo is a single product that can run in multiple modes.

### 2.1 Embedded Mode
- Lumo runs inside a project
- Mounted under `/admin`
- Same server as the site
- Ideal for freelancers and small clients

### 2.2 Self-Hosted Mode
- Lumo runs as a standalone server
- Frontend fetches content via API
- Deployed on Fly.io, Railway, VPS, etc.

### 2.3 Lumo Cloud
- Same Lumo
- Same codebase
- Same schemas
- Hosted and managed by us

> **Lumo Cloud is an operational deployment target, not a separate product.**

---

## 3. Core Principles (Non-Negotiable)

- Content ≠ Structure
- Clients edit content, not layout
- Schemas are owner-defined through the admin UI
- Schemas are stored in the database and editable at runtime
- No structured repeaters
- Lists are modeled as collections
- Arrays of primitives are allowed; arrays of objects are not (except system primitives)
- Fewer features > more flexibility
- No magic, no guessing, no auto-rendering

---

## 4. Content Types (V1)

There are **exactly two** content types.

---

### 4.1 Page

Used for:
- Home
- About
- Contact
- Services
- Any static page

```typescript
Page {
  id
  slug
  translations
  updatedAt
}
```

Rules:

* Pages are manually created
* Slug maps directly to a route
* No deep nesting (max 1 level if enabled)

---

### 4.2 Post (Collection Type)

Used for **all lists of things**:

* Blog posts
* Events
* Team members
* Testimonials
* FAQs
* Features

```typescript
Post {
  id
  slug
  type
  position?
  translations
  status: 'draft' | 'published'
  publishedAt
}
```

Rules:

* Posts have a **fixed entity structure** (`id`, `type`, `status`, `position`, `publishedAt`, `translations`)
* Each `type` has its **own field schema** defined in `lumo.config.ts`
* Types are defined at deploy time and cannot be created at runtime
* `position` is optional and used for manual ordering
* When `position` is present, ordering by `position ASC` takes precedence
* Otherwise, posts are ordered by `publishedAt DESC`
* Frontend filters and renders by `type`
* If two collections require fundamentally incompatible workflows (not just different fields), consider separate Lumo instances

Post types are defined in `lumo.config.ts` under `postTypes`.
Core rejects posts with undefined types.

---

## 5. Modeling Lists (Explicit)

> **Lumo does not support structured repeaters.**

Instead:

* Lists of items are modeled as **Posts**
* Each item is a flat entity
* Ordering, filtering, and layout are handled by the frontend

This is an intentional workflow shift and a core design constraint.

---

## 6. Fields & Schemas

### 6.1 Schema Philosophy

Schemas are:

* stored in the database
* managed by Owners through the admin UI
* editable at runtime without restart
* validated by Core before saving

Editors cannot modify schemas — only Owners.

---

### 6.2 Configuration File

`lumo.config.ts` contains **system settings only**:

```typescript
// lumo.config.ts
export default {
  languages: ['en', 'fr'],
  defaultLanguage: 'en',

  media: {
    maxImageSize: 10 * 1024 * 1024,   // 10 MB
    maxVideoSize: 100 * 1024 * 1024,  // 100 MB
    maxAudioSize: 50 * 1024 * 1024,   // 50 MB
    maxDocumentSize: 20 * 1024 * 1024 // 20 MB
  }
}
```

**Pages and Post Types are NOT defined in the config file.**
They are created and managed through the admin UI.

---

### 6.3 Schema Management (Admin UI)

Owners can:

* Create new page schemas
* Create new post type schemas
* Add, remove, and reorder fields
* Edit field properties (key, type, label, required)
* Delete schemas (content is preserved but hidden)

Editors cannot access schema management.

---

### 6.4 Allowed Field Types (V1)

| Type | Stored As | Description |
|------|-----------|-------------|
| `text` | `string` | Single-line text |
| `textarea` | `string` | Multi-line plain text |
| `richtext` | `string` (JSON) | TipTap/ProseMirror document format |
| `image` | `MediaReference` | Single media reference with alt text |
| `gallery` | `MediaReference[]` | Array of media references with alt text |
| `url` | `string` | Valid URL (http, https, mailto, tel) |
| `boolean` | `boolean` | True/false toggle |

---

### 6.5 Media Reference

`image` and `gallery` fields store **MediaReference** objects, not raw IDs.

```typescript
MediaReference {
  mediaId: string    // References media.id
  alt?: string       // Alt text (translatable, per-usage)
}
```

**Storage example:**

```json
{
  "hero_image": {
    "mediaId": "media_abc123",
    "alt": "Team celebrating product launch"
  },
  "gallery": [
    { "mediaId": "media_def456", "alt": "Office front entrance" },
    { "mediaId": "media_ghi789", "alt": "Team workspace" }
  ]
}
```

This enables:

* Per-usage alt text (same image, different descriptions)
* Per-language alt text (lives in translations)
* Accessibility compliance

---

### 6.6 RichText Format

`richtext` fields store content as **JSON strings** in TipTap/ProseMirror document format.

* Storage: Serialized JSON string
* Validation: Core validates JSON structure
* Rendering: Frontend responsibility

Raw HTML is **never** accepted or stored.

---

### 6.7 URL Validation

`url` fields accept valid URIs per RFC 3986.

Allowed schemes:

* `http`
* `https`
* `mailto`
* `tel`

---

### 6.8 Field Definition

```typescript
Field {
  key: string       // Lowercase, underscores allowed: ^[a-z][a-z0-9_]*$
  type: FieldType   // One of the allowed types
  label: string     // Human-readable label for admin UI
  required: boolean // Whether field must have a value
}
```

Rules:

* No nested fields
* No user-defined field groups
* No relations between content items
* No dynamic field types

---

### 6.9 Reserved Keys

The following keys are reserved and cannot be used as field keys:

* `id`
* `slug`
* `title`
* `type`
* `status`
* `position`
* `publishedAt`
* `createdAt`
* `updatedAt`
* `translations`
* `fields`

---

### 6.10 Arrays Rule

**Allowed:**

* `MediaReference[]` (gallery field type)

**Not allowed:**

* Arrays of user-defined objects
* Structured repeaters with custom fields

`MediaReference` is a **system primitive**, not a user-defined structure.
This maintains the "no structured repeaters" constraint while enabling galleries with per-image alt text.

---

## 7. Translations (Dead Simple)

### 7.1 Core Rule

> **Translations duplicate content, not structure.**

No field-level translations.
No fallback chains.
No auto-sync.

---

### 7.2 Language Configuration

Languages are stored in the database (settings table) and can be managed from the admin UI:

```typescript
languages: ['en', 'fr']
defaultLanguage: 'en'
```

- Initial values can be set in `lumo.config.ts` as fallback defaults
- Owners can modify languages through the Settings UI
- Changes are persisted to the database and apply immediately
- The config file values are used only if database settings don't exist

---

### 7.3 Translation Model

```typescript
translations: {
  en: Content
  fr?: Content
}

Content {
  title
  slug
  fields
  updatedAt
}
```

Rules:

* Default language is required
* Other languages are optional
* A translation is either present or missing

---

### 7.4 Slugs

Slugs are language-specific.

Example:

```
/about
/fr/a-propos
```

Frontend decides fallback behavior.

---

## 8. Collaborators

### 8.1 Roles (Only Two)

* **Owner**
* **Editor**

No permissions UI. No custom roles.

---

### 8.2 Permissions

| Action               | Owner | Editor |
| -------------------- | ----- | ------ |
| Invite collaborators | ✅     | ❌      |
| Manage schemas       | ✅     | ❌      |
| Edit content         | ✅     | ✅      |
| Publish content      | ✅     | ✅      |
| Delete content       | ✅     | ❌      |
| Delete translations  | ✅     | ❌      |
| Delete media         | ✅     | ❌      |

---

### 8.3 Multiple Owners

A site may have multiple owners.

**Transfer Ownership:**

1. Existing owner invites new owner
2. New owner accepts invite
3. New owner can now remove original owner (if desired)

**Constraints:**

* At least one owner must always exist
* Owner cannot remove themselves if they are the last owner

---

### 8.4 Invites

* Email invite
* Magic link
* Time-limited
* No passwords in V1

---

## 9. Publishing & Preview

### 9.1 Publishing

**Pages:**

* Always live when saved
* No draft state

**Posts:**

* Support `draft` and `published` status
* Drafts are not publicly accessible
* Publishing requires `publishedAt` to be set

No workflows. No approvals.

---

### 9.2 Preview System

Preview enables users to see unsaved changes before saving or publishing.

**How it works:**

1. User edits content in admin (Page or Post)
2. User clicks "Preview"
3. System stores pending changes temporarily in database
4. System returns preview URL: `/about?preview=TOKEN`
5. User opens URL → sees their changes rendered
6. Changes are NOT saved yet
7. User can then Save/Publish or discard

**Preview URLs:**

```
/about?preview=abc123xyz
/blog/my-post?preview=def456uvw
```

**Rules:**

* Preview works for both Pages and Posts
* Preview captures unsaved changes (not stored content)
* Preview is time-limited (30 minutes)
* Preview is read-only
* Token is the credential (no additional auth required)
* Frontend explicitly checks for preview parameter

**What preview is NOT:**

* Not a draft system (previews expire, drafts persist)
* Not a collaboration tool (previews are personal)
* Not a staging environment (previews are temporary snapshots)

---

## 10. Media Management

### 10.1 Media Model

```typescript
Media {
  id: string
  url: string
  mimeType: string
  width?: number    // Images, video
  height?: number   // Images, video
  duration?: number // Video, audio (seconds)
  createdAt: string
}
```

Notes:

* Media is opaque
* Reusable across content
* Referenced via `MediaReference` in fields
* Alt text is stored per-usage in content, not on media

---

### 10.2 Supported File Types (V1)

| Category | Extensions | Metadata |
|----------|------------|----------|
| **Images** | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg` | `width`, `height` |
| **Video** | `.mp4`, `.webm`, `.mov` | `width`, `height`, `duration` |
| **Audio** | `.mp3`, `.wav`, `.ogg`, `.m4a` | `duration` |
| **Documents** | `.pdf` | none |

Unsupported file types are rejected on upload.

---

### 10.3 Upload Constraints (V1)

| Type | Max File Size |
|------|---------------|
| Images | 10 MB |
| Video | 100 MB |
| Audio | 50 MB |
| Documents | 20 MB |

These defaults can be configured in `lumo.config.ts`.

---

### 10.4 Storage

* Embedded mode: local filesystem
* Self-hosted / Cloud: S3-compatible storage

---

### 10.5 Media Lifecycle

* Media can be deleted manually by an **Owner**
* Media is **not automatically garbage-collected**
* Orphaned media remains until explicitly removed
* UI may warn when media is in use, but deletion is always explicit

---

### 10.6 Media Library UI (V1)

* Upload
* Browse (with type filtering)
* Replace
* Delete
* Reuse assets
* Video/audio preview

No folders, tags, or transformations.

---

## 11. API & Authentication

### 11.1 Public Read

* Pages: public
* Published posts: public
* No API key required

Public read endpoints may be subject to:

* rate limiting
* origin or host checks (deployment-dependent)

Lumo does not attempt to prevent content scraping.

---

### 11.2 Private Write

* Admin UI uses session-based auth
* Mutations are private
* No client-side writes

---

### 11.3 Preview Access

* Token-based read access
* Time-limited (30 minutes)
* Explicitly requested via admin

---

## 12. Frontend Contract

Frontend:

* explicitly requests content
* never auto-renders fields
* owns layout entirely

Example:

```
GET /api/pages/about?lang=fr
```

If content is missing:

* return 404
* frontend decides fallback

---

## 13. What Lumo Will NEVER Do (V1)

* Deploy sites
* Manage DNS or SSL
* Provide themes
* Allow layout editing
* Provide plugins
* Auto-translate content
* Support structured repeaters
* Provide enterprise workflows

---

## 14. Upgrade Path (Intentional)

* Embedded → Self-Hosted → Cloud
* Same schemas
* Same editor
* Same API

No migrations required.

---

## 15. Guiding Sentence (Product Truth)

> **Lumo lets Editors manage content. Owners manage structure.**

If a feature violates this sentence, it is out of scope.

---

## 16. Status

This document defines **Lumo V1**.
