# Card Components - Usage Guide

The Card components now follow a shadcn-like pattern where styles are self-contained and you pass props instead of manually styling.

## Components

### Card
Main wrapper component with rounded corners and white background.

```vue
<Card>
  <!-- Card content -->
</Card>
```

### CardHeader
Header section with built-in styling for title, subtitle, icon, and actions.

**Props:**
- `title?: string` - Main heading (auto-styled as text-xl font-semibold)
- `subtitle?: string` - Secondary text below title
- `icon?: string` - SVG path or emoji displayed before title (auto-detects type)

**Slots:**
- `default` - For custom header content (when not using props)
- `actions` - For action buttons in the top-right

**Examples:**

```vue
<script setup lang="ts">
import pageIcon from '../assets/app-page.svg?url'
</script>

<!-- Simple title -->
<CardHeader title="API Endpoints" />

<!-- Title with SVG icon -->
<CardHeader title="Pages" :icon="pageIcon" />

<!-- Title with emoji icon (still supported) -->
<CardHeader title="Settings" icon="⚙️" />

<!-- Title with subtitle -->
<CardHeader
  title="Page Schemas"
  subtitle="Manage your page structures"
/>

<!-- Title with actions -->
<CardHeader title="Page Schemas">
  <template #actions>
    <Button @click="create" variant="default" size="sm">
      Add New
    </Button>
  </template>
</CardHeader>

<!-- Custom content (legacy support) -->
<CardHeader>
  <h2 class="text-xl font-semibold">Custom Header</h2>
</CardHeader>
```

### CardContent
Content area with consistent padding.

```vue
<CardContent>
  <!-- Your content here -->
</CardContent>
```

### CardFooter
Footer section with border-top and gray background. Can render actions automatically or use custom content.

**Props:**
- `actions?: Action[]` - Array of action objects

**Action Interface:**
```typescript
interface Action {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}
```

**Examples:**

```vue
<!-- With actions prop -->
<CardFooter :actions="[
  { label: 'Cancel', onClick: handleCancel, variant: 'secondary' },
  { label: 'Save', onClick: handleSave, variant: 'primary' }
]" />

<!-- Custom content -->
<CardFooter>
  <div class="flex justify-between w-full">
    <span class="text-sm text-gray-600">Last updated: {{ date }}</span>
    <Button @click="save">Save Changes</Button>
  </div>
</CardFooter>
```

## Complete Example

**Before (old pattern):**
```vue
<Card>
  <CardHeader>
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-900">Page Schemas</h2>
      <Button @click="create" variant="default" size="sm">
        Add Page Schema
      </Button>
    </div>
  </CardHeader>
  <CardContent>
    <p class="text-gray-600">Content here</p>
  </CardContent>
  <CardFooter>
    <div class="flex justify-end gap-2">
      <button class="btn btn-secondary" @click="cancel">Cancel</button>
      <button class="btn btn-primary" @click="save">Save</button>
    </div>
  </CardFooter>
</Card>
```

**After (new pattern):**
```vue
<Card>
  <CardHeader title="Page Schemas">
    <template #actions>
      <Button @click="create" variant="default" size="sm">
        Add Page Schema
      </Button>
    </template>
  </CardHeader>
  <CardContent>
    <p class="text-gray-600">Content here</p>
  </CardContent>
  <CardFooter :actions="[
    { label: 'Cancel', onClick: cancel, variant: 'secondary' },
    { label: 'Save', onClick: save, variant: 'primary' }
  ]" />
</Card>
```

## Benefits

1. **Less boilerplate** - No need to repeat styling classes
2. **Consistency** - All cards have the same styling automatically
3. **Easier maintenance** - Change styles in one place
4. **Better DX** - Clean, declarative API
5. **Backward compatible** - Old slot-based approach still works

## Migration Checklist

- [ ] Replace manual `<h2>` tags with `title` prop
- [ ] Move action buttons to `#actions` slot
- [ ] Replace custom footer buttons with `actions` prop (optional)
- [ ] Remove manual styling classes from headers
- [ ] Test that visual appearance is unchanged
