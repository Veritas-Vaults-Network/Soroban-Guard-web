import type { ReactNode } from 'react'

export const REPORT_STYLES = `
  @media print {
    @page {
      margin: 18mm 20mm;
      size: A4;
    }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .no-print { display: none !important; }
    body { background: #fff !important; color: #111 !important; }
    .page { padding: 0 !important; }
    .page-wrapper { position: relative; }
    .cover { page-break-after: always; }
    h2 { page-break-after: avoid; }
    .finding-block { page-break-inside: avoid; page-break-after: auto; }
    a { text-decoration: none; color: inherit; }
    .page-number { position: absolute; bottom: 10mm; right: 20mm; font-size: 11px; color: #9ca3af; }
  }
  body { font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #111; margin: 0; font-size: 14px; line-height: 1.5; }
  .page { max-width: 900px; margin: 0 auto; padding: 40px 32px; position: relative; }
  .cover { border-bottom: 2px solid #e5e7eb; padding-bottom: 28px; margin-bottom: 28px; display: flex; align-items: flex-start; gap: 16px; }
  .logo { flex-shrink: 0; }
  .cover-content { flex: 1; }
  .cover h1 { font-size: 26px; font-weight: 700; margin: 0 0 8px; }
  .cover p { color: #6b7280; margin: 4px 0; font-size: 13px; }
  .score-badge { display: inline-block; padding: 4px 14px; border-radius: 999px; font-weight: 700; font-size: 16px; margin-top: 12px; }
  .summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 28px; }
  .summary-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; text-align: center; }
  .summary-card .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .summary-card .value { font-size: 26px; font-weight: 700; }
  h2 { font-size: 16px; font-weight: 600; margin: 0 0 14px; color: #111; }
  .findings-list { display: flex; flex-direction: column; gap: 14px; }
  .finding-block { border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; background: #fafafa; }
  .finding-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .sev { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; color: #fff; letter-spacing: 0.03em; white-space: nowrap; }
  .finding-title { font-weight: 600; font-size: 14px; color: #111; flex: 1; }
  .finding-location { font-size: 12px; color: #6b7280; font-family: monospace; }
  .finding-description { font-size: 13px; color: #374151; margin: 8px 0; line-height: 1.6; }
  .finding-remediation { margin-top: 8px; padding-top: 8px; border-top: 1px solid #d1d5db; font-size: 12px; color: #374151; }
  .finding-remediation strong { display: block; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .footer-note { margin-top: 36px; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 14px; }
  .wallet-address { font-size: 11px; color: #6b7280; font-family: monospace; word-break: break-all; }
  @media (max-width: 600px) {
    .summary { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .page { padding: 24px 16px; }
    .cover { flex-direction: column; align-items: center; text-align: center; }
    .cover h1 { font-size: 22px; }
  }
`

interface ReportLayoutProps {
  children: ReactNode
}

export default function ReportLayout({ children }: ReportLayoutProps) {
  return (
    <>
      <style>{REPORT_STYLES}</style>
      <div className="page">{children}</div>
    </>
  )
}
