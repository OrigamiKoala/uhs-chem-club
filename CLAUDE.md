# Avalon — Engineering Reference

Avalon is the UHS Chemistry Club's competition portal for middle- and high-school students (ages 12–17). Core doctrine: **teach chemistry clearly, intuitively, and hands-on, without giving away answers.**

## Key Docs

- `PRODUCT.md` — Product truth, scope, audience, pitfall ledger, and full 12 teaching principles (wins any scope dispute).
- `DESIGN.md` & `src/styles/tokens.css` — Visual tokens and SCOURED PLATE design system.
- `docs/engineering/engine-and-worlds.md` — Engine architecture, per-world notes, and layout details.
- `docs/plans/world-plans.md` — Consolidated world plans, CED maps, and tabletop kits (`docs/world-build-prompt.md`, `docs/world-rebuild-prompt.md`, `docs/plans/world-distinction-plan.md`).
- `docs/teaching-pass/README.md` & `docs/teaching-pass/PROGRESS.md` — Teaching pass standard and status.
- `.agents/skills/quest-builder/SKILL.md` — Side quest (Contract) builder skill; specs live in `docs/quests/`.
- `docs/story/bible.md`, `docs/story/fifth-guild-quest-plan.md`, & `docs/AP-coverage-audit.md` — Lore, low-text Fifth Guild quest integration plan, and AP Chemistry CED alignment.

## Codebase Map

- `src/main.js` — App bootstrapper (stage, HUD, hash router).
- `src/learn/` — Learn track (curriculum registry, quests, tabletop kits in `src/learn/table/kits/`, practice banks in `src/learn/bank/`).
- `src/quest3d/` — Charge Gardens chamber (Quest 1 / competition campaign).
- `src/three/` — Persistent WebGL stage (`src/three/stage.js`) and 3D worlds.
- `src/story/` — Fifth Guild mystery data (`saga.js` with 4-Question Act definitions, 15 clues, low-text `EPISODES` without 3-paragraph walls; `quest-story.js` with `role` + `pin` Case Pins on non-`Toolkit` quests; `quest1.js`; `lore.js`; `story-modal.js`).
- `src/screens/` & `src/ui/` — DOM screens (`casefile.js` unified 4-Question Case Board showing all seen clues, messages, briefings, and bench Case Pins in one place), route views, and shared UI (`calculator.js` with scientific-notation entry unit scaling, `galaxy-map.js`, `tallow-explainers.js` custom reward animations, `photoelectric-explainer.js`, `orbital-3d-viewer.js`).
- `src/ui/cutscene/` & `src/ui/cutscene-player.js` — Lore cutscenes: letterboxed 2D canvas scenes for the campaign opening (`intro.js`) and each world's arrival (`arrival.js` shared 4-beat shape: incident → lander → local guide → evidence; per-world specs in `worlds-a/b/c.js`; figures/landers/Fifth mark in `kit.js`). Each world config sets a key light (`light: {x, y, color, power, sun?}`, plus `clouds`, `rays`, `nebula`); `scape.js` paints sky glow, four aerial-perspective ridge ranges with strata and lit crests, and textured ground from it, figures/lander/props read it via `keyLight()`, and `frame(ctx, fade, clock)` applies the closing grade (light wash, vignette, film grain) then resets it. Lines come from `CAMPAIGN_STORY` and each episode's `arrival`/`objective`; `story-modal.js` plays them in place of the text card. Pure functions of scene time, painted on a stub by `verify:story`.
- `api/[...route].js` & `apps-script/` — Vercel serverless proxy and Google Sheets backend.

## Teaching Doctrine (Learn Track)

Full rules in `PRODUCT.md`. Non-negotiables:
- **Question upfront & focused:** Prompt states what to find (≤25 words, no operational instructions). One decision per stage; solvable from bench evidence alone.
- **Visible cause & real terms:** Models/particles respond directly to student action (heat via particle motion, never as a particle). Use real terms glossed on first use (`src/learn/glossary/`); no euphemisms ("push", "room") or anthropomorphic atom motives ("happy", "wants").
- **Tabletop as the answer:** Constructed on the table (2D / 3D Off parity), not MCQs (unless reading-only). Every drag has a two-tap twin.
- **Predict first, test second:** Commit hypothesis before revealing instruments (`src/learn/table/kits/commit-gate.js`); predictions are never graded.
- **Hints & rewards:** 3 one-sentence hint rungs (where to look → what to compare → how to reason; never the answer). Reward card (≤40 words) confirms what was seen; never introduces new concepts.
- **Trials, not combat:** Ordinary misses are "missed trials" with reasons. Foes are dispersed, never killed; only bosses fight.

## Hard Engineering Rules

- **Learn track pays no XP:** `src/learn/` never calls `session.addXp`, `api.gradeStage`, or `api.completeQuest`. Practice gates nothing and pays no XP.
- **Practice bank:** All practice problems live in `src/learn/bank/<worldId>.json` (2 per bench; 1 worked problem for computational benches) plus `src/learn/bank/worked-deep.json` (22 multi-concept `AP Synthesis` and `Olympiad` worked problems with `strategy`, step `beat`, and `takeaway` cues, playable in `src/ui/worked-problem.js` with the built-in `calculator.js` and filterable in the Drill Deck); every `calc` expression is verified by `verify:learn` and `verify-drills.mjs`.
- **Persistence & guest mode:** Google Sheets is master; `localStorage` is cache (`src/shared/statemerge.js`). Sync failures throw `BACKEND_BUSY` without logging out. Use `session.startGuest()` for local/automated checks.
- **Physical honesty:** Flat things (spectra, graphs) drawn flat; spatial concepts (orbitals, lattices, molecules) in 3D. What is drawn is what is graded.
- **3D & performance:** No physical overlaps (`tools/lib/overlap.mjs`, 0.06 m tolerance). Pointer is never locked. Fixed pooled `PointLight`s only (`src/three/lamp-pool.js`). Static props use `mergeStatic`/`consolidateStatic`; keep shadows resting when idle (`shadow-pace.js`); no `backdrop-filter` over the live canvas.
- **UI lifecycle:** Dedicated `.learn-quest-2d` layout for 3D Off. `mountConsole` must be the final statement in Charge Gardens stage render.

## Aesthetic — "SCOURED PLATE"

- **Look:** Obsidian/titanium (`--plate-000...600`), warm filament light, amber as signal only, Quantico (JetBrains Mono fallback), 1px bezel seams.
- **Banned:** Neon/LED blooms (`box-shadow: 0 0 20px` except true indicator lamps), cyan, glassmorphism, candy gradients, rounded corners (except `--radius-full`), emoji in markup, fake status indicators, feature-card grids.
- **Copy:** No marketing or promotional text; only necessary labels, rules, errors, instruction, and debriefs.

## Commands & Hygiene

- `npm run dev` — Local Vite dev server (`:3000`) with API proxy.
- `npm run build` — Production build into `dist/`.
- `npm run verify` — Full verification suite (`tools/verify-all.mjs`) + build.
- **Aids:** `node tools/teaching-report.mjs <unitNN> [quest] [--read|--totals]`, `node tools/perf-worlds.mjs`, `node tools/world-shape.mjs`.
- **Testing:** Agents do NOT test in the browser; verify via `npm run verify` and `npm run build`.
- **Retire by archiving:** Never delete functional code, docs, or checks; move to `archive/<date>/` or `docs/archive/<date>/` and disconnect live wiring.
