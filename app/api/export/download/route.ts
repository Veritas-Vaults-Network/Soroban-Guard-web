import { NextRequest, NextResponse } from 'next/server'
import type { Finding } from '@/types/findings'
import { serializeSarif, serializeCsv, serializeJson } from '@/lib/export'

interface DownloadRequestBody {
  format?: 'sarif' | 'json' | 'csv' | string
  findings?: Finding[]
  filename?: string
  contractId?: string
}

function sanitizeFilename(filename: string, fallback: string): string {
  if (!filename || typeof filename !== 'string') return fallback
  const cleaned = filename.replace(/[/\\?%*:|"<>]/g, '_').trim()
  return cleaned || fallback
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DownloadRequestBody
    const format = (body.format || 'sarif').toLowerCase()
    const findings = Array.isArray(body.findings) ? body.findings : []
    const contractId = typeof body.contractId === 'string' ? body.contractId.trim() : undefined

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const suffix = contractId ? `-${contractId.slice(0, 10)}` : `-${timestamp}`

    let content: string
    let contentType: string
    let defaultFilename: string

    switch (format) {
      case 'sarif':
        content = serializeSarif(findings, { contractId, pretty: true })
        contentType = 'application/sarif+json; charset=utf-8'
        defaultFilename = `soroban-guard-scan${suffix}.sarif`
        break

      case 'json':
        content = serializeJson(findings, { contractId, pretty: true })
        contentType = 'application/json; charset=utf-8'
        defaultFilename = `soroban-guard-findings${suffix}.json`
        break

      case 'csv':
        content = serializeCsv(findings)
        contentType = 'text/csv; charset=utf-8'
        defaultFilename = `soroban-guard-findings${suffix}.csv`
        break

      default:
        return NextResponse.json(
          {
            error: `Unsupported export format '${body.format}'. Supported formats: sarif, json, csv.`,
          },
          { status: 400 }
        )
    }

    const finalFilename = sanitizeFilename(body.filename || defaultFilename, defaultFilename)

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${finalFilename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate export file'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const format = (searchParams.get('format') || 'sarif').toLowerCase()
  const id = searchParams.get('id')
  const contractId = searchParams.get('contractId') || undefined
  const customFilename = searchParams.get('filename') || undefined

  let findings: Finding[] = []

  if (id) {
    try {
      const base = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin || 'http://localhost:3000'
      const res = await fetch(`${base}/api/results?id=${encodeURIComponent(id)}`, {
        cache: 'no-store',
      })
      if (!res.ok) {
        return NextResponse.json({ error: `Scan result '${id}' not found` }, { status: res.status })
      }
      const data = (await res.json()) as { findings?: Finding[] }
      findings = Array.isArray(data.findings) ? data.findings : []
    } catch {
      return NextResponse.json({ error: 'Failed to retrieve scan results' }, { status: 500 })
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const suffix = id ? `-${id}` : contractId ? `-${contractId.slice(0, 10)}` : `-${timestamp}`

  let content: string
  let contentType: string
  let defaultFilename: string

  switch (format) {
    case 'sarif':
      content = serializeSarif(findings, { contractId, pretty: true })
      contentType = 'application/sarif+json; charset=utf-8'
      defaultFilename = `soroban-guard-scan${suffix}.sarif`
      break

    case 'json':
      content = serializeJson(findings, { contractId, pretty: true })
      contentType = 'application/json; charset=utf-8'
      defaultFilename = `soroban-guard-findings${suffix}.json`
      break

    case 'csv':
      content = serializeCsv(findings)
      contentType = 'text/csv; charset=utf-8'
      defaultFilename = `soroban-guard-findings${suffix}.csv`
      break

    default:
      return NextResponse.json(
        {
          error: `Unsupported export format '${format}'. Supported formats: sarif, json, csv.`,
        },
        { status: 400 }
      )
  }

  const finalFilename = sanitizeFilename(customFilename || defaultFilename, defaultFilename)

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${finalFilename}"`,
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
