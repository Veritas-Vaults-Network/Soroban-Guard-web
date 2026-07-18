'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Finding } from '@/types/findings'

interface Props {
  findings: Finding[] | null
  revoked?: boolean
}

export default function WebhookTokenPage({ findings, revoked }: Props) {
  const router = useRouter()

  useEffect(() => {
    if (revoked || !findings) return
    sessionStorage.setItem('sg_findings', JSON.stringify(findings))
    router.replace('/results')
  }, [findings, revoked, router])

  if (revoked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white">Link Revoked</h1>
        <p className="mb-8 text-center text-slate-400">
          This webhook link was revoked by its owner and is no longer accessible.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to scanner
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <svg className="spinner h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
      </svg>
    </div>
  )
}
