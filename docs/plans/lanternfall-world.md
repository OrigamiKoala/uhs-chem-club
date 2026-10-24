# Lanternfall — the world and its instruments, as built

**Status (2026-10-10): built.** All nine benches of Learn world 02 are live, the four
instruments they need exist (drawn and built), and Lanternfall is walkable ground at T4.
`npm run verify` is green. **What has not been done is look at it:** the world and its
instruments were checked in Node (build, overlap, walk, voyage, bench framing, every plate drawn
onto a recording canvas), not in a browser.

This closes the two items `learn-quests.md` left open for this world: decision 3 (which world
first: the light bench, as recommended) and decision 4 (Lanternfall as ground; it was asked for
outright, so the "page first, ground later" recommendation was not followed).

> **Superseded (2026-10-16):** the ring of shelters described below was replaced by P4 of
> `bench-integration.md`. The nine benches are now built into an observatory camp's equipment
> (`three/lanternfall/stations.js`), laid out by the rewritten generator. The instruments
> and the rest of this record stand.

> **Superseded again (2026-10-22): the benches are tabletops.** Phase T4 of `bench-tabletop.md` (T4a to T4d) made every
> Lanternfall quest, the Lantern-Eater included, a TABLE played from the lean-in view: loose pieces, slots, trays, rails and
> fixtures on the bench plate, graded on what is on the table, on six kits (`table/kits/optics.js`, `cloud.js`, `shells.js`,
> `pes.js`, `trends.js`, `cuvette.js`). **None of the four instruments in "The four instruments" below is played by any quest
> now**; their files stay until T7 retires them (see the orphan list in the plan's T4d note). What changed on the hosts, all inside
> the camp described by `bench-integration.md` P4 and held by `verify:lanternfall` and `verify:bench`:
>
> - **Two field points** (`fieldPoint`s registered in `three/lanternfall.js`, each a real part of its host): `flume` ("Flume
>   Strip", the crest recorder on a post in front of bench 1's gutter, `q1-wave` stage 1) and `hole` ("Ice Hole Water", a hand
>   sampling winch on a post on the ice west of bench 9's hole, `q9-absorb` stage 5). The guide arrow follows the lantern road.
> - **Bench 1** gained the crest recorder post; **bench 2** a plate case on a trestle beside the desk; **bench 3** a rack of gas
>   tubes and a spare filament lamp on the sled's bed; **bench 7** a specimen rack on the arc's platform; **bench 8** a hanging
>   spring scale at the end of the store; **bench 9** the winch. Benches 1 to 9 each hang a work lantern over the plate
>   (a `lampMark` in the `LampPool`; the light count is unchanged).
> - **The records tent** (benches 5 and 6) was re-roofed: the eave ends at the plate's line (z 0.5) so the canopy no longer runs
>   over the leaned-in camera, the tent is a gable open at its mouth, and the ridge is still one world line from both halves
>   (`TENT_SPAN` 7.0; the declared extent of each half is `[-5.7, 5.7, -3.6, 0.7]`). This removed the last Lanternfall lines from
>   `tools/bay-legacy.json`.
> - **The Lantern-Eater** is fought at `BOSS_ARENA_SPOTS['boss-eater']`, unchanged, with each phase's table standing in its own
>   room and the eater in the table's corner pad; `verify:lanternfall` still holds that ground open.

## What stands where

Nine benches on a ring of radius 52 m round a frozen lake of radius 24 m, spaced 37° apart,
leaving a gap in the south for the spawn (0, 84) and the way in. The Avalon's pad is at
(52, 80). Each bench faces inward: its approach mark is 4.6 m toward the lake.

| Site | Quest | Roof |
| --- | --- | --- |
| 1 | `q1-wave` Light Waves | a sine wave drawn on the back wall, with its ruler |
| 2 | `q2-photon` Photons | a lens mast and a dark hood |
| 3 | `q3-lines` Line Spectra | a glass prism on its stand, seven muted bands behind it |
| 4 | `q4-cloud` Orbitals | geodesic ribs over the bench, a glass block on a plinth |
| 5 | `q5-numbers` Quantum Numbers | a wall board of milled boxes in ladder rows |
| 6 | `q6-filling` Electron Configuration | a ladder of shelves with tokens |
| 7 | `q7-pes` Photoelectron Spectroscopy | a detector arc and a lamp housing |
| 8 | `q8-trends` Periodic Trends | a stepped table of tiles |
| 9 | `q9-absorb` Spectroscopy | a rack of vials and a boxed spectrometer |

Outside the ring: 20 ice spires, 9 pressure ridges, 4 aurora masts, 6 camps, 5 sleds, a sunk
crawler, a comms mast and 26 lantern posts (the road). The layout is generated, seeded and
disjoint (`tools/gen-lanternfall-layout.mjs`).

## The four instruments

All four are `PlateBench` subclasses (`engine/plates.js`) with a built twin through
`plateBench3D` (`engine/plates3d.js`).

| Instrument | Files | Serves |
| --- | --- | --- |
| Light bench | `lightbench.js`, `lightbench3d.js`, `lightdata.js` | q1, q2, q3, q9 |
| Cloud plate | `cloudplate.js`, `cloudplate3d.js`, `orbitals.js` | q4 |
| Box rack | `boxrack.js`, `boxrack3d.js`, `electrons.js`, `rackcontrols.js` | q5, q6 |
| Electron bench | `electronbench.js`, `electronbench3d.js`, `electrons.js` | q7, q8 |

## Where this differs from the plan

- **The electron bench is not an extension of the core bench.** The plan said to add a
  `spectrum` field and a pull meter to `corebench.js`. That class draws three fixed fields and
  carries its own animation and needle; a spectrum and a pull meter are neither, so they are a
  sibling instrument on the plate base. It borrows the look, not the code. Tallow's `q2-core`
  and `q4-ledger` are untouched.
- **The box rack is a flat board on a raked screen, with real hardware beside it** (a tray of
  key-caps, a magnet and a sample pellet that slides), not a board of loose 3D arrows. A box
  holds up to two arrows, and the player counts them, so they are drawn once, in one plane.
- **The cloud plate is drawn flat and built as a glass block.** The counts and the empty shell
  are read from the flat slice; the block is there to be walked round.
- **Quest 3's energy-ladder plate and quest 9's calibration plot** are plate heads of the light
  bench, not separate instruments.
- **The drawn ruler on the trace head is measured with a tap** (crest to crest), not read from
  a printed wavelength, so a wavelength is something the player measures.
- **The stage loop is shared** (`engine/stagerunner.js`). Tallow and Ligar carry their own
  copy of it in every quest; Lanternfall's nine do not.
- **Element names and symbols** (decision 1) follow the recommendation: `q1-wave` stage 8's card
  says every code is an element, and symbols are used from then on. The existing Tallow and
  Ligar benches were not touched.
- **`BUILDS_ON`** (decision 2) follows the recommendation, and stops short of checking that a
  quest uses no word another world earned: `verify:learn` checks that each `BUILDS_ON` entry is a
  real, built quest, and the quest page prints one linked line.

## Deliberately left out

- **Ligar's benches three to nine.** Nothing here touches them; their instruments (crank,
  pair board, domain rig) are still to build.
- **Lanternfall in the Field Manual beyond twenty-two terms, and any commendation art.**
- **A moving ground effect** (drifting snow over the crust, a breath of steam off the lake).
  The only moving things are the aurora, the lanterns' filament and the diamond dust.
- **A horizon.** The far country is long ice hills in the terrain; there is no ridgeline drawn
  into the sky as Tallow and Ligar have, because there is no sun to light one.

## Rules this world adds to the standing ones

- **A plate bench is drawn once.** The canvas plate and the built screen call the same `draw`.
- **A label is plain until its word is earned** (`stage.labels` on the light bench and the
  electron bench), so the instrument never talks in a cipher the card has not yet replaced.
- **The magnet measures the sample.** `Test Sample` is a real count; `Test Rack` applies the
  same rule to the arrangement. A stage where the two disagree on the first attempt is a
  discovery, not a recital.
- **A spectrum never names its rows.** Position and height only; the configuration is for
  the player to write.
- **Every graded figure is recomputed.** `verify:learn` rebuilds each answer from the tables
  in `lightdata.js`, `orbitals.js` and `electrons.js`.

## The 2026-10-22 bench audit pass

Every Lanternfall bench now stands solid parts on its table (`engine/lab-props.js`), has its layout held by `verify:table`'s audit,
reads in real terms and prints how to use it (`table/notes.js`). The record of what changed and what was left is in
`docs/plans/bench-tabletop.md`, "Lanternfall audit pass".

## Tabletop and retirement update (2026-10-22)

- Every Lanternfall quest is played on the Tabletop (`Table3D` across optics, cloud, address/filling, spectrum, trends and cuvette kits).
- `lightbench3d.js`, `cloudplate3d.js`, `boxrack3d.js`, `electronbench3d.js`, and `plates3d.js` are retired (T7).

## The 2026-10-23 rollout pass: every quest cut to one click

Tallow was restructured first (problems doc, "Roll out world by world"); this is Lanternfall's pass. The owner's audit (`docs/Avalon problems
and clashing rules.md`) said the benches were worksheets: the player followed an instruction and the idea never had to click. Each quest is
now built around one wrong model the player is likely to hold, put on the table as a guess BEFORE the instrument is there (`predict: true`, then
`engine/predict.js`), and then contradicted by the bench. The test stage's prompt and reward read the guess back and say whether the bench
agreed. The guess is never graded.

**World counts after the pass: 10 quests (9 benches + the Lantern-Eater), 49 stages** (was 77): q1-wave 4, q2-photon 5, q3-lines 5,
q4-cloud 5, q5-numbers 5, q6-filling 5, q7-pes 5, q8-trends 5, q9-absorb 5, boss-eater 5. Nine predict stages (one per bench, none on the boss),
ten story animations (one per quest).

| Quest | The wrong model | The click (predict, then test) | Kept stages (old numbers) | Cut |
| --- | --- | --- | --- | --- |
| q1-wave | colour is a kind of strength: violet is faster, or red gets there first | which of red and violet crosses the same gap first; the pulse timer (with a lamp holder now) says together | 1, 3, 7 (as a five-source rail, lowest to highest frequency) | 2, 4, 5, 6, 8; the flume strip fetch |
| q2-photon | a brighter lamp is a bigger wave and frees more | how many electrons a very bright red lamp frees from sodium; none | 1, 2, 3, 6 | 4, 5 (Planck sum), 7, 8 |
| q3-lines | a glowing gas gives a rainbow like a hot wire | what hydrogen's band looks like; four sources sorted by band; sealed tube against four strips | 1, 2, 3, 4 | 5, 6, 7, 8 |
| q4-cloud | the electron is a planet on a ring | where 500 shots land; four films of one area, one of them the ring | 2, 3, 5, 7 | 1, 4, 6, 8 |
| q5-numbers | a box is a room and takes any number | how many electrons one box takes; two, and a third is refused | 1 (rewritten as the three-number address), 5 (six candidates), 6 | 2, 3, 4 (now the click), 7, 8 |
| q6-filling | shells fill in the order they are numbered | where potassium's nineteenth electron goes (3d or 4s) | 1+2 (carbon with the magnet), 3, 4, 8 | 5, 6, 7 |
| q7-pes | every electron of an atom is held the same way | how many of lithium's electrons the weakest freeing light takes; one | 3, 5, 6, 8 | 1, 2, 4, 7 |
| q8-trends | more protons and electrons, bigger atom | which of lithium and carbon is bigger; four atoms of one row ranked by the size gauge | 3, 2, 6, 5 | 1, 4, 7, 8 |
| q9-absorb | a blue solution takes in blue, or gives blue out | which colour the copper solution takes out; the strip shows orange missing | 3, 4, 5, 8 | 1, 2, 6, 7; the lake-water fetch |
| boss-eater | | | all five phases (one bench each), prompts and misses rewritten | |

- **Field points cut.** `flume` (q1) and `hole` (q9) each carried a copy of what the bench held (a water wave the lamp screen did not need, an
  empty cuvette). Both are gone from `three/lanternfall/stations.js` (the posts stay as scenery) and `verify:lanternfall` now expects none. A
  field point added again must bring new evidence and pass the old geometry checks, which are kept.
- **Copy.** No bench has a briefing (the Tour carries it; only the boss keeps one). Hint rung 1 names the control; the how is printed on the
  object. Miss messages name what the table shows ("Boron stands left of Beryllium, and it costs more to strip") and never the reasoning;
  `tools/lib/verify-lanternfall-learn.mjs` fails a miss or a `check()` literal that carries "because", "try", "look for" and the like. Stage
  one of q1 prints "crest to crest" and "crests a second" on its screens until the card earns "wavelength" and "frequency"
  (`waveScreen(..., {plain: true})`). AP-depth parts were cut or re-pitched: Planck's sum, the Bohr formula, the successive ionization energies,
  noble-gas notation, the blocks, the Beer-Lambert prediction, the uncertainty principle, electronegativity. Chromium stays as an optional
  last stage of q6 and says it is beyond the exam; q5 and q7 say they are optional depth.
- **A stake on each table.** Beacon 1 and the spare lamp, the camp's relay mast, oven and X-ray tube, the records tent's board, the sealed tank
  water, the sealed specimen at the tower. One quiet lead line each (`stage-story.js`), none on the boss.
- **3D.** `dress3d` can now follow the state: a dress group with `userData.sync(fixture, state)` is called by `table3d.js` after every change.
  New solids in `engine/lab-props-lanternfall.js`: a wave ribbon over the lamp screen (crests and colour follow the dial), packets of light in the
  photocell's tube (as many as the brightness, as big as the frequency), a beam through the spectrometer's well that comes out as dim as the
  reading says, and rods for the electrons in each orbital box (an up arrow has its head at the top, a down arrow hangs the other way). The cloud plate's
  dots were already beads at their depth. Reward cards carry `reward.model` (types in `engine/model-parts-lanternfall.js`: wave, photons, ladder,
  orbital, rack, radii, cuvette), all derived from the same planners the bench used.
- **Story.** `story/quest-story.js` holds ten `unit02/...` animations and `ui/story-scenes-lanternfall.js` their painters, each drawn from the
  numbers measured (the spectrum of oxygen, the radii, the absorbance of the sealed tank). Each ends on a `Filed:` line that continues
  Tallow's thread: the beacons, the plates that answer only to violet, the tube of helium, the specimen that is oxygen, the water that holds copper,
  and the lens ground for ultraviolet.
- **Checks.** The per-quest recomputation moved out of `tools/verify-learn.mjs` into `tools/lib/verify-lanternfall-learn.mjs` and one file per quest
  in `tools/lib/lanternfall/`; the old block is archived in `archive/2026-10-23/tools/`. `verify:table`'s predict-first check now covers unit02.
- **Not done.** The benches have not been played: the owner plays them. The Field Manual's Lanternfall terms were re-pointed at the new stages
  (five of them now name a different term: Emission Spectrum, Standing Wave, Hund's Rule, Atomic Radius, Calibration Curve).
