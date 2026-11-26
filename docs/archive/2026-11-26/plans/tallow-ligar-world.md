# Tallow (`unit01`) & Ligar (`unit03`) — World Specs and Build Records

This document consolidates the world specifications, 3D realism rebuilds, bench integration, and build records for:
- **Tallow (Unit 1):** Atoms, elements, compounds, isotopes, atomic mass, and the mole (`q1-grain` to `q6-weigh`, `boss-hopper`).
- **Ligar (Unit 3):** Chemical bonds, ionic lattices, alloys, molecular polarity, Lewis structures, and hybridization (`q1-joins` to `q9-orbitals`, `boss-warden`).

---

## 1. Tallow: 3D Realism, Diegesis & Physics
# Tallow in three dimensions — realism, diegesis, physics

**Status:** in flight. Started 2026-09-19.

The brief: craft Tallow and the quests played there as a hyper-realistic, freely
walkable first-person game; extend the same bar to the ship and Erebus. Copy the
product into 3D — **no player-facing string changes anywhere**. Preserve the
SCOURED PLATE look. Proper physics: no two objects may occupy the same space.

## Decisions taken before any code (answered by the user)

| Question | Answer |
|---|---|
| Scope | Tallow **+ ship + Erebus** |
| Quest frame | **Diegetic in-world panels** — the same strings on physical surfaces |
| Tier boundary | **Walking stays T4**; T3 and below keep the 2D screens untouched |
| Assets | **Procedural, in code** — no new binaries, no bake step |
| Erebus quest UI | **Also diegetic** (both roads) |
| Panel input | **Pointer released, raycast clicks** — [E] docks, cursor operates |
| Phone T4 | **Diegetic everywhere, no accommodation** |
| Latitude | **Rebuild where it helps**; navigation graph and site/pylon identities stay |

## Invariants that outrank the brief

1. **Not one player-facing string changes.** Prompts, hints, scans, briefings,
   reward cards, epilogue, labels — all verbatim. The diegetic panels re-home the
   existing DOM; they never re-author it.
2. **T3 and below are untouched.** Every quest completes exactly as it does today.
3. **The Learn track still pays no XP** — `verify:learn` must stay green.
4. **Grading is unchanged.** The frame still never sees an answer.
5. **`npm run verify` passes** at every checkpoint.

## Phases

- [x] P0 — Survey, decisions, plan
- [x] P1 — `materials/pbr-kit.js`: shared procedural PBR + greeble toolkit
- [x] P2 — `three/world-ui.js`: world-space diegetic panel system (CSS3D + WebGL housing)
- [x] P3 — `LearnFrame` diegetic mode (same API, same copy, on the bench).
      The instrument is now deployed onto the bench that already stands on
      Tallow rather than into a private scene, which meant widening both
      benches to 4.8 m so a four-station layout fits the plate, moving the lab
      column and rack clear of it, and boxing the bench colliders.
- [x] P4 — Erebus chamber console (`quest3d/console.js`): the stage deck moved
      onto the operator's desk, parented to the camera because the chamber's
      own controls orbit the sample.
- [x] P5 — Tallow realism pass. Crust rebuilt from `saltHardpan` with a detail
      normal below the repeat and a macro variation above it; every metal now
      comes from `platedMetal` at four weathering levels with full albedo /
      normal / roughness / metalness / AO; treadplate lab deck; faulted
      sedimentary cut face; greebles on the evaporators, the columns, the bench
      and the lean-to; services across the lab ceiling; two-layer dust.
- [x] P6 — Ship + Erebus realism pass. The Avalon's durasteel keeps its painted
      plate artwork but now carries normal / roughness / occlusion DERIVED from
      that image, so the light agrees with the picture; treadplate deck; a full
      set of services along the deckhead; one doorway per threshold instead of
      nine in a thicket. Erebus's basin floor is a real wind-worked ripple field
      instead of forty thousand random squares, and every pylon is built as
      hardware — bolted base, guys, insulator stack, service hatch, cable feed.
- [x] P7 — Physics, proved rather than declared. `tools/lib/dom-shim.mjs` lets a
      world be BUILT in Node; `tools/lib/overlap.mjs` measures every pair of
      separate objects in it. Wired into `verify:tallow` (Tallow) and
      `verify:ship` (the Avalon and Erebus). It found and fixed: a pipe bridge
      through a drum line, a conveyor through a pipe bridge, a container stacked
      across a hatch, a raceway through every deckhead frame, a tactical table
      skirt inside a doorway, and a crate inside a lean-to post.

## What the physics check is, precisely

Two objects may touch, may be bolted together and may be bedded into the ground.
They may not be drawn through each other. Parts INSIDE one object are exempt — a
gusset that merely touched the corner it braces would be holding nothing — so
the hull, the corridor services and each prop are each one object and the test
runs strictly between them. Ground surfaces (`phys: 'ground'`), the sky and
distant bodies (`phys: 'ambient'`) and decals (transparent) are exempt by kind.

Tolerance is 0.06 m: a bounding box is a loose fit around a rotated or round
body, and two adjacent props routinely share a few centimetres of empty box.
- [x] P5.1 — Playtest corrections (2026-09-19). First run on the flat turned up
      four things, all of which the fiction had been paying for:
      1. **q1 stage 2 could not be passed.** `checkResolved` recorded only the
         *selected* plate, but one dial magnifies the whole bench — so "inspect
         both crates" was unsatisfiable by looking. Resolution is now bench-wide.
      2. **The cursor was captured on every click.** Pointer lock is gone from
         the product: `FpsControls.requestPointerLock` is a documented no-op and
         looking around is left-drag everywhere. A teaching portal whose
         instruments are clicked cannot eat the pointer on the first click.
      3. **The sampler scope is not a built bench.** A microscope shows a
         *picture* at a magnification; built in 3D that reads as the sample
         inflating, which is not what matter does. `SampleScope` is now the
         drawn instrument on every tier, `instruments.BUILT_BENCHES` names the
         quests whose bench really is an object (`q2-core` only), and
         `learn-quest.js` decides from it whether the frame goes diegetic or
         stays a page over the flat. `SampleScope3D` is kept, whole.
      4. **The power control is a knob** (`engine/dial.js`), turned by drag,
         arrow keys or wheel — not a pair of stepper keys.
      Side effects worth knowing: a drawn bench has no scene, so nothing else
      would stand the walk down — `stage.setWalkSuspended()` does it, and
      `FpsControls.onKeyDown` now ignores keys aimed at a focused control.

## Technique notes

**Why CSS3D for the panels.** The quest modules hand the frame HTML strings.
Rasterising that into a canvas texture would mean re-implementing their layout,
which is exactly the "change the text" failure mode the brief forbids. A
`CSS3DRenderer` object transformed onto the panel plane keeps the DOM, the
handlers, the fonts and the 375 px rules intact, and a WebGL bezel/phosphor
housing built around it supplies the hardware. Text stays verbatim by
construction.


## Build cost

Procedural surfaces are per-pixel JavaScript and run once, when a place is
entered. Measured in Node behind the DOM shim (a browser is faster — its
`getImageData`/`putImageData` are memcpy rather than a JS loop):

| Place | before | after |
|---|---|---|
| the Avalon | 432 ms | ~350 ms |
| Tallow | 2927 ms | ~850 ms |
| Erebus | 1294 ms | ~580 ms |

Four changes got that, none of them visible:

1. **Ambient occlusion is computed at half resolution.** It describes where a
   surface shadows itself, not where its grain is, so 256 interpolated is
   identical to 512 and a quarter of the cost. It was the single most expensive
   pass in the kit.
2. **`platedMetal` computes wear and rust at half resolution.** Both are broad
   soft fields that are blurred immediately afterwards — paying full price for a
   signal you then deliberately soften is paying twice for nothing.
3. **`desertSand` buckets its lag gravel into a wrapped 12 x 12 grid.** Ninety
   stones tested against every pixel of two passes is forty-seven million
   distance computations; bucketed, a lookup touches one or two.
4. **Resolution is spent where the player's face goes.** The bench plate and the
   pylon mast stay at 512; drums read from ten metres across four repeats, and a
   deck repeated nine times, drop to 256 — where the repeat is already supplying
   the density that resolution would have.

## Tabletop and retirement update (2026-10-22)

- Every Tallow quest and the Salt Hopper boss are played on the Tabletop (`Table3D` with the atom, card and mass kits).
- `scope3d.js`, `corebench3d.js`, `catalogue3d.js`, and `assay3d.js` are retired (T7 of `bench-tabletop.md`).


---

## 2. Finishing Tallow, Building Ligar
# Finishing Tallow, building Ligar — the T3-and-below pass

> **Superseded in part (2026-09-23):** Ligar is now walkable ground at T4 and all
> four of its benches are built instruments — see `learn-track.md` and CLAUDE.md
> "Ligar". This file remains the record of the T3-and-below pass it describes.


**Scope of this pass: the GAMES.** Every quest below is built as a playable module
against `src/learn/quests/_template.js`, with its instrument drawn on canvas or
plate cards, its eight stages graded by pure functions, its reward cards, its
hint ladder and its five practice problems. T4 — the benches built as objects on
walkable ground — is a separate pass and is explicitly NOT in this one. At T4 the
new quests are worked as a page over the live world, which is the fallback
`screens/learn-quest.js` already takes for every Learn quest.

## Status

**TALLOW AND LIGAR ARE BOTH FINISHED** as games. All nine quests are built,
playable at T3 and below, and `npm run verify` is green. `unit02-molecules.js`
charts four quests, all `live`, all with modules.

| | Quest | Site | Instrument | State |
| --- | --- | --- | --- | --- |
| 1.1 | `unit01/q1-grain` The Grain of Things | Salvage Bench | sampler scope | shipped before this pass |
| 1.2 | `unit01/q2-core` The Inside of a Piece | Core Bench | core bench | shipped before this pass |
| 1.3 | `unit01/q3-catalogue` The Catalogue Numbers | Catalogue Vault | catalogue board (new) | **DONE** |
| 1.4 | `unit01/q4-ledger` The Buyer's Ledger | Tally Floor | core bench (reused) | **DONE** |
| 1.5 | `unit01/q5-assay` The Weight On The Card | Hopper Gantry | assay floor (new) | **DONE** |
| 2.1 | `unit02/q1-joins` What Holds | — | join bench (new) | **DONE** |
| 2.2 | `unit02/q2-lattice` Stone and Wire | — | join bench, slab plates | **DONE** |
| 2.3 | `unit02/q3-recipe` The Same Recipe | — | sampler scope (reused) | **DONE** |
| 2.4 | `unit02/q4-weigh` Counting By Weight | — | assay floor (reused) | **DONE** |

The Ligar column has no Site, and that is deliberate: **Ligar is not walkable
ground.** `worlds3d.js` still registers Tallow only and `BUILT_BENCHES` is still
`q1-grain` and `q2-core`, so all four Ligar quests draw as a page over whatever
is behind them, on every tier — the fallback `screens/learn-quest.js` has always
taken. Building the arches as a place is a separate pass.

## Why the order is what it is

The brief was "a fifth Tallow quest that introduces ions and isotopes and how to
count protons, neutrons and electrons", and "Ligar covers fixed proportions,
moles and molar mass, and ionic and covalent bonds". Tallow must not reach moles;
that belongs to Ligar.

Tallow now runs five benches, and the new quest — the ledger — sits at position
FOUR rather than five. That is a pedagogical call, not a slip. The assay floor
computes a weighted average over a hopper's isotopes, so it cannot be the bench
that first makes isotopes solid; the ledger has to come first. What the brief
asked for is that the content exists as one more bench on Tallow, and it does.

- `q3-catalogue` turns the scope's CAT codes into the periodic table. It is the
  reveal `q2-core`'s debrief already promised at Site 3, so it keeps its site.
- `q4-ledger` is the new bench. Proton, neutron and electron counts off one
  specimen; isotope notation; chemistry that follows the electrons and ignores
  the neutrons; charge from the needle; cations and anions; a shipment balanced
  to zero. It leaves the player able to describe any piece with three numbers,
  which is exactly what Ligar's first bench will need.
- `q5-assay` is the Tally-Floor idea rewritten off moles and onto **average
  atomic mass**: a hopper of one kind splits by weight, the bins are tallied, and
  the number on the catalogue card turns out to be the weighted average. AP Unit
  1 content, no mole in sight — and the module's header says so, so a later pass
  cannot quietly put one there.

Ligar's four benches are ordered the same way, by what each one needs to already
be true. `q1-joins` has to come first because everything after it rests on a bond
being a thing that fills an outer shell. `q2-lattice` follows immediately, while
the two bond types are fresh, and spends itself entirely on what each kind builds
— which is the only reason a student holding a piece of salvage cares which one
they have. `q3-recipe` can then ask why a compound has one recipe, because
`q1-joins` stage 8 already showed the counts leaving it no choice. `q4-weigh` is
last because the mole is only worth having once a recipe is a count you want and
a balance is the only instrument you have.

## New engines

Three, all content-free, all `.scope-plate` grid tenants so they inherit the
existing plate styling and every phone rule already written for it.

- `engine/catalogue.js` — the **catalogue board**. The one Learn instrument that
  is not drawn into an aperture: a catalogue is a card index, so it is built out
  of real plate elements. A drawer of cards and a board of slots; tap a card to
  read it, tap a slot to file it, tap a filed card to lift it out. **No drag** —
  a drag across a grid of 42 px cells is the one gesture a student on a phone
  cannot make reliably.
- `engine/assay.js` — the **assay floor**. A hopper tips down a chute past a
  deflector; a light piece is turned aside further than a heavy one, so each bin
  catches one weight and carries a tally. `planPour` is pure and the counts are
  the hopper's declaration, never a random draw, so the same hopper sorts the
  same way every time and a stage built on the tally is answerable. Written to be
  reused by Ligar `q4-weigh`.
- `engine/joinbench.js` — the **join bench**, Ligar's instrument and the only
  one that answers a question at two scales. A PAIR plate clamps two pieces face
  to face and presses them together, drawing their shells as rings with the light
  pieces on them; a SLAB plate holds a block of finished material to hit, heat,
  cool and put a current through. Everything it reports is derived by a pure
  function from the declaration — `planJoin` from the two pieces' shells and
  kinds, `planSlab` from a block's `build`, `conductionOf` from that build and
  the state the block is in. Only the melting point is simply told to it, because
  a temperature is a measurement. Two rules of the engine earned their place the
  hard way: a slab may be `sealed`, so a stage can ask the player to identify a
  material from how it BEHAVES rather than from a picture; and `cool()` exists
  because without it the furnace is a one-way door and a stage that wants a cold
  reading AND a molten one is unfinishable once the block has been melted.

`CoreBench` is reused unchanged by `q4-ledger`, with one additive change to the
engine: a specimen may now declare `casing: true`, meaning welded shut so that
**nothing** resolves in any view. `sealed` already meant "the outside will not
resolve" and `q2-core` stage 3 depends on the middle still being countable
through it, so the stronger statement needed its own flag rather than a change of
meaning.

## Rules this pass had to satisfy

Two rules landed in `CLAUDE.md` and `PRODUCT.md` while this was in flight, and
every quest in this pass — the three new Tallow benches and all four of Ligar —
is built to them:

- **Nothing is named without being explained.** Every stage that offers a control
  exports a legend for it through `toolNoteFor(controlId, stageNumber)`, drawn
  under the keys by `toolNotes()`. `q3-catalogue` carries legends for the two
  affordances that have no button at all — tapping a card, tapping a slot —
  because the rule is about what the player has to be told, not about what has a
  key. The core bench's views are named **Whole piece / The middle / Outside**
  under **View**.
- **A stage must be solvable by somebody who does not already know the answer.**
  The evidence is on the bench, not in hint rung three: `q4-ledger` stage 2 puts
  an OPEN reference beside the welded canister so the player can check for
  themselves that the code is the proton count and the mass number is protons
  plus neutrons; stage 3 shows the isotope and the reference with a visibly
  identical outside; stage 4 puts an open piece reading plus one next to the
  sealed one; stage 8 keeps the standard open on the plate. `q5-assay` stage 2
  runs two hoppers of different sizes so "the proportions are fixed" is two data
  points rather than an assertion.

  Ligar is held to the same test and it is where the rule cost the most design.
  `q1-joins` stage 2 asks why one pair would not hold, and its two wrong answers
  are refutable ON THE BENCH: "they were the same kind" is refuted by the pair of
  identical pieces that DID hold, and "they were too heavy" by the heaviest pair
  on the plate holding as well. `q2-lattice` stage 3 asks what a current needs,
  and the obvious wrong answer — heat — is refuted by the second block, which is
  molten, just as hot, and passes nothing. `q4-weigh` reaches the mole through
  stage 3, where three samples of exactly sixty pieces are weighed and come out in
  the ratio of their listed masses; stage 4 inverts that one sentence, and only
  then does a card say the word. A bench that opened by asserting 6.02 x 10^23
  would be checking, not teaching.

## Vocabulary schedules

Each new quest publishes a `VOCABULARY` table and `tools/verify-learn.mjs`
carries its withheld list, the way `q2-core` does. A word earned on an earlier
bench is a plain word from then on: `q3-catalogue` says "proton" and "shell"
freely, because `q2-core` taught them.

- `q3-catalogue`: atomic number 1, period 2, periodic 3, group 4, noble 5,
  metal / nonmetal / alkali / halogen 6.
- `q4-ledger`: mass number 1, cation 5, anion 6.
- `q5-assay`: abundance 2, average atomic mass and weighted average 4.
- `q1-joins`: bond 1, ionic and covalent 4, double bond and triple bond 6.
- `q2-lattice`: melting point 1, lattice and brittle 2, conduct 3.
- `q3-recipe`: fixed composition 1, percent composition 5, empirical formula 6.
- `q4-weigh`: formula mass 2, mole and Avogadro 4, molar 5.

**The law of definite proportions is never named**, on the brief's own
instruction. `q3-recipe` has the player count the same recipe out of three
samples from three places and out of a sample whose proportions are wrong, and a
name hung on that afterwards would add nothing the counting has not already
shown. Avogadro's number IS named, because it is a measured constant the player
has no other way to arrive at, and it lands on the card immediately after the
stage that measures out equal counts without counting anything.

## Work not in this pass

- **T4 instruments for Tallow sites 3–5.** The three sites are built as real
  places on the flat and their `built` flags are true, but their instruments are
  not built as objects: they draw as a page over the world. `BUILT_BENCHES` in
  `engine/instruments.js` is still `q1-grain` and `q2-core`.
- **Ligar as walkable ground.** The four benches are built and playable; the
  basalt arches are not a place you can walk. `worlds3d.js` still registers
  Tallow only, there is no `world-data/ligar.json`, and nothing in `verify:tallow`
  or `verify:bench` has a Ligar equivalent to run against. That is the next pass
  if Ligar is to match Tallow.
- **Units 3–10.** Charts only, unchanged.


---

## 3. Ligar, Finished (Benches, Quarry, Mine Chambers)
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


---

## 4. Ligar 3D Realism & Rebuild
# Ligar in three dimensions — the realism rebuild

**Status:** in flight. Started 2026-09-27.

**Status (2026-09-27): built.** Every item below is in, `npm run verify` passes,
and every Ligar shader (17 distinct programs in the built world) compiles under
glslang against three's own shader assembly (a scratch harness; not yet looked
at in a browser — the user playtests). Cost at T4: ~0.78M triangles, 516
meshes, 6 lights (sun, hemi, a pool of three, the forge), ~2.1 s to build in Node.

The brief (user): make Ligar feel like a real world out of a science-fiction
film rather than a toy generation — detail and shape — and rebuild whatever
needs rebuilding, rewiring every function back in.

## What made it read as a toy

1. **Every rock was one unit hexagonal cylinder**, instanced and scaled. Real
   columnar basalt is an irregular tessellation (four to seven sides, mostly
   five and six), packed tight with thin joints, broken into drums by
   cross-fractures, its tops chamfered by weather or snapped at a slant. A
   field of identical regular hexagons is the single loudest "procedural"
   tell in the world.
2. **The arches were a tube with prisms stuck on it**, a constant section on a
   semicircle. A natural arch is thick-footed and thin-crowned, lumpy, and in
   basalt its jointing fans: the columns stand perpendicular to the surface
   they cooled from, so the underside shows a honeycomb of column ends and the
   flank shows a fan of column lengths.
3. **The sky was a three-colour gradient with cardboard ridges** (flat
   `ShapeGeometry` silhouettes 260–310 m out), plain `THREE.Fog`, no
   environment map, so metal reflected nothing and distance read as grey.
4. **The ground was a 240 m plate** with a repeated Worley tile, ending in fog.
5. The frame-budget rules the other worlds follow were never applied: ~10
   `PointLight`s (one per luminaire), nothing baked, the shadow map re-drawn
   every frame.

## The rebuild (modules under `src/three/ligar/`)

- [x] `basalt.js` — the column kit. Voronoi tessellation from a relaxed
      jittered hex lattice (`columnCells`), and `prism()` extruding cells into
      merged, flat-shaded geometry with drums, chamfers, broken tops, vertex
      tone and per-column `partBoxes`: `columnRaft`, `columnWall`, `sawnSlab`,
      `radialRing`, `lintelBeam`, `basaltArch` (radial fan), `rubbleField`,
      `fallenColumn`.
- [x] `atmosphere.js` — one sky function (`lgSky` / `lgAir`): dusk, a low
      dust-reddened sun with a broad flare and no disc, the Belt of Venus and
      the earth's shadow on the anti-solar side, a broken altocumulus deck lit
      orange from below, crepuscular rays; far trap escarpments and a smoking
      shield volcano drawn IN the sky. Every material's fog replaced by aerial
      perspective toward it (`applyLigarAir`); PMREM environment; shadow box
      that follows the player in whole texels.
- [x] `terrain.js` — one analytic height field and one grid to an 880 m
      horizon (the walk unchanged inside 100 m), trap terraces rising in steps
      beyond it, the cut's outline written into the grid. The ground shader
      draws the column-top joints procedurally (non-repeating), dust in the
      joints, rain pools in the hollows reflecting the sunset, scoria yard,
      haul-road ruts, and columnar cliffs on every steep face.
- [x] `surfaces.js` — weathering applied once to everything built: ash on
      what faces up, damp dark feet, lichen on stone, iron weep under joints.
- [x] `vista.js` + `industry.js` — beyond the walk (`phys: 'ambient'`): six
      column spires 22–40 m tall, an 80 m natural arch on the western benches,
      the smelter (blast furnace, stoves, casthouse, four stacks, three
      smoking), a nine-pylon power line to the horizon, a derelict dragline.
- [x] `plant.js` — the props moved out of ligar.js and rebuilt from real
      structural parts (conveyors, carts, drums, hut, hauler, sheds, stacks,
      water tower, masts, pad, stakes).
- [x] Ground cover: cobbles and wind-stirred scrub in the ash and hollows.
- [x] `effects.js` — ash motes, grit streams, stack smoke, forge sparks.
- [x] `ligar.js` rewired: lamp pool, `bakeStatics`, shadow pacing, the old
      unit-hexagon builders deleted; sites, benches, colliders, anchors and
      the public contract unchanged.

## Invariants

- The public `LigarWorld` contract (`scene`, `data`, `colliders`,
  `terrainMesh`, `getTerrainHeight`, `benchAnchor`, `setBenchDeployed`,
  `setSiteComplete`, `update`, `dispose`) and every site position.
- `verify:ligar`, `verify:bench`, `verify:voyage` green: nothing overlaps,
  nothing buried, every bench reachable, no ledge in the walk.
- No player-facing string changes.


---

## 5. Tallow site rebuild (2026-11-19)

Branch `site/tallow`. Brief: Tallow's row in `docs/plans/world-distinction-plan.md` section 6, tier "rehouse only"
(section 7): the ground, the sky and the plant stay; the hosts and what stands round them are rebuilt so the benches
are inside the plant's own buildings. Before this run `world-shape.mjs` read Tallow `-2 R6 -3 -3 -1 -1` (1 of 6 housed).

### 5.1 The place

**In one sentence:** an abandoned salt refinery on a dead-flat pan, whose process line you walk from the landing pad
and whose buildings you go into: the evaporator hall at the belt's tail, the head house and bagging shed at its head,
the control house, the base house under a cracking tower, and the instrument room in the pit under the evaporators.

**The first ten seconds:** from the pad the pan runs flat to a mirror horizon in every direction; in front stand the
plant's sheds and the evaporator row, the belt running on its stand between two clad buildings, the towers behind.
No bench is in sight: every plate is behind a wall.

### 5.2 The signature

| | Tallow |
| :--- | :--- |
| Landform | Dead-flat salt pan to a mirror horizon; one excavated pit (kept) |
| Walk shape | Along the process line, outdoors between free-standing buildings 20 to 50 m apart: pad, belt tail, pit, control house, tower, belt head (kept) |
| Bench housing | Inside the plant's own buildings, each a different construction: a tall clad portal-frame hall (evaporator hall), a block house with a slab roof (control house), a lean-to on a block plinth against a column's foot (tower base house), a tall gabled head house and the lower lean-to bagging shed off its side (one shed, two rooms), the roofed pit |
| Light | White high-altitude glare, ice halo (kept); indoors under the cover mask, sodium lamps from the pool |

Against the other rows: no other world is flat (every other landform has relief or no ground); no other walk is
outdoors between buildings that stand apart on open ground. The nearest housing rows are Kettle (one building the size
of the site, the walk inside it) and Quicklight (bunkers, a reactor's skirt and a control block packed under pipe racks
on two lava flows): Tallow's buildings stand alone on the pan, the walk between them is in the open, and they are
sheds of sheet and block, not bunkers or a foundry. The row is unchanged except that it names five places for six
benches: the bagging shed holds two rooms (the head house, where the belt delivers, and the bagging shed beside it).

### 5.3 The plan (world metres; +x east, -z north; the spawn looks north)

- Extent of the walk: the pan inside the props' keep, about x -50 to 66, z -66 to 46. No high ground; the pan is
  closed only at the pit's rim (kerb colliders, kept) and by the buildings' walls.
- Levels: the pan at 0.0 to 0.15 m; building floors are level slabs at the highest crust under each (0.04 to 0.17 m);
  the pit floor at -5.6 m, reached down the stair ramp (x -6.6 to -1.4, z -22 to -31).
- Pad (34, 42); spawn (0, 1.6, 44) looking at (0, 1.6, 20). The Hopper's ground: (0, 30), radius 9, with the
  corridor x -5 to 5, z 28 to 46 (kept, `BOSS_ARENA_SPOTS.hopper` unchanged).
- The buildings (outer faces, world AABB):
  - Evaporator hall (site-1): x 10.2 to 25.6, z -3.8 to 11.8; door in the east wall, z 1.8 to 6.2; the belt leaves
    through a slot in the west wall, z 3.1 to 5.7.
  - Head house (site-5): x -14.49 to -2.8, z 2.2 to 17.5; door in the east gable, z 11.8 to 15.8; the belt comes in
    through a slot in the same gable. Its west wall is open at the back (z 2.4 to 7.0, up to 5 m) where the line runs
    on into the bagging shed.
  - Bagging shed (site-6): x -26.8 to -14.49, z 2.2 to 17.5; dock door in the south wall, x -25.7 to -21.7.
  - Control house (site-3): x 29.0 to 43.0, z -26.6 to -10.4; door in the west wall, z -15.6 to -13.4.
  - Tower base house (site-4): x 24.8 to 37.2, z -56.6 to -44.4; door in the south wall, x 26.2 to 29.2.
  - The pit (site-2): kept as it is (room x -22 to 14, z -46 to -31, roof at -0.85 m).
- Route, bench order: spawn (0, 44) south-east past the pad to the evaporator hall's east door (26, 4) and in to
  Bench 1 (22, 4); out, north-west past the evaporator row's gap to the stair head (-4, -21), down to Bench 2
  (-4, -4, -38); back up, east to the control house's west door (29, -14.5) and in to Bench 3 (36, -13); out, north
  through the gap at x 21 to 26 in the evaporator row, to the base house's door (27.7, -44) and in to Bench 4
  (31, -47); back south the length of the site to the head house's east door (-3, 13.8) and in to Bench 5
  (-8.69, 14); through the bagging shed's dock door (-23.7, 17.5) and in to Bench 6 (-20.09, 14). The guide's route
  goes through each door (`tallow/hall-plan.js` `routeTo`).

### 5.4 The section

Spawn 0.0 m, pan 0.0 to 0.15 m, evaporator hall floor 0.17 m, stair head 0.1 m, down the ramp (grade 1 in 1.6) to
the pit floor -5.6 m, up again, control house floor 0.13 m, tower base house 0.09 m, head house and bagging shed
0.14 m. Bench ground spans 5.8 m (the pit). The row's landform is flatness, so the levels are the buildings': room
heights 4.9 m (control house) to 10.4 m (head house's ridge), and the pit 5.6 m down.

### 5.5 The benches

**Bench 1, q1-grain (Atoms; one kind or two; count the elements): the evaporator hall.** The first solid the plant
makes is here: brine boils down in the crystalliser and the salt it drops lands on the belt's tail, where the sample
point cuts a sample from the stream. A grain of what was dissolved is the right first thing to zoom into. The hall is
a steel portal frame clad in profiled sheet, 15.2 by 15 m inside, eaves 9.5 m, ridge 10.4 m; closed on all four sides,
roofed. The player comes round from the pad to its east door (4.4 m wide, the roller shutter rolled up) and sees the
plate straight ahead under the crystalliser's body, the sampler to the left, the retained-sample rack to the right,
the belt running out through the slot in the far wall. Behind and beside the plate: the crystalliser (a 2.4 m vessel
on legs 4.6 m high with its conical salt leg over a screw conveyor that spouts onto the belt's tail hood), its heater
and circulation loop, the vapour main out through the gable, the cross-cut sampler, the rack, the sampling log board. Lamps: three caged sodium luminaires hung from the tie beams.

**Bench 2, q2-core (inside an atom): the instrument room in the pit.** Kept as built: an excavation 5.6 m down under
the evaporator row, roofed, entered down a stair ramp; the beam column and the rack beside the plate. Added: the cover
mask over the room, so it is lit by its four lamps and not by the sky.

**Bench 3, q3-catalogue (the periodic table; periods; groups): the control house.** The house where the plant was
read and recorded: its record wall of cards is the catalogue. A block house with a concrete slab roof, 13.6 by 15.8 m
inside, 4.9 m to the slab; closed on all four sides. The player comes in by a door in its west wall and turns right
to the desk; behind the plate is the glazed front of the relay room with the record wall of cards on its solid bay;
windows in the east wall. Lamps: two luminaires on drop rods from the slab.

**Bench 4, q4-ledger (isotopes and ions; three numbers off one atom): the tower base house.** A column separates by
mass what goes into it, which is what the bench's instrument does to isotopes. A lean-to on a 1.2 m block plinth with
profiled sheet above, built against the foot of the cracking tower: 12 by 11.8 m inside, the roof rising from 5.2 m at
the door to 6.6 m at the tower; closed on all four sides. The player enters by the double door in the south wall and
sees the plate in front of the sample-cooler skid, the draw-off line coming in through the back wall from the column.
Lamps: two luminaires under the purlins.

**Bench 5, q5-assay (sorted by mass; where the atoms balance; the weighted average): the head house.** The belt ends
here: its head pulley throws the salt into the weigh hopper hung over the bench, which is where a mixture is weighed
by parts. A tall gabled steel shed, 11.3 by 14.9 m inside, eaves 9.2 m, ridge 10 m; closed on the north, east and
south, and on the west by the wall it shares with the bagging shed (open at its back only where the line runs
through). The player follows the belt from the evaporator hall to its east gable, enters by the door beside the belt's
slot and turns left to the plate under the hopper. Lamps: three luminaires, one under the belt head.

**Bench 6, q6-weigh (formula mass; the scale; the mole): the bagging shed.** Where salt is counted into sacks by
weight. A lean-to off the head house's west wall, 12.1 by 14.9 m inside, the roof falling from 7 m to 5.6 m; closed on
all four sides. The player enters by the dock door in its south wall (the loadout and the hauler are outside it) and
sees the plate in front of the line: the transfer belt from the hopper, the bucket elevator, the bagging bin over the
platform scale, the roller conveyor to the pallet. Lamps: two luminaires. No two of these rooms share a construction,
a size or a way in.

### 5.6 How Tallow differs from each other world

- Lanternfall: Tallow is dry and flat in glare; Lanternfall is ice, a lake and a glacier in polar night.
- Ligar: Ligar is hills and a quarry cut with mine drifts at dusk; Tallow has no hill and no mine, only sheds on a flat.
- Bellows: Bellows has no ground, decks over a cloud sea; Tallow's buildings stand on a pan to the horizon.
- Ember Reach: Ember is a caldera wall stepping down to lava with a switchback road; Tallow has no slope at all.
- Mirrowen: Mirrowen is quays, water and hulls; Tallow has no water you can see, only mirror flats on the crust.
- Kettle: Kettle is one building you walk inside; Tallow is many buildings you walk between in the open.
- Teeter: Teeter is a hillside of salt terraces and a stair; Tallow's salt is a flat pan with no terrace.
- Verdigris: Verdigris is a drowned fort in reeds on a boardwalk; Tallow is dry, open, and walked on the crust.
- Brinewire: Brinewire is a dam wall with a 12 m drop; Tallow has no wall but its sheds and no drop but the pit.
- Quicklight: Quicklight is a refinery packed into alleys on lava under a storm; Tallow's plant stands spread out on a
  flat in white glare, its buildings 20 to 50 m apart.
- Lodestone: Lodestone is a slot canyon you walk down; Tallow is the open opposite, the horizon in every direction.
- Thornmere: Thornmere is tar mounds and dead trees; Tallow has no tree, no mound.
- Cinder Halo: Cinder Halo is craters under a ring; Tallow is a pan without a hollow but its one dug pit.

### 5.7 The far country

Kept (`tallow/vista.js`): the rock islands standing out of the pan, the far plant and the stranded machines, the
ranges drawn in the sky, the pale world low in the north-east. The pan's mirror horizon is the landmark no other
world has.

### 5.8 The numbers held

- `world-shape.mjs`: 6 of 6 housed (R4 or better; target R6+), bench ground span at least 5.7 m, no shared coordinates.
- Plates in view from the spawn: at most two; target none.
- `perf-worlds.mjs` at T4: at most 900k triangles and 566 draws (before: 789k and 328). The new halls are clad in a
  coarse trapezoidal profile (four vertices a rib) to stay inside the triangle budget.

### 5.9 Kept, rebuilt, archived

- Kept: `tallow/atmosphere.js`, `terrain.js`, `surfaces.js`, `plant.js`, `hauler.js`, `vista.js`, `effects.js`,
  `kit.js`; the pit (`initSublevel`); every site id, quest id, label, stage, `built` flag and bench position.
- New: `tallow/hall-plan.js` (pure data: the buildings, doors, slots, floors, colliders, cover boxes, the route) and
  `tallow/halls.js` (the buildings, built into each host).
- Rebuilt: `tallow/stations.js` (hosts lose their outdoor aprons, masts and veranda; the control house becomes the
  whole house; the tower deck is cut to fit its house; the crystalliser added), `tallow.js` (floors, cover mask,
  routeTo, hall colliders), `tools/gen-tallow-layout.mjs` (halls as keep-outs; loose crate stacks removed),
  `tools/verify-tallow.mjs` (shape checks added).
- Archived to `archive/2026-11-19/site-tallow/`: the old `stations.js`, `gen-tallow-layout.mjs` and
  `verify-tallow.mjs`.

### 5.10 Build record (2026-11-19)

**What was built.** `tallow/hall-plan.js` declares five buildings in their sites' host frames and derives everything
else from them; `tallow/halls.js` builds each into its host's group (`tallow.js` `initHosts`), so a room and the
machinery in it are one object for the overlap rule. The hosts lost their outdoor aprons and lamp masts; the control
house's builder became the relay room inside the house (its veranda is gone, its walls rise to the house's slab);
the tower deck's grate was cut to the house's back wall and its draw-off line is a named group that runs in through
it; the evaporator hall gained the crystalliser, its heater and loop, a vapour main out through the gable and a
screw conveyor to the belt's tail hood. Inside every building's slab the height field returns the building's floor
(`initHallFloors`: the highest crust under the slab plus 2 cm; the head house and bagging shed share 0.138 m). The
cover mask (`lib/cover.js` `makeCover`, 10 boxes: the pit and nine for the buildings, two under each pitched roof)
is applied after the salt and air patches. 18 pooled lamps, two lights. `routeTo` gives the voyage's guide the door
waypoints and walks each blocked leg round on a 1 m grid. The generator places nothing loose (the eight crate stacks
are gone), keeps each building and 3 m outside each door clear, and draws the trodden paths door to door (16
segments, the ground shader's limit).

**Where it parted from the spec.** (1) The evaporator hall's eaves went from 8 to 9.5 m: the belt's tail is 2 m up
and its tail hood 3.7 m, so the crystalliser had to stand higher to discharge over it. (2) The chute became a screw
conveyor: a gravity chute over that distance would have been too shallow to run. Its open end stops over the tail
hood's edge, because a body over the belt itself meets the hood. (3) The head house's east wall moved out 0.1 m to
-2.8 so the room holds the 11.2 m minimum. (4) The head house's third lamp moved twice: under the belt head it stood
in the belt, and the belt's line crosses the whole room at 5 to 8 m, so it hangs south of it. (5) Colliders were
added that the old world lacked, found by the single-floor check: under the belt's tail for the last 6.5 m (its
underside is below 2.4 m), round the pad's blast walls and windsock mast (from their part boxes), and on the pit's
gauge board. (6) No tag was stencilled on the crystalliser: a new in-world string is a player-facing string.

**Before and after.**

| | Before | After |
| :--- | :--- | :--- |
| `world-shape.mjs` | -5.60 to 0.13 m, relief 5.75 m, housed 1/6 (`-2 R6 -3 -3 -1 -1`) | -5.60 to 0.17 m, relief 5.77 m, housed 6/6 (`R7 R6 R7 R7 R7 R7`) |
| `perf-worlds.mjs tallow` (T4) | 328 draws, 789k triangles, 150 materials, 737 ms build | 317 draws, 798k triangles, 148 materials, 783 ms build |
| `perf-worlds.mjs ligar` | 566 draws, 867k triangles | 566 draws, 867k triangles (unchanged) |
| Plates in view from the spawn | not measured | none |
| `perf-bench-rest.mjs` | | 687 of 692 deployed stages rest; all 46 of Tallow's do (the five that do not are other units' tables) |

**Checks (2026-11-19, on `site/tallow`).** Green, each run as its own script: `verify:tallow` (132 checks before
the route legs were added; every check of the archived script kept), `verify:bench`, `verify:arena`, `verify:voyage`,
`verify:learn`, `verify:table`, `verify:docs`, and every other world's: `verify:lanternfall`, `verify:ligar`,
`verify:bellows`, `verify:ember`, `verify:mirrowen`, `verify:kettle`, `verify:teeter`, `verify:verdigris`,
`verify:brinewire`, `verify:quicklight`, `verify:lodestone`, `verify:thornmere`, `verify:cinderhalo`; also
`verify:normals`, `verify:sync`, `verify:story`, `verify:flows`, `verify:geometry`. `node tools/glsl-check.mjs tallow`:
9 patched programs compile with the cover mask on. `npm run build` succeeds (`dist/` outside `assets/` unchanged).
`tools/bay-legacy.json` is untouched. Shared code (`lib/`, `bench-bay.js`, `voyage.js`, `boss-arena.js`) is unchanged.

**Archived.** `archive/2026-11-19/site-tallow/`: the old `stations.js`, `gen-tallow-layout.mjs` and `verify-tallow.mjs`
(each replaced in place), with a README.

**Still weak.** The guide's walk-round ignores height (it plans on the flat grid, which is right on a pan and in the
pit, where the rim's colliders leave the stair the only way down). The pan's crust inside a building is hidden under
the slab but the terrain mesh still runs under it. The rooms of the bagging shed share their back third, where the
line runs from one into the other; they are two rooms at the plate and one building behind it. The outdoor
evaporator row and the crystalliser make two kinds of evaporator; the plant is now honest about it (pre-evaporators
outside, the crystalliser indoors) but no sign says so, and none should. Nothing was seen in a browser.

### 5.11 The owner's viewing list

1. **The landing: the spawn (0, 44), facing north.** The pan flat to the horizon; ahead and to the left the long
   south wall of the bagging shed and head house (the dock door at its west end), ahead and to the right the
   evaporator hall's west gable with the belt running out of its slot up to the head house's east gable; the
   evaporator row and the towers behind. *Fails if* any bench plate is in sight, or the belt passes through solid wall.
2. **Outside the evaporator hall's east door, (27, 4), facing west: the first sight of Bench 1.** Through the 4.4 m
   door, the plate straight ahead under the crystalliser's body, the sampler to its left, the sample rack to its right,
   the belt leaving through the far wall. The inside is darker than the pan and lit by three hanging lamps. *Fails if*
   the hall's inside is as bright as the pan outside, or anything stands in the doorway.
3. **At Bench 1's plate, leaning in.** Behind the plate: the crystalliser's legs and cone, the screw trough over the
   belt's tail, the heater to the left; the roof steel 9.5 m up. *Fails if* the lean-in view is a wall, the sky, or a
   pipe across the plate.
4. **At the stair head (-4, -21), looking down, then at Bench 2's plate: the lowest ground (-5.6 m).** The ramp
   down into the instrument room under the evaporators; the room under its roof is lit by its lamps, not the sky.
   *Fails if* the room is bright as day on a phone.
5. **At the control house's west door (27.5, -14.5), facing east, then at Bench 3's plate.** A low block house under
   a slab; inside, turn right to the desk; behind the plate the relay room's glass and the card wall; daylight only
   through the east and south windows. *Fails if* the door is tight to walk through, or sun lies on the floor.
6. **In the gap in the evaporator row, (24, -40), facing north: the tower base house.** The lean-to against the
   cracking tower's foot, the column rising behind its roof, the guy wires coming down to either side of it. *Fails
   if* a guy wire passes through the roof or a wall.
7. **At Bench 4's plate, facing north.** The sample-cooler skid behind the plate, the draw-off line coming in
   through the back wall from the column, the roof rising from 5.2 m at the door to 6.6 m at the back. *Fails if*
   the room reads as a shed on its own rather than the foot of the tower.
8. **Walking the belt from the evaporator hall to the head house's east door, (-1.3, 13.8).** The belt overhead,
   rising from its slot in one building to its slot in the other at about 5 to 8 m; you walk under it only where it
   is above 2.4 m. *Fails if* the belt clips either wall, or you can walk into its low tail.
9. **At Bench 5's plate, facing north: the tallest room (ridge 10 m).** The weigh hopper hung under the belt's head,
   the belt crossing the room high at the back, the bagging line running out of the room's back-left corner into the
   next. *Fails if* a lamp or the hopper is drawn through the belt.
10. **At the bagging shed's dock door, (-23.7, 19), facing north, then at Bench 6's plate.** A lower lean-to, its
    roof falling to the west; the scale, the elevator and the pallet behind the plate; the loadout and the hauler
    behind you. *Fails if* the shed's roof meets the head house's wall with a gap of sky, or the counted sack's stand
    behind the plate cannot be walked to.
11. **The boss's ground, (0, 30).** Open level pan between the shed and the spawn, the Hopper in view, nothing
    standing on it. *Fails if* anything of the buildings or their door aprons is on that ground.
12. **The highest ground.** There is none to climb: the pan, the floors (0.09 to 0.17 m) and the pad are one level,
    by the row's design. *Fails if* a roof or wall top can be stood on.
