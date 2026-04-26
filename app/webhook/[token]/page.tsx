import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import type { Finding } from '@/types/findings'
import WebhookLoader from './WebhookLoader'

interface Props {
  params: { token: string }
}

export default async function WebhookTokenPage({ params }: Props) {
  const host = headers().get('host') ?? 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'

  const res = await fetch(`${protocol}://${host}/api/webhook/${params.token}`, {
    cache: 'no-store',
  })

  if (!res.ok) redirect('/')

  const { findings } = (await res.json()) as { findings: Finding[] }

  return <WebhookLoader findings={findings} />
}
