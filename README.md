# Avalon — UHS Chemistry Club RPG Competition

**Avalon** is a year-long RPG competition and spaceborne molecular simulator for the University High School Chemistry Club. Four rival corporate flagships explore derelict alien worlds to unlock chemical principles from the ground up without textbook jargon.

---

## Architecture

```
Browser — Vite + Three.js, DOM UI layered over one persistent WebGL canvas
   │  same-origin fetch, no CORS client-side
   ▼
/api/*  — Vercel Node function: proxy, rate limit, and scrypt password hashing
   │  server-to-server POST, shared secret in payload
   ▼
Apps Script Web App (doPost) — routing, grading, scoring, never hashes passwords
   │
   ▼
Google Sheet "Avalon DB" (13 tabs)
```

---

## Quickstart (Local Development)

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Start the local development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser. The embedded dev proxy middleware handles `/api/*` requests in-memory out-of-the-box.

---

## Hardware Quality Tiers

Avalon is calibrated for high school classrooms with varied hardware:
- **T3 (Desktop / Discrete GPU):** 60 FPS target, full particle starfield, bloom, specular lighting.
- **T2 (Standard / Chromebook):** 30 FPS target, DPR 1, no post-processing, battery-saving procedural lighting.
- **T1 (Non-WebGL Fallback):** Zero WebGL requirement. Replaces 3D viewer with static SVG backdrops and standard accessible `<select>` dropdowns. All quests are 100% solvable in T1.

---

## Production Deployment

### 1. Google Apps Script Backend
1. In `apps-script/`, log in and link to your Google Spreadsheet:
   ```bash
   cd apps-script
   npx clasp login
   ```
2. Set Script Properties in the Apps Script project:
   - `SPREADSHEET_ID`: ID of your Google Sheet
   - `PROXY_SECRET`: Shared secret for server-to-server calls
   - `SESSION_SECRET`: Secret for signing HMAC session tokens
   - `SEASON_SALT`: Salt for deterministic random event rolls
3. Deploy as a Web App (Execute as: Me, Access: Anyone).

### 2. Vercel Frontend
Set the following environment variables in Vercel:
- `APPS_SCRIPT_URL`: URL of your deployed Apps Script web app
- `PROXY_SECRET`: Matching proxy secret
- `PEPPER`: Random salt pepper string for scrypt password hashing
- `SESSION_SECRET`: Matching session secret

---

## Utility Tools

- `npm run bake:stills`: Generates fallback SVG/WebP backdrops in `public/fallback/`.
- `npm run test:load`: Simulates 40 concurrent recruits to verify team slot capping and race-condition immunity.
- `npm run seed`: Generates mock explorer records across all four flagships for local testing.
