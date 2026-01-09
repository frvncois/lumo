<script setup lang="ts">
import { ref } from 'vue'
import Button from './Button.vue'

export interface DialogOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'confirm' | 'alert'
  variant?: 'danger' | 'primary' | 'default'
}

interface DialogState extends DialogOptions {
  id: string
  resolve: (value: boolean) => void
}

const currentDialog = ref<DialogState | null>(null)

function showDialog(options: DialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    currentDialog.value = {
      id: `dialog-${Date.now()}`,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      type: options.type || 'confirm',
      variant: options.variant || 'default',
      resolve
    }
  })
}

function handleConfirm() {
  if (currentDialog.value) {
    currentDialog.value.resolve(true)
    currentDialog.value = null
  }
}

function handleCancel() {
  if (currentDialog.value) {
    currentDialog.value.resolve(false)
    currentDialog.value = null
  }
}

function handleBackdropClick() {
  handleCancel()
}

// Expose methods for external use
defineExpose({
  showDialog
})
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog-backdrop">
      <div
        v-if="currentDialog"
        class="dialog-backdrop"
        @click="handleBackdropClick"
      >
        <Transition name="dialog">
          <div
            class="dialog"
            @click.stop
          >
            <div v-if="currentDialog.title" class="dialog__header">
              <h3 class="dialog__title">{{ currentDialog.title }}</h3>
            </div>

            <div class="dialog__body">
              <p class="dialog__message">{{ currentDialog.message }}</p>
            </div>

            <div class="dialog__footer">
              <Button
                v-if="currentDialog.type === 'confirm'"
                variant="ghost"
                @click="handleCancel"
              >
                {{ currentDialog.cancelText }}
              </Button>
              <Button
                :variant="currentDialog.variant === 'danger' ? 'danger' : 'primary'"
                @click="handleConfirm"
              >
                {{ currentDialog.confirmText }}
              </Button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  min-width: 400px;
  max-width: 500px;
  width: 100%;
  overflow: hidden;
}

.dialog__header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.dialog__title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.dialog__body {
  padding: 24px;
}

.dialog__message {
  font-size: 14px;
  line-height: 1.6;
  color: #6b7280;
  margin: 0;
}

.dialog__footer {
  padding: 16px 24px;
  background: #f9fafb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Backdrop transitions */
.dialog-backdrop-enter-active,
.dialog-backdrop-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-backdrop-enter-from,
.dialog-backdrop-leave-to {
  opacity: 0;
}

/* Dialog transitions */
.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-20px);
}

@media (max-width: 640px) {
  .dialog {
    min-width: auto;
    max-width: 100%;
  }
}
</style>
