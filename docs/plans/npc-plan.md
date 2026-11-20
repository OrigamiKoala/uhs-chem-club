# NPCs — implementation plan (pilot: Tallow, then every Learn world)

Status (2026-11-19): **built on all 14 Learn worlds** (Tallow pilot, then `unit02`–`unit14`), awaiting in-browser testing.
Engineering reference: `docs/engineering/engine-and-worlds.md` "Crews (NPCs)". Next: the user tests in the browser and reviews the
lines in `src/npc/crews/<world>.js`; fix what that finds.

## Progress

- [x] Bodies: realistic Rocketbox models (changed from procedural, see below), converted by `tools/npc/build-models.mjs`
- [x] Tallow posts, crew, lines, one side task (`src/npc/tallow-crew.js`)
- [x] Wandering, avoidance, talk interrupts (`src/npc/crew-sim.js`)
- [x] `[E] TALK` targets, talk card, carry chip, task item, Case Board note
- [x] `verify:npc`; `npm run verify` and `npm run build`
- [x] Rollout to the other 13 worlds (2026-11-19): 22 more Rocketbox bodies (28 total), six people and one side task per world,
      `src/npc/crews.js` registry + `three/npc/attach.js`, walk grid generalised (terraces and slopes by `maxStep`, arena closed by
      `keepOff`, filled a few ms a frame), posts from `tools/npc/pick-posts.mjs`, `verify:npc` runs every world
- [ ] In-browser test by the user (look, motion, lighting indoors, handset), all worlds
- [ ] User review of every world's lines

## Decisions (from the 2026-11-19 Q&A)

| Question | Answer |
|---|---|
| What talking does | Story & lore, chemistry flavor, small side tasks. Not bench pointers. |
| Idle behavior | Full wander: crews walk between buildings on schedules. |
| Dialogue UI | Short line card: `[E] TALK` → name + 1–3 short lines, tap through, closes. No choices. |
| Scope | One pilot world, Tallow (`unit01`). Roll out after you test it. |
| Bodies | ~~Procedural figures~~ → realistic rigged models (user, 2026-11-19: "hyper-realistic, not blocky"): Microsoft Rocketbox (MIT), motion-capture clips. Desktop full, handset reduced. |
| Side-task reward | Story only: a thank-you line and a Case Board entry. No XP, nothing gated. |
| 3D Off | NPCs are 3D On only. 3D Off skips them; side tasks are not offered there. |

## Doctrine constraints that shape the design

- **Learn track pays no XP** — nothing in `src/npc/` calls `session.addXp`, `api.gradeStage` or `api.completeQuest`. A guard in `verify:npc` greps for it.
- **No answers.** Flavor lines describe what a machine does in real terms; they never answer a bench question. Every line is reviewed against the six Tallow bench prompts (Atoms, Inside an Atom, Periodic Table, Isotopes and Ions, Atomic Mass, Counting By Weight). No line states an atomic number, mass or ratio that a bench asks for.
- **Real terms, no anthropomorphic atoms** ("happy", "wants"), glossed terms on first use via `src/learn/glossary/`.
- **Diegetic copy** (bible §"Diegetic Imperative"): no "level", "button", "game", "quest". Lines ≤ 25 words each.
- **Physical honesty / no overlaps**: NPCs never walk through colliders, bench bays or each other; `tools/lib/overlap.mjs` rules apply to their posts.
- **Performance**: no new lights (NPCs carry no `PointLight`; a helmet lamp is emissive only). Figures share geometry and materials; never baked by `mergeStatic` (`noMerge`, `mover`). Shadows: NPCs moving would force the sun shadow to redraw every frame (`shadow-pace.js`); see §6.
- **Pointer never locked**, every interaction is an aim target (`aim-target.js`), touch has the same `[E]` stick key.

## 1. Data: `src/npc/tallow-crew.js` (pure, no THREE)

One declaration per NPC, read by the world, the dialogue card and the checks.

```js
{
  id: 'tallow-foreman',
  name: 'Ostrander',            // shown on the card
  role: 'Shift foreman',        // one-line subtitle
  look: { coat: 'hiVis', hat: 'hardhat', build: 1.0, tool: 'clipboard' },
  schedule: [                    // looped; times in world seconds
    { at: 'post:head-house-desk', for: 40, act: 'write' },
    { at: 'post:conveyor-tail',   for: 25, act: 'inspect' },
    { at: 'post:bagging-door',    for: 30, act: 'stand' },
  ],
  talk: {
    default: ['…', '…'],         // 1–3 lines, ≤25 words each
    afterBench: { 'q2-core': ['…'] },   // swaps in once that bench is cleared
    afterClue:  { clue_tallow_slag: ['…'] },
  },
  task: 'tallow-task-scale',     // optional, see §5
}
```

`POSTS` (same file): named standing spots in Tallow's world frame, each `{ pos, faceY, act }`, placed on walkable ground clear of every `BENCH_BAY` volume. A post can be inside a hall (uses `hall-plan.js` `toWorld`).

Pilot cast (5–6 NPCs, final names/lines drafted in step 7 and sent to you for review):
- Shift foreman — incident lore (the bins, the night of the raid).
- Assay clerk — chemistry flavor at the assay hall (what an assay is, why salt is weighed).
- Belt hand — flavor at the conveyor (crushing, sieving salt; nothing about elements).
- Two yard hands — wander the pan; rumor lines ("someone says it turned to gold").
- Night watch — Fifth sighting lore; owns the side task.

## 2. Bodies: `src/three/npc/figures.js` (as built)

Superseded the procedural design: six Microsoft Rocketbox avatars (four construction workers, one in hi-vis, one security guard), converted
to glTF with mocap walk, idle, look-around and talk clips. Details in `docs/engineering/engine-and-worlds.md` "Crews (NPCs)".

## 3. Wandering: `src/three/npc/crew.js`

`class Crew { constructor(world, defs); update(delta, playerPos); aimTargets(); dispose(); }`

- **Routes** reuse Tallow's existing walker: `world.routeTo(null, from, to)` already returns door-by-door waypoints with walk-around on the 1 m A* grid (`tallow.js:211`). NPCs walk it at 1.2 m/s, height from `world.getTerrainHeight`. Routes are computed once per schedule leg and cached.
- **State machine** per NPC: `walking → at post (act) → walking …`; `talking` interrupts any state (stop, turn to player, hold until card closes + 1.5 s), then resumes the leg.
- **Avoidance**:
  - Player: NPC stops and waits (≤3 s) if the player is within 0.9 m of its next 1.5 m of path, then side-steps on the grid. Player collides with NPCs as moving radius-0.35 colliders: `fpsControls.setColliders` gets static colliders + NPC discs each frame (cheap: ≤6 discs).
  - Each other: two NPCs never share a post at once (schedule check); on a corridor meeting, the one with the lower id yields 0.6 m right.
  - Bench bays: `BENCH_BAY` approach/work volumes are added to the NPC's own blocked grid so crews never walk through a student's work area. When a bench is open (`world.benchesOpen > 0`), NPCs within 8 m of it pause or reroute away.
- **Distance LOD**: beyond 60 m an NPC's pose updates at 5 Hz; beyond fog far or out of frustum, only its position advances along the route (no pose).

## 4. Talking: `[E] TALK TO <NAME>`

- `crew.aimTargets()` returns `{ kind: 'npc', reach: 2.6, boxes: [aimBox(head-to-feet box, rotY)] }` per NPC.
- `stage.js` `aimedInteraction()`: in the Learn-world branch, NPC targets join `learnWorldAimTargets(...)` in the same `pickAimTarget` call so the nearest thing on the view ray wins (a bench behind an NPC is not offered).
- Act → `openLineCard(npc, lines)` in new `src/ui/npc-card.js`: bottom-anchored card, speaker name + role, one line at a time, `[E]` / click / tap advances, `Esc` closes. SCOURED PLATE tokens; no `backdrop-filter` (it sits over the live canvas). Movement is not frozen; walking >4 m away closes it.
- Line selection: latest matching `afterClue`, else latest `afterBench` (bench cleared via existing progress), else `default`. A small per-NPC index rotates through default sets so repeat talks vary.
- While a bench is leaned-in (`mode === 'quest'`), NPCs are not aim targets.

## 5. Side tasks: `src/npc/tasks.js`

Shape: `{ id, giver, ask: [lines], fetch: { fieldPointId | post, label }, thanks: [lines], caseNote }`.

- Reuses the existing carry slot and field points (`three/field-points.js`, `registerFieldPoint`): the NPC asks, the student finds the spot in the world, `[E] TAKE …`, walks back, `[E] TALK` hands it over. A task item never appears on a bench table.
- Completion writes a session flag `npc_task_<id>` (`session.setFlag`, synced like `story_world_seen_*`; tiny, fits `STATE_MAX_CHARS`) and adds a Case Board entry.
- **Case Board:** `src/screens/casefile.js` gets an "Field notes" group listing completed `caseNote`s for the world. These are extra lore notes; they are **not** among the 15 `CLUES` and do not change Act answers, so nothing is gated.
- Pilot: one task (night watch: find the scorched tarp scrap by the hauler where the Fifth crossed the pan → note about the crate drop seen in the arrival cutscene). Chemistry-free by design, so it can't leak an answer.
- 3D Off: no task offered; nothing in 3D Off references NPCs.

## 6. Performance & shadows

- NPCs cast shadows only within 25 m of the camera (`castShadow` toggled by distance); beyond that a blob decal under the feet.
- Moving shadow casters near the camera would keep `visitorsMoving` true and redraw the shadow map every frame. Option chosen: mark NPC groups as world-own movers excluded from the `visitorsMoving` fingerprint, and let `paceShadow` redraw at a capped 10 Hz while an NPC caster within 25 m is walking. Measure with `tools/perf-bench-rest.mjs`; a bench at rest must still read "shadow resting" when no NPC is near it.
- Handsets (no shadow map): blob only; cap to 4 visible NPCs.

## 7. Wiring

- `TallowWorld`: build `this.crew = new Crew(this, TALLOW_CREW)` after colliders are final (after `hallColliders`/landmark colliders, before `consolidateStatic`, with figures added outside the merge); `update()` calls `this.crew.update(delta, cameraPos)`; `dispose()` disposes it. NPCs are only built in 3D On (`T4`).
- `stage.js`: NPC targets in `aimedInteraction`; pass NPC discs to `fpsControls` each frame.
- Generic hook so rollout is per-world data: worlds expose `routeTo`, `getTerrainHeight`, `colliders`, `data.sites`; `Crew` needs nothing Tallow-specific. Worlds built on `lib/workings.js` (Ligar, Bellows, Ember, Mirrowen, …) already provide a door-by-door route.

## 8. Verification (`tools/verify-npc.mjs`, added to `verify-all.mjs`)

Headless, no renderer:
1. Every post is on walkable ground, outside every collider (+0.35 m) and every `BENCH_BAY` volume, inside the world bounds.
2. Every schedule leg has a route; simulate each NPC for 10 world-minutes at 30 Hz: never inside a collider, a bay, or another NPC (0.06 m tolerance per `overlap.mjs`), never off walkable ground, never stuck > 5 s.
3. Every line ≤ 25 words; banned-word list (bible D6 + "level/button/game/quest", "happy/wants" for atoms); no digits in Tallow flavor lines that match a bench answer key (heuristic, reviewed by hand).
4. No `addXp` / `gradeStage` / `completeQuest` under `src/npc/` or `src/three/npc/`.
5. Every task's field point exists and is reachable; every `afterBench` key is a real Tallow `questId`; every `afterClue` key is in `CLUES`.
6. `verify:tallow` and `tools/perf-worlds.mjs` still pass; draw-call delta reported.

Then `npm run verify` + `npm run build`. You test in the browser.

## Build order

1. `figure.js` + pose functions (check figure in isolation via a headless bounding-box test).
2. `tallow-crew.js` posts (verify check 1).
3. `crew.js` wandering + verify check 2.
4. Aim target + `npc-card.js` + line selection.
5. Shadow/LOD pass, perf numbers.
6. Tasks + Case Board "Field notes".
7. Draft all lines → **send to you for review** before wiring them in.
8. Docs: `docs/engineering/engine-and-worlds.md` NPC section, `CLAUDE.md` codebase map.

## Open questions (answer before step 3 if you want something different)

- Do NPCs physically block the player (planned: yes, as small discs), or can the player walk through them?
- Should the Fifth's hooded figures ever appear in-world (e.g. glimpsed far off, never talkable), or crews only?
- ~~Rollout after the pilot: same 5–6 per world, or scale per world size?~~ Answered 2026-11-19: six everywhere, more Rocketbox
  bodies downloaded so worlds look different, one side task per world, lines written and wired, reviewed after.
