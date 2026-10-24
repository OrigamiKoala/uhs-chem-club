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
