'use client'

import { useToast, type Toast } from '@/lib/toast'

const styles: Record<Toast['type'], string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  error:   'border-red-500/30 bg-red-500/10 text-red-300',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  info:    'border-indigo-500/30 bg-indigo-500/10 text-indigo-300',
}

export default function ToastContainer() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          role="status"
          className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm shadow-lg ${styles[toast.type]}`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
            className="shrink-0 opacity-60 hover:opacity-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
