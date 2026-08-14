# Contributing to Soroban Guard Web

This repo is the frontend dashboard for Soroban Guard — a smart contract security scanner for Soroban contracts on Stellar.

## Prerequisites

- Node.js 18 or newer
- npm
- [Freighter](https://freighter.app) browser extension (recommended for wallet features)
- A code editor such as VS Code

## Local setup

```bash
git clone https://github.com/SorobanGuard/Guard-Web.git
cd Guard-Web
npm install
```

Create an environment file for local API access:

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
```

`NEXT_PUBLIC_API_URL` should point to a running instance of the Soroban Guard scan API.

## Feature Flags

Some in-progress features are hidden behind feature flags and default to being turned off. To enable them locally, add the corresponding environment variables to your `.env.local` file:

```bash
NEXT_PUBLIC_FEATURE_ATTESTATION=true
NEXT_PUBLIC_FEATURE_I18N=true
```

## Running the app

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `app/` — Next.js App Router pages, layouts, and routes
- `components/` — reusable UI components
- `lib/` — client-side helpers, API wrappers, wallet integration, and utilities
- `types/` — shared TypeScript definitions

## Linting and type checking

Run the linter:

```bash
npm run lint
```

Run TypeScript type checking:

```bash
npx tsc --noEmit
```

## PR checklist

Before creating a pull request, make sure to:

- [ ] Run `npm run lint` and fix any issues
- [ ] Run `npx tsc --noEmit` and fix any TypeScript errors
- [ ] Add or update tests for any behavior changes
- [ ] Include a screenshot or recording for UI updates
- [ ] Keep your PR focused and document any non-obvious changes

## Sister repos

- [Guard-CLI](https://github.com/SorobanGuard/Guard-CLI) — Rust static-analysis CLI for Soroban contracts
- [Guard---Contracts](https://github.com/SorobanGuard/Guard---Contracts) — Example Soroban contracts for testing
