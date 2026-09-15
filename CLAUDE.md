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
- Verified build and 2D/3D payload parity.


