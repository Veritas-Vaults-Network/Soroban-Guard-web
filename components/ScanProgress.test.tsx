import React from 'react'
import { render, screen, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import ScanProgress from './ScanProgress'

describe('ScanProgress', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders nothing when not loading', () => {
    const { container } = render(<ScanProgress loading={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows the first step active immediately on load', () => {
    render(<ScanProgress loading={true} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    // Step 1 (Uploading) should have the spinner svg
    const labels = screen.getAllByText(/Uploading|Parsing|Analyzing|Done/i)
    expect(labels[0]).toHaveClass('text-white')
  })

  it('advances to the next step after 1500ms', () => {
    render(<ScanProgress loading={true} />)
    act(() => { jest.advanceTimersByTime(1500) })
    const labels = screen.getAllByText(/Uploading|Parsing|Analyzing|Done/i)
    // Uploading should now be done (indigo-400)
    expect(labels[0]).toHaveClass('text-indigo-400')
    // Parsing should be active (white)
    expect(labels[1]).toHaveClass('text-white')
  })

  it('shows per-step elapsed duration for a completed step', () => {
    render(<ScanProgress loading={true} />)
    // Advance past step 0→1 transition
    act(() => { jest.advanceTimersByTime(1600) })
    // The completed "Uploading" step should show a duration like "— 1.5s"
    expect(screen.getByText(/—\s*\d+\.\d+s/)).toBeInTheDocument()
  })

  it('shows live elapsed time for the active step', () => {
    render(<ScanProgress loading={true} />)
    // Tick the interval a bit within step 0
    act(() => { jest.advanceTimersByTime(900) })
    // Should show something like "0.9s" next to the active step label
    expect(screen.getByText(/0\.\d+s/)).toBeInTheDocument()
  })

  it('renders batch indicator when batchTotal > 1', () => {
    render(<ScanProgress loading={true} batchCurrent={2} batchTotal={5} />)
    expect(screen.getByText(/contracts scanned/i)).toBeInTheDocument()
    // batch numbers appear in the indigo spans inside the batch indicator paragraph
    const batchPara = screen.getByText(/contracts scanned/i).closest('p')!
    expect(batchPara).toHaveTextContent('2')
    expect(batchPara).toHaveTextContent('5')
  })

  it('cleans up timers on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(globalThis, 'clearTimeout')
    const clearIntervalSpy = jest.spyOn(globalThis, 'clearInterval')
    const { unmount } = render(<ScanProgress loading={true} />)
    unmount()
    expect(clearTimeoutSpy).toHaveBeenCalled()
    expect(clearIntervalSpy).toHaveBeenCalled()
  })
})
