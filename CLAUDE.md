# Avalon — Engineering Reference

Avalon is the UHS Chemistry Club's competition portal for middle- and high-school students (ages 12 to 17).
The core doctrine is: **teach chemistry clearly, intuitively, and hands-on, without giving away answers.**

- **Product truth & scope:** `PRODUCT.md` wins any dispute regarding scope, target audience, and the pitfall ledger.
- **Engine, worlds & layout details:** `docs/engineering/engine-and-worlds.md` holds how things are built, per-world notes, and layout details.
- **World plans & specifications:** `docs/plans/world-plans.md` consolidates world plans, CED maps, tabletop kits, and build records.
- **Aesthetic tokens:** `DESIGN.md` and `src/styles/tokens.css` hold visual tokens (SCOURED PLATE doctrine below is authoritative).
- **Teaching pass:** `docs/teaching-pass/README.md` and `docs/teaching-pass/PROGRESS.md` track the teaching pass standard and status.
- **Narrative & AP audit:** `docs/story/bible.md` holds lore; `docs/AP-coverage-audit.md` tracks AP Chemistry CED alignment.

## Codebase Architecture

- `src/main.js`: Application bootstrapper (stage, HUD, and hash router).
- `src/learn/`: Learn track (curriculum registry, quest definitions, and tabletop kits in `src/learn/table/kits/`).
- `src/quest3d/`: Charge Gardens chamber (Quest 1 / competition campaign).
- `src/three/`: Persistent WebGL stage (`src/three/stage.js`) and 3D worlds.
- `src/screens/`: DOM screen renders and route views.
- `src/ui/calculator.js`: Digital scientific calculator.
- `api/[...route].js`: Vercel serverless proxy with rate limiting and local mocks.
- `apps-script/`: Google Sheets backend (authoritative persistence for non-guest users).

## Teaching Doctrine (Learn Quests & Stages)

- **The seven criteria of a stage that teaches:**
  1. *Question known upfront:* Prompt states what to find out before touching anything (≤25 words, plain imperative/question, no operational instructions like "Set marker to...").
  2. *Cause is visible on the bench while acting:* Particles, charges, energy, or bonds respond to actions; moving models connect action directly to result.
  3. *Answer requires the concept:* Cannot pass by ranking black-box readouts, dial matching, or copying hints.
  4. *Real scientific terminology:* Real terms in short plain sentences, glossed on first use (`src/learn/glossary/`). Avoid euphemisms ("push", "room", "knocks") and college jargon. No anthropomorphic motives for atoms ("happy", "wants").
  5. *Simplicity & focus:* Exactly one decision per stage; direct answer forms (no decoding entry puzzles).
  6. *Hint ladder:* Exactly three one-sentence rungs (1: where to look / control, 2: what to compare / notice, 3: how to reason; never the answer or arithmetic).
  7. *Self-contained & builds on prerequisites:* Solvable from bench evidence without external lookup; respects `BUILDS_ON`.
- **Explain without giving away answers:** Teach the idea on one case (briefing ≤2 sentences or predict lead clip), then ask the student to solve a different case. The Tour explains tools in three beats (what it is, what to do, what it tells you) without revealing solutions.
- **Tabletop as the answer:** Answers are constructed on the table (flat in 2D / 3D Off), not through multiple-choice questions (unless reading-only). Every drag has a two-tap twin.
- **Predict first, test second:** Commit a hypothesis on a stripped table before revealing runnable instruments. Predictions are never graded (`src/learn/table/kits/commit-gate.js`).
- **Live mechanism views:** Instruments have active mechanism views moving in time (3D and 2D `live`), reflecting physical processes. Heat is never drawn as a particle; energy transfer is shown via particle motion spreading from contact.
- **Investigation, not combat:** Ordinary misses are "missed trials" with explanatory reasons. Foes are dispersed, never killed. Only bosses fight (`encounter`, single cosmetic health bar).
- **Rewards & debriefs:** Every stage awards a reward card (1–2 short sentences, ≤40 words) confirming the concept seen; never introducing concepts after the fact. Quests conclude with Vess's debrief story animation.

## Hard Engineering Rules

- **Learn track pays no XP:** Nothing in `src/learn/` calls `session.addXp`, `api.gradeStage`, or `api.completeQuest`. Practice problems gate nothing and pay no XP.
- **State persistence:** Google Sheets is master; `localStorage` is cache (`PlayerState` merged via `src/shared/statemerge.js`). Sync failures throw `BACKEND_BUSY` and never log out the user.
- **Guest mode:** `session.startGuest()` runs entirely in `localStorage` without Sheet traffic; use for automated checks.
- **XP & scoring:** Server XP is authoritative; points are flat and idempotent per stage. Guild score is a mean (`mean(xp>0) * (0.75 + 0.5*active/roster)`), never labeled "XP". Telemetry never fabricates readings.
- **Physical honesty:** Flat representations (spectra, graphs) are drawn flat; spatial concepts (orbitals, lattices, molecules) are 3D objects. What is drawn is what is graded.
- **Simplicity & focus:** Exactly one decision per stage. The bench holds only what that decision requires; remove clutter instead of explaining it.
- **Scientific Calculator:** Every stage provides a `Calc` button opening an entry-line digital scientific calculator with constants palette, Ans chaining, and stage input insertion.
- **Spatial layout & collisions:** No physical overlaps in 3D worlds (`tools/lib/overlap.mjs`, tolerance 0.06 m). Pointer is never locked (`requestPointerLock` is a no-op). Single window listener for `X` key.
- **Frame cost:** Draw calls are the budget. Static props use `mergeStatic` / `consolidateStatic`; moving meshes stay under `noMerge` or `mover`. Keep shadow maps resting when idle (`shadow-pace.js`). No `backdrop-filter` over the live canvas. Measure with `tools/perf-worlds.mjs` and `tools/perf-bench-rest.mjs`.
- **Dedicated views & UI lifecycle:** Full-screen dark backdrop for practice/worked problems; dedicated layout for 3D Off (`.learn-quest-2d`). `mountConsole` must be the final statement in Charge Gardens stage render.

## Commands & Verification

- `npm run dev`: Start local Vite dev server (:3000) with API proxy.
- `npm run build`: Production build into `dist/`.
- `npm run verify`: Complete test and verification suite (`verify:learn`, `verify:table`, `verify:story`, `verify:docs`, per-world checks, etc.).
- Reading aids (not checks): `node tools/teaching-report.mjs <unitNN> [quest] [--read|--totals]`, `node tools/perf-worlds.mjs`.
- **Testing discipline:** The owner play-tests in the browser; agents do NOT test in the browser. Verify changes using `npm run verify`, `npm run build`, and Node scripts.

## Question Bank

All practice problems live in `src/learn/bank/<worldId>.json`, never in quest files.
- Each bench has exactly two practice problems (`src/ui/bench-practice.js`).
- Computational benches include one guided worked problem (`src/ui/worked-problem.js`).
- Numerical steps include `calc` expressions verified by `verify:learn`.
- Practice is skippable, gates no progress, and awards no XP.

## Aesthetic — "SCOURED PLATE" (Mandatory)

Hardware that has endured forty years in the dust and still functions.
- **Surfaces & Light:** Obsidian and titanium (`--plate-000...600`). Warm filament light, no LED blooms (`box-shadow: 0 0 20px` is banned except true indicator lamps). Amber is a signal, never a surface.
- **Banned aesthetics:** Neon glow, cyan, glassmorphism, candy gradients, rounded corners (except `--radius-full`), emoji in markup, fake status indicators, feature-card grids.
- **Typography & Geometry:** Quantico throughout (JetBrains Mono fallback for telemetry). Precision 1px bezel seams.
- **Copy discipline:** The interface does not advertise itself. Remove all unnecessary, marketing, or promotional text. Retain only necessary labels, rules, errors, chemical instruction, and narrative debriefs.

## Code & Docs Hygiene

- **Retire by archiving:** Never delete functional code, docs, or checks. Move them under `archive/<date>/` or `docs/archive/<date>/` and disconnect live wiring. Code in `archive/` is never built or verified.
- **World plans consolidation:** Live world specifications reside in `docs/plans/world-plans.md` and their respective `<world>-world.md` files; per-bench notes and retired passes are preserved under `docs/archive/<date>/`.
