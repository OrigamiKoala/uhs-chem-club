# Teeter (`unit08`): equilibrium

Read with `docs/teaching-pass/BRIEF.md` and `PATTERNS.md`. The notes below were written on 2026-11-11 from the stage text and the earlier records, without playing the world. Treat every item as a lead to confirm against the source, and expect to find more.

- **Session:** World pass (Sonnet). After the Ember Reach exemplar. Not at the same time as Verdigris (shared `eqdata.js`). A plan session first is advised.
- **Earlier teaching pass:** 2026-11-06 (words, glossary, shared mechanism views, tap zones; record `docs/teaching-pass/Teeter.md`)
- **Quests:** `src/learn/quests/unit08/`. Chart `src/learn/worlds/unit08-equilibrium.js`. Bank `src/learn/bank/unit08.json`. Glossary `src/learn/glossary/teeter.js`. Checks: `verify:teeter` (`tools/lib/teeter-*-checks.mjs`), `tools/verify-teaching-teeter.mjs` with `tools/teaching-ratchet-teeter.json`.
- **Kits:** `pans*.js` in `src/learn/table/kits/` (`pans-3d.js` shared with Ember Reach and Mirrowen); `src/learn/engine/eqdata.js` (shared with Verdigris), `eqdata-free.js`.
- **Report on 2026-11-11** (`node tools/teaching-report.mjs unit08 --totals`): 69 stages in 9 modules | briefing 0 | typed 11 (no instrument 0) | cards only 0 | reward long 14 | operation prompt 46 | hint 3 move/arithmetic 7 | vague 7 | register 0 | motive 4

## What is known to be wrong

- **The reactions are letters:** `E ⇌ 2 D`, `F + G ⇌ H`, `M + N ⇌ W`, `X ⇌ Z`. A student cannot picture any of them. Use real reactions a student can see (N₂O₄ ⇌ 2 NO₂ with its colour, H₂ + I₂ ⇌ 2 HI, Fe³⁺ + SCN⁻ ⇌ FeSCN²⁺, a dissolving salt). Check every constant you introduce against a reference value and record it.
- **46 of 69 prompts open with an operation**, the most in the track.
- **`q4-properties` is eight stages of algebra on K with nothing physical happening**, and "Read K" prints K for a card that the student then matches. Cut to about four, each tied to particle counts the student can see.
- **`q5-ice` is five typed ICE-table problems, one with a quadratic.** Calculation pattern: see the change in particle counts, one worked case, then at most three typed cases. Drop the quadratic or give the small-change shortcut with its limit stated.
- **Motion beside the dial.** The earlier pass records that its mechanism views add motion next to the graded move and do not change it.
- `q8` stage 7 (ATP coupling) stays (owner decision): fix it to the standard.

## Bench notes

- `q1-both` (8): forward and reverse rates become equal (the world's core idea: equilibrium is dynamic, not stopped). The student should see individual particles still converting at equilibrium.
- `q2-k` (8): the equilibrium constant. K as a ratio of counts the student can see before it is a formula.
- `q3-q` (8): Q against K. Tap zones exist; the question should be which way the reaction runs and why.
- `q4-properties` (8): see above.
- `q5-ice` (8): see above.
- `q6-lean` (8): Le Chatelier. The student applies the stress to the vessel and watches the particles respond; the rule is a summary of what they saw, never a slogan to apply.
- `q7-dissolve` (8): solubility product.
- `q8-free` (8): equilibrium and free energy.
- `boss-tipper` (5): re-test.

## Owner requests to check against the source

None specific beyond `docs/feedback.md` general feedback.

## Traps

Zones that follow a picture (`kit.tapZones`) must be computed from the painter's scale. `verify:table` and `verify:bench` drive a tap with `pickSpot`, a dial by its track. Checks under `tools/lib/teeter-*` match some wording (one required "pan" in a refusal). Changing the reactions changes `eqdata.js` values that Verdigris reads: add, do not alter, shared entries.

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
