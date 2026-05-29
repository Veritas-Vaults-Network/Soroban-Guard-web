export interface FeaturedContract {
  name: string
  contractId: string
  network: 'testnet'
  description: string
}

export const FEATURED_CONTRACTS: FeaturedContract[] = [
  {
    name: 'Soroban Examples — Token',
    contractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    network: 'testnet',
    description: 'Standard fungible token contract from the Soroban examples repo.',
  },
  {
    name: 'Soroban Examples — Atomic Swap',
    contractId: 'CBQHNAXSI55GX2GN6D67GK7BHVPSLJUGZQEU7WJ5LKR5PNUCGLIMAO4',
    network: 'testnet',
    description: 'Trustless atomic swap between two Stellar assets.',
  },
  {
    name: 'Soroban Examples — Liquidity Pool',
    contractId: 'CDDKJMTAENCOVJPUWTISOQ23JYSMCLEOKXT7VQPBCEAZYKYNE6CB57XW',
    network: 'testnet',
    description: 'Constant-product AMM liquidity pool on Soroban testnet.',
  },
]
