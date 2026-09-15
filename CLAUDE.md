# Avalon — Engineering Reference

## Build and Run
- `npm run dev`: Start Vite local development server (port 3000) with embedded API middleware.
- `npm run build`: Build production assets into `dist/`.
- `npm run deploy:backend`: Push Apps Script code via clasp (`clasp push`).
- `npm run bake:stills`: Generate fallback static SVG backdrops in `public/fallback/`.
- `npm run test:load`: Execute concurrency simulation testing for 40 simultaneous signups.
- `npm run seed`: Generate test roster data for the four corporate flagships.

## Code Architecture
- `src/three/`: Master three.js WebGL2 engine, quality tier probe (T3/T2/T1), persistent ship interior, and spline camera rig.
- `src/quest3d/`: Reusable containment chamber, InstancedMesh molecular renderer, dual-shell electron density isosurfaces, and 3D raycast interactions.
- `src/fallback2d/`: Accessible DOM-only input fallbacks sharing the exact same payload contract.
- `api/[...route].js`: Vercel serverless catch-all proxy with native `crypto.scrypt` password hashing and rate limiting.
- `apps-script/`: Google Apps Script backend DAO (`Db.gs`), authentication (`Auth.gs`), scoring and normalized leaderboards (`Scoring.gs`), quests (`Quests.gs`), and deterministic random events (`Events.gs`).
- `docs/plans/avalon-implementation-plan.md`: Master architectural specification.
- `docs/quests/q1-charge-gardens.md`: Quest 1 curriculum and answer keys.
- `docs/runbook.md`: On-call operational runbook for live events.

## Recent Updates
- Added `setup()` in `apps-script/Main.gs` for manual 1-click sheet schema and data initialization.
- UI copy simplified: stripped feature advertisements, marketing text, and verbose lore across all screens.
- Added `/comms` and `/inventory` route aliases.
- Non-blocking initial bootstrap: HUD and Router initialize immediately in `src/main.js` so foreground loads in 0ms without waiting on backend network response.
- Removed expensive `Db.initDb()` from Apps Script `bootstrap` route hot path and added 60s caching.
- Added in-memory proxy cache for public routes (`bootstrap`, `quest/manifest`, `leaderboard`) in `api/[...route].js`.
- Made screen rendering non-blocking across onboarding, leaderboards, inventory, and quest screens to eliminate blank screen loading delays.
- Exempted `#/admin` from mandatory onboarding redirect in router.
- Added persistent authentication in `src/session.js`: session token, player profile, team, XP, level, inventory, and config are stored in `localStorage` under `avalon_user_session` and restored synchronously at app boot.
- Auto-redirect authenticated users from `#/`, `#/login`, and `#/register` directly to `#/bridge` (or `#/onboarding` if team not assigned).
- Made bridge dashboard reactive to session subscriber updates.
- Added mock handlers for `player/me`, `player/update`, and `player/rename` in `api/[...route].js` for local development.



## Star Wars & Dune Aesthetic Standards (MANDATORY FOR ALL AGENTS)

All visual designs, UI components, and 3D scenes MUST strictly follow a **Star Wars / Dune "Used Universe"** aesthetic.

### 1. Design Philosophy
- **Grimy & Advanced**: Technology must look battle-tested, dusty, scratched, oil-stained, and mechanically tactile, while functioning as cutting-edge chemical engineering simulation hardware.
- **Strictly Banned**: No "vibe-coded" synthwave, generic esports neon, modern web3 crypto cards, glossy blue glassmorphism, or electric cyan (`#00e5ff`) laser glows.

### 2. Color Palette
- **Surfaces**: Scorched carbon durasteel (`#0c0d11`, `#14161c`), weathered iron plates (`#1c2024`, `#22262d`), desert basalt slate.
- **Telemetry & Accents**: Spice Amber (`#ff9f1c`), Arrakis Sand Gold (`#f4a261`), Industrial Rust (`#c85a17`), CRT Phosphor Green (`#38b000`), Emergency Red (`#d90429`), Imperial Guild Bronze (`#a3824c`).
- **Displays**: Monochromatic amber or green CRT tube scanlines with analog waveforms and telemetry grids.

### 3. Typography
- **Headings / Military Titles**: `Chakra Petch`, `Cinzel` (Imperial House weight).
- **Telemetry / Flight Recorders / Formulas**: `Share Tech Mono`, `JetBrains Mono`.
- **UI Labels & Body**: `Rajdhani`.

### 4. 3D Graphics & Nano Banana Assets
- Combine Nano Banana (`generate_image`) realistic matte textures and backdrops with Three.js procedural geometries and PBR materials (`MeshStandardMaterial`).
- Ship interior features riveted durasteel bulkheads, overhead cable runs, hydraulic pipes, tactile flight consoles with dual CRT monitors, and a Dune spice-amber particulate tactical holotable.
- Lighting: Harsh low-angle Arrakis solar illumination through forward blast viewports, warm sodium task lamps, and 2,000 floating atmospheric dust motes.
- All routes dynamically bind corresponding high-res environment stills (`/art/hero_desert_outpost.jpg`, `bridge.jpg`, `starmap.jpg`, `crucible.jpg`, `cargo.jpg`, `quarters.jpg`, `comms.jpg`, `airlock.jpg`).

### 5. UI Components
- **Panels**: Heavy durasteel plating (`.glass-panel`) with riveted seams, chamfers, and warm amber indicator edges.
- **Buttons**: Tactile mechanical push buttons (`.btn-primary`) in spice gold with physical bevel drop shadows and active press translation; cast durasteel toggle buttons (`.btn-secondary`).
- **Inputs**: Recessed analog cathode console screens (`.form-input`) with dark bezels and amber phosphor glow.
- **Factions**: Four Imperial Guilds: Mineral Mining Guild (Earth), Atmospheric Harvesters (Air), Thermal Smelters (Fire), and Moisture Extraction (Water).
