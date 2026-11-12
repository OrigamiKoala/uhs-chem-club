# Tallow (`unit01`): atoms, elements, the mole

Read with `docs/teaching-pass/BRIEF.md` and `PATTERNS.md`. The notes below were written on 2026-11-11 from the stage text and the earlier records, without playing the world. Treat every item as a lead to confirm against the source, and expect to find more.

- **Session:** World pass (Sonnet). Run after the Ligar exemplar (shared `atoms.js`) and before Kettle.
- **Earlier teaching pass:** none
- **Quests:** `src/learn/quests/unit01/`. Chart `src/learn/worlds/unit01-atoms.js`. Bank `src/learn/bank/unit01.json`. No glossary: create `src/learn/glossary/tallow.js`. Checks: `verify:tallow`.
- **Kits:** `atoms.js`, `mass.js`, `cards.js` in `src/learn/table/kits/`. `atoms.js` also serves Ligar and Kettle; `mass.js` also serves Kettle.
- **Report on 2026-11-11** (`node tools/teaching-report.mjs unit01 --totals`): 55 stages in 7 modules | briefing 1 | typed 10 (no instrument 0) | cards only 11 | reward long 12 | operation prompt 6 | hint 3 move/arithmetic 12 | vague 32 | register 2 | motive 2

## What is known to be wrong

- **Stand-in words everywhere** (32 of 55 stages): *shots*, *specks*, *needle* (it is a charge meter), *bins*, *piles*, *fulcrum* (it is a mass spectrometer, and the student is never told), *cutter*, *stamp*, *recipe*, and *weight* where *mass* is meant ("atoms of weight 20"). Hints say "crate" for a piece labelled "drum" (`q6`).
- **Oversimplified rules a later world has to undo.** `q3` stage 5: "Atoms are happy when they have a full outer shell". `q1` stage 4: "A lone atom cannot be divided", one quest before the student builds atoms from protons and electrons (say "by ordinary chemical means"). `q2` stage 5: shells hold "2, 8, 8" with no "for the first 18 elements". `q2` stage 6: "one valence electron is given away, seven takes one" as a rule with no reason.
- **Hints that give the arithmetic.** `q6` stage 1 rung 3: "Add 12.0 + (4 x 1.0) and type the total mass". Stage 3: "72 divided by 18 gives the number of portions". `q1` stage 3 rung 2 states both masses.
- **Readouts that print the answer.** `q1` stage 3 (a reader prints each atom's name and mass); `q3` stages 5 and 6 ("Test Card" reports what each element does).
- **Eleven card-only stages** with no instrument, most in `q2`, `q3` and `q4`.

## Bench notes

- `q1-grain` (8): element, compound, mixture. Keep the idea; rename the tools; stage 4 gets its honest clause. This bench owns compound against mixture for the whole track (Kettle no longer repeats it).
- `q2-core` (8): inside the atom. Stage 3's reward introduces protons, neutrons and electrons in one card, and electrons were not in the experiment. Teach each particle from what the bench shows (charged plates bend charged particles; the foil experiment shows a small dense nucleus), one per stage, with briefings. Stage 6's valence rule needs its reason (attraction to the nucleus), not a slogan.
- `q3-catalogue` (7): the periodic table. Seven card-only or card-printing stages. The repeat in properties should be found by the student from something the bench shows (outer electrons drawn on each card), not from a "Test Card" verdict. Remove "happy" and "trade".
- `q4-ledger` (8): isotopes, ions, the three numbers. *Needle* becomes charge meter. Several long rewards carry the lesson.
- `q5-assay` (11): the weighted average. The owner asked for most of this quest to go. Cut to about five stages: the mass spectrometer named and explained in a briefing, the balance point of two isotope piles seen without arithmetic, one worked case, one typed case, reading a real spectrum.
- `q6-weigh` (8): the mole, discovered by weighing (the world's core idea; keep it). Six typed stages: follow the calculation pattern (see, worked case, then type). Fix the hints. Percent composition and empirical formula live here for the whole track.
- `boss-hopper` (5): re-test the benches; rename; check hints.

## Owner requests to check against the source

`docs/feedback.md` section "Tallow" (2026-10-09) and `docs/feedback-11-01.md` section "Tallow". Read both sections and check each item against the source; do not assume an item marked done is done. Recurring complaints: tools that need learning (cutter, shaker, needle, moving detector), busywork sorts, unclear questions.

## Traps

`verify:learn` hard-codes stage indices for some Tallow quests. `tools/table-legacy.json` and `tools/layout-legacy.json` list legacy exceptions; do not add to them.

## Record

Filled by the plan session (if any) and the pass session. Keep it current after every bench.

### Bench-level sequence

(Per bench: the idea it teaches; what is cut, merged, moved or added; the terms it introduces with their glosses.)

### Plan rows

(One table per bench, in play order.)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |

### Structural changes

### Chemistry corrections

### Still weak

(Ordered by how likely a student is to get lost. For each: the stage, what is weak, why it was not fixed.)

### For the owner to look at

(Stages whose table was rebuilt or added. Nobody has seen these on a screen.)

### For close-out

(Stage and quest counts that changed; shared code changed; doctrine or engine lessons.)
