import { describe, it, expect, vi, beforeEach } from 'vitest'
import { postToTelegram } from '../lib/telegram'
import type { Finding } from '../types/findings'

const makeFindings = (): Finding[] => [
  {
    check_name: 'reentrancy',
    severity: 'Critical',
    file_path: 'src/lib.rs',
    line: 10,
    function_name: 'transfer',
    description: 'Reentrancy risk',
  },
  {
    check_name: 'overflow',
    severity: 'High',
    file_path: 'src/lib.rs',
    line: 20,
    function_name: 'mint',
    description: 'Integer overflow',
  },
  {
    check_name: 'underflow',
    severity: 'Medium',
    file_path: 'src/lib.rs',
    line: 30,
    function_name: 'burn',
    description: 'Integer underflow',
  },
]

beforeEach(() => {
  vi.resetAllMocks()
})

describe('postToTelegram', () => {
  it('calls the Telegram sendMessage endpoint with correct URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await postToTelegram('bot123', '-100chat', makeFindings(), 'ipfs://Qm123')

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.telegram.org/botbot123/sendMessage',
    )
  })

  it('sends chat_id and parse_mode in the request body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await postToTelegram('tok', 'chat42', makeFindings(), 'source')

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.chat_id).toBe('chat42')
    expect(body.parse_mode).toBe('Markdown')
  })

  it('includes severity counts in the message text', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await postToTelegram('tok', 'chat', makeFindings(), 'source')

    const { text } = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(text).toContain('Critical')
    expect(text).toContain('High')
    expect(text).toContain('Medium')
  })

  it('includes top findings block when findings are non-empty', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await postToTelegram('tok', 'chat', makeFindings(), 'source')

    const { text } = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(text).toContain('Top findings')
    expect(text).toContain('reentrancy')
  })

  it('omits top findings block when findings array is empty', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await postToTelegram('tok', 'chat', [], 'source')

    const { text } = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(text).not.toContain('Top findings')
  })

  it('throws when Telegram API responds with non-ok status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      postToTelegram('tok', 'chat', makeFindings(), 'source'),
    ).rejects.toThrow('Telegram API error 400')
  })

  it('includes the source in the message', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await postToTelegram('tok', 'chat', makeFindings(), 'ipfs://QmABC')

    const { text } = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(text).toContain('ipfs://QmABC')
  })
})
