# Finishing Tallow, building Ligar — the T3-and-below pass

**Scope of this pass: the GAMES.** Every quest below is built as a playable module
against `src/learn/quests/_template.js`, with its instrument drawn on canvas or
plate cards, its eight stages graded by pure functions, its reward cards, its
hint ladder and its five practice problems. T4 — the benches built as objects on
walkable ground — is a separate pass and is explicitly NOT in this one. At T4 the
new quests are worked as a page over the live world, which is the fallback
`screens/learn-quest.js` already takes for every Learn quest.

## Status

**TALLOW IS FINISHED. LIGAR IS NOT STARTED** — the pass was stopped after Tallow
at the user's request, before any Ligar module was written. `unit02-molecules.js`
is back to its charted state: four quests, all `draft`, no modules. Nothing in
the Ligar column below exists yet.

| | Quest | Site | Instrument | State |
| --- | --- | --- | --- | --- |
| 1.1 | `unit01/q1-grain` The Grain of Things | Salvage Bench | sampler scope | shipped before this pass |
| 1.2 | `unit01/q2-core` The Inside of a Piece | Core Bench | core bench | shipped before this pass |
| 1.3 | `unit01/q3-catalogue` The Catalogue Numbers | Catalogue Vault | catalogue board (new) | **DONE** |
| 1.4 | `unit01/q4-ledger` The Buyer's Ledger | Tally Floor | core bench (reused) | **DONE** |
| 1.5 | `unit01/q5-assay` The Weight On The Card | Hopper Gantry | assay floor (new) | **DONE** |
| 2.1 | `unit02/q1-joins` What Holds | — | join bench (to write) | not started |
| 2.2 | `unit02/q2-lattice` Stone and Wire | — | join bench | not started |
| 2.3 | `unit02/q3-recipe` The Same Recipe | — | sampler scope (reuse) | not started |
| 2.4 | `unit02/q4-weigh` Counting By Weight | — | assay floor (reuse) | not started |

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

## New engines

Two, both content-free, both `.scope-plate` grid tenants so they inherit the
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

`CoreBench` is reused unchanged by `q4-ledger`, with one additive change to the
engine: a specimen may now declare `casing: true`, meaning welded shut so that
**nothing** resolves in any view. `sealed` already meant "the outside will not
resolve" and `q2-core` stage 3 depends on the middle still being countable
through it, so the stronger statement needed its own flag rather than a change of
meaning.

## Rules this pass had to satisfy

Two rules landed in `CLAUDE.md` and `PRODUCT.md` while this was in flight, and
all three new quests are built to them:

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

## Vocabulary schedules

Each new quest publishes a `VOCABULARY` table and `tools/verify-learn.mjs`
carries its withheld list, the way `q2-core` does. A word earned on an earlier
bench is a plain word from then on: `q3-catalogue` says "proton" and "shell"
freely, because `q2-core` taught them.

- `q3-catalogue`: atomic number 1, period 2, periodic 3, group 4, noble 5,
  metal / nonmetal / alkali / halogen 6.
- `q4-ledger`: mass number 1, cation 5, anion 6.
- `q5-assay`: abundance 2, average atomic mass and weighted average 4.

## Work not in this pass

- **Ligar.** Nothing written. The design above stands and the assay floor was
  built with `q4-weigh` in mind, but `unit02-molecules.js` charts four drafts and
  no module exists.
- **T4 instruments for sites 3–5.** The three new sites are built as real places
  on the flat and their `built` flags are true, but their instruments are not
  built as objects: they draw as a page over the world. `BUILT_BENCHES` in
  `engine/instruments.js` is still `q1-grain` and `q2-core`.
- **Ligar as walkable ground.** Charted, not built; `worlds3d.js` still registers
  Tallow only.
