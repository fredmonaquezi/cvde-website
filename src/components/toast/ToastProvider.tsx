import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ToastContext, type ToastApi, type ToastType } from './toast-context'

type ToastItem = {
  id: number
  type: ToastType
  message: string
}

const TOAST_DURATION_MS = 4000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextIdRef = useRef(1)
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const removeToast = useCallback((id: number) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }

    setToasts((previous) => previous.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(
    (type: ToastType, message: string) => {
      const id = nextIdRef.current++
      setToasts((previous) => [...previous, { id, type, message }])

      const timer = setTimeout(() => {
        removeToast(id)
      }, TOAST_DURATION_MS)

      timersRef.current.set(id, timer)
    },
    [removeToast],
  )

  useEffect(() => {
    const timers = timersRef.current

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
    }
  }, [])

  const api: ToastApi = {
    success: (message) => pushToast('success', message),
    error: (message) => pushToast('error', message),
    info: (message) => pushToast('info', message),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="toast-viewport" role="status">
        {toasts.map((toast) => (
          <div className={`toast toast-${toast.type}`} key={toast.id}>
            <p>{toast.message}</p>
            <button aria-label="Dismiss notification" className="toast-close" onClick={() => removeToast(toast.id)} type="button">
              x
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
