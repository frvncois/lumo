<template>
  <div class="border border-gray-300 rounded-md overflow-hidden">
    <!-- Toolbar -->
    <div v-if="editor" class="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-300">
      <button
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ 'bg-gray-300': editor.isActive('bold') }"
        class="px-3 py-1 text-sm font-medium rounded hover:bg-gray-200"
        type="button"
      >
        Bold
      </button>
      <button
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ 'bg-gray-300': editor.isActive('italic') }"
        class="px-3 py-1 text-sm font-medium rounded hover:bg-gray-200"
        type="button"
      >
        Italic
      </button>
      <button
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ 'bg-gray-300': editor.isActive('heading', { level: 2 }) }"
        class="px-3 py-1 text-sm font-medium rounded hover:bg-gray-200"
        type="button"
      >
        H2
      </button>
      <button
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        :class="{ 'bg-gray-300': editor.isActive('heading', { level: 3 }) }"
        class="px-3 py-1 text-sm font-medium rounded hover:bg-gray-200"
        type="button"
      >
        H3
      </button>
      <button
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{ 'bg-gray-300': editor.isActive('bulletList') }"
        class="px-3 py-1 text-sm font-medium rounded hover:bg-gray-200"
        type="button"
      >
        Bullet List
      </button>
      <button
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="{ 'bg-gray-300': editor.isActive('orderedList') }"
        class="px-3 py-1 text-sm font-medium rounded hover:bg-gray-200"
        type="button"
      >
        Numbered List
      </button>
      <button
        @click="addLink"
        :class="{ 'bg-gray-300': editor.isActive('link') }"
        class="px-3 py-1 text-sm font-medium rounded hover:bg-gray-200"
        type="button"
      >
        Link
      </button>
    </div>

    <!-- Editor Content -->
    <EditorContent :editor="editor" class="prose max-w-none p-4 min-h-[200px]" />
  </div>
</template>

<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'

const props = defineProps<{
  modelValue: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

const editor = useEditor({
  extensions: [
    StarterKit,
    Link.configure({
      openOnClick: false,
    }),
  ],
  content: props.modelValue || '',
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getJSON())
  },
})

watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value) return

    const currentContent = editor.value.getJSON()
    if (JSON.stringify(currentContent) !== JSON.stringify(value)) {
      editor.value.commands.setContent(value || '', false)
    }
  }
)

function addLink() {
  if (!editor.value) return

  const url = window.prompt('Enter URL:')
  if (!url) return

  editor.value.chain().focus().setLink({ href: url }).run()
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style>
.ProseMirror {
  outline: none;
}

.ProseMirror p {
  margin: 0.5em 0;
}

.ProseMirror h2 {
  font-size: 1.5em;
  font-weight: bold;
  margin: 1em 0 0.5em;
}

.ProseMirror h3 {
  font-size: 1.25em;
  font-weight: bold;
  margin: 1em 0 0.5em;
}

.ProseMirror ul,
.ProseMirror ol {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.ProseMirror a {
  color: #2563eb;
  text-decoration: underline;
}
</style>
