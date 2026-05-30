 feat/wrap-results-error-boundary
"use client"

import React from 'react'

type Props = {
  children: React.ReactNode
}

type State = {
  hasError: boolean
  error?: Error | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
    this.reset = this.reset.bind(this)
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console for now; replace with monitoring if desired
    // eslint-disable-next-line no-console
    console.error('Uncaught error in component tree:', error, info)
  }

  reset() {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="rounded-lg border p-6 text-center bg-[var(--bg)]">
            <h2 className="mb-2 text-lg font-semibold text-white">Something went wrong</h2>
            <p className="mb-4 text-sm text-slate-400">An unexpected error occurred while rendering this page.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={this.reset}
                className="rounded bg-indigo-600 px-3 py-1 text-sm font-medium text-white"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded border px-3 py-1 text-sm text-slate-200"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children as React.ReactElement

'use client'

import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0a0c0f] px-4 text-center">
        <svg className="h-12 w-12 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-slate-100">Something went wrong</h1>
          <p className="text-sm text-slate-400">An unexpected error occurred. Please reload the page to continue.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Reload page
        </button>
      </div>
    ) main
  }
}
