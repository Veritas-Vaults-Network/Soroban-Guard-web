# Contributing to Soroban Guard Web

This repo is the frontend dashboard for Soroban Guard — a smart contract security scanner for Soroban contracts on Stellar.

## Prerequisites

- Node.js 18 or newer
- npm
- [Freighter](https://freighter.app) browser extension (recommended for wallet features)
- A code editor such as VS Code

## Local setup

```bash
git clone https://github.com/Veritas-Vaults-Network/Soroban-Guard-web.git
cd Soroban-Guard-web
npm install
```

Create an environment file for local API access:

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
```

`NEXT_PUBLIC_API_URL` should point to a running `soroban-guard-core` instance.

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

- [soroban-guard-core](https://github.com/Veritas-Vaults-Network/Soroban-Guard-Core) — Rust/Axum analysis engine
- [soroban-guard-contracts](https://github.com/Veritas-Vaults-Network/soroban-guard-contracts) — Example Soroban contracts for testing
