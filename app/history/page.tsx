'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Finding } from '@/types/findings'
import ConfirmModal from '@/components/ConfirmModal'

interface HistoryEntry {
  id: string
  date: string
  source: string
  findings: Finding[]
}

const STORAGE_KEY = 'sg_history'

function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export default function HistoryPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    setEntries(loadHistory())
  }, [])

  function clearHistory() {
    localStorage.removeItem(STORAGE_KEY)
    setEntries([])
    setShowConfirm(false)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Scan History</h1>
        {entries.length > 0 && (
          <button
            onClick={() => setShowConfirm(true)}
            className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
          >
            Clear history
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">No scan history yet.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map(e => (
            <li
              key={e.id}
              className="rounded-xl border border-[#2a2d3a] bg-[#12151f] px-5 py-4"
            >
              <div className="flex items-center justify-between">
                <span className="truncate font-mono text-sm text-slate-300">{e.source}</span>
                <span className="ml-4 shrink-0 text-xs text-slate-500">
                  {new Date(e.date).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {e.findings.length} finding{e.findings.length !== 1 ? 's' : ''}
              </p>
            </li>
          ))}
        </ul>
      )}

      {showConfirm && (
        <ConfirmModal
          title="Clear all history?"
          description="This will permanently delete all scan records from this browser. This cannot be undone."
          confirmLabel="Clear history"
          onConfirm={clearHistory}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
