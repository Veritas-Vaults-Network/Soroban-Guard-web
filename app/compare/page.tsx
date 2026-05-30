import type { Metadata } from 'next'
import CompareClient from './CompareClient'

export const metadata: Metadata = {
  title: 'Compare Scans | Soroban Guard',
  description:
    'Side-by-side comparison of two Soroban contract scans — see which vulnerabilities were fixed, which are new, and which persist across versions.',
  openGraph: {
    title: 'Compare Scans | Soroban Guard',
    description:
      'Side-by-side comparison of two Soroban contract scans — see which vulnerabilities were fixed, which are new, and which persist across versions.',
    type: 'website',
  },
}

export default function ComparePage() {
  return <CompareClient />
}
