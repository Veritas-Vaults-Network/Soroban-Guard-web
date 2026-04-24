'use client'

import { useEffect, useState } from 'react'

const STEPS = ['Uploading', 'Parsing', 'Analyzing', 'Done'] as const

interface Props {
  loading: boolean
}

export default function ScanProgress({ loading }: Props) {
  const [step, setStep] = useState(-1)

  useEffect(() => {
    if (!loading) {
      setStep(-1)
      return
    }
    setStep(0)
    const timers = STEPS.slice(1).map((_, i) =>
      setTimeout(() => setStep(i + 1), (i + 1) * 1500),
    )
    return () => timers.forEach(clearTimeout)
  }, [loading])

  if (!loading) return null

  return (
    <div className="mt-4 flex items-center justify-between gap-2" role="status" aria-label="Scan progress">
      {STEPS.map((label, i) => {
        const done = i < step
        const active = i === step
        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors duration-500 ${
                done
                  ? 'bg-indigo-600 text-white'
                  : active
                    ? 'bg-indigo-500/30 text-indigo-300 ring-2 ring-indigo-500'
                    : 'bg-[#1a1d27] text-slate-600 ring-1 ring-[#2a2d3a]'
              }`}
            >
              {done ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-xs transition-colors duration-500 ${
                done ? 'text-indigo-400' : active ? 'text-white' : 'text-slate-600'
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`absolute hidden sm:block h-0.5 w-full transition-colors duration-500 ${
                  done ? 'bg-indigo-600' : 'bg-[#2a2d3a]'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
