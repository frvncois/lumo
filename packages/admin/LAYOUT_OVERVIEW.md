# LUMO Admin Layout Overview

Complete layout system with UI components and application structure.

## Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            AppHeader                                    │
│  ┌──────┐  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │ LUMO │  │ Pages / Edit Page   │  │ [Preview] [Save] [Publish]   │  │
│  └──────┘  └─────────────────────┘  └──────────────────────────────┘  │
├──────────────┬──────────────────────────────────────┬───────────────────┤
│              │                                      │                   │
│ AppSidebar   │         AppContent                   │   AppDetails      │
│              │                                      │                   │
│ ┌──────────┐ │  ┌────────────────────────────────┐ │ ┌───────────────┐ │
│ │ Pages    │ │  │                                │ │ │ Page Details  │ │
│ │ Files    │ │  │                                │ │ │               │ │
│ │          │ │  │                                │ │ │ Status: Live  │ │
│ │ ──────── │ │  │    Main Content Area          │ │ │ Updated: 2h   │ │
│ │ Blog     │ │  │    (router-view)              │ │ │               │ │
│ │ Team     │ │  │                                │ │ │ ───────────── │ │
│ │ Events   │ │  │                                │ │ │               │ │
│ │          │ │  │                                │ │ │ Translations  │ │
│ │ ──────── │ │  │                                │ │ │ • EN (default)│ │
│ │ Settings │ │  │                                │ │ │ • FR          │ │
│ │          │ │  │                                │ │ │               │ │
│ ┌──────────┐ │  └────────────────────────────────┘ │ └───────────────┘ │
│ │ 👤 User  │ │                                      │                   │
│ │ user@x.y │ │                                      │                   │
│ │ [Logout] │ │                                      │                   │
│ └──────────┘ │                                      │                   │
└──────────────┴──────────────────────────────────────┴───────────────────┘
```

## Component Structure

### Layout Components (src/components/)

```
Layout.vue              ← Main layout wrapper
├── AppHeader.vue       ← Top bar (app name, breadcrumb, actions)
├── AppSidebar.vue      ← Left navigation (pages, files, collections, user)
├── AppContent.vue      ← Center content area (router-view)
└── AppDetails.vue      ← Right details panel (contextual info)
```

### UI Components (src/components/ui/)

```
Button.vue              ← Button (default, ghost, outline / sm, md, lg)
Card.vue                ← Card wrapper
├── CardHeader.vue      ← Card header section
├── CardContent.vue     ← Card content section
└── CardFooter.vue      ← Card footer section
Input.vue               ← Input field (sm, md, lg)
List.vue                ← List wrapper
├── ListHeader.vue      ← List header section
├── ListContent.vue     ← List content section
└── ListAction.vue      ← List action section
```

## Layout Features

### AppHeader
- **Left**: LUMO logo + Auto-generated breadcrumbs
- **Right**: Slot for action buttons (Save, Preview, Publish)
- **Sticky**: Fixed at top of viewport
- **Auto-breadcrumbs**: Generated from route name

### AppSidebar
- **Navigation**:
  - Pages (Dashboard)
  - Files (Media Library)
  - Collections (Post types from config)
  - Settings
- **User Section**:
  - User avatar (initials)
  - Email
  - Role
  - Logout button
- **Dynamic**: Post types loaded from lumo.config.ts
- **Fixed width**: 256px (w-64)

### AppContent
- **Flexible**: Takes remaining space (flex-1)
- **Scrollable**: Independent scroll container
- **Padding**: Consistent 32px padding
- **Background**: Gray-50

### AppDetails
- **Conditional**: Only renders when content provided
- **Fixed width**: 320px (w-80)
- **Scrollable**: Independent scroll container
- **Use cases**:
  - Page details (status, dates, translations)
  - Post details (status, publish date, author)
  - Project details (languages, post types)

## Usage Examples

### Basic View (no details, no actions)

```vue
<!-- views/Dashboard.vue -->
<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">Pages</h1>
    <!-- content -->
  </div>
</template>
```

### View with Header Actions

```vue
<template>
  <div>
    <h1>Edit Page</h1>
    <!-- content -->
  </div>
</template>

<!-- Note: Need to implement teleport or provide mechanism for this -->
```

### View with Details Panel

To add details panel, you would need to update the router setup or use a different pattern. The current router-view doesn't support named slots directly.

**Option 1: Teleport Pattern**
```vue
<template>
  <div>
    <h1>Edit Page</h1>
  </div>

  <Teleport to="#details-panel">
    <Card>
      <CardHeader>
        <h3>Page Details</h3>
      </CardHeader>
      <CardContent>
        <p>Status: Published</p>
      </CardContent>
    </Card>
  </Teleport>
</template>
```

**Option 2: Layout Props Pattern**
Update individual views to export details configuration that Layout can consume.

## UI Component Usage

### Button Examples
```vue
<Button variant="default" size="md">Save</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="ghost" size="lg">Delete</Button>
```

### Card Examples
```vue
<Card>
  <CardHeader>
    <h3 class="font-semibold">Title</h3>
  </CardHeader>
  <CardContent>
    <p>Content here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Input Examples
```vue
<Input v-model="title" placeholder="Page title" size="md" />
<Input v-model="search" placeholder="Search..." size="sm" />
```

### List Examples
```vue
<List>
  <ListHeader><h3>Items</h3></ListHeader>
  <ListContent>
    <div class="flex justify-between">
      <span>Item 1</span>
      <ListAction>
        <Button variant="ghost" size="sm">Edit</Button>
      </ListAction>
    </div>
  </ListContent>
</List>
```

## Styling System

- **Colors**: Blue primary (600, 700), Gray scale
- **Spacing**: Consistent padding/margin (Tailwind scale)
- **Borders**: Gray-200 for all dividers
- **Shadows**: Subtle shadows (shadow-sm)
- **Transitions**: All interactive elements have transitions
- **Focus states**: Blue ring on focus (ring-blue-500)

## Responsive Behavior

- **Fixed viewport**: `h-screen` prevents page scroll
- **Independent scrolling**: Each panel scrolls separately
- **Overflow handling**: Proper overflow-auto on scrollable areas
- **Sticky header**: Header stays at top
- **Flex layout**: Content area grows to fill space

## Next Steps

1. **Implement Teleport targets** in Layout for actions and details
2. **Update existing views** to use new UI components
3. **Add Settings page** (currently placeholder in sidebar)
4. **Test responsive behavior** with different content sizes
5. **Add transitions** for smooth panel appearance

## File Locations

```
packages/admin/src/
├── components/
│   ├── Layout.vue              ← Main layout
│   ├── AppHeader.vue           ← Header component
│   ├── AppSidebar.vue          ← Sidebar component
│   ├── AppContent.vue          ← Content component
│   ├── AppDetails.vue          ← Details component
│   ├── LAYOUT.md               ← Layout documentation
│   └── ui/
│       ├── Button.vue
│       ├── Card.vue
│       ├── CardHeader.vue
│       ├── CardContent.vue
│       ├── CardFooter.vue
│       ├── Input.vue
│       ├── List.vue
│       ├── ListHeader.vue
│       ├── ListContent.vue
│       ├── ListAction.vue
│       ├── index.ts            ← Barrel export
│       └── README.md           ← UI components docs
└── views/
    ├── Dashboard.vue
    ├── PageEditor.vue
    ├── PostEditor.vue
    └── MediaLibrary.vue
```

## Design Tokens

```css
/* Primary */
--primary-600: #2563eb
--primary-700: #1d4ed8

/* Gray Scale */
--gray-50: #f9fafb
--gray-100: #f3f4f6
--gray-200: #e5e7eb
--gray-300: #d1d5db
--gray-400: #9ca3af
--gray-500: #6b7280
--gray-600: #4b5563
--gray-700: #374151
--gray-800: #1f2937
--gray-900: #111827

/* Sizing */
--sidebar-width: 16rem (256px)
--details-width: 20rem (320px)
--header-height: auto (fit-content)

/* Spacing */
--content-padding: 2rem (32px)
--card-padding: 1.5rem (24px)
```
