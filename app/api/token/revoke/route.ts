import { NextRequest, NextResponse } from 'next/server'
import { revokeToken } from '@/lib/tokenStore'

export async function POST(req: NextRequest) {
  let body: { token?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  await revokeToken(body.token)
  return NextResponse.json({ success: true })
}
