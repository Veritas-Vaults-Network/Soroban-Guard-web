import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import ThemeToggle from '@/components/ThemeToggle'

function setMatchMedia(matchesDark: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' ? matchesDark : false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

describe('ThemeToggle', () => {
  it('uses stored dark theme when localStorage has dark', () => {
    localStorage.setItem('sg_theme', 'dark')
    setMatchMedia(false)

    render(<ThemeToggle />)

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Switch to light mode'
    )
  })

  it('uses stored light theme when localStorage has light', () => {
    localStorage.setItem('sg_theme', 'light')
    setMatchMedia(true)

    render(<ThemeToggle />)

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Switch to dark mode'
    )
  })

  it('falls back to dark when no stored value and OS prefers dark', () => {
    setMatchMedia(true)

    render(<ThemeToggle />)

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Switch to light mode'
    )
  })

  it('falls back to light when no stored value and OS prefers light', () => {
    setMatchMedia(false)

    render(<ThemeToggle />)

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Switch to dark mode'
    )
  })

  it('toggles theme and persists choice to localStorage', async () => {
    localStorage.setItem('sg_theme', 'dark')
    setMatchMedia(false)

    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(screen.getByRole('button'))

    expect(localStorage.getItem('sg_theme')).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Switch to dark mode'
    )
  })

  it('explicit stored choice overrides OS preference', () => {
    localStorage.setItem('sg_theme', 'light')
    setMatchMedia(true)

    render(<ThemeToggle />)

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})
