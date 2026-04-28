import type { Metadata } from 'next'
import ResultsClient from './ResultsClient'

export const metadata: Metadata = {
  title: 'Soroban Guard — Scan Results',
  openGraph: { title: 'Soroban Guard — Scan Results' },
  twitter: { card: 'summary' },
}

export default function ResultsPage() {
  return <ResultsClient />
}
