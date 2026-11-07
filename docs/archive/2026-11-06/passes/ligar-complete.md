# Ligar, finished

> **Superseded in part, 2026-10-16.** The five shelters described below (and the arch terrace, tube forge, batch house
> and weighbridge) are gone: every bench is now built into a working of the quarry or into the mine under two new hills.
> The instruments, quests and foes here are unchanged. The layout, the hosts, the mine and the light are recorded in
> `bench-integration.md` (P2/P3 progress note); the generator is `tools/gen-ligar-layout.mjs`, not the `.py` named below.

> **Superseded again, 2026-10-17 (T1b to T3c of `bench-tabletop.md`).** All nine Ligar quests and the Warden are now
> TABLETOPS (kits `atoms`, `bonds`, `domain` and `mo` under `src/learn/table/kits/`), so the "Instrument" and "Foe" columns
> below describe what they replaced. The bond bench, pair board, domain rig and join bench (and `boxrack.js`'s `molecular`
> layout) serve no Ligar quest any more and wait for T7 to retire them. What the mine gained: two field points (`chip` at the
> ore drift's seam, `sump` at the sump's draw-off), a lamp over the plate of every underground bench and an ore tub with a pick
> at its side, and a hoist chamber whose winze and rope now stand at the BACK of the chamber (behind the plate) so the
> leaned-in camera's air is clear (`tools/bay-legacy.json` has no Ligar line). The Warden is five table phases with one foe
> in the table's corner; its ground (`BOSS_ARENA_SPOTS['boss-warden']`) is unchanged.

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

## Tabletop and retirement update (2026-10-22)

- Every Ligar quest and boss is played on the Tabletop (`Table3D` with the atom, bonds, domain and orbital kits).
- `joinbench3d.js`, `bondbench3d.js`, `pairboard3d.js`, `domainrig3d.js`, `boxrack3d.js`, and `plates3d.js` are retired (T7).

## Rollout record (2026-10-23): every bench built around one click

The audit (`docs/Avalon problems and clashing rules.md`, T1 to T8 and U1 to U5) was applied to Ligar the way it was to Tallow: each
quest keeps the stages that carry a distinct idea, has one stage where the player's likely wrong model is put on the table and
contradicted, and names the idea only after. Stage counts went from 77 to 45 (9 benches and the Warden).

| Quest | Stages | The click (the wrong idea, a card on the predict stage) | 3D | Story animation |
| --- | --- | --- | --- | --- |
| `q1-joins` | 8 to 5 | Two identical atoms cannot join. Hydrogen with hydrogen holds; argon with hydrogen comes apart. | reward models: ions, H2, CO2 | `bond-pairs` |
| `q2-lattice` | 8 to 5 | Salt, being made of charged particles, passes a current. A cold block is dark. | reward model: a salt crystal | `liner-heat` |
| `q3-distance` | 8 to 5 | More shared pairs crowd the atoms further apart. They sit closer and the well is deeper. | reward models: H2, N2, MgO crystal | `well-depth` |
| `q4-dots` | 8 to 5 | Every bond is one stick. Carbon dioxide needs a second pair between neighbours. | reward models: H2O, CO2, BF3 | none |
| `q5-resonance` | 8 to 3 | A drawing is the molecule. Ozone's drawn double and single bond measure alike. | reward model: ozone | none |
| `q6-shape` | 8 to 5 | Four arms lie flat like a plus sign. They leave the flat. | the hub was already solid; reward models: CO2, CH4, NH3, H2O | none |
| `q7-polarity` | 8 to 4 | Polar bonds make a polar molecule. Carbon dioxide has two and stays put (five molecules sorted). | molecule cards carry the solid molecule at 3D On | `field-swing` |
| `q8-hybrid` | 8 to 5 | Carbon bonds with its orbitals as they stand. Only two hydrogens take one. | reward model: four lobes, ethene, ethane | none |
| `q9-orbitals` | 8 to 3 | A gas is not magnetic. Oxygen is pulled. | none (a ladder is flat) | `magnet-pull` |
| `boss-warden` | 5 to 5 | Five new cases of the benches above (salts, HCN, ammonia, BF3, gases). | none | `warden-cut` |

What changed and why:

- **Predict stages** (`quests/unit03/_ligar.js` `predictStage`, `guess` cards in `kits/bonds.js`): a bench with only cards and a slot, no
  instrument; the next stage quotes the guess in its prompt and says in its reward whether the bench agreed (`engine/predict.js`).
- **Cut as repeats** (T7): formal charge, nitrate, carbonate, bond-order markers, sorts by lobes, the d-orbital stage, the five and six
  arm frames, the formula-unit and molecule-lifting stages, the squeezed-pair stage, the hotplate stage of two salts.
- **Re-pitched for ages 12 to 17** (T6): resonance keeps the ozone measurement; molecular orbitals keep the magnet and the ladder, whose
  rows read `HOLDS` and `PUSHES` until the last card earns "bonding" and "antibonding"; hybridization names `sp3` only on its card and
  the lobes read "lobe" on the bench.
- **Fetches** (U3): the seam chip (`q2-lattice`) and the sump stream (`q7-polarity`) each carried a copy of what the bench held, so both
  were cut and their field points removed from `three/ligar/stations.js`. Ligar now has no field stage; `verify:ligar` checks none is
  registered.
- **Miss messages and hints** (T4, U5): a refusal names what the table shows that disagrees, never why. `verify:learn` has a Ligar check
  for reasoning words and for the feature each bench teaches. Hint rung 1 names the controls (`Use the ...`); how they work is in the
  Tour (`table/tour-ligar.js`), which gives every Ligar instrument and piece words of its own (`verify:table` fails on a generic step).
- **3D** (U1): `engine/ligar-mol3d.js` stands each molecule card's molecule up on its tile, built from the same vectors the flat picture
  projects and swung as a whole by the field; reward cards carry `shape`, `crystal` and `lobes` models (`engine/model-parts-ligar.js`).
  Graphs, ladders and Lewis slates stay flat. `3D Off` draws the same cards with the flat picture.
- **Story**: six animations in `story/quest-story.js` (`unit03/...`), painted by `ui/story-scenes-ligar.js`.
- **Shared files touched, additively**: `kits/bonds.js` (`guess`), `kits/mo.js` (`plain`), `kits/domain.js` and `domain-field.js` (solid
  molecule cards), `table/tour.js`, `engine/model-parts.js`, `ui/model-viewer.js` (triple and fractional bonds), `engine/stage-story.js`,
  `ui/story-scenes.js`, `story/quest-story.js`, `tools/verify-learn.mjs`, `tools/verify-table.mjs`, `tools/verify-ligar.mjs`.
