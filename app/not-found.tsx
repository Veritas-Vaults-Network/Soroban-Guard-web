'use client'

import Link from 'next/link'
import { useT } from '@/lib/useT'

export default function NotFound() {
  const { t } = useT()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <p className="mb-2 font-mono text-6xl font-bold text-slate-700">{t('notFound.code')}</p>
      <h1 className="mb-4 text-xl font-semibold text-slate-300">{t('notFound.heading')}</h1>
      <p className="mb-8 text-sm text-slate-500">{t('notFound.body')}</p>
      <Link
        href="/"
        className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
      >
        {t('notFound.backToScanner')}
      </Link>
    </div>
  )
}
