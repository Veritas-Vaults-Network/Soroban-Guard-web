'use client'

import { useState } from 'react'

interface Props {
  id: string
  className?: string
}

export default function ContractIdBadge({ id, className = '' }: Props) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const truncated = `${id.slice(0, 6)}…${id.slice(-4)}`

  return (
    <button
      onClick={handleCopy}
      title={id}
      className={`font-mono text-sm transition hover:opacity-80 ${className}`}
    >
      {copied ? <span className="text-emerald-400">Copied!</span> : truncated}
    </button>
  )
}
