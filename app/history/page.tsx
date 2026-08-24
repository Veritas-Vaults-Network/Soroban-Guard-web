import type { Metadata } from 'next'
import HistoryClient from './HistoryClient'

export const metadata: Metadata = {
  title: 'Scan History — Soroban Guard',
  description: 'View contract scan history and track security posture changes over time.',
}

export default function HistoryPage() {
  return <HistoryClient />
}
