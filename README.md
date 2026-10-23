# Avalon — UHS Chemistry Club RPG Competition

**Avalon** is a year-long RPG competition and spaceborne molecular simulator for the University High School Chemistry Club, for students aged 12 to 17. Four Imperial guilds aboard one salvage starship explore derelict alien worlds and unlock chemical principles from the ground up: plain words first, the real chemistry term once it is earned.

Two roads: the Learn track (fourteen worlds, six built, no XP) and the Charge Gardens campaign (the competition: XP and Standings). Product truth is in `PRODUCT.md`; engineering rules in `CLAUDE.md`.

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
Google Sheet (7 tabs: Config, Players, Progress, LearnProgress, PlayerState, Submissions, Inventory)
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

## Graphics

Two settings, chosen in Settings (a measured tier is never written down, only a chosen one):
- **3D On (T4, default):** walk the ship and the worlds in first person; every bench is built into its world and the camera leans in over the table. A phone is not disqualified (DPR capped at 1.5, no shadow map on handsets).
- **3D Off (T1):** no WebGL needed. The same tabletops are drawn on a canvas, with static SVG backdrops and native form controls. Every stage is solvable here.

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
