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
