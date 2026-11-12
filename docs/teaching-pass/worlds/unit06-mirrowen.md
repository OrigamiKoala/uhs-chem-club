# Mirrowen (`unit06`): intermolecular forces, states, solutions

Read with `docs/teaching-pass/BRIEF.md` and `PATTERNS.md`. The notes below were written on 2026-11-11 from the stage text and the earlier records, without playing the world. Treat every item as a lead to confirm against the source, and expect to find more.

- **Session:** World pass (Sonnet). After the Ember Reach exemplar.
- **Earlier teaching pass:** 2026-11-06 (words, glossary, time-aware painters; record `docs/teaching-pass/Mirrowen.md`)
- **Quests:** `src/learn/quests/unit06/`. Chart `src/learn/worlds/unit06-states-of-matter.js`. Bank `src/learn/bank/unit06.json`. Glossary `src/learn/glossary/mirrowen.js`. Checks: `verify:mirrowen` (`tools/lib/mirrowen/`), `tools/verify-teaching-mirrowen.mjs` with `tools/teaching-ratchet-mirrowen.json`.
- **Kits:** `matter*.js` in `src/learn/table/kits/`; `src/learn/engine/matterdata*.js`, `thermodata.js`. The matter kit spreads the heat kit: it must declare its own `live`, `onMiss` and `tapZones`. `pans-3d.js` is shared.
- **Report on 2026-11-11** (`node tools/teaching-report.mjs unit06 --totals`): 58 stages in 8 modules | briefing 0 | typed 15 (no instrument 0) | cards only 0 | reward long 0 | operation prompt 17 | hint 3 move/arithmetic 1 | vague 7 | register 0 | motive 2

## What is known to be wrong

- **`q2-grip` is a black box.** A probe prints the heat needed to separate a mole; six of eight stages are "order by the reading". Nothing connects the reading to its cause (size of the electron cloud, a permanent dipole, a hydrogen bond).
- **Only the piston meets the bar.** The earlier pass records that the graded act is the student's hand on the model for one instrument. Sorting by what a sample did is still cards on a rail.
- **15 typed stages**, three each in `q5-crossing`, `q6-solution` and the boss. 17 prompts open with an operation.
- **No stage has a briefing.**
- **Remaining stand-in words:** *tray*, *box*, *gauge*, *room*.
- `q5` stage 8 and `q7` stage 6 are beyond the exam and stay (owner decision): fix them to the standard and remove any "beyond the exam" label from play text.

## Bench notes

- `q1-states` (8): particles in solid, liquid, gas. The piston works; bring the other stages to it.
- `q2-grip` (8): intermolecular forces. **Redesign (M).** Show two molecules and what attracts them (the temporary dipole of a large cloud, the fixed dipole, the hydrogen bond), so the student predicts the order and the probe confirms. Molecules stay whole (the world's core idea).
- `q3-boil` (8): vapour pressure and boiling. Dynamic exchange at the surface is a good graded act: the student sets conditions and counts leaving against returning.
- `q4-solids` (6): kinds of solid.
- `q5-crossing` (8): heating curves. Three typed stages need the calculation pattern from Ember Reach `q2`.
- `q6-solution` (8): molarity, dilution, dissolving. Particles per volume should be visible when the student dilutes.
- `q7-separate` (7): separations.
- `boss-undertow` (5): three typed phases; re-test.

## Owner requests to check against the source

None specific beyond `docs/feedback.md` general feedback.

## Traps

A glide shows its rest value on first sight and then moves, so a check that looks once sees no change. The 3D crowd records every non-dark `fillRect` as a glass column. Tour piece keys are namespaced `<kit>:<kind>` because Kettle registers `jar` and `sample` globally. *Grip* was renamed to attraction by tool and left grammar damage; read every string.

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
