# LUMO Admin

Vue 3 + Vite + Tailwind CSS admin application for LUMO CMS.

## Project Structure

```
packages/admin/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── App.vue                    # Root component
│   ├── style.css                  # Tailwind CSS imports
│   ├── router/
│   │   └── index.ts               # Vue Router configuration
│   ├── views/
│   │   ├── Login.vue              # Login page (magic link flow)
│   │   ├── Dashboard.vue          # Dashboard (list pages/posts)
│   │   ├── PageEditor.vue         # Page editor with schema fields
│   │   ├── PostEditor.vue         # Post editor with status/publish
│   │   └── MediaLibrary.vue       # Media upload/browse/select
│   ├── components/
│   │   ├── Layout.vue             # Main layout with nav
│   │   ├── FieldRenderer.vue      # Dynamic field renderer
│   │   ├── RichtextEditor.vue     # TipTap richtext editor
│   │   ├── ImageField.vue         # Image field with media picker
│   │   └── MediaPicker.vue        # Media selection modal
│   ├── composables/
│   │   ├── useAuth.ts             # Authentication state
│   │   ├── useConfig.ts           # Config loading
│   │   └── usePreview.ts          # Preview functionality
│   └── utils/
│       └── api.ts                 # API client
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── tsconfig.json
```

## Features

### 1. Authentication
- Magic link login flow
- Session management with cookies
- Auto-redirect to dashboard on auth

### 2. Dashboard
- Lists all configured pages
- Lists all post types with counts
- Quick navigation to editors

### 3. Page Editor
- Dynamic form based on page schema from config
- Field types: text, textarea, richtext, image, gallery, url, boolean
- Multi-language support with tabs
- Preview button
- Save/Publish workflow

### 4. Post Editor
- Dynamic form based on post type schema
- Draft/Published status toggle
- Optional manual position ordering
- Published date picker
- Preview button

### 5. Media Library
- Grid view of all media
- Filter by type (image, video, audio, document)
- Upload new media
- Replace existing media
- Delete media (owner only)
- Shows usage warnings

### 6. Preview System
- Creates preview snapshot via API
- Opens preview URL in new tab
- 30-minute time limit

### 7. TipTap Integration
- Rich text editor for richtext fields
- Bold, italic, headings, lists
- Image embedding
- Link support

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## API Integration

The admin app proxies all `/api/*` requests to the LUMO server (default: `http://localhost:3000`).

### Key API Endpoints Used

**Auth:**
- POST `/api/auth/magic-link` - Request magic link
- GET `/api/auth/verify?token=` - Verify and create session
- GET `/api/me` - Get current user
- POST `/api/logout` - Logout

**Pages:**
- GET `/api/admin/pages` - List all pages
- GET `/api/admin/pages/:id` - Get page
- POST `/api/admin/pages` - Create page
- PUT `/api/admin/pages/:id/translations/:lang` - Update translation
- DELETE `/api/admin/pages/:id` - Delete page

**Posts:**
- GET `/api/admin/posts?type=:type` - List posts by type
- POST `/api/admin/posts` - Create post
- PUT `/api/admin/posts/:id` - Update post metadata
- PUT `/api/admin/posts/:id/translations/:lang` - Update translation

**Media:**
- GET `/api/admin/media` - List media
- POST `/api/admin/media` - Upload media
- DELETE `/api/admin/media/:id` - Delete media

**Preview:**
- POST `/api/admin/preview` - Create preview
- GET `/api/preview/:token` - Get preview content

## Component Architecture

### FieldRenderer.vue

Dynamic component that renders form fields based on schema definition:

```vue
<FieldRenderer
  :field="fieldDef"
  :modelValue="fieldValue"
  @update:modelValue="handleUpdate"
/>
```

Supports all field types defined in LUMO schema.

### RichtextEditor.vue

TipTap-based rich text editor:

```vue
<RichtextEditor
  :modelValue="content"
  @update:modelValue="updateContent"
/>
```

Stores content as TipTap JSON format.

### ImageField.vue / MediaPicker.vue

Media selection with browse/upload:

```vue
<ImageField
  :modelValue="mediaReference"
  @update:modelValue="updateImage"
/>
```

Returns `{ mediaId, alt }` MediaReference object.

## Styling

Uses Tailwind CSS with custom components:

- `.btn`, `.btn-primary`, `.btn-secondary` - Buttons
- `.input` - Form inputs
- `.card` - Content cards

## Configuration

The admin app fetches `lumo.config.ts` from the server at startup to:
- Know which pages exist
- Know which post types exist
- Render correct fields for each
- Validate before submission

## Deployment

Build the admin app and serve it under `/admin` route on your server.

The server should:
1. Serve `index.html` for `/admin` and `/admin/*` routes
2. Proxy API requests to the LUMO API server

Example Nginx config:

```nginx
location /admin {
  try_files $uri $uri/ /admin/index.html;
}

location /api {
  proxy_pass http://localhost:3000;
}
```
