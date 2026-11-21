# Engineering reference: architecture, Learn engine, worlds

Moved out of `CLAUDE.md` on 2026-10-22 (the original is in `docs/archive/2026-10-22/CLAUDE.md`). `CLAUDE.md` keeps the
teaching doctrine, the hard rules and the commands; this file holds how things are built, per-world notes and
layout details. Some notes here still name instruments that were retired (`archive/retired-2026-10-22/`); where a
note and the code disagree, the code wins and this file should be fixed.

## Architecture

**Client (`src/`):** `main.js` boots stage/HUD/router immediately, fetches `bootstrap` in background.
`router.js` hash router (`ROUTES` gating, `ROUTE_NAV`, `PARAM_ROUTES` for `/learn/:worldId[/:questId]`,
`tryVoyage`; leaving a quest calls `disposeLearnQuest()`). `session.js` (token, guest mode, player, XP, flags, learn
state; the only XP curve: 45·(N−1)², cap level 12). `guest.js` (intercepts calls in guest mode, mocks account routes locally from localStorage without Sheet traffic). `api.js` thin POST wrapper. `sync.js` +
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
Lanternfall (10 + `boss-eater`), Ligar (9 + `boss-warden`), Bellows (6 + `boss-compressor`), Ember Reach
(7 + `boss-crucible`), Kettle (`q1-recipe` + `boss-golem`; no walkable world, so at T4 its bench builds its
own room); later worlds are listed in `PRODUCT.md` (Thornmere, organic chemistry, 6 benches + `boss-carapace`, on the thorn kit; Cinder Halo, nuclear chemistry, 6 benches + `boss-core`, on the nuke kit). Tallow, Lanternfall, Ligar, Bellows and Ember Reach are walkable at T4 (`learn/worlds3d.js`). **Every built world is open from the start**; inside a world quest N opens
when N−1 is complete; charted (unbuilt) quests don't hold anything shut. World `status` is derived (`live`
iff a quest has a module). Plans: `docs/plans/learn-track.md`, `learn-quests.md`, `docs/plans/world-plans.md`, and per-world records.
`docs/archive/2026-11-06/passes/bench-integration.md` (benches fold into each world's equipment, Ligar gets a mine) is complete across all five walkable worlds: P0 (shared groundwork), P1 (Tallow re-laid, six hosts), P2/P3 (Ligar: four surface hosts, two hills, a mine of five chambers), P4 (Lanternfall: nine hosts in an aurora expedition's camp), P5 (Bellows: six hosts on the plant, the ring gantries gone), P6 (Ember Reach: seven hosts in the geothermal field, the shelters gone), and P7/T7 (records and retirement of all legacy 3D instruments). `docs/archive/2026-11-06/passes/bench-tabletop.md` is complete: every quest across all units is an open tabletop (drag, snap, pour, arrange, predict-then-test, T4 field fetches) graded on what is on the table, leaning in over the plate in 3D.

- **Registry** `learn/curriculum.js` (pure data/functions, no DOM), `progress.js`, `worlds/unitNN-*.js`,
  `quests/<world>/<quest>.js`. **Quest contract** (`quests/_template.js`): export `mount(container, ctx)`
  → `{dispose}`, `meta.stageCount`, `STAGES`, `SOLUTIONS`, `MISSES`, `stateFor`,
  `VOCABULARY`, `BUILDS_ON` (must name real built quests). To build one: copy the template, point the
  chart's `module` at it, set `status:'live'`, fix `stageCount`, add the bench's entry to `learn/bank/<world>.json`, run
  `npm run verify`. Endpoints `learn/progress|stage|complete` return no XP.
- **Question bank** (`learn/bank/<worldId>.json`, loader `learn/bank.js`, checker `tools/lib/bank-check.mjs`, run by
  `verify:learn`): one JSON file per world holds every practice problem. `end` is the world's closing set (optional per
  quest, fewer is fine); `bench.<questId>.problems` is exactly two problems asked after that bench's debrief
  (`ui/bench-practice.js`, hooked in `stagerunner.js` `next()`, skippable, skipped under `__LQ_TEST__`); `bench.<questId>.worked`
  is an optional guided problem for computational benches: 4 to 8 steps, each a choice or a typed number
  (`learn/worked.js` parses and judges, `ui/worked-problem.js` renders, tolerance default 1%), a hint on a miss, the step
  shown after two misses, nothing locked. Every number step carries a hidden `calc` expression that the checker recomputes,
  so a hand-typed answer cannot be wrong. Ids: `<questId>#<n>` (end), `<questId>#b1|#b2` (bench), `<questId>#w` (worked);
  **never reuse or renumber an id**, mastery is stored by it. Quest modules export no `PRACTICE`.
- **Drill Deck** (`#/drills[/:worldId]`, `screens/drills.js` over `learn/drills.js`): pools each world's bench pairs and end
  set from the bank, asked in one place; open from the start; Daily Set, Quick Run, Timed Round, Weak Spots, mastery map,
  streak, 5 cosmetic commendations, and a Worked Problems list that reopens every guided problem.
- **Engine** (`learn/engine/`): `Tabletop` (`table2d.js` canvas twin, `table3d.js` built twin leaning in over the plate), `stagerunner.js`
  (shared stage loop and answer widgets), `frame.js` (prompt strip, foot dock, comms panel, Submit, hints, rewards; one exit = host bar
  `Leave Bench`; `setStage` resets all stage leftovers; desktop tabletop places progress lamps horizontally), `foes.js`/`encounter.js`, `benchlog.js`,
  `trendplot.js`, `visual-devices.js`, `instruments.js` (tier dispatcher: `Tabletop` returning `Table3D` at T4 or `Table2D` below T4).
  Every pure planner (`planSettle`, `planBeam`, `planJoin`, `planCurve`, `planLewis`, `planDomains`,
  `planPhotocell`, `planGas`, `planMixture`, `thermodata.js` planners, …) is the single implementation shared by drawn and built twins.
- **Built twin at T4** (`table3d.js`, a subclass of `BenchViewer3D` in `bench3d.js`): leans the camera in over the bench plate
  (`leanIn({ instant: true, zones })`, solved in `lean.js`) to frame the used area (`usedRect`) of the table (solved once per stage/rebuild, and again only when the set of visible pieces changes, so lifting or moving a piece never moves the camera); `addGrabbable`
  hands presses to pieces and controls before the view; foes are `FoeLayer3D` bodies (`foebody.js`, `encounter3d.js`) standing in the table's corner that only observe.
  Deployed benches are aimed into the glass (`fitDeployedAim`), stop aiming when the player walks
  (`playerWalked`, `walkOwnsHeight`, `mouseLookLocked`, `walkKeysAtBench`), and the briefing docks left
  (`body.bench-deployed`). In-world bench viewports listen on `#webgl-canvas` directly when instrument hosts are hidden; camera setups sync FPS pose (`fpsControls.syncFromCamera()`). Built tabletops lean in instantly on stage entry or stage switch as a camera setting framing the table (`leanIn({ instant: true, zones })`); `enterLearnWorld` spawns directly in front of bench anchors; walking checks query `fpsControls` directly and looking around in world or walking (WASD / `Escape`) hands control immediately to the player with unrestricted movement and view (`leaveLean({ walked: true })`). A **drawn** bench calls `stage.setWalkSuspended(true)`; a built one doesn't.
  On tabletops (`table3d.js`), players interact with `[E]` to lean in: in a world, lean-in only flies the camera to the framing pose, then (`lean.released`) the camera belongs to the player again — look drags, WASD and R/F height all work and nothing re-snaps it (`writeLean` then only layers the boss gaze and arena shake);
  dormant bench tool rail and extras (tool rail, weld bead, swarf, vice in `bench-bay.js`) are parented to `dormant` so they hide cleanly on deployment;
  scratch corners (H, O, Na+, Cl-) display only when required (`spec.scratch === true`) with staggered bins (`scr-bin` at y:55, atoms at y:50/58.5) clear of trays;
  sample trays use height 20 and cell 19 at y:33 with scope fixtures and initial sample dishes elevated (y:11-16) to prevent any label or dish overlaps;
  sorting trays on Tallow (`q1-grain` stage 3) stand at y:48 (h:16) clear of 2-row ore tokens (y:10/21) and reader slot (y:16);
  reader fixture (`atoms.js` `paintReader`) uses scaled offsets (`b.sc`) and centered empty text to prevent clipping against the bottom 3D rim;
  tabletop prompt strip (`.lq-tstrip`) enforces `flex: 1 1 auto !important` on `.lq-prompt`, and `margin-left: auto !important; align-self: center !important;` on `.lq-rail` so stage squares stay right-aligned and vertically centered;
  lens rendering uses elevated base over dishes, polygon offset, and 384px canvas textures to eliminate z-fighting, with rest:{x:0,y:0} for concentric centered snapping;
  table gestures use strict closer distance (`d < best.d`) so sample dishes and centered resting tools resolve properly on drag/tap.
- **Tabletop objects and layout (the 2026-10 audit).** A built table is not boxes with textures: `engine/table-props.js` builds
  every solid (rounded slabs with a broken edge, lathed dishes/beads/pucks/knobs, an assembled lens and cutter, trays with walls and a
  lining), `engine/table-surface.js` paints the worn mat (the plate's ground, `drawTable` `look: 'mat'`) and weathers faces; shared
  materials are `tableOwned` + `shared`. The mat stands 6 mm proud: pointer rays cast onto `bench.groundY`, never the plate. **Words are
  paint on the table with a strip of their own** (`table/layout.js` `LABEL`, `labelLines`, `fitSize`: shrunk to the zone, never below
  `LABEL.min`; stage `notes` and a tool's `caption` are printed there too) and `table/audit.js` (run by `verify:table`, ratchet
  `tools/layout-legacy.json`: new quests get no line) fails any overlap of a zone, label, note, fixture or piece. Tallow (`unit01`) and
  Lanternfall (`unit02`) are clean.
  **Kits build their own solids** (Lanternfall, 2026-10-22): `engine/lab-props.js` builds the lamp housings, discharge tubes, bulbs,
  gas cells, metal coupons, detector heads, cuvettes, droppers, sockets, instrument cases, the photocell's glass dome and the pulse
  track; `Table3D` calls the kit's optional hooks `piece3d(p, state, ctx)` (a solid for a piece, `null` for the card), `slot3d(zone, state)`
  (what socket a slot is: `lamp holder cradle rung well chamber mark`), `deckStyle(f)` (`'instrument'`: a cast bezel, screws and a pane of
  glass over the flat picture), `dress3d(f, state, ctx)` (solid parts over a fixture's picture), `restHeight(p, state, at)` (a tool laid
  over a cuvette rests on its rim) and `pilesOf` (the cloud plates' dots are real beads at their depth, so the view dials turn a solid).
  A stage's how-to lines are `applyNotes(STAGES, {n: [lines]})` (`table/notes.js`): it finds a clear strip (smaller type, then line by
  line) and `verify:table` fails on any line left without one. Lanternfall reads in real terms (shell, subshell, orbital, spin), never
  floors and bunks, and every stage-one briefing ends "Press Submit when the table shows your answer."
  A tray or container for wide, flat cards declares a row pitch (`cellH`) as well as its square pitch (`cell`).
  Interaction: a lens lying on a dish is on top (`kinds.x.onTop`); tapping the gap between joined atoms breaks the join
  (`gestures.linkAt`, `kinds.x.split`); `props.markable` pieces are flipped (ringed) by one tap, not carried; a beam fixture may list
  fixed `detectors` and a `run` may return several `rows`. Tallow stage 1 hangs the lens, power dial and cutter on a right-hand shelf with
  captions; stage 7 is "make a mixture and a compound" (the shaker is gone); `q2-core` stage 1 has three fixed detectors, a
  prediction slot (what will the Back detector count?, never graded) and model cards for solid / soft-and-even / tiny dense center.
  **Detectors keep every hit:** `atoms.js` `run()` adds each firing's pass to the detector's `count` and `shots`, so the rare rebound builds
  up over firings. At `3D On` the beam bench is dressed in solid parts (`atoms.js` `dress3d`: `lab-props.js` `buildScatterFoil` /
  `buildBeamSource`). A mass-kit sample's bins may carry their own `code`, so one sample can read two elements.
  **Tallow rollout record (2026-10-22):** fetches that carried a copy of the bench's own sample were cut (q1-grain scoop, q4-ledger cooler
  draw, q5-assay hopper draw, and their Tallow field points); only q6-weigh's counted sack remains. Stages cut as repeats: q2-core "take
  electrons off" (q4-ledger stage 5 teaches it; "ion" is earned by the last stage), q3-catalogue "fill the chart", q5-assay "name three
  samples" (the Hopper's slag phase asks it). Guessable sorts gained cases (q1-grain stage 2: four samples, one with two hidden atoms;
  q2-core stage 6: five suspects; stage 7: a gained electron; q5-assay stage 1: a two-element sample). Miss messages name what the table
  shows that disagrees and no longer give the reasoning; hint rung 1 names the control and no longer explains how to operate it.
  **Charged plates (`q2-core` stage 3):** `speck` pieces carry only a hidden `props.charge`; the `field` fixture (a backdrop with a bed tray
  and a "Switch On" key) tags each speck in the bed `bent` or `straight` from that charge (`atoms.js` `run()`), draws the two paths with their
  counts (`paintField`) and stands two plates in 3D (`dress3d`, `lab-props.js` `buildChargePlate`). Stage briefings were removed from the Tallow
  benches: the Tour (`table/tour.js`) explains every tool, now also the drum and the pan counters.
  **Predict first (2026-10-23):** `q2-core` stage 1 is a predict stage (three model cards and a "My prediction" slot, no instrument) and stage 2
  fires the beam; `q5-assay` stage 5 predicts the one-bin balance and stage 6 tests it. The guess rides `engine/predict.js` (a synced session
  flag), and the test stage's `prompt` and `reward` are getters that read it. `q3-catalogue` stage 7 lost its behaviour token (no instrument
  tests it). Stage totals are now 330. **Reward models:** `reward.model` specs on `q1-grain` 5-6, `q2-core` 2/3/5/7, `q4-ledger` 2/5 and
  `q6-weigh` 2/5; geometry in `engine/model-parts.js`, viewer `ui/model-viewer.js`.
  **The Tour** (`Tour` key, and stage-one briefings) is built from the table, not the viewer: `table/tour.js` `tourSteps(table, {intro})`
  gives one step per fixture and per kind of piece on the stage, `frame.setTourSteps` holds them, and `frame.showBriefing` runs them (bare:
  unmet ones only, flags `tour_<kit>_<what>`; `force`: all). It works at `3D Off` too.
  **Story animations (Vess's debrief, folded in):** `src/story/quest-story.js` (data: a scene, 3 to 5 `beats` of `{to, say}`, and a `filed` line),
  `src/ui/story-scenes.js` (2D painters, pure functions of `t` and an ambient `clock`, built on `src/ui/story-kit.js`: shaded balls, hard shadows, tags,
  leaders, brackets, a beam balance) and `src/ui/story-anim.js` (the player) end each Tallow quest, hooked in `stagerunner.js` `next()` in place of
  `frame.showDebrief`; a quest with no entry still ends on its `DEBRIEF` card. A beat's `to` is the scene time its picture ends on, so each line of Vess is
  said over the phase of the scene that shows it; the player moves `t` from one `to` to the next, prints the line through `createTransmissionElement`, and
  steps on Next/Back/Enter/Space/arrows (a printing line finishes first), Skip/Esc leaves. `kit.setLabelScale` grows printed labels on a small canvas (a
  phone); `verify:story` paints every scene at every beat. The Tallow painters (`story-scenes.js`) and the boss finales and two benches
  (`story-scenes-finales.js`) are authored in 1280 x 720 units with one phase for each line of Vess; the other worlds' painters
  (`story-scenes-ligar.js`, `-bellows.js`, `-ember.js`, `-lanternfall.js`) were drawn on 960 x 540, so `legacy()` in `story-scenes.js` runs them in those
  units scaled to the canvas, and their `beats` are spaced evenly over the scene's one sweep of `t`. Their helpers (`disc`, `line`, `text`, `ground`) are the kit's,
  so every scene shares the plate, the shaded matter and the hard shadows. A new boss follows the finale shape (lit bench by bench .0-.25, settles .25-.5, gives up
  its find .5-.75, into the Case File .75-.92, brackets to the end). The pre-rework player, painters and data are in `archive/2026-10-25/`. `Table3D.dispose()` must flag itself disposed before `unmountScene(this)` (the stage disposes its active viewer: infinite
  recursion otherwise, leaving the stage UI up and the router dead); `disposeLearnQuest` and `LearnFrame.dispose` guard every step.
  The star map draws planets, names and rings only (no acts, no light-years, scattered positions); Tallow's crates are chipped, rusted
  and rounded (`createSalvageCrateTexture`, `boxUVs`).
  **Ligar's tables are dressed in the mine's own gear** (2026-10-22 audit; Ligar is off `tools/layout-legacy.json`): `engine/ligar-props.js`
  builds the model atom (a polished ball in an iron collar, its painted face printed on the crown), the ore block (a rough-hewn body of its own
  rock with a sawn, glazed face carrying the kit's picture), the salt specimen, the pair tag, a club hammer, clip leads, tongs, the stamped
  tool caps, the hub and its arms, the enamel tiles that molecules, streams and orbital cards stand on, and the frames instruments are set in
  (`buildBoardDeck` a timber survey board, `buildHotplateDeck` a cast-iron plate). `Table3D` asks for them only when its `skin` is the world's id
  (`stagerunner` passes `ctx.world.id`), through the same optional kit hooks as Lanternfall plus `deck3d(f, {w, d, mats, skin})`, and `piece3d`'s
  context carries `skin` and `faceInfo()` (the face and the colour it carries). A piece's group may set `userData.joinY` and a join is then a
  steel rod between the middles of two solids. The mat runs the length of the bench and is lit a little from within (`emissive`, so a mine at dusk
  does not print black on black); the lean-in frames `usedRect` (`table/audit.js`: what is on the table plus room to work), not the whole mat.
  **The orbital kit's overlap track stands its combined orbital up in 3D** (`kits/mo-3d.js`, `dress3d`, 2026-11-20): two marching-cubes surfaces
  per sign of `blendAt` (faint edge |ψ| 0.15, solid core 0.45; bone +, green −), p lobes up and down, sign markers beside each lobe on the outer side, level with it, drawn at
  0.45 of the flat picture's scale so the Distance dial behind stays visible. It eases to a new distance and passes through zero as the Signs
  dial turns one orbital over, re-cut (`blendGrid`) at most 30 times a second and only while moving. At `3D On` the flat cloud is not painted
  (`b.bodies`), leaving the energy level; `3D Off` paints the flat cloud as before.
  **Every table has Undo and Start Over** in the foot dock (`stagerunner.js`: `history`, `holdBase`; one move is a whole drag or two taps, a dial
  dragged is one step, Start Over is itself undoable); `verify:table` replays it. A tool laid on a block is on top (`onTop`) and can always be
  lifted off. **Words:** the trays are *sorted into* ("Sort each pair into a tray by ..."), never "trayed"; the Lewis slate says "N OF M LEFT",
  not "TRAY"; a bond sits in "the gap between two atoms", never a "joint"; every loose tool carries a caption that says what it does and every
  stage-one briefing ends "Press Submit when the table shows your answer."
- **Tabletop layout:** Prompt strip (`.lq-tstrip`) pinned at top, foot dock (`.lq-table-dock`: Undo, Start Over, Hint,
  Submit) pinned bottom; sorting answers are trays or rails arranged by dragging into place; in 3D the camera leans in
  over the plate framing `usedRect`. Overworld card (`.learn-quest-overworld .lq-body`) is flat prose: prompt, reading,
  keys, run-in reward; `Hide Panel` folds to a `Stage Panel`/`Submit` dock; containers are `pointer-events:none`.
- **Tour:** no Vess modal opens on a stage. Quests call `showBriefing()` on stage 1.
- **Per-world notes:** Tallow `q1-grain` … `q6-weigh` (atoms/elements/mixtures; inside an atom — the
  clip-on charge needle stays on; periodic table; isotopes/ions; atomic mass — a balance weighs, it
  never divides; counting by weight — the mole is *discovered*). Tallow is one process line walked from the
  pad inward (`tools/gen-tallow-layout.mjs`: brine pans, evaporator row, cracking towers, pipe bridges,
  the 22 m conveyor tail-east/head-west, weigh hopper and bagging line, loadout scale beside the hauler)
  and each bench stands at its quest's step, inside one of the plant's buildings (site rebuild 2026-11-19, see
  the **Tallow** entry below): 1 sample point at the conveyor tail in the evaporator hall, 2 instrument room under
  the row (the sub-level: floor -5.6, roof -0.85, two evaporators stand on its roof on girders and columns
  inside; stair between them, z -31…-22), 3 control house (desk in front of the relay room's glass and the record
  wall), 4 a cracking tower with its sample-cooler skid in the tower's base house (the tower is part of the host),
  5 weigh hopper hung under the belt's discharge (`CONVEYOR.outlet` in `plant.js`) in the head house, 6 sack scale
  + bucket elevator in the bagging shed. Hosts are `tallow/stations.js`
  builders; `site.pos` is the bench centre, every facing is cardinal, a host's landmark carries `host:
  <siteId>` (a bench is inside its host's footprint; the data check exempts only that pair); the cased
  instrument is the one unsalted, less rough thing on the machine. `t1.siteDescriptions` is gone (nothing
  read it). Lanternfall `q1-wave` … `q9-absorb`
  (plain labels until the word is earned; honest plates; box rack magnet measures the REAL sample;
  `q5-numbers`/`q9-orbitals` are beyond the exam and say so). Lanternfall's site (rebuilt 2026-11-18, `docs/plans/lanternfall-world.md` "Site rebuild") is a glacier tongue
  ending in an ice cliff on a frozen lake. `lanternfall/glacier-plan.js` (pure) declares the walk on `lib/workings.js`: a
  loop of open volumes round the lake (the south yard, the east ablation valley in grades and landings, a crossing over
  the glacier at 14 m, the west valley), spurs down to two caves on the lake ice and down a crevasse ramp, the crawler's
  tailgate, and ten rooms each behind a door volume; the one height field (`height`); the mesh's `surface` (the land over
  a room buried in it, less the band on its door's side, so the terrain never skins a doorway); `cutFaces()` and
  `shoreEdges()` found from the walls; `coverSpec()` (one box per room). `lanternfall/ground.js` draws the terrain, the
  lake's ice (its own level mesh, the walk and the cave floors cut out of it), the cut faces in section, the shore's
  pressure-ridge slabs, the snout, the crevasse field (drawn, since a crack is narrower than the 3 m grid) and the far
  country. `lanternfall/stations.js` builds each host as its room's shell (`phys: 'ground'`, merged per material by
  `lanternfall/kit.js`) plus machinery plus `buildBayBench`: 1 flume cave and 9 ice-hole cave under pressure ridges on the
  lake ice, 2 crib-and-set vault in the moraine under an aurora mast, 3 meltwater barrel in the glacier's margin, 4 the
  drilling crawler's hall up its tailgate, 5 the records tent in a crevasse and 6 its annexe cut in the ice, 7 a chamber in
  the nunatak's rock, 8 dry-stone walls under an erratic, 10 the dome on its platform. A buried room draws a portal: the
  land's face at the outer plane with the door cut through it and a lined passage. `host-plan.js` holds only structure,
  kind, skin and plate. The Lantern-Eater's ground (`BOSS_ARENA_SPOTS['boss-eater']`, the yard's west end) is
  `glacier-plan.js` `ARENA`; `verify:lanternfall` holds the two together, every reachable cell inside the walk, nobody on
  the open lake, and every host's machinery inside its room. Traps met: a lift term `max(y, k * v)` whose mask is nought
  clamps ground below 0 m up to 0; a rack bench at heading pi missed one drag in `q5-numbers` stage 5, because `snap.js`
  `pointFor` aimed at a point equidistant from two boxes and float drift from the turn broke the tie (fixed: a spoke must
  win by `DROP_MARGIN`); Bench 5 still faces west. Ligar `q1-joins` … `q9-orbitals` (Lewis
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
  field). Bellows `q1-knocks` … `q6-real` + `boss-compressor` are tables on the gas kit
  (`table/kits/gas.js`: cylinder rigs, tanks and a common tank, a scale, a pinhole, a tube, a walk; every reading goes
  through `gasdata.js`'s planners); knock counter is the real impact rate; sealed tanks print no gas; words plain until earned.
  The benches are rooms inside the works' structures (`bellows/stations.js`, footprints in `bellows/host-plan.js`, site rebuilt 2026-11-18,
  see the Bellows entry below): 1 inside the sphere's skirt, 2 the Compressor tower's base hall, 3 the meter house inside the piston holder,
  4 the gondola under the moored bladder, 5 under the bladder on its cradle, 6 the cold box's foot; field point `drawoff` only (`gauge` and `bleed` were retired 2026-10-23, the first a copy of what the bench held and the second a lock); the Compressor's arena is kept on open ground. `GasRig` is retired. Ember Reach `q1-flow` … `q7-gibbs` + `boss-crucible` are tables on the heat kit
  (`table/kits/heat.js`, with `heat-read.js`, `heat-draw.js` and `engine/heat-props.js`): blocks that touch and settle on one temperature
  (the only join), a lagged cup with a mouth (a slot) for a hot block or a charge of chemicals and dials for heat, water, moles and the
  lid, energy shelves (built by a dial, reversed by a dial, or drawn on a card), a bond crank, a ledger of bond chips lying in the
  Broken and Formed trays, equation cards turned (Flip) and scaled (Larger, Smaller) in a stack tray whose fixture prints the equation
  they leave, cells for particles with a Log key, a chamber that is Shaken, free-energy plots walked by a temperature dial; every
  reading goes through `thermodata.js`'s planners, and a plate prints what the instrument reads (`hideHeat`, `hideDG`,
  `hideSum`, `hideNet`, `hideCrossing`, `hideTug` and `hideCost` on the fixture whenever the stage asks for that reading).
  Numbers are markers on the old grids, cards in a slot, or a `selector` dial of four real slips; "why" stages are predictions (Run
  tests it) or marked statements (`note` cards). `Calorimeter` and `thermomount.js` are retired. A control that does
  nothing fails `verify:learn`. The hosts are the field's working points (`ember/stations.js`, footprints in `ember/host-plan.js`):
  1 the heat-exchanger plates on a wellhead, 2 a railed sampling shelf at the spring's edge (facing out, the spring behind the plate),
  3 the habitat's boiler room, 4 a sampling coil over a fumarole, 5 the separator and its two routes, 6 the silencer bay, 7 the turbine
  hall's control room; no field points (`flowline`, `edge` and `coil` were retired 2026-10-23: each carried a copy of what the bench held). Record in `docs/plans/ember-reach-world.md`.
  Its world is a hydrothermal shelf in a caldera under sulphur haze: a banded hot spring at the middle, the
  seven hosts on a 54 m ring (the spring shelf at 24.5 m), a vent field (fumaroles,
  a geyser, mud pots, sinter terraces), the geothermal plant, and the caldera main (an elevated pipe walked
  under, lifted into an expansion loop over the lane north) to a railed rim over a lava lake. The Crucible is
  fought in front of the loop (`BOSS_ARENA_SPOTS` = the JSON's `arena`). Round props are never turned as a
  group (`SELF_TURNED`); the lava lake (`M.magma`) is the one emissive surface that is not a lamp.
- **Gating of copy:** the guide modal (`quest-guide.js`, `QUEST_GUIDE`/`getQuestScience`) is archived in `archive/retired-2026-10-22/` and nothing reads it; don't duplicate its copy into prompts. Erebus quests are out of scope until Learn work is finished.

**Mirrowen's kit and benches (2026-10-30; spec and build record `docs/plans/mirrowen-world.md`, audit `docs/mirrowen-audit.md`).** The matter kit (`table/kits/matter.js`) extends the heat kit (`...HEAT_KIT`, so the cup, plaque, marker, selector, phase box, rail and the note, tag, stmt, num, chip, shift cards are the heat kit's) and adds the molecule card `mol` and the probe in `matter-draw.js`; every other instrument is registered by its bench's own file through `matter-registry.js` (`registerFixture(kind, {paint, run, dress3d, settle})`, `registerPiece(kind, {kind, paint, faceKey, piece3d, printed})`): `matter-window.js` (press and tank, window, balance, jars, molecule boxes: q1), `matter-vapour.js` (flask, surface plate, equal boxes, jar: q3), `matter-tester.js` (solid tester, solids: q4), `matter-curve.js` (heating curve, cooler, phase map: q5), `matter-flask.js` (the flask bench and `sample` card: q6), `matter-strip.js` (strip, filter, still, boiler, plan: q7). Data is `engine/matterdata.js` (the CRC enthalpies of vaporization, hydration enthalpies, Antoine fits, water's phase data, the chromatography model) and one `matterdata-<name>.js` per bench. `q2-grip` stages and `boss-undertow` are the only places the probe is used; the boss phases rebuild a bench's table with a new case. `table3d.js` gives Mirrowen's mat (skin `unit06`) more of its own light (0.62 against 0.34), because its hosts stand in a cold grey light. Traps: a card prints one row per line of text (name, mass, reading); a tray's `cellH` must be a card tall and the table taller where it is not (`bounds: { w: 150, h: 72 }`); a rail beside a tall fixture lies a label below it; add an epsilon before `toFixed` on a value ending in 5; `LEAKS` in `tools/lib/mirrowen/<quest>.mjs` are 1-based and apply to every refusal, and a tray label quoted in a refusal is not a leak. Both the chromatography strip and the still are simulations and say so on the bench.

## Worlds, ship, voyage (3D)

- **Every bench is part of its host and is checked from the lean-in view (§2.6).** Benches are built into their world's machinery, clear the bay envelope, and frame their active pieces inside the free glass at all supported aspects.
- **Graphics:** `3D On` (T4, default) and `3D Off` (T1, DOM-only). A phone is not disqualified from T4
  (`isT4Capable`); DPR capped 1.5 everywhere (a Retina Mac too: with MSAA, 2x costs 1.8x the pixels for no
  visible gain) and no shadow map on handsets. **A measured tier is never written down,
  only a chosen one** (`gfxTierPref`); the tier is decided once at page open. Resolution is paced on
  planets only (`paceResolution`: a window averaging under 53 fps steps down a quarter; a ratio found slow is
  retried after 20 s, the wait doubling to 160 s each time it fails again, since every step reallocates the canvas).
  Shaders compile and textures upload when a world is built (`warmWorld`), during the flight. Loop capped at 60 fps.
  The sun's shadow map is re-drawn only when its box moves, on a slow safety tick, or while an open bench is
  moving: `warmWorld` marks the scene's children as the world's own (`markWorldOwn`), and each frame at a bench
  `visitorsMoving` fingerprints everything else in the scene (the pose of each node over a visible shadow caster,
  the caster's geometry and instance buffer) and answers true while it changes and for 0.3 s after
  (`world.benchMoving`). Nothing that stays over the live canvas carries a `backdrop-filter`.
  After `mergeStatic` has baked each prop, a world that has a renderer runs `consolidateStatic(scene)` (pbr-kit.js):
  baked meshes with no `noMerge`, `mover` or hidden ancestor are moved into the scene's frame and merged per material
  per 40 m square (the squares keep frustum and shadow-box culling), as top-level meshes named `static:<material>`.
  The props' groups, `partBoxes` and colliders stay. Node checks build worlds with no renderer and see them unmerged.
  `tools/perf-worlds.mjs` and `tools/perf-bench-rest.mjs` report the cost headlessly.
- **Worlds** (Erebus `world.js`+`erebus/`, Tallow `tallow.js`+`tallow/`, Lanternfall, Ligar, Bellows,
  Ember Reach `ember.js`+`ember/`, Mirrowen `mirrowen.js`+`mirrowen/`, each laid out by `tools/gen-<world>-layout.*` into `world-data/*.json`):
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
  ratchet: a rebuilt bench's line must be deleted, and new hosts get none; the file is empty now). A host leaves the bay empty by standing machinery to the
  sides (|x| > 2.8), behind the plate (z < -2) or above 2.4 m. **Only lamps are lit**; a lamp is a `lampMark` in a
  `LampPool` (fixed light count — a changed count recompiles every material), never a `PointLight` outside it.
  Shadows are re-drawn only when something moves (`shadow-pace.js`); sky is drawn last of the opaques
  (`SKY_RENDER_ORDER`; a world's opaque material must not set `depthWrite:false`).
- **Shared site layers (world-distinction groundwork, 2026-11-13):** three modules a rebuilt world's site stands on; every option is opt-in and the defaults are Ligar's.
  `three/lib/workings.js` (`makeWorkings(volumes, opts)`, pure data, no THREE): rooms as axis-aligned volumes with flat or graded floors that meet at doorways; it derives wall
  segments, wall colliders, terrain holes, cover boxes and the guide's door-by-door route. It is the world-neutral half of `ligar/mine-plan.js`, which now builds from it and keeps
  the hills, the ring colliders and the basalt constants. Opt-ins: a per-volume `roof`, `openKinds`, `outdoorDoors` (a door in a building's wall is a way in from open ground), and an
  opening with `pass: false` (a railing over a drop or a window: no wall drawn, the walk still held out, never routed through).
  `three/lib/cover.js`: `coverLightChunks` is Ligar's sun-and-sky removal, lifted (Ligar's shader text is unchanged); `makeCover({ sun, boxes, openings })` is the same mask for stock
  materials and `THREE.Fog`, with a per-box `sky` residual, a normal `push` so the outside face of a wall on a box's own plane stays lit, and `openings` (roof slots, windows, doorways)
  through which the sun still reaches a covered fragment: a light shaft with no shadow map. Call `cover.applyTo(scene)` after the build and again for late materials (a deployed
  instrument). The mask holds 20 boxes and 8 openings; the counts size shader arrays, so they are fixed (about 80 uniform vectors: a handset's fragment shader has few to spare). Its GLSL is compiled offline by `node tools/glsl-check.mjs <world>` (a reading aid that needs `glslangValidator`; it approximates three's prefix, so a pass is evidence, not proof; Kettle's and Lodestone's compile).
  `tools/lib/world-shape-checks.mjs`: bench ground span, housing, shared layouts, one circle, two columns, plates in view, the flood fill, and low bodies over walkable cells
  (single floor). `tools/world-shape.mjs` prints through it; a rebuilt world's `verify-<world>.mjs` calls it as checks. Traps: the cover test at a wall's own plane reads covered
  without `push`; a shaft needs a real hole in the roof or wall as well, or a desktop's shadow map closes it.
- **Tallow** (`unit01`, `three/tallow.js` + `tallow/`, `tools/gen-tallow-layout.mjs`, `tools/verify-tallow.mjs`; site rehoused 2026-11-19, `docs/plans/tallow-ligar-world.md`
  section 5): THE PLANT'S BUILDINGS ON A FLAT PAN. The ground, sky, plant and pit are as before; five benches moved indoors. `tallow/hall-plan.js` (pure data, no THREE; the
  one declaration the world, the generator and the checks read) declares each building in its site's host frame (`room` inside faces, `roof` gable-x/gable-z/mono-x/mono-z/flat
  with `low`/`high`, `doors`, `slots` (a belt's way through a wall, closed to the walk), `windows`, `lamps`, `kind` clad/block/plinth, `sky`, `shed` for rooms of one building) and
  derives wall strips with sloped tops (`wallPieces`), colliders less doors (`hallColliders`), door points, cover boxes (a second, narrower box under a pitched roof so the roof's
  underside is covered and its top stays lit) and the door-by-door route (`routeTo`; `tallow.js` walks each blocked leg round on a 1 m grid A*). `tallow/halls.js` builds a
  building into its host's group (one object with the machinery): slab (`phys: 'ground'`), walls (sheet over a kerb or plinth with box ribs at 0.3 m, or blockwork), H columns,
  rafters and purlins, corrugated roof at 0.2 m pitch, shutter boxes, luminaires on rods. Inside a building's slab `getTerrainHeight` is its floor (the highest crust under it +
  2 cm; the head house and bagging shed share one). `makeCover` is applied after the salt and air patches (10 boxes). Traps met: the belt's tail hood stands 3.7 m high and
  1 m to the side of the belt's line, so anything over the tail must clear it; raising a host 5 cm onto a slab pushed the weigh hopper's lamp into the belt head (the lamps moved
  off the belt's line, which crosses the whole head house); a host that is baked loses its parts' names, so the extent check builds a second, unbaked world; the old pad, belt
  tail and pit gauge board had low bodies over walkable ground that the single-floor check found, now collided.
- **Bellows** (`unit04`, `three/bellows.js` + `bellows/`, `tools/gen-bellows-layout.mjs`, `tools/verify-bellows.mjs`; site rebuilt 2026-11-18, `docs/plans/bellows-world.md`
  "Site rebuild (2026-11-18)"): A GAS WORKS OVER THE CLOUD, NO GROUND. `bellows/works-plan.js` (pure data on `lib/workings.js`) declares the floor levels (`LEVEL`: stage and
  apron 0, sphere +8, tower hall -4, holder -8, mooring deck +4, cradle -5, cold deck +12), the structures (`PLINTH`, `SPHERE`, `HOLDER`, `COLDBOX`, `BAGS` with `bagBelly`),
  six rooms (`ROOMS`) and 23 volumes: open `deck`, `catwalk` and `ramp` kinds and roofed `room` and `passage` kinds. The height field is a volume's floor, else the cloud sea
  (`SEA` -46), so every edge must be closed: `withRails` looks 0.6 m past every side of every open volume a quarter metre at a time and turns any span with the drop behind it into
  a `pass: false` rail; a span against a room or a structure stays a wall. `decks.js` builds everything the walk stands on or in (`phys: 'ground'`, merged per material, uvs laid
  in metres from each face's facing): the deck plate as one vertex-coloured tread-plate mesh worn bright on the lines between doorways, slabs and beam grids, catwalk trusses,
  four-chord lattice legs down into the cloud, railings with a pooled lamp every 12 m, the gas mains, the plinth cast round the hall, the sphere and its skirt, the drum with its
  door slot and the parked piston (Bench 3's roof), the cold box's casing, the gondola hung from its bag (no legs), the cradle and its curtain under the other bag (Bench 5's roof
  is the bag's belly, `bagBelly`). `plant.js` keeps the Compressor (on the plinth at (0, 2, -10); its rod and wheel are the movers), the pad and the cumulus heads; `vista.js` is
  the far country. Cover: `lib/cover.js`, 9 boxes, one of them the drum's whole foot (seen over the meter house's 2.6 m partitions). The Compressor is fought on the apron
  (`BOSS_ARENA_SPOTS['boss-compressor']` unchanged at `[0, 0, 20]`, player `[0, 1.6, 34]`). Traps met: a round structure round a rectangular room leaves a ring between them
  that is seen from inside, so cover the whole structure; a host's forward lamps hang past 3 m in front of the plate, so the extents run to 6 m.
- **Ember Reach** (`unit05`, `three/ember.js` + `ember/`, `tools/gen-ember-layout.mjs`, `tools/verify-ember.mjs`; site rebuilt 2026-11-18, `docs/plans/ember-reach-world.md` "Site rebuild (2026-11-18)"): THE INSIDE WALL OF A CALDERA.
  `ember/caldera-plan.js` (pure data on `lib/workings.js`) declares five levels 6 m apart (`LEVEL = [24, 18, 12, 6, 0]`), four 1-in-5 westbound/eastbound switchback ramps between four hairpin turns, seven rock-cut galleries/hall (`room-1..7`) with their doorways (`door-1..7`), and `arena-deck` on Level 4 overlooking the 20 m drop to the lava lake (`y = -20.25 m`). Every lake-facing drop is closed by a `pass: false` open steel railing (1.05 m, below eye height). `terrain.js` snaps grid lines onto every volume boundary, cuts holes over every roofed room, builds the seven distinct room shells (`ribs`, `sinterArch`, `brickVault`, `overhang`, `gantry`, `baffle`, `turbineHall`), retaining walls, railings and four-quarter volcanic vista (`phys: 'ground'` / `'ambient'`, merged by material), and retains `{ fbm2, buildRibbon, buildDisc }` exports for Mirrowen. `stations.js` builds all seven hosts inside their declared `host-plan.js` extents with pooled pendant lamps (`LampPool`, 3 real lights) and zero bay intrusions. Cover: `lib/cover.js` covers all 14 roofed volumes (`sky` 0.20–0.42). The Crucible is fought on `arena-deck` (`BOSS_ARENA_SPOTS['boss-crucible']` at `[0, 0, -58]`, player `[0, 1.6, -42]`), entered under the caldera main's 7.4 m expansion loop. Traps met: a 5 m terrace step let gallery roof slabs rise above the upper terrace's rail (fixed by 6 m steps and 0.45 m slabs); `mirrowen/terrain.js` imports `{ fbm2, buildRibbon, buildDisc }` from `ember/terrain.js`; horizontal host pipes running at 1.2–1.5 m need a back-wall collider or `lowBodies` flags them.
- **Mirrowen** (`unit06`, `three/mirrowen.js` + `mirrowen/`, `tools/gen-mirrowen-layout.mjs`, `tools/verify-mirrowen.mjs`; site rebuilt 2026-11-18, `docs/plans/mirrowen-world.md`,
  "Site rebuild"): A HARBOUR. `mirrowen/harbour-plan.js` (pure data on `lib/workings.js`) declares the levels (terrace +5, quays 0, water -2.6, ice -2.3, dry dock -7, sea bed -10),
  three hulls (`HULLS`: a rect for the parallel body, a bow beyond it, a deck height), seven rooms (`ROOMS`) and 31 volumes in four kinds: GROUND volumes (`yard`, `quay`, `ramp`,
  `dock`) whose floor the terrain mesh draws, DECK volumes (`deck`, `gangway`, `pier`, `gate`) the terrain is cut away under and `terrain.js` builds, and ROOFED rooms and
  passages (the companionways down into the hulls). The one height field is a volume's floor, the floor held `EDGE` (0.2 m) past a ground volume's side so the step hides in
  the wall on its plane, else the land (`landHeight`: the town bank, the warehouse ground, the canal and sea ice, the dock pit, the sea bed); `surfaceHeight` is what the
  terrain mesh draws and `isOpenWater` where the water sheet goes (never in a hull's body or the dock). `terrain.js` draws the ground (grid lines snapped onto every plane
  and the band either side of it), the water, and the shells (`phys: 'ground'`, merged per material): quay walls from the sea bed with their coping, retaining walls, yard
  walls, railings, bulwarks, decks, piles, the two gates' leaves, the hulls (side plating, a bow prism, deck plate over every closed cell of the hull, the superstructure),
  seven room shells, the passages (a roof that follows the floor and then runs flat under the deck), the dock's tug and the pump house; and the far country (`phys: 'ambient'`).
  `stations.js` keeps the bench builder and parts kit and builds the seven hosts (deckhouse, pump room, pump well, hold, thaw shed, salt store, evaporator flat), each facing
  along an axis so its box colliders stay exact; `host-plan.js` derives each extent from its room. Cover: `lib/cover.js`, 10 boxes. The Undertow is fought on the mole head
  (`BOSS_ARENA_SPOTS['boss-undertow']` at `[62, 0, -84]`, player `[62, 1.6, -70]`). The radar scanner on the deckhouse is the one mover. Traps met: a crystal leaning in from a
  wall puts its head over walkable floor (cover its plan with the collider); a host that sets `side` on `M.steel` changes every steel body; the water sheet is a grid that must skip
  every hull's body, because a hold's floor is below the water.
- **Kettle** (`unit07`, `three/kettle.js` + `kettle/`, `tools/gen-kettle-layout.mjs`, `tools/verify-kettle.mjs`; site rebuilt 2026-11-13, `docs/plans/kettle-world.md` section 11): ONE IRONWORKS BUILDING.
  `kettle/works-plan.js` (pure data on `lib/workings.js`) declares 17 rooms on a 2 m grid, the doors between them and two heaps outside; `terrain.js` is the one height field (a room's floor inside, the soda
  flat and the heaps outside; the terrain mesh is cut away under every room); `works.js` builds the shell (floors, walls `WALL_T` thick standing inside their own room, door headers, kerbs and railings, roofs;
  `phys: 'ground'`) and the fittings (stanchions, trusses, the crane, aisle lamps); `stations.js` furnishes one bay per bench (`host-plan.js` names the room, the plate and its facing; a builder is handed its room
  in the host frame); `plant.js` is the furnace behind the cast house, the track, the heaps' plant, the far country and the stack's smoke. Floors: charge bank +3.2 m, control cabin +1.2, works floor 0, tapping
  pit -2.2, sump cellar -2.4. A door with `pass: false` is a railing over a drop (`rail`) or a window. The Golem is fought on the cast house floor (`BOSS_ARENA_SPOTS['boss-golem']`). Light: the cover mask
  (`lib/cover.js`) covers every room with a per-room sky residual; the sun comes in through the charge door and three louvred bands (`CLERESTORY`), which are real holes in the walls too; the iron in the runner
  (`M.iron`) is the one fire, a source in the three-light pool. Traps met: a ramp is entered only at its ends (a side door onto a graded floor is a ledge); a stanchion must not stand in a doorway (the frames'
  positions are listed, not stepped); the arena's 7 m ring must clear the spout's collider under the tap hole; the bench's own parts read as bay intrusions unless `bakeStatics` is stubbed as `verify:bench` does.
- **Teeter** (`unit08`, `three/teeter.js` + `teeter/`, `tools/gen-teeter-layout.mjs`, `tools/verify-teeter.mjs`; site rebuilt 2026-11-16, `docs/plans/teeter-world.md` section 9): A HILLSIDE OF SALT
  TERRACES. `teeter/terrace-plan.js` (pure data on `lib/workings.js`) declares five terrace levels 5.5 m apart (`LEVEL`), the wall faces (`FACE`), and the walk as volumes: the shelf, four ramps on one
  line at the south edge (the stair, 1 in 4), three dikes and the drying floor (open kinds `dike`, `ramp`), and eight rooms with their passages (roofed). `height(x, z)` is a volume's floor, or within
  `EDGE` (0.3 m) of an open volume's closed side the same floor (the step hides inside the wall or kerb there), else `land` (the terraces, the hill east of the shelf, the spurs past |z| 128, the valley).
  `terrain.js` draws the ground on a grid with a vertex row on every step line, leaves a hole over every roofed volume (a vertex on a hole's rim takes the land's height), and builds the masonry
  (terrace walls, kerbs, the stair's walls, the pans' bunds, every room's floor, walls and roof by `shell`) as `phys: 'ground'` meshes merged by material per 40 m square. A room's roof top is the
  pans' floor above it; the two weir houses (`gable`, `mono`) stand up through the pans. `stations.js` furnishes one room per bench (`host-plan.js` derives the plate from the room, facing west);
  `plant.js` holds the beam pumps (one over room 6's shaft, its rod working the barrel in the room), the spring house and lade, the stair's lamps, the brine falls, the drying floor's heaps and the far
  country. Cover: every room and passage is a box (`sky` 0.3 and 0.45 kept), the sun comes in through each door's first 2.5 m (`openings`). The Tipper is fought on the drying floor
  (`BOSS_ARENA_SPOTS['boss-tipper']`). Traps met: a fixture placed from the room's middle (the pump shaft) landed over the plate, which also stands across the middle; a pan test in plan view counted
  the rooms under the pans as brine; a low sun cannot come down a roof shaft (it lands 17 m away), so rooms take their sun through the door.
- **Verdigris** (`unit09`, `three/verdigris.js` + `verdigris/`, `tools/gen-verdigris-layout.mjs`, `tools/verify-verdigris.mjs`; site rebuilt 2026-11-16, `docs/plans/verdigris-world.md` section 8): A DROWNED
  FORT IN A REED SWAMP. `verdigris/fort-plan.js` (pure data on `lib/workings.js`) declares the walk as volumes and the doorways as LINKED PAIRS (`link(a, b, ...)`): two linked volumes must share a wall and
  the opening is the span they share, so a declaration that does not meet fails `problems()`. Kinds: `deck` (open: the landing stage, every plank run and junction, the ramps up to tower doors, the bridge,
  the pump stage), `gate` (the vaulted gate passage, roofed), `door`, `stair` (a roofed, graded way down into a cistern) and `room`. `structures()` lists the masonry masses (the curtain with one breach
  per wall, three towers, the keep and its plinth, the gatehouse, three cistern heads with their stairs and the twin cell beside room 3). `height(x, z)` is a volume's floor, or within `EDGE` of a deck's
  closed side the same floor, else `land` (the swamp's bed under `WATER` -0.55, the moat deeper, reed-bed mud, wooded rises past 300 m). `terrain.js` draws the land on a grid with holes under every
  roofed volume, ONE water sheet cut away over every structure hollow below it (`dryRects`; the gate channel and the twin cell's water are drawn on their own), every deck (planks across the line of
  travel, fascia, piles, rails on each closed side), and the masonry and each room's roof by `shell` (`groin`, `joists`, `vault`, `corbel`, `pillars`, `hall`, `pointed`, `arches`), merged by material per
  40 m square. `stations.js` furnishes one room per bench (`host-plan.js` derives the plate from the room and its `face`); `plant.js` holds the boardwalk lamps (a post bolted to a deck's fascia every ten
  metres), the passage and stair lamps, the gate's sluices, the pump's discharge pouring over the north breach (the one mover), the reed beds (one-triangle blades merged per 90 m square, ambient) and
  the far country. Levels: cisterns -3.6, -2.8, -2.0; the winch chamber and the decks 0; towers 1.2, 2.0, 2.8; the keep's hall 4.4. Fog 4 to 220 m. The Leach is fought on the pump stage
  (`BOSS_ARENA_SPOTS['boss-leach']`). Cover: a box per room, door, stair, the gate passage and the twin cell (18); the sun comes in only at doors that face it AND open onto a deck (three).
  `routeTo` passes every doorway square (a point up to a metre either side of it). Traps met: the old water sheet ran through anything sunk below it; a sun opening at a stair's foot is under a
  roof; the strip behind a plate set 3 m from the wall is 0.65 m deep, so a big tank goes above 2.4 m forward over the plate; a stain on a wall is a decal, not a body leaving its room.
- **Brinewire** (`unit10`, `three/brinewire.js` + `brinewire/`, `tools/gen-brinewire-layout.mjs`, `tools/verify-brinewire.mjs`; site rebuilt 2026-11-17, `docs/plans/brinewire-world.md` section 9): A TIDAL
  BARRAGE. `brinewire/barrage-plan.js` (pure data on `lib/workings.js`, `outdoorDoors: true`) declares the wall (west face x -34.6, the crest road x -34 to -24, the deck to the east face at x 4, `DECK`
  12.6, never walked), and the walk as volumes: open kinds `yard` (the north yard runs the wall's full width, the south yard), `road`, `ramp` (two flights graded along z down the east face), `landing`,
  `apron` (the foot, three rectangles round the cage); roofed kinds `passage` (a door through a wall), `adit`, `gallery` and `room` (`ROOMS`: two gate houses on piers over the lagoon, three chambers off
  the gallery at 6.0 under the deck, the switchyard's cage at the foot). Every door is in a room's east side. `height(x, z)` is a volume's floor, within `EDGE` of an open volume's closed side the same floor,
  else `land` (crest and deck on the wall, the lagoon's bed west, the basin and the tidal flats east, the two headlands). `terrain.js` holes the ground mesh under the whole wall and every volume and BUILDS
  the barrage: the deck slab, the east face with the adit's mouth and a railing on its kerb, every open volume's closed side as a wall chosen by what lies a metre beyond it (a parapet; a retaining wall
  under higher land; a kerb and railing over the tailwater side, so the drop is seen; half a metre over the deck so it is seen across), the water's line on every face in brine, the walks' paving
  (one vertex-coloured mesh: joints, wear, salt), and each roofed volume's shell by kind and `shell` (`gable`, `mono`, `vault`, `beams`, `hall`, `cage` with alpha-tested expanded-metal mesh). Two water
  sheets, the lagoon at 10.2 and the tailwater at -1.6. `stations.js` furnishes one room per bench and draws each host's glass as one mesh; `plant.js` holds the ramp's lamps on standards, the gallery's
  pendants, the four outfalls through the ramp's wall (their water the one mover), the deck's gantry crane and hatches, the switchyard (two transformers, a portal gantry, the terminal tower and its line)
  and the far country. Cover: a box per room, passage, the adit and the gallery (14); the low sun (17.6 degrees, from the west-south-west) comes into the gate houses through a window in each one's south
  wall (doors face east, away from it). `routeTo` stands off every doorway square to it. The Clamp is fought on the apron (`BOSS_ARENA_SPOTS['boss-clamp']`). Traps met: a parapet on a raised walk that
  reaches eye height (the deck's, at 13.7 over a crest at 12) hides the whole far side; a solid 0.6 m parapet hides a 12 m drop from someone standing at it, a kerb and railing does not; a window in
  the back wall under a sun this low lands its light past the door, a south window lands it on the floor.
- **Quicklight** (`unit11`, `three/quicklight.js` + `quicklight/`, `tools/gen-quicklight-layout.mjs`, `tools/verify-quicklight.mjs`; site rebuilt 2026-11-17, `docs/plans/quicklight-world.md` section 7):
  A REFINERY ON TWO LAVA FLOWS. `quicklight/refinery-plan.js` (pure data on `lib/workings.js`, `outdoorDoors: true`) declares the levels (`GRADE` 0, `PLOT` 5 south of the upper flow's front at
  z 7 to 9, sunk floors -3.5, -4 and +2), the walk as volumes (open kinds `yard`, `alley`, `ramp`, `court`: two grids of alleys joined by the `rise` ramp through the front; a ramp and a court down to
  each sunk room) joined by a `LINKS` table, and `ROOMS` (shells `arch`, `block`, `cellar`, `skirt`, `table`, `magazine`); `problems()` holds the plan to itself (room sizes, doors with a metre each
  side, ramps no steeper than 1 in 6, every opening answered). `height(x, z)` is a volume's floor, within `EDGE` of an open side the same floor, else `land` (the plant's hardstanding on each flow,
  the front between them, the tank bund at -4, the earth banked over the two bunkers, the lava field outside the fence). The ground mesh runs over the bunkers (their rooms are under it) and is holed
  under every other volume and the control block. `terrain.js` builds every open side as a kerb and handrail (a fence round the yards and at the plant's edge), a parapet over a drop or a retaining wall
  under higher land, the bund's wall, each room's shell, the control block, the cracking reactor on its round skirt and the reactor train on its table. `plant.js`: a rack of steel bents every 6 m over
  every alley (a bent's leg stands on higher land behind a retaining wall, or its beam sits in a shoe on a building's face), a lamp on a bent every 9 m or so, standards on the ramps' walls, a packer
  that fills every block with whole units (eight kinds) nearest the walk first and then on a finer pass, the bund's tanks, the feed heater, the flare stack, rod pylons and the far country. The
  lightning (`atmosphere.js` `buildLightning`) is the one declared light source besides the lamps: unlit bolt meshes, a sky flash uniform and the hemisphere's intensity, no PointLight. Cover: a box
  per room and passage (12), no sun openings. The Flare is fought in the flare yard (`BOSS_ARENA_SPOTS['boss-flare']`). Traps met: the cellar's beams at 4.5 m across the plate's line stood in the
  lean-in box (to 4.6 m), so its clear height is 4.7; `verify:arena` measures the arena table's collider as an axis-aligned box 4.8 m wide in x, so a boss mark must face along z; a guide leg that
  runs exactly along a shared plane belongs to neither volume, so `routeTo` nudges its test point off the plane.
- **Lodestone** (`unit12`, `three/lodestone.js` + `lodestone/`, `tools/gen-lodestone-layout.mjs`, `tools/verify-lodestone.mjs`; site rebuilt 2026-11-14, `docs/plans/lodestone-world.md` section 7): A SLOT
  CANYON IN BANDED IRON. `lodestone/canyon-plan.js` (pure data) declares the hollow, eleven runs along a centre line (`LINE`: floor level over a landing at each bend, graded between), six alcoves (shared-layer
  volumes with one `to: null` mouth) and the pothole; `sample(x, z)` is the walk as a union with an inside depth, and everything is read off it: the height field (`height`: the floor inside; outside, held at
  the floor for 1.6 m, then up to the `tableland` by 3.6 m), `edgeColliders` (a box on every 0.5 m cell along the edge, merged), `edgeLoops` (the edge traced by marching squares), `coverSpec` (a box per run
  and the pothole below the rims, plus the alcoves), `routeTo` (centre line bend by bend, in by the mouth). `terrain.js` draws the ground mesh, a rock-face sheet along the edge loops (courses set back by bed,
  never over the walk) and the overhanging roofs (blocks; stepped or split by a chimney); all `phys: 'ground'`. `rock.js` colours rock by height in the world (beds run level across ground, faces and roofs) and
  carries an `lsStain` attribute for seams, seep stains and the trodden way. `stations.js` furnishes one alcove per bench (`host-plan.js` derives the plate from the alcove); a host faces along an axis, so
  `lodestone.js` turns its box colliders as boxes. The Coil is fought in the pothole (`BOSS_ARENA_SPOTS['boss-coil']`). Traps met: a rock fin under 7 m thick put the faces' top lips in the next part of
  the walk; a 0.4 to 1 m jog where an alcove's side wall met the canyon's wall put face vertices into the walk; a contour simplified against its original neighbours drew a 54 m chord across the rock;
  `lowBodies` reads the ground mesh itself near a wall foot (skip `terrainMesh`); an air hose's bounding box reached 2 cm into a bay.
- **Avalon ship** (`three/ship.js` over `three/ship/`, `ship-rooms.js`, `ship-graph.js`): built from a
  shared kit; doors open as you approach, portals are arches; `SHIP_ANCHORS` derived from the graph and
  must stand on clear deck; every doorway names its destination on both faces; lighting rooms declare
  sources (`ship.addLight`, ≤8 pool lights). `[E]` acts on what the camera is pointed at
  (`aim-target.js`), never what is nearest. Surfaces (`ship/materials.js`): a material tagged
  `userData.worldUV` is laid at a fixed size in metres by `applyWorldUVs` (`ship/kit.js`), box-projected
  per triangle with u to the viewer's right. Lining materials (panel, rib, ceiling, bulkhead) are unbroken
  sheets (`platedMetal({ panels: 0 })`): seams and fasteners are modelled parts, because a grid or rivet row
  in a world-scale texture cuts across the parts at random. Only the hull plating wears a plate pattern
  (`/art/durasteel_plate.jpg`); drums and casings wear `M.vesselMat` on the cylinder's own UVs.
- **Voyage** (`three/voyage.js`, `ship-exterior.js`, `guide-arrow.js`, `screens/voyage.js`): at T4 a world
  is flown to, never stepped into; two passes with one camera; the only cut is inside a full cloud deck.
  Stepping off must not change a world's light count (`hatchLamp` descriptor into the `LampPool`). Stands
  down for T3 and below, first route of a page load, signed-out and reduced motion.
- **Hologram/terminals:** holos always display by default, dismissal is session-scoped; a press closes only
  via the "Close [X]" badge (`closeRect`). T4 terminals are `.in-world-terminal` overlays with `CLOSE`.
- **Boss arenas (the fight is seen):** `BOSS_ARENA_SPOTS` in `boss-arena.js` puts the player and the boss on open ground.
  A boss has no site, so `learn-quest.js` calls `stage.setArenaBench(questId, spot)`: `three/arena-table.js` stands a real
  bay bench (plate, steel deck, hazard-striped firing line, a box collider) 2.2 m in front of `playerPos` toward the boss and
  registers it in `world.benchAnchors` like a host's, so the tabletop **deploys onto it with the world behind it** and the boss
  in the glass (no private room); `disposeLearnQuest` takes it down. The player keeps their feet (walk is not suspended). The
  table's corner toy foe stands down in an arena (`viewer.arenaFight`). `BossArena` asks the leaned-in view to **look up at the
  boss** for each beat (`bench-host.js` `requestGaze`: arrival, the volley, the wind-up and bolt, the roar between phases, the
  collapse; `BenchViewer3D.gaze` turns the camera, never moves it; presses on the plate are ignored while it is away; reduced
  motion never moves the camera), and the arena's shake is applied by the leaned-in view (`setShakeSource`). Damage is seen:
  bolts leave a boss's own `muzzle`, armour plates are struck off at wound thresholds (`monster.armour(mesh, at)`, sparks on
  `'plate'`), it rears now and then with no bolt and no cost. The five bodies (hopper, lantern-eater, warden, compressor,
  crucible) are articulated rigs in `learn/engine/boss-models.js` (`buildBossRig`, `attackPose`; weathered plate maps, filament
  lenses only, no point lights), posed by `CombatMonster3D.update` from the fight state. Kettle's golem is fought on the cast house floor of the works (`verify:arena`). `verify:arena` holds the table's ground in
  all five worlds, the bodies, the gaze and the shake.
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

## Quest questions, opening scenes and world troubles (2026-11-20)

Plan and status: `docs/plans/mystery-walkup-plan.md`. Every non-Toolkit quest opens on a question (`quest-story.js` `mystery`) and its
debrief's Case Pin answers it; the debrief (`ui/story-anim.js`) and the Case Board show the question above the pin.

- **Asking.** 3D On, on foot, with an opening scene for that quest (`src/npc/intros/<world>.js` `INTROS`) and its crew loaded: `[E]` at the
  bench plays the scene (`stage.playIntro` → `three/mystery/director.js`), then the bench opens and skips its question card
  (`story/intro-shown.js`). Otherwise the bench opens on the question card (`ui/case-open.js`). Stage 1's lead line is the question
  (`frame.js`), else its `stage-story.js` line.
- **Scenes** are step lists (`place`, `look`, `go`, `follow`, `say`, `start`, `wait`, `vanish`) over named points from
  `intros/spots.js` (`view`, `stand`, `stand2`, `meet`, `exit`, `trail`) and actors (`npc:<crew id>`, `cloak`; speakers also
  `voice:<id>` and `vess`). Controls are off while one plays (the stage's learn-world branch hands the camera to `director.update`);
  E/Space/Enter read the line card, Esc or SKIP ends it. A scripted crew member is skipped by `CrewSim.step` (`m.scripted`) and put
  back on its schedule at the end; a walk-up comes from where the person is when within 30 m. Walks speed up so none runs over ~14 s;
  the figure only runs 9 m before it is parked under the ground (never hidden, so nothing compiles when it appears).
- **Problems in the world** (`three/mystery/site.js`, `world.mystery`): built by `attachCrew` (3D On with a renderer only) before the
  crew's walk grid, so each prop's disc is a collider for crew and player; props are baked with `mergeStatic` (effect parts `noMerge`),
  take the world's cover mask, and never add a light. A quest's symptom is on until its bench is cleared (a scene holds it `off` until
  its `start` step, then `on`); the world's (`SYMPTOM`) until its boss is beaten, read from the session once a second. `lamps: 'sputter'`
  drives every `LampPool` source out of step and the shared `M.lantern` glass with them; `'dim'` sags them together; both restore the
  world's own intensities.
- **Placing.** `node tools/npc/pick-spots.mjs [world ...]` places every prop 9–24 m of walking from its bench (crowded sites: 6–34 m,
  tighter), clear of colliders, bays, posts, task items and other props; then rebuilds the grid with every prop as a wall and re-places
  any scene whose walk got long. `verify:intros` re-checks the spots against the world as built, the data (real quests, the world's own
  crew, lines ≤ 25 words), that no two worlds share a set of scene shapes, and plays every scene headless to its end.

## Crews (NPCs) — every Learn world (2026-11-19)

Plan and status: `docs/plans/npc-plan.md`. Every Learn world has six people walking their rounds: Tallow (`unit01`, the pilot) and the
thirteen after it (`unit02`–`unit14`), 84 in all, each world with one side task.

- **Bodies** are Microsoft Rocketbox avatars (MIT; notice in `public/models/npc/LICENSE-rocketbox.txt`), 28 listed in `src/npc/models.js`
  (construction, fire, medical/lab, pilot, security, delivery, gardener and everyday clothes; `group: 'Adults'` for the everyday ones).
  No body is used twice on one world; a world loads only its own six. `tools/npc/build-models.mjs --src <Rocketbox root> [--missing]`
  converts them (needs Blender 4.4+ and Python with Pillow; the sources are not in the repo: a sparse checkout of the needed avatars
  and clips lives in git-ignored `assets-src/rocketbox/`; `--missing` builds only bodies or clip files `public/models/npc` lacks and
  merges the manifest): `prep_textures.py` turns each colour/normal/specular TGA set into glTF colour, normal and metal/rough maps
  (roughness from specular; a part with only colour gets a flat normal and matt roughness; a colour shipped only as a variant, e.g.
  `_color_blue`, is used as the colour), `build_glb.py` rebuilds the materials and exports `<id>.glb` (desktop: ~10k triangles, 2048
  colour on body and head) and `<id>.lite.glb` (handset: decimated to half, 512 textures), and one clip file per skeleton
  (`clips-m.glb`, `clips-f.glb`). The walks were captured moving: the build takes the travel off the root and writes each walk's ground
  speed into `manifest.json`, and the runtime scales the clip to the walker's speed so feet do not slide. `slim-clips.mjs` keeps only bone
  ROTATIONS (plus the root's position) as 16-bit quaternions, so a clip plays on any body of its skeleton without stretching limbs, and
  drops Biped's `Nub` end-markers.
- **Data** (pure, no THREE): `src/npc/tallow-crew.js` and `src/npc/crews/<world>.js` each declare `POSTS` (world `[x, z]` + a `look`
  point), `CREW` (name, role, model, looping `schedule` of `{ post, act, for: [min, max] }`, `talk.default` line sets plus `afterBench` /
  `afterClue` sets) and `TASKS` (one per world; `item.kind` is tarp, cloth, glove, paper, glass, metal or bolt). `src/npc/crews.js`
  registers every world (`CREW_WORLDS`: key, world id, module, class, its crew, posts and tasks) and gives `walkFor(key, world)` (the walk
  grid options) and `keepOffFor(world)` (the boss arena from `data.arena`: discs round the boss, the player's mark and between).
  `src/npc/talk.js` picks a line set (unlocked sets first, then everyday ones, moving on each talk) and runs a task's ask → remind →
  thanks; `src/npc/tasks.js` gathers every world's tasks for the lore notebook.
- **Posts** for the thirteen later worlds were proposed by `tools/npc/pick-posts.mjs <world>` (reachable from the spawn, clear by 0.8 m,
  7 m from every bench approach and every other post, off the arena; by landmarks first, then spread over ground within 24 m of a
  bench or landmark; dealt into six rounds of three neighbouring posts, plus a task item spot) and pasted into the crew files.
  `tools/npc/scout.mjs <world>` prints a world's walkable area, ground heights and landmark-side spots. Both are authoring aids;
  `verify:npc` is the check.
- **Simulation** (`src/npc/crew-sim.js`, pure): a 0.5 m walk grid closed by the world's colliders (bucketed on a 4 m lattice), every bench's
  bay (`bench-bay.js` `bayBoxes`, less the lean air), the `keepOff` discs, ground outside the `floor` heights, and (with `maxStep`) ground
  that changes more than 0.3 m across a cell, so terraced and hilly worlds are walked by their ramps and slopes. Tallow keeps the pilot's
  settings (±72 m, one flat level, its pit closed); the others use ±96 m (the player's walk is held to ±100 m), a wide floor and the step
  rule. A* per schedule leg, string-pulled, cached. Members stop for the player standing in the next 1.6 m of their way, give way to each
  other by roster order, step aside after 2.5 s, and stop and turn to the player while talked to.
- **Runtime**: every Learn world calls `attachCrew(this, '<key>')` (`three/npc/attach.js`) at the end of its constructor (3D On with a
  renderer only; no crew in node checks or 3D Off), `this.crew?.update(delta, cameraPos)` first in `update`, and `this.crew?.dispose()`
  in `dispose`. `three/npc/crew.js` (`Crew`) fills the walk grid 3 ms a frame (up to ~0.75 s of work on the busiest worlds, so it is
  never one stall) and starts the crew when it is done. A body is shown only once warmed (`Crew.warm`): its materials compiled with
  `compileAsync` and its textures sent up with `initTexture` about 2.2 Mpx a frame (a desktop body has 15 textures, two at 2048²;
  uploading six bodies on one frame was the freeze on landing). The stage calls `warm()` on the voyage destination's crew every frame
  of the flight, so grid and bodies are ready before the ramp opens; `three/npc/figures.js` loads and clones bodies (`SkeletonUtils.clone`), switches
  alpha parts to alpha-test, and cross-fades clips. Bodies past 70 m are not drawn; past 30 m animation steps at 10 Hz; real shadows only
  within 25 m (a blob decal otherwise, and always on a handset); a handset draws at most four. The crew group is part of the world
  (`markWorldOwn`) so walking crews do not hold an open bench's shadow live. The cover mask is applied to each body as it arrives.
- **Stage wiring** (`stage.js`): `aimedInteraction` adds `crew.aimTargets()` to the Learn world's targets (`[E] TALK TO <NAME>`, `[E] TAKE <ITEM>`);
  `onInteract` advances the open talk card first; `worldColliders` appends the crew's moving discs (updated in place, so the player cannot walk
  through a person); `syncCrew` switches the standing world's crew on and the rest off; `setArenaBench` hides the crew during a boss fight.
- **Talk card and carry chip**: `src/ui/npc-card.js` (bottom card, name + role, one line per [E]/click/tap, Esc or walking 4 m away closes).
- **Side tasks** (one per world, chemistry-free: a dropped thing the giver saw on the night the Fifth came): state in the synced flag
  `npc_task_<id>` (`asked`, `carrying`, `done`); done files `crew:<id>` in the lore notebook (`story/lore.js`, kind `fieldnote`), which the
  Case Board lists with the act's notes. No XP and nothing gated. 3D Off has no crew and no tasks.
- **Checks**: `verify:npc` (`tools/verify-npc.mjs [world]`, starts first in `npm run verify`; loads glTF headlessly through
  `tools/lib/npc-gltf.mjs`), per world: posts clear, reachable, off bays and the arena; every leg walks clear; ten simulated minutes with a
  wandering player (no wall, bay, arena or person overlap, no ground steeper than the walk allows plus 0.15 m, no wait over 12 s, every stop
  reached); line rules (≤25 words, no digits, banned narrative words); tasks and unlocks name that world's benches and real clues, no body
  twice on a world. Across worlds: unique member ids, names and task ids, one task per world; no XP calls; every body 1.5–2.0 m, binding
  every clip it plays with its ankles on the ground through a walk.

## Quest 1 — Charge Gardens of Erebus (20 stages, 650 XP; 715 with bonuses)

Arrows from red giver to blue receiver; stages 1–7 one arrow, 8–10 three molecules, 11–20 two ordered
arrows. Briefing modal auto-shows only on stages 1, 5, 8, 11 (`AUTO_MODAL_STAGES`). Touch: `touch-action:
none`, single-pointer drags. `playReaction` never strands the player. Concept cards appear after solve.
Epilogue (`QUEST1_EPILOGUE`) is duplicated in `Quests.gs`, the proxy and `quest.js`.

## Player journey

`#/` landing (with "Continue as Guest") → `#/demo` (stage 1, no account) → `#/register` or `#/login` ("Continue as Guest" for local-only play) → `#/onboarding` (a player with a guild slot
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


## World-by-world rollout (2026-10-23)

Lanternfall, Ligar, Bellows and Ember Reach were reworked to the Tallow pattern (T1 to T8, U1 to U5 of `docs/archive/2026-10-29/Avalon problems and clashing rules.md`).
Each world's build record is in its plan file (`docs/plans/lanternfall-world.md`, `docs/plans/tallow-ligar-world.md`, `docs/plans/bellows-world.md`, `docs/plans/ember-reach-world.md`).
Registry after the pass: 44 quest modules, 38 benches, 6 bosses, 223 stages. Every reworked bench is cut to 3 to 5 stages, has one
`predict: true` click stage whose guess the next stage quotes, a lead line (never on a boss), Tour steps for every tool and no briefing; bosses
keep five distinct phases. Lanternfall 50 stages, Ligar 45, Bellows 33, Ember Reach 33. Field points that only carried a copy of the bench
(Lanternfall `flume`, ice hole; Ligar `chip`, `sump`; Bellows `gauge`, `bleed`; Ember `flowline`, `edge`, `coil`) or acted as a lock are
retired; the hardware stays as scenery and each `verify:<world>` expects the new list. 34 story animations exist (Tallow 7, Lanternfall 10,
Ligar 6, Bellows 7, Ember Reach 4); painters live in `ui/story-scenes-<world>.js`, merged into `SCENES`.

**Shared hooks the passes added**
- `table/tour.js`: `registerTour(kitId, {fixtures, pieces, dials})` and `addTourText` for a kit's own words; per-world files `tour-ligar.js`, `tour-lanternfall.js`, `tour-bellows.js`, `heat-tour.js`. A `<kit>:<kind>` entry is looked up before the generic one.
- `engine/table3d.js`: a `dress3d` group may carry `userData.sync(fixture, state)` (called from `syncFixtures`), `userData.update(fixture, state)` (state-following dress) and `userData.tick(dt, still)` (every frame, `still` for reduced motion).
- `engine/model-parts.js` + `ui/model-viewer.js`: reward model types `gas` (Bellows), shapes/crystals/lobes (`model-parts-ligar.js`), wave/photons/ladder/orbital/rack/radii/cuvette (`model-parts-lanternfall.js`), molecules and boxes (`model-parts-ember.js`). A wave is the exception: it is a flat trace on the desk, never turned, animated from its first wavelength to its last and back so its crest rate and colour follow. Bond rods take `order` (up to 3), `r` and `thin`.
- Per-world solids: `gas-particles.js` and `kits/gas-3d.js` (a sealed box and cylinders with moving particles), `ligar-mol3d.js` (molecule cards stood up as solids at `3D On`), `lab-props-lanternfall.js`, `heat-solids.js` and `heat-parts.js` (bath, bond, phase box, cells, chamber).
- `verify:table` "Predict first" holds `unit01`, `unit02` and `unit03`; Bellows and Ember Reach hold the same rule in `verify:learn` and `verify:ember` (`tools/lib/ember-learn-checks.mjs`). Lanternfall's per-quest checks are in `tools/lib/verify-lanternfall-learn.mjs` and `tools/lib/lanternfall/`.
- `verify:story` requires an animation for every quest of Tallow, Lanternfall and Bellows.

**Not done / open**: the owner has not played any of the four worlds (nothing was browser-tested). Lanternfall's `src/ui/field-manual.js` was re-pointed to the new stage indexes. The cut stages are in git history (`6628c43`); only Lanternfall's old verify block was archived (`archive/2026-10-23/`). Ligar `q8-hybrid` has no lead line (it is in `NO_LEAD`).

## Per-bench build notes (moved from CLAUDE.md, 2026-10-29)

These were the long per-bench paragraphs inside CLAUDE.md's doctrine. The rule each one illustrates is in `PRODUCT.md` ("Building a Learn world"). They are kept verbatim as build records; where a note and the code disagree, the code wins.

### Table piece geometry (formerly a CLAUDE.md doctrine bullet)

- **Table piece geometry (`table-props.js` / `table3d.js` / `atom3d.js` / `ligar-props.js` / `orbital-props.js`):** Cards are rounded slabs, tokens are pucks, subatomic particles (protons, neutrons, electrons, specks) are rendered as solid 3D spheres resting on the tabletop with mapped signs/labels, prediction models (`buildModel3D`: Dalton solid billiard ball, Thomson plum pudding with embedded electron spheres, Rutherford tiny dense center with outer orbit ring), nuclei (`buildNucleus3D`: central dishes with planar/tilted non-overlapping layouts ensuring all protons and neutrons are completely visible from default view without occlusion for exact counting), specimens (`buildSpecimen3D`: 3D atom displays with concentric orbit rings, continuously orbiting electrons, charge needle gauges, and protective cage domes), and atoms (`buildAtom3D`: 3D clustered nucleus with tilted orbital rings and continuously spinning electrons), grounded by a contact base pedestal on the tabletop plate (unless disabled via `opts: { atom3d: false }` or `diskAtoms` on specific stages such as Tallow site 1 stages 5–7 and Tallow site 4 stage 7, where atoms/ions revert to the drawn disk/bead version). On Ligar molecular geometry benches (`domain.js` / `domain-hub.js`, `q6-shape`, `boss-warden`), the VSEPR atom kit renders in authentic 3D: the central hub atom floats elevated above the table plate on an emitter base pedestal (`floatY = HUB_R * c.s * 2.4`) with equatorial socket rings removed, while attached peripheral atoms and lone pair lobes branch in true 3D space according to their VSEPR spatial vectors (tetrahedral 109.5°, trigonal pyramidal 107°, bent 104.5°, linear 180°), revolving in 3D with the Turn dial. Tabletop lathe stands are hidden on joined atoms (`baseMesh.visible = false`) with 3D angled steel bond rods connecting the floating hub ball directly to each arm ball in 3D space (`Table3D.layJoins`). Lone pairs render as clean translucent balloon lobes attached directly to the hub ball surface along domain vectors without detached gaps, floating lathe stands, or interior rods. Protractor tools interact with elevated 3D floating arms via direct mesh raycasting in `Table3D.unitsAtRay`, enabling immediate angle measurements across non-coplanar 3D geometries. All materials across orbital and domain props are table-owned (`c.own(...)`). Orbital pieces (`p.kind === 'orb'`, `orbital-props.js` `buildOrbitalPiece3D`) render across all quest benches as authentic 3D spatial models mounted on turned metal tabletop pedestals with front identification plaques: spherical s clouds with inner core density shells, dumbbell px/py/pz orbitals with dual lobes and quantum wave phase coloring (amber + phase, cyan - phase), directional hybrid lobes (sp, sp², sp³), and visible live electrons inside the clouds (unpaired single electron or opposite-spin paired electron spheres) with quantum circulation and breathing animations. On hybrid orbital mixer benches (`q8-hybrid` `mixbowl`, `buildMixer3D`), the mixing apparatus physically mixes the orbitals in 3D space: a swirling vortex in the mixing basin on the left, an energy conduit bridge across the center, and a reactor plinth on the right where hybrid orbitals blossom in 3D space above the central carbon atom (e.g. four tetrahedral sp³ lobes revolving in 3D space with electrons inside each hybrid cloud). Mounted specimens with electron rings (`atoms.js` `paintSpecimen`) draw distinct concentric track bands and high-contrast solid orbit rings (plus dashed empty-shell guides when `maxRings` is configured) so shell separations and electron counts remain distinct at a glance. Plaque legends (`bench3d.js` `engravedPlaque`) scale font size to fit width and height down to minFont, clamping offsets to padding to prevent clipping on single-word tokens ('Together', 'Rainbow'). Emitter piece tags (`lab-props.js` `buildEmitter`) sit clear of heat fins along +X so ribs do not occlude labels ('Relay mast', 'Galley oven', 'Medic X-ray'). Ruler start ticks (`optics-draw.js` `paintRuler`) left-align LO marks to avoid socket bezel overlap ('0.1 nm'). Pieces seated in holder sockets (`buildSocket` 'holder', including `cloud.js` films/tiles) elevate to rest atop the socket's 0.010 m rubber pad, and well sockets (`buildSocket` 'well') elevate cuvettes by 0.022 m (`table3d.js` `placePieces`), preventing pieces from sinking inside the socket base. Cuvettes (`lab-props.js` `buildCuvette`, `cuvette-draw.js` `paintCuvette`, `cuvette.js` `dress3d`) render authentic spectrophotometer proportions (~3.3:1 slender height-to-width ratio, 30 mm square profile), hollow cell geometry with a thick optical glass floor, polished clear optical windows along the beam axis (X), frosted/ground handling faces front and back (Z), open top rim with bevel edge (no steel collars), etched orientation triangle mark ("▽") and 10 mm path mark, liquid column with curved concave meniscus, and aligned beam pass-through (ground + 0.048). Spectrometer fixtures with a slot omit glass instrument case glazing (`deckStyle` null) to keep the sample well open. In 2D (`cuvette-draw.js`), the transmission strip and label start right of the slot (X=24) without overlapping the slot rectangle, and `gotThrough` uses an effective visual absorption path to clearly extinguish orange light at ~630 nm. The orbital cloud view fixture uses an enlarged, interactive continuous 2D/3D joystick viewer (`props: { joystick: true }`) for azimuth (`turn`) and polar tilt control, continuous rotation via joystick drag or plate drag, and clean slice toggle button without competing nodal slice overlays or jump snapping.

### Per-bench wording and layout decisions (formerly the tail of the "Plain labels" bullet)

Across Tallow benches (`q2-core`, `q4-ledger`, `boss-hopper`), needle fixtures are labelled "Charge" (not "Needle"). Atom-building stages in `q4-ledger` and `boss-hopper` phase 2 use a central nucleus dish (`tray:core` with `spot: true`), concentric electron orbit rings (`tray:out` with `orbit`), and live Charge needle plus Mass counter fixtures (`kind: 'mass'`). Across all Tallow quests (`q1-grain` through `q6-weigh`, `boss-hopper`, `unit01-atoms.js`), all extraneous text, feature advertisements, placeholder copy, cheerleading fluff ('Nice job!', 'Great work!'), and gratuitous fantasy metaphors are stripped in favor of concise, chemically accurate prompts and reward bodies (all reward cards <= 45 words, compliant with `VOCABULARY` gates and 1-sentence prompt rules). On Lanternfall bench two (`q2-photon`), the phototube collector is labelled "COLLECTOR" (not "CUP"), the plate slot is labelled "HOLDER", the fixture header "Photocell" is hidden, and prompts, hints, notes and diagnostics refer to electrons freed and "Electrons Per Second" rather than an ambiguous "cup" or "Freed Per Second". On Lanternfall bench one (`q1-wave`), vertical wave ribbons are removed so waves lie flat in the table plane, pulse timer marker reads "Speed _ x 10^8 m/s" with the selected value filled into the blank, the wave explanation 3D viewer directly labels the wavelength on the wave, and the ruler bench removes "EACH TICK TEN TIMES THE LAST". On Lanternfall bench three (`q3-lines`), the Bohr ladder model viewer removes redundant titles and light given out banners, and the stage 5 note is clarified to finding which element is in the cell. On Lanternfall bench four (`q4-cloud`), the orbital cloud bench is reworked for intuitive control: vertical slabs and competing slice buttons are removed, the joystick is enlarged and supports continuous rotation (as does dragging directly on the plate), exposure terminology is replaced with "Number of shots: 1/50/500", and slice toggling is handled cleanly on the joystick fixture. On Lanternfall bench five (`q5-numbers`), the orbital ladder shows subshell row labels and ml values, the energy axis has sufficient left margin to prevent 'ENERGY' clipping, target orbitals render an inner amber ring and brackets with a TARGET header, electron dispensers are labeled Add tools ('Add ↑', 'Add ↓', 'Remove'), 3D vertical arrow rods on orbital boxes are removed to avoid cluttering the drawn green arrows, and unnecessary rotating 3D reward models are removed. The rejected electron tray ("Cannot be placed") on stage 4 is sized with matching cell pitch (`cell: 40, cellH: 14`) so snapped cards sit centered inside the tray. On Lanternfall bench six (`q6-filling`), the bench is dedicated to the aufbau principle and electron configurations: paramagnetism and diamagnetism are removed (deferred to molecular orbitals). The energy ladder board shows the potential energy gradient with electrons filling lowest rows first, and reads out Ground State vs Excited State. The Energy Well fixture (`energyWell`, `shells-3d.js` `dressWell`) models potential wells in 2D and 3D, where electrons in higher rows physically fall down with gravity/spring dynamics into empty lower tiers when tested or excited. All stages (carbon ground state, oxygen configuration card, potassium 19th electron predict/test 4s below 3d, scandium 21st electron in 3d) strip all feature advertisements, extra text, and fluff in favor of concise, chemically accurate prompts and rewards. In explanation reward cards and debriefs, generic rotating 3D stick models and plain line dots are replaced with interactive concept-driven filling animations (`filling-animator.js` `mountFilling`, `story-scenes-lanternfall.js` `rackFill`): visual energy ladder axes with subshell rungs, boxes, and animated spin arrows (↑ amber, ↓ pale) demonstrating Aufbau bottom-up filling, Hund's rule degenerate orbital spreading with parallel spins before pairing (Carbon, Oxygen), energy order vs shell order with 4s sitting below 3d (Potassium), and filling of the 3d transition metal subshell (Scandium), with bottom flashing rule banner text removed. On Lanternfall bench seven (`q7-pes`), stage 2's explanation 3D model animates an incoming light ray hitting the outermost electron and ejecting it away from the atom, while the two inner electrons remain tightly bound. Across all Lanternfall benches (`q1-wave` through `q9-absorb`, `boss-eater`, `unit02-quantum.js`), all extraneous feature advertisements ('3D', '(Beyond the exam.)', 'using the Add tools') and vague or poetic metaphors ('moths drink violet', 'where it wakes', 'weigh each shell', 'bead on a rung', 'costs the table a point of Integrity') are stripped in favor of precise physical and chemical concepts. Across all Ligar quests (`_ligar.js`, `q1-joins` through `q9-orbitals`, `boss-warden`, `unit03-bonding.js`), all extraneous text, feature advertisements ('Drag to turn it.', 'Not to scale.', 'as a ball-and-stick model', 'A Guess Comes First', 'Your guess is locked in, and the next bench tests it', 'a miss costs a point of Integrity'), anthropomorphic phrasing ('atoms are happiest', 'refuse to give one up', 'content with eight', 'arms push each other'), and fantasy metaphors are stripped in favor of direct, chemically accurate scientific descriptions (compliant with `VOCABULARY` gates, reward card constraints >= 40 chars and <= 3 sentences, and 1-sentence prompt rules). On Ligar bench two (`q2-lattice`), stage 4 renders ions as discrete 3D beads (`buildBead`, `disk: true`), avoiding overlapping Rutherford electron clouds. The grid fixture animates physical shear displacement and electrostatic repulsion: pressing "Slide a Layer" physically shifts row 0 (`slideDx: 14, slideDy: -2.5`), aligns like charges (Na⁺ over Na⁺, Cl⁻ over Cl⁻), opens a visible cleavage fracture plane with repulsion markers, and displays explicit electrostatic diagnostic readouts. Explanation animations across the bench reveal the underlying atomic structures and their physical mechanisms: the debrief story animation (`linerHeat`) simulates all four structural classes (discrete molecules with weak intermolecular forces separating at 115 °C with zero current; ionic lattice of alternating Na⁺/Cl⁻ ions locked solid until melting at 801 °C frees mobile charges; metallic cation lattice with delocalized mobile electron sea conducting cold and molten; and continuous covalent network holding intact at 900 °C without mobile charges as the vessel liner); the stage 4 reward model animates 3D shear displacement, like-charge alignment, and cleavage plane fracture; and the stages are refactored to reveal structural causes (charge mobility and bond strength) rather than superficial behavior, with all feature advertisements and extra text stripped. On Ligar bench three (`q3-distance`), stage 5 ordering rail ends are labelled "Highest" and "Lowest" (ranking ionic compounds by melting point). On Lewis slate benches across Ligar (`q4-dots`, `q5-resonance`, `boss-warden`), electron lone pairs and single electrons are drawn as dots on the slate around the central and peripheral atom chips instead of on the chips themselves, and bonds are represented as clean lines fully connecting the two atoms (single bond = 1 line, double bond = 2 parallel lines, triple bond = 3 parallel lines) without circular turned brass rings or equal signs in rings, matching authentic Lewis diagrams. Slate boundaries (`atoms.js` `slateParts`) maintain sufficient margins (`SLATE_R + 5.5` on horizontal edges and `SLATE_R + 6` on the bottom) so that lone pairs and single electrons remain fully visible on the slate face and clear of the 3D timber frame, inner steel lip, and corner iron straps.

### Reward-model and explainer notes per bench (formerly the tail of the reward-card bullet)

`unit02/q4-cloud` stage 3 uses `type: 'standing-wave'` to demonstrate why non-integer laps cancel out via destructive interference (Lap 1 crest vs Lap 2 trough) while whole numbers reinforce, paired with `dress3d` on `wavering` fixtures (`cloud.js`). Stage 4 provides an interactive continuous joystick and cloud plate dragging for azimuth and polar tilt without 30° jump snapping, clean [ SLICE ON ] / [ SLICE OFF ] toggle button, with extraneous fancy terminology ('Nodal slice', '3D slice demo', 'Slice Guide') removed in favor of direct intuitive control. Stage 5 reward model uses `type: 'd-orbitals'` (`src/ui/orbital-3d-viewer.js`) presenting five distinct 3D d-orbital animations ($3d_{z^2}, 3d_{xy}, 3d_{xz}, 3d_{yz}, 3d_{x^2-y^2}$) with tab switching, phase coloring, rotating lobes, and an "All 5" comparison. The post-quest debrief features an interactive 3D orbital viewer (`mountDebriefOrbitalViewer`) comparing $s, p$, and $d$ orbital geometries and nodal topologies. Lanternfall bench eight (`unit02/q8-trends`) stage 2's explanation reward model uses `mountRadiiShrink` (`src/ui/radii-shrink-animator.js`) to animate atomic radius contraction across Period 2 (Li → Be → B → C): sequentially adding protons to the nucleus and electrons to the outer valence shell with nuclear attraction pulses, while the outer shell and electrons smoothly shrink inward, with a faint ghost boundary at the initial Lithium radius for scale, and no text anywhere in the animation. Stage 3 uses an interactive 3D shielding and effective nuclear charge animation explainer (`src/ui/shielding-explainer.js`, `mountShieldingExplainer`, model `type: 'shielding'`): visualizes central nucleus protons (+Z), inner core electron shells with negative shielding cloud cancelling positive charges, valence shell with net effective attraction pull ($Z_{eff} = Z - S$), force ray cancellation, and comparison across elements (Na, Mg, Li) and modes (Shielded vs Unshielded). Stage 5 uses an interactive 3D ionic radius animation explainer (`src/ui/ionic-radius-animator.js`, `mountIonicRadius`, model `type: 'ionic-radius'` / `type: 'radii'` with ions): visualizes how removing an electron (Na → Na⁺) strips the outer n=3 shell and contracts the atom by −45% under the unshielded pull of 11 protons, how adding an electron (Cl → Cl⁻) spikes electron-electron repulsion and swells the n=3 shell by +83% with no extra protons, and provides an interactive scale comparison (Na⁺ < Cl⁻ < Na) with live metric badges, replay actions, and 3D drag rotation. Lanternfall bench nine (`unit02/q9-absorb`) explanation reward models use an interactive 3D cuvette explainer (`src/ui/cuvette-explainer.js`, `mountCuvetteExplainer`, model `type: 'cuvette'`): visualizes an optical glass cuvette containing hydrated Cu²⁺ ions in translucent copper(II) sulfate blue liquid; mode 1 demonstrates Complementary Colour with polychromatic white light entering, Cu²⁺ ions selectively absorbing orange photons (~630 nm) with excitation pulses, and blue light emerging; mode 2 demonstrates the Beer-Lambert law ($A = \epsilon b c$) with a monochromatic 630 nm orange beam attenuating exponentially across path length $b$, live $I_0$, $A$, and $I$ metrics, stable lab orientation without idle auto-rotation, and concentration presets (2.0, 4.0, 8.0 mmol/L) illustrating $A \propto c$. The spectrometer reading and vocab adhere to standard spectrophotometry terminology: displays and defaults use "ABSORBANCE" (never "DIMMING"), stage 3 prompt asks for "wavelength of maximum absorbance", stage 4 relates concentration directly to absorbance, and the recorder Y-axis is "Absorbance". In 3D (`cuvette.js` `dress3d`), the beam passes directly through the cuvette liquid at `{ x: slot.at.x, y: slot.at.y - (RECTS.cuvette?.hh || 10) * 0.22 }` (ground + 0.048) and terminates cleanly into the photodetector housing at the well edge, completely clear of the digital display and Record button, with physical source, sensor, and display bezel casing hardware. Cuvettes consistently maintain standard optical fill height (0.82) with tint depth scaling with concentration, displaying concentration in mmol/L rather than misleading drop counts. Solute tools are labeled `Cu²⁺ Stock` (+2.0 mmol/L) and `Rinse` (Reset to 0.0 mmol/L). All feature advertisements, promotional copy, and fancy filler text are stripped across the bench in favor of concise, scientifically clear descriptions. On stages 4 and 5, the stripper fixture is named "Electron Remover", its action button is "Remove Electron", readout displays print "___ electrons taken off" and "Required ___ kJ/mol", and the stage 4 ordering rail ends are "Requires least energy" and "Requires most energy". Across Ember Reach benches (`unit05/q1-flow` through `q7-gibbs` and `boss-crucible`), all feature advertisements, integrity briefing modals, redundant prediction prefixes/verdict fluff, and colloquial metaphors are removed in favor of concise, rigorous thermodynamic definitions and single-section debriefs; heat transfer variables ($q$, $m$, $c$, $\Delta T$) and the heat equation $q = mc\Delta T$ are explicitly taught across `q1-flow` and a dedicated stage 3 in `q2-calorimetry` prior to metal identification and reaction calorimetry. Across Bellows benches (`unit04/q1-knocks` through `q6-real` and `boss-compressor`), all feature advertisements, meta tutorial text, redundant prediction prefixes, verdict fluff, and informal metaphors are stripped in favor of concise, chemically accurate gas law explanations, single-section debriefs, and factual story beats.

### Per-world records and traps (formerly "Where the rest lives")

Ligar's teaching audit (AP Unit 2 coverage, per-bench intuition and busywork review, open defects, the fix list) is `docs/archive/2026-10-29/Ligar-audit.md`.

Ligar now holds: `q2-lattice` 9 stages (alloys melt lower; rank unheated blocks from pictures), `q3-distance` 6 stages (Coulomb's law on an unheated salt; 2 mol of bonds), `q4-dots` 8 (count the electrons first; stage 7 SF₄ has sulfur hold ten, stage 8 NO leaves one electron on nitrogen, via the Single tile), `q5-resonance` 8 (formal charge, hand-counted; bond order 4/3), `q8-hybrid` 9 (predict which bond turns; sigma and pi counted; sp² and sp mixed from a formula card), `q6-shape` 10 (count domains from a formula; five domains: axis and ring; three lone pairs leave XeF₂ linear; six domains), `q7-polarity` 7 (electronegativity first; subtract printed pulls; stage 7 percent ionic character from a card's printed dipole and bond length, `vsepr.js` `BOND_DIPOLE`), `q1-joins` 5 (stage 3 prints each atom's pull via `opts.pull`), `q8-hybrid` stage 4 builds ethene's two carbons as SEATED atoms: every orbital (`orbital(..., { seat, apart, nucleus })`, `domain-orbitals.js`) belongs to its atom, so it cannot be carried off (`settleSeated`, run by the kit's `settle`, sends it back to its seat), and overlapping two moves both atoms together until the nuclei stand `apart` units apart; at 3D On each atom is one floating nucleus on a brass stem with its sp² lobes drawn from the nucleus and the p orbital standing through it (`orbital-props.js` `buildSeatedOrbital3D`, posed by `piecePose3d`; bonded lobes swell, turn green and share a cloud), and its reward model `{ type: 'sigma-pi' }` is `ui/bond-overlap-animator.js` (ray-marched sum of the two atoms' orbitals as the nuclei approach, σ / π / both). `verify:bench` aims a press at a floating piece where it stands, not at the plate point under it. `q9-orbitals` 3 (optional; seats ten electrons, two are poured; flat boxes omit lining plate so painted spin arrows are visible at 3D On). Table nameplates are sized in metres (`c.label(text, w, h)`). Traps: a stamped slate atom prints its charge in place of the electron count (the shoulder is off the puck's face at 3D On); a tool or ring drawn outside an atom's disc is invisible at 3D On; in `q6` the protractor is read on two arms and an arm behind a balloon needs the Turn dial (set it in the solution script or `verify:bench` hits the balloon). Ligar's per-stage play record and the stages only a person can judge are in `docs/archive/2026-10-29/Ligar-audit.md`.

Bellows (`docs/archive/2026-10-29/Bellows-audit.md`: per-stage verdicts, AP coverage, what was and was not played) now holds: `q1-knocks` 8 stages (Boyle as a target, six times the gauge, then the gauge at 1.5 L past the dial; the energy-match target; a mercury U-tube read in atm, a plaque with `manometer: { h }`; the slope of gauge against 1 ÷ room from recorded points), `q2-laws` 7 (the temperature that doubles the room, typed; a worked room at 327 °C; a squeeze and a heating together), `q3-ideal` 9 (moles from a plate, molar mass from a sealed tank, a plate in atm and °C, density d = PM/RT, the percentage error from a thermometer that reads low), `q4-mixtures` 8 (nitrogen's share of four open tanks, typed; the height where oxygen's own push has halved, oxygen's own push from moles, a gas over water in mmHg; the percentage error of leaving the vapour in), `q5-speed` 8 (molar mass from a half-empty time, the reference masses printed on the Gas dial, root-mean-square speed, four 300 K speed snapshots ranked by molar mass), `q6-real` 4 (stage 3 warms cramped CO₂ until its gauge crosses the gas law), `boss-compressor` 5 (the piston and heater together with the gauge hidden, nitrogen's 60 kPa from four tanks, the mass of gas from a plate, the cold box, the seals; a boss answer slot must sit clear of the foe's corner, x from 126.5, y to 23.5). A **worked-figure stage** has no way to read the answer off the bench: the figure is asked for beyond the dial's range, or off a printed `plaqueFixture`, and is typed in the stage's number field (`entry: { id, label, unit }`, `entryNumber` from `stagerunner.js`, `typed('ans', '1660')` in a script; `entrySigned` in `_shared.js` for a percentage error that may be negative). The `*_CARDS` lists (`[id, label, value]`) are kept as the slips a student makes (Celsius as kelvin, a factor of ten, the nearest reference), which `verify:learn` checks the stage refuses; `answerCards` and `answerSlot` remain for q3's gas-naming card stage. Traps: a 3D glass body leans over whatever is printed behind it, so nothing is painted within 7 units behind a cylinder tube, 18 behind the sealed box, or 7 behind a pinhole chamber (`rigGeometry`, `boxGeometry`, `paintPinhole`), and a lone cylinder names itself in its panel title (`titled`); a tank's lid legend lies under its valve, so its figures are repeated on a tag (`paintTag`); the recorder strip paints its figures at `fontPx` 20 (`trendplot.js`); a reward's second sentence is clamped by `frame.js` `clampSentences`, which splits only at a stop followed by a space; a drop whose pointer is over a place but whose piece centre is not goes in that place (`gestures.js`); a refusal may not contain words like `moles`, `mass`, `kelvin` or `heavier` (`verify:learn` T4); an `unit04` stage count lives in the quest's `meta.stageCount`, `worlds/unit04-gases.js`, PRODUCT.md and the hard-coded stage indices in `tools/verify-learn.mjs`.

Lanternfall (`docs/archive/2026-10-29/Lanternfall-audit.md`: per-stage verdicts, AP coverage, what was and was not played) now holds: `q1-wave` 6 stages (stage 6 types the oven's crests a second, in units of 10^9, from a plaque with a worked mast to scale from), `q2-photon` 6 (stage 6 types the energy a freed electron keeps, photon energy minus work function, in units of 10^-19 J), `q3-lines` 5, `q4-cloud` 5, `q5-numbers` 5, `q6-filling` 6 (stage 6 builds Cl⁻ on a rack with the neon core locked; Fe³⁺ is stated in the reward, not built), `q7-pes` 6 (stage 6 types the outer-shell electron count from four successive ionization energies on a plaque), `q8-trends` 7 (stages 6 and 7 use the trends kit's `gainFixture`: an Electron Adder reading electron affinity and a Bond Gauge reading Pauling electronegativity, from `electrons.js` `ELECTRON_AFFINITY` and `ELECTRONEGATIVITY`; each is ranked on the rail), `q9-absorb` 5, `boss-eater` 5. The new typed stages use `entry` / `entryNumber` as on Bellows; the optics kit plaque is `plaque()` and the PES kit's is `plaqueFixture()` (the trends kit has neither). Traps: the energy ladder (`optics-draw.js` `paintLadder`) paints its labels outside the 3D rail posts or the numbers vanish under them; a stage count lives in the quest's `meta.stageCount`, `worlds/unit02-quantum.js` and PRODUCT.md; a Lanternfall bench may now hold up to 7 stages (`tools/lib/verify-lanternfall-learn.mjs`); a rail zone takes `labelLift` (units) to stand its end words above thick cards without moving every other world's labels; a PES `chamber(...)` takes `h` (stage 4 of `q7-pes` uses 38 so its rail's end labels clear it) and drops its holder when it has an energy dial, or the holder covers the dial's track; the spectrometer's 3D screen bezel must stay a frame (`cuvette.js` `dress3d`) or it hides the painted absorbance readout.

Ember Reach particle rework (2026-11-12): `heat-motion.js` no longer has a `packets` painter (cup, lattice, rxn, energy diagram, plot and lead clips all used it). Heat is drawn as a change in motion that starts at the place of contact and spreads (`spreadT`, `progressOf`; `glide` takes a duration, `BLOCK_GLIDE_S`, `CUP_GLIDE_S`). `latticeLayout` places a named box under each block (joined blocks wall to wall); `heat-draw.js` `paintLatticeFace` prints the boxes and names, `paintLeadFace` names the things in the `meet` and `heater` clips, and the cup prints a ring key (`cupParts`: sample rings under the mouth, heater rings on the floor; the dashed system line now encloses the sample band). `vigour(T)` is the stretched display scale of motion. The plot shows only its ball; the energy diagram only its marble.

Ember Reach teaching pass (2026-11-06, `docs/teaching-pass/Ember.md`): the heat kit gained a clock. `kits/heat-motion.js` holds the moving models (cup molecules and energy packets, `lattice`, `rxn`, `curve`, `lead`, energy-diagram marble, plot ball, stack cancelling) as pure painters of state and clock; `HEAT_KIT.live`, `onMiss` (restarts the glides) and `tapZones` (drag the atoms apart, the products level, the ball, the burner; `tapDrag` takes `axis: 'x'`) wire them in; `heat.js` merges a recorded 3D crowd (`pans-3d.js` `dressRecorded`) with the solid dresses; `table2d.js` passes the clock to piece painters. Glossary `glossary/ember.js`; Tour `heat-tour-min.js`; checks `verify-teaching-ember.mjs`. Ember Reach (`docs/archive/2026-10-29/Ember-audit.md`: per-stage verdicts, AP coverage, what was and was not played) now holds: `q1-flow` 4 stages, `q2-calorimetry` 8 (stage 8 types the heat given out when 10.0 g of steam at 100 °C becomes 25 °C water; stage 4 melts 20 g of ice in a 100 g bath: a block with `latent` J/g in `heat.js` `block()`, read by `cupRead` in `heat-read.js`, which returns `melted`), `q3-enthalpy` 8 (stage 8 reads a reaction-progress diagram, `shelvesFixture({ levels: {r, p, peak} })` draws the curve over the barrier, and types the reverse activation energy; the cup's Moles dial at 0.05, 0.10, 0.20 mol then 0.30 mol past it; ΔH read beside an equation for 6.0 g of hydrogen), `q4-bonds` 6 (stage 6: chips not pre-placed, the player sums the ledger for H₂ + Cl₂ → 2 HCl), `q5-hess` 4, `q6-entropy` 5 (stage 5: ΔS from a table of entropies, the skill the Crucible's phase 4 uses), `q7-gibbs` 6 (stage 4: ΔG at 298 K from ΔH in kJ and ΔS in J, the slips are dial options; stage 6: ΔG° of CaCO₃ → CaO + CO₂ from a plate of ΔGf° values, typed), `boss-crucible` 5. Traps: `selectorFixture` answers need a trailing blank option as the start (the start position reads as "not set"); an index-based check lives in `tools/lib/ember-learn-checks.mjs` and `LEAKS` there is keyed by 1-based stage, so inserting a stage means moving both; `verify:ember` allows 3 to 8 stages per quest; bond chips are scalable (`Larger` on a held chip, `maxScale` 4 on the heat kit; `ledgerRead` multiplies `count × scale`, `faceKey` and `printed` carry the scale); `shiftCard` (kind `shift`, `paintShift`) draws a change as dots before and after (q6 stage 3); `ledgerFixture({ hideTotals })` hides the kJ totals; a card dropped beside the cup's mouth lies over the cup and hides its RISE readout.

Mirrowen teaching pass (2026-11-06, `docs/teaching-pass/Mirrowen.md`): the matter kit gained a clock. `kits/matter-motion.js` says where a particle of a state stands at a clock time (`placeIn`, `gasAt`, `shakeAt`, `slideAt`; speed goes as the square root of the kelvin temperature) and holds `glide`, a value that moves to a new target over a couple of seconds, and `replayMatter()`. The existing painters in `matter-window.js`, `matter-vapour.js`, `matter-curve.js`, `matter-flask.js`, `matter-tester.js`, `matter-strip.js` and `matter-draw.js` draw moving particles from `b.clock` in place (no second painter), and `matter.js` supplies `live`, `onMiss` (restarts every glide), `tapZones` (the piston of the press: `drag.invert`) and a 3D dress that runs the same painter through `pans-3d.js` `dressRecorded`, merged with the heat kit's motion for the cup, the bond and the lead-in clips. `matter-lead.js` adds the `mlead` fixture (clips `pull`, `sealed`, `sieve`) for the predict stages. Piece Tour words are keyed `matter:<kind>` because the Kettle kit registers `jar` and `sample` of its own. `src/learn/glossary/mirrowen.js` is the world's glossary; `tools/verify-teaching-mirrowen.mjs` holds the standard (ratchet `tools/teaching-ratchet-mirrowen.json`). `tools/lib/rewrite-mirrowen-text.py` rewrites play-text words in string literals only.

Tallow (`docs/archive/2026-10-29/Tallow-audit.md`: per-stage verdicts, AP Unit 1 coverage, what was and was not played) now holds: `q1-grain` 8 stages, `q2-core` 8, `q3-catalogue` 7, `q4-ledger` 8, `q5-assay` 10 (stage 3's fulcrum hunt and the one-pile case no longer print the listed mass on a plate; stages 4 and 9 type the weighted average of two and of three isotope piles, the beam is the check; stage 10 types the share of heavy atoms from a printed average), `q6-weigh` 12 (stages 9 to 12 are typed worked figures: percent by mass in a water molecule built on the scale, hydrogen atoms in 36 g of water in units of 10²³, hydrogen atoms per carbon from pouring the compound's 6 g of hydrogen against 24 g of carbon with both atom counters, carbon atoms in one molecule from trial molecules on a scale; stage 7's left counter is hidden (`counters.L.hidden`) so the target is worked out; `q5` stage 10 weighs a sealed lithium canister against a mix; `entry` and `entryNumber` as on Bellows), `boss-hopper` 5. Traps: a lens's 3D face depends on the dish under it, so `table3d.js` `tickPieces` rechecks every lens signature until the piece has stopped easing (otherwise it keeps the old picture); the proton and neutron heap lies at y 49 and 59, so the build gauges (`q4-ledger` `BUILD`, Hopper phase 2) sit at y 29 to 31 or the heap covers their scales (the Hopper's must also stay out of the foe's corner); a stage count for `q5-assay` and `q6-weigh` lives in the quest's `meta.stageCount`, `worlds/unit01-atoms.js`, PRODUCT.md and the recomputations in `tools/verify-learn.mjs` (the mass-table block).


## Verdigris mechanism views (2026-11-06)

`engine/phmotion.js` is the pure motion of the ph kit's particle windows: `windowAt(units, ionized, seed, t)` gives each cell's wobble, whether it has
handed a proton over, and how far a hand-over or take-back in progress has got. Every `PERIOD` (2.6 s) a quarter of the smaller group swaps, so in
a weak solution the ionized units change while their count stays the planner's (`ionCount` is `ionized` at every frame; a fully ionized or untouched
window does not swap). `wobble`, `ionDots` (H₃O⁺ : OH⁻ dots in the pH's ratio), `dropAt` and `scratch` (painter memory kept off the fixture, because
`verify:table` compares two builds) live there too. Kit fixtures declare `live: () => true` (`phflask`, `phpour`, `phscale`, `phrace`, `phneut`, `phmix`,
`phsolid`, `phburette`, `phstrip`) and `PH_KIT.live` asks them, so the 2D table keeps its loop running and passes `b.clock` (shared change from the Brinewire pass,
`table2d.js`). At `3D On`, `kits/ph-3d.js` (`bodiesDress`) records the flat painter's spheres and stands them up as one InstancedMesh (a fixture names `bodies3d`; the plate skips its spheres through `ctx.__skip`), so flat and 3D cannot differ. Checks: `tools/verify-teaching-verdigris.mjs`. Record and open work: `docs/teaching-pass/Verdigris.md`.

## Teeter mechanism views (2026-11-06)

The pans kit (`table/kits/pans.js`) declares `live(state)`: true while any fixture handler's `live(f, state)` is true, which keeps the 2D loop running and passes `b.clock` to painters (the Brinewire change in `table2d.js`). `pans-pan.js` exports `driftOf(i, clock, speed)`, the drift of particle `i` about its own patch; `pan` also keeps a per-fixture shown tick (`shownTick`) that climbs to the planner's tick after Run so colour changes play out in time. `pans-ratio.js` (`glided`, `crowd`), `pans-ice.js` (`settleProgress`) and `pans-free.js` glide bars from the starting to the settled amount. Positions are decoration; every colour, count and printed figure is the planner's. `verify-teaching-teeter.mjs` steps them. Not done: `dress3d` versions (the 3D table shows the flat plate), `q4-properties`.

Second round (2026-11-06): `pans-3d.js` gives every live pans fixture a `dress3d` by recording the fixture's own painter (`readPainter`) and drawing its circles as instanced spheres, ringed circles as rings and coloured rectangles as glass columns; painters take `b.scope` so the 2D and 3D copies keep separate glide state. `pans-clips.js` holds the predict-stage `clip` fixtures and `pgas`; `pans-cards.js` holds `paintMachine`.

Third round (2026-11-06): `table/gestures.js` `fixtureHit` returns `{kind:'pick'}` for a fixture with `props.pick` (a tap sets the named choice dial; verify:table and verify:bench tap it in `pickSpot`); `Table2D/Table3D.replay()` call `kit.replay(state)`, which `stagerunner.js` triggers on a miss; Tour steps may carry `demo` (`table/tour-demo.js`: `addTourDemo`, `stageDemo`, `playTourDemo`), rendered by `frame.js runTour` into a canvas. `drawTable` passes `view.scope` to painters so a film and the bench behind it keep separate motion state.

Fourth round (2026-11-06): `gestures.js` has a `tap` hit for TAP ZONES (`props.taps` and `kit.tapZones(f, state)`): a zone sets a dial to a `value`, moves it a `step` (wrapping with `wrap`), or follows a drag (`drag: {y0, y1, scale}`). The stress vessel's `touch: true` mode builds its zones in `pans-stress.js` (`controlsOf`, `tapZones`, `paintTouch`). Test harnesses play such dials with `pickSpot` / `touchSpots`.

## Quicklight notes

- `src/learn/table/kits/rate-3d.js` dresses `kvessel`, `lead` and `collview` at 3D On (glass tanks, swimming spheres, collision spheres). Graphs, plots and energy profiles stay flat on the plate by owner decision; do not stand them up. `q1-watch` has 7 stages, `q3-time` 7, `q4-collide` 9. New fixture `arrplot` (ln k against 1/T). Dialled vessels keep the window below the dial row (`topY` 16.5) or the knob hides under the glass. At 3D On the flat window and particles are skipped (`b.bodies`) so only the 3D tank shows.
- Traps: `src/three/materials/quicklight-textures.js` must return the `{albedo,height,roughness,ao}` contract (a wrong shape blanks the whole world); world-data roads use `w`, not `width`; the flat run clocks are keyed per scope (`b.scope === '3d'`).

## Lodestone notes

- `unit12` (Transition Metals, 6 benches + `boss-coil`, 44 stages) runs on the `lode` kit (`src/learn/table/kits/lode.js`, `lode-shell.js`, `lode-cplx.js`, `lode-light.js`, `lode-magnet.js`, `lode-lead.js`, `lode-tour.js`, `lode-3d.js`) backed by `src/learn/engine/lodedata.js`.
- Every live Lodestone fixture uses `live: () => true` and receives a `liveDress` screen in `lode-3d.js` starting below its dial rows so animated clips, gliding levels, and magnet pulls stay live at `3D On`.
- Traps: `dsplitRead` / `dshellRead` / `wheelRead` take `state.table` inside `check(state)`; `iestripFixture` returns the fixture directly (not `{ fixture, slot }`); `q6-spin` stage 5 reads rail order from `state.table.zones.rail.order`; `boss-coil` uses `the coil` in `foes.js`, `foebody.js`, `boss-models.js`, and `boss-arena.js` (`clue_lodestone_coil` in `saga.js`).


## Cinder Halo notes

- `unit14` (Nuclear Chemistry, 6 benches + `boss-core`, 53 stages) runs on the `nuke` kit (`src/learn/table/kits/nuke*.js`): a registry (`nuke-registry.js`, kinds prefixed `n`), one file per instrument family (`nuke-count.js` counter rig, drums, tissue strip; `nuke-nuc.js` nucleus view; `nuke-chart.js` + `nuke-chart-read.js` chart of nuclides; `nuke-decay.js` decaying sample; `nuke-scale.js` balance, binding-energy curve, chain chamber; `nuke-choice.js` answer list and lead clips) and Thornmere's drawing helpers (`nuke-draw.js` re-exports `thorn-draw.js`). Every number comes from `src/learn/engine/nucdata.js`, held to source values by `tools/lib/cinderhalo/data-checks.mjs`. Every fixture gets `liveDress` at 3D On.
- Site: `src/three/cinderhalo.js` and `cinderhalo/` (`site-plan.js` is the one declaration: crater floors, cuttings, the min-of-walls height field, wall colliders on every cell touching the walk, the six cells, cover boxes, routes through each dog-leg). Layout from `tools/gen-cinderhalo-layout.mjs`; checks `tools/verify-cinderhalo.mjs` on the shared `tools/lib/world-shape-checks.mjs`; cover from the shared `src/three/lib/cover.js`. Cells face along the axes so their box colliders stay boxes and their cover boxes are exact.
- Traps: a rig with a shield slot stacks two slots, which need 19 units between centres for the first label; the counter's scatter is seeded by the run number, so two counts of one setting differ and a miss must quote the card's kept count, never a fixed number; `nchartFixture` `columns` mode picks an element and reports its heaviest stable nucleus; a partial `TorusGeometry` reports a bounding box far larger than its arc (use an open cylinder segment); the world's `spawn` is `{ pos, lookAt }` as `stage.js` reads it (Thornmere's JSON holds a bare array).
