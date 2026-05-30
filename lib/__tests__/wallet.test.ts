import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { isFreighterInstalled, connectFreighter, getFreighterNetwork, signTransaction } from '../wallet'
import { setupFreighterMock, clearFreighterMock, FreighterMock } from '../__mocks__/freighter'
import { NETWORKS } from '@/types/stellar'

describe('wallet.ts', () => {
  let mockWindow: Window & { freighter?: any }

  beforeEach(() => {
    mockWindow = {} as any
    vi.stubGlobal('window', mockWindow)
  })

  afterEach(() => {
    clearFreighterMock(mockWindow)
    vi.unstubAllGlobals()
  })

  describe('isFreighterInstalled', () => {
    it('returns true when freighter is installed', () => {
      setupFreighterMock(mockWindow)
      expect(isFreighterInstalled()).toBe(true)
    })

    it('returns false when freighter is not installed', () => {
      expect(isFreighterInstalled()).toBe(false)
    })

    it('returns false when window is undefined', () => {
      vi.unstubAllGlobals()
      expect(isFreighterInstalled()).toBe(false)
    })
  })

  describe('connectFreighter', () => {
    it('returns public key when connected', async () => {
      const mock = setupFreighterMock(mockWindow, {
        connected: true,
        publicKey: 'GAXBWN3FBLVMNYG2JPQJUGZQAGQCW6KTHF32M4SWVJQMXLMX3PKFNM'
      })

      const result = await connectFreighter()
      expect(result).toBe('GAXBWN3FBLVMNYG2JPQJUGZQAGQCW6KTHF32M4SWVJQMXLMX3PKFNM')
    })

    it('returns null when not connected', async () => {
      setupFreighterMock(mockWindow, { connected: false })
      const result = await connectFreighter()
      expect(result).toBeNull()
    })

    it('returns null when freighter is not installed', async () => {
      const result = await connectFreighter()
      expect(result).toBeNull()
    })

    it('returns null when freighter throws error', async () => {
      setupFreighterMock(mockWindow, { shouldFail: true })
      const result = await connectFreighter()
      expect(result).toBeNull()
    })

    it('returns null when window is undefined', async () => {
      vi.unstubAllGlobals()
      const result = await connectFreighter()
      expect(result).toBeNull()
    })
  })

  describe('getFreighterNetwork', () => {
    it('returns testnet for testnet network passphrase', async () => {
      setupFreighterMock(mockWindow, {
        networkPassphrase: 'Test SDF Network ; September 2015',
        networkUrl: 'https://horizon-testnet.stellar.org'
      })

      const result = await getFreighterNetwork()
      expect(result).toEqual(NETWORKS.testnet)
    })

    it('returns public network for public passphrase', async () => {
      setupFreighterMock(mockWindow, {
        networkPassphrase: 'Public Global Stellar Network ; September 2015',
        networkUrl: 'https://horizon.stellar.org'
      })

      const result = await getFreighterNetwork()
      expect(result?.networkPassphrase).toBe('Public Global Stellar Network ; September 2015')
    })

    it('returns null when freighter is not installed', async () => {
      const result = await getFreighterNetwork()
      expect(result).toBeNull()
    })

    it('returns testnet as fallback for unknown passphrase', async () => {
      setupFreighterMock(mockWindow, {
        networkPassphrase: 'Unknown Network'
      })

      const result = await getFreighterNetwork()
      expect(result).toEqual(NETWORKS.testnet)
    })

    it('returns null when freighter throws error', async () => {
      setupFreighterMock(mockWindow, { shouldFail: true })
      const result = await getFreighterNetwork()
      expect(result).toBeNull()
    })
  })

  describe('signTransaction', () => {
    it('signs transaction successfully', async () => {
      const mock = setupFreighterMock(mockWindow)
      const xdr = 'AAAAAgAAAABqy0OPCKPVSIuWWe8cXYWHQ79qjcMxEz/KQBNOQc8='

      const result = await signTransaction(xdr, NETWORKS.testnet)

      expect(result).toBeDefined()
      expect(result).toContain('signed_')
    })

    it('returns null when freighter is not installed', async () => {
      const xdr = 'AAAAAgAAAABqy0OPCKPVSIuWWe8cXYWHQ79qjcMxEz/KQBNOQc8='
      const result = await signTransaction(xdr, NETWORKS.testnet)
      expect(result).toBeNull()
    })

    it('returns null when transaction signing fails', async () => {
      setupFreighterMock(mockWindow, { shouldFail: true })
      const xdr = 'AAAAAgAAAABqy0OPCKPVSIuWWe8cXYWHQ79qjcMxEz/KQBNOQc8='

      const result = await signTransaction(xdr, NETWORKS.testnet)
      expect(result).toBeNull()
    })

    it('passes network passphrase to freighter', async () => {
      const mock = setupFreighterMock(mockWindow)
      const xdr = 'AAAAAgAAAABqy0OPCKPVSIuWWe8cXYWHQ79qjcMxEz/KQBNOQc8='
      const spySigns = vi.spyOn(mock, 'signTransaction')

      await signTransaction(xdr, NETWORKS.testnet)

      expect(spySigns).toHaveBeenCalledWith(xdr, {
        networkPassphrase: NETWORKS.testnet.networkPassphrase
      })
    })

    it('returns null when window is undefined', async () => {
      vi.unstubAllGlobals()
      const xdr = 'AAAAAgAAAABqy0OPCKPVSIuWWe8cXYWHQ79qjcMxEz/KQBNOQc8='
      const result = await signTransaction(xdr, NETWORKS.testnet)
      expect(result).toBeNull()
    })
  })
})
