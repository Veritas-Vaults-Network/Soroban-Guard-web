'use client'

import { Suspense } from 'react'
import ErrorBoundary from '@/components/ErrorBoundary'
import ResultsClient from './ResultsClient'

export default function ResultsPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading results"><svg className="spinner h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" /></svg></div>}>
        <ResultsClient />
      </Suspense>
    </ErrorBoundary>
  )
}
