# Contributing to Soroban Guard Web

## Prerequisites

- Node.js 18+
- npm
- [Freighter](https://freighter.app) browser extension (for wallet features)

## Local Setup

```bash
git clone https://github.com/Veritas-Vaults-Network/Soroban-Guard-web.git
cd Soroban-Guard-web
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
```

`NEXT_PUBLIC_API_URL` should point to a running instance of [soroban-guard-core](https://github.com/Veritas-Vaults-Network/Soroban-Guard-Core).

## Running the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/          # Next.js App Router pages and layouts
components/   # Reusable UI components
lib/          # API client, Stellar/Soroban helpers, wallet integration
types/        # Shared TypeScript types
```

## Linting

```bash
npm run lint
```

Fix any reported issues before opening a PR.

## PR Checklist

- [ ] `npm run lint` passes with no errors
- [ ] `npx tsc --noEmit` passes with no TypeScript errors
- [ ] Include a screenshot for any UI changes

## Sister Repos

- [soroban-guard-core](https://github.com/Veritas-Vaults-Network/Soroban-Guard-Core) — Rust/Axum analysis engine
- [soroban-guard-contracts](https://github.com/Veritas-Vaults-Network/soroban-guard-contracts) — Example contracts for testing
