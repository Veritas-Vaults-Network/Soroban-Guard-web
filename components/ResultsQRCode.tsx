'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeCanvas } from 'qrcode.react'

type ResultsQRCodeProps = {
  url: string
  isOpen: boolean
  onClose: () => void
}

export default function ResultsQRCode({ url, isOpen, onClose }: ResultsQRCodeProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const downloadButtonRef = useRef<HTMLButtonElement>(null)
  const retryButtonRef = useRef<HTMLButtonElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [renderNonce, setRenderNonce] = useState(0)

  useEffect(() => {
    if (!isOpen) return

    setError(null)
    const frame = window.requestAnimationFrame(() => {
      const canvas = dialogRef.current?.querySelector('canvas')
      if (!canvas) {
        setError('QR code failed to render.')
      }
    })

    return () => window.cancelAnimationFrame(frame)
  }, [isOpen, renderNonce, url])

  useEffect(() => {
    if (!isOpen) return

    const target = error ? retryButtonRef.current : downloadButtonRef.current
    target?.focus()
  }, [error, isOpen])

  useEffect(() => {
    if (!isOpen) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key !== 'Tab') return

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )

      if (!focusable || focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
        return
      }

      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  function handleDownload() {
    const canvas = dialogRef.current?.querySelector('canvas')
    if (!(canvas instanceof HTMLCanvasElement)) {
      setError('QR code failed to render.')
      return
    }

    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `results-qr-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  function handleRetry() {
    setError(null)
    setRenderNonce(current => current + 1)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-md rounded-2xl border border-[#2a2d3a] bg-[#12151f] p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-white">
              Results QR Code
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-slate-400">
              Scan or download a QR code for the shareable scan results URL.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-slate-500 transition hover:text-white"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
          {error ? (
            <div className="space-y-4">
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {error}
              </p>
              <button
                ref={retryButtonRef}
                onClick={handleRetry}
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-slate-300 transition hover:text-white"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-2xl bg-white p-4">
                <QRCodeCanvas
                  key={renderNonce}
                  value={url}
                  size={224}
                  level="M"
                  includeMargin
                />
              </div>
              <p className="w-full break-all text-center text-xs text-slate-500">{url}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-400 transition hover:text-white"
          >
            Close
          </button>
          <button
            ref={downloadButtonRef}
            onClick={handleDownload}
            disabled={error !== null}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Download QR
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
