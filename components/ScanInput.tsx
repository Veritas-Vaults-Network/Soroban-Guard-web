'use client'

import { useState, useRef } from 'react'

type InputMode = 'code' | 'github' | 'contractId'

interface Props {
  onScan: (source: string) => void
  loading: boolean
  countdown?: number
}

export default function ScanInput({ onScan, loading, countdown = 0 }: Props) {
  const [mode, setMode] = useState<InputMode>('code')
  const [code, setCode] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [contractId, setContractId] = useState('')
  const [normalized, setNormalized] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const normalizedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleContractIdChange(raw: string) {
    const clean = raw.trim().toUpperCase()
    setContractId(clean)
    if (clean !== raw) {
      if (normalizedTimer.current) clearTimeout(normalizedTimer.current)
      setNormalized(true)
      normalizedTimer.current = setTimeout(() => setNormalized(false), 1000)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const source =
      mode === 'code'
        ? code.trim()
        : mode === 'github'
          ? repoUrl.trim()
          : contractId.trim()
    if (!source) return
    onScan(source)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (canSubmit) {
        handleSubmit(e as any)
      }
    }
  }

  const isRateLimited = countdown > 0

  const canSubmit =
    !loading &&
    !isRateLimited &&
    (mode === 'code'
      ? code.trim().length > 0
      : mode === 'github'
        ? repoUrl.trim().length > 0 && validateGithub(repoUrl).valid
        : contractId.trim().length > 0 && contractValid)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mode toggle */}
      <div className="flex rounded-lg bg-[#12151f] p-1 ring-1 ring-[#2a2d3a]">
        <TabButton
          active={mode === 'code'}
          onClick={() => setMode('code')}
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          }
        >
          Paste Code
        </TabButton>
        <TabButton
          active={mode === 'github'}
          onClick={() => setMode('github')}
          icon={
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          }
        >
          GitHub URL
        </TabButton>
        <TabButton
          active={mode === 'contractId'}
          onClick={() => setMode('contractId')}
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          }
        >
          Contract ID
        </TabButton>
      </div>

      {/* Input area */}
  {mode === 'code' ? (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`#![no_std]\nuse soroban_sdk::{contract, contractimpl, Env};\n\n#[contract]\npub struct MyContract;\n\n#[contractimpl]\nimpl MyContract {\n    pub fn hello(env: Env) -> String {\n        // paste your contract here...\n    }\n}`}
            rows={16}
            className="code-textarea w-full resize-y rounded-xl border border-[#2a2d3a] bg-[#12151f] px-4 py-3 text-slate-300 placeholder-slate-600 outline-none transition focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30"
            spellCheck={false}
            disabled={loading}
          />
          {code.length > 0 && (
            <span className="absolute bottom-3 right-3 text-xs text-slate-600">
              {code.length.toLocaleString()} chars
            </span>
          )}
        </div>
      ) : mode === 'github' ? (
        <div className="space-y-2">
          <input
            type="url"
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://github.com/org/repo"
            className="w-full rounded-xl border border-[#2a2d3a] bg-[#12151f] px-4 py-3 text-slate-300 placeholder-slate-600 outline-none transition focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30"
            disabled={loading}
          />
          {repoError ? (
            <p className="text-xs text-rose-400">{repoError}</p>
          ) : (
            <p className="text-xs text-slate-500">
              The repository must be public. The scanner will clone and analyze all{' '}
              <code className="rounded bg-[#1a1d27] px-1 text-slate-400">.rs</code> files.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
          <input
            type="text"
            value={contractId}
            onChange={e => handleContractIdChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM"
            className="w-full rounded-xl border border-[#2a2d3a] bg-[#12151f] px-4 py-3 font-mono text-sm text-slate-300 placeholder-slate-600 outline-none transition focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30"
            disabled={loading}
            spellCheck={false}
          />
          {normalized && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300 transition-opacity duration-500">
              Normalized
            </span>
          )}
          </div>
          <p className="text-xs text-slate-500">
            Enter a Soroban contract ID (C-address) deployed on Stellar. The scanner
            will fetch the WASM bytecode via Soroban RPC and analyze it.
          </p>
        </div>
      )}

      {/* Submit */}
      <div className="space-y-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {isRateLimited ? (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Rate limited — retry in {countdown}s
            </>
          ) : loading ? (
            <>
              <svg className="spinner h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              Scanning…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Scan Contract
            </>
          )}
        </button>
        <p className="text-center text-xs text-slate-600">⌘↵ to scan</p>
      </div>
    </form>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
        active
          ? 'bg-indigo-600 text-white shadow'
          : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}
