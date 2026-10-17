# Avalon — Engineering Reference

Avalon is the UHS Chemistry Club's competition portal. Its audience is elementary-, middle- and
high-school students, so the design doctrine is: **teach chemistry clearly, intuitively and hands-on,
without giving away answers.**

Detail trimmed from this file lives in git history (`git log -p CLAUDE.md`) and `docs/plans/*`.
Companions: `PRODUCT.md` (durable product truth: pre-launch, no real accounts/XP/play data, 375 px
device floor, no formal accessibility standard), `DESIGN.md` + `.impeccable/design.json` (aesthetic
tokens and primitives; the SCOURED PLATE prose below stays the authority), `docs/story/bible.md`.

## Teaching doctrine (applies to every Learn quest, stage, hint and boss)

- **Real chemistry terms from stage one.** No ciphers or invented code words. Every term is defined
  where first met (briefing, an earlier reward card, or an inline gloss). Analogies to real life are fine.
  A quest's `VOCABULARY` maps each term to the stage whose reward card defines it; `verify:learn`
  enforces the card promise. `WITHHELD_VOCAB` in `tools/verify-learn.mjs` holds only what is not yet earned.
- **Never give away answers.** Prompt, briefing, guide and hints never tell the player what to do or make
  the right option obvious. **A prompt states the objective, never the route**: one plain question or
  imperative, at most 25 words, no setting clause, no "!". Setting and story live in the saga, world
  briefings and Case File, plus at most one quiet `.lq-story` lead line (`stage-story.js`, ≤20 words, no
  figure, never on a boss).
- **Hint ladder:** exactly three distinct rungs, each ONE sentence. 1 = what to do with the tool,
  2 = what to look at or compare, 3 = the method/structure, never the answer or the arithmetic result.
  Rung 1 free, rung 2 after a miss or 45 s, rung 3 after two misses.
- **Nothing is named without being explained, and nothing self-evident is explained.** A key whose label
  doesn't say what it does gets one plain legend sentence (≤ ~18 words, drawn under the keys, never a
  tooltip). A self-explanatory key ("Tip Sample") gets none: leave it out of `TOOL_TEXT`. A prompt/hint
  that names a control quotes it: `Press "Fire Beam"`.
- **Tools are introduced right before the stage that needs them.** Stage 1's briefing (one per quest, ≤2
  sentences) names only the initial tools; `TOOL_TEXT` entries set `from:` to the exact stage.
- **Nothing blocks a player who has the right answer.** A stage may refuse a blank answer, or a wrong one
  with a reason; never a correct one for want of a key press.
- **A stage must be solvable by someone who doesn't already know the answer.** The evidence is on the
  bench, not in hint rung 3. Constants/formulas a stage needs are given on a plate, readout or rung 3.
- **Every stage owes a reward card** (1–3 sentences) naming the idea just worked out. A misses message
  must carry a reason and may not contain its stage's answer (`verify:learn` searches for it).
- **Scientific investigation, not monster combat.** Misses are "missed trials"; progress is never lost.
  Samples are SAMPLE A/B/C, restarting every stage. Stage controls (`.lq-stage-actions`, `.lq-controls`,
  dialog buttons) must always have `pointer-events: auto`.
- **Only bosses fight** (`boss-hopper`, `boss-eater`, `boss-warden`, `boss-golem`, `boss-compressor`, `boss-crucible`).
  A boss phase declares `encounter {species, act, intent, hit?, counter?, moves?}`; ordinary stages have
  none. Foes come only from `planFoe()` in `engine/foes.js` (asks the instrument's own planner), map
  one-to-one onto the stage's samples/rows, are "dispersed, never killed", fit SCOURED PLATE. A foe
  only observes: scouting is free, only a committed miss costs 1 of 3 Integrity, knock-back keeps
  everything learned, a correct commit wins at any Integrity, the miss reason is on screen before the foe
  answers, every foe line passes the vocabulary gate and answer-leak search. No modal precedes a stage.
- **Boss = one health bar over its fight** (`boss-arena.js`, `boss-hud.js`); cosmetic only, never
  refuses an answer. FPS combat layer was removed; `encounter3d.js` takes no part in Commit.
- Quest descriptors: where it happens, title, one short line (story-flavoured, naming the mission).

## Hard rules that outrank the rest

- **The Learn track pays no XP and never reaches the leaderboard.** Nothing in `src/learn/` or the learn
  screens may call `session.addXp`, `api.gradeStage`, `api.completeQuest` or `session.recordProgress`.
  Drill Deck rewards are cosmetic. `verify:learn`/`verify:drills` fail the build otherwise.
- **Nothing turns a backend failure into a sign-out.** `verifySessionToken` returns `null` only for a
  genuinely bad token (transient failures throw `BACKEND_BUSY`); `doPost` answers `UNAUTHORIZED` only
  for that; `callAppsScript` retries 3× and reports `BACKEND_UNAVAILABLE` (503); the `bootstrap` mock
  fallback sets `degraded: true` and omits `player`. `api.js` clears the session only after two
  consecutive `UNAUTHORIZED`. Rate limiting is per account, not per IP.
- **The Sheet is master, localStorage is the cache** for everything non-XP (flags, notebook, practice,
  loadout, marks, commendations, settings, learn copy, saga): one `PlayerState` doc per player, merged by
  `src/shared/statemerge.js` (mirrored in `apps-script/PlayerState.gs`; `union` sections never lose
  data, `latest` sections take the newer). The game plays from localStorage and never waits; sync never
  surfaces errors or touches the session. `/HoloClosed$/` flags don't travel. Sign-out wipes per-player
  state. XP, quest progress, inventory and roster are NOT in the doc.
- **XP:** paid once per stage; flat (no attempt multiplier); hints free; completion idempotent; progress
  never regresses (`Math.max`); a finished quest replays free. Clean-solve streak pays nothing. Guild
  score is a mean (`mean(xp>0) × (0.75 + 0.5×active/roster)`), never a sum, and is never labelled "XP".
  Server XP is authoritative. Read Sheets flag columns through `isTrueFlag`, never `=== 'TRUE'`.
- **Telemetry never invents a reading** (comms CRT shows `NO GUILD TELEMETRY ON THIS CHANNEL` when empty).
- **Nothing occupies the same space as anything else.** Checked against the world actually built
  (`tools/lib/overlap.mjs`), not a table. Parts inside one object are exempt; `phys: 'ground'|'ambient'`
  and decals are exempt by kind; tolerance 0.06 m; elevated structures collide as their supports;
  baked/instanced bodies are measured per part (`userData.partBoxes`).
- **The cursor is never captured** (`requestPointerLock` is a documented no-op); look = drag.
  **One owner for the `X` key** (the `stage.js` window listener).
- **A built instrument shows a flat picture** of what it resolves (same `draw*Field` as the canvas
  bench), and **the picture is honest**: what is drawn is what is graded. The 3D and drawn benches expose
  the same API and plan through the same pure functions, so a stage grades identically on both.
- **A screen bolted to a bench never moves** (`PANEL_LAYOUT` fixed; never animate a panel height).
- **`mountConsole` is the last statement in the Charge Gardens stage render** (it moves the deck into
  CSS3D; later `container.querySelector` calls return null). Use `q()`/`qa()` in `quest.js`.

## Build and verify

- `npm run dev` (Vite :3000 with API middleware) · `npm run build` (empties gitignored `dist/`; keep
  source art in `public/` or `assets-src/`) · `npm run verify` before shipping.
- `verify` = `verify:quest` (20 Charge Gardens stages, chem card ≤3 sentences, copy mirrors in
  `api/[...route].js` + `Quests.gs`), `:console`, `:learn` (registry, no-XP, practice sets, grading
  tables recomputed from real data, plates drawn in Node, hint/prompt/legend/leak rules, encounter layer),
  `:story`, `:sync`, `:drills`, `:galaxy`, `:run` (every quest mounts and every stage runs), `:geometry`
  (all 20 reaction animations), `:media`, `:flows`, `:progression`, `:ship`, `:voyage`, `:tallow`,
  `:ligar`, `:lanternfall`, `:bellows`, `:ember` (each builds its real world in Node and checks overlap,
  buried bodies, walkability flood-fill, lamps-only-lit, shader patches; `:ligar` also holds the mine:
  doorways, grades, rock over every roof, bays inside chambers, hills unclimbed, the guide's route, walls
  that hold, lamps in every working, the cover mask), `:bench` (every built instrument
  on its real bench at six aspects, real pointer paths, foe bodies, and the bench bay in all five worlds), `:holo`, `:normals`, then `build`.
- Other: `deploy:backend` (clasp), `bake:stills`, `bake:video`, `seed`, `test:load`.
- Test hooks: `globalThis.__LQ_TEST__` is read in `stagerunner.js`/`plates.js` and inert without it.

## Architecture

**Client (`src/`):** `main.js` boots stage/HUD/router immediately, fetches `bootstrap` in background.
`router.js` hash router (`ROUTES` gating, `ROUTE_NAV`, `PARAM_ROUTES` for `/learn/:worldId[/:questId]`,
`tryVoyage`; leaving a quest calls `disposeLearnQuest()`). `session.js` (token, player, XP, flags, learn
state; the only XP curve: 45·(N−1)², cap level 12). `api.js` thin POST wrapper. `sync.js` +
`shared/statemerge.js`. `ui/` (`layout.js` `pageHeader` — every screen builds its header from it;
`modal.js`, `toast.js`, `transmission.js`, `cinematic.js`, `galaxy-map.js`). `story/` (`quest1.js` single
source for Quest 1 narrative, `saga.js`, `lore.js`, `story-modal.js`). `screens/` one render function per
route. `three/` persistent WebGL stage (`stage.js`; modes `ship|world|quest`), ship, worlds, voyage.
`quest3d/` Charge Gardens chamber. `fallback2d/` DOM-only Tier 1. `learn/` the Learn track.

**Quest 1 data:** `src/quest3d/evaluator.js` owns copy and answers (`STAGE_CONFIGS` geometry/anchors/
tolerance/reaction; `STAGE_COPY` shape/prompt/3 hints/scans/`concept`/`chem`). Bundled configs are
authoritative; backend `scene_config` is transport only. Grading is local at 0 ms; the server call is
fire-and-forget. `concept` (controls; `conceptTiming:'intro'` only on stages 1 and 11) vs `chem`
(chemistry after the solve; physical intuition, no college jargon). Loop = scan → compare → commit;
`diagnoseMiss` names the physics for all wrong pairings. Reactions must be chemically honest (valence,
face-on approach, backside displacement ≥160°, H transfer ≥140°); `verify:geometry` and `verify:quest`
enforce it, including that the scanner never lies and no withheld vocabulary appears.

**API proxy (`api/[...route].js`):** scrypt derivation, rate limits, salt cache, 60 s public cache, and
`localDevHandler` (full in-memory mock when `APPS_SCRIPT_URL` unset; `localTotalXp` must match
`Scoring.computePlayerTotalXp`).

**Backend (`apps-script/`):** `Db`, `Auth`, `Players`, `Quests`, `Scoring`, `Items`, `Events`, `Main`
(`setup()`), `PlayerState`. Sheet tabs: `Config, Players, Progress, LearnProgress, PlayerState,
Submissions, Inventory`; the rest are code constants. `Db.getAll` memoizes per execution; sessions cached
180 s. Deploy = `deploy:backend` + redeploy a Web-app version.

## Learn track

Fourteen worlds in road order (`unit01`…`unit14`): Tallow (atoms, table, mole), Lanternfall (light,
orbitals, trends), Ligar (bonding), Bellows (gases), Ember Reach, Mirrowen, Kettle, Teeter, Verdigris,
Brinewire, Quicklight, Lodestone, Thornmere, Cinder Halo. Built: Tallow (6 benches + `boss-hopper`),
Lanternfall (9 + `boss-eater`), Ligar (9 + `boss-warden`), Bellows (6 + `boss-compressor`), Ember Reach
(7 + `boss-crucible`), Kettle (`q1-recipe` + `boss-golem`; no walkable world, so at T4 its bench builds its
own room). Tallow, Lanternfall, Ligar, Bellows and Ember Reach are walkable at T4 (`learn/worlds3d.js`). **Every built world is open from the start**; inside a world quest N opens
when N−1 is complete; charted (unbuilt) quests don't hold anything shut. World `status` is derived (`live`
iff a quest has a module). Plans: `docs/plans/learn-track.md`, `learn-quests.md`, and per-world records.
`docs/plans/bench-integration.md` (benches fold into each world's equipment, Ligar gets a mine): P0, the
shared groundwork (bay contract, one bench builder, signs gone), P1 (Tallow re-laid, six hosts) and P2/P3
(Ligar: four surface hosts, two hills, a mine of five chambers) and P4 (Lanternfall: nine hosts in an aurora expedition's
camp) are done; P5–P7 (Bellows, Ember, records) moved into `docs/plans/bench-tabletop.md` (plan only): benches
become open tabletops (drag, snap, pour, arrange, predict-then-test, T4 field fetches) graded on what is on the
table, atom kit piloted first, and every reworked bench must also be integrated into its world (its §2.6).

- **Registry** `learn/curriculum.js` (pure data/functions, no DOM), `progress.js`, `worlds/unitNN-*.js`,
  `quests/<world>/<quest>.js`. **Quest contract** (`quests/_template.js`): export `mount(container, ctx)`
  → `{dispose}`, `meta.stageCount`, `STAGES`, `SOLUTIONS`, `MISSES`, `stateFor`, `PRACTICE`,
  `VOCABULARY`, `BUILDS_ON` (must name real built quests). To build one: copy the template, point the
  chart's `module` at it, set `status:'live'`, fix `stageCount`, write 5 `PRACTICE` problems, run
  `npm run verify`. Endpoints `learn/progress|stage|complete` return no XP.
- **Drill Deck** (`#/drills[/:worldId]`, `screens/drills.js` over `learn/drills.js`): the five practice
  problems per quest, asked in one place; open from the start; Daily Set, Quick Run, Timed Round, Weak
  Spots, mastery map, streak, 5 cosmetic commendations. Question ids are `<questId>#<n>` — **append to
  `PRACTICE`, never reorder.**
- **Engine** (`learn/engine/`): `scope.js` (sampler scope; power dial 1–6), `corebench.js`,
  `catalogue.js`, `assay.js`, `joinbench.js`, `plates.js` (drawn plate bench base for light bench, cloud
  plate, box rack, electron bench, bond bench, pair board, domain rig), `gasrig.js`, `calorimeter.js`
  (+ `thermodata.js` tables and planners, `thermomount.js` stage loop), `stagerunner.js`
  (shared stage loop and answer widgets `number decimal choice bins order multi pick none`),
  `frame.js` (rail, Findings, Tour, prompt, readout, answer, Submit, hints, rewards; one exit = host bar
  `Leave Bench`; `setStage` resets all stage leftovers; desktop tabletop places progress lamps horizontally), `foes.js`/`encounter.js`, `benchlog.js`,
  `trendplot.js`, `visual-devices.js`, `instruments.js` (dispatcher: canvas vs built).
  Every pure planner (`planSettle`, `planBeam`, `planJoin`, `planCurve`, `planLewis`, `planDomains`,
  `planPhotocell`, …) is the single implementation shared by drawn and built twins.
- **Built twins at T4** (`*3d.js`, `plates3d.js` `plateBench3D(Base)` — always a subclass, never a second
  implementation): `BenchViewer3D` (`bench3d.js`) lays stations on the world's bench plate; `addGrabbable`
  hands presses to controls before the view; `buildPowerDial` is real geometry sharing `angleFor` /
  `valueForAngle` with `dial.js`; tool keys are mirrored onto the bench from the DOM (`bench-keys.js`,
  DOM stays the only copy, hidden visually never `display:none`); readings board (`bench-readings.js`)
  is a read-only mirror; foes are `FoeLayer3D` bodies (`foebody.js`, `encounter3d.js`) that only observe.
  Deployed benches are aimed into the glass (`fitDeployedAim`), stop aiming when the player walks
  (`playerWalked`, `walkOwnsHeight`, `mouseLookLocked`, `walkKeysAtBench`), and the briefing docks left
  (`body.bench-deployed`). A **drawn** bench calls `stage.setWalkSuspended(true)`; a built one doesn't.
  On tabletops (`table3d.js`), players interact with `[E]` to lean in with free look and movement;
  dormant bench tool rail and extras (tool rail, weld bead, swarf, vice in `bench-bay.js`) are parented to `dormant` so they hide cleanly on deployment;
  scratch corners (H, O, Na+, Cl-) display only when required (`spec.scratch === true`) with staggered bins (`scr-bin` at y:55, atoms at y:50/58.5) clear of trays;
  sample trays use height 20 and cell 19 at y:33 with scope fixtures and initial sample dishes elevated (y:11-16) to prevent any label or dish overlaps;
  lens rendering uses elevated base over dishes, polygon offset, and 384px canvas textures to eliminate z-fighting, with rest:{x:0,y:0} for concentric centered snapping;
  table gestures use strict closer distance (`d < best.d`) so sample dishes and centered resting tools resolve properly on drag/tap.
- **Deck layout:** `.lq-prompt` pinned top, `.lq-deck-body` scrolls, `.lq-deck-foot` (banner, Hint,
  Submit) pinned bottom; `fitDeck()` bounds it; sorting answers render as a matrix (`compactBins`).
  Overworld card (`.learn-quest-overworld .lq-body`) is flat prose: prompt, reading, keys, run-in reward;
  `Hide Panel` folds to a `Stage Panel`/`Submit` dock; containers are `pointer-events:none`.
- **Tour:** no Vess modal opens on a stage. A new instrument gets a Tour (one tool per step, halos shown
  ONLY then via `showInstrumentHalos`, dial once per player, one step per key). Quests call
  `showBriefing()` on stage 1.
- **Per-world notes:** Tallow `q1-grain` … `q6-weigh` (atoms/elements/mixtures; inside an atom — the
  clip-on charge needle stays on; periodic table; isotopes/ions; atomic mass — a balance weighs, it
  never divides; counting by weight — the mole is *discovered*). Tallow is one process line walked from the
  pad inward (`tools/gen-tallow-layout.mjs`: brine pans, evaporator row, cracking towers, pipe bridges,
  the 22 m conveyor tail-east/head-west, weigh hopper and bagging line, loadout scale beside the hauler)
  and each bench stands at its quest's step: 1 sample point at the conveyor tail, 2 instrument room under
  the row (the sub-level: floor -5, roof -0.3, two evaporators stand on its roof on girders and columns
  inside; stair between them, z -31…-22), 3 control house (veranda desk, record wall), 4 a cracking tower
  with its sample-cooler skid (the tower is part of the host), 5 weigh hopper hung under the belt's
  discharge (`CONVEYOR.outlet` in `plant.js`), 6 sack scale + bucket elevator. Hosts are `tallow/stations.js`
  builders; `site.pos` is the bench centre, every facing is cardinal, a host's landmark carries `host:
  <siteId>` (a bench is inside its host's footprint; the data check exempts only that pair); the cased
  instrument is the one unsalted, less rough thing on the machine. `t1.siteDescriptions` is gone (nothing
  read it). Lanternfall `q1-wave` … `q9-absorb`
  (plain labels until the word is earned; honest plates; box rack magnet measures the REAL sample;
  `q5-numbers`/`q9-orbitals` are beyond the exam and say so). Lanternfall's benches are the working points of an
  aurora expedition camped round the frozen lake (`lanternfall/stations.js`, nine hosts keyed by site id; their
  footprints are the pure data in `lanternfall/host-plan.js`, which the generator, the world and `verify:lanternfall`
  share): 1 wave flume on the south shore (fed from the lake), 2 photocell housing at an aurora mast's foot, 3
  spectrograph sled in camp 1 (tailgate down), 4 the ice crawler's lab module (doors open, floor level with the plate),
  5 and 6 the two halves of ONE records tent, back to back (`TENT_SPAN` 7 m, ridges meeting; the board has a face for each),
  7 detector arc on a mast platform, 8 sample-tile racks in camp 3's store, 9 cuvette sled beside a hole cut through the
  lake ice (`WATER_HOLE`; the generator refuses unless the ring is inside the lake). Every facing is cardinal; each site
  carries a `flat` disc (written by `tools/gen-lanternfall-layout.mjs`, read by `lanternfall/terrain.js`) that levels the
  ice under its host and lane; a host's landmark carries `host: <siteId>`; the cased instrument is `M.case`, the one clean
  thing in a weathered camp; the road of lantern posts follows the walk from the spawn to each approach in bench order.
  The lantern-eater's ground (`BOSS_ARENA_SPOTS['boss-eater']`) is kept open by the generator and `verify:lanternfall`. Ligar `q1-joins` … `q9-orbitals` (Lewis
  board has one rule: H and F share one pair; domain rig puts every angle behind a protractor; formula
  unit earned in `q2-lattice`). Ligar's benches are built INTO its workings (`ligar/stations.js`, nine hosts
  returning `{group, bench, benchLocal, colliders}`): 1 slab-dressing yard at the quarry's west face, 3 crusher
  inspection deck and 4 scale-house desk on the east deck, 5 mine substation at hill A's main portal, and
  underground 2 ore drift (the forge is here; the lava tube is an empty quarry feature), 6 drill chamber,
  8 survey station at the junction of three drifts (all hill A), 7 sump and 9 hoist chamber down hill B's
  decline. **Hills are not climbed** (`ligar/mine-plan.js`, pure data shared by generator, world, guide and
  verifiers): a hill is a rounded block added to the height field in two steps, closed by a ring of colliders
  except at its cuttings (terrain holes dug back to a portal); a working is an axis-aligned volume with a floor
  (flat or graded ≤ 6°), roof 4.4 m, openings that meet their neighbour on one plane at one height; so
  `getTerrainHeight` stays single-layer (`mine.floorAt`) and no call site takes a height. Chambers are 11.2 × 11 m
  (back wall 3.1 m behind the plate, front 7.9 m before it; wall faces stand ≤ 0.3 m proud, columns cut flat).
  Walls/floors/roofs are `phys: 'ground'` (`ligar/mine.js`); sets, rail, duct, cable and lamps are bodies. **Under a
  hill only lamps light**: `setLigarCover` + `applyLigarAir` take the sun and the sky's fill out of every fragment
  in a working's box (8 roofed volumes per hill, 2 hills; falloff at portals), so a phone with no shadow map is as
  dark as a desktop with one. `LigarWorld.routeTo(siteId, from)` is the guide's way in (portal, doorways); the
  waypoint carries `siteId`. Generator: `tools/gen-ligar-layout.mjs` (JS: floors are laid from the real height
  field). Bellows `q1-knocks` … `q6-real` on one gas rig with six heads; knock
  counter is the real impact rate; sealed plates print no amount/gas; words plain until earned on the
  dials too. Ember Reach `q1-flow` … `q7-gibbs` on one calorimeter with seven heads (contact, cup, diagram,
  bonds, hess, box, gibbs): a plate prints what the instrument reads, so a rig carries `hideVerdict`,
  `hideHeat`, `hideCost`, `hideNet`, `hideSum`, `hideWays`, `hideLaw`, `hideTug` or `hideCrossing` whenever
  the stage asks for that reading; non-round answers are a `choice` of four numbers whose wrong ones are real
  slips; formulas are `reference` lines (no Formula Slate). `boss-crucible` is five phases on the same
  instrument; record in `docs/plans/ember-reach-world.md`. A control that does nothing fails `verify:learn`.
  Its world is a hydrothermal shelf in a caldera under sulphur haze: a banded hot spring at the middle, the
  seven benches on a 54 m ring (each a built calorimeter in a heat-shield shelter), a vent field (fumaroles,
  a geyser, mud pots, sinter terraces), the geothermal plant, and the caldera main (an elevated pipe walked
  under, lifted into an expansion loop over the lane north) to a railed rim over a lava lake. The Crucible is
  fought in front of the loop (`BOSS_ARENA_SPOTS` = the JSON's `arena`). Round props are never turned as a
  group (`SELF_TURNED`); the lava lake (`M.magma`) is the one emissive surface that is not a lamp.
- **Gating of copy:** `QUEST_GUIDE`/`getQuestScience` (`quest-guide.js`) has no callers; don't duplicate
  its copy into prompts. Erebus quests are out of scope until Learn work is finished.

## Worlds, ship, voyage (3D)

- **Graphics:** `3D On` (T4, default) and `3D Off` (T1, DOM-only). A phone is not disqualified from T4
  (`isT4Capable`); DPR capped 1.5 and no shadow map on handsets. **A measured tier is never written down,
  only a chosen one** (`gfxTierPref`); the tier is decided once at page open. Resolution is paced on
  planets only (`paceResolution`). Shaders compile when a world is built (`warmWorld`). Loop capped at 60 fps.
- **Worlds** (Erebus `world.js`+`erebus/`, Tallow `tallow.js`+`tallow/`, Lanternfall, Ligar, Bellows,
  Ember Reach `ember.js`+`ember/`, each laid out by `tools/gen-<world>-layout.*` into `world-data/*.json`):
  each is one analytic height field + one grid to the horizon, ONE sky function that is also its fog and
  its PMREM environment map, a PBR kit (`materials/pbr-kit.js`: maps agree; OpenGL-style normals —
  never compensate per material, `verify:normals`; `aoMap` uses uv2; `mergeStatic` bakes props, keep
  `noMerge` for anything addressable). The five Learn worlds share one arrival/render path
  (`enterLearnWorld`, `isLearnWorld`; a `worlds3d.js` entry's `key` is its voyage/`worldFor` name); a site faces its `approachPos`; a site's data `label` is `Bench N - <topic>`,
  ≤6 words, sharing a word with its quest title (Star Map, guide and `[E]` prompt read it; **no sign stands
  in any world**). **Every bench is built by `buildBayBench`** (`three/bench-bay.js`): the 4.8 × 1.3 m plate at
  0.95 m, a frame `skin` (`shelf`, `desk`, `deck`, `ledge`; dress only, never size or anchor), the cased
  instrument slot each world dresses itself, the key rail and one indicator. `BENCH_BAY`/`bayBoxes()` are the
  clearance volumes (plate, work = measured instrument reach, panels, behind, approach) in the bench frame;
  `verify:bench` fails any world body inside one except what `tools/bay-legacy.json` still waives (a
  ratchet: a rebuilt bench's line must be deleted, and new hosts get none; Tallow's, Ligar's and Lanternfall's are
  empty, the rest are Ember's old shelters). A host leaves the bay empty by standing machinery to the
  sides (|x| > 2.8), behind the plate (z < -2) or above 2.4 m. **Only lamps are lit**; a lamp is a `lampMark` in a
  `LampPool` (fixed light count — a changed count recompiles every material), never a `PointLight`.
  Shadows are re-drawn only when something moves (`shadow-pace.js`); sky is drawn last of the opaques
  (`SKY_RENDER_ORDER`; a world's opaque material must not set `depthWrite:false`).
- **Avalon ship** (`three/ship.js` over `three/ship/`, `ship-rooms.js`, `ship-graph.js`): built from a
  shared kit; doors open as you approach, portals are arches; `SHIP_ANCHORS` derived from the graph and
  must stand on clear deck; every doorway names its destination on both faces; lighting rooms declare
  sources (`ship.addLight`, ≤8 pool lights). `[E]` acts on what the camera is pointed at
  (`aim-target.js`), never what is nearest.
- **Voyage** (`three/voyage.js`, `ship-exterior.js`, `guide-arrow.js`, `screens/voyage.js`): at T4 a world
  is flown to, never stepped into; two passes with one camera; the only cut is inside a full cloud deck.
  Stepping off must not change a world's light count (`hatchLamp` descriptor into the `LampPool`). Stands
  down for T3 and below, first route of a page load, signed-out and reduced motion.
- **Hologram/terminals:** holos always display by default, dismissal is session-scoped; a press closes only
  via the "Close [X]" badge (`closeRect`). T4 terminals are `.in-world-terminal` overlays with `CLOSE`.
- **Boss arenas:** `BOSS_ARENA_SPOTS` in `boss-arena.js` relocates player and boss to open ground; walk
  suspended during boss encounters; procedural 3D boss models in `combat-monster-3d.js`.
- **Mobile:** twin sticks (`three/touch-controls.js`, `syncTouchControls` in `stage.js`) show whenever the
  walk is the foreground — on planets and at a built bench (`bench-deployed`) — and hide for modals,
  sidebar/dropdown, terminals, cinematics, full-page `.screen-container`/`.lq` pages and the chamber; an
  element counts as blocking only if it is actually laid out (`getClientRects`). Game mode
  (`game-mode.js`): Fullscreen API inside a gesture, installed Home Screen, or full-bleed `100dvh`;
  `autoEnter()` is called synchronously before awaits. Landscape enforced via manifest + orientation lock
  + `#orientation-guard`. Phone CSS lives in `mobile*.css` (≤768 px; `mobile-game.css` not width-scoped);
  hooks `m-screen m-<name>`, `m-grid-1`, `m-head`, `m-tap`, etc. Canvas sizes from `visualViewport`.
  In-world terminals (Star Map, Standings, Inventory, …) take the glass edge to edge below the HUD on a
  phone in both portrait and landscape; they are never docked to one side.

## Quest 1 — Charge Gardens of Erebus (20 stages, 650 XP; 715 with bonuses)

Arrows from red giver to blue receiver; stages 1–7 one arrow, 8–10 three molecules, 11–20 two ordered
arrows. Briefing modal auto-shows only on stages 1, 5, 8, 11 (`AUTO_MODAL_STAGES`). Touch: `touch-action:
none`, single-pointer drags. `playReaction` never strands the player. Concept cards appear after solve.
Epilogue (`QUEST1_EPILOGUE`) is duplicated in `Quests.gs`, the proxy and `quest.js`.

## Player journey

`#/` landing → `#/demo` (stage 1, no account) → `#/register` → `#/onboarding` (a player with a guild slot
never sees the picker) → `#/bridge` → `#/quest`, `#/leaderboard`, `#/inventory`, `#/quarters`,
`#/settings`, `#/admin`, `#/learn…`, `#/drills`, `#/casefile`, `#/contracts`, `#/crew/:id`. Nav labels
match page titles: BRIDGE, STAR MAP, LEARN, STANDINGS, INVENTORY, CREW. Star Map has Story (galaxy chart,
`ui/galaxy-map.js`, draws only what it's handed) and Contracts tabs. A world's plate and list row carry
one key, `Enter` (no world name, Briefing, Drills, Zoom To or Whole Map; those live inside the world).

## Progression and story

Levels 1–12 table-driven (`progression/levels.js`); requisitions, commendations (~40, zero XP), marks,
Field Manual, weekly watch, contracts, Standings (Guilds/Crew/Your Guild/This Week; opt-out as
`Crew · <GUILD>`; public profiles omit failure stats) — all cosmetic, verified by `verify:progression`.
Story: 4 acts, enemy = the Fifth Guild, all copy as Quartermaster Vess transmissions (≤2 sentences,
diegetic, withheld vocabulary, never states a stage's route, never between a miss and its message).
Opening a briefing files it in the Case File notebook (`recordNotebook`, ids only); `verify:story`.

## Aesthetic — "SCOURED PLATE" (mandatory)

Hardware that has been in the dust forty years and still works. Read `src/styles/tokens.css` first.
1. Surfaces obsidian and titanium (`--plate-000…600`, faint cool cast). Warmth from text and filament.
2. **Light is filament, not LED:** nothing blooms. `box-shadow: 0 0 20px <colour>` is banned except true
   lamps (`.gfx-dot`, `.stage-dot.active/.completed`). 3. **Amber is a signal, not a surface.**
- **Banned:** neon/synthwave glow, electric cyan, glossy blue glassmorphism, candy gradients, rounded
  corners (`--radius-sm` is 0; `--radius-full` the only non-zero), emoji in markup, Tailwind-default hexes,
  auto-fit "feature card" grids, arrow glyphs in keys, `//` decorative markers, fake status readouts.
- Geometry: `.plate`/`.glass-panel`/`.holo-card`/`.stage-prompt-card` share one clean bezel treatment
  (durasteel 1px border, inner highlight hairline, deep ambient shadow); seams `--seam-light/dark`.
- Colour: text `--text-primary #dcd6cc`; `--text-muted #8c8376` must stay ≥4.5:1 on `--plate-200`;
  signals `--accent-amber #e59b24`, green `#78a142`, danger `#b8382c`. Charge red `#ff1744` / blue
  `#00b0ff` are reserved for the 3D chemistry; in chrome only as printed ink on a hairline. HUD badge
  livery comes from `TEAM_LIVERY` in `main.js`, never sheet `accent_hex`.
- Type: Quantico everywhere (JetBrains Mono fallback for telemetry), crisp, no blurry shadows.
- Components: `.btn-primary` amber switch, `.btn-secondary` durasteel, `.quest-btn-sm` (labels 1–2
  words, with `btn-secondary` or `btn-primary`), `.form-input` recessed well (no placeholder examples),
  banners `.form-banner` / `.stage-error-banner` with a `!!`/`//` mark, `.scan-readout`.
- **Copy discipline:** the interface does not advertise itself. Delete any string that isn't a label, a
  rule, an error, something taught, or story. No "COMMS LIVE" claims. Screens carry no subtitle unless the
  one-line quest descriptor. Teaching and story copy are exempt from trimming-for-length, not from rules.
- **Layout:** `--hud-h` is the fixed header height; nothing slides under it. Everything must work at 375 px.
  Three.js scenes keep to the plate/glass rules enforced by `verify:bench`.
