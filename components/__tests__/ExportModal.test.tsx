import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import ExportModal from '@/components/ExportModal'
import type { Finding } from '@/types/findings'
import * as clientDownload from '@/lib/export/clientDownload'

const mockFindings: Finding[] = [
  {
    check_name: 'missing-require-auth',
    severity: 'Critical',
    file_path: 'src/lib.rs',
    line: 42,
    function_name: 'mint_tokens',
    description: 'Method writes to storage without auth check.',
    remediation: 'Add env.require_auth().',
  },
]

describe('ExportModal Component', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders download tabs and buttons when open', () => {
    render(
      <ExportModal
        open={true}
        onClose={onClose}
        findings={mockFindings}
        scanSource="CC12345"
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Export Security Findings/i)).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Download File/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Team Webhooks/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Download SARIF file/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Download JSON findings/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Download CSV findings/i })).toBeInTheDocument()
  })

  it('triggers SARIF download on button click', async () => {
    const downloadSpy = vi
      .spyOn(clientDownload, 'downloadFindings')
      .mockResolvedValueOnce({ success: true, filename: 'soroban-guard-scan.sarif' })

    render(
      <ExportModal
        open={true}
        onClose={onClose}
        findings={mockFindings}
        scanSource="CC12345"
      />
    )

    const sarifBtn = screen.getByRole('button', { name: /Download SARIF file/i })
    fireEvent.click(sarifBtn)

    expect(downloadSpy).toHaveBeenCalledWith({
      format: 'sarif',
      findings: mockFindings,
      contractId: 'CC12345',
    })

    await waitFor(() => {
      expect(screen.getByText(/Downloaded soroban-guard-scan.sarif successfully/i)).toBeInTheDocument()
    })
  })

  it('switches to webhook tab and displays webhook options', () => {
    render(
      <ExportModal
        open={true}
        onClose={onClose}
        findings={mockFindings}
        scanSource="CC12345"
      />
    )

    const webhookTab = screen.getByRole('tab', { name: /Team Webhooks/i })
    fireEvent.click(webhookTab)

    expect(screen.getByRole('button', { name: /^Slack Webhook$/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Slack Webhook URL/i)).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    const { container } = render(
      <ExportModal
        open={false}
        onClose={onClose}
        findings={mockFindings}
      />
    )
    expect(container.firstChild).toBeNull()
  })
})
