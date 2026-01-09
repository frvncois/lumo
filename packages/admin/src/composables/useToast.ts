import { ref } from 'vue'
import type { ToastMessage } from '../components/ui/Toast.vue'

let toastInstance: any = null

export function setToastInstance(instance: any) {
  toastInstance = instance
}

let toastIdCounter = 0

export function useToast() {
  function show(message: string, type: ToastMessage['type'] = 'info', duration?: number) {
    if (!toastInstance) {
      console.warn('Toast instance not available')
      return
    }

    const id = `toast-${++toastIdCounter}`
    toastInstance.addToast({
      id,
      message,
      type,
      duration
    })
  }

  function success(message: string, duration?: number) {
    show(message, 'success', duration)
  }

  function error(message: string, duration?: number) {
    show(message, 'error', duration)
  }

  function warning(message: string, duration?: number) {
    show(message, 'warning', duration)
  }

  function info(message: string, duration?: number) {
    show(message, 'info', duration)
  }

  return {
    show,
    success,
    error,
    warning,
    info
  }
}
