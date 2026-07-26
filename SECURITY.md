# Security Policy & Threat Model

## Supported Versions

| Version | Supported |
|---------|-----------|
| `main`  | ✅ Yes    |

Only the latest code on the `main` branch receives security fixes.

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please report them via one of the following:

- **GitHub Private Advisory** — [Report a vulnerability](../../security/advisories/new) (preferred)
- **Email** — `security@veritas-vaults.network`

Include as much detail as possible: steps to reproduce, affected component, and potential impact.

## Response Timeline

| Milestone | Target |
|-----------|--------|
| Acknowledgement | Within 48 hours |
| Status update | Within 7 days |
| Patch / fix released | Within 14 days of confirmation |

We will coordinate a disclosure date with you once a fix is ready.

## Out of Scope

- Bugs in third-party dependencies (report upstream)
- Issues in the Stellar network or Soroban protocol itself
- Freighter wallet internals
- Findings from automated scanners without a working proof-of-concept
- Social engineering or phishing attacks

## Disclosure Policy

We follow [responsible disclosure](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure). Please give us reasonable time to address the issue before any public disclosure.

---

## Acknowledgments

Contributors who have responsibly disclosed vulnerabilities are listed here once the fix is shipped and they consent to being named.

---

## Threat Model

> This section documents the concrete attack surface of the Soroban Guard web frontend. It is deliberately specific to this codebase, not a generic web-app template.

### Scope

Soroban Guard is a security scanner whose core value proposition is that it **accepts arbitrary, potentially malicious input by design** — a user submits untrusted smart-contract source code so the backend engine can find vulnerabilities in it. This creates a fundamental tension: the frontend must safely handle content that is adversarial by nature.

The threat model covers two primary attack surfaces:

1. **Scan-input surface** — the five ways a user can supply contract material to be scanned.
2. **Integration-export surface** — the outbound channels through which scan results can be delivered or stored.

---

### Surface 1: Scan Input

There are five input modes. Each has a different trust profile and a different set of attacker-controllable variables.

#### 1a. Paste (raw source code)

**What happens:** The user pastes Rust (or other) source directly into the `<textarea>` in `ScanInput.tsx`. The text is forwarded as-is to `POST /scan` on `soroban-guard-core`.

**Attacker goal:** Inject content that survives the round-trip and executes in the browser when displayed, or that causes the backend engine to behave unexpectedly.

| Threat | Attack scenario | Current control | Residual risk |
|--------|----------------|-----------------|---------------|
| XSS via rendered output | The backend returns findings whose `description` or `check_name` fields embed `<script>` or event-handler HTML, injected via a malicious source paste designed to confuse the analysis engine's output serialiser | `FindingsTable.tsx` renders all finding fields as React text nodes (no `dangerouslySetInnerHTML`). `CodeViewer.tsx` escapes source lines through `escapeHtml()` before fallback rendering and through `DOMPurify.sanitize()` with an allow-list of `{span, br}` / `{class}` before highlight.js rendering | Low. The allow-list in DOMPurify is tight; escapeHtml is used when hljs is unavailable. **Tracked in the same issue batch.** |
| Oversized paste causing DoS | A 50 MB paste slows or crashes the Next.js server-side route or the core API | No explicit size cap at the frontend layer today | Medium. A `maxLength` guard on the textarea or a client-side byte limit before submission should be added. |
| Paste containing binary / non-UTF-8 | Malformed bytes break JSON serialisation or cause unexpected backend behaviour | Browser `<textarea>` normalises to UTF-16; `JSON.stringify` of the body handles escaping | Low. |

#### 1b. GitHub Repository URL

**What happens:** The URL is validated client-side (`lib/stellar.ts` — `isValidContractId` / general URL checks), then forwarded to the core API. The core API fetches the repo content server-side.

**Attacker goal:** Cause the core API to make an unintended outbound request (SSRF), or supply a URL that resolves to internal infrastructure rather than a public GitHub repo.

| Threat | Attack scenario | Current control | Residual risk |
|--------|----------------|-----------------|---------------|
| SSRF via crafted GitHub URL | Submit `https://github.com.attacker.example/org/repo` or a redirect chain that terminates at `169.254.169.254` (cloud metadata) | Client-side validation only checks URL format; no DNS/IP validation is done in the frontend | **High** (backend responsibility, but the frontend provides no guard). The core API must enforce an allowlist of resolved IPs. **Tracked in the same issue batch.** |
| Private-repo enumeration | Submit a private GitHub URL to probe whether a repo exists (timing / status code difference) | Not mitigated at the frontend | Low impact (no secrets exposed, only existence). |
| Malicious repo content → XSS | Same as 1a once the repo source is returned and rendered | Same DOMPurify / React text-node controls as 1a | Low. |

#### 1c. Soroban Contract ID (C-address)

**What happens:** The user enters a C-address. `lib/stellar.ts` validates the format (`isValidContractId`), then the frontend calls `fetchContractWasm` via Soroban RPC to obtain WASM bytecode, which is forwarded to the core API.

**Attacker goal:** Point the scanner at a contract that embeds adversarial content in its WASM metadata, annotations, or decompiled output.

| Threat | Attack scenario | Current control | Residual risk |
|--------|----------------|-----------------|---------------|
| Adversarial WASM → XSS in decompiled output | A deployed contract encodes `<img onerror=...>` in a custom section name or string constant; the decompiler emits it verbatim; it reaches `CodeViewer` | Same DOMPurify controls as 1a | Low. |
| Malformed C-address bypass | A C-address passes `isValidContractId` but is crafted to trigger a parsing edge case in the core API | `isValidContractId` checks the full 56-character StrKey format; the core API performs its own validation | Low. |
| Contract-ID scanning of internal contracts | An attacker scans contract IDs belonging to other users or internal tooling to learn about their interfaces | Not a frontend concern; the core API controls access to scan results | Out of scope for frontend. |

#### 1d. GitHub Gist URL

**What happens:** `lib/gist.ts` validates the Gist URL against `GIST_URL_RE`, calls `https://api.github.com/gists/{id}` to list files, then fetches each file's `raw_url`.

**Attacker goal:** Supply a Gist URL whose raw content poisons the scan or whose `raw_url` is a redirect to an attacker-controlled host.

| Threat | Attack scenario | Current control | Residual risk |
|--------|----------------|-----------------|---------------|
| `raw_url` redirect to non-GitHub host | The GitHub API returns a `raw_url` pointing to `https://attacker.example/malware.txt` | No validation of `raw_url` hostname before fetching in `fetchGistFileContent` | **Medium.** The `raw_url` should be validated to match `raw.githubusercontent.com` before following. |
| Gist content → XSS | Same as 1a once gist source is displayed | Same DOMPurify / React controls | Low. |
| Private gist enumeration | Submit a gist ID to probe private gist existence (GitHub returns 404 vs 200) | Not mitigated | Low impact. |

#### 1e. IPFS CID

**What happens:** `lib/ipfs.ts` validates the CID against `CID_RE` (Qm… or bafy…), then fetches `https://ipfs.io/ipfs/{cid}` via the public gateway with a 15 s timeout.

**Attacker goal:** Supply a CID that points to an arbitrarily large or adversarial file, or exploit the gateway to pivot to internal infrastructure.

| Threat | Attack scenario | Current control | Residual risk |
|--------|----------------|-----------------|---------------|
| Oversized IPFS content causing DoS | A CID pointing to a multi-GB file exhausts memory or connection time | 15 s abort timeout limits exposure | Medium. There is no content-length check before reading the body; `res.text()` buffers the full response. A streaming size-cap should be added. |
| IPFS gateway SSRF | The gateway `ipfs.io` itself is not an attacker-controlled host, but a future change to a configurable gateway URL would introduce SSRF | Currently hardcoded to `ipfs.io` | Low (hardcoded). Would become High if the gateway becomes user-configurable. |
| CID poisoning → XSS | A CID pointing to content with embedded HTML/JS | Same DOMPurify / React controls as 1a | Low. |

---

### Surface 2: Integration / Export

Scan results can be sent to six outbound channels. In every case the attacker-controlled variable is the **webhook URL or API token** — either entered by the user in the UI or stored in localStorage / Vercel KV.

The shared threat across all integrations:

| Threat | Attack scenario | Current control | Residual risk |
|--------|----------------|-----------------|---------------|
| SSRF via attacker-supplied webhook URL | User (or an attacker with access to the results page) enters `http://169.254.169.254/latest/meta-data/` as a Slack/Discord/Telegram/Notion/Jira/Linear webhook URL | No URL validation on any of the six integration modals | **High.** The outbound request is made from the browser (not server-side), so the SSRF target is the user's local network, not the cloud metadata endpoint — this limits the blast radius but does not eliminate it. For server-side routes (webhook delivery via `/api/webhook`) the risk is higher. **Tracked in the same issue batch.** |
| Token exfiltration via XSS | If an XSS is achieved (see surface 1), stored Slack/Discord/Notion/Jira/Linear tokens in localStorage or sessionStorage are accessible to the injected script | XSS mitigations above reduce likelihood | Medium (dependent on XSS). |
| Injection via finding fields in notification payloads | A crafted finding `description` containing Slack `mrkdwn` control sequences (`<!here>`, `<!channel>`) or Notion block injection | `lib/slack.ts` interpolates `finding.check_name`, `finding.function_name`, `finding.file_path` directly into `mrkdwn` text without sanitisation | **Medium.** Notification payloads should strip or escape Slack/Discord/Notion control characters from finding fields before interpolation. **Tracked in the same issue batch.** |
| Webhook token replay | The one-time embed/webhook token stored in Vercel KV (1 h TTL) is intercepted and replayed | HTTPS in transit; token is a random string | Low. |
| Results stored indefinitely in KV | Scan results in Vercel KV have a 30-day TTL; a leaked `KV_REST_API_TOKEN` exposes all stored results | Token is server-side only (`KV_REST_API_TOKEN` is not `NEXT_PUBLIC_`); not accessible from the browser | Low (if env var hygiene is maintained). |

#### 2a. GitHub Issue Export (`lib/githubExport.ts`)

- The GitHub token is sent in an `Authorization: token ...` header to `https://api.github.com`.
- The issue body is built from finding fields via template interpolation — Markdown injection (e.g. embedding links or code blocks) in finding descriptions would affect the created issue but not execute code in the browser.
- **Risk:** Low (GitHub's issue renderer treats content as Markdown, not HTML).

#### 2b. Slack / Discord / Telegram (`lib/slack.ts`, `lib/discord.ts`, `lib/telegram.ts`)

- Webhook URLs are user-supplied and validated only for non-emptiness.
- Finding fields are interpolated directly into message blocks.
- **Risk:** Medium — see injection row in the table above.

#### 2c. Notion (`lib/notion.ts`)

- The Notion API token and database ID are user-supplied.
- Finding descriptions are placed into Notion `paragraph` blocks via the Notion REST API; Notion renders these as rich text, not HTML.
- **Risk:** Low (no HTML execution in Notion blocks).

#### 2d. Jira (`lib/jira.ts`)

- The Jira base URL, email, and API token are user-supplied.
- The issue description is built as Jira wiki markup. Jira wiki markup does not execute JavaScript.
- **Risk:** Low.

#### 2e. Linear (`lib/linear.ts`)

- The Linear API key is user-supplied.
- Issue description is Markdown. Same reasoning as GitHub.
- **Risk:** Low.

#### 2f. Internal API routes (`/api/results`, `/api/webhook`)

- Protected by `API_SECRET_KEY` bearer token when set (via `lib/apiAuth.ts`).
- In-memory store is wiped on cold start; Vercel KV store persists for 30 days.
- No server-side SSRF risk in these routes (they store/retrieve JSON blobs, not make outbound requests).
- **Risk:** Low when `API_SECRET_KEY` is set. Medium in development (unset = unauthenticated).

---

### Cross-Cutting Controls

| Control | Where it lives | What it covers |
|---------|---------------|----------------|
| DOMPurify allow-list sanitisation | `components/CodeViewer.tsx` | XSS in highlighted contract source |
| React text-node rendering | `components/FindingsTable.tsx`, `components/FindingCard.tsx` | XSS in finding metadata fields |
| `escapeHtml()` fallback | `components/CodeViewer.tsx` | XSS when highlight.js is unavailable |
| `API_SECRET_KEY` bearer auth | `lib/apiAuth.ts`, `app/api/results/`, `app/api/webhook/` | Unauthorized access to internal API routes |
| Subresource Integrity (SRI) | `components/CodeViewer.tsx` (`integrity` on hljs script tag) | Tampering with CDN-loaded highlight.js |
| Rate limiting (core API) | `soroban-guard-core` | Scan-endpoint abuse / DoS |
| Vercel KV 30-day TTL | `app/api/results/route.ts` | Long-term result persistence exposure |
| Audit log | `lib/auditLog.ts` | Forensic trail for notable scan and export events |

---

### Mitigations Tracked in This Issue Batch (Cross-References)

The following risks identified above are tracked as separate issues; fixes should not be duplicated here but the threat model cross-references them:

- **XSS via `CodeViewer` / finding fields** — related issue in batch (DOMPurify allow-list already in place; `dangerouslySetInnerHTML` audit ongoing).
- **SSRF via custom webhook/integration endpoints** — related issue in batch (no server-side URL validation today; needs allowlist or SSRF-proof proxy).
- **Injection via integration notification payloads** — related issue in batch (Slack `mrkdwn` / Discord embed injection via finding fields).
- **GitHub Gist `raw_url` hostname validation** — identified above; not yet tracked; recommend adding to the backlog.
- **IPFS response body size cap** — identified above; not yet tracked; recommend adding to the backlog.
