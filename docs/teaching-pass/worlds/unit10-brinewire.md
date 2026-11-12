# Brinewire (`unit10`): electrochemistry

Read with `docs/teaching-pass/BRIEF.md` and `PATTERNS.md`. The notes below were written on 2026-11-11 from the stage text and the earlier records, without playing the world. Treat every item as a lead to confirm against the source, and expect to find more.

- **Session:** World pass (Sonnet). After the Ember Reach exemplar. The world in the best state: expect the shortest session.
- **Earlier teaching pass:** 2026-11-06, four runs (glossary, tap-a-particle answers, strips dragged to the rail; record `docs/teaching-pass/Brinewire.md`)
- **Quests:** `src/learn/quests/unit10/`. Chart `src/learn/worlds/unit10-electrochemistry.js`. Bank `src/learn/bank/unit10.json` and `src/learn/bank/unit10/`. Glossary `src/learn/glossary/brinewire.js`. Checks: `verify:brinewire` (`tools/lib/brinewire-*-checks.mjs`), `tools/verify-teaching.mjs` with `tools/teaching-ratchet.json`.
- **Kits:** `cell*.js` in `src/learn/table/kits/`; `src/learn/engine/celldata*.js`, `cellscene.js`. Not shared.
- **Report on 2026-11-11** (`node tools/teaching-report.mjs unit10 --totals`): 53 stages in 7 modules | briefing 0 | typed 11 (no instrument 0) | cards only 0 | reward long 0 | operation prompt 10 | hint 3 move/arithmetic 3 | vague 6 | register 0 | motive 0

## What is known to be wrong

- **`verify:story` fails on this world today** (the only baseline failure): the `q1-halves` story animation uses "oxidation" before the bench that `VOCABULARY` says introduces it. Fix it here: either the term is properly introduced in `q1` (it is the bench about half-reactions, so it should be) and `VOCABULARY` is corrected, or the story wording changes.
- **11 typed stages**, four in `q4-potential` and three in `q6-electrolysis`. `q4` stage 7 computes log K from a cell voltage in several steps with one formula hint.
- `q1` stage 5 is titled "Who Gives (Beyond the Exam)". It stays (owner decision): remove the label and make it followable.
- **No stage has a briefing.**
- **Five stages still answer by picking a statement** because the answer is a relation between readings; check each is still the best form.
- The mechanism views were built from the instrument's read function and once drew sealed answers; the check for that exists. Keep it passing.

## Bench notes

- `q1-halves` (8): oxidation and reduction as electrons lost and gained. Introduce oxidation, reduction and oxidation number here with glosses.
- `q2-activity` (8): the activity series. Strips are dragged to the rail already; make sure the cause (which metal gives up electrons more readily, seen as atoms leaving the strip) is what the student reasons from.
- `q3-galvanic` (8): building a cell. No typed stages.
- `q4-potential` (8): cell potential and free energy. Voltage is energy per electron (the world's core idea). Calculation pattern for the four typed stages; stage 7 needs a worked case or a simpler ask.
- `q5-load` (8): non-standard conditions. A cell runs down until Q = K, not until the reactants are gone: that should be seen.
- `q6-electrolysis` (8): electrolysis and Faraday's law. Count electrons to atoms plated before the formula.
- `boss-clamp` (5): two typed phases; re-test.

## Owner requests to check against the source

None specific beyond `docs/feedback.md` general feedback.

## Traps

3D and flat views must share one fit, or a tap lands on the neighbouring particle. A view needs the instrument's read of what the player may see, not the planner's. One builder per fixture kind lives in `cell-scenes.js`; do not write per-stage models.

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
