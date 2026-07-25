# 🔍 Page Pulse

> A production-ready URL analyzer that delivers instant SEO and performance insights — built as a Software Development Internship Assessment for Digital Heroes.

[![Built with Express](https://img.shields.io/badge/Backend-Express%205-blue)](https://expressjs.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](#)

---

## 📋 Project Overview

**Page Pulse** takes any public URL, fetches the page, and returns a rich set of metrics useful for SEO auditing, performance benchmarking, and web health checks.

| Metric | Description |
|---|---|
| HTTP Status | Response status code (200, 301, 404, etc.) |
| Response Time | Total round-trip time in milliseconds |
| Page Title | Contents of the `<title>` tag |
| Meta Description | `<meta name="description">` content |
| H1 Count | Number of `<h1>` heading elements |
| Images Missing Alt | Count of `<img>` tags without an `alt` attribute |
| Word Count | Approximate number of visible words on the page |

---

## 🏗️ Architecture

```
page-pulse/
├── artifacts/
│   ├── api-server/                  # Node.js + Express backend
│   │   └── src/
│   │       ├── services/
│   │       │   └── analyzeService.ts    # Business logic (fetch + parse)
│   │       ├── controllers/
│   │       │   └── analyzeController.ts # HTTP request/response handling
│   │       ├── routes/
│   │       │   ├── index.ts             # Route aggregator
│   │       │   ├── analyze.ts           # POST /analyze route
│   │       │   └── health.ts            # GET /healthz route
│   │       ├── lib/
│   │       │   └── logger.ts            # Pino structured logger
│   │       ├── app.ts                   # Express app (middleware + routing)
│   │       └── __tests__/
│   │           └── analyzeService.test.ts  # Jest unit tests
│   │
│   └── page-pulse/                  # React + Vite frontend
│       └── src/
│           ├── pages/               # Route-level page components
│           ├── components/          # Reusable UI components
│           └── index.css            # Tailwind + theme tokens
│
├── lib/
│   ├── api-spec/
│   │   └── openapi.yaml             # OpenAPI 3.1 contract (source of truth)
│   ├── api-client-react/            # Generated React Query hooks
│   └── api-zod/                     # Generated Zod validation schemas
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9 (`npm install -g pnpm`)

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/page-pulse.git
cd page-pulse

# Install all workspace dependencies
pnpm install

# Regenerate API client from the OpenAPI spec (optional, already committed)
pnpm --filter @workspace/api-spec run codegen
```

### Running Locally

**Backend** (Express API on port 5000):
```bash
pnpm --filter @workspace/api-server run dev
```

**Frontend** (Vite dev server):
```bash
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/page-pulse run dev
```

Open **http://localhost:3000** in your browser.

### Running Tests

```bash
# Unit tests for the analyze service
pnpm --filter @workspace/api-server run test

# Typecheck all packages
pnpm run typecheck
```

---

## 🔌 API Documentation

### Base URL
- **Local development:** `http://localhost:5000/api`
- **Production (Render):** `https://<your-render-app>.onrender.com/api`

---

### `GET /api/healthz`

Health check endpoint.

**Response `200 OK`:**
```json
{ "status": "ok" }
```

---

### `POST /api/analyze`

Analyze a URL and return SEO/performance metrics.

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Success Response `200 OK`:**
```json
{
  "status": 200,
  "responseTime": "320 ms",
  "title": "Example Domain",
  "metaDescription": "This domain is for use in illustrative examples.",
  "h1Count": 1,
  "missingAltImages": 0,
  "wordCount": 542
}
```

**Error Responses:**

| HTTP Status | Code | Meaning |
|---|---|---|
| `400` | `INVALID_URL` | Malformed or missing URL |
| `400` | `INVALID_PROTOCOL` | Protocol other than http/https |
| `400` | `DNS_FAILURE` | Domain not found |
| `408` | `TIMEOUT` | Page took > 10 seconds to respond |
| `422` | `NON_HTML_CONTENT` | URL returned PDF, JSON, or other non-HTML |
| `500` | `INTERNAL_ERROR` | Unexpected server error |

**Error Response Shape:**
```json
{
  "error": "Human-readable description",
  "code": "MACHINE_READABLE_CODE"
}
```

---

## 🌍 Environment Variables

### Backend (`artifacts/api-server`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | ✅ Yes | — | Port for the Express server |
| `NODE_ENV` | No | `development` | `production` or `development` |

> **Note:** No `DATABASE_URL` is needed — Page Pulse is stateless and does not persist data.

### Frontend (`artifacts/page-pulse`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | ✅ Yes | — | Port for the Vite dev server |
| `BASE_PATH` | ✅ Yes | `/` | URL base path prefix |

---

## 🚀 Deployment

### Deploy Backend to Render

1. Push your repository to GitHub.
2. Go to [render.com](https://render.com) → **New** → **Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Root Directory:** `artifacts/api-server`
   - **Build Command:** `pnpm install && pnpm run build`
   - **Start Command:** `pnpm run start`
   - **Environment Variables:**
     - `NODE_ENV` = `production`
     - `PORT` = `10000` (Render default)
5. Click **Create Web Service**.
6. Copy the URL (e.g. `https://page-pulse-api.onrender.com`).

### Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo.
2. Configure:
   - **Root Directory:** `artifacts/page-pulse`
   - **Framework Preset:** `Vite`
   - **Build Command:** `pnpm run build`
   - **Output Directory:** `dist/public`
   - **Install Command:** `pnpm install`
3. Add **Environment Variables** in Vercel settings:
   - `VITE_API_BASE_URL` = your Render backend URL (e.g. `https://page-pulse-api.onrender.com`)
   - `BASE_PATH` = `/`
4. Click **Deploy**.

---

## 🎨 Design Decisions

### 1. OpenAPI-First Contract Between Frontend and Backend

The API contract is defined once in `lib/api-spec/openapi.yaml`, then code-generated into both React Query hooks (`lib/api-client-react`) and Zod validation schemas (`lib/api-zod`). This eliminates the classic problem of frontend types drifting from backend validation — both sides are derived from the same source of truth.

**Trade-off:** Adds a codegen step (`pnpm run codegen`) whenever the spec changes, but the payoff is zero schema drift and fully typed API calls with no hand-maintenance.

### 2. MVC Architecture in the Express Server

The backend is split into three layers: **Routes** (HTTP verb + path mapping), **Controllers** (request/response parsing and error translation), and **Services** (pure business logic with no knowledge of HTTP). The `analyzeService.ts` never touches `Request` or `Response` — it works on plain data and throws a typed `AnalyzeServiceError`.

**Trade-off:** More files than a single `server.js`, but each layer is independently unit-testable. Controllers are easy to swap (REST today, WebSocket tomorrow) without touching business logic.

### 3. `validateStatus: () => true` + Content-Type Guard

Instead of letting axios throw on non-2xx status codes, the service accepts all status codes and returns them as data (a 404 from the target page is a legitimate, reportable result). A separate content-type guard rejects non-HTML responses (PDFs, JSON APIs) with a `422` before trying to parse them with Cheerio — preventing confusing metric values from binary or non-HTML bodies.

**Trade-off:** Requires explicit content-type checking, but produces accurate results across the full HTTP status spectrum and gives useful error messages for non-HTML URLs.

---

## 🔮 Future Improvements

| Feature | Priority | Notes |
|---|---|---|
| **Analysis history** | High | Store past scans in PostgreSQL with timestamps for trend tracking |
| **Bulk URL analysis** | High | Accept an array of URLs and fan-out requests with a concurrency limiter |
| **Lighthouse integration** | Medium | Integrate Google Lighthouse via `puppeteer` for Core Web Vitals scores |
| **Broken link detection** | Medium | Crawl all `<a>` tags and report 404s |
| **Open Graph preview** | Medium | Render a social card preview from OG tags |
| **PDF report export** | Low | Export the dashboard results as a one-page PDF |
| **Rate limiting** | High | Add `express-rate-limit` to prevent abuse of the analyze endpoint |
| **Caching layer** | Medium | Redis TTL cache to avoid re-fetching the same URL within a short window |
| **Authentication** | Low | Optional API key or OAuth for usage metering |
| **Sitemap crawler** | Low | Accept a `sitemap.xml` URL and analyze all discovered pages |

---

## 🔗 Links

- **Live App:** _Deploy to get your URL_
- **Digital Heroes:** [digitalheroesco.com](https://digitalheroesco.com)

---

*Built for Digital Heroes Training Task*
