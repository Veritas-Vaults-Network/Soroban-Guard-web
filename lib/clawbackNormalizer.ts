/**
 * Asset Enforcement & Clawback Event Normalizer (#174)
 *
 * Parses raw Soroban contract event data for asset recovery and enforcement
 * functions triggered on tokenized real-world assets (RWAs) and translates
 * them into human-readable summaries.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

/** Known enforcement/clawback function names emitted by RWA contracts. */
export type EnforcementAction =
  | 'clawback'
  | 'freeze'
  | 'unfreeze'
  | 'force_transfer'
  | 'burn_from'
  | 'regulatory_seizure'

/** Raw event payload as returned by Soroban RPC or the scanner core. */
export interface RawEnforcementEvent {
  /** Contract function that triggered the event */
  action: string
  /** Stellar G-address of the issuer / authority */
  issuer: string
  /** Stellar G-address of the affected account */
  from: string
  /** Token amount (as a string to preserve precision) */
  amount: string
  /** Human-readable asset name, e.g. "tokenized treasury notes" */
  asset_name: string
  /** ISO-8601 timestamp or ledger sequence number */
  timestamp?: string
  /** Optional regulatory reference / case ID */
  reference?: string
}

/** Normalised enforcement event with a human-readable summary. */
export interface EnforcementEvent {
  action: EnforcementAction
  issuer: string
  from: string
  amount: string
  asset_name: string
  timestamp?: string
  reference?: string
  /** Human-readable summary sentence */
  summary: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ACTION_ALIASES: Record<string, EnforcementAction> = {
  clawback: 'clawback',
  claw_back: 'clawback',
  freeze: 'freeze',
  freeze_account: 'freeze',
  freezeaccount: 'freeze',
  unfreeze: 'unfreeze',
  unfreeze_account: 'unfreeze',
  unfreezeaccount: 'unfreeze',
  force_transfer: 'force_transfer',
  forcetransfer: 'force_transfer',
  burn_from: 'burn_from',
  burnfrom: 'burn_from',
  regulatory_seizure: 'regulatory_seizure',
  regulatoryseizure: 'regulatory_seizure',
  seizure: 'regulatory_seizure',
}

const ACTION_PHRASES: Record<EnforcementAction, string> = {
  clawback: 'executed a regulatory clawback of',
  freeze: 'froze the account holding',
  unfreeze: 'unfroze the account holding',
  force_transfer: 'executed a forced transfer of',
  burn_from: 'burned',
  regulatory_seizure: 'executed a regulatory seizure of',
}

/**
 * Format a numeric string with thousands separators.
 * Falls back to the raw string if it is not a valid number.
 */
function formatAmount(amount: string): string {
  const n = Number(amount)
  if (Number.isNaN(n)) return amount
  return n.toLocaleString('en-US')
}

/**
 * Truncate a Stellar G-address to a short display form: GABC...XYZ
 */
function shortAddress(address: string): string {
  if (address.length <= 12) return address
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

/**
 * Resolve a raw action string to a canonical EnforcementAction.
 * Returns null if the action is not recognised.
 */
function resolveAction(raw: string): EnforcementAction | null {
  return ACTION_ALIASES[raw.toLowerCase().trim()] ?? null
}

// ── Core API ──────────────────────────────────────────────────────────────────

/**
 * Build a human-readable summary sentence for an enforcement event.
 *
 * @example
 * buildSummary('clawback', 'GABC...', 'GXYZ...', '2500', 'tokenized treasury notes')
 * // → "Issuer GABC...WXYZ executed a regulatory clawback of 2,500 tokenized treasury notes from address GXYZ...ABCD."
 */
export function buildSummary(
  action: EnforcementAction,
  issuer: string,
  from: string,
  amount: string,
  asset_name: string,
  reference?: string,
): string {
  const phrase = ACTION_PHRASES[action]
  const formattedAmount = formatAmount(amount)
  const issuerShort = shortAddress(issuer)
  const fromShort = shortAddress(from)

  let summary: string

  if (action === 'freeze' || action === 'unfreeze') {
    summary = `Issuer ${issuerShort} ${phrase} ${formattedAmount} ${asset_name} at address ${fromShort}.`
  } else {
    summary = `Issuer ${issuerShort} ${phrase} ${formattedAmount} ${asset_name} from address ${fromShort}.`
  }

  if (reference) {
    summary += ` Reference: ${reference}.`
  }

  return summary
}

/**
 * Parse and normalise a raw enforcement event payload.
 *
 * @param raw - Raw event object from the Soroban scanner or RPC
 * @returns Normalised EnforcementEvent, or null if the action is unrecognised
 */
export function parseEnforcementEvent(raw: RawEnforcementEvent): EnforcementEvent | null {
  const action = resolveAction(raw.action)
  if (!action) return null

  const summary = buildSummary(
    action,
    raw.issuer,
    raw.from,
    raw.amount,
    raw.asset_name,
    raw.reference,
  )

  return {
    action,
    issuer: raw.issuer,
    from: raw.from,
    amount: raw.amount,
    asset_name: raw.asset_name,
    timestamp: raw.timestamp,
    reference: raw.reference,
    summary,
  }
}

/**
 * Normalise an array of raw enforcement events, silently dropping
 * any entries with unrecognised actions.
 *
 * @param events - Array of raw event payloads
 * @returns Array of normalised EnforcementEvent objects
 */
export function normalizeEnforcementEvents(events: RawEnforcementEvent[]): EnforcementEvent[] {
  return events.flatMap(e => {
    const parsed = parseEnforcementEvent(e)
    return parsed ? [parsed] : []
  })
}
