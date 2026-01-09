<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

export interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

const toasts = ref<ToastMessage[]>([])

function addToast(toast: ToastMessage) {
  toasts.value.push(toast)

  if (toast.duration !== 0) {
    setTimeout(() => {
      removeToast(toast.id)
    }, toast.duration || 3000)
  }
}

function removeToast(id: string) {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
  }
}

// Expose methods for external use
defineExpose({
  addToast,
  removeToast
})

function getToastClass(type: string) {
  const baseClass = 'toast'
  const typeClasses = {
    success: 'toast--success',
    error: 'toast--error',
    warning: 'toast--warning',
    info: 'toast--info'
  }
  return `${baseClass} ${typeClasses[type as keyof typeof typeClasses] || typeClasses.info}`
}
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="getToastClass(toast.type)"
        @click="removeToast(toast.id)"
      >
        <div class="toast__content">
          <span class="toast__icon">
            <template v-if="toast.type === 'success'">✓</template>
            <template v-else-if="toast.type === 'error'">✕</template>
            <template v-else-if="toast.type === 'warning'">⚠</template>
            <template v-else>ℹ</template>
          </span>
          <span class="toast__message">{{ toast.message }}</span>
        </div>
        <button class="toast__close" @click.stop="removeToast(toast.id)">✕</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
  align-items: center;
}

.toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 300px;
  max-width: 500px;
  padding: 14px 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid;
}

.toast:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.toast__content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.toast__icon {
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.toast__message {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
  color: #333;
}

.toast__close {
  background: none;
  border: none;
  font-size: 16px;
  color: #999;
  cursor: pointer;
  padding: 0;
  margin-left: 12px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.toast__close:hover {
  color: #333;
}

.toast--success {
  border-left-color: #10b981;
}

.toast--success .toast__icon {
  color: #10b981;
}

.toast--error {
  border-left-color: #ef4444;
}

.toast--error .toast__icon {
  color: #ef4444;
}

.toast--warning {
  border-left-color: #f59e0b;
}

.toast--warning .toast__icon {
  color: #f59e0b;
}

.toast--info {
  border-left-color: #3b82f6;
}

.toast--info .toast__icon {
  color: #3b82f6;
}

/* Transition animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(50px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(50px) scale(0.8);
}
</style>
