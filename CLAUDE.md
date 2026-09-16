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
- Converted 3D molecular renderer to ball-and-stick models with CPK colored spheres and connecting cylinder rods (`src/quest3d/molecule.js`).
- Implemented realistic MarchingCubes electrostatic potential charge density isosurfaces: red for most dense, blue for least dense, green/cyan intermediate, slightly translucent to reveal ball-and-stick structure underneath (`src/quest3d/isosurface.js`).
- Stripped all technical jargon ("electrons", "charge clouds", "nucleophile", "orbitals", etc.) across quest HUD, prompts, manifests, and backend (`src/screens/quest.js`, `apps-script/Quests.gs`, `api/[...route].js`). Set all prompts strictly to: "Draw a line between the two regions."
- Space Opera overhaul: shifted theme to multi-planet space opera across uncharted star systems while keeping Quest 1 on the desert world Erebus.
- Onboarding, landing, login, register, and bridge vantage point configured to a 3D first-person starship cockpit looking out at deep space and celestial bodies.
- Nano Banana generated assets: `/art/cockpit.jpg` (starship cockpit view), `/art/starmap.jpg` (multi-planet tactical projection), `/art/durasteel_plate.jpg` (weathered PBR plate texture), `/art/factions.jpg` (guild charter).
- Three.js 3D assets: modeled faceted durasteel canopy trusses, overhead avionics rack, dual flight yokes, throttle quadrant, armored flight chairs, chromatic gas giant with planetary rings, tumbling asteroid debris belt, and deep-space starlight illumination.
- Standardized teams to Earth, Air, Fire, Water: added auto-migration (`Db.ensureTeamsMigrated()`), legacy fallback aliases (`terra`, `zephyr`, `ignis`, `thalassa`), and client-side normalization across onboarding, session cache, and API proxy to resolve 400 team selection errors.
- Fixed onboarding redirect loop & trap: synced `player.team_id` with `team.team_id` in `session.setUserData`, checked `session.teamId` in `router.js`, and handled `ALREADY_ASSIGNED` errors smoothly.
- Fixed 3D Quest rendering: resolved blank scene caused by legacy choice stage 0 without `moleculeId`; added automatic stage fallback and normalization in `viewer.js`, `apps-script/Quests.gs`, and `api/[...route].js`.
- Fixed 3D drawing vs rotation: added Draw vs Rotate mode toggle and Clear Line button in `src/screens/quest.js`, supported right-click camera orbit during draw mode in `src/three/lib/orbit.js`, and made drawn lines thick, bright (`#ffd166` / `#00ff88`), and rendered with `depthTest: false`.
- Stripped unnecessary text, lore fluff, and feature advertisements across all screens (landing, onboarding, bridge, starmap, inventory, leaderboard, quarters, and quest).
- Replaced nonsensical quest stage choices and vague directions with stage-specific chemistry prompts.
- Obvious incorrect feedback: added full-screen emergency red flash vignette, stage card shake animation (`@keyframes cardErrorShake`), red warning border glow, and prominent inline alert banner (`#stage-feedback`) directly on the stage prompt card.
- Freeform 3D arrow drawing: arrows now render and persist wherever drawn in 3D space (`src/quest3d/interactions/arrow.js`, `src/three/arrow-drag.js`), instead of only appearing when connecting exact anchors.
- Proximity-based solution grading: users can draw anywhere close to the correct trajectory (`tolerance: 1.35` 3D radius) and it is evaluated as correct across all stages (`src/quest3d/evaluator.js`).
- Immediate browser-side evaluation: quest grading now executes synchronously in 0ms directly in client (`src/screens/quest.js`), pre-loading solutions without waiting on Google Sheets network calls.
- Unlimited attempts: removed attempt caps, attempt counters, and attempt deduction penalties across client (`src/screens/quest.js`), proxy (`api/[...route].js`), and backend (`apps-script/Quests.gs`).
- Obvious incorrect feedback: added full-screen emergency red flash vignette, stage card shake animation (`@keyframes cardErrorShake`), red warning border glow, and prominent inline alert banner (`#stage-feedback`) directly on the stage prompt card.
- Freeform 3D arrow drawing: arrows now render and persist wherever drawn in 3D space (`src/quest3d/interactions/arrow.js`, `src/three/arrow-drag.js`), instead of only appearing when connecting exact anchors.
- Proximity-based solution grading: users can draw anywhere close to the correct trajectory (`tolerance: 1.35` 3D radius) and it is evaluated as correct across all stages (`src/quest3d/evaluator.js`).
- Guarded bootstrap against network failures with local fallback and object validation (`boot = (raw && typeof raw === 'object') ? raw : {}`), resolving `TypeError: Cannot read properties of undefined (reading 'config')`.
- Stripped all forbidden terminology ("electron", "electron-rich", "electron-deficient", "electrophile", "nucleophile") across all quest prompts, manifests, bridge cards, starmap, and inventory items, reserving explanations strictly for the final quest epilogue.
- Fixed `notifySubscribers is not a function`: added `notifySubscribers()` method alias to `SessionManager` in `src/session.js` and updated `src/screens/quest.js` to call `session.notify()` and persist XP.
- Simplified quest instructions: instructions and draw tips rendered strictly on Stage 1; stages 2-7 display zero prompt text (`src/screens/quest.js`, `src/quest3d/evaluator.js`, `api/[...route].js`, `apps-script/Quests.gs`).
- Enhanced electron density visibility: upgraded isosurfaces to double-sided 0.65 opacity with saturated colormap and balanced neutral white key/ambient illumination (`src/quest3d/isosurface.js`, `src/quest3d/viewer.js`).
- Fixed multi-submit stage skipping: locked submit button upon successful evaluation with `isAdvancing` flag, retained button disabled state, and passed fixed target stage indices to prevent rapid clicks from skipping forward (`src/screens/quest.js`).
- Introduced beginner-friendly electron density concept: rendered dedicated Atoms & Electrons concept card on Stage 2 explaining atoms, molecules, negative electron charges, and red/blue density flow using magnet analogies (`src/quest3d/evaluator.js`, `src/screens/quest.js`, `src/styles/holo.css`).
- Introduced molecule path tracing and steric hindrance: added concept card on Stage 5 explaining that arrows trace physical molecule collision trajectories, that atoms occupy physical space, and how bulky surrounding atom clusters block pathways (`src/quest3d/evaluator.js`, `src/screens/quest.js`).
- Synced stage titles and prompts across proxy (`api/[...route].js`) and backend (`apps-script/Quests.gs`).
- Added dismiss and reopen buttons to Quest Key Concept cards (`src/screens/quest.js`, `src/styles/holo.css`) to allow expanding screen space for the 3D viewer.
- Middle-school friendly explanation cards across all 7 stages of Quest 1: added engaging LEGO brick, magnet, bumper car, and bodyguard analogies explaining atoms, molecules, energy clouds, and octet rules with zero confusing jargon (`src/quest3d/evaluator.js`, `api/[...route].js`, `apps-script/Quests.gs`).
- Physically accurate 3D reaction animation upon correct arrow drawing: left and right molecules approach along the collision vector, covalent bond snaps into place with energy glow, and in $S_N2$ stages (Stage 2: $CH_3Cl$, Stage 5: alkyl bromide) the leaving halogen atom ($Cl^-$, $Br^-$) breaks off and accelerates away so carbon strictly preserves its octet and never has 5 full bonds at once (`src/quest3d/molecule.js`, `src/quest3d/viewer.js`, `src/screens/quest.js`, `src/quest3d/isosurface.js`).
- Expanded Quest 1 to 20 stages:
  - Stages 8–10: >2 molecules (3 molecules in chamber: acid, base, spectator / nucleophile, substrate, leaving group).
  - Stages 11–20: Multi-step reactions with chronological numbered arrows.
  - Multi-arrow interaction (`src/three/arrow-drag.js`, `src/quest3d/interactions/arrow.js`): apex numbered circular 3D badge sprites, raycast click on badge cycles order, click on arrow deletes it; dual HUD step sequence pills with click-to-reorder and delete.
  - Cascade 3D animations: sequential multi-step reaction cascades in `MoleculeMesh.animateReaction`.
  - Local & remote multi-step evaluation (`src/quest3d/evaluator.js`, `api/[...route].js`, `apps-script/Quests.gs`): ordered sequence checking with `wrongOrder` and `incomplete` warnings.
  - Middle-school explanations across all 20 stages: magnets, LEGO bricks, bumper cars, relay passes, and musical chairs analogies with zero jargon.
  - 2D DOM fallback updated with multi-step arrow selector rows (`src/fallback2d/stages.js`).
- Fixed stage skipping bug: cleared stale interaction payloads on stage reset, decoupled draw completion from auto-submit, and require explicit submit button click (`src/quest3d/interactions/arrow.js`, `src/quest3d/viewer.js`, `src/screens/quest.js`).
- Fixed explanation window timing: hid explanation banner during 3D reaction animation; pop up explanation only after animation completes, with Next Stage button (`src/screens/quest.js`).
- Disabled arrow snapping: arrows render freeform in 3D following cursor without snapping to anchors on hover, start, or release (`src/quest3d/interactions/arrow.js`).



## Star Wars & Dune Space Opera Aesthetic Standards (MANDATORY FOR ALL AGENTS)

All visual designs, UI components, and 3D scenes MUST strictly follow a **Star Wars / Dune "Used Universe" Space Opera** aesthetic across multiple planetary systems.

### 1. Design Philosophy
- **Space Opera Scope**: Avalon spans multiple uncharted planets (Erebus desert world, Pyros Prime volcanic forge, Cryo-Haven ice tundra, Vortex Strata gas giant). Quest 1 takes place on the desert planet Erebus.
- **Starship Cockpit Perspective**: Non-quest screens (landing, onboarding, login, register, bridge) are viewed from the cockpit of the starship *Avalon*, looking through heavy faceted canopy framing out into deep space.
- **Grimy & Advanced**: Technology looks battle-tested, dusty, scratched, oil-stained, and mechanically tactile (analog dials, CRT vector scopes, toggle switches, heavy bolted durasteel), while functioning as cutting-edge chemical engineering simulation hardware.
- **Strictly Banned**: No "vibe-coded" synthwave, generic esports neon, modern web3 crypto cards, glossy blue glassmorphism, or electric cyan (`#00e5ff`) laser glows.

### 2. Color Palette
- **Surfaces**: Scorched carbon durasteel (`#0c0d11`, `#14161c`), weathered iron plates (`#1c2024`, `#22262d`), deep cosmic void (`#08090d`).
- **Telemetry & Accents**: Spice Amber (`#ff9f1c`), Solar Flare Sand Gold (`#f4a261`), Industrial Rust (`#c85a17`), CRT Phosphor Green (`#38b000`), Emergency Red (`#d90429`), Imperial Guild Bronze (`#a3824c`).
- **Displays**: Monochromatic amber or green CRT tube scanlines with analog waveforms and telemetry grids.

### 3. Typography
- **Headings / Military Titles**: `Chakra Petch`, `Cinzel` (Imperial House weight).
- **Telemetry / Flight Recorders / Formulas**: `Share Tech Mono`, `JetBrains Mono`.
- **UI Labels & Body**: `Rajdhani`.

### 4. 3D Graphics & Nano Banana Assets
- Combine Nano Banana (`generate_image`) realistic matte textures and backdrops with Three.js procedural geometries and PBR materials (`MeshStandardMaterial`).
- Starship Cockpit features faceted durasteel canopy mullions, overhead avionics rack, dual analog flight yokes, dual throttle quadrant, armored bucket flight seats, and twin CRT flight monitors.
- Space Opera Celestial Vista features a chromatic gas giant with planetary rings, the banded desert planet Erebus (Quest 1), orbiting moons, and an asteroid debris belt drifting through space.
- Lighting: Cool celestial starlight cutting through forward canopy, warm sodium/amber instrument task lamps, and floating micro-dust motes.
- Routes bind corresponding high-res environment stills (`/art/cockpit.jpg`, `starmap.jpg`, `crucible.jpg`, `cargo.jpg`, `quarters.jpg`, `comms.jpg`, `airlock.jpg`).

### 5. UI Components
- **Panels**: Heavy durasteel plating (`.glass-panel`) with riveted seams, chamfers, and warm amber indicator edges.
- **Buttons**: Tactile mechanical push buttons (`.btn-primary`) in spice gold with physical bevel drop shadows and active press translation; cast durasteel toggle buttons (`.btn-secondary`).
- **Inputs**: Recessed analog cathode console screens (`.form-input`) with dark bezels and amber phosphor glow.
- **Factions**: Four Imperial Guilds: Mineral Mining Guild (Earth), Atmospheric Harvesters (Air), Thermal Smelters (Fire), and Moisture Extraction (Water).
