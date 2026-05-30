import type { Metadata } from 'next'
import AnalyticsClient from './AnalyticsClient'

export const metadata: Metadata = {
  title: 'Portfolio Analytics | Soroban Guard',
  description:
    'Explore aggregate security insights across all your Soroban contract scans — charts, trends, and top vulnerability checks at a glance.',
  openGraph: {
    title: 'Portfolio Analytics | Soroban Guard',
    description:
      'Explore aggregate security insights across all your Soroban contract scans — charts, trends, and top vulnerability checks at a glance.',
    type: 'website',
  },
}

export default function AnalyticsPage() {
  return <AnalyticsClient />
}
