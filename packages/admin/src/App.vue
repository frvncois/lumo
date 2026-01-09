<template>
  <div id="app">
    <router-view />
    <Toast ref="toastRef" />
    <Dialog ref="dialogRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Toast from './components/ui/Toast.vue'
import Dialog from './components/ui/Dialog.vue'
import { setToastInstance } from './composables/useToast'
import { setDialogInstance } from './composables/useDialog'
import { useTheme } from './composables/useTheme'

// Initialize theme
useTheme()

const toastRef = ref<InstanceType<typeof Toast> | null>(null)
const dialogRef = ref<InstanceType<typeof Dialog> | null>(null)

onMounted(() => {
  if (toastRef.value) {
    setToastInstance(toastRef.value)
  }
  if (dialogRef.value) {
    setDialogInstance(dialogRef.value)
  }
})
</script>
