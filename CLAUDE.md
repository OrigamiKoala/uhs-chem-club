# Avalon — Engineering Reference

Avalon is the UHS Chemistry Club's competition portal for middle- and high-school students (ages 12 to 17).
The core doctrine is: **teach chemistry clearly, intuitively, and hands-on, without giving away answers.**

This file holds the engineering doctrine, hard rules, and commands.
- **Product truth & scope:** `PRODUCT.md` wins any dispute regarding scope, target audience, and the pitfall ledger.
- **Engine, worlds & layout details:** `docs/engineering/engine-and-worlds.md` holds how things are built, per-world notes, and layout details.
- **World plans & specifications:** `docs/plans/world-plans.md` consolidates all 14 world plans, CED maps, tabletop kits, and build records.
- **Aesthetic tokens:** `DESIGN.md` and `src/styles/tokens.css` hold visual tokens (SCOURED PLATE doctrine below is authoritative).
- **Teaching pass (2026-11):** `docs/teaching-pass/README.md` is the owner's guide to the final pass on the live worlds; `BRIEF.md` is the standard and method every agent follows, `PATTERNS.md` the redesigns to copy, `worlds/` the per-world notes and records, `prompts/` the prompts, `PROGRESS.md` the state. As of 2026-11-12, eleven worlds (`unit01`–`unit11`, 92 quest modules: 81 benches and 11 bosses, 597 stages) are live; `unit12-lodestone.md`, `unit13-thornmere.md` and `unit14-cinder-halo.md` hold first-build plans for the three unbuilt worlds.
- **Narrative & AP audit:** `docs/story/bible.md` holds lore; `docs/AP-coverage-audit.md` tracks AP Chemistry CED alignment.

## Codebase Architecture

- `src/main.js`: Application bootstrapper (stage, HUD, and hash router).
- `src/learn/`: Learn track (curriculum registry, quest definitions, and the `Tabletop` engine over `table/kits/`).
- `src/quest3d/`: Charge Gardens chamber (Quest 1 / competition campaign).
- `src/three/`: Persistent WebGL stage (`stage.js`) and 3D worlds.
- `src/screens/`: DOM screen renders and route views.
- `src/ui/calculator.js`: Digital scientific calculator with Scoured Plate aesthetic, chemistry constants palette, and auto-fill integration next to stage submit keys.
- `api/[...route].js`: Vercel serverless proxy with rate limiting and local mocks.
- `apps-script/`: Google Sheets backend (authoritative persistence for non-guest users).

## Teaching Doctrine (Learn Quests & Stages)

- **The standard of a stage that teaches:** Hold every stage to the seven criteria:
  1. *Student knows the question before touching anything:* states what we are trying to find out in words a 13-year-old has, not an operational instruction ("Set marker to...").
  2. *Cause is visible on the bench while acting:* particles, charges, energy, or bonds respond to actions. Moving models must directly connect action to result, never sitting as decorative wallpaper.
  3. *Answer cannot be reached without the idea:* cannot pass by ranking black-box instrument readouts, dial matching, or copying hints.
  4. *Every word known or glossed:* real terms in short plain sentences. Avoid both euphemisms/ciphers ("push", "room", "knocks", "chips", "needle") and college textbook jargon ("lateral overlap...", "non-negative probability density"). No anthropomorphic motives for atoms ("happy", "wants").
  5. *As simple as the idea allows, and no simpler:* one decision; direct answer forms (no decoding entry puzzles like "degrees short of 109.5°"); honest clauses for scientific limits.
  6. *Getting stuck leads to understanding, not the answer:* hint ladder (1: where to look/control, 2: what to notice/compare, 3: how to reason; never the answer, move, or arithmetic); misses name table evidence.
  7. *Needs nothing the track has not taught:* respect prerequisites (`BUILDS_ON`).
- **"Never give away answers" does not mean "never explain":** Teach the idea on one case (via brief stage briefing of ≤2 sentences or predict lead clip on a neighbouring case), then ask the student to solve a different case!
- **Tabletop as the answer:** Pieces are physical objects on a plate (flat in 2D / 3D Off). Answers are constructed on the table, not through multiple-choice questions (unless reading-only).
- **Controls & mechanics:** Every drag has a two-tap twin. Ordering is dragging into place on a rail. Snaps represent physical proximity, never arbitrary locks. Direct answer forms only.
- **Real scientific terminology:** Say the real term the first time with a one-clause gloss, then use only that term. Glossaries reside in `src/learn/glossary/<world>.js`.
- **Live mechanism views:** Every instrument has an active mechanism view moving in time (in 3D and 2D `live`), reflecting physical processes.
  - **Heat is never drawn as a particle, and every particle has a named owner.** No painter flies "packets" of energy between things. Heat is shown as it passes: the particles touching the hotter thing change motion first and the change spreads from the place of contact (`heat-motion.js` `spreadT`). Each block's particles stand in a named box under that block (`latticeLayout`); in a cup, dots are the bath and rings are the sample or heater, with a key. Drawn motion is stretched (`vigour`) because real speeds differ by under a tenth across a bench's range; only the swing follows temperature, so a gliding reading never makes a particle jump. `verify:teaching` enforces the named boxes and the absence of a packet painter.
  - Kits declare it as a pure painter of state and clock (`b.clock`); the 3D crowd is the same painter read through `pans-3d.js` `dressRecorded`. Ember Reach: `table/kits/heat-motion.js` (cup, `lattice`, `rxn`, `curve`, `lead`, energy diagram, plot, stack). Mirrowen: `table/kits/matter-motion.js` (state-by-state particle motion and `glide`), painters made time-aware in place across the `matter-*.js` files, `matter-lead.js` clips; the piston of the press is dragged (`tapZones`, `drag.invert`). A miss restarts the glides via `kit.onMiss`. Every predict stage carries a `lead` clip of a neighbouring case. `tools/verify-teaching-ember.mjs` (in `verify:teaching`) enforces it.
- **Never give away answers:**
  - A prompt states what to find out before touching anything, never the route (≤25 words, one plain imperative/question, no "!", no setting clause).
  - How tools work is explained on the object or via Tour; which move solves the stage is never revealed.
  - Hint ladder: exactly three one-sentence rungs (1: where to look / control, 2: what to compare / notice, 3: how to reason; never the answer or arithmetic).
  - Briefings are ≤2 sentences, putting telling before doing immediately before the stage that requires it.
  - The Tour explains tools in three beats (what it is, what to do, what it tells you) without revealing solutions.
- **Predict first, test second:** Commit a hypothesis on a stripped table before revealing the instrument or running the trial. Predictions are never graded. Shared `src/learn/table/kits/commit-gate.js` gates `Run` actions and hides numeric readouts behind `WeakMap` state keyed by `table` (`isCommitted`, `gateRun`, `revealTable` on `onMiss`) so `verify:table` remains deterministic.
- **Self-contained evidence:** Every stage is solvable from bench evidence without external lookup. Necessary formulas/constants are given on a plate, readout, or hint rung 3. Pure plate-and-type worksheet stages are banned.
- **Investigation, not combat:** Ordinary misses are "missed trials" with explanatory reasons. Foes are dispersed, never killed. Only bosses engage in combat (`encounter`, single cosmetic health bar).
- **Rewards & debriefs:** Every stage awards a reward card (1–2 short sentences, at most 40 words) confirming the concept seen; never introducing the concept or carrying the lesson after the fact. Quests conclude with Vess's debrief story animation (3–5 beats showing the mechanism, no purely decorative animations).

## Quicklight notes

- `src/learn/table/kits/rate-3d.js` dresses `kvessel`, `lead` and `collview` at 3D On (glass tanks, swimming spheres, collision spheres). Graphs, plots and energy profiles stay flat on the plate by owner decision; do not stand them up. `q1-watch` has 7 stages, `q3-time` 7, `q4-collide` 9. New fixture `arrplot` (ln k against 1/T). Dialled vessels keep the window below the dial row (`topY` 16.5) or the knob hides under the glass. At 3D On the flat window and particles are skipped (`b.bodies`) so only the 3D tank shows.
- Traps: `src/three/materials/quicklight-textures.js` must return the `{albedo,height,roughness,ao}` contract (a wrong shape blanks the whole world); world-data roads use `w`, not `width`; the flat run clocks are keyed per scope (`b.scope === '3d'`).

## Hard Engineering Rules

- **Learn track pays no XP:** Nothing in `src/learn/` calls `session.addXp`, `api.gradeStage`, or `api.completeQuest`. Practice problems gate nothing and pay no XP.
- **State persistence:** Google Sheets is master; `localStorage` is the cache (`PlayerState` merged via `src/shared/statemerge.js`). Sync never crashes or logs out the user; transient backend failures throw `BACKEND_BUSY`.
- **Guest mode:** `session.startGuest()` (`#landing-guest-btn` / `#login-guest-btn`) operates entirely in `localStorage` without Sheet traffic. Use guest mode for all automated checks that require authentication bypass.
- **XP & scoring:** Server XP is authoritative; points are flat and idempotent per stage. Guild score is a mean (`mean(xp>0) * (0.75 + 0.5*active/roster)`), never labeled "XP". Telemetry never fabricates readings.
- **Physical honesty:** Flat representations (spectra, graphs) are drawn flat; spatial concepts (orbitals, lattices, molecules) are 3D objects. What is drawn is what is graded.
- **Simplicity & focus:** Exactly one decision per stage. The bench holds only what that decision requires; remove clutter instead of explaining it.
- **Scientific Calculator:** Every stage provides a `Calc` button next to the Submit button. It opens an entry-line digital scientific calculator positioned on the right side slightly above the bottom controls (avoiding overlap with the Submit button and explanation card), styled to Scoured Plate hardware tokens, moveable via header dragging, dismissible via close key or Escape, with Enter evaluation, Ans chaining (e.g. `5+3 [enter]` then `*2` -> `Ans * 2 = 16`), chemistry constants, and stage input insertion.
- **Spatial layout & collisions:** No physical overlaps in 3D worlds (`tools/lib/overlap.mjs`, tolerance 0.06 m). Pointer is never locked (`requestPointerLock` is a no-op). Single window listener for `X` key.
- **Frame cost (walkable worlds and deployed benches):** Draw calls are the budget. A prop that never moves is one mesh per material (`mergeStatic`, or merged in its builder when the group is `phys` or `noMerge` and the world's bake skips it); a world built with a renderer then bakes those together per material per 40 m square (`consolidateStatic`, last step of each world's `bakeStatics`), so anything that will ever move, hide or be looked up by its mesh must sit under `noMerge` or `mover`. A world built without a renderer (every Node check) keeps its props separate. An open bench keeps the sun's shadow map live only while something it stands in the world is moving (`shadow-pace.js` `markWorldOwn` / `visitorsMoving`, read by each world as `benchMoving`); a shadow-casting part of a bench must not be re-posed or re-uploaded on frames where it has not changed. No `backdrop-filter` on anything that stays on screen over the live canvas (HUD, plates, walk cards, bench cards, calculator). Measure with `tools/perf-worlds.mjs` and `tools/perf-bench-rest.mjs`.
- **Dedicated views:** Full-screen dark backdrop for practice and worked problems; full-screen dedicated console layout for 3D Off (`.learn-quest-2d`).
- **UI lifecycle:** `mountConsole` must be the final statement in Charge Gardens stage render. The comms panel is the only fixed screen bolted to the bench.

## Commands & Verification

- `npm run dev`: Start local Vite dev server (:3000) with API proxy.
- `npm run build`: Production build into `dist/`.
- `npm run verify`: Complete test and verification suite (`verify:learn`, `verify:table`, `verify:story`, `verify:docs`, per-world checks, etc.).
- `node tools/teaching-report.mjs <unitNN> [quest] [--read|--totals]`: fault flags per stage, or a bench as plain text in play order. A reading aid for the teaching pass, not a check; word lists in `tools/teaching-words.json`.
- `node tools/perf-worlds.mjs [world ...] [-v]`: per-world draw calls, triangles, shadow casters, lights and `update()` time, built headlessly as drawn (`--props` for the unmerged world the checks see). `node tools/perf-bench-rest.mjs [-v]`: which deployed table stages never let the sun's shadow rest. Reading aids, not checks.
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
- **World plans consolidation:** Live world specifications reside in `docs/plans/world-plans.md` and their respective `<world>-world.md` files; per-bench notes and retired passes are preserved under `docs/archive/<date>/`. User prompts and audit records are preserved in `docs/`.
