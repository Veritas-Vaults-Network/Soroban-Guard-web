'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Finding, Severity } from '@/types/findings'
import { ReportCover } from '@/components/report'
import { ReportSummary } from '@/components/report'
import { ReportFindings } from '@/components/report'
import { ReportFooter } from '@/components/report'
import { ReportLayout } from '@/components/report'

const SEVERITY_ORDER: Record<Severity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Info: 4,
}

export default function ReportPage() {
  const searchParams = useSearchParams()
  const [findings, setFindings] = useState<Finding[]>([])
  const [source, setSource] = useState('')
  const [scannedAt, setScannedAt] = useState('')
  const [score, setScore] = useState(100)
  const [walletAddress, setWalletAddress] = useState('')
  const [pageCount, setPageCount] = useState(1)

  useEffect(() => {
    try {
      const f = searchParams.get('f')
      if (f) setFindings(JSON.parse(atob(f)) as Finding[])
      setSource(searchParams.get('source') ?? 'Unknown')
      setScannedAt(searchParams.get('scannedAt') ?? new Date().toISOString())
      setScore(Number(searchParams.get('score') ?? 100))
      setWalletAddress(searchParams.get('wallet') ?? '')
    } catch {
      // ignore parse errors
    }
  }, [searchParams])

  useEffect(() => {
    if (findings.length >= 0 && source) {
      const estimatedPages = Math.max(1, Math.ceil(findings.length / 8) + 1)
      setPageCount(estimatedPages)
      setTimeout(() => window.print(), 400)
    }
  }, [findings, source])

  const counts: Record<Severity, number> = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Info: 0,
  }
  for (const f of findings) counts[f.severity as Severity]++

  const sorted = [...findings].sort(
    (a, b) => SEVERITY_ORDER[a.severity as Severity] - SEVERITY_ORDER[b.severity as Severity],
  )

  return (
    <ReportLayout>
      <ReportCover
        source={source}
        scannedAt={scannedAt}
        score={score}
        walletAddress={walletAddress}
      />
      <ReportSummary counts={counts} />
      <ReportFindings findings={findings} sorted={sorted} />
      <ReportFooter pageCount={pageCount} />
    </ReportLayout>
  )
}
