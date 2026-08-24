import { NextRequest, NextResponse } from 'next/server'
import { getExportTarget } from '@/lib/export'
import type { ExportRequestPayload } from '@/lib/export'

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1') {
    return true
  }
  // Check private IPv4 ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true
  return false
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ExportRequestPayload
    const { targetId, config, findings, options } = body

    if (!targetId || typeof targetId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid targetId' }, { status: 400 })
    }

    const target = getExportTarget(targetId)
    if (!target) {
      return NextResponse.json({ error: `Unknown export target '${targetId}'` }, { status: 400 })
    }

    if (!Array.isArray(findings) || findings.length === 0) {
      return NextResponse.json({ error: 'No findings provided for export' }, { status: 400 })
    }

    // Target configuration validation
    const validation = target.validateConfig(config || {})
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || 'Invalid configuration' }, { status: 400 })
    }

    // Extract destination URL for SSRF allowlist enforcement
    const destUrlString = config?.webhookUrl
    if (!destUrlString || typeof destUrlString !== 'string') {
      return NextResponse.json({ error: 'Missing destination webhook URL' }, { status: 400 })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(destUrlString.trim())
    } catch {
      return NextResponse.json({ error: 'Invalid destination URL' }, { status: 400 })
    }

    // Security: Protocol check
    if (parsedUrl.protocol !== 'https:') {
      return NextResponse.json({ error: 'Destination URL must use HTTPS' }, { status: 400 })
    }

    // Security: SSRF Private Host check
    if (isPrivateHost(parsedUrl.hostname)) {
      return NextResponse.json({ error: 'Requests to private or loopback addresses are blocked' }, { status: 400 })
    }

    // Security: Domain allowlist verification
    const allowed = target.allowlistDomains.some(domain =>
      parsedUrl.hostname.toLowerCase() === domain.toLowerCase() ||
      parsedUrl.hostname.toLowerCase().endsWith('.' + domain.toLowerCase())
    )

    if (!allowed) {
      return NextResponse.json(
        {
          error: `Destination domain '${parsedUrl.hostname}' is not permitted for target '${target.id}'. Allowed domain(s): ${target.allowlistDomains.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Build payload via target adapter
    const payload = target.buildPayload(findings, config, options)

    // Proxy outbound fetch request to destination
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    let response: Response
    try {
      response = await fetch(parsedUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return NextResponse.json({ error: 'Destination server timed out (10s)' }, { status: 504 })
      }
      return NextResponse.json({ error: 'Failed to connect to destination server' }, { status: 502 })
    } finally {
      clearTimeout(timeout)
    }

    const responseText = await response.text()

    if (!response.ok) {
      const formattedError = target.parseErrorResponse(response.status, responseText)
      return NextResponse.json(
        { error: formattedError, statusCode: response.status },
        { status: response.status >= 400 && response.status < 600 ? response.status : 502 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully exported ${findings.length} finding(s) to ${target.name}.`,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error during export' },
      { status: 500 }
    )
  }
}
