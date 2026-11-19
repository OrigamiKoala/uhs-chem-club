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

**World counts after the pass: 10 quests (9 benches + the Lantern-Eater), 50 stages** (was 77): q1-wave 5, q2-photon 5, q3-lines 5,
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

## Site rebuild (2026-11-18)

Branch `site/lanternfall`. The brief is Lanternfall's row in `docs/plans/world-distinction-plan.md` section 6; this
section is the spec the build is audited against, and then its record. Everything below the line "Build record" was
written after the build, from measurements; nothing here was seen in a browser.

### 1. The place

**One sentence.** A glacier tongue ends in an ice cliff on a frozen lake, and the expedition works round the lake's
shore and over the glacier, in caves under the shore's pressure ridges, in the moraine, in the glacier's ice, and in a
dome on the far shore.

**The first ten seconds.** The player stands on the south shore's moraine flat with the pad behind them. Ahead is the
lake, flat and dark, with a ragged wall of rafted ice slabs along its near shore, and beyond it the glacier's snout: a
14 m cliff of ice across the north end of the lake, the glacier climbing away behind it to an icefall and a summit
of rock. A road of lanterns runs east along the shore and climbs the moraine; on the right a dome stands on a knoll.
No bench is in view.

### 2. The signature

| | This build | Checked against the other rows |
| :--- | :--- | :--- |
| Landform | A glacier tongue (surface 14 to 16 m) ending in an ice cliff on a frozen lake (0 m); moraines down both sides; pressure ridges of rafted lake ice along the shore; a nunatak through the glacier's west margin; an erratic on the west moraine | No other row has a glacier, a lake you do not walk on, or ice as the ground |
| Walk shape | A loop round the lake: up the east moraine, over the glacier on one marked crossing above the snout, down the west moraine; four spurs leave it (two cut down to the lake ice, one cut down into the glacier, one up a crawler's tailgate) | Mirrowen walks round a basin on built quays at right angles with gangways onto decks; this loop is natural shore and glacier with grades of 1 in 5 to 1 in 7, and crosses the ice that feeds the lake |
| Bench housing | Ten different rooms in the ice and the land: two caves under pressure ridges on the lake ice, a vault cut into ice-cored moraine, a meltwater cave in the glacier's margin, the crawler's drill hall, the records tent pitched at the bottom of a crevasse and its annexe cut into the crevasse wall, a chamber cut into the nunatak under the tower, a room under the erratic, the dome | No other row houses benches in ice or under ice |
| Light | Polar night and the aurora, kept from the built sky; indoors under the shared cover mask, lamps only | as the row |

The row is held. The only addition is the erratic and the nunatak, which the row did not name; both are glacial
landforms and give the west shore rooms that are not ice.

### 3. The plan (x east, z south, metres)

- **Walk extent:** x -63 to 65, z -95 to 72 (inside the stage's 100 m square).
- **Lake:** an ellipse centred (0, 6), 34 m by 22 m half-axes, ice at 0.0 m. Not walked: the shore walk is held out of it
  by colliders along every lake-facing edge; two caves stand on the ice at its east and west shores.
- **South shore, the yard:** x -40 to 50, z 30 to 72, level at 2.0 m. The pad at (22, 58), the spawn at (4, 40) facing
  north over the lake, the boss's ground at its west end.
- **East shore:** a path x 40 to 50 climbing north from the yard: ramp z 30 to 14 (2 to 5 m), landing z 0 to 14 (5 m, Bench 2's
  door on its east side), ramp z 0 to -22 (5 to 9 m), landing z -36 to -22 (9 m, Bench 3's door on its west side), ramp
  z -36 to -62 (9 to 14 m).
- **The crossing:** x -62 to 50, z -74 to -62, level at 14 m, over the glacier 45 to 55 m north of the snout. The crawler's
  tailgate leaves it to the north (x -2 to 2, 14 to 15.4 m); the crevasse ramp leaves it to the south (x -18 to -12,
  z -62 to -34.8, 14 down to 8.4 m).
- **West shore:** a path x -62 to -52 coming down south: ramp z -62 to -40 (14 to 10 m), landing z -40 to -26 (10 m,
  Bench 7's door on its west), ramp z -26 to -4 (10 to 6 m), landing z -4 to 10 (6 m, Bench 8's door on its east), ramp
  z 10 to 30 (6 to 2 m), then a turn x -62 to -40, z 30 to 42 at 2 m into the yard; the dome's porch leaves it south.
- **Spurs to the lake:** from the yard's lake edge, two ramps cut down through the shore bank to the ice: x 19 to 25 (2 to
  0 m) to Bench 1, x -27 to -21 (2 to 0 m) to Bench 9.
- **Closed ground:** the moraines either side (rising 4 to 12 m above the paths), the glacier either side of the crossing
  and of the crevasse ramp, the nunatak, the snout's cliff, the lake. Every edge of every walk volume that is not a doorway
  is a collider (`lib/workings.js` walls); the flood fill proves it.
- **Route in bench order:** spawn, east along the yard to the Bench 1 spur and down; back up, east and up the east shore to
  Bench 2 and Bench 3; up to the crossing, west to the crawler (Bench 4); down the crevasse ramp to the records tent (Bench
  5) and through to its annexe (Bench 6); back up, west along the crossing and down the west shore to Bench 7 and Bench 8;
  down to the yard, Bench 9's spur, and the dome (Bench 10).
- **Boss ground:** the yard's west end, the Lantern-Eater over (-22, 40) with the lake and the snout behind it, the player
  at (-22, 54). Open and level (2.0 m) for 7 m all round.

### 4. The section (main loop, start to end)

Yard 2.0 → east ramp to 5.0 (1 in 5.3) → Bench 2 landing 5.0 → ramp to 9.0 (1 in 5.5) → Bench 3 landing 9.0 → ramp to
14.0 (1 in 5.2) → crossing 14.0 (crawler floor 15.4 up its tailgate; records tent 8.4 down the crevasse ramp, 1 in 5) →
west ramp to 10.0 (1 in 5.5) → Bench 7 landing 10.0 → ramp to 6.0 (1 in 5.5) → Bench 8 landing 6.0 → ramp to 2.0
(1 in 5) → yard 2.0. The lake caves are at 0.0, down 2 m spurs. **Bench ground: 0.0 to 15.4 m (15.4 m span).**

### 5. The benches

1. **q1-wave, Light Waves — the flume cave.** A cave under the pressure ridge on the lake ice at the east shore. A pressure
   ridge is lake ice broken and rafted by the push of the glacier; the slabs lean together over a hollow. Closed on all four
   sides by rafted slabs, roofed by tilted slabs 5.4 m up; 14 x 14 m. The player comes down the cut spur from the yard and
   in at the south; the flume (a trough of lake water fed through a hole in the ice) runs along the back wall behind the
   plate, its paddle at one end and its beach at the other, the strobe on a gantry over it. Lamps: one pendant over the
   plate from the gantry, one by the door. A wave tank on lake water, in the lake's own ice.
2. **q2-photon, Photons — the mast vault.** A vault dug into the ice-cored east moraine under the foot of an aurora mast,
   its walls and roof held back by timber cribbing on steel sets. Closed on three sides and the roof by the moraine, the
   fourth by its front wall with the door; 14 x 14 m, 5.2 m to the lagging. The mast's photocell cable comes down a lined
   shaft through the roof into the housing behind the plate; the battery racks and the plate case stand along the walls.
   Photons from the sky, measured under the mast that looks at it.
3. **q3-lines, Line Spectra — the meltwater cave.** A cave melted along the glacier's east margin, where the ice meets the
   moraine: a long arch of scalloped blue ice, open only at its door on the east landing; 14 x 14 m, 5.2 m to the crown. The
   spectrograph sled is parked inside, its tailgate down to the plate; the gas tube rack and the spare lamp on the sled's
   bed. Dark: the only light is the work lamps, which is what a spectrograph needs.
4. **q4-cloud, Orbitals — the crawler's drill hall.** The expedition's ice-core drilling crawler parked north of the crossing
   on its scraped apron, its tailgate let down to the track. The hall is a steel box on the crawler's deck 1.4 m above the
   ice, 14 x 13 m, 5.2 m to its roof, ribbed and lagged; the drill tower stands through the roof behind the plate, with the
   core barrel racks and the cloud chamber's cabinet along the walls. Closed on all sides; the tailgate is the door.
5. **q5-numbers, Quantum Numbers — the records tent.** At the foot of the cut ramp down into a crevasse below the crossing,
   the records tent (a long arched tent of canvas on timber hoops) is pitched across the crevasse's floor between its ice
   walls. 16 x 12 m, 5.0 m to the hoops; the crevasse's ice walls stand outside the canvas, the snow bridge over the
   crevasse above it. The board of boxes stands behind the plate; the filing cabinets and the stove along the sides.
6. **q6-filling, Electron Configuration — the records annexe.** A chamber cut square into the crevasse's west wall off the
   tent's west end, entered through a short passage beside the board's back face. Flat cut ceiling at 4.8 m (5.0 at the
   plate), tool marks on the ice, plan tables and the charts in racks; 14 x 14 m. Ice on five sides.
7. **q7-pes, Photoelectron Spectroscopy — the nunatak chamber.** A chamber blasted into the nunatak (a peak of rock that
   stands up through the glacier's west margin), under the lattice tower on its summit. Rock on three sides and above, rock
   bolts and mesh on the walls, its door on the west landing; 14 x 14 m, 5.4 m up. The detector arc, its sample chamber and
   the specimen rack stand behind and beside the plate; the tower's cable comes down a borehole.
8. **q8-trends, Periodic Trends — under the erratic.** A boulder the size of a house left on the west moraine by the
   glacier, with a room built under its overhang: dry-stone walls on three sides, the boulder's underside as the roof
   (4.9 to 6.5 m up), the door on the west landing; 14 x 14 m. The camp's metal stock and sample tiles in racks along the
   walls.
9. **q9-absorb, Spectroscopy — the ice-hole cave.** A cave under the west shore's pressure ridge on the lake ice, lower
   and wider than the flume cave and domed rather than leaning: slabs stacked into a rough corbelled vault, 14 x 12 m, 5.0 m
   at the plate. A hole cut through the floor's ice to the water under it, with its tripod and winch, and the sealed tank
   beside the plate. The water the bench measures is the water under the floor.
10. **q10-wavefunctions, Wavefunctions — the dome.** The observatory's geodesic dome on the south-west knoll, entered
    through a porch (an airlock of two doors) off the west turn. Struts and panels all round and overhead, 13 x 13 m floor
    inside a 9.6 m radius, 8 m to the crown; cabinets fill the ring between the floor and the dome's foot. The resonance
    rig stands behind the plate.

### 6. How it differs from each neighbour

- **Tallow:** a dead-flat salt pan and a process plant; here every step of the walk climbs or drops, and the ground is ice and moraine.
- **Ligar:** basalt hills, a quarry and mine drifts in rock; here the hollows are in ice, the hub is a lake you cannot walk on.
- **Bellows:** steel decks in the air over cloud; here the ground is the ground, and there is no deck except the crawler's.
- **Ember Reach:** a switchback down a caldera wall to a lava lake; here a loop round a frozen lake, and the cliff is ice.
- **Mirrowen:** right-angled quays of masonry round a harbour basin with ships; here a natural shore of moraine and ridge ice, no ship.
- **Kettle:** inside one building; here outside, and the rooms are in the land.
- **Teeter:** terraced salt pans down a hillside, a comb walk; here a loop, and nothing is terraced.
- **Verdigris:** boardwalks over a swamp to a drowned fort; here no water is liquid except under a hole.
- **Brinewire:** a concrete barrage; here nothing poured, the only structures are a crawler, a tent, a dome and timber sets.
- **Quicklight:** a refinery grid under pipe racks; here no grid and no rack.
- **Lodestone:** a slot canyon in banded iron, one way down; here a loop that climbs onto a glacier.
- **Thornmere:** mounds in a tar lake under dead trees; here one lake, frozen, and no tree.
- **Cinder Halo:** craters and concrete cells; here caves and ice.

### 7. The far country

- **North:** the glacier climbing from the snout to an icefall (seracs) and an ice field below a ring of peaks.
- **East:** the east lateral moraine with the aurora masts on its crest, and beyond it a range of dark peaks.
- **South:** the outwash plain the lake drains across, the comms mast on its rise, and low hills.
- **West:** the nunatak's summit and the tower on it, and the glacier's west margin running north to a col.

### 8. The numbers to hold

- `world-shape.mjs`: bench ground 0.0 to 15.4 m (span 15.4 m), 10 of 10 housed (R5 or better), no clones.
- Plates in view from the spawn: 0 (at most two).
- `perf-worlds.mjs`: at most 566 draws and 900k triangles at T4; target under 350 draws and 450k triangles.

### 9. Kept, rebuilt, archived

- **Kept:** `lanternfall/atmosphere.js` (the sky, the aurora, the lights), `lanternfall/effects.js` (diamond dust),
  `materials/lanternfall-textures.js`, `lanternfall/props.js` (the aurora mast, comms mast, lantern post, landing pad,
  sled and camp builders are used as they are).
- **New:** `lanternfall/glacier-plan.js` (the pure plan: volumes, rooms, height field, cover, routes),
  `lanternfall/ground.js` (the terrain mesh, the lake ice, cut faces, ridge slabs, vista).
- **Rebuilt:** `lanternfall.js`, `lanternfall/host-plan.js`, `lanternfall/stations.js` (ten rooms and their benches),
  `tools/gen-lanternfall-layout.mjs`, `tools/verify-lanternfall.mjs`, `world-data/lanternfall.json`.
- **Archived** to `archive/2026-11-18/site-lanternfall/`: the old `lanternfall.js`, `lanternfall/terrain.js`,
  `lanternfall/stations.js`, `lanternfall/host-plan.js`, `tools/gen-lanternfall-layout.mjs`, `tools/verify-lanternfall.mjs`.
