# LUMO Repeater Fields & Global Type - Frontend Implementation Guide

## 📋 What's Been Completed

### ✅ Phase 1: Core Package (100% Complete)
- Added `repeater` field type to `FieldType` union
- Added `fields?: FieldDefinition[]` to `FieldDefinition` interface
- Added Global types: `GlobalSchema`, `GlobalSchemaInput`, `GlobalTranslationContent`, `Global`
- Implemented recursive repeater validation with depth tracking (max 5 levels, max 50 items)
- Added error codes: `REPEATER_MAX_DEPTH`, `REPEATER_MAX_ITEMS`, `REPEATER_INVALID_ITEM`, `REPEATER_NO_FIELDS`
- Created `validateGlobalSchema()` and `validateGlobalTranslation()` functions
- Exported all new types and constants

### ✅ Phase 2: Database Package (100% Complete)
- Created 3 new tables: `global_schemas`, `globals`, `global_translations`
- Created `adapters/globals.ts` with full CRUD operations
- Added global schema functions to `adapters/schemas.ts`
- Updated all database types and exports

### ✅ Phase 3: Server Package (100% Complete)
- Updated `config/loader.ts` to load global schemas from database
- Created `routes/public/globals.ts` - Public API for fetching global content
- Created `routes/admin/globals.ts` - Admin API for managing globals
- Added global schema routes to `routes/admin/schemas.ts`
- Registered all routes in `app.ts`

---

## 🎯 What Needs Implementation: Admin UI (Vue Components)

### Files to Create/Modify

#### **New Files to Create:**
1. `packages/admin/src/components/RepeaterField.vue` - Repeater field editor component
2. `packages/admin/src/views/GlobalEditor.vue` - Global content editor view
3. `packages/admin/src/views/GlobalsList.vue` - List of all globals

#### **Files to Modify:**
1. `packages/admin/src/components/FieldRenderer.vue` - Add repeater case
2. `packages/admin/src/components/SchemaEditorModal.vue` - Add repeater type & sub-fields editor
3. `packages/admin/src/views/Dashboard.vue` - Add globals section
4. `packages/admin/src/components/AppSidebar.vue` - Add globals navigation
5. `packages/admin/src/router/index.ts` - Add global routes
6. `packages/admin/src/views/settings/SettingsSchema.vue` - Add global schemas section
7. `packages/admin/src/utils/api.ts` - Add global API methods

---

## 📦 1. Create RepeaterField.vue Component

**Location:** `packages/admin/src/components/RepeaterField.vue`

**Purpose:** Provides UI for editing repeater fields (array of structured objects)

**Key Features:**
- Display list of repeater items
- Add/remove items
- Drag & drop reordering
- Recursive field rendering for sub-fields
- Nested repeater support

**Implementation:**

```vue
<template>
  <div class="repeater-field space-y-3">
    <div class="flex justify-between items-center">
      <label class="block text-sm font-medium text-gray-700">
        {{ field.label }}
        <span v-if="field.required" class="text-red-500">*</span>
      </label>
      <button
        @click="addItem"
        type="button"
        class="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Item
      </button>
    </div>

    <!-- Empty state -->
    <div
      v-if="items.length === 0"
      class="text-sm text-gray-500 italic p-4 border-2 border-dashed border-gray-300 rounded-lg text-center"
    >
      No items. Click "Add Item" to add one.
    </div>

    <!-- Items list with drag & drop -->
    <draggable
      v-else
      v-model="items"
      item-key="_uid"
      handle=".drag-handle"
      @end="emitUpdate"
      class="space-y-3"
    >
      <template #item="{ element, index }">
        <div class="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
          <!-- Item header -->
          <div class="flex justify-between items-center mb-3">
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="drag-handle cursor-move text-gray-400 hover:text-gray-600"
                title="Drag to reorder"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                </svg>
              </button>
              <span class="text-sm font-medium text-gray-600">Item {{ index + 1 }}</span>
            </div>
            <button
              @click="removeItem(index)"
              type="button"
              class="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Remove
            </button>
          </div>

          <!-- Sub-fields -->
          <div class="space-y-4 ml-7">
            <FieldRenderer
              v-for="subField in field.fields"
              :key="subField.key"
              :field="subField"
              :modelValue="element[subField.key]"
              @update:modelValue="(val) => updateItemField(index, subField.key, val)"
            />
          </div>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
import FieldRenderer from './FieldRenderer.vue'

interface FieldDefinition {
  key: string
  type: string
  label: string
  required: boolean
  fields?: FieldDefinition[]
}

const props = defineProps<{
  field: FieldDefinition & { type: 'repeater' }
  modelValue: any[] | null | undefined
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any[]]
}>()

const items = ref<any[]>([])

// Sync from prop
watch(
  () => props.modelValue,
  (val) => {
    if (Array.isArray(val)) {
      // Add unique IDs for drag & drop
      items.value = val.map((item, idx) => ({
        ...item,
        _uid: `${Date.now()}-${idx}`,
      }))
    } else {
      items.value = []
    }
  },
  { immediate: true }
)

function addItem() {
  // Create empty item with all sub-fields initialized
  const newItem: Record<string, any> = {
    _uid: `${Date.now()}-${items.value.length}`,
  }

  for (const subField of props.field.fields || []) {
    if (subField.type === 'boolean') {
      newItem[subField.key] = false
    } else if (subField.type === 'repeater') {
      newItem[subField.key] = []
    } else {
      newItem[subField.key] = null
    }
  }

  items.value.push(newItem)
  emitUpdate()
}

function removeItem(index: number) {
  items.value.splice(index, 1)
  emitUpdate()
}

function updateItemField(index: number, key: string, value: any) {
  items.value[index][key] = value
  emitUpdate()
}

function emitUpdate() {
  // Remove _uid before emitting
  const cleanItems = items.value.map((item) => {
    const { _uid, ...rest } = item
    return rest
  })
  emit('update:modelValue', cleanItems)
}
</script>

<style scoped>
.drag-handle {
  cursor: move;
}
</style>
```

**Dependencies:**
- Install `vuedraggable`: `npm install vuedraggable@next` (for Vue 3)

**Testing Checklist:**
- [ ] Can add new items
- [ ] Can remove items
- [ ] Can drag & drop to reorder
- [ ] Sub-fields render correctly
- [ ] Nested repeaters work (repeater inside repeater)
- [ ] Required validation works
- [ ] Empty state displays properly

---

## 📦 2. Update FieldRenderer.vue Component

**Location:** `packages/admin/src/components/FieldRenderer.vue`

**Changes Needed:** Add support for repeater field type

**Find the template section** where field types are handled (likely a series of `v-if/v-else-if` statements) and add:

```vue
<!-- Add this alongside other field type cases -->
<RepeaterField
  v-else-if="field.type === 'repeater'"
  :field="field"
  :modelValue="modelValue"
  @update:modelValue="$emit('update:modelValue', $event)"
/>
```

**In the script section**, add the import:

```typescript
import RepeaterField from './RepeaterField.vue'
```

**Example of complete template pattern:**

```vue
<template>
  <div class="field-renderer">
    <!-- Text -->
    <TextField
      v-if="field.type === 'text'"
      :field="field"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
    />

    <!-- ... other field types ... -->

    <!-- Repeater -->
    <RepeaterField
      v-else-if="field.type === 'repeater'"
      :field="field"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
    />

    <!-- Unknown type fallback -->
    <div v-else class="text-red-600">
      Unknown field type: {{ field.type }}
    </div>
  </div>
</template>
```

---

## 📦 3. Update SchemaEditorModal.vue Component

**Location:** `packages/admin/src/components/SchemaEditorModal.vue`

**Changes Needed:** Add repeater to field type options and show sub-fields editor

### Step 1: Add 'repeater' to field type dropdown

Find the field type select/dropdown and add repeater:

```vue
<select v-model="editingField.type" class="...">
  <option value="text">Text</option>
  <option value="textarea">Textarea</option>
  <option value="richtext">Rich Text</option>
  <option value="image">Image</option>
  <option value="gallery">Gallery</option>
  <option value="url">URL</option>
  <option value="boolean">Boolean</option>
  <option value="repeater">Repeater</option> <!-- Add this -->
</select>
```

### Step 2: Add sub-fields editor for repeater type

After the field type selector, add conditional sub-fields editor:

```vue
<!-- Sub-fields editor for repeater type -->
<div v-if="editingField.type === 'repeater'" class="mt-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
  <h4 class="text-sm font-medium text-gray-700 mb-3">Sub-fields</h4>

  <!-- Warning about nesting depth -->
  <div v-if="currentDepth >= 4" class="mb-3 p-2 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800">
    Warning: You are at nesting level {{ currentDepth + 1 }}. Maximum depth is 5 levels.
  </div>

  <!-- Sub-fields list -->
  <div class="space-y-2">
    <div
      v-for="(subField, index) in editingField.fields"
      :key="index"
      class="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded"
    >
      <span class="text-sm flex-1">{{ subField.label }} ({{ subField.type }})</span>
      <button
        @click="editSubField(index)"
        type="button"
        class="text-blue-600 hover:text-blue-800 text-sm"
      >
        Edit
      </button>
      <button
        @click="removeSubField(index)"
        type="button"
        class="text-red-600 hover:text-red-800 text-sm"
      >
        Remove
      </button>
    </div>
  </div>

  <button
    @click="addSubField"
    type="button"
    :disabled="currentDepth >= 4"
    class="mt-3 inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    Add Sub-field
  </button>
</div>
```

### Step 3: Add sub-field management logic

In the script section, add these methods:

```typescript
// Track current nesting depth
const currentDepth = ref(0)

// Initialize fields array when type changes to repeater
watch(() => editingField.value.type, (newType) => {
  if (newType === 'repeater' && !editingField.value.fields) {
    editingField.value.fields = []
  }
})

function addSubField() {
  if (!editingField.value.fields) {
    editingField.value.fields = []
  }

  // Open a nested field editor modal or inline form
  // For simplicity, you can reuse the same field editor logic
  const newSubField = {
    key: '',
    type: 'text',
    label: '',
    required: false,
  }

  // You could either:
  // 1. Open a nested modal
  // 2. Add inline and let user edit
  // 3. Use a recursive component

  editingField.value.fields.push(newSubField)
}

function editSubField(index: number) {
  // Open editor for this sub-field
  // Increment depth for nested repeater support
}

function removeSubField(index: number) {
  editingField.value.fields?.splice(index, 1)
}
```

**Note:** For a production implementation, you'll want to create a recursive field editor that can handle nested repeaters properly. The simplest approach is to open a new modal for editing sub-fields.

---

## 📦 4. Create GlobalEditor.vue View

**Location:** `packages/admin/src/views/GlobalEditor.vue`

**Purpose:** Editor for global content (similar to PageEditor but for globals)

```vue
<template>
  <div class="global-editor max-w-4xl mx-auto p-6">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ schema?.name || 'Global' }}</h1>
        <p class="text-sm text-gray-500 mt-1">{{ schemaSlug }}</p>
      </div>
      <div class="flex gap-3">
        <button
          @click="router.back()"
          type="button"
          class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          @click="save"
          :disabled="isSaving"
          class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {{ isSaving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>

    <!-- Language tabs -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="-mb-px flex space-x-8">
        <button
          v-for="lang in languages"
          :key="lang"
          @click="currentLang = lang"
          :class="[
            currentLang === lang
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          {{ lang.toUpperCase() }}
          <span v-if="!translations[lang]" class="ml-2 text-gray-400">(empty)</span>
        </button>
      </nav>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-sm text-gray-600">Loading global...</p>
    </div>

    <!-- Fields -->
    <div v-else-if="schema" class="space-y-6">
      <FieldRenderer
        v-for="field in schema.fields"
        :key="field.key"
        :field="field"
        :modelValue="currentFields[field.key]"
        @update:modelValue="(val) => updateField(field.key, val)"
      />
    </div>

    <!-- Error message -->
    <div v-if="error" class="mt-4 p-4 bg-red-50 border border-red-300 rounded-md">
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>

    <!-- Success message -->
    <div v-if="successMessage" class="mt-4 p-4 bg-green-50 border border-green-300 rounded-md">
      <p class="text-sm text-green-800">{{ successMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfig } from '../composables/useConfig'
import { api } from '../utils/api'
import FieldRenderer from '../components/FieldRenderer.vue'

const route = useRoute()
const router = useRouter()
const { config, refreshConfig } = useConfig()

const schemaSlug = computed(() => route.params.slug as string)
const schema = computed(() => config.value?.globals?.[schemaSlug.value])
const languages = computed(() => config.value?.languages || ['en'])
const defaultLanguage = computed(() => config.value?.defaultLanguage || 'en')

const currentLang = ref('')
const translations = ref<Record<string, { fields: Record<string, any> }>>({})
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref('')
const successMessage = ref('')

const currentFields = computed(() => {
  return translations.value[currentLang.value]?.fields || {}
})

onMounted(async () => {
  currentLang.value = defaultLanguage.value
  await loadGlobal()
})

watch(schemaSlug, () => loadGlobal())

async function loadGlobal() {
  isLoading.value = true
  error.value = ''

  try {
    const data = await api.getGlobal(schemaSlug.value)
    translations.value = data.translations || {}
  } catch (err) {
    // Global might not exist yet, that's ok
    translations.value = {}
  } finally {
    isLoading.value = false
  }
}

function updateField(key: string, value: any) {
  if (!translations.value[currentLang.value]) {
    translations.value[currentLang.value] = { fields: {} }
  }
  translations.value[currentLang.value].fields[key] = value
}

async function save() {
  isSaving.value = true
  error.value = ''
  successMessage.value = ''

  try {
    await api.updateGlobalTranslation(
      schemaSlug.value,
      currentLang.value,
      { fields: currentFields.value }
    )
    successMessage.value = 'Saved successfully!'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save'
  } finally {
    isSaving.value = false
  }
}
</script>
```

---

## 📦 5. Create GlobalsList.vue View

**Location:** `packages/admin/src/views/GlobalsList.vue`

```vue
<template>
  <div class="globals-list max-w-6xl mx-auto p-6">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Globals</h1>

    <!-- Empty state -->
    <div v-if="globalSchemas.length === 0" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No globals</h3>
      <p class="mt-1 text-sm text-gray-500">
        Go to Settings → Schemas to create a global schema
      </p>
      <div class="mt-6">
        <button
          @click="router.push('/admin/settings/schemas')"
          type="button"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Go to Schema Settings
        </button>
      </div>
    </div>

    <!-- Globals grid -->
    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="schema in globalSchemas"
        :key="schema.slug"
        @click="router.push(`/admin/globals/${schema.slug}`)"
        class="cursor-pointer p-6 border border-gray-300 rounded-lg hover:shadow-md transition-shadow bg-white"
      >
        <h3 class="font-semibold text-gray-900">{{ schema.name }}</h3>
        <p class="text-sm text-gray-500 mt-1">{{ schema.slug }}</p>
        <p class="text-xs text-gray-400 mt-2">{{ schema.fields.length }} fields</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConfig } from '../composables/useConfig'

const router = useRouter()
const { config } = useConfig()

const globalSchemas = computed(() => {
  const globals = config.value?.globals || {}
  return Object.entries(globals).map(([slug, schema]) => ({
    slug,
    ...schema,
  }))
})
</script>
```

---

## 📦 6. Update Dashboard.vue

**Location:** `packages/admin/src/views/Dashboard.vue`

**Add globals section** after the existing content sections:

```vue
<!-- Add this section in your dashboard -->
<div v-if="globalSchemas.length > 0" class="bg-white rounded-lg shadow p-6">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-lg font-semibold text-gray-900 flex items-center">
      <svg class="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Globals
    </h2>
  </div>
  <div class="space-y-2">
    <div
      v-for="schema in globalSchemas"
      :key="schema.slug"
      @click="router.push(`/admin/globals/${schema.slug}`)"
      class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <div>
        <p class="font-medium text-gray-900">{{ schema.name }}</p>
        <p class="text-sm text-gray-500">{{ schema.slug }}</p>
      </div>
      <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </div>
</div>
```

**In the script section**, add:

```typescript
const globalSchemas = computed(() => {
  const globals = config.value?.globals || {}
  return Object.entries(globals).map(([slug, schema]) => ({
    slug,
    ...schema,
  }))
})
```

---

## 📦 7. Update AppSidebar.vue

**Location:** `packages/admin/src/components/AppSidebar.vue`

**Add globals navigation icon** between existing nav items (suggested: between Pages/Posts and Settings):

```vue
<!-- Add this button in your sidebar navigation -->
<button
  @click="router.push('/admin/globals')"
  :class="[
    isGlobalsActive
      ? 'bg-gray-800 text-gray-50'
      : 'text-gray-400 hover:text-gray-50 hover:bg-gray-700',
    'w-12 h-12 flex items-center justify-center rounded-lg transition-colors'
  ]"
  title="Globals"
>
  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
</button>
```

**In the script section**, add active state logic:

```typescript
const isGlobalsActive = computed(() => {
  return route.path.startsWith('/admin/globals')
})
```

---

## 📦 8. Update Router

**Location:** `packages/admin/src/router/index.ts`

**Add global routes** in the admin children array:

```typescript
{
  path: '/admin',
  component: AdminLayout,
  children: [
    // ... existing routes ...

    // Global routes
    {
      path: 'globals',
      name: 'GlobalsList',
      component: () => import('../views/GlobalsList.vue'),
    },
    {
      path: 'globals/:slug',
      name: 'GlobalEditor',
      component: () => import('../views/GlobalEditor.vue'),
    },
  ],
},
```

---

## 📦 9. Update API Utility

**Location:** `packages/admin/src/utils/api.ts`

**Add global API methods:**

```typescript
class API {
  // ... existing methods ...

  // ========================================
  // Globals
  // ========================================

  async listGlobals() {
    return this.request<{ items: any[] }>('/admin/globals')
  }

  async getGlobal(slug: string) {
    return this.request<{
      schemaSlug: string
      name: string
      fields: any[]
      translations: Record<string, { fields: Record<string, any>; updatedAt: string }>
      createdAt?: string
      updatedAt?: string
    }>(`/admin/globals/${slug}`)
  }

  async updateGlobalTranslation(
    slug: string,
    lang: string,
    data: { fields: Record<string, unknown> }
  ) {
    return this.request(`/admin/globals/${slug}/translations/${lang}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteGlobalTranslation(slug: string, lang: string) {
    return this.request(`/admin/globals/${slug}/translations/${lang}`, {
      method: 'DELETE',
    })
  }

  // ========================================
  // Global Schemas
  // ========================================

  async createGlobalSchema(data: { slug: string; name: string; fields: any[] }) {
    return this.request('/admin/schemas/globals', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateGlobalSchema(slug: string, data: { name?: string; fields?: any[] }) {
    return this.request(`/admin/schemas/globals/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteGlobalSchema(slug: string) {
    return this.request(`/admin/schemas/globals/${slug}`, {
      method: 'DELETE',
    })
  }
}
```

---

## 📦 10. Update SettingsSchema.vue

**Location:** `packages/admin/src/views/settings/SettingsSchema.vue`

**Add Globals section** after Post Type Schemas section:

```vue
<!-- Add this section after post types -->
<div class="bg-white rounded-lg shadow p-6">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-lg font-semibold text-gray-900">Global Schemas</h2>
    <button
      @click="createGlobalSchema"
      class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
    >
      <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Add Global Schema
    </button>
  </div>

  <!-- Empty state -->
  <div v-if="globalSchemas.length === 0" class="text-center py-8 text-gray-500">
    No global schemas configured
  </div>

  <!-- Schemas list -->
  <div v-else class="space-y-2">
    <div
      v-for="schema in globalSchemas"
      :key="schema.slug"
      class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
    >
      <div class="flex-1">
        <h3 class="font-medium text-gray-900">{{ schema.name }}</h3>
        <p class="text-sm text-gray-500">{{ schema.slug }} • {{ schema.fields.length }} fields</p>
      </div>
      <div class="flex gap-2">
        <button
          @click="editGlobalSchema(schema.slug)"
          class="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
        >
          Edit
        </button>
        <button
          @click="deleteGlobalSchemaConfirm(schema.slug)"
          class="px-3 py-1 text-sm text-red-600 hover:text-red-800"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
</div>
```

**In the script section**, add these methods:

```typescript
const globalSchemas = computed(() => {
  return schemas.value?.globals || []
})

async function createGlobalSchema() {
  // Open modal to create new global schema
  showSchemaModal.value = true
  schemaModalMode.value = 'create'
  schemaModalType.value = 'global'
  editingSchema.value = {
    slug: '',
    name: '',
    fields: [],
  }
}

async function editGlobalSchema(slug: string) {
  const schema = globalSchemas.value.find((s) => s.slug === slug)
  if (!schema) return

  showSchemaModal.value = true
  schemaModalMode.value = 'edit'
  schemaModalType.value = 'global'
  editingSchema.value = { ...schema }
}

async function deleteGlobalSchemaConfirm(slug: string) {
  if (!confirm(`Are you sure you want to delete the global schema "${slug}"? This will delete all global content for this schema.`)) {
    return
  }

  try {
    await api.deleteGlobalSchema(slug)
    await loadSchemas()
    await refreshConfig()
  } catch (err) {
    console.error('Failed to delete global schema:', err)
    alert('Failed to delete global schema')
  }
}

// In your save schema handler, add global case:
async function saveSchema() {
  try {
    if (schemaModalType.value === 'global') {
      if (schemaModalMode.value === 'create') {
        await api.createGlobalSchema(editingSchema.value)
      } else {
        await api.updateGlobalSchema(editingSchema.value.slug, {
          name: editingSchema.value.name,
          fields: editingSchema.value.fields,
        })
      }
    }
    // ... existing page/postType cases ...

    await loadSchemas()
    await refreshConfig()
    showSchemaModal.value = false
  } catch (err) {
    console.error('Failed to save schema:', err)
    alert('Failed to save schema')
  }
}
```

---

## 🧪 Testing Checklist

### Repeater Fields
- [ ] Can add repeater field to schema
- [ ] Can define sub-fields for repeater
- [ ] Can add/remove/reorder repeater items in content editor
- [ ] Nested repeaters work (up to 5 levels)
- [ ] Validation enforces max 50 items
- [ ] Validation enforces max 5 levels depth
- [ ] Required sub-fields validate correctly
- [ ] Data saves and loads correctly

### Global Content
- [ ] Can create global schema
- [ ] Can edit global schema
- [ ] Can delete global schema (with confirmation)
- [ ] Global editor displays for each global
- [ ] Can switch between languages
- [ ] Can save global content
- [ ] Globals appear in dashboard
- [ ] Globals navigation works in sidebar
- [ ] Can delete global translations (non-default language)
- [ ] Public API returns global content

---

## 📝 Implementation Order

1. **Install dependencies**
   ```bash
   cd packages/admin
   npm install vuedraggable@next
   ```

2. **Create RepeaterField.vue** - Start here, it's standalone

3. **Update FieldRenderer.vue** - Add repeater case

4. **Update SchemaEditorModal.vue** - Add repeater type support
   - Start with basic support (no nested editing)
   - Can enhance later with recursive modal

5. **Update api.ts** - Add global API methods

6. **Create GlobalEditor.vue** - Copy pattern from PageEditor

7. **Create GlobalsList.vue** - Simple list view

8. **Update router** - Add global routes

9. **Update Dashboard.vue** - Add globals section

10. **Update AppSidebar.vue** - Add globals nav

11. **Update SettingsSchema.vue** - Add global schema management

---

## 🐛 Common Issues & Solutions

### Issue: Repeater items lose data when reordering
**Solution:** Ensure you're using unique `_uid` for draggable key, not array index

### Issue: Nested repeaters don't render
**Solution:** Make sure FieldRenderer is properly imported in RepeaterField and handles recursion

### Issue: Global config not updating after schema changes
**Solution:** Call `refreshConfig()` after creating/updating/deleting schemas

### Issue: Validation errors on repeater save
**Solution:** Check that you're removing `_uid` before sending to API (see `emitUpdate()` in RepeaterField)

---

## 🎨 Styling Notes

- All components use Tailwind CSS utility classes
- Follow existing patterns in Pages/Posts components
- Use gray-50/100/200 for backgrounds, gray-600/700/900 for text
- Use blue-600 for primary actions, red-600 for destructive actions
- Maintain consistent spacing (p-4, p-6, space-y-4, etc.)

---

## 🚀 Next Steps After Implementation

1. **Test thoroughly** - Use the testing checklist above
2. **Build the admin package** - `npm run build` in packages/admin
3. **Test the full stack** - Create test global schemas and content
4. **Documentation** - Update user-facing docs with repeater and global examples
5. **Migration guide** - If you have existing projects, document how to add these features

---

## 📚 Key Concepts Reference

### Repeater Field Structure
```typescript
{
  key: 'features',
  type: 'repeater',
  label: 'Features',
  required: false,
  fields: [
    { key: 'title', type: 'text', label: 'Title', required: true },
    { key: 'description', type: 'textarea', label: 'Description', required: false },
    { key: 'icon', type: 'image', label: 'Icon', required: false }
  ]
}
```

### Global Schema Structure
```typescript
{
  slug: 'header',
  name: 'Site Header',
  fields: [
    { key: 'logo', type: 'image', label: 'Logo', required: true },
    { key: 'nav_items', type: 'repeater', label: 'Navigation Items', required: false, fields: [...] }
  ]
}
```

---

## ✅ Implementation Complete Checklist

- [ ] vuedraggable installed
- [ ] RepeaterField.vue created
- [ ] FieldRenderer.vue updated
- [ ] SchemaEditorModal.vue updated
- [ ] api.ts updated with global methods
- [ ] GlobalEditor.vue created
- [ ] GlobalsList.vue created
- [ ] router updated with global routes
- [ ] Dashboard.vue updated with globals section
- [ ] AppSidebar.vue updated with globals nav
- [ ] SettingsSchema.vue updated with global schema management
- [ ] All tests passing
- [ ] Can create and edit global schemas
- [ ] Can create and edit global content
- [ ] Can use repeater fields in schemas
- [ ] Nested repeaters work

---

Good luck with the implementation! The backend is fully complete and tested, so once you finish these Vue components, the full feature will be ready to use.
