# LUMO — API (V1)

>
> This document defines the **complete HTTP API surface** for Lumo V1.
> All write operations must pass through **Core validation** as defined in `CORE.md`.
>
> Conventions:
> - All JSON uses UTF-8
> - All timestamps are ISO 8601 strings
> - IDs are opaque, non-guessable strings (UUID / ULID)
> - No implicit behavior: invalid payloads are rejected, never auto-fixed

---

## 1. API Philosophy

- Public read is unauthenticated
- Private write is authenticated (session-based)
- Preview access is read-only and token-based
- Admin APIs are explicit and separate
- Core is the authority; API is transport only

---

## 2. Base URLs

- Admin UI: `/admin/*` (served HTML, not part of this API)
- API base: `/api`

---

## 3. Authentication Model

### 3.1 Public Read
- No authentication
- Rate limiting and origin checks may apply
- Only published content is accessible

---

### 3.2 Private Write
- Session-based authentication (cookies)
- Role-based authorization (`owner`, `editor`)
- All mutations validated by Core

---

### 3.3 Preview
- Database-stored tokens
- Time-limited (30 minutes)
- Read-only
- Never grant write access

---

## 4. Error Format (Uniform)

All errors return:

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human-readable summary",
    "details": [
      { "path": "fields.hero_title", "reason": "REQUIRED" }
    ]
  }
}
```

Common error codes:

* `VALIDATION_ERROR`
* `UNAUTHORIZED`
* `FORBIDDEN`
* `NOT_FOUND`
* `CONFLICT`
* `RATE_LIMITED`

---

## 5. Public Read API (Published Content Only)

### 5.1 List Pages

#### GET `/api/pages`

Query:

* `lang` (optional, default = defaultLanguage)

Response:

```json
{
  "items": [
    { "id": "page_123", "slug": "about", "title": "About", "updatedAt": "..." }
  ]
}
```

Notes:

* Only pages with a translation for `lang` are returned
* No pagination (pages assumed few)

---

### 5.2 Get Page by Slug

#### GET `/api/pages/:slug`

Query:

* `lang` (optional, default = defaultLanguage)

Response:

```json
{
  "id": "page_123",
  "slug": "about",
  "title": "About",
  "fields": { "...": "..." },
  "updatedAt": "..."
}
```

Errors:

* `NOT_FOUND` if translation does not exist

---

### 5.3 List Posts

#### GET `/api/posts`

Query:

* `type` (required)
* `lang` (optional, default = defaultLanguage)
* `limit` (optional, default = 20, max = 100)
* `cursor` (optional)
* `order` (optional, default = `auto`)

**Order values:**

| Value | Behavior |
|-------|----------|
| `auto` | Posts with `position` first (by `position ASC`), then posts without `position` (by `publishedAt DESC`) |
| `date_desc` | All posts by `publishedAt DESC` (ignores position) |
| `position_asc` | All posts by `position ASC NULLS LAST` |

`auto` is the recommended default. It enables manual ordering when needed while falling back to chronological for unpositioned posts.

Response:

```json
{
  "items": [
    {
      "id": "post_123",
      "type": "blog",
      "slug": "my-post",
      "title": "My Post",
      "position": null,
      "publishedAt": "...",
      "updatedAt": "..."
    }
  ],
  "nextCursor": null
}
```

Notes:

* Only `published` posts are returned
* `type` is mandatory to avoid CMS-wide dumps
* Drafts are **never** returned here

---

### 5.4 Get Post by Type + Slug

#### GET `/api/posts/:type/:slug`

Query:

* `lang` (optional, default = defaultLanguage)

Response:

```json
{
  "id": "post_123",
  "type": "blog",
  "slug": "my-post",
  "title": "My Post",
  "fields": { "...": "..." },
  "position": null,
  "publishedAt": "...",
  "updatedAt": "..."
}
```

Errors:

* `NOT_FOUND` if not published or translation missing

---

## 6. Preview System

Preview enables users to see unsaved changes before publishing.

### 6.1 Philosophy

* Preview works for **both Pages and Posts**
* Preview captures **unsaved changes** (not just existing drafts)
* Preview is **time-limited** and stored in database
* Preview URLs use the **same slug** as final content with a token parameter
* Frontend explicitly handles preview tokens

---

### 6.2 Create Preview

#### POST `/api/admin/preview`

Creates a preview snapshot of pending content.

**Body (Page):**

```json
{
  "targetType": "page",
  "targetId": "page_123",
  "language": "en",
  "slug": "about",
  "title": "About Us",
  "fields": {
    "hero_title": "Our Story",
    "hero_image": { "mediaId": "media_abc", "alt": "Team photo" }
  }
}
```

**Body (Post):**

```json
{
  "targetType": "post",
  "targetId": "post_456",
  "postType": "blog",
  "language": "en",
  "slug": "my-article",
  "title": "My Article",
  "fields": {
    "excerpt": "...",
    "body": "..."
  }
}
```

**Body (New content, not yet created):**

```json
{
  "targetType": "post",
  "targetId": null,
  "postType": "blog",
  "language": "en",
  "slug": "new-article",
  "title": "New Article",
  "fields": { }
}
```

**Response:**

```json
{
  "token": "abc123xyz",
  "previewUrl": "/about?preview=abc123xyz",
  "expiresAt": "2025-01-06T15:30:00Z"
}
```

**Rules:**

* `targetId` is null for content not yet saved
* `postType` required when `targetType` is `post`
* Preview expires after 30 minutes
* Core validates fields against schema before creating preview

---

### 6.3 Fetch Preview Content

#### GET `/api/preview/:token`

Retrieves preview content by token. **No authentication required** (token is the credential).

**Response:**

```json
{
  "targetType": "page",
  "targetId": "page_123",
  "postType": null,
  "language": "en",
  "slug": "about",
  "title": "About Us",
  "fields": {
    "hero_title": "Our Story",
    "hero_image": { "mediaId": "media_abc", "alt": "Team photo" }
  }
}
```

**Errors:**

* `NOT_FOUND` — token invalid or expired

---

### 6.4 Preview Lifecycle

| Event | Behavior |
|-------|----------|
| User clicks "Preview" in admin | Creates preview record, returns token |
| User opens preview URL | Frontend fetches content via token |
| User saves/publishes content | Preview remains until expiry (harmless) |
| User discards changes | Preview expires naturally |
| 30 minutes pass | Preview expires, returns `NOT_FOUND` |
| Cleanup job runs | Deletes expired previews |

---

### 6.5 Frontend Contract

```typescript
// Pseudocode for frontend rendering
const previewToken = url.searchParams.get('preview')

if (previewToken) {
  // Fetch preview content
  const content = await fetch(`/api/preview/${previewToken}`)
  render(content)
} else {
  // Fetch published content
  const content = await fetch(`/api/pages/${slug}?lang=${lang}`)
  render(content)
}
```

**Rules:**

* Preview URL uses same slug as final content
* Only difference is `?preview=TOKEN` parameter
* Frontend explicitly checks for preview param
* No implicit fallback behavior

---

## 7. Auth / Session

### 7.1 Current User

#### GET `/api/me`

Response:

```json
{
  "id": "user_123",
  "email": "person@example.com",
  "role": "owner"
}
```

---

### 7.2 Logout

#### POST `/api/logout`

Response:

```json
{ "ok": true }
```

---

## 8. Admin Read API (Drafts + All Translations)

All endpoints:

* Require session auth
* Respect role permissions

---

### 8.1 List Pages (Admin)

#### GET `/api/admin/pages`

Response:

```json
{
  "items": [
    {
      "id": "page_123",
      "translations": {
        "en": { "slug": "about", "title": "About" },
        "fr": { "slug": "a-propos", "title": "À propos" }
      },
      "updatedAt": "..."
    }
  ]
}
```

---

### 8.2 Get Page by ID (Admin)

#### GET `/api/admin/pages/:id`

Response:

```json
{
  "id": "page_123",
  "translations": {
    "en": { "slug": "about", "title": "About", "fields": {} },
    "fr": { "slug": "a-propos", "title": "À propos", "fields": {} }
  }
}
```

---

### 8.3 List Posts (Admin)

#### GET `/api/admin/posts`

Query:

* `type` (optional)
* `status` (`draft` | `published` | `all`, default = `all`)
* `lang` (optional)
* `limit` (optional, default = 20, max = 100)
* `cursor` (optional)

Response:

```json
{
  "items": [
    {
      "id": "post_123",
      "type": "blog",
      "status": "draft",
      "translations": {
        "en": { "slug": "my-post", "title": "My Post" }
      },
      "updatedAt": "..."
    }
  ],
  "nextCursor": null
}
```

---

### 8.4 Get Post by ID (Admin)

#### GET `/api/admin/posts/:id`

Response:

```json
{
  "id": "post_123",
  "type": "blog",
  "status": "draft",
  "position": null,
  "publishedAt": null,
  "translations": {
    "en": { "slug": "my-post", "title": "My Post", "fields": {} }
  }
}
```

---

## 9. Admin Write API

### 9.1 Create Page

#### POST `/api/admin/pages`

Body:

```json
{
  "translations": {
    "en": { "slug": "about", "title": "About", "fields": {} }
  }
}
```

Errors:

* `VALIDATION_ERROR`
* `CONFLICT` (page slug collision in that language)

---

### 9.2 Upsert Page Translation

#### PUT `/api/admin/pages/:id/translations/:lang`

Body:

```json
{ "slug": "a-propos", "title": "À propos", "fields": {} }
```

---

### 9.3 Delete Page (Owner only)

#### DELETE `/api/admin/pages/:id`

---

### 9.4 Create Post

#### POST `/api/admin/posts`

Body:

```json
{
  "type": "blog",
  "status": "draft",
  "position": null,
  "translations": {
    "en": { "slug": "my-post", "title": "My Post", "fields": {} }
  }
}
```

Errors:

* `VALIDATION_ERROR`
* `CONFLICT` (post slug collision within type+language)

---

### 9.5 Update Post Metadata

#### PUT `/api/admin/posts/:id`

Allowed:

* `status`
* `publishedAt`
* `position`

❌ `type` is immutable and cannot be changed.

Rules:

* Publishing requires `publishedAt`
* Editors may publish/unpublish
* Owners may delete

---

### 9.6 Upsert Post Translation

#### PUT `/api/admin/posts/:id/translations/:lang`

Body:

```json
{ "slug": "mon-article", "title": "Mon article", "fields": {} }
```

Errors:

* `CONFLICT` (slug collision within type+language)

---

### 9.7 Delete Post (Owner only)

#### DELETE `/api/admin/posts/:id`

---

### 9.8 Delete Page Translation (Owner only)

#### DELETE `/api/admin/pages/:id/translations/:lang`

Rules:

* Cannot delete default language translation
* Page must retain at least one translation (the default)

Response:

```json
{ "ok": true }
```

Errors:

* `FORBIDDEN` if attempting to delete default language
* `FORBIDDEN` if not owner
* `NOT_FOUND` if translation does not exist

---

### 9.9 Delete Post Translation (Owner only)

#### DELETE `/api/admin/posts/:id/translations/:lang`

Rules:

* Cannot delete default language translation
* Post must retain at least one translation (the default)

Response:

```json
{ "ok": true }
```

Errors:

* `FORBIDDEN` if attempting to delete default language
* `FORBIDDEN` if not owner
* `NOT_FOUND` if translation does not exist

---

## 10. Schema Management API (Owner Only)

All schema endpoints require Owner role.

---

### 10.1 List All Schemas

#### GET `/api/admin/schemas`

Response:

```json
{
  "pages": [
    {
      "slug": "home",
      "fields": [
        { "key": "hero_title", "type": "text", "label": "Hero Title", "required": true }
      ]
    }
  ],
  "postTypes": [
    {
      "slug": "blog",
      "name": "Blog Posts",
      "nameSingular": "Blog Post",
      "fields": [
        { "key": "body", "type": "richtext", "label": "Body", "required": true }
      ]
    }
  ]
}
```

---

### 10.2 Create Page Schema

#### POST `/api/admin/schemas/pages`

Body:

```json
{
  "slug": "services",
  "fields": [
    { "key": "intro", "type": "richtext", "label": "Introduction", "required": true },
    { "key": "hero_image", "type": "image", "label": "Hero Image", "required": false }
  ]
}
```

Response: Created schema object

Errors:
* `VALIDATION_ERROR` — invalid slug or field definitions
* `CONFLICT` — slug already exists

---

### 10.3 Update Page Schema

#### PUT `/api/admin/schemas/pages/:slug`

Body:

```json
{
  "fields": [
    { "key": "intro", "type": "richtext", "label": "Introduction", "required": true },
    { "key": "hero_image", "type": "image", "label": "Hero Image", "required": false },
    { "key": "cta_text", "type": "text", "label": "CTA Text", "required": false }
  ]
}
```

Response: Updated schema object

---

### 10.4 Delete Page Schema

#### DELETE `/api/admin/schemas/pages/:slug`

Response:

```json
{ "ok": true }
```

Notes:
* Does NOT delete page content
* Content is preserved but hidden from admin UI

---

### 10.5 Create Post Type Schema

#### POST `/api/admin/schemas/post-types`

Body:

```json
{
  "slug": "events",
  "name": "Events",
  "nameSingular": "Event",
  "fields": [
    { "key": "date", "type": "text", "label": "Event Date", "required": true },
    { "key": "location", "type": "text", "label": "Location", "required": true },
    { "key": "description", "type": "richtext", "label": "Description", "required": false }
  ]
}
```

Response: Created schema object

---

### 10.6 Update Post Type Schema

#### PUT `/api/admin/schemas/post-types/:slug`

Body:

```json
{
  "name": "Events & Meetups",
  "nameSingular": "Event",
  "fields": [...]
}
```

Response: Updated schema object

---

### 10.7 Delete Post Type Schema

#### DELETE `/api/admin/schemas/post-types/:slug`

Response:

```json
{ "ok": true }
```

Notes:
* Does NOT delete posts of this type
* Posts are preserved but hidden from admin UI

---

## 11. Media API

### 11.1 Upload Media

#### POST `/api/admin/media`

Multipart upload.

Response:

```json
{
  "id": "media_123",
  "url": "https://...",
  "mimeType": "image/png",
  "width": 1200,
  "height": 800,
  "duration": null,
  "createdAt": "..."
}
```

Notes:

* `width` and `height` populated for images and video
* `duration` populated for video and audio (in seconds)
* Unsupported file types return `VALIDATION_ERROR`

---

### 11.2 List Media (Admin)

#### GET `/api/admin/media`

Query:

* `limit` (optional, default 50, max 200)
* `cursor` (optional)
* `type` (optional, filter by category: `image`, `video`, `audio`, `document`)

Response:

```json
{
  "items": [
    {
      "id": "media_123",
      "url": "https://...",
      "mimeType": "image/png",
      "width": 1200,
      "height": 800,
      "duration": null,
      "createdAt": "..."
    }
  ],
  "nextCursor": null
}
```

---

### 11.3 Replace Media (Same ID)

#### PUT `/api/admin/media/:id/replace`

Multipart upload.

Rules:

* Media ID preserved
* Binary replaced
* URL/dimensions updated
* References remain valid

Response:

```json
{
  "id": "media_123",
  "url": "https://...",
  "mimeType": "image/jpeg",
  "width": 1600,
  "height": 900,
  "duration": null,
  "createdAt": "..."
}
```

---

### 11.4 Delete Media (Owner only)

#### DELETE `/api/admin/media/:id`

Notes:

* No automatic orphan cleanup
* Server may warn if in use, but deletion is explicit

---

## 12. Collaborators & Invites

### 12.1 List Collaborators

#### GET `/api/admin/collaborators`

Response:

```json
{
  "items": [
    { "userId": "user_123", "email": "a@b.com", "role": "owner" }
  ]
}
```

---

### 12.2 Invite Collaborator (Owner only)

#### POST `/api/admin/invites`

Invites are **stateless signed tokens** (not stored in DB).

Body:

```json
{ "email": "new@person.com", "role": "editor" }
```

Response:

```json
{
  "inviteUrl": "https://.../admin/accept-invite?token=...",
  "expiresAt": "..."
}
```

---

### 12.3 Accept Invite

#### POST `/api/invites/accept`

Body:

```json
{ "token": "..." }
```

Response:

```json
{ "ok": true }
```

Notes:

* Token is signed and time-limited
* Accept creates/links a user and assigns collaborator role

---

### 12.4 Remove Collaborator (Owner only)

#### DELETE `/api/admin/collaborators/:userId`

Rules:

* Owner cannot remove themselves
* Cannot remove last remaining Owner

Response:

```json
{ "ok": true }
```

---

## 13. Rate Limiting & Origin Checks (Policy)

* Public endpoints may be rate limited
* Deployments may enable origin/host allowlists
* Cloud enforces sane defaults
* Lumo does not attempt to prevent scraping

---

## 14. Explicit V1 Omissions

The following are **intentional**:

* No public draft access (use preview system instead)
* No auto-fallback behavior

---

## 15. Status

This document defines **Lumo API V1**.
