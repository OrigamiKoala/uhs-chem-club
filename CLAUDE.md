# Avalon — Engineering Reference

Avalon is the UHS Chemistry Club's competition portal for middle- and high-school students (ages 12 to 17).
The core doctrine is: **teach chemistry clearly, intuitively, and hands-on, without giving away answers.**

This file holds the engineering doctrine, hard rules, and commands.
- **Product truth & scope:** `PRODUCT.md` wins any dispute regarding scope, target audience, and the pitfall ledger.
- **Engine, worlds & layout details:** `docs/engineering/engine-and-worlds.md` holds how things are built, per-world notes, and layout details.
- **Aesthetic tokens:** `DESIGN.md` and `src/styles/tokens.css` hold visual tokens (SCOURED PLATE doctrine below is authoritative).
- **Narrative & AP audit:** `docs/story/bible.md` holds lore; `docs/AP-coverage-audit.md` tracks AP Chemistry CED alignment.

## Codebase Architecture

- `src/main.js`: Application bootstrapper (stage, HUD, and hash router).
- `src/learn/`: Learn track (curriculum registry, quest definitions, and the `Tabletop` engine over `table/kits/`).
- `src/quest3d/`: Charge Gardens chamber (Quest 1 / competition campaign).
- `src/three/`: Persistent WebGL stage (`stage.js`) and 3D worlds.
- `src/screens/`: DOM screen renders and route views.
- `api/[...route].js`: Vercel serverless proxy with rate limiting and local mocks.
- `apps-script/`: Google Sheets backend (authoritative persistence for non-guest users).

## Teaching Doctrine (Learn Quests & Stages)

- **Tabletop as the answer:** Pieces are physical objects on a plate (flat in 2D / 3D Off). Answers are constructed on the table, not through multiple-choice questions (unless reading-only).
- **Controls & mechanics:** Every drag has a two-tap twin. Ordering is dragging into place on a rail. Snaps represent physical proximity, never arbitrary locks.
- **Real scientific terminology:** Say the real term the first time with a one-clause gloss, then use only that term. Never use euphemisms ("push" for pressure, "room" for volume) or fiction names for apparatus or quantities. Glossaries reside in `src/learn/glossary/<world>.js`.
- **Live mechanism views:** Every instrument has an active mechanism view moving in time (in 3D and 2D `live`), reflecting physical processes.
  - Kits declare it as a pure painter of state and clock (`b.clock`); the 3D crowd is the same painter read through `pans-3d.js` `dressRecorded`. Ember Reach: `table/kits/heat-motion.js` (cup, `lattice`, `rxn`, `curve`, `lead`, energy diagram, plot, stack). Mirrowen: `table/kits/matter-motion.js` (state-by-state particle motion and `glide`), painters made time-aware in place across the `matter-*.js` files, `matter-lead.js` clips; the piston of the press is dragged (`tapZones`, `drag.invert`). A miss restarts the glides via `kit.onMiss`. Every predict stage carries a `lead` clip of a neighbouring case. `tools/verify-teaching-ember.mjs` (in `verify:teaching`) enforces it.
- **Never give away answers:**
  - A prompt states the objective, never the route (≤25 words, one plain imperative/question, no "!", no setting clause).
  - How tools work is explained on the object or via Tour; which move solves the stage is never revealed.
  - Hint ladder: exactly three one-sentence rungs (1: which control, 2: what to compare, 3: method/structure, never the answer).
  - Briefings are ≤2 sentences, introducing tools immediately before the stage that requires them.
  - The Tour explains tools in three beats (what it is, what to do, what it tells you) without revealing solutions.
- **Predict first, test second:** Commit a hypothesis on a stripped table before revealing the instrument or running the trial. Predictions are never graded.
- **Self-contained evidence:** Every stage is solvable from bench evidence without external lookup. Necessary formulas/constants are given on a plate, readout, or hint rung 3.
- **Investigation, not combat:** Ordinary misses are "missed trials" with explanatory reasons. Foes are dispersed, never killed. Only bosses engage in combat (`encounter`, single cosmetic health bar).
- **Rewards & debriefs:** Every stage awards a reward card (1–3 sentences) naming the concept. Quests conclude with Vess's debrief story animation (3–5 beats showing the mechanism, no purely decorative animations).

## Hard Engineering Rules

- **Learn track pays no XP:** Nothing in `src/learn/` calls `session.addXp`, `api.gradeStage`, or `api.completeQuest`. Practice problems gate nothing and pay no XP.
- **State persistence:** Google Sheets is master; `localStorage` is the cache (`PlayerState` merged via `src/shared/statemerge.js`). Sync never crashes or logs out the user; transient backend failures throw `BACKEND_BUSY`.
- **Guest mode:** `session.startGuest()` (`#landing-guest-btn` / `#login-guest-btn`) operates entirely in `localStorage` without Sheet traffic. Use guest mode for all automated checks that require authentication bypass.
- **XP & scoring:** Server XP is authoritative; points are flat and idempotent per stage. Guild score is a mean (`mean(xp>0) * (0.75 + 0.5*active/roster)`), never labeled "XP". Telemetry never fabricates readings.
- **Physical honesty:** Flat representations (spectra, graphs) are drawn flat; spatial concepts (orbitals, lattices, molecules) are 3D objects. What is drawn is what is graded.
- **Simplicity & focus:** Exactly one decision per stage. The bench holds only what that decision requires; remove clutter instead of explaining it.
- **Spatial layout & collisions:** No physical overlaps in 3D worlds (`tools/lib/overlap.mjs`, tolerance 0.06 m). Pointer is never locked (`requestPointerLock` is a no-op). Single window listener for `X` key.
- **Dedicated views:** Full-screen dark backdrop for practice and worked problems; full-screen dedicated console layout for 3D Off (`.learn-quest-2d`).
- **UI lifecycle:** `mountConsole` must be the final statement in Charge Gardens stage render. The comms panel is the only fixed screen bolted to the bench.

## Commands & Verification

- `npm run dev`: Start local Vite dev server (:3000) with API proxy.
- `npm run build`: Production build into `dist/`.
- `npm run verify`: Complete test and verification suite (`verify:learn`, `verify:table`, `verify:story`, `verify:docs`, per-world checks, etc.).
- **Testing discipline:** The owner play-tests in the browser; agents do NOT test in the browser. Verify changes using `npm run verify`, `npm run build`, and Node scripts.

## Question Bank

All practice problems live in `src/learn/bank/<worldId>.json`, never in quest files.
- Each bench has exactly two practice problems (`src/ui/bench-practice.js`).
- Computational benches include one guided worked problem (`src/ui/worked-problem.js`).
- Numerical steps include `calc` expressions verified by `verify:learn`.
- Practice is skippable, gates no progress, and awards no XP.

## Aesthetic — "SCOURED PLATE" (Mandatory)

Hardware that has endured forty years in the dust and still functions.
- **Surfaces & Light:** Obsidian and titanium (`--plate-000...600`). Light is warm filament, not LED (nothing blooms; `box-shadow: 0 0 20px` is banned except true indicator lamps). Amber is a signal, never a surface.
- **Banned aesthetics:** Neon/synthwave glow, cyan, glassmorphism, candy gradients, rounded corners (except `--radius-full`), emoji in markup, fake status indicators, feature-card grids.
- **Typography & Geometry:** Quantico throughout (JetBrains Mono fallback for telemetry). Precision 1px durasteel bezel seams.
- **Copy discipline:** The interface does not advertise itself. Remove all unnecessary, marketing, or promotional text. Retain only necessary labels, rules, errors, chemical instruction, and narrative debriefs.

## Code & Docs Hygiene

- **Retire by archiving:** Never delete functional code, docs, or checks. Move them under `archive/<date>/` or `docs/archive/<date>/` and disconnect live wiring. Code in `archive/` is never built or verified.
