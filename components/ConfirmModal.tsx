'use client'

import { useEffect, useRef, useId } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  title: string
  description?: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: Props) {
  const titleId = useId()
  const confirmRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Focus confirm button on open
  useEffect(() => {
    confirmRef.current?.focus()
  }, [])

  // Escape to close + focus trap
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { onCancel(); return }
      if (e.key !== 'Tab') return
      const focusable = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLElement[]
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault()
        ;(e.shiftKey ? last : first).focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-2xl border border-[#2a2d3a] bg-[#12151f] p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 id={titleId} className="mb-2 text-base font-semibold text-white">
          {title}
        </h2>
        {description && (
          <p className="mb-6 text-sm text-slate-400">{description}</p>
        )}
        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm text-slate-400 transition hover:text-white"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
