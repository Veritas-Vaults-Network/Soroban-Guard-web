import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import ApiDocsPage from './page'

describe('ApiDocsPage smoke test', () => {
  beforeEach(() => {
    render(<ApiDocsPage />)
  })

  it('renders the page heading', () => {
    expect(screen.getByRole('heading', { name: /api reference/i })).toBeInTheDocument()
  })

  it('renders the Base URL section', () => {
    expect(screen.getByRole('heading', { name: /base url/i })).toBeInTheDocument()
  })

  it('renders the Authentication section', () => {
    expect(screen.getByRole('heading', { name: /authentication/i })).toBeInTheDocument()
  })

  it('renders the POST /scan section', () => {
    expect(screen.getByRole('heading', { name: /post \/scan/i })).toBeInTheDocument()
  })

  it('renders the Error responses section', () => {
    expect(screen.getByRole('heading', { name: /error responses/i })).toBeInTheDocument()
  })

  it('renders the Rate limits section', () => {
    expect(screen.getByRole('heading', { name: /rate limits/i })).toBeInTheDocument()
  })

  it('renders the CI Webhook section', () => {
    expect(screen.getByRole('heading', { name: /ci webhook/i })).toBeInTheDocument()
  })

  it('renders the back link', () => {
    expect(screen.getByRole('link', { name: /back to soroban guard/i })).toBeInTheDocument()
  })
})
