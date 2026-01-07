# UI Components

A collection of reusable UI components built with Vue 3 and Tailwind CSS.

## Components

### Button

Button component with variants and sizes.

**Props:**
- `variant`: `'default'` | `'ghost'` | `'outline'` (default: `'default'`)
- `size`: `'sm'` | `'md'` | `'lg'` (default: `'md'`)
- `type`: `'button'` | `'submit'` | `'reset'` (default: `'button'`)
- `disabled`: boolean (default: `false`)

**Events:**
- `@click`: Emitted when button is clicked

**Usage:**
```vue
<template>
  <Button variant="default" size="md" @click="handleClick">
    Click me
  </Button>

  <Button variant="ghost" size="sm">
    Ghost Button
  </Button>

  <Button variant="outline" size="lg">
    Outline Button
  </Button>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui'
</script>
```

---

### Card

Card container with optional header, content, and footer sections.

**Components:**
- `Card`: Main wrapper
- `CardHeader`: Header section with bottom border
- `CardContent`: Main content area
- `CardFooter`: Footer section with top border and gray background

**Usage:**
```vue
<template>
  <Card>
    <CardHeader>
      <h3 class="text-lg font-semibold">Card Title</h3>
    </CardHeader>
    <CardContent>
      <p>Card content goes here</p>
    </CardContent>
    <CardFooter>
      <Button variant="default">Action</Button>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardHeader, CardContent, CardFooter, Button } from '@/components/ui'
</script>
```

---

### Input

Input field component with variants and sizes.

**Props:**
- `modelValue`: string | number
- `type`: string (default: `'text'`)
- `placeholder`: string
- `variant`: `'default'` | `'ghost'` | `'outline'` (default: `'default'`)
- `size`: `'sm'` | `'md'` | `'lg'` (default: `'md'`)
- `disabled`: boolean (default: `false`)

**Variants:**
- `default`: Standard input with border and background
- `ghost`: Transparent input with subtle hover effect (minimal, no border)
- `outline`: Input with prominent border, no background

**Events:**
- `@update:modelValue`: Emitted when input value changes

**Usage:**
```vue
<template>
  <!-- Default variant -->
  <Input
    v-model="email"
    type="email"
    placeholder="Enter your email"
    variant="default"
    size="md"
  />

  <!-- Ghost variant (minimal, for content editing) -->
  <Input
    v-model="title"
    placeholder="Enter title..."
    variant="ghost"
    size="lg"
  />

  <!-- Outline variant -->
  <Input
    v-model="search"
    placeholder="Search..."
    variant="outline"
    size="sm"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '@/components/ui'

const email = ref('')
const title = ref('')
const search = ref('')
</script>
```

---

### List

List component with header, content, and action sections.

**Components:**
- `List`: Main wrapper with size prop
- `ListHeader`: Header section
- `ListContent`: Content section
- `ListAction`: Action section (typically for buttons)

**Props (on List, ListHeader, ListContent, ListAction):**
- `size`: `'sm'` | `'md'` | `'lg'` (default: `'md'`)

**Usage:**
```vue
<template>
  <List size="md">
    <ListHeader size="md">
      <h3>My List</h3>
    </ListHeader>

    <div>
      <ListContent size="md">
        <div class="flex items-center justify-between">
          <span>Item 1</span>
          <ListAction size="md">
            <Button variant="ghost" size="sm">Edit</Button>
            <Button variant="ghost" size="sm">Delete</Button>
          </ListAction>
        </div>
      </ListContent>

      <ListContent size="md">
        <div class="flex items-center justify-between">
          <span>Item 2</span>
          <ListAction size="md">
            <Button variant="ghost" size="sm">Edit</Button>
            <Button variant="ghost" size="sm">Delete</Button>
          </ListAction>
        </div>
      </ListContent>
    </div>
  </List>
</template>

<script setup lang="ts">
import { List, ListHeader, ListContent, ListAction, Button } from '@/components/ui'
</script>
```

---

### Tooltip

Tooltip component for hover hints.

**Props:**
- `text`: string (required) - The text to display in the tooltip
- `position`: `'top'` | `'right'` | `'bottom'` | `'left'` (default: `'right'`)

**Usage:**
```vue
<template>
  <Tooltip text="This is a hint" position="right">
    <Button variant="ghost" size="sm">
      Hover me
    </Button>
  </Tooltip>

  <Tooltip text="Save document" position="bottom">
    <button class="p-2">
      <svg><!-- icon --></svg>
    </button>
  </Tooltip>
</template>

<script setup lang="ts">
import { Tooltip, Button } from '@/components/ui'
</script>
```

**Features:**
- Smooth fade in/out transitions
- Automatic positioning with arrow
- Dark theme (gray-900 background)
- Non-interactive (pointer-events-none)

---

## Import

You can import components individually or use the barrel export:

```typescript
// Individual imports
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

// Barrel export
import { Button, Card, CardHeader, Input, List } from '@/components/ui'
```
