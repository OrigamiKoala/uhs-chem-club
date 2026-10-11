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
