import type { Metadata } from 'next'
import ResultsClient from './ResultsClient'

export const metadata: Metadata = {
  title: 'Scan Results | Soroban Guard',
  description:
    'View detailed security findings for your Soroban smart contract — severity breakdown, vulnerability details, and actionable remediation steps.',
  openGraph: {
    title: 'Scan Results | Soroban Guard',
    description:
      'View detailed security findings for your Soroban smart contract — severity breakdown, vulnerability details, and actionable remediation steps.',
    type: 'website',
  },
}

export default function ResultsPage() {
  return <ResultsClient />
}
