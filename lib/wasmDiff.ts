// Simple WASM structural parser for human-readable diffs
// This does not fully validate WASM but extracts section ids, sizes and exports

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '')
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16)
  return out
}

function readVarUint(bytes: Uint8Array, offsetRef: { off: number }) {
  let result = 0
  let shift = 0
  let off = offsetRef.off
  while (true) {
    const byte = bytes[off++]!
    result |= (byte & 0x7f) << shift
    if ((byte & 0x80) === 0) break
    shift += 7
  }
  offsetRef.off = off
  return result >>> 0
}

export interface WasmSection {
  id: number
  size: number
  detail?: any
}

export interface WasmSummary {
  valid: boolean
  sections: WasmSection[]
}

export function parseWasmStructure(hexOrBytes: string | Uint8Array): WasmSummary {
  const bytes = typeof hexOrBytes === 'string' ? hexToBytes(hexOrBytes) : hexOrBytes
  if (bytes.length < 8) return { valid: false, sections: [] }
  // magic and version
  if (!(bytes[0] === 0x00 && bytes[1] === 0x61 && bytes[2] === 0x73 && bytes[3] === 0x6d)) {
    return { valid: false, sections: [] }
  }
  const version = (bytes[4] | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24)) >>> 0

  const sections: WasmSection[] = []
  const offRef = { off: 8 }
  while (offRef.off < bytes.length) {
    const id = bytes[offRef.off++]!
    const size = readVarUint(bytes, offRef)
    const start = offRef.off
    const end = start + size
    const payload = bytes.subarray(start, end)

    const sec: WasmSection = { id, size }
    // export section id is 7
    if (id === 7) {
      try {
        const ref = { off: 0 }
        const count = readVarUint(payload, ref)
        const exports: string[] = []
        for (let i = 0; i < count; i++) {
          const nameLen = readVarUint(payload, ref)
          const chars = []
          for (let j = 0; j < nameLen; j++) chars.push(String.fromCharCode(payload[ref.off++]!))
          const name = chars.join('')
          const kind = payload[ref.off++]!
          readVarUint(payload, ref) // index
          exports.push(name + ` (kind:${kind})`)
        }
        sec.detail = { count, exports }
      } catch (e) {
        sec.detail = { error: 'parse_error' }
      }
    }

    sections.push(sec)
    offRef.off = end
  }

  return { valid: true, sections }
}

export function structuralWasmDiff(aHex: string | Uint8Array, bHex: string | Uint8Array) {
  const a = parseWasmStructure(aHex)
  const b = parseWasmStructure(bHex)
  const ids = new Set<number>()
  a.sections.forEach(s => ids.add(s.id))
  b.sections.forEach(s => ids.add(s.id))
  const diff: Array<{ id: number; a?: WasmSection; b?: WasmSection }> = []
  for (const id of Array.from(ids).sort((x, y) => x - y)) {
    diff.push({ id, a: a.sections.find(s => s.id === id), b: b.sections.find(s => s.id === id) })
  }
  return { a, b, diff }
}
