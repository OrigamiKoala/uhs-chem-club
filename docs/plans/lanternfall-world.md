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
