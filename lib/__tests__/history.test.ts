import { addScanRecord, getScanHistory, getById, clearScanHistory, getAllScanHistory } from '../history'
import { CONTRACT_SCAN_RECORD_SCHEMA_VERSION } from '@/types/stellar'

const STORAGE_KEY = 'sg_scan_history'

const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value }),
    removeItem: jest.fn((key: string) => { delete store[key] }),
    clear: () => { store = {} },
    _store: () => store,
  }
})()

beforeAll(() => {
  Object.defineProperty(global, 'localStorage', { value: mockLocalStorage, writable: true, configurable: true })
})

beforeEach(() => {
  mockLocalStorage.clear()
  jest.clearAllMocks()
})

const sampleFindings = [
  { severity: 'High', check_name: 'reentrancy', description: 'desc', function_name: 'fn', file_path: 'src/lib.rs', line: 1 },
  { severity: 'Medium', check_name: 'overflow', description: 'desc', function_name: 'fn', file_path: 'src/lib.rs', line: 2 },
  { severity: 'Low', check_name: 'unused', description: 'desc', function_name: 'fn', file_path: 'src/lib.rs', line: 3 },
]

describe('addScanRecord', () => {
  it('stores a new record in localStorage', () => {
    addScanRecord('GPUBKEY', 'CONTRACT1', 'testnet', sampleFindings)
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String))
    const stored = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])
    expect(stored).toHaveLength(1)
    expect(stored[0].contractId).toBe('CONTRACT1')
    expect(stored[0].publicKey).toBe('GPUBKEY')
    expect(stored[0].network).toBe('testnet')
  })

  it('correctly counts severity totals', () => {
    addScanRecord('PK', 'CTR', 'mainnet', sampleFindings)
    const stored = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])
    expect(stored[0].highCount).toBe(1)
    expect(stored[0].mediumCount).toBe(1)
    expect(stored[0].lowCount).toBe(1)
    expect(stored[0].findingCount).toBe(3)
  })

  it('stores optional score', () => {
    addScanRecord('PK', 'CTR', 'mainnet', [], 85)
    const stored = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])
    expect(stored[0].score).toBe(85)
  })

  it('prepends new records (most recent first)', () => {
    addScanRecord('PK', 'CTR1', 'mainnet', [])
    addScanRecord('PK', 'CTR2', 'mainnet', [])
    const stored = JSON.parse(mockLocalStorage.setItem.mock.calls[1][1])
    expect(stored[0].contractId).toBe('CTR2')
    expect(stored[1].contractId).toBe('CTR1')
  })

  it('caps history at 50 records', () => {
    for (let i = 0; i < 55; i++) {
      addScanRecord('PK', `CTR${i}`, 'testnet', [])
    }
    const lastCall = mockLocalStorage.setItem.mock.calls.at(-1)![1]
    expect(JSON.parse(lastCall)).toHaveLength(50)
  })

  it('writes new records with schemaVersion', () => {
    addScanRecord('PK', 'CTR', 'testnet', [])
    const stored = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])
    expect(stored[0].schemaVersion).toBe(CONTRACT_SCAN_RECORD_SCHEMA_VERSION)
  })
})

describe('getScanHistory', () => {
  it('returns records filtered by publicKey', () => {
    addScanRecord('ALICE', 'CTR1', 'testnet', [])
    addScanRecord('BOB', 'CTR2', 'testnet', [])
    const result = getScanHistory('ALICE')
    expect(result).toHaveLength(1)
    expect(result[0].contractId).toBe('CTR1')
  })

  it('returns empty array when no match', () => {
    expect(getScanHistory('NOBODY')).toEqual([])
  })

  it('returns empty array when localStorage is empty', () => {
    expect(getScanHistory('PK')).toEqual([])
  })
})

describe('getById', () => {
  it('returns the record with the matching id', () => {
    addScanRecord('PK', 'CTR1', 'testnet', [])
    const stored = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])
    const id = stored[0].id
    const result = getById(id)
    expect(result).not.toBeNull()
    expect(result!.contractId).toBe('CTR1')
  })

  it('returns null when id is not found', () => {
    expect(getById('nonexistent-id')).toBeNull()
  })

  it('returns null when localStorage is empty', () => {
    expect(getById('any-id')).toBeNull()
  })
})

describe('clearScanHistory', () => {
  it('removes the storage key', () => {
    addScanRecord('PK', 'CTR1', 'testnet', [])
    clearScanHistory()
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY)
  })

  it('leaves history empty after clearing', () => {
    addScanRecord('PK', 'CTR1', 'testnet', [])
    clearScanHistory()
    expect(getScanHistory('PK')).toEqual([])
  })
})

describe('schema migration', () => {
  function injectLegacyRecords(records: unknown[]) {
    mockLocalStorage._store()[STORAGE_KEY] = JSON.stringify(records)
  }

  it('migrates version-0 (unversioned) records on read', () => {
    const legacy = {
      id: '1',
      publicKey: 'PK',
      contractId: 'CTR',
      network: 'testnet',
      scannedAt: '2024-01-01T00:00:00.000Z',
      findingCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      findings: [],
    }
    injectLegacyRecords([legacy])

    const result = getAllScanHistory()
    expect(result).toHaveLength(1)
    expect(result[0].schemaVersion).toBe(CONTRACT_SCAN_RECORD_SCHEMA_VERSION)
    expect(result[0].contractId).toBe('CTR')
  })

  it('preserves existing schemaVersion on already-migrated records', () => {
    const migrated = {
      schemaVersion: CONTRACT_SCAN_RECORD_SCHEMA_VERSION,
      id: '1',
      publicKey: 'PK',
      contractId: 'CTR',
      network: 'testnet',
      scannedAt: '2024-01-01T00:00:00.000Z',
      findingCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      findings: [],
    }
    injectLegacyRecords([migrated])

    const result = getAllScanHistory()
    expect(result[0].schemaVersion).toBe(CONTRACT_SCAN_RECORD_SCHEMA_VERSION)
  })

  it('silently drops non-object entries', () => {
    injectLegacyRecords([null, 42, 'string', { id: '1', publicKey: 'PK', contractId: 'CTR', network: 'testnet', scannedAt: '', findingCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, findings: [] }])

    const result = getAllScanHistory()
    expect(result).toHaveLength(1)
  })

  it('returns empty array for corrupted JSON', () => {
    mockLocalStorage._store()[STORAGE_KEY] = 'not-json'
    expect(getAllScanHistory()).toEqual([])
  })

  it('migrates records accessed via getById', () => {
    const legacy = {
      id: '42',
      publicKey: 'PK',
      contractId: 'CTR',
      network: 'testnet',
      scannedAt: '2024-01-01T00:00:00.000Z',
      findingCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      findings: [],
    }
    injectLegacyRecords([legacy])

    const result = getById('42')
    expect(result).not.toBeNull()
    expect(result!.schemaVersion).toBe(CONTRACT_SCAN_RECORD_SCHEMA_VERSION)
  })
})
