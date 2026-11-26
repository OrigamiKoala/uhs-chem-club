# Ember Reach — the world, its instrument and its fight, as built

**Update (2026-10-22, phase T6 of `bench-tabletop.md`): the benches are tables, and they are built into the field.** Every Ember Reach
quest and the Crucible are tabletops on the heat kit (`src/learn/table/kits/heat.js`), and the seven heat-shield shelters on the 54 m
ring are gone: each bench is a working point of the geothermal field (`three/ember/stations.js`, footprints in `ember/host-plan.js`,
laid out by `tools/gen-ember-layout.mjs`, which refuses a layout in which anything stands in a host or its lane). The calorimeter
(`engine/calorimeter.js`, `calorimeter3d.js`, `thermomount.js`) is **orphaned**: no quest plays it (T7 retires it). The sections below
that describe the calorimeter, the plate flags and the shelters are the record of what stood before.

| Bench | Quest | Host | Field point |
| --- | --- | --- | --- |
| 1 | `q1-flow` | a wellhead on its slab with its flowline run across to a plate heat exchanger, a hot-water tank between | `flowline`, the exchanger's thermowell tap |
| 2 | `q2-calorimetry` | a railed sampling shelf at the spring's edge (the plate faces away from the spring, which stands behind it), a davit with a basket, a lagged bath, a platform scale | `edge`, the sampling basket |
| 3 | `q3-enthalpy` | the habitat's boiler room: a brick-set boiler drum, its flue, a cage of fuel canisters, a burner | none |
| 4 | `q4-bonds` | a sampling coil over a fumarole cone, under a hood and flue | `coil`, the coil's gauge board |
| 5 | `q5-hess` | the separator, a header, and two routes for steam to the same drain: a sealed straight shaft and a stepped pipe | none |
| 6 | `q6-entropy` | the silencer pair, with two glass bulbs and a stopcock on a stand, and a vacuum pump | none |
| 7 | `q7-gibbs` | the turbine hall's control room: a booth with a window on the hall, a console of dials, a furnace and a beam balance | none |

A field point is evidence and never a lock: each is a reading card (`stmt`, `fetchFrom`) that a stage can be answered without, on
`q1-flow` stage 7 (the tank's mass), `q2-calorimetry` stage 4 (where the block was held) and `q4-bonds` stage 5 (what the coil's
water does). The spring shelf stands at 24.5 m from the spring's middle (the other six stay on the ring), the sinter terrace and the
third wellhead that stood in the way moved. The Crucible's ground is unchanged.

**Status (2026-10-15): built, and walkable.** All seven benches of Learn world 05 are live, the one
instrument they share exists (drawn and built), The Crucible is a five-phase boss on the same
instrument, and Ember Reach is walkable ground at T4: seven sites round a hot spring, each bench a
built calorimeter in its own shelter. `npm run verify:ember`, `:learn`, `:run`, `:bench`, `:voyage`,
`:story`, `:progression` and `:drills` cover it.
**What has not been done is look at it in a browser:** the plates were drawn into a recording canvas
and rendered to pictures in Node, the built calorimeter was framed and pressed through the real pointer
path on every one of its seven real plates in Node (`verify:bench`), every stage was mounted and run on
the shared stage loop (`verify:run`), and the world was built, measured and walked in Node
(`verify:ember`). How the sky, the spring, the steam and the lake actually LOOK is unseen.

This is the record of what was built and every place it parted from the plan in `learn-quests.md`
("World 5 — Ember Reach").

## What exists

| Bench | Quest | Heads used | Foe |
| --- | --- | --- | --- |
| 1 | `q1-flow` Heat and Temperature | contact, cup, diagram | none |
| 2 | `q2-calorimetry` Calorimetry | cup | none |
| 3 | `q3-enthalpy` Enthalpy of Reaction | cup, diagram | none |
| 4 | `q4-bonds` Bond Enthalpies | bonds (crank and ledger) | none |
| 5 | `q5-hess` Hess's Law and Formation | hess (stack and formation table) | none |
| 6 | `q6-entropy` Entropy | box (microstates), phases, contact, formation table | none |
| 7 | `q7-gibbs` Free Energy | gibbs (plotter), diagram, formation table, hess stack | none |
| boss | `boss-crucible` The Crucible | cup, bonds, hess stack, formation table, gibbs in turn | The Crucible, all 5 |

Every quest exports `STAGES`, `SOLUTIONS`, `MISSES`, `stateFor`, `VOCABULARY`, `BUILDS_ON`, `DEBRIEF` and
`PRACTICE` (five problems), and plays on `mountThermo` (below), which sits on `createRunner`.
The boss exports no `VOCABULARY` (its words were all earned on the benches) and files the clue
`clue_ember_siphon` when it is cleared.

## The instrument: the calorimeter

| File | Is |
| --- | --- |
| `thermodata.js` | PURE. The tables (specific heats, bond enthalpies, formation ΔH°f / S° / ΔG°f, fuels) and every planner: `heatTransfer`, `equilibriumTemp`, `blockSpecificHeat`, `bondEnthalpySum`, `hessStackEnthalpy`, `standardReactionChange`, `microstateWays`, `gibbsFreeEnergy`, `crossingTemperature`, `benchCfg`. |
| `calorimeter.js` | The drawn bench, a `PlateBench` subclass. Heads: `contact`, `cup`, `diagram`, `bonds`, `hess`, `box`, `gibbs`. |
| `calorimeter3d.js` | The built twin through `plateBench3D`. Every raked screen runs the same `draw` and `press` as the drawn bench. |
| `thermomount.js` | The stage loop all eight modules share: the bench, one dial, the toggle and card keys, the readout, the foes' reactions, `makeStateFor`. |

### Plate flags

A plate prints what the instrument really reads, so a stage that asks for the reading must be able to
switch the printed answer off. These flags are declared on a rig, never on the bench:

| Flag | Head | Switches off |
| --- | --- | --- |
| `hideVerdict` | cup, diagram | the printed "exo / endo" verdict; with `hideValue`, the ΔH sign word too |
| `hideHeat` | cup | the printed `|q|` in joules (the temperature rise stays) |
| `hideCost` | bonds (crank) | the printed energy of pulling or forming the bond |
| `hideNet` | bonds (ledger) | the net of the ledger (the two totals stay) |
| `hideSum` | hess (stack) | the stack's net ΔH |
| `hideSeaLevel`, `columnLabel` | hess (formation) | the "elements = 0" line; re-heads the column (S°, ΔG°f) |
| `hideWays`, `hideLaw` | box | the printed W and the `S = k ln W` line |
| `hideTug`, `hideCrossing`, `hideDG` | gibbs | the tug-of-war numbers, the T* marker, the ΔG verdict |

## Where it parted from the plan

- **No join-bench crank, no separate Hess board.** The bond crank and ledger, the step stack and the
  formation table are heads of the calorimeter, so one instrument serves all eight modules.
- **No Formula Slate.** The slate fills its slots from bench-log rows, and the calorimeter writes none.
  A formula or constant a stage needs is a `reference` line on the plate instead.
- **Numbers.** A figure that is not round is a `choice` of four numbers whose wrong ones are real slips
  (the sign, an unconverted unit, a missing coefficient). A round figure is a `number` widget with a step
  the answer sits on and a `start` so that the untouched bench grades wrong.
- **`q4-bonds` stage 8** is an endothermic case (`N₂ + O₂ → 2 NO`, about +181 kJ/mol, with N=O set at
  631 kJ/mol on the ledger) rather than `H₂ + Cl₂ → 2 HCl`, so a player cannot learn that every
  reaction is downhill. It agrees with `q3-enthalpy` stage 5's +180.6.
- **`q7-gibbs` stage 1** sorts three changes, adding a cold pack, because that is the case that shows
  ΔH alone cannot decide. Its plates carry an observation ("Keeps burning once lit"), not a verdict.
- **`q7-gibbs` stage 7** is a plain stack of two reactions with `hideSum`; there is no "couple" key.
- **The Crucible.** The five phases are heat in a jacket, a bond ledger, a Hess stack, an entropy table and
  a Gibbs balance. Its fight is the standard layer: no health numbers, no damage, one Integrity bar.

## Verification

- `verify:learn` holds every stage to the doctrine (one-sentence prompts, three one-sentence hints,
  no answer in rung 3 or in a refusal, vocabulary schedule, five practice problems each, forty in the world).
- `verify:bench` frames the calorimeter at six aspects on all eight modules, each on its own site's plate
  in Ember Reach (the Crucible on bench 1's), presses every plate through the real pointer path, and
  builds the Crucible's five foes in the wells.
- `verify:ember` holds the world to every rule the other worlds' checks hold them to, and to the ones
  this world adds (below).
- Nothing in `src/learn/` calls an XP rail. The Learn track pays no XP and never reaches Standings.

## The world

A hydrothermal shelf inside a caldera, in the afternoon under a sulphur haze. The user chose this look
(2026-10-15) over a night lava field and an ash crater, so that it reads apart from Ligar (black basalt
at dusk) and Lanternfall (night).

| Place | What stands there |
| --- | --- |
| The middle | A banded hot spring, radius 14 m, in a shallow bowl: deep blue at its heart, turquoise to the lip, and round it the mats the runoff grows in the order the water cools (pale sinter, yellow, orange, rust-brown), streaked out along the runoff. A lip of beaded sinter round it, mist lifting off it, and a closed ring of colliders, because it is open water. |
| The ring | Seven benches on a ring of 54 m (angles 34° to 288°, leaving the south open for the spawn and the north for the lane to the rim), a road of 26 work lamps at 39 m, cinder roads (a ring, a spoke to each approach, the way in from the spawn, a spur to the pad, the lane north). |
| The vent field | 19 fumaroles (sulphur cones that breathe), a geyser that erupts every 46 s for 8 s, two mud pots whose bubbles swell and burst, three stepped sinter terraces with pools on every tier, sulphur mounds, black-glass lava lobes, and twelve temperature probe stakes. |
| The plant | Three wellheads tied into the main by elevated spurs, a separator with its scrubber and platform, a pair of silencers, the turbine hall (12 x 24 m, a roller door facing the shelf), three-cell cooling with fans that turn, a transformer and a line of pylons south-west to two civilian shelters that stand cold. |
| The caldera main | One elevated steam pipe round the north of the ring at 76 m, from the separator to the turbine hall, carried 3 m up on T-supports so a player walks under it anywhere, lifted into a 7.4 m expansion loop over the lane to the rim (`CALDERA MAIN` hung under it). |
| The overlook | Through the loop: a railed rim (the rail a closed chain of colliders from one edge of the walk to the other), and under it the caldera floor 28 m down, black flow with a lava lake lying in it and a cone to the north-north-east putting up its plume. Clamped to the main on the overlook, the Fifth Guild's siphon manifold, in their dark livery and furred with frost, venting nothing. |
| The boss | The Crucible is fought on the open cinder ground in front of the loop (`BOSS_ARENA_SPOTS['boss-crucible']`, which `verify:ember` holds equal to the world's `arena`). Like every boss it has no site; it is reached from the walk HUD's list of benches. |

### How it is built

| File | Is |
| --- | --- |
| `three/ember.js` | `EmberReachWorld`: the contract every walkable Learn world keeps; materials, assembly, colliders, the bake, the frame. |
| `three/ember/terrain.js` | One analytic height field: the shelf (rolling sinter, dead flat under every bench, the pad, the plant and the boss's ground), the spring's bowl, the rim (a circle past which the ground is the caldera floor; the cliff widens away from the walk so the grid can draw it), the floor with the lake and the cone, and the caldera walls (stepped, lowest toward the sun so they never hide it). The ground's colour (the spring's mats, sulphur round each vent, iron in the films, black flow, banded tuff) is painted into its vertices from the layout. Also the spring's ringed disc, the lake's ellipse and the cinder ribbons. |
| `three/ember/atmosphere.js` | `erSky`: an ochre haze on the horizon darkening to umber, a copper sun with no disc, a broken overcast of steam and ash drifting from the west, and the lake's glow on the haze and the clouds' bellies to the north. The same function is the environment map. Lights: the sun (the only shadow), a hemisphere, and a weak orange key from the north, low, with no shadow. |
| `three/ember/field.js` | What the ground built: fumarole, sulphur mound, mud pot, geyser, sinter terrace, lava lobe, probe stake, the spring's lip. |
| `three/ember/plant.js` | What people built: every plant piece above, the pipe network, the rim rail, the power lines. |
| `three/ember/sites.js` | The bench (the calorimeter cased up: a lagged cup with a thermometer through its lid, a stirrer, the housing and its dial), the shelter (I-section posts, a raked heat-shield roof, a perforated back wall with an insulated header, half-height side shields, a slab), and what stands behind each bench: two blocks clamped together, a lagged water bath, a cage of fuel canisters and a burner, a cracking coil over a vent grate, a sealed shaft beside a stepped pipe route, two glass bulbs and a stopcock, a furnace and a balance. |
| `three/ember/effects.js` | Steam off every vent (puffs lit from the sun's side in view space), fume off the lake and the cone with orange bellies, mist on the spring, the geyser's water column, sulphur motes at the eye. |
| `three/materials/ember-textures.js` | Sinter crust, cinder road, black glass, sulphur crust, vent concrete, lava crust (with the world's one emission map) and the spring's ripple. |
| `tools/gen-ember-layout.mjs` | Writes `world-data/ember.json`. Deterministic; places nothing on a site, a spoke, the road, the lane, the boss's ground, the pipe or the rail. |

### Rules this world adds to the standing ones

- **The molten rock is the one lit thing that is not a lamp.** Molten rock is incandescent, the one
  filament nature makes. `verify:ember` allows exactly the work lamps and `M.magma`, and fails a lava
  surface anywhere on the shelf.
- **A round thing is never turned as a group.** A turned group's parts are measured by boxes turned with
  it, which a round body overfills by up to a factor of root two, so a fumarole and a sinter terrace
  eight metres apart were reported as touching. Round landmarks carry their turn in their own layout
  (`SELF_TURNED` in `ember.js`); a pylon, a well or a building is turned by its landmark as usual.
- **A pipe is measured as a pipe.** The network is cut into straight pieces of three metres or less
  before it is baked, so a curve is not measured as the box round it; a pipe end stops a finger short of
  the body it joins (or, at a wellhead, stands on top of its flowline), so the two never share a box.
- **The rim leaks nowhere.** The walk is flood-filled from the spawn and the lowest ground it reaches is
  checked: a gap in the rail shows as ground below -2.5 m.

## What a later pass should do

- Look at all of it in a browser: the sky, the spring's colour, the steam, the lake under the rim, the
  plates and the built calorimeter on its seven benches.
- If the cone's plume reads badly (its puffs are large enough that some GPUs clamp the point size),
  move it into the sky function as Ligar's volcano is.

## Tabletop and retirement update (2026-10-22)

- Ember Reach was re-laid into real plant and vent field hosts (`stations.js`, `gen-ember-layout.mjs`), with the seven old ring shelters retired (T6).
- Every Ember Reach quest is played on the Tabletop (`Table3D` with the heat kit).
- `calorimeter3d.js` and `thermomount.js` are retired (T7); pure thermodynamic planners stay in `thermodata.js`.

## Rework record (2026-10-23): one click per bench, fewer and distinct stages, 3D where the idea is spatial

Done against the owner's audit (`docs/Avalon problems and clashing rules.md`, T1 to T8 and U1 to U5), with Tallow (unit01) as the reference.
The seven benches and the Crucible keep their sites and their order; what changed is what is on the tables. **61 stages became 33**:
q1 4, q2 4, q3 3, q4 5, q5 4, q6 4, q7 4, the Crucible 5. Every bench is built round one wrong model that the table contradicts, and each
`predict: true` stage shows only the question and the guesses (cards and a slot, no instrument); the next stage brings the instrument back
with the locked guess in its prompt and its reward (`engine/predict.js`, keys `unit05/<quest>`).

| Bench | Stages | The wrong model, put on the table | Click (predict, then test) | Stake in the labels |
| --- | --- | --- | --- | --- |
| q1-flow | meet at 50 degrees; predict; test; four tins | "hotter means more heat" | welding spark (1200 °C, a speck) or warm tank (40 °C) on the frozen valve | Frozen valve, hand warmer, quicklime, fizzing tablet |
| q2-calorimetry | predict; test; name a metal; a reaction in a bath | "the same heat warms everything alike" | the iron's heater set until it rises as far as the water | Jacket water, iron pipe, siphon fitting, reserve bath |
| q3-enthalpy | chart per mole; predict; rank | "the biggest number per mole is the best fuel" | four 10 g tins in a 5 kg tank, ranked on a rail | Skiff fuel tins |
| q4-bonds | predict; crank; methane ledger; predict (air); air ledger | "breaking a bond gives energy out" | the crank's meter, then a ledger that pays back more than it cost; a second ledger that does not | Cracking coil, nitric oxide |
| q5-hess | predict; two routes; methane from three cards; limestone from the elements | "a longer route gives out more" | two stacks print the same total | The sealed shaft and the stepped pipe |
| q6-entropy | predict; shake and count; more room or less; rank four boxes | "gas has to be pushed to spread; entropy is mess" | the chamber's bars (68 spread to 2 crowded of 70) | Burst bypass valve |
| q7-gibbs | predict; dial the cold-pack salt; four cases; where ice melts | "a change that takes heat in will not run alone" | the plot's net goes below zero once it is warm enough | Shelter cold packs |
| boss-crucible | jacket, coil, slag, vent, seal | none (no predictions on a boss) | five different tools, one decision each | The Crucible's siphon core |

What was cut and why: q1 repeats (direction, system line, energy chart, the four-process sort) are folded into the pack stage or live in q3; q2's lid-off
and per-mole stages (per mole is q3's chart); q3's reverse, grams-for-a-dose, state-symbol and per-mole-scoop stages; q4's average-bond, bond-order and
"why still hot" stages; q5's turn-only and scale-only stages and the unknown formation value; q6's dissolve-a-salt, entropy-table and warming stages (warming
is a card in the four-box rank); q7's formation-value, diamond and coupling stages (kinetics belongs to Quicklight; coupling and formation values are AP depth the
idea does not need). Hint rung 1 names the control on every stage; the how-to is printed on the plate (`applyNotes`) and in the Tour. Every refusal names what the table
shows (the bath's rise, a total, the bar's height) and none states the rule (`tools/lib/ember-learn-checks.mjs` searches each stage's refusals for its feature).
Age band: Gibbs is "two pulls, one verdict" (the plot prints HEAT, SPREAD and NET in plain words; the symbols come on the reward card), Hess is "a ledger that does not
care about the road", entropy is "the number of ways" and bond enthalpy is "what the crank's meter reads".

**Field fetches: none left.** The tank's weight, the basket tag and the coil's gauge card each carried a copy of what the bench already holds, or fed a stage that was cut.
The three field points (`flowline`, `edge`, `coil`) were removed from `three/ember/stations.js` and `verify:ember` now expects none.

**The kit (`table/kits/heat.js`) gained** (all additive): `settle` stamps a tin that has stood in a cup with how far the bath moved (`props.rise`) and a block with
its trial (`props.trial`), so four readings can be compared once the tins are out again; bond chips draw their two atoms; phase cards hold the same twelve particles
(`heat-parts.js` `phaseDots`, seeded) with a streak as long as the temperature; the plot can print in plain words (`words`); Tour words for every instrument and piece
(`heat-tour.js`, registered through `addTourText` in `table/tour.js`).

**3D at `3D On`** (`engine/heat-solids.js`, the same numbers the flat picture prints): the cup's bath is a tinted body as deep as its mass with a thermometer whose column
stands at the reading (grey for an iron "bath"); the bond crank stands two atoms in space, as far apart as the crank has pulled them, with the rod thinning; a bond
chip carries its two atoms and rods (a double bond has two); a phase card is a glass box of twelve beads with streaks; the chamber is a glass row with the beads of the last
shake and the cells have a gate that drops when it is opened. Reactive parts need `Table3D` to follow state: a dress may carry `userData.update(fixture, state)`,
called from `syncFixtures` (additive change in `engine/table3d.js`). Energy charts, the stack's equations and the balance plot stay flat. Reward models
(`engine/model-parts-ember.js`, hooked into `model-parts.js`): molecules side by side (hydrogen, oxygen, nitrogen, water, methane, carbon dioxide, ammonia, nitric oxide;
triple bonds draw three rods) and a box of particles spread through its cells.

**Story**: lead lines (`stage-story.js`) on the first stage of each bench that has a stake; four animations (`story-scenes-ember.js`): `unit05/q1-flow` (the Fifth's
manifold is frosted: a cooled bath means heat went in), `q5-hess` (the sealed shaft and the open pipe carry the same total), `q7-gibbs` (the crossing, then the
siphon core's seal) and the Crucible (the casing splits and a pipe runs down into the crust). Each ends on a `Filed:` line that continues Bellows' warm cylinder: the
Fifth's siphon feeds an endothermic process.

**Counts for the docs pass** (not edited here): Ember Reach is 7 benches + 1 boss = 8 quests, **33 stages** (was 61), so the registry's total goes from 330 to 302.
`verify:docs` will fail on the PRODUCT.md figures until the orchestrator updates them. `calorimeter3d.js`/`thermomount.js` were already retired.

---

## Site rebuild (2026-11-18)

Rebuilt on branch `site/ember` against `docs/plans/world-distinction-plan.md` section 3 and Ember Reach's row in section 6. Changes the 3D site only: no quest, stage, kit, bank entry, glossary, story line, site id, quest id or bench label changes.

### 1. The place

A switchback haul road cut down the inside cliff wall of a volcanic caldera toward a molten lava lake, with geothermal workings hollowed into the rock at each terrace and a turbine hall at the foot.

In the first ten seconds after landing on the rim shelf, the player stands beside a steel guardrail looking down four stacked zigzags of cliff road into a steaming caldera floor forty metres below, where a crusted lava lake and a venting volcanic cone sit beneath ochre fume, with no bench visible from the rim.

### 2. The signature

| Field | Ember Reach |
| :--- | :--- |
| Landform | The inside wall of a caldera, stepping down toward a lava lake |
| Walk shape | A switchback road down the wall (four 1-in-6 ramps alternating west and east between four hairpin turns) |
| Bench housing | Six galleries cut into the caldera wall with their lake-facing side open to the drop; the turbine hall at the foot |
| Light | Kept built sky (`ember/atmosphere.js`): ochre fume and low copper sun from WSW, weak north lake glow on the rock from below; galleries and the turbine hall under the shared cover mask (`lib/cover.js`), lit by their own pooled amber lamps |

Checked against all other rows in `docs/plans/world-distinction-plan.md` section 6: no other world has a caldera inside wall, a zigzag switchback road down a cliff, or rock-cut galleries with one side open to a lava lake + turbine hall. (Teeter uses a straight fall-line comb stair with level dikes branching off; Brinewire uses a single two-flight ramp down a concrete barrage face; Lodestone uses a winding slot canyon with alcoves under overhangs.)

### 3. Plan (words and coordinates)

All walkable ground stays inside `[-94, +94]` in `x` and `[-74, +94]` in `z` (well inside the `±100 m` stage bound). North (`-z`) is into the caldera toward the lava lake; south (`+z`) is up into the rising caldera wall. Every open edge facing the drop is closed by an open steel railing (`pass: false`, 1.05 m high — below eye height so the lake and lower terraces remain in full view).

- **Level 0 — Rim Shelf (`y = 20.0 m`):** `yard-rim` (`x ∈ [14, 92], z ∈ [58, 92]`).
  - **Landing pad:** `(66, 20.0, 76)`, clear radius > 16 m in every direction.
  - **Spawn:** `(26, 21.6, 66)`, looking toward `(-6, 21.0, 60)` (west-northwest down Ramp 1 and across the caldera).
  - North rail at `z = 58` overlooks the entire switchback and the lava lake.
- **Ramp 1 (`y: 20.0 → 15.0 m`):** `x ∈ [-16, 14], z ∈ [58, 66]` (30 m westbound, 1 in 6 grade).
- **Hairpin 1 (`turn-1`, `y = 15.0 m`):** `x ∈ [-30, -16], z ∈ [34, 66]`. Turns the road from westbound to eastbound, stepping 24 m north.
- **Level 1 — Upper Terrace (`y = 15.0 m`):** `road-1` (`x ∈ [-16, 46], z ∈ [34, 42]`, north rail at `z = 34`).
  - **Bench 1 (`room-1`, `site-1`):** cut into the cliff south of `road-1`, `x ∈ [-12, 2], z ∈ [42.6, 55.6]`.
  - **Bench 2 (`room-2`, `site-2`):** cut into the cliff south of `road-1`, `x ∈ [24, 38], z ∈ [42.6, 55.6]`, with a perched hot-spring seep basin at its east rock wall and a 7.6 m railed north bay opening onto the lake view.
- **Ramp 2 (`y: 15.0 → 10.0 m`):** `x ∈ [46, 76], z ∈ [34, 42]` (30 m eastbound, 1 in 6 grade).
- **Hairpin 2 (`turn-2`, `y = 10.0 m`):** `x ∈ [76, 88], z ∈ [10, 42]`. Turns the road westbound.
- **Level 2 — Middle Terrace (`y = 10.0 m`):** `road-2` (`x ∈ [-26, 76], z ∈ [10, 18]`, north rail at `z = 10`).
  - **Bench 3 (`room-3`, `site-3`):** cut into the cliff south of `road-2`, `x ∈ [44, 58], z ∈ [18.6, 31.6]` (reached first going west).
  - **Bench 4 (`room-4`, `site-4`):** cut into the cliff south of `road-2`, `x ∈ [-2, 12], z ∈ [18.6, 31.6]`.
- **Ramp 3 (`y: 10.0 → 5.0 m`):** `x ∈ [-56, -26], z ∈ [10, 18]` (30 m westbound, 1 in 6 grade).
- **Hairpin 3 (`turn-3`, `y = 5.0 m`):** `x ∈ [-68, -56], z ∈ [-14, 18]`. Turns the road eastbound.
- **Level 3 — Lower Terrace (`y = 5.0 m`):** `road-3` (`x ∈ [-56, 34], z ∈ [-14, -6]`, north rail at `z = -14`).
  - **Bench 5 (`room-5`, `site-5`):** cut into the cliff south of `road-3`, `x ∈ [-36, -22], z ∈ [-5.4, 7.6]`.
  - **Bench 6 (`room-6`, `site-6`):** cut into the cliff south of `road-3`, `x ∈ [4, 18], z ∈ [-5.4, 7.6]`.
- **Ramp 4 (`y: 5.0 → 0.0 m`):** `x ∈ [34, 64], z ∈ [-14, -6]` (30 m eastbound, 1 in 6 grade).
- **Hairpin 4 (`turn-4`, `y = 0.0 m`):** `x ∈ [64, 76], z ∈ [-42, -6]`. Turns the road westbound onto the lowest terrace.
- **Level 4 — Caldera-Edge Plant Terrace (`y = 0.0 m`):**
  - `road-4` (`x ∈ [20, 64], z ∈ [-42, -30]`).
  - **Bench 7 (`room-7`, `site-7`, Turbine Hall):** against the cliff foot south of `road-4`, `x ∈ [28, 44], z ∈ [-29.4, -16.4]`.
  - **Boss Arena & Overlook (`arena-deck`):** `x ∈ [-24, 20], z ∈ [-72, -30]`, entered from `road-4` under the caldera main's 7.4 m expansion loop at `x = 20`. Open rail along `z = -72` overlooking the 20 m drop to the lava lake.
  - **Boss (`BOSS_ARENA_SPOTS['boss-crucible']`):** `playerPos: [0, 1.6, -42]`, `bossPos: [0, 0, -58]`, `lookAtPos: [0, 1.6, -58]` — open 14+ m in every direction, facing due north with the railed overlook, lava lake and volcanic cone directly behind The Crucible.
- **Closed ground & drops:** Every cliff wall, terrace retaining face, and lake-facing edge is closed by `lib/workings.js` wall and barrier colliders. Nobody can climb onto any cliff bench, roof, or drop off into the caldera floor (`y = -20 m`) or lava lake (`y = -20.25 m`).

### 4. Section along the main route

| Segment | Horizontal run | Elevation | Grade |
| :--- | :--- | :--- | :--- |
| Spawn (`yard-rim`) | `(26, 66) → (14, 62)` | `20.0 m` | level |
| `ramp-1` | `x: 14 → -16` | `20.0 → 15.0 m` | 1 in 6 down |
| `turn-1` + `road-1` (Benches 1, 2) | `x: -23 → 46` | `15.0 m` | level |
| `ramp-2` | `x: 46 → 76` | `15.0 → 10.0 m` | 1 in 6 down |
| `turn-2` + `road-2` (Benches 3, 4) | `x: 82 → -26` | `10.0 m` | level |
| `ramp-3` | `x: -26 → -56` | `10.0 → 5.0 m` | 1 in 6 down |
| `turn-3` + `road-3` (Benches 5, 6) | `x: -62 → 34` | `5.0 m` | level |
| `ramp-4` | `x: 34 → 64` | `5.0 → 0.0 m` | 1 in 6 down |
| `turn-4` + `road-4` (Bench 7) + `arena-deck` | `x: 70 → 0, z: -36 → -58` | `0.0 m` | level |
| Drop past north rail (`z < -72`) | cliff face to caldera floor | `0.0 → -20.0 m` | sheer cliff (closed) |

Bench ground spans **15.0 m** (`0.00 to 15.00 m` across four levels); the walk spans **20.0 m** (`0.00 to 20.00 m`).

### 5. The seven benches (one paragraph each)

1. **Bench 1 — `q1-flow` (Heat and Temperature) — Wellhead Exchanger Gallery (`room-1`, Level 1, `y = 15.0 m`).** Teaches the distinction between temperature and thermal energy and the direction of heat flow. Cut 13 m deep into the upper cliff wall (`14 × 13 m`, clear height `5.4 m`), framed with rolled steel arch ribs (`ribs` shell) and basalt rock walls on south, east and west, with a 6.4 m wide north portal flanked by rock piers opening onto `road-1` and the lake drop beyond. The player descends Ramp 1, rounds Hairpin 1 and enters the bright amber-lit mouth on their right; behind the north-facing plate stand the production wellhead, its insulated flowline on stanchions, the plate heat exchanger and the hot-water tank. Two overhead caged work lamps from the pool light the plate and exchanger.
2. **Bench 2 — `q2-calorimetry` (Calorimetry) — Perched Spring Gallery (`room-2`, Level 1, `y = 15.0 m`).** Teaches specific heat capacity and heat transfer in a calorimeter bath. Cut into the eastern half of Level 1's cliff wall (`14 × 13 m`, stepped sinter-arch ceiling `5.2 m`, `sinterArch` shell) where a hot geothermal seep issues from the volcanic rock into a stone-rimmed pool along the east back wall. Oriented east-west: the player enters at the north-west door from `road-1`, facing east toward the plate; along the entire north side to the player's left (`7.6 m` span) is a railed open gallery bay looking straight across the caldera toward the lava lake. Behind and beside the plate stand the steaming spring basin, the sampling davit and basket, the lagged calorimeter bath and the platform scale, lit by two overhead lamps.
3. **Bench 3 — `q3-enthalpy` (Reaction Enthalpy) — Boiler Vault (`room-3`, Level 2, `y = 10.0 m`).** Teaches enthalpy of reaction and comparing fuels per gram vs. per mole. A refractory-brick barrel vault (`13.6 × 13.4 m`, crown `5.6 m`, `brickVault` shell) set deep into the middle cliff wall just west of Hairpin 2, entered through an arched masonry portal from `road-2` with an open north flank looking toward the caldera. Standing at the north-facing plate, the player sees the brick-set horizontal boiler drum on its saddles, firebox door, steel flue piercing the vault crown into the cliff above, and the fuel-canister cage and hopper beside the bay, lit by twin vault-hung lamps.
4. **Bench 4 — `q4-bonds` (Bond Enthalpies) — Fumarole Overhang (`room-4`, Level 2, `y = 10.0 m`).** Teaches that breaking bonds takes energy and forming bonds releases it. The widest open-sided rock-cut gallery (`15 × 13 m`, rough-hewn stepped basalt overhang `5.8 m`, `overhang` shell) on the western half of Level 2, with an 8.0 m open north face divided by heavy steel stanchions so sulphur fume vents straight out over the caldera. Behind the north-facing plate, an active sulphur fumarole cone breathes through a steel floor grate under a suspended copper cracking coil, exhaust hood and flue, flanked by supply drums and the dual-dial gauge board, lit by two boom-hung lamps.
5. **Bench 5 — `q5-hess` (Hess's Law) — Separator Gantry Bay (`room-5`, Level 3, `y = 5.0 m`).** Teaches that enthalpy change depends only on start and end states, not the route taken. A concrete-and-truss pipe gallery (`14.4 × 13.2 m`, clear height `6.0 m`, `gantry` shell) cut into the lower cliff wall just east of Hairpin 3, right where the caldera steam main runs past its wide 6.8 m north portal. Behind the north-facing plate stand the vertical cyclone separator, the overhead steam header, and the two parallel routes down to the same drain (a direct insulated vertical shaft beside a stepped multi-elbow manifold), lit by overhead gantry lamps.
6. **Bench 6 — `q6-entropy` (Entropy) — Silencer Expansion Alcove (`room-6`, Level 3, `y = 5.0 m`).** Teaches entropy as the number of microstates (ways energy and particles spread). A baffled acoustic concrete alcove (`14 × 13 m`, clear height `5.6 m`, `baffle` shell) on the eastern half of Level 3, oriented west-east: the player enters at the north-east doorway from `road-3` facing west toward the plate, with a 7.4 m railed open bay along the north wall to their right overlooking the caldera drop. Behind the west-facing plate stand the twin vertical expansion silencers venting steam out over the drop, the twin glass expansion bulbs with their brass stopcock, and the vacuum pump, lit by two acoustic-baffle lamps.
7. **Bench 7 — `q7-gibbs` (Free Energy) — The Turbine Hall (`room-7`, Level 4, `y = 0.0 m`).** Teaches Gibbs free energy as the balance between enthalpy and entropy with temperature. A full gabled steel-truss industrial hall (`16 × 13.4 m`, eaves `6.8 m`, ridge `9.0 m`, `turbineHall` shell) standing at the foot of the caldera wall on Level 4, entered through a wide industrial bay door from `road-4` with high north clerestory glazing facing the lava lake. Inside, behind the north-facing control bench, sit the insulated steam turbine casing, generator housing, control console of dials, small test furnace and beam balance, lit by three high-bay filament lamps.

### 6. How it differs from each of the other eleven worlds

- **Tallow:** dead-flat white salt pan with standalone plant buildings vs. a 20 m switchback carved down a volcanic cliff wall.
- **Lanternfall:** frozen glacial lake shore with ice caves under aurora vs. a sunlit/ochre-fumed caldera cliff overlooking molten rock.
- **Ligar:** basalt plateau with a quarry pit and closed underground mine drifts into hills vs. a terraced caldera wall with open-sided galleries looking out over a lava lake.
- **Bellows:** elevated steel decks and catwalks over a cloud sea with no ground vs. solid volcanic rock cut into a switchback road.
- **Mirrowen:** sea-level harbour quays, canal and moored hulls vs. a descending volcanic cliff road with rock-cut galleries.
- **Kettle:** one enclosed foundry building covering the site with interior crane aisle vs. an open-air caldera switchback where six of seven rooms open directly onto a volcanic drop.
- **Teeter:** west-facing salt-pan terraces with a single straight fall-line stair and branching dikes (a comb) vs. a north-facing caldera wall with alternating east-west switchback ramps and hairpins.
- **Verdigris:** drowned masonry fort in a reed swamp crossed by boardwalks on piles vs. dry high-relief volcanic rock cut into a multi-level cliff road.
- **Brinewire:** a single concrete tidal barrage wall across a marsh with an interior cell gallery vs. a natural stepped caldera wall descending to a lava lake.
- **Quicklight:** flat-topped lava-flow refinery packed into a grid of ten alleys under pipe racks and lightning vs. a single-route switchback cliff road with open vistas across a caldera.
- **Lodestone:** a narrow winding slot canyon in banded iron closing overhead vs. a wide open caldera wall facing out across a vast crater and lava lake.

### 7. The far country

- **North (`-z`):** The caldera floor 20 m below Level 4 (`y = -20 m`), the crusted molten lava lake (`x = -12, z = -155, rx = 75, rz = 45`, `M.magma`), and the active volcanic cone rising 175 m out of the far floor (`x = 68, z = -310`) with its rising fume plume; beyond them, the far north caldera rim wall 400–650 m out.
- **South (`+z`):** Stepped basalt and tuff caldera walls rising 140–220 m behind the rim shelf, with a geothermal power pylon line climbing out toward the high rim and two distant worker habitats on the upper shoulder.
- **East (`+x`):** The curving east caldera amphitheatre wall with tiered lava-flow ledges, a distant ridge wellhead and steam plumes rising from fissures along the cliff.
- **West (`-x`):** Lowered caldera wall toward the WSW sun (so the low copper sun clears the rim), cooling cells and transformer yard perched on an outer west bench below Level 4, and the curving west cliff wall.

### 8. Numbers to hold

- **Bench ground span:** `15.00 m` (`0.00 to 15.00 m`, target `>= 3 m`).
- **Housed benches:** `7/7` (`R5` to `R8`, target `>= 5/7`).
- **Plates in view from spawn:** `0` (target `<= 2`).
- **Shared layout / ring / two-columns:** none, false, false.
- **Frame budget (T4, `perf-worlds.mjs`):** `<= 900k` triangles, `<= 566` draw calls (target ~250–380 draws, ~250–450k tris).
- **Real lights:** 3 pooled `PointLight`s (`LampPool`), plus the built sky's sun, hemisphere and weak north lake fill.

### 9. Kept, rebuilt, archived

- **Kept unchanged:** `src/three/ember/atmosphere.js`, `src/three/ember/effects.js`, `src/three/ember/field.js`, `src/three/ember/kit.js`, `src/three/materials/ember-textures.js`, all `src/learn/quests/unit05/*`, `src/learn/bank/unit05.json`, `src/learn/worlds/unit05-thermodynamics.js`.
- **New:** `src/three/ember/caldera-plan.js` (pure data + height field + `lib/workings.js` volumes + `lib/cover.js` spec, no THREE).
- **Rebuilt:** `src/three/ember/terrain.js`, `src/three/ember/host-plan.js`, `src/three/ember/stations.js`, `src/three/ember/plant.js` (adapted helpers kept, wall/rail/pipe builders updated), `src/three/ember.js`, `tools/gen-ember-layout.mjs`, `src/three/world-data/ember.json`, `tools/verify-ember.mjs`, and `BOSS_ARENA_SPOTS['boss-crucible']` in `src/learn/engine/boss-arena.js`.
- **Archived** (to `archive/2026-11-18/site-ember/` with README): old `tools/gen-ember-layout.mjs`, old `tools/verify-ember.mjs`, old `src/three/ember/terrain.js`, old `src/three/ember/host-plan.js`, old `src/three/ember/stations.js`, old `src/three/ember.js`.

### 10. Build record and before/after measurements (2026-11-18)

Built on branch `site/ember` (`caldera-plan.js`, `terrain.js`, `host-plan.js`, `stations.js`, `ember.js`, `gen-ember-layout.mjs`, `verify-ember.mjs`, `boss-arena.js`).

**Departures from the initial spec:**
- **Terrace step raised from 5 m to 6 m (`LEVEL = [24, 18, 12, 6, 0]`):** A ray check from the rim shelf railing showed that a 5 m step let `room-2`'s roof slab (`15 + 5.2 + 0.9 = 21.1 m`) rise above Level 0 (`20 m`). Raising the step to 6 m (1-in-5 grade on the 30 m ramps) and trimming gallery roof slabs to 0.45 m tucked every rock-cut gallery roof cleanly below the terrace rail above it, increasing bench ground span from 15.0 m to **18.0 m** (`0.00 to 18.00 m`) and walk relief to **24.15 m**.
- **Mirrowen compatibility exports:** `src/three/mirrowen/terrain.js` imports `{ fbm2, buildRibbon, buildDisc }` from `../ember/terrain.js`. All three remain exported from `ember/terrain.js` so `verify:mirrowen` passes unchanged.
- **No direct sun openings in `coverSpec()`:** Because the gallery openings face north (`-z`) away from the WSW sun (`EMBER_SUN`), the galleries use `sky` residuals (`0.30–0.42`, `0.20` in the enclosed Turbine Hall) and their own overhead pooled filament lamps rather than sun shafts.

**Before vs. after (`world-shape.mjs` and `perf-worlds.mjs`):**

| Metric | Before (flat ring) | After (caldera switchback) | Ligar (reference) |
| :--- | :---: | :---: | :---: |
| Bench ground (m) | `0.00 to 0.00` (0.00 m) | `0.00 to 18.00` (**18.00 m**) | `-2.60 to 0.89` (3.49 m) |
| Relief (m) | `0.44` | **`24.15`** | `21.55` |
| Housed benches | `0/7` (`-2 -0 -1 -0 -1 -0 -3`) | **`7/7` (`R7 R7 R7 R7 R7 R7 R7`)** | `7/9` |
| Plates in view from spawn | all visible | **`0`** | `<= 2` |
| T4 draws (`perf-worlds.mjs`) | `464` | **`369`** (budget `<= 566`) | `566` |
| T4 k tris (`perf-worlds.mjs`) | `250` | **`141`** (budget `<= 900`) | `867` |
| Build time (ms) | `388` | **`166`** | `1127` |
| Lights | `Dir*:1 Hemi:1 Dir:1 Pt:3` | `Dir*:1 Hemi:1 Dir:1 Pt:3` | `Dir*:1 Hemi:1 Pt*:1 Pt:3` |

`perf-bench-rest.mjs`: `684 of 689 deployed table stages come to rest untouched` (all 7 Ember Reach benches come to rest).
Archived files: `archive/2026-11-18/site-ember/` (`README.md`, `ember.js`, `terrain.js`, `host-plan.js`, `stations.js`, `gen-ember-layout.mjs`, `verify-ember.mjs`).

### 11. Owner's viewing list (10 places to stand)

Nothing here has been seen in a browser; every claim below is from Node geometry and ray checks.

1. **Landing & Rim Shelf spawn `(26, 25.6, 66)`, looking west-northwest toward Ramp 1 and north toward the caldera:** You should see the rim's open yellow-painted steel railing (`z = 58`), the landing pad behind/east at `(66, 24, 76)`, Ramp 1 dropping west down the dark volcanic cliff wall, the active volcanic cone rising on the far north horizon (`375 m` away) with its fume plume, and **no bench plate in view**. *Failure:* a flat plate with benches standing in a ring, a roof poking above the rim rail, or a solid parapet hiding the drop.
2. **First sight of Bench 1 — foot of Ramp 1 rounding Hairpin 1 `(-20, 19.6, 38)`, looking east along `road-1`:** You should see `road-1` running east at `y = 18 m` with an open railing on the left (north) over the caldera drop and the dark basalt cliff face on the right (south), with the amber-lit portal of Room 1 (`x ∈ [-8.2, -1.8]`) cut directly into the cliff wall ahead on the right. *Failure:* a freestanding hut on open ground, or a dark unlit hole with no lamp glow.
3. **Bench 1 — Wellhead Exchanger Gallery (`room-1`, plate at `(-5, 18, 52)`, facing south into the plate then turning north):** Inside a rock-cut steel-ribbed gallery (`5.4 m` ceiling) with the wellhead, insulated flowline, lagged hot-water tank and corrugated plate heat exchanger behind the plate under two pendant lamps; turning around looks out the 6.4 m portal across `road-1` toward the caldera. *Failure:* cramped lean-in view, machinery touching the bay, or bright unshaded sky light inside the gallery.
4. **Bench 2 — Perched Spring Gallery (`room-2`, plate at `(34.4, 18, 49.1)`, facing east into the plate):** Inside a sinter-arch gallery with a steaming turquoise geothermal seep basin behind the plate, sampling davit and basket on the right, lagged bath and scale on the left; to your left (north) is a 7.6 m railed viewing bay looking out across the caldera toward the volcanic cone. *Failure:* solid wall blocking the north bay, or water missing/buried.
5. **Bench 3 — Boiler Vault (`room-3`, plate at `(51, 12, 28)`, facing south into the plate):** One level lower (`y = 12 m`) inside a refractory-brick barrel vault with the brick-set horizontal boiler drum, firebox door, flue piercing the vault crown, fuel-canister cage (left) and hopper (right). *Failure:* flat concrete box identical to Room 1, or flue clipping the bay.
6. **Bench 4 — Fumarole Overhang (`room-4`, plate at `(5.5, 12, 28)`, facing south into the plate):** Under a wide rough-hewn stepped basalt overhang with an 8 m colonnade open to `road-2`; behind the plate, an active sulphur fumarole breathes under a helical copper cracking coil, exhaust hood and flue, flanked by supply drums and the dual-dial gauge board. *Failure:* fumarole steam missing or pipes floating/blocking the walk.
7. **Bench 5 — Separator Gantry Bay (`room-5`, plate at `(-28.8, 6, 4)`, facing south into the plate):** Another level down (`y = 6 m`) inside a concrete-and-truss pipe gallery with overhead insulated steam mains; behind the plate stand the cyclone separator and overhead header splitting into two parallel routes (straight vertical shaft vs. three-step copper manifold) to the same floor drain. *Failure:* only one pipe route visible, or ceiling girders dipping into the lean-in camera.
8. **Bench 6 — Silencer Expansion Alcove (`room-6`, plate at `(7.6, 6, 1.1)`, facing west into the plate):** Inside a baffled acoustic concrete alcove with twin vertical expansion silencers venting steam behind the plate, twin glass expansion bulbs and brass stopcock between them, vacuum pump (left) and gas cylinders (right); to your right (north) is a 7.4 m railed open bay overlooking the caldera drop. *Failure:* solid wall on the north bay, or identical orientation/architecture to Room 5.
9. **Bench 7 — The Turbine Hall (`room-7`, plate at `(36, 0, -20)`, facing south into the plate):** At the lowest level (`y = 0 m`), inside a tall gabled steel-truss industrial hall (`6.8 m` eaves, `9.0 m` ridge) with the stepped steam turbine casing coupled to the ribbed generator behind the plate, four-gauge control console on the left, and refractory test furnace + brass beam balance on the right, under three high-bay pendant lamps. *Failure:* bright unshaded interior (cover mask not working), or turbine casing intruding on the bay behind the plate.
10. **Lowest ground, expansion loop, Fifth's siphon, and Boss Arena (`(0, 1.6, -42)` facing north, then walking to the north rail `(0, 1.6, -70.5)`):** Entering `arena-deck` from `road-4` passes under the caldera main's 7.4 m expansion loop (`x = 20`); the open flat deck holds the Crucible's arena (`bossPos = [0, 0, -58]`), with the Fifth Guild's frost-furred siphon manifold visible on the west ledge (`x = -31.5, z = -54`); standing at the north rail (`z = -70.5`) gives a completely unobstructed view 20 m straight down onto the drifting crusted lava lake (`y = -20.25 m`) and the steaming volcanic cone beyond. *Failure:* expansion loop too low to walk under, anything obstructing the 16 m sightline to the Crucible, or any gap in the north railing.
