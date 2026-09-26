<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0A0A0A&height=180&section=header&text=Screenshot%20API&fontSize=48&fontColor=FF4B2B&fontAlignY=40&desc=Self-hosted%20webpage%20capture%20%C2%B7%20PDF%20export%20%C2%B7%20SSRF-safe&descAlignY=60&descFontSize=15&descFontColor=FAFAFA" width="100%">

<br>

[![Node](https://img.shields.io/badge/Node-18%2B-0A0A0A?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Playwright](https://img.shields.io/badge/Playwright-1.48-FF4B2B?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev)
[![Docker](https://img.shields.io/badge/Docker-ready-0A0A0A?style=for-the-badge&logo=docker&logoColor=white)](Dockerfile)
[![License](https://img.shields.io/badge/License-MIT-FF4B2B?style=for-the-badge)](LICENSE)

<br>

**A self-hosted API for capturing webpage screenshots and PDFs.**
Full-page or viewport, device presets, dark mode, ad blocking, element-level capture.

<br>

[Features](#features) · [Quick Start](#quick-start) · [API Reference](#api-reference) · [Security](#security) · [Deployment](#deployment) · [Configuration](#configuration)

</div>

---

## Features

<table>
<tr>
<td width="50%">

**Capture**
- Full-page or viewport screenshots
- PNG, JPEG, or WebP output
- Webpage-to-PDF export
- Single-element capture via CSS selector
- 9 built-in device presets with correct scale factors
- Custom viewport dimensions

</td>
<td width="50%">

**Rendering**
- Dark-mode emulation (`prefers-color-scheme`)
- Ad and tracker blocking for clean shots
- Configurable load-wait strategy
- Post-load delay for animations
- Transparent background support

</td>
</tr>
<tr>
<td>

**Operations**
- In-memory response caching with TTL
- Per-IP rate limiting
- Optional API key authentication
- Structured JSON logging
- Health check endpoint

</td>
<td>

**Safety**
- SSRF protection with DNS-rebind checks
- Private and reserved IP ranges blocked by default
- Concurrency-limited browser pool
- Graceful shutdown on SIGTERM/SIGINT

</td>
</tr>
</table>

---

## Project Structure

```
screenshot-api/
├── src/
│   ├── app.js                  # Express app, middleware chain, shutdown
│   ├── config/
│   │   └── env.js              # Environment variable loader
│   ├── lib/
│   │   ├── browser.js          # Browser singleton + concurrency limiter
│   │   ├── cache.js            # In-memory LRU cache with TTL
│   │   ├── logger.js           # Pino structured logger
│   │   └── ssrfGuard.js        # Private/reserved IP + DNS-rebind protection
│   ├── middleware/
│   │   ├── auth.js             # Optional API key check
│   │   ├── errorHandler.js     # Central error → JSON response
│   │   └── rateLimiter.js      # Per-IP request limiting
│   ├── routes/
│   │   ├── index.js            # Route mounting
│   │   ├── screenshot.js       # GET /api/screenshot, /devices
│   │   ├── pdf.js               # GET /api/pdf
│   │   ├── metadata.js         # GET /api/metadata
│   │   └── health.js           # GET /api/health
│   ├── services/
│   │   ├── captureService.js   # Core screenshot logic
│   │   ├── pdfService.js       # Core PDF logic
│   │   └── devices.js          # Device viewport presets
│   └── utils/
│       ├── validate.js         # Query param parsing/validation
│       └── blocklist.js        # Ad/tracker domain list
├── public/
│   ├── index.html              # Test console
│   ├── css/style.css
│   └── js/app.js
├── .env.example
├── Dockerfile
├── render.yaml
└── package.json
```

---

## Quick Start

### Local (requires Playwright's Chromium)

```bash
git clone https://github.com/your-username/screenshot-api
cd screenshot-api

npm install
npx playwright install chromium --with-deps

cp .env.example .env
npm start
```

Open [http://localhost:3000](http://localhost:3000) for the test console.

### Docker (recommended)

The official Playwright image ships Chromium pre-installed, so this is the fastest path to a working instance:

```bash
docker build -t screenshot-api .
docker run -p 3000:3000 --env-file .env screenshot-api
```

---

## API Reference

All endpoints are mounted under `/api`. Errors return `{ "status": false, "error": "..." }` with a 4xx/5xx status.

### `GET /api/screenshot`

Returns raw image bytes.

```bash
curl "http://localhost:3000/api/screenshot?url=https://example.com&width=1280&height=800" \
  --output shot.png
```

| Param | Type | Default | Description |
|---|---|---|---|
| `url` | string | — | **Required.** Page to capture |
| `device` | string | — | Preset id from `/api/screenshot/devices`, overrides width/height |
| `width` / `height` | number | `1280` / `800` | Viewport size in pixels (clamped to `MAX_VIEWPORT_*`) |
| `fullPage` | `true`/`false` | `false` | Capture the full scrollable page |
| `format` | `png`/`jpeg`/`webp` | `png` | Output image format |
| `quality` | 1–100 | `80` | Compression quality (jpeg/webp only) |
| `darkMode` | `true`/`false` | `false` | Emulate `prefers-color-scheme: dark` |
| `blockAds` | `true`/`false` | `true` | Strip known ad/tracker requests |
| `omitBackground` | `true`/`false` | `false` | Transparent background (png) |
| `selector` | string | — | Capture one element by CSS selector instead of the page |
| `delay` | ms (0–10000) | `0` | Wait after load before capturing |
| `waitUntil` | `load`/`domcontentloaded`/`networkidle` | `load` | Navigation completion strategy |
| `scale` | 1–3 | `1` | Device scale factor (ignored when `device` is set) |

### `GET /api/screenshot/devices`

Lists all built-in device presets with their viewport dimensions.

### `GET /api/pdf`

Returns a PDF of the rendered page.

```bash
curl "http://localhost:3000/api/pdf?url=https://example.com&format=A4" --output page.pdf
```

| Param | Type | Default | Description |
|---|---|---|---|
| `url` | string | — | **Required.** Page to render |
| `format` | `A4`/`A3`/`A5`/`Letter`/`Legal`/`Tabloid` | `A4` | Paper size |
| `landscape` | `true`/`false` | `false` | Page orientation |
| `printBackground` | `true`/`false` | `true` | Include CSS backgrounds |
| `scale` | 0.1–2 | `1` | Render scale |
| `margin` | CSS length | `0.4in` | Margin on all four sides |
| `delay` | ms | `0` | Wait after load before rendering |

### `GET /api/metadata`

Returns page title, description, Open Graph tags, canonical URL, and favicon as JSON — no rendering required.

### `GET /api/health`

Returns uptime, browser connection status, and cache stats.

---

## Security

Screenshot-from-URL APIs are a classic **SSRF** vector — without protection, a request like `?url=http://169.254.169.254/latest/meta-data/` could expose cloud instance credentials, or `?url=http://localhost:6379/` could probe internal services.

This API blocks that by default:

- Rejects `localhost`, loopback, link-local, and all private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `100.64.0.0/10`)
- Resolves the hostname via DNS and checks the **resolved IP**, not just the hostname string, to prevent DNS-rebinding bypasses
- Only allows `http:` and `https:` protocols

To disable this (e.g. for an internal-only deployment where you trust all callers), set `ALLOW_PRIVATE_URLS=true`. Leave it `false` for anything public-facing.

Set `API_KEYS` (comma-separated) to require an `x-api-key` header on every request. Leave it empty to run open.

---

## Deployment

### Render

`render.yaml` is preconfigured for Render's Docker runtime:

1. Push to GitHub
2. **New Web Service** → connect the repo → Render detects `render.yaml`
3. Deploy

> Render's free tier sleeps on inactivity, which adds cold-start latency to the first request after idling. The `starter` plan avoids this.

### Any Docker host (Fly.io, Railway, a VPS)

```bash
docker build -t screenshot-api .
docker run -d -p 3000:3000 --env-file .env --restart unless-stopped screenshot-api
```

### Why not serverless (Vercel/Lambda functions)?

Playwright's full Chromium binary is large and needs a persistent process — it doesn't fit cleanly into short-lived serverless functions without extra packaging (`@sparticuz/chromium` and similar). A long-running Docker container is simpler and more reliable for this workload.

---

## Configuration

All configuration is via environment variables — see `.env.example`.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `API_KEYS` | *(empty)* | Comma-separated keys; empty disables auth |
| `ALLOWED_ORIGINS` | `*` | CORS origin |
| `ALLOW_PRIVATE_URLS` | `false` | Disable SSRF protection |
| `NAV_TIMEOUT_MS` | `30000` | Navigation timeout |
| `BROWSER_MAX_CONCURRENCY` | `4` | Max simultaneous page renders |
| `CACHE_TTL_SECONDS` | `600` | Cache lifetime per unique request |
| `CACHE_MAX_ITEMS` | `200` | Max cached responses (LRU eviction) |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window |
| `RATE_LIMIT_MAX` | `30` | Max requests per window per IP |
| `MAX_VIEWPORT_WIDTH` | `3840` | Upper bound for custom width |
| `MAX_VIEWPORT_HEIGHT` | `2160` | Upper bound for custom height |

The response cache is in-memory and per-instance — it resets on restart and isn't shared across replicas. That's sufficient for avoiding duplicate renders of the same URL+options within a short window; it isn't a persistent store.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+, Express |
| Rendering | Playwright (Chromium) |
| Logging | Pino |
| Security | Helmet, custom SSRF guard |
| Rate limiting | express-rate-limit |
| Frontend | Vanilla JS, no build step |
| Deployment | Docker, Render-ready |

---

## Legal

Respect the `robots.txt` and terms of service of any site you capture. This tool renders pages server-side on your behalf — you're responsible for how it's used.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0A0A0A&height=100&section=footer" width="100%">

Built with Node.js, Express, and Playwright

</div>
