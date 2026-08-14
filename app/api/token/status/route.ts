import { NextRequest, NextResponse } from 'next/server'
import { isTokenRevoked } from '@/lib/tokenStore'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const revoked = await isTokenRevoked(token)
  return NextResponse.json({ revoked })
}
