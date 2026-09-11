# expence-ui

Next.js 15 (App Router) UI for Expence, a local single-user personal finance tracker.

## Prerequisites

- Node 22+
- `expence-api` running on `http://localhost:8080`

## Setup

```bash
npm install
```

`.env.local` holds `NEXT_PUBLIC_API_URL=http://localhost:8080`. It is gitignored;
recreate it if missing.

## Commands

```bash
npm run dev     # http://localhost:3000
npm run build
npm test        # vitest run
npm run lint
```

## Layout

- `app/` — routes; `layout.tsx` is the nav shell, `providers.tsx` the TanStack Query provider.
- `lib/types.ts` — types mirroring the API DTOs.
- `lib/api/client.ts` — `apiFetch` wrapper; parses `{message, errors?}` into `ApiError`.
- `lib/format.ts` — `formatMoney`, `formatDate`.
