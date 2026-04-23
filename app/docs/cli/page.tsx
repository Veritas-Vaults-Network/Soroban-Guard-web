'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CLIDocsPage() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCommand(id)
      setTimeout(() => setCopiedCommand(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Soroban Guard
          </Link>
          <h1 className="text-3xl font-bold text-white">CLI & REST API Documentation</h1>
          <p className="mt-2 text-lg text-slate-400">
            Guide for developers using soroban-guard-core directly
          </p>
        </div>

        {/* Installation Section */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-white">Installation & Setup</h2>
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
              <h3 className="mb-3 font-medium text-white">1. Clone the repository</h3>
              <CodeBlock
                id="clone"
                code="git clone https://github.com/Veritas-Vaults-Network/soroban-guard-core.git
cd soroban-guard-core"
                onCopy={copyToClipboard}
                copied={copiedCommand === 'clone'}
              />
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
              <h3 className="mb-3 font-medium text-white">2. Install dependencies</h3>
              <CodeBlock
                id="install"
                code="cargo build --release"
                onCopy={copyToClipboard}
                copied={copiedCommand === 'install'}
              />
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
              <h3 className="mb-3 font-medium text-white">3. Run the server</h3>
              <CodeBlock
                id="run"
                code="./target/release/soroban-guard-core"
                onCopy={copyToClipboard}
                copied={copiedCommand === 'run'}
              />
              <p className="mt-2 text-sm text-slate-400">
                The server will start on <code className="rounded bg-[var(--bg-tertiary)] px-1 text-slate-300">http://localhost:3001</code>
              </p>
            </div>
          </div>
        </section>

        {/* REST API Section */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-white">REST API Usage</h2>

          <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
            <h3 className="mb-3 font-medium text-white">POST /scan</h3>
            <p className="mb-4 text-slate-400">
              Scan a Soroban contract for security vulnerabilities.
            </p>

            <h4 className="mb-2 font-medium text-white">Request Body</h4>
            <CodeBlock
              id="request-body"
              code={`{
  "source": "#![no_std]\\nuse soroban_sdk::{contract, contractimpl, Env};\\n\\n#[contract]\\npub struct MyContract;\\n\\n#[contractimpl]\\nimpl MyContract {\\n    pub fn hello(env: Env) -> String {\\n        \\\"Hello, World!\\\".to_string()\\n    }\\n}"
}`}
              onCopy={copyToClipboard}
              copied={copiedCommand === 'request-body'}
              language="json"
            />

            <h4 className="mb-2 mt-4 font-medium text-white">cURL Example</h4>
            <CodeBlock
              id="curl"
              code={`curl -X POST http://localhost:3001/scan \\
  -H "Content-Type: application/json" \\
  -d '{
    "source": "#![no_std]\\nuse soroban_sdk::{contract, contractimpl, Env};\\n\\n#[contract]\\npub struct MyContract;\\n\\n#[contractimpl]\\nimpl MyContract {\\n    pub fn hello(env: Env) -> String {\\n        \\\"Hello, World!\\\".to_string()\\n    }\\n}"
  }'`}
              onCopy={copyToClipboard}
              copied={copiedCommand === 'curl'}
              language="bash"
            />

            <h4 className="mb-2 mt-4 font-medium text-white">JavaScript Fetch Example</h4>
            <CodeBlock
              id="fetch"
              code={`const response = await fetch('http://localhost:3001/scan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    source: \`#![no_std]
use soroban_sdk::{contract, contractimpl, Env};

#[contract]
pub struct MyContract;

#[contractimpl]
impl MyContract {
    pub fn hello(env: Env) -> String {
        "Hello, World!".to_string()
    }
}\`,
  }),
});

const data = await response.json();`}
              onCopy={copyToClipboard}
              copied={copiedCommand === 'fetch'}
              language="javascript"
            />
          </div>
        </section>

        {/* Response Format */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-white">Response Format</h2>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
            <h3 className="mb-3 font-medium text-white">Success Response (200)</h3>
            <CodeBlock
              id="response"
              code={`{
  "findings": [
    {
      "check_name": "unsafe_math",
      "severity": "High",
      "file_path": "src/lib.rs",
      "line": 15,
      "function_name": "add",
      "description": "Potential integer overflow in addition operation",
      "remediation": "Use checked_add() or ensure bounds checking"
    },
    {
      "check_name": "missing_auth",
      "severity": "Medium",
      "file_path": "src/lib.rs",
      "line": 23,
      "function_name": "transfer",
      "description": "Function modifies state without authorization check",
      "remediation": "Add require_auth() call before state modification"
    }
  ]
}`}
              onCopy={copyToClipboard}
              copied={copiedCommand === 'response'}
              language="json"
            />

            <h4 className="mb-2 mt-4 font-medium text-white">Severity Levels</h4>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong className="text-red-400">High</strong>: Critical security vulnerabilities that should be fixed immediately</li>
              <li><strong className="text-amber-400">Medium</strong>: Potential security issues that should be reviewed</li>
              <li><strong className="text-sky-400">Low</strong>: Best practice violations or minor issues</li>
            </ul>
          </div>
        </section>

        {/* Error Handling */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Error Handling</h2>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
            <h3 className="mb-3 font-medium text-white">Error Response Format</h3>
            <CodeBlock
              id="error"
              code={`{
  "error": "Invalid contract source code"
}`}
              onCopy={copyToClipboard}
              copied={copiedCommand === 'error'}
              language="json"
            />

            <h4 className="mb-2 mt-4 font-medium text-white">Common HTTP Status Codes</h4>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong>200 OK</strong>: Scan completed successfully</li>
              <li><strong>400 Bad Request</strong>: Invalid request body or contract source</li>
              <li><strong>500 Internal Server Error</strong>: Server-side processing error</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}

function CodeBlock({
  id,
  code,
  language = 'bash',
  onCopy,
  copied,
}: {
  id: string
  code: string
  language?: string
  onCopy: (text: string, id: string) => void
  copied: boolean
}) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] p-4 text-sm">
        <code className={`language-${language} text-slate-300`}>{code}</code>
      </pre>
      <button
        onClick={() => onCopy(code, id)}
        className="absolute right-3 top-3 rounded bg-slate-700 p-1 text-slate-400 hover:text-white"
        title="Copy to clipboard"
      >
        {copied ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  )
}