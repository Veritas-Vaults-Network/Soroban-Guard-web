import type { Finding } from '@/types/findings'

export interface MockFreighterAPI {
  isConnected: () => Promise<boolean>
  getPublicKey: () => Promise<string>
  getNetwork: () => Promise<string>
  getNetworkDetails: () => Promise<{ networkPassphrase: string; networkUrl: string }>
  signTransaction: (xdr: string, opts?: { network?: string; networkPassphrase?: string }) => Promise<string>
}

export interface MockFreighterOptions {
  connected?: boolean
  publicKey?: string
  network?: string
  networkPassphrase?: string
  networkUrl?: string
  shouldFail?: boolean
}

export class FreighterMock implements MockFreighterAPI {
  private connected: boolean
  private publicKey: string
  private network: string
  private networkPassphrase: string
  private networkUrl: string
  private shouldFail: boolean

  constructor(options: MockFreighterOptions = {}) {
    this.connected = options.connected ?? true
    this.publicKey = options.publicKey ?? 'GAXBWN3FBLVMNYG2JPQJUGZQAGQCW6KTHF32M4SWVJQMXLMX3PKFNM'
    this.network = options.network ?? 'testnet'
    this.networkPassphrase = options.networkPassphrase ?? 'Test SDF Network ; September 2015'
    this.networkUrl = options.networkUrl ?? 'https://horizon-testnet.stellar.org'
    this.shouldFail = options.shouldFail ?? false
  }

  async isConnected(): Promise<boolean> {
    if (this.shouldFail) throw new Error('Freighter mock failed')
    return this.connected
  }

  async getPublicKey(): Promise<string> {
    if (this.shouldFail) throw new Error('Freighter mock failed')
    return this.publicKey
  }

  async getNetwork(): Promise<string> {
    if (this.shouldFail) throw new Error('Freighter mock failed')
    return this.network
  }

  async getNetworkDetails(): Promise<{ networkPassphrase: string; networkUrl: string }> {
    if (this.shouldFail) throw new Error('Freighter mock failed')
    return {
      networkPassphrase: this.networkPassphrase,
      networkUrl: this.networkUrl
    }
  }

  async signTransaction(
    xdr: string,
    opts?: { network?: string; networkPassphrase?: string }
  ): Promise<string> {
    if (this.shouldFail) throw new Error('Freighter mock failed')
    if (!xdr || xdr.length === 0) throw new Error('Invalid XDR')
    return `signed_${xdr}_${opts?.networkPassphrase || this.networkPassphrase}`
  }

  setConnected(connected: boolean) {
    this.connected = connected
  }

  setPublicKey(publicKey: string) {
    this.publicKey = publicKey
  }

  setNetworkPassphrase(passphrase: string) {
    this.networkPassphrase = passphrase
  }

  setShouldFail(shouldFail: boolean) {
    this.shouldFail = shouldFail
  }
}

export function setupFreighterMock(window: Window & { freighter?: MockFreighterAPI }, options?: MockFreighterOptions) {
  const mock = new FreighterMock(options)
  window.freighter = mock
  return mock
}

export function clearFreighterMock(window: Window & { freighter?: MockFreighterAPI }) {
  delete window.freighter
}
