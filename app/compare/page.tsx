'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Finding } from '@/types/findings'
import { getById } from '@/lib/history'
import FindingCard from '@/components/FindingCard'

interface Props {}

export default function ComparePage({}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [scanA, setScanA] = useState<Finding[] | null>(null)
  const [scanB, setScanB] = useState<Finding[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const a = searchParams.get('a')
    const b = searchParams.get('b')
    if (!a || !b) {
      setLoading(false)
      return
    }

    const recordA = getById(a)
    const recordB = getById(b)
    if (!recordA || !recordB) {
      setLoading(false)
      return
    }

    setScanA(recordA.findings as Finding[])
    setScanB(recordB.findings as Finding[])
    setLoading(false)
  }, [router, searchParams])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading comparison">
        <svg className="spinner h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
        </svg>
      </div>
    )
  }

  if (!scanA || !scanB) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <button
              onClick={() => router.push('/history')}
              className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Scan History
            </button>
          </div>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <svg className="h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
          </svg>
          <p className="text-base font-medium text-slate-300">No scans selected for comparison</p>
          <p className="max-w-xs text-sm text-slate-500">
            Go to your scan history, select two scans, and use the Compare button to see a side-by-side diff.
          </p>
          <a
            href="/history"
            className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            Browse scan history
          </a>
        </main>
      </div>
    )
  }

  // Helper to create a unique key for each finding
  function findingKey(f: Finding) {
    return `${f.check_name}-${f.function_name}-${f.file_path}-${f.line}`
  }

  const mapA = new Map(scanA.map(f => [findingKey(f), f]))
  const mapB = new Map(scanB.map(f => [findingKey(f), f]))

  const fixed: Finding[] = []
  const newFindings: Finding[] = []
  const persisting: Finding[] = []

  for (const [key, f] of mapA) {
    if (!mapB.has(key)) {
      fixed.push(f)
    } else {
      persisting.push(f)
    }
  }

  for (const [key, f] of mapB) {
    if (!mapA.has(key)) {
      newFindings.push(f)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Soroban Guard
          </button>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="mb-8 text-2xl font-bold text-white">Scan Comparison</h1>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Fixed */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-green-400">Fixed ({fixed.length})</h2>
            <div className="space-y-4">
              {fixed.map((f, i) => (
                <div key={i} className="line-through opacity-75">
                  <FindingCard finding={f} />
                </div>
              ))}
            </div>
          </div>

          {/* New */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-red-400">New ({newFindings.length})</h2>
            <div className="space-y-4">
              {newFindings.map((f, i) => (
                <div key={i} className="ring-2 ring-red-500/50">
                  <FindingCard finding={f} />
                </div>
              ))}
            </div>
          </div>

          {/* Persisting */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-slate-400">Persisting ({persisting.length})</h2>
            <div className="space-y-4">
              {persisting.map((f, i) => (
                <FindingCard key={i} finding={f} />
              ))}
            </div>
          </div>
        </div>

        {/* Code diff area */}
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold text-slate-200">Code Diff (experimental)</h2>
          <p className="mb-4 text-sm text-slate-400">Paste two source versions to see a line-level diff, or paste two WASM hex blobs to see a structural section diff.</p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Version A</label>
              <textarea id="srcA" className="h-48 w-full rounded-md bg-[var(--bg)] p-2 text-sm text-slate-200" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Version B</label>
              <textarea id="srcB" className="h-48 w-full rounded-md bg-[var(--bg)] p-2 text-sm text-slate-200" />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                const a = (document.getElementById('srcA') as HTMLTextAreaElement).value
                const b = (document.getElementById('srcB') as HTMLTextAreaElement).value
                // naive line diff: compute and open a new window with results
                const da = a.split('\n')
                const db = b.split('\n')
                const max = Math.max(da.length, db.length)
                const rows: string[] = []
                rows.push('<table class="w-full table-fixed text-sm"><thead><tr><th class="w-1/2">A</th><th class="w-1/2">B</th></tr></thead><tbody>')
                for (let i = 0; i < max; i++) {
                  const la = (da[i] ?? '').replace(/</g, '&lt;')
                  const lb = (db[i] ?? '').replace(/</g, '&lt;')
                  const cls = la === lb ? '' : 'bg-yellow-900/30'
                  rows.push(`<tr class='${cls}'><td class="align-top p-2 font-mono">${la}</td><td class="align-top p-2 font-mono">${lb}</td></tr>`)
                }
                rows.push('</tbody></table>')
                const html = rows.join('\n')
                const w = window.open('', '_blank')
                if (w) {
                  w.document.write(html)
                  w.document.close()
                }
              }}
              className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
            >
              Show source diff
            </button>

            <button
              onClick={async () => {
                // attempt to parse as hex and show structural diff using wasm helper if available
                const a = (document.getElementById('srcA') as HTMLTextAreaElement).value
                const b = (document.getElementById('srcB') as HTMLTextAreaElement).value
                try {
                  const mod = await import('@/lib/wasmDiff')
                  const res = mod.structuralWasmDiff(a, b)
                  const pretty = `<pre class=\"text-sm\">${JSON.stringify(res, null, 2)}</pre>`
                  const w = window.open('', '_blank')
                  if (w) {
                    w.document.body.innerHTML = pretty
                  }
                } catch (e) {
                  alert('WASM structural diff not available: ' + (e as Error).message)
                }
              }}
              className="rounded bg-slate-700 px-3 py-2 text-sm font-medium text-white"
            >
              Show WASM structure diff
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
