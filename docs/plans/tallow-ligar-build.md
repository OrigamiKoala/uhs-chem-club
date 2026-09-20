# Finishing Tallow, building Ligar — the T3-and-below pass

**Scope of this pass: the GAMES.** Every quest below is built as a playable module
against `src/learn/quests/_template.js`, with its instrument drawn on canvas or
plate cards, its eight stages graded by pure functions, its reward cards, its
hint ladder and its five practice problems. T4 — the benches built as objects on
walkable ground — is a separate pass and is explicitly NOT in this one. At T4 the
new quests are worked as a page over the live world, which is the supported
fallback `screens/learn-quest.js` already takes for every Learn quest.

## Status

| | Quest | Site | Instrument | State |
| --- | --- | --- | --- | --- |
| 1.1 | `unit01/q1-grain` The Grain of Things | Salvage Bench | sampler scope | shipped before this pass |
| 1.2 | `unit01/q2-core` The Inside of a Piece | Core Bench | core bench | shipped before this pass |
| 1.3 | `unit01/q3-catalogue` The Catalogue Numbers | Catalogue Vault | catalogue board (new) | DONE |
| 1.4 | `unit01/q4-ledger` The Buyer's Ledger | Tally Floor | core bench (reused) | DONE |
| 1.5 | `unit01/q5-assay` The Weight On The Card | Hopper Gantry (new site) | assay floor (new) | DONE |
| 2.1 | `unit02/q1-joins` What Holds | — | join bench (new) | DONE |
| 2.2 | `unit02/q2-lattice` Stone and Wire | — | join bench | DONE |
| 2.3 | `unit02/q3-recipe` The Same Recipe | — | sampler scope (reused) | DONE |
| 2.4 | `unit02/q4-weigh` Counting By Weight | — | assay floor (reused) | DONE |

## Why the order is what it is

The user's brief was "a fifth Tallow quest that introduces ions and isotopes and
how to count protons, neutrons and electrons", and "Ligar covers fixed
proportions, moles and molar mass, and ionic and covalent bonds". Tallow must not
reach moles; that belongs to Ligar.

Tallow now runs five benches, and the new quest — the ledger — sits at position
FOUR rather than five. That is a pedagogical call, not a slip. The assay floor
computes a weighted average over a hopper's isotopes, so it cannot be the bench
that first makes isotopes solid; the ledger has to come first. What the brief
asked for is that the content exists as one more bench on Tallow, and it does.

- `q3-catalogue` turns the scope's CAT codes into the periodic table. It is the
  reveal `q2-core`'s debrief already promised at Site 3, so it keeps its site.
- `q4-ledger` is the new bench. Proton, neutron and electron counts off one
  specimen; isotope notation; charge from the needle; cations and anions; a
  shipment balanced to zero. It leaves the player able to describe any piece with
  three numbers, which is exactly what Ligar's first bench needs.
- `q5-assay` is the Tally-Floor idea rewritten off moles and onto **average
  atomic mass**: a hopper of one kind splits by weight, the bins are tallied, and
  the number on the catalogue card turns out to be the weighted average. AP Unit
  1 content, no mole in sight.

Ligar's four benches then run: how a join forms (`q1-joins`), what each kind of
join builds and how it behaves (`q2-lattice`), fixed and whole-number
proportions (`q3-recipe`, the law of definite and multiple proportions, never
named), and counting by weighing (`q4-weigh`: the mole, Avogadro's number and
molar mass).

## New engines

Three, all content-free, all `.scope-plate` grid tenants so they inherit the
existing plate styling and every phone rule already written for it.

- `engine/catalogue.js` — the **catalogue board**. A drawer of cards and a board
  of slots. Tap a card to read it, tap a slot to file it. No drag: a two-tap
  place is the only version of this that works at 375 px.
- `engine/assay.js` — the **assay floor**. A hopper pours over a belt, a
  separator splits the stream by weight into bins, a tally counts each bin and a
  pan balance weighs a scoop. Used by Tallow `q5-assay` and Ligar `q4-weigh`.
- `engine/joinbench.js` — the **join bench**. Two mounts, a piece in each with
  its shells drawn, a coupler that attempts the join and shows what happened, and
  a property rig that heats, strikes and tests conduction.

`CoreBench` and `SampleScope` are reused unchanged by `q4-ledger` and
`q3-recipe` respectively.

## Vocabulary schedules

Every new quest publishes a `VOCABULARY` table and `tools/verify-learn.mjs`
carries its withheld list, the way `q2-core` does. A word earned on an earlier
bench is a plain word from then on: `q3-catalogue` says "proton" and "shell"
freely, because `q2-core` taught them.

## Work not in this pass

- **T4.** The three new sites are marked built in `tallow.json` and stand as real
  places on the flat, but their instruments are not built as objects: they draw
  as a page over the world. `BUILT_BENCHES` in `engine/instruments.js` is still
  `q1-grain` and `q2-core`.
- **Ligar as walkable ground.** Ligar is charted, not built; `worlds3d.js` still
  registers Tallow only.
