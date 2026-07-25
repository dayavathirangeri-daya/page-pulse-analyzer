# Page Pulse

A production-quality URL analyzer that fetches any webpage and returns SEO + performance metrics — built as a Software Development Internship Assessment for Digital Heroes.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/page-pulse run dev` — run the frontend (uses `PORT` + `BASE_PATH` env from workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/api-server run test` — run Jest tests (20 tests)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend:** React + Vite, Tailwind CSS v4, framer-motion, next-themes (dark mode), wouter routing
- **Backend:** Express 5, Axios (HTTP fetcher), Cheerio (HTML parser)
- **Validation:** Zod (`zod/v4`), drizzle-zod
- **API codegen:** Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- **Testing:** Jest 29 + ts-jest (CJS mode) — 20 unit tests for the analyze service
- **Build:** esbuild (CJS bundle for API server)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI 3.1 spec (source of truth for all API contracts)
- `artifacts/api-server/src/services/analyzeService.ts` — core business logic (fetch + Cheerio parse)
- `artifacts/api-server/src/controllers/analyzeController.ts` — HTTP request/response layer
- `artifacts/api-server/src/routes/analyze.ts` — POST /analyze route
- `artifacts/api-server/src/__tests__/analyzeService.test.ts` — Jest unit tests
- `artifacts/api-server/jest.config.cjs` — Jest config (CJS mode for ESM+ts-jest compatibility)
- `artifacts/page-pulse/src/` — React frontend (pages, components, theme)

## Architecture decisions

- **OpenAPI-first:** All types flow from `lib/api-spec/openapi.yaml` → codegen → typed React Query hooks + Zod schemas. No hand-written types.
- **MVC on backend:** Routes → Controllers (HTTP) → Services (pure logic). Services never touch `Request`/`Response`.
- **`validateStatus: () => true` + content-type guard:** All HTTP status codes are accepted and returned as data; non-HTML responses (PDFs, JSON APIs) are rejected with 422 before Cheerio parsing.
- **Jest in CJS mode via ts-jest:** The api-server is `"type": "module"` (ESM), but Jest runs tests in CJS mode by overriding the ts-jest `module` setting. This avoids the `--experimental-vm-modules` flag and makes `jest.mock()` work normally.
- **`clearMocks: true` only (not `resetMocks`):** `resetMocks` wipes `mockImplementation`, which breaks the `axios.isAxiosError` setup. Use `clearMocks` to clear call history only.

## Product

Page Pulse takes any public URL, fetches the page with Axios, parses the HTML with Cheerio, and returns: HTTP status, response time, page title, meta description, H1 count, images missing alt text, and approximate word count. The frontend shows a dark-mode-native dashboard with animated metric cards.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before touching frontend or backend code.
- Test files are excluded from the main `tsconfig.json` (`exclude: ["src/__tests__"]`) — they're compiled by ts-jest only.
- `@workspace/db` is in api-server dependencies but NOT imported in the analyze code — the app is stateless and needs no database.
- The jest config lives at `artifacts/api-server/jest.config.cjs` (`.cjs` extension so Node treats it as CommonJS even in an ESM package).

## Pointers

- See `README.md` for full project overview, API docs, deployment steps (Render + Vercel), folder structure, design decisions, and future improvements.
- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
