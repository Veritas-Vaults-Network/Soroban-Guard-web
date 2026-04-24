import type { Metadata } from 'next'
import './globals.css'
import { WalletProvider } from '@/lib/WalletContext'

export const metadata: Metadata = {
  title: 'Soroban Guard — Smart Contract Security Scanner',
  description:
    'Automated vulnerability detection for Soroban smart contracts. Scan your Rust/Soroban code for security issues before deployment.',
  keywords: ['soroban', 'smart contract', 'security', 'scanner', 'stellar', 'rust'],
  openGraph: {
    title: 'Soroban Guard',
    description: 'Automated vulnerability detection for Soroban smart contracts.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('sg_theme') || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  )
}
