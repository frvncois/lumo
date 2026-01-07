# Available Icons

This document lists all available SVG icons in the `/src/assets` directory and their current usage.

## Icon Assets

| Icon File | Usage | Component |
|-----------|-------|-----------|
| `app-page.svg` | Pages section | Dashboard |
| `app-post.svg` | Post Types section | Dashboard |
| `app-language.svg` | Languages settings | SettingsGeneral |
| `app-api.svg` | API documentation | SettingsAPI |
| `app-content.svg` | - | Not yet used |
| `app-files.svg` | - | Not yet used |
| `app-settings.svg` | - | Not yet used |
| `app-user.svg` | - | Not yet used |

## How to Use Icons

### 1. Import the icon (with `?url` suffix)
```typescript
import pageIcon from '../assets/app-page.svg?url'
```

**Important:** The `?url` suffix tells Vite to return the asset URL instead of the SVG code.

### 2. Pass to CardHeader
```vue
<CardHeader title="Pages" :icon="pageIcon" />
```

### Icon Component Logic
The `CardHeader` component automatically detects whether the icon is:
- **SVG path** (string containing `.svg` or starting with `/`) → Renders as `<img>`
- **Emoji** (any other string) → Renders as text

## Icon Styling
All icons are displayed in a consistent container:
- Background: `bg-gray-100`
- Shape: `rounded-full`
- Padding: `p-2`
- Size: `w-10 h-10` container, `w-5 h-5` icon

## Adding New Icons

1. Add SVG file to `/src/assets/`
2. Import in your component (note the `?url` suffix):
   ```typescript
   import myIcon from '../assets/my-icon.svg?url'
   ```
3. Use in CardHeader:
   ```vue
   <CardHeader title="My Title" :icon="myIcon" />
   ```

## Type Declarations

SVG URL imports are typed in `/src/vite-env.d.ts`:
```typescript
declare module '*.svg?url' {
  const content: string
  export default content
}
```

This allows TypeScript to recognize SVG URL imports and provides type safety.

**Note:** The `?url` suffix is a Vite convention that explicitly imports the asset URL path rather than the file contents.
