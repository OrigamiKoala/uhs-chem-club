# Ligar, finished

> **Superseded in part, 2026-10-16.** The five shelters described below (and the arch terrace, tube forge, batch house
> and weighbridge) are gone: every bench is now built into a working of the quarry or into the mine under two new hills.
> The instruments, quests and foes here are unchanged. The layout, the hosts, the mine and the light are recorded in
> `bench-integration.md` (P2/P3 progress note); the generator is `tools/gen-ligar-layout.mjs`, not the `.py` named below.

**Status: built, 2026-10-10.** Benches three to nine, the Basalt Warden, the four
instruments they stand on and the five stations that hold them on the ground. This is the
record of what was built and every place it parted from the plan in
`learn-quests.md` ("World 3 — Ligar, benches three to nine"). Nothing here has been seen in
a browser: it was built against the contracts the other worlds keep and checked in Node
(`npm run verify`).

## What exists

| Bench | Quest | Instrument | Foe |
| --- | --- | --- | --- |
| 3 | `q3-distance` Bond Energy | bond bench (`bondbench.js`, `bonddata.js`) | slag crawler, stages 1-6 |
| 4 | `q4-dots` Lewis Structures | pair board (`pairboard.js`, `lewis.js`) | slag crawler |
| 5 | `q5-resonance` Charge and Resonance | pair board, charge tool and gauge | slag crawler (lamps, or charges when the tool is on) |
| 6 | `q6-shape` Molecular Shape | domain rig, hub plates (`domainrig.js`, `vsepr.js`) | basalt warden |
| 7 | `q7-polarity` Polarity | domain rig, charged plates and arrows | basalt warden |
| 8 | `q8-hybrid` Hybridization | domain rig, mixer and twist | basalt warden |
| 9 | `q9-orbitals` Molecular Orbitals | box rack, `molecular` layout (`mo.js`) | slag crawler, stages 1, 2, 4-8 |
| boss | `boss-warden` The Basalt Warden | all four, in turn | basalt warden |

Every built quest exports `STAGES`, `SOLUTIONS`, `MISSES`, `stateFor`, `VOCABULARY`,
`BUILDS_ON`, `DEBRIEF` and `PRACTICE` (five problems), and plays on `createRunner`. Every
bench is also in `BUILT_BENCHES`, so at T4 it is a built instrument on its own site.

## Where the build parted from the plan

- **The bond bench is a sibling, not an extension of the join bench.** Its pictures (a rail
  of two atoms and an energy graph) are not the join bench's pair and slab plates, and the
  electron bench set the precedent for a sibling on the plate base. The plan's "crank" is a
  `dial.js` knob whose detents are the stage's list of separations (`settings`), the way the
  light bench's wavelength is; the stage guarantees every pair's bottom is one of them
  (`verify:learn` checks it).
- **`q4-dots` stage 4 is HOF, not HCN.** HCN has an isomer, HNC, that lights every lamp as
  well, so no amount of drawing on the board can settle which atom sits in the middle. With
  hydrogen and fluorine limited to one pair in all, oxygen is the only atom that can join
  them. `verify:learn` enumerates every placement to prove it.
- **`q4-dots` stage 2** files three molecules by the lone pairs on their heaviest atom
  (carbon none, nitrogen one, fluorine three), instead of asking for three tray sizes that
  the plate already prints.
- **The board has a lamp, not the word octet, on its first stage.** The key labels say
  "Between Atoms" and "On One Atom" until the first card has named the bond and the lone
  pair; from then on they say "Bond" and "Lone Pair".
- **`q5-resonance` was retitled `Charge and Resonance`.** A site sign reads
  `Bench N - <quest title>` and is held to six words.
- **`q6-shape` withholds the shape names in its answer options.** Stage three asks for the
  arrangement of ammonia's atoms in plain words (a "low pyramid") because the name arrives on
  its own card.
- **`q7-polarity` stage 7 sorts three molecules, not six.** Four plates did not frame at 4:3
  with a full key bank; three do, and XeF₄, SF₄ and CHCl₃ keep the stage honest (a nonpolar
  molecule made of polar bonds, and two polar ones).
- **`q9-orbitals` stage 3 has no fight.** A crawler that fell apart on He₂ would hand the
  stage's answer over, so the stage plays without an encounter.
- **Bosses.** The old two-phase Warden had hints that handed the answer over. It is five phases
  on the real instruments, with one-sentence hints.

## Layers added to the shared engine

- `foes.js`: the **slag crawler** species and its planner (`curve`, `lamps`, `charges`,
  `order`); the **basalt warden** planner reads `arms`, `field`, `twist`, `mix`, `hold`,
  `lamps` and `pull` probes. Both have portraits.
- `foebody.js`: `buildSlagCrawler`, and the warden's new poses (`splayed`, `turned`, `still`,
  `locked`, `free`, `gripped`). Dispersal sinks 0.01 m, not 0.03-0.04, so a dispersed body
  stays inside the tray the check measures.
- `plates3d.js`: `defaults.frameTwo` for a bench of exactly two plates and no dial.
- `boxrack.js`: the `molecular` layout, `combine()`, MO-aware `act`, `readOf` and `measured`.
- `instruments.js`: `BondBench`, `PairBoard`, `DomainRig` factories and seven new
  `BUILT_BENCHES` entries (and `boss-warden`).
- `ligar.js` and `ligar/stations.js`: five stations, four new cabinet faces, `initStations`.
- `gen-ligar-layout.py`: sites 3-9 built, per-site clearance for the shelters.
- Field Manual: 37 terms on road `unit03`; the "Unit N Field Log" plates are derived from the
  registry; a worked practice set files `<world>_practice_done`.

## What was left out

- A visual pass. Nothing here has been looked at: the drawn plates were drawn into a
  recording context (no NaN, nothing off the plate) and the built hardware was measured for
  framing and collisions, but how any of it looks is unseen.
- Unit 3's tail: a drag-to-turn on the domain rig's drawn view (a Turn View key instead), the
  mixer's d clouds (stage eight is argued from domain counts), and spectra for q9.
- A hero model for the Warden at T4: it fights as the jointed basalt body the kit already had.
