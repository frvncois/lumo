import type { DialogOptions } from '../components/ui/Dialog.vue'

let dialogInstance: any = null

export function setDialogInstance(instance: any) {
  dialogInstance = instance
}

export function useDialog() {
  async function confirm(message: string, options?: Partial<DialogOptions>): Promise<boolean> {
    if (!dialogInstance) {
      console.warn('Dialog instance not available, falling back to native confirm')
      return window.confirm(message)
    }

    return dialogInstance.showDialog({
      message,
      type: 'confirm',
      variant: options?.variant || 'default',
      title: options?.title,
      confirmText: options?.confirmText || 'Confirm',
      cancelText: options?.cancelText || 'Cancel'
    })
  }

  async function alert(message: string, options?: Partial<DialogOptions>): Promise<boolean> {
    if (!dialogInstance) {
      console.warn('Dialog instance not available, falling back to native alert')
      window.alert(message)
      return true
    }

    return dialogInstance.showDialog({
      message,
      type: 'alert',
      variant: options?.variant || 'default',
      title: options?.title,
      confirmText: options?.confirmText || 'OK'
    })
  }

  async function confirmDelete(itemName?: string): Promise<boolean> {
    const message = itemName
      ? `Are you sure you want to delete "${itemName}"? This cannot be undone.`
      : 'Are you sure you want to delete this item? This cannot be undone.'

    return confirm(message, {
      title: 'Confirm Delete',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    })
  }

  return {
    confirm,
    alert,
    confirmDelete
  }
}
