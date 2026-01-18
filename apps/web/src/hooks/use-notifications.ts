import { toast } from 'sonner'

type NotificationOptions = {
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
}

export const useNotifications = () => {
  const success = (message: string, options?: NotificationOptions) => {
    toast.success(message, options)
  }

  const error = (message: string, options?: NotificationOptions) => {
    toast.error(message, options)
  }

  const warning = (message: string, options?: NotificationOptions) => {
    toast.warning(message, options)
  }

  const info = (message: string, options?: NotificationOptions) => {
    toast.info(message, options)
  }

  const promise = <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string
      error: string
    }
  ) => {
    return toast.promise(promise, messages)
  }

  const dismiss = (id?: string | number) => {
    toast.dismiss(id)
  }

  return {
    success,
    error,
    warning,
    info,
    promise,
    dismiss,
  }
}
