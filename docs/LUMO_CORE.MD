# LUMO — CORE (V1)

>
> This document defines the **domain rules, invariants, and non-negotiable constraints**
> enforced by **Lumo Core**.
>
> If a behavior is not allowed by this document, it **must not be possible anywhere
> in the system** (admin UI, API, CLI, or Cloud).

---

## 1. What Core Is

**Lumo Core is the domain engine.**

It is responsible for:
- validating content
- enforcing invariants
- rejecting invalid states
- defining what *cannot* exist

Core is **not** responsible for:
- HTTP
- databases
- authentication
- sessions
- filesystems
- UI concerns
- deployment concerns

---

## 2. Load-Bearing Constraint

> **Core contains no framework, runtime, or infrastructure assumptions.**

Core:
- does not import Node APIs
- does not know about HTTP
- does not know about SQL
- does not know about files
- does not know about Vue

Core operates on **plain data structures** and returns:
- validated domain objects
- explicit errors

Violating this rule breaks:
- embedded mode
- Cloud mode
- long-term maintainability

---

## 3. Domain Ownership

Core is the **sole authority** for:

- content validity
- schema adherence
- translation rules
- publishing rules
- ordering rules
- deletion rules

If Core allows it, the system may persist it.  
If Core rejects it, **no layer may override that decision**.

---

## 4. Content Invariants (Non-Negotiable)

### 4.1 Content Types

- Three content types exist:
  - `Page`
  - `Post`
  - `Global`
- No additional content types may be created in V1
- Core rejects unknown types

---

### 4.2 Structure vs Content

> **Content is editable by Editors. Structure is editable by Owners.**

Core enforces:
- schemas can be modified by Owners through admin UI
- content mutations cannot alter schema structure
- field types cannot be changed via content mutations

If a content mutation attempts to alter structure → **reject**.

---

### 4.3 Repeater Fields

Core **allows**:
- arrays of objects with constrained depth and size
- repeater fields with sub-field schemas
- nested repeaters up to MAX_REPEATER_DEPTH (5 levels)

Core **enforces**:
- maximum 50 items per repeater instance
- maximum 5 levels of nesting
- all repeater items validated against sub-field schema
- repeater fields must have at least one sub-field

This rule is enforced at validation time.

---

### 4.4 Schema Validation

Core validates schemas when created or updated via API.

**Field key rules:**

| Rule | Pattern/Limit |
|------|---------------|
| Format | `^[a-z][a-z0-9_]*$` |
| Max length | 32 characters |
| Reserved keys | id, slug, title, type, status, position, publishedAt, createdAt, updatedAt, translations, fields |

**Schema rules:**

| Rule | Enforced |
|------|----------|
| Field type in allowed list | Yes |
| No duplicate field keys | Yes |
| No reserved keys | Yes |
| Maximum 50 fields per schema | Yes |
| `name` and `nameSingular` required for post types | Yes |
| Slug format valid | Yes |

If a schema definition violates these rules → **reject with validation error**.

Schemas are validated on save, not on startup.

---

### 4.5 Content Validation Against Schema

When content is saved, Core validates:

| Check | Behavior |
|-------|----------|
| Required fields present | Reject if missing |
| Field types match schema | Reject if mismatch |
| Unknown fields | Ignored (not rejected) |
| MediaReference format | Validate `mediaId` is string, `alt` is string or null |

Core never auto-fixes. Core never mutates silently.

---

## 5. Pages (Rules)

- Pages:
  - are manually created
  - map directly to routes
  - are always live when saved
- Pages:
  - cannot be drafts
  - cannot be scheduled
  - cannot be auto-generated

If a Page mutation attempts to introduce:
- draft state
- publish scheduling

→ **reject**.

---

## 6. Posts (Rules)

- Posts:
  - belong to a logical collection via `type`
  - each type has its own schema defined in the database
- Posts support:
  - `draft`
  - `published`

### Ordering
- If `position` is defined:
  - ordering is by `position ASC`
- Otherwise:
  - ordering is by `publishedAt DESC`

Core enforces ordering semantics but does not sort collections itself.

---

## 7. Translations (Hard Rules)

> **Translations duplicate content, not structure.**

Core enforces:
- default language content must exist
- translations are complete or absent
- no partial field-level translations
- no automatic sync between languages

If a mutation:
- attempts to create a translation without default language
- attempts to mix languages
- attempts to fallback implicitly

→ **reject**.

Core does **not**:
- decide frontend fallback behavior
- auto-generate translations

---

## 8. Publishing Rules

### Pages
- Always live
- No draft state

### Posts
- Drafts are not publicly readable
- Published posts must define `publishedAt`

If a post is published without `publishedAt` → **reject**.

---

## 9. Preview Rules

Core supports **preview validation**.

- Preview:
  - validates content against schema
  - does not persist content
  - is time-limited

Core does not know how preview tokens are generated, stored, or transported.
Core only validates that preview content adheres to schema rules.

---

## 10. Media Rules

Core treats media as **opaque references**.

- Media:
  - has no intrinsic meaning
  - is never auto-deleted
  - may be referenced by multiple content items

Core validates:
- `MediaReference.mediaId` is a non-empty string
- `MediaReference.alt` is a string or null/undefined

Core:
- does not manage storage
- does not garbage-collect
- does not verify media existence (that's the server's job)

Deletion behavior is always explicit and external.

---

## 11. Deletion Rules

Core enforces:
- content deletion is explicit
- cascading deletes are not automatic
- deleting content does not delete media
- deleting a translation is explicit and owner-only
- default language translation cannot be deleted

If a delete operation implies implicit side effects → **reject**.

---

## 12. Validation Philosophy

Core validation is:
- strict
- explicit
- deterministic

Core:
- never auto-fixes invalid data
- never mutates inputs silently
- always returns explicit errors

---

## 12. Repeater Field Validation

### 12.1 Constraints

| Constraint | Value |
|------------|-------|
| Maximum nesting depth | 5 |
| Maximum items per repeater | 50 |

### 12.2 Validation Rules

1. Repeater value must be an array (or null if not required)
2. Each array item must be an object
3. Each item validated against sub-field schema
4. Nested repeaters validated recursively
5. Depth tracked during validation; exceeding MAX_DEPTH is an error

### 12.3 Error Codes

| Code | Meaning |
|------|---------|
| `REPEATER_MAX_DEPTH` | Nesting exceeds 5 levels |
| `REPEATER_MAX_ITEMS` | Array exceeds 50 items |
| `REPEATER_INVALID_ITEM` | Item is not an object |

---

## 13. Global Validation

### 13.1 Global Schema Validation

1. `slug` — Required, lowercase with hyphens, max 64 chars
2. `name` — Required, non-empty string
3. `fields` — Required, valid field definitions array

### 13.2 Global Translation Validation

1. `fields` — Validated against schema
2. No `title` or `slug` (unlike Pages)

### 13.3 Global Invariants

* One Global instance per schema (enforced by UNIQUE constraint)
* Global instance auto-created on first translation save
* Deleting schema deletes instance and all translations

---

## 14. What Core Will NEVER Do (V1)

- Infer structure
- Auto-generate fields
- Auto-translate content
- Guess ordering
- Apply frontend logic
- Apply deployment logic

If a feature requires Core to do any of the above, it is **out of scope**.

---

## 15. Schema Evolution

Schemas can be modified at runtime by Owners.

| Change Type | Behavior |
|-------------|----------|
| **Add field** | Existing content unaffected, new field empty |
| **Remove field** | Content preserved in database but hidden from UI |
| **Change field type** | Allowed, but existing content may not match new type |
| **Rename field** | Old field hidden, new field empty |
| **Reorder fields** | Display order changes, content unaffected |

**Core does not:**
* Auto-migrate content when schemas change
* Delete content when fields are removed
* Validate existing content against new schema on read

**Core does:**
* Validate new content against current schema on save
* Preserve all content data regardless of schema changes

---

## 15. Guiding Sentence

> **If Core allows it, the system may persist it.
> If Core rejects it, the system must stop.**

---

## 17. Status

This document defines **Lumo Core V1**.
