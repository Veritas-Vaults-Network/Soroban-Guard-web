import type { Metadata } from 'next'
import HistoryClient from './HistoryClient'

export const metadata: Metadata = {
  title: 'Scan History | Soroban Guard',
  description:
    'Browse your past Soroban smart contract scans — review previous findings, track remediation progress, and schedule automatic rescans.',
  openGraph: {
    title: 'Scan History | Soroban Guard',
    description:
      'Browse your past Soroban smart contract scans — review previous findings, track remediation progress, and schedule automatic rescans.',
    type: 'website',
  },
}

export default function HistoryPage() {
  return <HistoryClient />
}
