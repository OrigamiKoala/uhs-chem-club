# Avalon — Engineering Reference

Avalon is the UHS Chemistry Club's competition portal for middle- and high-school students (ages 12–17). Core doctrine: **teach chemistry clearly, intuitively, and hands-on, without giving away answers.**

## Key Docs

- `PRODUCT.md` — Product truth, scope, audience (including beginner-first side quests), pitfall ledger, and full 22 teaching principles (wins any scope dispute).
- `DESIGN.md` & `src/styles/tokens.css` — Visual tokens and SCOURED PLATE design system.
- `docs/engineering/engine-and-worlds.md` — Engine architecture, per-world notes, and layout details.
- `docs/plans/world-plans.md` — Consolidated world plans, CED maps, and tabletop kits (`docs/world-build-prompt.md`, `docs/world-rebuild-prompt.md`, `docs/plans/world-distinction-plan.md`).
- `docs/teaching-pass/README.md` & `docs/teaching-pass/PROGRESS.md` — Teaching pass standard and status.
- `docs/plans/npc-plan.md` — Wandering, talkable NPC crews (Rocketbox models): six per Learn world, built on all 14.
- `.agents/skills/quest-builder/SKILL.md` — Side quest (Contract) builder skill (beginner-friendly puzzle quests assuming no chemistry knowledge); specs and ideas live in `docs/quests/` (`docs/quests/side-quest-ideas.md`).
- `docs/story/bible.md`, `docs/story/fifth-guild-quest-plan.md`, & `docs/AP-coverage-audit.md` — Lore, low-text Fifth Guild quest integration plan, and AP Chemistry CED alignment.

## Codebase Map

- `src/main.js` — App bootstrapper (stage, HUD, hash router).
- `src/learn/` — Learn track (curriculum registry `curriculum.js` where Beyond AP quests set `optional: true` so they never block progression or boss/world completion and Beyond AP worlds `unit12`–`unit14` set `beyondAp: true`, quests, tabletop kits in `src/learn/table/kits/`, practice banks in `src/learn/bank/`). A kit's `dress3d` stands a fixture's picture up in space at 3D On (gas crowds `gas-3d.js`; Ligar's overlapping orbitals as live 3D surfaces `mo-3d.js`), and its flat painter then skips what the 3D shows (`b.bodies`).
- `src/quest3d/` — Charge Gardens chamber (Quest 1 / competition campaign).
- `src/three/` — Persistent WebGL stage (`src/three/stage.js`) and 3D worlds.
- `src/npc/` & `src/three/npc/` — World crews (NPCs): pure data/sim/talk (`crews.js` registry, `tallow-crew.js` + `crews/<world>.js`, `crew-sim.js`, `talk.js`, `models.js`) and runtime (`attach.js` called by every Learn world, `crew.js`, `figures.js`); talk card `src/ui/npc-card.js`; models in `public/models/npc/` built by `tools/npc/build-models.mjs` (sources in git-ignored `assets-src/rocketbox/`); posts proposed by `tools/npc/pick-posts.mjs`; checked by `verify:npc`.
- `src/npc/intros.js` + `src/npc/intros/<world>.js` & `src/three/mystery/` — how each world opens its benches and shows its trouble (plan `docs/plans/mystery-walkup-plan.md`). Pure data per world: `STYLE` (what makes its openings different), `SYMPTOM` (the world's arrival trouble until its boss is beaten: lamps `sputter`/`dim`, kit props) and `INTROS` (a quest whose question has something to see: its problem prop and an opening scene built from `intros/scenes.js` shapes — hooded figure, something happens, walk-up, overheard, called over, radio, alarm, trail). Runtime: `site.js` (`world.mystery`, built by `attachCrew` before the crew's grid: props, effects, lamp symptom, the cloak), `director.js` (the scripted scene, controls off, ends back at the bench; `stage.playIntro` from `screens/learn-world.js` on both `[E]` walk-up and Sites-list teleport), `props.js`/`effects.js` (primitive kit, no textures or lights), `cloak.js`. Spots in `intros/spots.js` from `tools/npc/pick-spots.mjs`; checked (including a headless playthrough of every scene) by `verify:intros`.
- `src/story/` — Fifth Guild mystery data (`saga.js` with 4-Question Act definitions, 15 clues, low-text `EPISODES` without 3-paragraph walls; `quest-story.js` with `role`, `mystery` (the question a quest opens on: asked by its opening scene, or by the question card `src/ui/case-open.js`, kept as the stage 1 lead and shown again above the pin) + `pin` Case Pins (its answer) on non-`Toolkit` quests; `intro-shown.js` tells the bench a scene already asked; `quest1.js`; `lore.js`; `story-modal.js`).
- `src/screens/` & `src/ui/` — DOM screens (`casefile.js` unified 4-Question Case Board showing all seen clues, messages, briefings, and bench Case Pins in one place), route views, and shared UI (`calculator.js` with scientific-notation entry unit scaling, `galaxy-map.js`, `tallow-explainers.js` custom reward animations, `photoelectric-explainer.js`, `orbital-3d-viewer.js`).
- `src/ui/cutscene/` & `src/ui/cutscene-player.js` — Lore cutscenes: letterboxed 2D canvas scenes for the campaign opening (`intro.js`) and each world's arrival, played as the pre-launch briefing. Every world tells its own story (`story.js` cuts a list of shots: the world's incident from `worlds-a/b/c.js` under the `arrival` line, then three shots of its own plot from `plots-a/b/c.js` ending under the `objective` line — e.g. a searchlight chase on Erebus, a gold rush on Tallow, a winch rescue on Ligar, a blackout on Brinewire); `shot.js` is the camera/weather/light kit (camera push/tilt, night grade with additive lamp cones and pools, rain/snow/ash/embers/fog, plumes, frost, real reflections and heat shimmer read back from the canvas, lander flight and lamps, wrist-device insets); `arrival.js` is the old shared 4-beat shape, kept only as a fallback for a world without a plot; figures/landers/Fifth mark in `kit.js`. Each world config sets a key light (`light: {x, y, color, power, sun?}`, plus `clouds`, `rays`, `nebula`); `scape.js` paints sky glow, four aerial-perspective ridge ranges with strata and lit crests, and textured ground from it, figures/lander/props read it via `keyLight()`, and `frame(ctx, fade, clock)` applies the closing grade (light wash, vignette, film grain) then resets it. Lines come from `CAMPAIGN_STORY` and each episode's `arrival`/`objective`; `story-modal.js` plays them in place of the text card. Pure functions of scene time, painted every 0.1 s on a stub by `verify:story`, which also fails any call a real canvas throws on (negative radius, gradient stop outside 0..1).
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
- **Practice bank:** All practice problems live in `src/learn/bank/<worldId>.json` (2 per bench; 1 worked problem for computational benches) plus `src/learn/bank/worked-deep.json` (22 multi-concept `AP` and `Olympiad` worked problems with `strategy`, step `beat`, and `takeaway` cues, playable in `src/ui/worked-problem.js` with the built-in `calculator.js` and filterable in the Practice / Drill Deck, which pulls only from completed quests/worlds on a full-screen black backdrop with calculator access and no streaks or Daily Set); every `calc` expression is verified by `verify:learn` and `verify-drills.mjs`.
- **Persistence & guest mode:** Google Sheets is master; `localStorage` is cache (`src/shared/statemerge.js`). Sync failures throw `BACKEND_BUSY` without logging out. Use `session.startGuest()` for local/automated checks.
- **Physical honesty:** Flat things (spectra, graphs) drawn flat; spatial concepts (orbitals, lattices, molecules) in 3D. What is drawn is what is graded.
- **3D & performance:** No physical overlaps (`tools/lib/overlap.mjs`, 0.06 m tolerance). Pointer is never locked. Fixed pooled `PointLight`s only (`src/three/lamp-pool.js`). Static props use `mergeStatic`/`consolidateStatic`; keep shadows resting when idle (`shadow-pace.js`); no `backdrop-filter` over the live canvas. DPR capped 1.5 (paced down on planets); nothing new may compile or upload textures on the frame it first appears (`warmWorld`, `Crew.warm`).
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
