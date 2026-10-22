# Bellows — the world, its instrument and its fights, as built

**Status (2026-10-10): built.** All six benches of Learn world 04 are live, the one instrument
they share exists (drawn and built), a gas bladder fights on every stage that can carry a foe,
the Compressor is a five-phase boss on the same rig, and Bellows is walkable ground at T4.
`npm run verify` covers all of it. **What has not been done is look at it in a browser:** the plates
were drawn into a recording canvas and rendered to pictures in Node, the built hardware was
measured for framing and collisions, and the world was built and walked in Node
(`verify:bellows`, `verify:bench`, `verify:voyage`); how the sky and the cloud sea actually
LOOK is unseen.

This is the record of what was built and every place it parted from the plan in
`learn-quests.md` ("World 4 — Bellows").

## T5 (2026-10-22): the benches are built into the plant, and every quest is a table

**This section supersedes what follows wherever they disagree.** The sections below record the first build: six gantries on a ring, one gas
rig with six heads, a gas bladder on every stage. T5 of `bench-tabletop.md` (with the integration phase P5 of `bench-integration.md`) replaced
all three. What the older text still describes correctly is the deck, the sky, the cloud sea, the lamp pool, the Compressor's plinth and
mover, and the gas tables in `gasdata.js`; what it no longer describes is where a bench stands, what a bench is, and what fights.

**The hosts** (`three/bellows/stations.js`, one builder per bench through `buildBayBench`, footprints as pure data in `three/bellows/host-plan.js`,
shared by the generator, the world and `verify:bellows`). The host proposals of `bench-integration.md` §6 were taken as confirmed on the user's
instruction to implement T5; they are built as proposed.

| Bench | Quest | Host | Anchor |
| --- | --- | --- | --- |
| 1 | `q1-knocks` | gauge gallery on a gasholder's flank | free, 46 m ring at −40° |
| 2 | `q2-laws` | the Compressor's piston deck: two glass cylinders flanking the plate, pipework to the plinth | the tower, 14.7 m out |
| 3 | `q3-ideal` | metering skid beside a gasholder, a platform scale at the plate | free, 44 m at −150° |
| 4 | `q4-mixtures` | blending manifold on a pipe rack, a storage tank at each end | free, 46 m at 165° |
| 5 | `q5-speed` | leak-test station at the foot of a vent stack | free, 44 m at 125° |
| 6 | `q6-real` | the liquefier's frosted cold box, coil and dewar, between the plate and the Compressor | the tower, 16 m out |

Each host carries a lamp mast over its plate (the only light), the cased gas rig as the dormant instrument (`M.case`, the one clean thing on
a weathered plant), and nothing in the bay. `sites.js` and the six ring gantries are deleted. Round props are collision discs and boxes are
rows of discs, so a host's colliders never block a field point's lane. **`tools/bay-legacy.json` no longer lists any Bellows line** (what is
left is Ember's, T6).

**The layout** (`tools/gen-bellows-layout.mjs`, rewritten): `SITE_DEFS` give each host an angle and radius; the generator turns the host's
extent to the world, keeps every other landmark out of it and out of its lane, scatters the remaining gasholders (3), vent stacks (2), pipe
racks (2) and pylons from what is left, keeps the Compressor's arena on open ground (boss at [0, 20], player at [0, 34], a 14 m wide corridor
from z 13 to 38, checked by `verify:bellows` as `boss-compressor` ground), and refuses to write unless every self-check passes. **`t1.siteDescriptions`
is gone**: grep showed nothing but the verifiers read it. `world-data/bellows.json` holds 51 landmarks.

**Field points** (`three/field-points.js`, registered by the hosts): `gauge` "Holder Gauge" at bench 1's gasholder (a card with the holder's
three-ring reading, `q1-knocks` stage 6), `bleed` "Stack Leak" at bench 5's vent stack (the unmarked sample, `q5-speed` stage 6) and `drawoff`
"Cold Draw-off" at bench 6's cold box (a sample of liquid carbon dioxide, `q6-real` stage 8). All three are evidence, never a lock: a stage is
solvable without them.

**The quests** are tables on the gas kit (`table/kits/gas.js`, with `gas-read.js` the pure readers, `gas-draw.js` the painters and
`engine/gas-props.js` the solids: tanks, a pellet dish, glass barrels and lids). The kit is a thin wrapper on `gasdata.js`'s planners
(`planGas`, `planMixture`, `speedBins`, `fractionAbove`, `leftAfter`, `halfTime`, `front`, `pressureVdw`; `recordCurve` moved there from
`gasrig.js`), never a second implementation. Its pieces are tanks, statement and number cards, curve cards, speed histograms, a pellet, chips
and a trap; its fixtures are cylinder rigs (a piston dial, a heater, an amount dial, readouts, the speed screen), the common tank, the scale, the pinhole, the tube, one
particle's walk, the reference gauge, plaques and markers. **There are no bladders**: the compressor is the only foe, standing in the corner pad of each of
its five tables, and it only observes. Where a stage once asked "why?" as a four-way choice, it now marks the statements a plate supports
(`q6-real` stages 2 and 8) or predicts and tests (`q4` stages 2 and 6, `q5` stages 4 and 8, `q6` stage 4).

**Changes of substance, for the user's review:**

- `q6-real` stage 7 was written to teach "cold and roomy: the pull dominates; crushed: the size dominates". The van der Waals constants say
  otherwise: for carbon dioxide the two corrections trade places with the TEMPERATURE (their ratio is about RTb/a at any roomy setting), so a
  hot gas is the one the size of its particles governs. The stage now asks for a setting where the size beats the pull, its reward card says the
  true thing, and `verify:learn` holds the claim to the planner.
- `q5-speed` stage 8 asks where the two gases meet rather than which arrives first: the ring forms 59 cm from the ammonia end of a 100 cm tube.
- `q5-speed` stage 1 is a target (heat until the tallest bar stands under the mark) rather than a four-way choice; `q5` stage 3 asks for ten
  times the 27 °C share rather than a factor from a list.
- `table2d.js` `words()` mis-sized text drawn with a size and a width; `recorder.js` gained a fixed `range` and axis digits (the strip of `q1-knocks`
  stage 7 runs past absolute zero); `trendplot.js` takes the digits for its tick labels.

**Orphaned, not deleted (T7 retires them):** `GasRig` (`gasrig.js`, `gasrig3d.js`) and `gasmount.js`; `verify:bench` keeps its old gas-rig
pass for any quest that is not a table (none is) and `verify:learn` keeps its gas-rig plate checks for any stage that declares gas `rigs` (none does).

**Nothing here is browser-tested.** To look at in a browser: `#/learn/unit04` (3D On). Bench 1: the gasholder behind the plate and the gallery's gauges at either side; the
sealed rig under its case until `[E]`; then every stage in turn, the fetch of `gauge` in stage 6. Bench 2: the two glass cylinders at the plate's flanks
and the Compressor close behind. Bench 3: the weighing scale at the plate; tanks go on its pan. Bench 4: tanks dragged into the place under the
common tank. Bench 5: the stack's sample (fetch `bleed` first in stage 6). Bench 6: the draw-off (stage 8). The boss: five tables with the compressor in the
top-right corner. On a phone, the cards' text is the small target; the common tank's lines and the cylinders' readouts are close-set.

## What exists

| Bench | Quest | Plates | Foe |
| --- | --- | --- | --- |
| 1 | `q1-knocks` Pressure and Temperature | cylinder (window, gauge, thermometer, knock counter, speed screen, three-ring face) | gas bladders, all 8 |
| 2 | `q2-laws` The Gas Laws | cylinder with traces, two-cylinder compare, four gauge records | gas bladders, stages 1-7 |
| 3 | `q3-ideal` The Ideal Gas Law | cylinders, **sealed tanks**, a pellet port | gas bladders, all 8 |
| 4 | `q4-mixtures` Partial Pressures | mixture tanks (pour, feed, trap, sealed, a height dial) | gas bladders, all 8 |
| 5 | `q5-speed` Speed and Escape | cylinder with speed screen and bar, pinhole chambers, tubes, a tracked particle | gas bladders, all 8 |
| 6 | `q6-real` Real Gases | van der Waals cylinders (`PV/nRT`, the two corrections) | gas bladders, all 8 |
| boss | `boss-compressor` The Compressor | cylinder, free-piston cylinder, sealed tank, mixture tank, pinhole chambers in turn | the Compressor, all 5 |

Every quest exports `STAGES`, `SOLUTIONS`, `MISSES`, `stateFor`, `VOCABULARY`, `BUILDS_ON`,
`DEBRIEF` and `PRACTICE` (five problems), and plays on `mountGas` (below), which sits on
`createRunner`. Every bench is in `BUILT_BENCHES`, so at T4 it is a built instrument on its own site.

## The instrument: the gas rig

One plate bench with six heads, in `engine/`:

| File | Is |
| --- | --- |
| `gasdata.js` | PURE. The gas tables (14 real gases: molar mass, van der Waals a and b) and every planner: `pressureIdeal`, `pressureVdw` (with the two corrections returned), `speeds`, `knocks`, `speedBins`, `fractionAbove`, `leftAfter` / `halfTime` (a pinhole), `front` (a tube), `planMixture`, `mixtureState`, `stateOf`, `planGas`, and the pure stage helpers `benchCfg` / `readOf` that a quest's `check()` grades through. |
| `gasrig.js` | The drawn bench, a `PlateBench` subclass. Heads: `cylinder`, `mixture`, `leak`, `tube`, `path`, `record`. |
| `gasrig3d.js` | The built twin through `plateBench3D`: a glass barrel with a piston and weights, a tank, a pinhole chamber, a tube, and up to two real dials. |
| `gasmount.js` | The stage loop all seven modules share: the rig, the three dials (volume, temperature, time), the keys that move the gas, the readout, the foes' reactions. |

The knock counter is the real impact rate (one quarter of the density times the mean speed, in
units of 10^21 per cm² per second), NOT a figure proportional to the pressure. That is what makes
`q4-mixtures` stage 7 work: the gases rank one way by their knocks and the other by their partial
pressures, and only the moles decide. `verify:learn` asserts the two orders differ.

## The foes

`gas bladder` and `the compressor` are species in `foes.js`, with portraits, and have built bodies
in `foebody.js` (`buildPressureBladder`, `buildCompressor`), so both are in `BODY_SPECIES` and
neither is plate-only. A bladder sags, holds, swells and strains with the push; **on a free piston,
where the pressure cannot change, it swells with the ROOM instead**; on a pinhole chamber it sags
as the gas leaves; at the end of a tube it swells when the gas arrives; on a tracked particle it
shivers. The thresholds (`BLADDER`) are the species' own and `verify:learn` reads them
independently, re-working every reading by hand from the plate's declaration (`bellowsProbes`).
A bladder is made of the plate and never of the answer: no reaction carries a stage's figure.

The species is called a **gas** bladder because the plan's name, a pressure bladder, would have
spent stage one's word on a nameplate before the card earned it.

## The world

A circular steel deck, radius 82 m, riding a sea of cloud in thin air. The Compressor stands at the
middle (a 12 m footprint: plinth, ribbed block, four cylinder heads, a housing and crown, a piston
rod that strokes, a flywheel that turns and an exhaust stack with a plume). Six benches stand on a
ring of 46 m, each under a gantry whose back wall says which it is (a great dial, a piston in glass,
a beam balance, twin tanks and a manifold, a sight tube with a pinhole plate, a frosted cold
cabinet). A road of 24 work lamps rings the Compressor; six gasholders, eight scoop pylons, four
pipe racks, four vent stacks, three moored bladders and eight crate stacks stand off outside the
ring; the Avalon's pad is on the near side.

- **No ground.** `terrain.js` is the simplest field in the product: the deck's level inside its
  rim and the cloud sea's level outside it. The rail is a closed ring of 391 colliders, so the only
  drop in the world is one nobody can reach, and `solveLanding` refuses any spot whose hull would
  straddle the edge.
- **The sky and the sea** (`atmosphere.js`): one sky function drawn on the dome and rendered once
  into the environment cube; a shader plane of cumulus tops to the horizon, lit from the sun's side
  and blue in its own shadow, with cloud heads standing out of it for parallax. The sun is a halo
  with no disc (nothing blooms). Exposure is `BELLOWS_EXPOSURE` 0.86: a bright cloud sea takes less,
  as Tallow's overcast does.
- **Only lamps are lit.** The work lamps (and the one indicator at each bench) are the only
  emissive things; thirty lamps share three real lights through a `LampPool`.
- **What moves** is the cloud, the spindrift and the plumes (`effects.js`), and the Compressor's
  rod and wheel, which are held out of the bake (`userData.mover`).
- The boss has no site on the ground, as the other three bosses do not: it is reached from the walk
  HUD's list of benches once the six are worked.

`verify:bellows` holds it to every rule `verify:lanternfall` holds Lanternfall to (disjoint
footprints, sites clear of props, signs that name their bench in six words or fewer and share a word
with the quest, every site facing its approach, the walk flood-filled from the spawn with no ledge,
only lamps lit, the world built in Node and every pair of bodies measured, nothing buried) and four
a deck needs: the rail is closed, past the rail is a drop of more than 20 m, every landmark stands
inside the rail, and the Compressor has moving parts.

## Where the build parted from the plan

- **Six quests under the plan's ids, with one boss.** The old four-quest placeholder chart was
  replaced, as `learn-quests.md` decision 12 said it would be. The chart titles are the plan's.
- **The assay hopper is not on the gas rig.** The plan metered gas into the cylinder from the
  assay hopper by weighing. The rig prints a MASS row and a MOLAR MASS row on the plate instead
  (`show.mass`, `show.molar`), and Add Gas adds moles; `q3-ideal` stage 1 adds the gas itself.
- **A word is plain until its card has earned it, on the dials too.** The gauge prints a bare
  number until `q1-knocks` stage 6, where the three rings are named only by where they sit
  (inner, middle, outer) until that card names atm, kPa and mmHg. The thermometer prints
  degrees C until stage 7 earns kelvin, and then both. The energy row says "energy of motion"
  until stage 3.
- **q1 stage 6 is a reference gauge, not a conversion table.** Cylinder A carries one ring; Cylinder
  B carries all three and has a volume dial with a detent at exactly one atmosphere. The conversion
  is read off B and applied to A.
- **q1 stage 7's trace runs past the coldest the dial reaches.** The plot's axis runs to -300 C
  and the dial stops at -100 C, so the line has to be carried on, which is the discovery.
- **q2 stage 3 asks about tripling**, not doubling, and stage 1 about a quarter of the room, so the
  right answer is not "doubles" three stages running. Stage 7 puts its answer between two detents of
  the dial (450 K between 400 and 500), so it can only be reached by scaling, never by reading.
- **q2 stage 8 files four plotted records** (`record` plates, with no foe, because a plot is not a
  body).
- **q3 has two sealed tanks** (stages 3 and 5) whose window is hatched and whose plate prints no
  amount and no gas: the amount is the thing to find, and in stage 5 so is the gas.
- **q4 stage 5 is a height dial**, not a pressure dial: the air is the same sample given the room
  it would have at 0, 3000, 5500 and 8850 m, and the plate names the height.
- **q4 stage 8** is a trap that takes one gas out of a sealed tank, and the drop in the gauge is
  that gas's partial pressure.
- **q5 stage 8 uses ammonia against hydrogen chloride**, the classic pair; Graham's law is marked
  "beyond the exam" on its card (stage 5), as the plan asked.
- **q6 shows the SHARE of the push the pull takes off** (stages 4 and 8), not the pull in kPa. In
  van der Waals the pull in kPa does not depend on temperature at all, so a line labelled "the
  pull" would not have moved as the gas cooled and the hint that said it would was wrong. What
  grows is the share (`pullShare`). Stage 7 still prints both corrections in kPa, on dials chosen so
  that the pull wins cold and roomy and the size wins hot and crushed.
- **Bellows' foes are not the plan's "pressure bladders" that burst.** A bladder strains at its
  seams and is never made to burst: spoil is dispersed, and nothing is killed.
- **The story.** The Bellows episode in `saga.js` (written for all fourteen worlds by another pass)
  named the spoil "pressure wraiths"; it now names gas bladders, the boss and the clue.
  The clue is `clue_bellows_warm`, the Warm Cylinder: a sealed tank that held its pressure while
  the deck froze, which Gay-Lussac's law forbids unless something inside was giving off heat. It
  points at Cinder Halo and gives the Fifth nothing to do with chemistry.

## Rules this world adds to the standing ones

- **A control that does nothing is a failure.** `verify:learn` fails a stage that offers a volume
  dial over a cylinder that is a rigid tank or sits under a free piston (the dial would move
  nothing), and a temperature dial no cylinder follows. This is the check that found Quest 1's
  first and last stages shipping with a piston that did not move.
- **A claim a stage teaches is checked on the plate that teaches it.** Quest 1's gauge follows the
  knocks while speed, count and warmth stay put; quest 2's records are each the shape their law
  draws; quest 4's ranking by knocks is wrong; quest 6's ordering of three gases holds at EVERY
  setting of the dial, and the one closest to ideal is the same at every temperature.
- **The sky is the first thing a Bellows reading can lie about, so it is not read.** No stage grades
  anything from the picture of the world.

## Deliberately left out

- **A look at any of it in a browser.** See the status line.
- **A hero model for the Compressor at the middle of the deck.** The tower is a built landmark; the
  boss in the well is a small cylinder block and flywheel. The two share a design but not a mesh.
- **Wind, rain or a storm.** The only weather is cloud.
- **Bellows in the Field Manual beyond twenty-two terms, and any commendation art.**
