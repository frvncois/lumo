# Layout System

The LUMO admin layout consists of four main components that work together to create a flexible, responsive interface.

## Components

### Layout.vue
Main layout wrapper that composes all layout components together.

### AppHeader
Full-width top bar containing:
- App name (LUMO)
- Breadcrumb navigation (auto-generated or custom)
- Action buttons slot (save, preview, publish, etc.)

### AppSidebar
Left sidebar navigation containing:
- Pages (Dashboard)
- Files (Media Library)
- Collections (Post Types from config)
- Settings
- User profile and logout

### AppContent
Center content area where the main view content is rendered.

### AppDetails
Right sidebar for contextual information. Only visible when content is provided.

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        AppHeader                            │
│  LUMO / Breadcrumb / Breadcrumb      [Actions]              │
├──────────┬──────────────────────────────────┬───────────────┤
│          │                                  │               │
│          │                                  │               │
│  App     │         AppContent               │  AppDetails   │
│ Sidebar  │                                  │               │
│          │    (Main Content Area)           │  (Contextual  │
│  - Pages │                                  │   Details)    │
│  - Files │                                  │               │
│  - Posts │                                  │               │
│  - ...   │                                  │               │
│          │                                  │               │
│  [User]  │                                  │               │
└──────────┴──────────────────────────────────┴───────────────┘
```

## Basic Usage

The Layout component is already integrated into the router. It wraps all authenticated routes.

```vue
<!-- routes/index.ts -->
{
  path: '/admin',
  component: () => import('../components/Layout.vue'),
  meta: { requiresAuth: true },
  children: [
    // Your routes here
  ]
}
```

## Adding Header Actions

To add action buttons to the header (save, preview, publish), use the `actions` slot in your view:

```vue
<!-- Example: PageEditor.vue -->
<template>
  <div>
    <!-- Your content here -->
    <h1>Edit Page</h1>
    <!-- ... -->
  </div>

  <!-- Header actions -->
  <template #actions>
    <Button variant="outline" size="sm" @click="handlePreview">
      Preview
    </Button>
    <Button variant="default" size="sm" @click="handleSave">
      Save
    </Button>
    <Button variant="default" size="sm" @click="handlePublish">
      Publish
    </Button>
  </template>
</template>
```

**Note:** Currently, header actions need to be injected via a different approach since router-view doesn't support named slots. See the advanced usage section below.

## Adding Details Panel

To add contextual details to the right sidebar, provide content to the `details` slot:

```vue
<template>
  <div>
    <!-- Your content here -->
  </div>

  <!-- Details panel -->
  <template #details>
    <Card>
      <CardHeader>
        <h3 class="text-sm font-semibold">Page Details</h3>
      </CardHeader>
      <CardContent>
        <dl class="space-y-3">
          <div>
            <dt class="text-xs text-gray-500">Status</dt>
            <dd class="text-sm font-medium">Published</dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500">Last Updated</dt>
            <dd class="text-sm">2 hours ago</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  </template>
</template>
```

## Custom Breadcrumbs

Breadcrumbs are auto-generated based on the current route, but you can provide custom breadcrumbs:

```vue
<template>
  <Layout :breadcrumbs="breadcrumbs">
    <!-- content -->
  </Layout>
</template>

<script setup lang="ts">
const breadcrumbs = [
  { label: 'Pages', to: '/admin' },
  { label: 'About Page', to: '/admin/pages/about' },
  { label: 'Edit Translation' }
]
</script>
```

## Auto-Generated Breadcrumbs

The system automatically generates breadcrumbs based on route names:

- `Dashboard` → "Pages"
- `PageEditor` → "Pages / Edit Page"
- `PostList` → "Posts"
- `PostEditor` → "Posts / Edit Post"
- `MediaLibrary` → "Files"

## Sidebar Navigation

The sidebar automatically includes:

1. **Static routes**: Pages, Files
2. **Dynamic collections**: Post types from `lumo.config.ts`
3. **Settings**: Settings link (placeholder)
4. **User section**: Email, role, and logout button

Post types are automatically loaded from the config and displayed under "Collections".

## Responsive Behavior

- The layout uses `h-screen` and `overflow-hidden` to create a fixed viewport
- Each section is independently scrollable
- The sidebar is fixed width (w-64)
- The content area is flexible (flex-1)
- The details panel is fixed width (w-80) and only shown when content exists

## Styling

All components use Tailwind CSS with the LUMO design system:

- Primary color: Blue (blue-600, blue-700)
- Background: Gray-50
- Borders: Gray-200
- Text: Gray-900, Gray-700

## Advanced: Teleport for Header Actions

Since router-view doesn't support named slots, you can use Vue's Teleport to inject header actions:

```vue
<!-- In your view component -->
<template>
  <div>
    <!-- Your content -->
  </div>

  <!-- Teleport actions to header -->
  <Teleport to="#header-actions" v-if="mounted">
    <Button variant="default" @click="save">Save</Button>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const mounted = ref(false)
onMounted(() => mounted.value = true)
</script>
```

Then in AppHeader.vue, add:
```vue
<div id="header-actions">
  <slot name="actions" />
</div>
```

## Examples

See the following views for examples:
- `views/Dashboard.vue` - Basic usage
- `views/PageEditor.vue` - With details panel and actions
- `views/PostEditor.vue` - With details panel and actions
- `views/MediaLibrary.vue` - Media-specific layout
