# Kettle (`unit07`): reactions and stoichiometry

Read with `docs/teaching-pass/BRIEF.md` and `PATTERNS.md`. The notes below were written on 2026-11-11 from the stage text and the earlier records, without playing the world. Treat every item as a lead to confirm against the source, and expect to find more.

- **Session:** World pass (Sonnet). The largest world (75 stages): expect two sessions. Run after Tallow. A plan session first is strongly advised.
- **Earlier teaching pass:** none
- **Quests:** `src/learn/quests/unit07/`. Chart `src/learn/worlds/unit07-stoichiometry.js`. Bank `src/learn/bank/unit07.json`. No glossary: create `src/learn/glossary/kettle.js`. Checks: `verify:kettle` (`tools/lib/kettle-*-checks.mjs`, one file per bench).
- **Kits:** `pot*.js`, `heap.js`, `mass.js` (shared with Tallow), `atoms.js` (shared with Tallow and Ligar) in `src/learn/table/kits/`; `src/learn/engine/reactdata*.js`.
- **Report on 2026-11-11** (`node tools/teaching-report.mjs unit07 --totals`): 75 stages in 10 modules | briefing 2 | typed 16 (no instrument 0) | cards only 3 | reward long 14 | operation prompt 27 | hint 3 move/arithmetic 4 | vague 33 | register 2 | motive 2

## What is known to be wrong

- **Stand-in words** (33 of 75 stages): *pot* (reaction vessel), *heap*, *recipe* (formula or ratio), *chips*, *needle*, "Tray the sample", "the number manganese carries" (oxidation number).
- **Order.** `q1-recipe` stage 4 teaches limiting reactant before balanced equations (`q4`) and mole ratios (`q6`). Move it to `q6-stoich`.
- **Repeats.** `q1-recipe` re-teaches compound against mixture, percent composition and empirical formula, which Tallow `q1` and `q6` own. With the limiting-reactant stage moved, little of `q1` is left: merge what remains (definite proportions, conservation of mass) into `q3-change`, or keep a short `q1` on definite proportions only.
- **Worksheets.** `q6-stoich` is seven typed stages in eight; `q7-titrate` five in eight. 27 prompts open with an operation.
- **The boss is broken.** `boss-golem` has three phases titled Phase 1, Phase 4 and Phase 5; phases 2 and 3 are described in its header and missing from `STAGES`. Rebuild it as five phases that re-test the benches.
- **`q9-hsab` stays (owner decision) and must be fixed.** It teaches "hard prefers hard, and soft prefers soft" as a slogan across eight stages. Show the reason (a small, highly charged ion holds its electrons tightly; a large one's cloud is easily pulled out of shape) so the pairing can be predicted. No motives, plain words, and no more stages than the idea needs.

## Bench notes

- `q1-recipe` (8): see Order and Repeats above.
- `q2-names` (8): naming. A naming bench is mostly convention; keep it short and make the charge balance visible (ions that cancel), since that is the one idea in it.
- `q3-change` (8): physical against chemical change, conservation of mass. Particles before and after should show the same atoms rearranged.
- `q4-balance` (8): balancing. The student should balance by counting atoms they can see on each side.
- `q5-ionic` (8): precipitation and net ionic equations. Spectator ions should be seen staying dissolved.
- `q6-stoich` (8): grams react in the ratio of moles (the world's core idea). Calculation pattern: mole ratio seen with countable particles, one worked case, then typed cases. Limiting reactant arrives here.
- `q7-titrate` (8): titration. The equivalence point should be seen in the flask (no acid left), then computed.
- `q8-kinds` (8): kinds of reaction, oxidation number. Stage 5 names oxidation number properly.
- `q9-hsab` (8): see above.
- `boss-golem`: rebuild.

## Owner requests to check against the source

`docs/kettle-audit.md` ends with "Only the owner can judge"; read that section only.

## Traps

`tools/lib/kettle-*-checks.mjs` assert stage indices and some wording. Kettle registers Tour piece keys `jar` and `sample` in the global table. Moving the limiting-reactant stage changes two benches' counts, checks and bank entries at once: do it as one step.

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
