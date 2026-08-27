import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import WalletConnect from '../WalletConnect'
import { WalletProvider } from '@/lib/WalletContext'
import { setupFreighterMock, clearFreighterMock, type MockFreighterAPI } from '@/lib/__mocks__/freighter'
import { NETWORKS } from '@/types/stellar'
import * as freighterApi from '@stellar/freighter-api'

vi.mock(import('@stellar/freighter-api'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    isConnected: vi.fn().mockResolvedValue({ isConnected: true }),
  }
})

type MockWindow = Window & { freighter?: MockFreighterAPI }

describe('WalletConnect Component', () => {
  beforeEach(() => {
    clearFreighterMock(window as unknown as MockWindow)
    vi.mocked(freighterApi.isConnected).mockResolvedValue({ isConnected: true })

    // Mock global fetch for Horizon requests
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ _embedded: { records: [] } }),
    })
  })

  it('handles Freighter not installed cleanly with an install link without throwing', async () => {
    // Mock window without freighter and isConnected returning false
    delete (window as unknown as { freighter?: unknown }).freighter
    vi.mocked(freighterApi.isConnected).mockResolvedValue({ isConnected: false })

    render(
      <WalletProvider initialNetwork={NETWORKS.testnet}>
        <WalletConnect />
      </WalletProvider>
    )

    const installLink = await screen.findByRole('link', { name: /install freighter/i })
    expect(installLink).toBeInTheDocument()
    expect(installLink).toHaveAttribute('href', 'https://www.freighter.app/')
  })

  it('handles user rejection gracefully without throwing unhandled errors', async () => {
    const mock = setupFreighterMock(window as unknown as MockWindow)
    mock.getPublicKey = vi.fn().mockRejectedValue(new Error('User declined access'))

    render(
      <WalletProvider initialNetwork={NETWORKS.testnet}>
        <WalletConnect />
      </WalletProvider>
    )

    const connectButton = screen.getByRole('button', { name: /connect freighter/i })
    fireEvent.click(connectButton)

    await waitFor(() => {
      expect(screen.getByText(/connection request was declined in freighter/i)).toBeInTheDocument()
    })

    expect(mock.getPublicKey).toHaveBeenCalled()
  })

  it('connects successfully and displays truncated public key', async () => {
    setupFreighterMock(window as unknown as MockWindow, {
      publicKey: 'GBRPGEPDTAFBHESHIJZG56KZEXIUKERKWDNSQNUX47DILGAQD6C5NX3V',
      network: 'testnet',
    })

    render(
      <WalletProvider initialNetwork={NETWORKS.testnet}>
        <WalletConnect />
      </WalletProvider>
    )

    const connectButton = screen.getByRole('button', { name: /connect freighter/i })
    fireEvent.click(connectButton)

    await waitFor(() => {
      expect(screen.getByText(/connected: GBRP...NX3V/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument()
    })
  })

  it('detects and displays network mismatch when wallet network differs from scan network', async () => {
    setupFreighterMock(window as unknown as MockWindow, {
      publicKey: 'GBRPGEPDTAFBHESHIJZG56KZEXIUKERKWDNSQNUX47DILGAQD6C5NX3V',
      network: 'PUBLIC',
      networkPassphrase: 'Public Global Stellar Network ; September 2015',
    })

    render(
      <WalletProvider initialNetwork={NETWORKS.testnet}>
        <WalletConnect />
      </WalletProvider>
    )

    const connectButton = screen.getByRole('button', { name: /connect freighter/i })
    fireEvent.click(connectButton)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/network mismatch/i)).toBeInTheDocument()
    })
  })

  it('never requests transaction signature for reading account contracts', async () => {
    const mock = setupFreighterMock(window as unknown as MockWindow)
    const signSpy = vi.spyOn(mock, 'signTransaction')

    render(
      <WalletProvider initialNetwork={NETWORKS.testnet}>
        <WalletConnect />
      </WalletProvider>
    )

    const connectButton = screen.getByRole('button', { name: /connect freighter/i })
    fireEvent.click(connectButton)

    await waitFor(() => {
      expect(screen.getByText(/connected: GBRP...NX3V/i)).toBeInTheDocument()
    })

    expect(signSpy).not.toHaveBeenCalled()
  })
})
