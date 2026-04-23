// Stellar / Soroban blockchain types

export interface StellarNetwork {
  name: 'mainnet' | 'testnet' | 'futurenet'
  networkPassphrase: string
  horizonUrl: string
  sorobanRpcUrl: string
}

export const NETWORKS: Record<string, StellarNetwork> = {
  mainnet: {
    name: 'mainnet',
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
    horizonUrl: 'https://horizon.stellar.org',
    sorobanRpcUrl: 'https://mainnet.stellar.validationcloud.io/v1/soroban/rpc',
  },
  testnet: {
    name: 'testnet',
    networkPassphrase: 'Test SDF Network ; September 2015',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  },
  futurenet: {
    name: 'futurenet',
    networkPassphrase: 'Test SDF Future Network ; October 2022',
    horizonUrl: 'https://horizon-futurenet.stellar.org',
    sorobanRpcUrl: 'https://rpc-futurenet.stellar.org',
  },
}

export interface WalletState {
  connected: boolean
  publicKey: string | null
  network: StellarNetwork
}

export interface ContractScanRecord {
  publicKey: string
  contractId: string
  network: string
  scannedAt: string
  findingCount: number
  highCount: number
  mediumCount: number
  lowCount: number
}

// Soroban contract metadata returned from Horizon
export interface ContractInfo {
  contractId: string
  wasmHash: string
  network: string
  createdAt?: string
}
