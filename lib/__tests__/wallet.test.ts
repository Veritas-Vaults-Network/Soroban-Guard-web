import { describe, it, expect, vi, beforeEach } from 'vitest'
import { normalizeNetworkName } from '@/lib/WalletContext'
import { fetchContractsByAccount } from '@/lib/stellar'
import { NETWORKS } from '@/types/stellar'

describe('Wallet helpers and normalizeNetworkName', () => {
  it('normalizes mainnet network names and passphrases', () => {
    expect(normalizeNetworkName('PUBLIC')).toBe('mainnet')
    expect(normalizeNetworkName('mainnet')).toBe('mainnet')
    expect(normalizeNetworkName(undefined, 'Public Global Stellar Network ; September 2015')).toBe('mainnet')
  })

  it('normalizes testnet network names and passphrases', () => {
    expect(normalizeNetworkName('TESTNET')).toBe('testnet')
    expect(normalizeNetworkName('testnet')).toBe('testnet')
    expect(normalizeNetworkName(undefined, 'Test SDF Network ; September 2015')).toBe('testnet')
  })

  it('normalizes futurenet network names and passphrases', () => {
    expect(normalizeNetworkName('FUTURENET')).toBe('futurenet')
    expect(normalizeNetworkName('futurenet')).toBe('futurenet')
    expect(normalizeNetworkName(undefined, 'Test SDF Future Network ; October 2022')).toBe('futurenet')
  })

  it('handles unknown or empty inputs', () => {
    expect(normalizeNetworkName(null, null)).toBe('unknown')
    expect(normalizeNetworkName('', '')).toBe('unknown')
  })
})

describe('Read-Only Deployed Contract Fetching', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('fetches deployed contracts using Horizon REST API without requesting signatures', async () => {
    const publicKey = 'GBRPGEPDTAFBHESHIJZG56KZEXIUKERKWDNSQNUX47DILGAQD6C5NX3V'
    const contractId = 'CA3D5AJVU6KMZFPNDSBAZZVVW5FBKV3EE7UXMPEGCFDGBZJAS75BAOWM'
    const encodedContract = btoa(contractId)

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        _embedded: {
          records: [{ key: 'contract_0', value: encodedContract }],
        },
      }),
    } as Response)

    const contracts = await fetchContractsByAccount(publicKey, NETWORKS.testnet)

    expect(fetch).toHaveBeenCalledWith(
      `${NETWORKS.testnet.horizonUrl}/accounts/${publicKey}/data`,
      { headers: { Accept: 'application/json' } }
    )
    expect(contracts).toEqual([contractId])
  })

  it('returns empty array if account is invalid or response is not ok', async () => {
    const invalidKey = 'INVALID'
    const contracts = await fetchContractsByAccount(invalidKey, NETWORKS.testnet)
    expect(contracts).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  })
})
