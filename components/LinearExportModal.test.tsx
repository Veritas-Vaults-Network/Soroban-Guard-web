/**
 * @jest-environment jest-environment-jsdom
 *
 * Focus-restoration tests for useFocusTrap and LinearExportModal.
 * Runs under jest/ts-jest (same runner as __tests__/*.test.ts).
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import LinearExportModal from './LinearExportModal'
import type { Finding } from '@/types/findings'

jest.mock('@/lib/linear', () => ({
  createLinearIssue: jest.fn(),
}))

const findings: Finding[] = [
  {
    check_name: 'unchecked-auth',
    severity: 'High',
    file_path: 'src/lib.rs',
    line: 1,
    function_name: 'transfer',
    description: 'Missing auth check.',
  },
]

describe('LinearExportModal — focus management', () => {
  let triggerButton: HTMLButtonElement
  let onClose: jest.Mock

  beforeEach(() => {
    onClose = jest.fn()
    triggerButton = document.createElement('button')
    triggerButton.textContent = 'Open modal'
    document.body.appendChild(triggerButton)
    triggerButton.focus()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('returns focus to the trigger button after the modal unmounts (closes)', () => {
    expect(document.activeElement).toBe(triggerButton)

    const { unmount } = render(
      React.createElement(LinearExportModal, { findings, onClose }),
    )

    // Modal should have stolen focus from the trigger
    expect(document.activeElement).not.toBe(triggerButton)

    // Unmounting simulates close — useFocusTrap cleanup restores focus
    unmount()

    expect(document.activeElement).toBe(triggerButton)
  })

  it('calls onClose on Escape key', () => {
    render(React.createElement(LinearExportModal, { findings, onClose }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
