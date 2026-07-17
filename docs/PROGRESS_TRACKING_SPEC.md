# Scan Progress Tracking Specification

## Current Implementation (Simulated Progress)

### Overview
`components/ScanProgress.tsx` currently displays **client-side estimated progress** while `POST /scan` executes on the backend. This is a **best-effort UX improvement** rather than real engine feedback.

### How It Works Today

```
Timeline (milliseconds):
0ms     → 1500ms    → 3000ms    → 4500ms
┌─────────┬─────────┬─────────┬─────────┐
│ Upload  │ Parsing │Analyzing│  Done   │
└─────────┴─────────┴─────────┴─────────┘
0%        30%       65%      100%
```

**Fixed Step Duration**: 1500ms per step (approximately)

**Progress Boundaries**:
- Step 0 (Uploading): 0% → 30%
- Step 1 (Parsing): 30% → 65%
- Step 2 (Analyzing): 65% → 100%
- Step 3 (Done): 100%

**Current UX**:
- ✓ Shows estimated time for each completed step
- ✓ Animates spinning indicator for active step
- ✓ Displays "elapsed" timer (e.g., "3.2s")
- ✓ Handles batch scans with real progress (`batchCurrent/batchTotal`)
- ✗ **Does NOT reflect actual backend progress**
- ✗ **Times are completely fictional**
- ✗ Times don't adapt to actual scan duration (always ~6s total)

### Why This Is an Estimate

The backend `POST /scan` endpoint:
1. **Is synchronous/blocking** — Takes 1-30+ seconds depending on contract complexity
2. **Has no intermediate signals** — Returns only when complete
3. **Provides no progress events** — No SSE, WebSocket, or polling available
4. **Actual duration varies wildly** — Small contracts: <1s; complex contracts: 20s+

The UI cannot know:
- When parsing actually starts or ends
- When analysis begins or completes
- How much time remains

### Code Location
- **Component**: [components/ScanProgress.tsx](../components/ScanProgress.tsx)
- **API Call**: [lib/api.ts](../lib/api.ts) — `scanContract()`
- **Test**: [components/ScanProgress.test.tsx](../components/ScanProgress.test.tsx)

---

## Real-Time Progress: Requirements & Architecture

### What Would Be Needed

To implement **genuine real-time progress**, the `soroban-guard-core` backend would need to expose one of these patterns:

#### Option 1: Server-Sent Events (SSE) — RECOMMENDED

**Pros**: 
- Simple to implement (one-way streaming)
- Works through HTTP/proxies
- Perfect for progress updates
- Native browser support

**Cons**:
- Requires core API changes
- Backend needs job/scan ID management

**Flow**:
```
1. POST /scan → Returns { scanId: "abc123", streamUrl: "/scan/abc123/events" }
2. Client opens EventSource("/scan/abc123/events")
3. Server streams events:
   event: progress
   data: {"step": "parsing", "pct": 35, "elapsed": 2100}
   
   event: progress
   data: {"step": "analyzing", "pct": 68, "elapsed": 4800}
   
   event: complete
   data: {"findings": [...], "totalTime": 6500}
```

#### Option 2: Polling with Job Status

**Pros**:
- Even simpler (no streaming)
- Works with any HTTP client
- Stateless backend

**Cons**:
- More network overhead
- Potential race conditions

**Flow**:
```
1. POST /scan → Returns { scanId: "abc123" }
2. GET /scan/abc123/status → { "step": "parsing", "pct": 35, "elapsed": 2100 }
3. Poll every 100-500ms until "done": true
```

#### Option 3: WebSocket

**Pros**:
- Bidirectional (could support cancellation)
- Lower latency

**Cons**:
- More complex
- Overkill for simple progress

---

### Core API Changes Needed

#### New Backend Endpoints

**1. Async Scan Initiation**
```
POST /scan/start
Request:  { "source": "...", "network": "..." }
Response: { "scanId": "uuid", "streamUrl": "/scan/{scanId}/events" }
```

**2. Progress Stream (SSE)**
```
GET /scan/{scanId}/events
Response: text/event-stream

Events:
- "progress": { "step": string, "pct": 0-100, "elapsed": ms }
- "complete": { "findings": Finding[], "totalTime": ms }
- "error": { "code": string, "message": string }
```

**3. Status Polling Endpoint (Optional)**
```
GET /scan/{scanId}/status
Response: {
  "done": boolean,
  "step": "uploading" | "parsing" | "analyzing",
  "pct": 0-100,
  "elapsed": number,
  "findings": Finding[] | null,
  "error": string | null
}
```

---

### Frontend Implementation Example (Using SSE)

```typescript
// Pseudo-code for real progress implementation
async function scanContractWithProgress(
  source: string,
  onProgress: (event: ScanProgressEvent) => void,
  signal?: AbortSignal
): Promise<ScanResult> {
  // Step 1: Initiate scan
  const initRes = await fetch(`${API_BASE}/scan/start`, {
    method: 'POST',
    body: JSON.stringify({ source }),
    signal,
  })
  const { scanId, streamUrl } = await initRes.json()

  // Step 2: Stream progress events
  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(streamUrl)
    
    eventSource.addEventListener('progress', (e) => {
      const event = JSON.parse(e.data)
      onProgress(event)
    })
    
    eventSource.addEventListener('complete', (e) => {
      const result = JSON.parse(e.data)
      eventSource.close()
      resolve(result)
    })
    
    eventSource.addEventListener('error', (e) => {
      eventSource.close()
      const error = JSON.parse(e.data)
      reject(new ApiError(500, error.message))
    })
    
    signal?.addEventListener('abort', () => eventSource.close())
  })
}
```

---

## Type Definitions (Ready for Implementation)

```typescript
// In types/findings.ts or types/progress.ts

export interface ScanProgressEvent {
  step: 'uploading' | 'parsing' | 'analyzing' | 'complete'
  pct: number // 0-100
  elapsed: number // milliseconds
}

export interface ScanStartResponse {
  scanId: string
  streamUrl: string // For SSE connection
}

export interface ScanStatusResponse {
  done: boolean
  step: 'uploading' | 'parsing' | 'analyzing'
  pct: number
  elapsed: number
  findings: Finding[] | null
  error: string | null
}

export interface ScanCompleteEvent {
  findings: Finding[]
  totalTime: number
}
```

---

## Decision Log

### Why Simulated Progress for Now?

1. **Core API Gap**: `soroban-guard-core` is CLI-only, no HTTP layer exists
2. **Honest UX**: Better to show honest estimate than imply false real-time feedback
3. **Clear Roadmap**: This spec provides exact requirements for real implementation
4. **Unblocked Progress**: UI improvements can ship immediately without Core changes

### Why Not Force Real Progress?

1. Requires coordination with separate `soroban-guard-core` project
2. Would block this feature on external dependencies
3. Current UX is reasonable for contract scans (typically 1-10 seconds)
4. Best-effort progress is valid; transparency matters more

---

## Future Work

- [ ] **Option 1 Priority**: Implement SSE in core API with job tracking
- [ ] **Option 2 Priority**: Add polling endpoint as fallback
- [ ] **Frontend**: Update `scanContract()` to detect real progress capability and fall back to estimates
- [ ] **Testing**: Add e2e tests for progress accuracy
- [ ] **Analytics**: Track actual vs. estimated progress to calibrate timeouts

---

## References

- [Current Component](../components/ScanProgress.tsx)
- [Current API Wrapper](../lib/api.ts)
- [Batch Scanner Progress](../lib/batchScanner.ts) — Has real progress tracking for batch operations
- [soroban-guard-core](https://github.com/Veritas-Vaults-Network/Soroban-Guard-Core) — Needs HTTP wrapper
