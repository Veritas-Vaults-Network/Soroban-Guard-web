'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Finding } from '@/types/findings'

export default function WebhookTokenPage({ findings }: { findings: Finding[] }) {
  const router = useRouter()

  useEffect(() => {
    sessionStorage.setItem('sg_findings', JSON.stringify(findings))
    router.replace('/results')
  }, [findings, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <svg className="spinner h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
      </svg>
    </div>
  )
}
