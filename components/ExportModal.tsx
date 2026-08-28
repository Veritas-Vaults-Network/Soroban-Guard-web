'use client'

import { useState } from 'react'
import type { Finding } from '@/types/findings'
import { getAllExportTargets, getExportTarget } from '@/lib/export'
import { downloadFindings, type ExportFileFormat } from '@/lib/export/clientDownload'
import { useFocusTrap } from '@/lib/useFocusTrap'

interface Props {
  open: boolean
  onClose: () => void
  findings: Finding[]
  scanSource?: string | null
}

type ModalTab = 'file' | 'webhook'

export default function ExportModal({ open, onClose, findings, scanSource }: Props) {
  const [activeTab, setActiveTab] = useState<ModalTab>('file')
  const targets = getAllExportTargets()
  const [selectedTargetId, setSelectedTargetId] = useState<string>(targets[0]?.id || 'slack')
  const [config, setConfig] = useState<Record<string, string>>({})
  const [includeSource, setIncludeSource] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [downloadingFormat, setDownloadingFormat] = useState<ExportFileFormat | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const focusRef = useFocusTrap<HTMLDivElement>(onClose)
  const currentTarget = getExportTarget(selectedTargetId) || targets[0]

  if (!open) return null

  function handleFieldChange(fieldName: string, value: string) {
    setConfig(prev => ({ ...prev, [fieldName]: value }))
    setErrorMsg(null)
  }

  function handleTargetChange(targetId: string) {
    setSelectedTargetId(targetId)
    setConfig({})
    setErrorMsg(null)
    setSuccessMsg(null)
  }

  async function handleDownloadFile(format: ExportFileFormat) {
    setErrorMsg(null)
    setSuccessMsg(null)
    setDownloadingFormat(format)

    try {
      const result = await downloadFindings({
        format,
        findings,
        contractId: scanSource,
      })
      setSuccessMsg(`Downloaded ${result.filename} successfully.`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to download export file.'
      setErrorMsg(message)
    } finally {
      setDownloadingFormat(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentTarget) return

    setErrorMsg(null)
    setSuccessMsg(null)

    // Pre-flight client validation
    const val = currentTarget.validateConfig(config)
    if (!val.valid) {
      setErrorMsg(val.error || 'Invalid configuration')
      return
    }

    setIsExporting(true)

    try {
      const sourceCode = typeof window !== 'undefined' ? sessionStorage.getItem('sg_source_code') || scanSource || undefined : undefined

      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: currentTarget.id,
          config,
          findings,
          options: {
            includeSource,
            source: includeSource ? sourceCode : undefined,
            contractId: scanSource || undefined,
            title: `Soroban Guard Finding Report (${findings.length} findings)`,
          },
        }),
      })

      const data = (await res.json()) as { success?: boolean; message?: string; error?: string }

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || `Export failed with status ${res.status}`)
      } else {
        setSuccessMsg(data.message || `Successfully exported findings to ${currentTarget.name}!`)
        setTimeout(() => {
          onClose()
          setSuccessMsg(null)
        }, 2000)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while connecting to the export server route.'
      setErrorMsg(message)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div
        ref={focusRef}
        className="w-full max-w-xl rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] p-6 shadow-2xl transition-all"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div>
            <h2 id="export-modal-title" className="text-lg font-semibold text-slate-100">
              Export Security Findings
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Export {findings.length} finding{findings.length === 1 ? '' : 's'} for GitHub, CI/CD, spreadsheets, or team chat
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-[var(--bg-hover)] hover:text-slate-200"
            aria-label="Close export dialog"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="mt-4 flex border-b border-[var(--border)] pb-2 gap-2" role="tablist" aria-label="Export modes">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'file'}
            onClick={() => {
              setActiveTab('file')
              setErrorMsg(null)
              setSuccessMsg(null)
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'file'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Download File (SARIF / JSON / CSV)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'webhook'}
            onClick={() => {
              setActiveTab('webhook')
              setErrorMsg(null)
              setSuccessMsg(null)
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'webhook'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Team Webhooks (Slack / Discord)
          </button>
        </div>

        {activeTab === 'file' ? (
          <div className="mt-4 space-y-3">
            {/* SARIF Card (Featured) */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 transition hover:border-indigo-500/50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-indigo-200">SARIF 2.1.0</span>
                    <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
                      GitHub Security Recommended
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                    Static Analysis Results Interchange Format. Upload directly to the GitHub Security tab via{' '}
                    <code className="rounded bg-slate-800 px-1 py-0.5 text-[11px] text-indigo-300">upload-sarif</code> action or view in VS Code.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadFile('sarif')}
                  disabled={downloadingFormat !== null}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50 transition"
                  aria-label="Download SARIF file"
                >
                  {downloadingFormat === 'sarif' ? (
                    <>
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Exporting…</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Download .sarif</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* JSON Card */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 transition hover:border-slate-700">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-200">Raw JSON</span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Automation & Scripts
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    Standard structured JSON array of findings for custom scripts, CI gates, and developer tooling.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadFile('json')}
                  disabled={downloadingFormat !== null}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-[var(--bg-hover)] disabled:opacity-50 transition"
                  aria-label="Download JSON findings"
                >
                  {downloadingFormat === 'json' ? (
                    <>
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Exporting…</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Download .json</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* CSV Card */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 transition hover:border-slate-700">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-200">CSV Table</span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Spreadsheets & Triage
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    Comma-separated values table formatted for import into Excel, Google Sheets, or issue trackers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadFile('csv')}
                  disabled={downloadingFormat !== null}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-[var(--bg-hover)] disabled:opacity-50 transition"
                  aria-label="Download CSV findings"
                >
                  {downloadingFormat === 'csv' ? (
                    <>
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Exporting…</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Download .csv</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Target Selection */}
            <div>
              <label htmlFor="export-target-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Destination Target
              </label>
              <div className="mt-2 flex gap-2">
                {targets.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTargetChange(t.id)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      selectedTargetId === t.id
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                        : 'border-[var(--border)] bg-[var(--bg)] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-slate-400">{currentTarget?.description}</p>
            </div>

            {/* Target Form Fields */}
            {currentTarget?.fields.map(field => (
              <div key={field.name}>
                <label htmlFor={`export-field-${field.name}`} className="block text-xs font-semibold text-slate-300">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>
                <input
                  id={`export-field-${field.name}`}
                  type={field.type}
                  required={field.required}
                  placeholder={field.placeholder}
                  value={config[field.name] || ''}
                  onChange={e => handleFieldChange(field.name, e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                {field.helpText && <p className="mt-1 text-xs text-slate-400">{field.helpText}</p>}
              </div>
            ))}

            {/* Privacy Opt-in Toggle for Source Code */}
            {currentTarget?.supportsSourceInclusion && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSource}
                    onChange={e => setIncludeSource(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-amber-300">
                      Include contract source code snippet
                    </span>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      Contract source code may be private. By default, this is disabled. Check this box only if you explicitly consent to sending source snippets to your destination target.
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Dialog Actions */}
            <div className="mt-6 flex justify-end gap-3 border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isExporting}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-[var(--bg-hover)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isExporting}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Exporting…</span>
                  </>
                ) : (
                  <span>Export to {currentTarget?.name}</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Status Messages */}
        {errorMsg && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            <span className="font-semibold">Export Error:</span> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-xs text-green-300">
            ✓ {successMsg}
          </div>
        )}

        {activeTab === 'file' && (
          <div className="mt-6 flex justify-end border-t border-[var(--border)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-[var(--bg-hover)]"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
