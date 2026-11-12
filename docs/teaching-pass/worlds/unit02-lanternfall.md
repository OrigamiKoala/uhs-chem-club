# Lanternfall (`unit02`): light, electrons, orbitals, trends

Read with `docs/teaching-pass/BRIEF.md` and `PATTERNS.md`. The notes below were written on 2026-11-11 from the stage text and the earlier records, without playing the world. Treat every item as a lead to confirm against the source, and expect to find more.

- **Session:** Exemplar (Opus). Second exemplar, after Ember Reach has been played by the owner.
- **Earlier teaching pass:** none
- **Quests:** `src/learn/quests/unit02/`. Chart `src/learn/worlds/unit02-quantum.js`. Bank `src/learn/bank/unit02.json`. No glossary: create `src/learn/glossary/lanternfall.js`. Checks: `verify:lanternfall` (`tools/lib/lanternfall/`).
- **Kits:** `optics*.js`, `shells*.js`, `pes*.js`, `trends*.js`, `cloud*.js`, `cuvette*.js` in `src/learn/table/kits/`; data in `src/learn/engine/lightdata.js`, `lightbench.js`. No kit is shared with another world.
- **Report on 2026-11-11** (`node tools/teaching-report.mjs unit02 --totals`): 61 stages in 11 modules | briefing 1 | typed 3 (no instrument 0) | cards only 5 | reward long 19 | operation prompt 14 | hint 3 move/arithmetic 20 | vague 25 | register 2 | motive 2

## What is known to be wrong

- **The central ideas are one-clause inferences in reward cards.** `q2-photon` stage 2: "so light must deliver its energy in discrete packets". `q4-cloud` stage 3: "Electrons follow this same rule: wave-particle duality". 19 rewards run long because they carry the lesson.
- **`q8-trends` is a black box.** "Tug Electron", "Remove Electron", "Add Electron" and "Measure Pull" each print a number per atom; five of seven stages are read-then-order. Shielding, effective nuclear charge and the two exceptions (boron below beryllium, nitrogen's electron affinity) are asserted in reward clauses.
- **`q10-wavefunctions` is the opposite of what the owner asked for.** Asked for (2026-11-01): an introduction to wavefunctions and orbitals "in a super visual way". Built: five card sorts with no instrument, formula hints, and the densest text in the track ("squaring any real amplitude produces an exclusively non-negative probability density").
- **Hints that give the move** (20 stages). `q6-filling` stage 5 rung 3: "Place two electrons in 4s and one electron in 3d". `q10` stage 3: "Place 1s in 0, 2s in 1, and 3s in 2 radial nodes". `q9-absorb` stage 4: "Add stock until Cuvette B reaches 8.0 mmol/L". `q5-numbers` stage 1: the prompt names the target orbital and the hints are a three-line lecture on n, l and ml.
- **Stand-in words:** *crests that pass each second* in `q1` stage 6 although stage 1 named frequency; *holder*, *piles* (PES peaks), *gauge*, *tug*, *shots*, *knocks*, *grip*.
- **Errors:** "Order the five sources of light form lowest" (`q1` stage 5).

## Bench notes

- `q1-wave` (6): wavelength, frequency, one speed. Use *frequency* from the stage that names it.
- `q2-photon` (6): the photoelectric effect. The student must see the two controls do different things: brightness changes how many electrons leave, colour changes whether any leave and how fast. A briefing sets up the wave prediction before stage 2 so the result is a surprise the student can name.
- `q3-lines` (5): emission lines and energy levels. Check the hydrogen line animation the 2026-11-01 plan claims.
- `q4-cloud` (5): where the electron is. The strings-on-a-ring stage needs its link to electrons made on the bench, not in the reward.
- `q5-numbers` (5), `q6-filling` (6): quantum numbers and filling order. Rebuild the hint ladders; the energy order should be visible (levels drawn at their heights), so 4s before 3d is seen and not told.
- `q7-pes` (6): photoelectron spectra, drawn flat and honest (the world's core idea; keep it). *Piles* become peaks. Stage 3's 59-word reward is the lesson: move it before the stage.
- `q8-trends` (7): **redesign (M to L).** The instrument must show the cause: nuclear charge, shells and the inner electrons between the nucleus and the outer electron, responding as the student changes atom. Then ranking can be reasoned. Each exception gets its own stage with its cause shown, or one honest clause.
- `q9-absorb` (5): Beer-Lambert. Sound; fix hints.
- `q10-wavefunctions` (5): **rebuild (L).** A visual instrument: a wave with its sign, its square as the density, nodes as places the student can see and count on a drawn orbital. Plain words.
- `boss-eater` (5): re-test; check hints.

## Owner requests to check against the source

`docs/feedback-11-01.md` section "Lanternfall and Ligar". `docs/plans/feedback-11-01-plan.md` marks all eleven items completed; several were built as card sorts or reward text. Check each against the source.

## Traps

Boss phases resolve some text lazily; read `boss-eater.js` directly.

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
