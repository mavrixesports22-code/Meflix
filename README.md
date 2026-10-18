# 🎬 Meflix — Web Movies & TV Shows Platform

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&style=for-the-badge)](https://vercel.com)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0-339933?logo=node.js&style=for-the-badge)](https://nodejs.org)
[![JavaScript](https://img.shields.io/badge/ES6%2B-Vanilla-F7DF1E?logo=javascript&style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**Meflix** is a high-performance, cinematic streaming platform featuring live discovery rows, authentic dark-mode aesthetics, responsive mobile & desktop viewports, an integrated HLS video player engine, and instant seed catalog loading.

Engineered for zero-dependency standalone execution and seamless serverless production deployment on **Vercel**.

---

## ✨ Highlights & Features

- **Cinematic Dark Theme UI**:
  - Sticky glassmorphism navigation, dynamic billboard hero banner, and fluid carousel shelves.
  - Responsive design adapting dynamically from desktop monitors down to mobile phone portrait/landscape views.
  - Pure Vanilla CSS and modern typography (Google Fonts *Outfit* & *Inter*).

- **Rich Content Catalog**:
  - Top 10 Today, Trending Series, Bollywood, Asian Cinema, Drama, Crime, Documentaries, Anime, and 90-Minute Films.
  - Multi-season navigation with per-episode cards, duration badges, and synopses.
  - Pre-cached seed catalog in `.runtime/netflix-catalog.json` ensures zero cold-start delay on first deployment.

- **Adaptive Video Player**:
  - HLS.js streaming engine with automatic fallback to native browser HLS (Safari/iOS).
  - Multi-audio language track switcher and closed caption (CC) subtitle toggling.
  - Aspect ratio fit controls (Contain, Cover, 16:9), keyboard shortcuts (Space, Arrow keys, M, F).
  - Mini-player picture-in-picture mode while continuing to browse titles.

- **Persistent Watch History & My List**:
  - Exact playback position resume stored in browser `localStorage`.
  - Add/remove titles to personal *My List*.
  - Privacy-preserving architecture (no session tokens or streaming URLs saved to storage).

---

## 🚀 Vercel Production Deployment

### Option 1: Deploy via Vercel Dashboard / Git Integration (Recommended)
1. Push this repository to GitHub: `https://github.com/mavrixesports22-code/Meflix.git`.
2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Import the `Meflix` repository.
4. **Framework Preset**: Select `Other` (or leave default).
5. **Root Directory**: `./` (leave default).
6. **Build Command**: None needed (zero-build architecture).
7. **Output Directory**: `./` (leave default).
8. Set the required Environment Variable for **Production**, **Preview**, and **Development**:
   - `SESSION_SECRET`: Generate a unique value with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`. It seals the HttpOnly playback session cookie. Without it, the API returns a configuration error instead of using a known production key.
9. Click **Deploy**.

Vercel automatically detects:
- Static assets (`index.html`, `css/`, `js/`, `assets/`, `manifest.webmanifest`).
- Serverless Functions (`api/netmirror/[...path].js`, `api/health.js`).
- Rewrites and security headers from `vercel.json`.

### Option 2: Deploy using Vercel CLI
```bash
npm install -g vercel
vercel --prod
```

---

## 💻 Local Development

Meflix uses standard Node.js built-ins with **zero external npm dependencies**.

### 1. Start the Server
```bash
# Using npm
npm start

# Or directly with Node
node server.js
```

### 2. Open in Browser
Visit [http://localhost:5173](http://localhost:5173).

---

## 🧪 Test Suite

Run the full verification suite (including the Vercel serverless handler checks):

```bash
npm test
node tools/verify-vercel.cjs
```

### Run Individual Checks
```bash
node tools/check-media-resources.cjs
node tools/check-catalog-data.cjs
node tools/check-player-reliability.cjs
node tools/check-upstream-reliability.cjs
node tools/check-catalog.cjs
node tools/check-home-ui.cjs
node tools/check-watch-history.cjs
node tools/check-netmirror.cjs
node tools/verify-vercel.cjs
```

---

## 🔒 Security & Architecture

- **Stateless Serverless Sessions**: Session states are sealed with AES-256-GCM authentication tags in HTTP-only cookies. Any distributed Vercel lambda instance can verify and process requests without shared server memory.
- **SSRF Hardening**: All upstream resolution strictly enforces public HTTPS endpoints and rejects RFC-1918 private IPv4/IPv6 address ranges.
- **Credential Protection**: Ephemeral streaming media handles (`v1_*`) hide raw CDN addresses and sensitive tokens from the browser.
- **Strict Content Security**: Configured in `vercel.json` with `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 📁 Repository Structure

```
meflix/
├── index.html                  # Main application entry point
├── manifest.webmanifest        # PWA application manifest
├── vercel.json                 # Vercel deployment & routing config
├── package.json                # Scripts and metadata
├── server.js                   # Local development HTTP server
├── netmirror-service.js        # NetMirror service module
├── .gitignore                  # Git ignore rules
│
├── api/                        # Vercel Serverless Functions
│   ├── health.js               # Deployment health check
│   └── netmirror/
│       └── [...path].js        # NetMirror API router
│
├── assets/                     # Brand logos and iconography
│   └── brand/
│       ├── meflix-mx.png
│       └── meflix-wordmark.png
│
├── css/                        # Modular stylesheet system
│   ├── netflix.css             # Core design system and layout
│   ├── ui-polish.css           # Cards, hover effects, buttons
│   ├── player.css              # Desktop player controls
│   ├── player-mobile.css       # Mobile player touch layout
│   ├── mobile-app.css          # Bottom navigation and mobile shell
│   └── home-experience.css     # Billboard and hero transitions
│
├── js/                         # Client-side architecture
│   ├── netflix.js              # Core UI orchestration & navigation
│   ├── catalog-service.js      # Dynamic catalog discovery & caching
│   ├── netmirror-player.js     # HLS audio/video playback engine
│   ├── watch-history.js        # Resume state and user library
│   ├── mobile-shell.js         # Mobile layout controller
│   ├── data.js                 # Local fallback metadata
│   └── vendor/
│       └── hls.min.js          # Vendored HLS.js player library
│
├── lib/                        # Backend utilities
│   ├── catalog-cache.js        # Multi-tier catalog cache
│   ├── catalog-data.js         # Record normalizers
│   ├── media-resources.js      # Encrypted handle manager
│   └── upstream.js             # Upstream transport & retry engine
│
├── .runtime/                   # Bundled seed catalog
│   └── netflix-catalog.json    # Instant cold-start catalog data
│
└── tools/                      # Test & verification suites
    ├── check-catalog-data.cjs
    ├── check-catalog.cjs
    ├── check-home-ui.cjs
    ├── check-media-resources.cjs
    ├── check-netmirror.cjs
    ├── check-player-reliability.cjs
    ├── check-upstream-reliability.cjs
    ├── check-watch-history.cjs
    └── verify-vercel.cjs
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
