'use client'

import { useState } from 'react'
import type { Finding } from '@/types/findings'
import { createLinearIssue } from '@/lib/linear'

interface Props {
  findings: Finding[]
  onClose: () => void
}

export default function LinearExportModal({ findings, onClose }: Props) {
  const [apiKey, setApiKey] = useState('')
  const [teamId, setTeamId] = useState('')
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [urls, setUrls] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const busy = progress !== null && urls === null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setUrls(null)
    setProgress({ done: 0, total: findings.length })

    try {
      const created: string[] = []
      for (let i = 0; i < findings.length; i += 1) {
        created.push(await createLinearIssue(apiKey, teamId.trim(), findings[i]))
        setProgress({ done: i + 1, total: findings.length })
      }
      setUrls(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setProgress(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#2a2d3a] bg-[#0e1117] p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Create Linear Issues</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white" aria-label="Close">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {urls ? (
          <div className="space-y-3">
            <p className="text-sm text-emerald-400">Created {urls.length} issue{urls.length !== 1 ? 's' : ''}</p>
            <ul className="max-h-60 space-y-1 overflow-y-auto">
              {urls.map(url => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="break-all text-xs text-indigo-400 hover:underline">
                    {url}
                  </a>
                </li>
              ))}
            </ul>
            <button onClick={onClose} className="mt-2 w-full rounded-xl bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              required
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Linear API key"
              disabled={busy}
              className="w-full rounded-lg border border-[#2a2d3a] bg-[#12151f] px-3 py-2 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-50"
            />
            <input
              required
              value={teamId}
              onChange={e => setTeamId(e.target.value)}
              placeholder="Linear team ID"
              disabled={busy}
              className="w-full rounded-lg border border-[#2a2d3a] bg-[#12151f] px-3 py-2 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-50"
            />
            <p className="text-xs text-slate-500">
              Creates one Linear issue for each finding. The API key is not stored.
            </p>

            {error && <p className="text-xs text-rose-400">{error}</p>}

            {progress && (
              <div className="space-y-1">
                <p className="text-xs text-slate-400">Creating issue {progress.done} of {progress.total}</p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2a2d3a]">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${progress.total === 0 ? 100 : (progress.done / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={busy || findings.length === 0}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? 'Creating...' : `Create ${findings.length} issue${findings.length !== 1 ? 's' : ''}`}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
