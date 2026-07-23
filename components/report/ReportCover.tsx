export const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40"><rect width="40" height="40" rx="8" fill="#0f172a"/><path d="M12 8 L28 8 L20 32 Z" fill="#38bdf8"/><path d="M12 20 L28 20" stroke="#f43f5e" stroke-width="1.5" stroke-linecap="round"/></svg>`

interface ReportCoverProps {
  source: string
  scannedAt: string
  score: number
  walletAddress?: string
}

export default function ReportCover({ source, scannedAt, score, walletAddress }: ReportCoverProps) {
  return (
    <div className="cover">
      <div className="logo" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
      <div className="cover-content">
        <h1>Soroban Guard — Security Report</h1>
        <p>Contract: {source}</p>
        <p>Scanned: {new Date(scannedAt).toLocaleString()}</p>
        {walletAddress && <p className="wallet-address">Scanned by: {walletAddress}</p>}
        <div
          className="score-badge"
          style={{
            background: score >= 80 ? '#dcfce7' : score >= 50 ? '#fef9c3' : '#fee2e2',
            color: score >= 80 ? '#166534' : score >= 50 ? '#854d0e' : '#991b1b',
          }}
        >
          Security Score: {score}
        </div>
      </div>
    </div>
  )
}
