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
Lanternfall (9 + `boss-eater`), Ligar (9 + `boss-warden`), Bellows (6 + `boss-compressor`), Ember Reach
(7 + `boss-crucible`), Kettle (`q1-recipe` + `boss-golem`; no walkable world, so at T4 its bench builds its
own room). Tallow, Lanternfall, Ligar, Bellows and Ember Reach are walkable at T4 (`learn/worlds3d.js`). **Every built world is open from the start**; inside a world quest N opens
when N−1 is complete; charted (unbuilt) quests don't hold anything shut. World `status` is derived (`live`
iff a quest has a module). Plans: `docs/plans/learn-track.md`, `learn-quests.md`, and per-world records.
`docs/plans/bench-integration.md` (benches fold into each world's equipment, Ligar gets a mine) is complete across all five walkable worlds: P0 (shared groundwork), P1 (Tallow re-laid, six hosts), P2/P3 (Ligar: four surface hosts, two hills, a mine of five chambers), P4 (Lanternfall: nine hosts in an aurora expedition's camp), P5 (Bellows: six hosts on the plant, the ring gantries gone), P6 (Ember Reach: seven hosts in the geothermal field, the shelters gone), and P7/T7 (records and retirement of all legacy 3D instruments). `docs/plans/bench-tabletop.md` is complete: every quest across all units is an open tabletop (drag, snap, pour, arrange, predict-then-test, T4 field fetches) graded on what is on the table, leaning in over the plate in 3D.

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
  On tabletops (`table3d.js`), players interact with `[E]` to lean in with free look and movement;
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
  **Story animations:** `src/story/quest-story.js` (data), `src/ui/story-scenes.js` (2D painters, pure functions of `t`) and
  `src/ui/story-anim.js` (the player) give each Tallow quest one animation after its debrief, once, hooked in `stagerunner.js` `next()`. `Table3D.dispose()` must flag itself disposed before `unmountScene(this)` (the stage disposes its active viewer: infinite
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
  field). Bellows `q1-knocks` … `q6-real` + `boss-compressor` are tables on the gas kit
  (`table/kits/gas.js`: cylinder rigs, tanks and a common tank, a scale, a pinhole, a tube, a walk; every reading goes
  through `gasdata.js`'s planners); knock counter is the real impact rate; sealed tanks print no gas; words plain until earned.
  The benches are the plant's working points (`bellows/stations.js`, footprints in `bellows/host-plan.js`): 1 gauge gallery on a
  gasholder, 2 the Compressor's piston deck, 3 metering skid, 4 blending manifold, 5 leak-test station at a vent stack, 6 the liquefier's
  cold box; field point `drawoff` only (`gauge` and `bleed` were retired 2026-10-23, the first a copy of what the bench held and the second a lock); the Compressor's arena is kept on open ground. `GasRig` is retired. Ember Reach `q1-flow` … `q7-gibbs` + `boss-crucible` are tables on the heat kit
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

## Worlds, ship, voyage (3D)

- **Every bench is part of its host and is checked from the lean-in view (§2.6).** Benches are built into their world's machinery, clear the bay envelope, and frame their active pieces inside the free glass at all supported aspects.
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
  ratchet: a rebuilt bench's line must be deleted, and new hosts get none; the file is empty now). A host leaves the bay empty by standing machinery to the
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
  lenses only, no point lights), posed by `CombatMonster3D.update` from the fight state. **Kettle's golem has no arena yet** (no
  walkable world): it still uses its old model and the corner toy in the foundry room. `verify:arena` holds the table's ground in
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

Lanternfall, Ligar, Bellows and Ember Reach were reworked to the Tallow pattern (T1 to T8, U1 to U5 of `docs/Avalon problems and clashing rules.md`).
Each world's build record is in its plan file (`docs/plans/lanternfall-world.md`, `ligar-complete.md`, `bellows-world.md`, `ember-reach-world.md`).
Registry after the pass: 44 quest modules, 38 benches, 6 bosses, 222 stages. Every reworked bench is cut to 3 to 5 stages, has one
`predict: true` click stage whose guess the next stage quotes, a lead line (never on a boss), Tour steps for every tool and no briefing; bosses
keep five distinct phases. Lanternfall 49 stages, Ligar 45, Bellows 33, Ember Reach 33. Field points that only carried a copy of the bench
(Lanternfall `flume`, ice hole; Ligar `chip`, `sump`; Bellows `gauge`, `bleed`; Ember `flowline`, `edge`, `coil`) or acted as a lock are
retired; the hardware stays as scenery and each `verify:<world>` expects the new list. 34 story animations exist (Tallow 7, Lanternfall 10,
Ligar 6, Bellows 7, Ember Reach 4); painters live in `ui/story-scenes-<world>.js`, merged into `SCENES`.

**Shared hooks the passes added**
- `table/tour.js`: `registerTour(kitId, {fixtures, pieces, dials})` and `addTourText` for a kit's own words; per-world files `tour-ligar.js`, `tour-lanternfall.js`, `tour-bellows.js`, `heat-tour.js`. A `<kit>:<kind>` entry is looked up before the generic one.
- `engine/table3d.js`: a `dress3d` group may carry `userData.sync(fixture, state)` (called from `syncFixtures`), `userData.update(fixture, state)` (state-following dress) and `userData.tick(dt, still)` (every frame, `still` for reduced motion).
- `engine/model-parts.js` + `ui/model-viewer.js`: reward model types `gas` (Bellows), shapes/crystals/lobes (`model-parts-ligar.js`), wave/photons/ladder/orbital/rack/radii/cuvette (`model-parts-lanternfall.js`), molecules and boxes (`model-parts-ember.js`). Bond rods take `order` (up to 3), `r` and `thin`.
- Per-world solids: `gas-particles.js` and `kits/gas-3d.js` (a sealed box and cylinders with moving particles), `ligar-mol3d.js` (molecule cards stood up as solids at `3D On`), `lab-props-lanternfall.js`, `heat-solids.js` and `heat-parts.js` (bath, bond, phase box, cells, chamber).
- `verify:table` "Predict first" holds `unit01`, `unit02` and `unit03`; Bellows and Ember Reach hold the same rule in `verify:learn` and `verify:ember` (`tools/lib/ember-learn-checks.mjs`). Lanternfall's per-quest checks are in `tools/lib/verify-lanternfall-learn.mjs` and `tools/lib/lanternfall/`.
- `verify:story` requires an animation for every quest of Tallow, Lanternfall and Bellows.

**Not done / open**: the owner has not played any of the four worlds (nothing was browser-tested). Lanternfall's `src/ui/field-manual.js` was re-pointed to the new stage indexes. The cut stages are in git history (`6628c43`); only Lanternfall's old verify block was archived (`archive/2026-10-23/`). Ligar `q8-hybrid` has no lead line (it is in `NO_LEAD`).
