# Avalon — Engineering Reference

Avalon is the UHS Chemistry Club's competition and learning portal for middle- and high-school students (ages 12–17). Core doctrine: **teach chemistry clearly, intuitively, and hands-on, without giving away answers.**

## Key Docs

- `PRODUCT.md` — Scope, audience, pitfall ledger, and 22 teaching principles (wins any scope dispute).
- `DESIGN.md` & `src/styles/tokens.css` — SCOURED PLATE visual system and tokens.
- `docs/engineering/engine-and-worlds.md` — Engine architecture, per-world notes, and tabletop layout rules.
- `docs/plans/world-plans.md` — World plans, CED maps, and tabletop kits.
- `docs/teaching-pass/README.md` & `PROGRESS.md` — Teaching pass standard and status.
- `.agents/skills/quest-builder/SKILL.md` — Side quest (Contract) builder (`docs/quests/`).
- `.agents/skills/playtest-review/SKILL.md` — Browser playtest audit workflow (`docs/feedback*.md`).
- `docs/story/bible.md` & `docs/AP-coverage-audit.md` — Lore and AP Chemistry alignment.

## Codebase Map

- `src/main.js` — App bootstrapper (stage, HUD, hash router).
- `src/learn/` — Learn track: `curriculum.js`, quests, tabletop engine (`engine/`, `table/`, `table/kits/`), glossary (`glossary/`), and practice banks (`bank/`).
- `src/quest3d/` — Charge Gardens chamber (Quest 1 / competition campaign).
- `src/three/` — Persistent WebGL stage (`stage.js`), 3D worlds, NPC runtime (`npc/`), and mystery intros (`mystery/`).
- `src/npc/` — Pure NPC crew data, sim, talk, and world intro/symptom definitions.
- `src/story/` — Fifth Guild mystery data (`saga.js`, `quest-story.js`, `lore.js`, `story-modal.js`).
- `src/screens/` & `src/ui/` — DOM screens, route views, shared UI, explainers, and 2D canvas cutscenes (`ui/cutscene/`).
- `api/[...route].js` & `apps-script/` — Vercel serverless proxy and Google Sheets backend.

## Teaching Doctrine (Learn Track)

Full rules in `PRODUCT.md`. Non-negotiables:
- **Question upfront & focused:** Prompt states what to find (≤25 words, no how-to instructions). One decision per stage; solvable from bench evidence alone.
- **Visible cause & real terms:** Models respond directly to student action (heat via particle motion, never as a particle). Use real terms glossed on first use (`src/learn/glossary/`); no euphemisms or anthropomorphic atom motives ("happy", "wants").
- **Tabletop as the answer:** Constructed on the table with 2D/3D Off parity, not MCQs (unless reading-only). Every drag has a two-tap twin.
- **Predict first, test second:** Commit hypothesis before revealing instruments (`commit-gate.js`); predictions are never graded.
- **Hints & rewards:** 3 one-sentence hint rungs (where to look → what to compare → how to reason; never the answer). Reward card (≤40 words) confirms what was seen; never introduces new concepts.
- **Trials, not combat:** Misses are "missed trials" with reasons. Foes are dispersed, never killed; only bosses fight.

## Hard Engineering Rules

- **Learn track pays no XP:** `src/learn/` never calls `session.addXp`, `api.gradeStage`, or `api.completeQuest`. Practice gates nothing and pays no XP.
- **Persistence & guest mode:** Google Sheets is master; `localStorage` is cache (`src/shared/statemerge.js`). Sync failures throw `BACKEND_BUSY` without logging out. Use `session.startGuest()` for local/automated checks.
- **Physical honesty & 2D/3D parity:** Flat things (spectra, graphs, Lewis/skeletal notation) stay flat; spatial concepts (orbitals, lattices, molecules) use 3D at 3D On and fall back cleanly in `.learn-quest-2d` at 3D Off. What is drawn is what is graded.
- **3D & performance:** No physical overlaps (`tools/lib/overlap.mjs`, 0.06 m tolerance). Never lock pointer. Fixed pooled `PointLight`s only (`src/three/lamp-pool.js`). Merge static props; keep shadows resting when idle (`shadow-pace.js`); no `backdrop-filter` over live canvas; DPR capped 1.5; warm worlds/crews before first frame.
- **UI lifecycle:** `mountConsole` must be the final statement in Charge Gardens stage render.

## Aesthetic — "SCOURED PLATE"

- **Look:** Obsidian/titanium (`--plate-000...600`), warm filament light, amber as signal only, Quantico (JetBrains Mono fallback), 1px bezel seams.
- **Banned:** Neon/LED blooms (`box-shadow: 0 0 20px` except true indicator lamps), cyan, glassmorphism, candy gradients, rounded corners (except `--radius-full`), emoji in markup, fake status indicators, feature-card grids.
- **Copy:** No marketing or promotional text; only necessary labels, rules, errors, instruction, and debriefs.

## Commands & Hygiene

- `npm run dev` — Local Vite dev server (`:3000`) with API proxy.
- `npm run build` — Production build into `dist/`.
- `npm run verify` — Full verification suite (`tools/verify-all.mjs`) + build.
- **Testing:** Do not test in the browser unless the user asks (`playtest-review` counts); verify via `npm run verify` and `npm run build`. Dev helper: `window.__lqStage(n)` opens stage `n` of an open bench.
- **Retire by archiving:** Never delete functional code, docs, or checks; move to `archive/<date>/` or `docs/archive/<date>/` and disconnect live wiring.
