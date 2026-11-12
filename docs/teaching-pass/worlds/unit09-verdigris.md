# Verdigris (`unit09`): acids and bases

Read with `docs/teaching-pass/BRIEF.md` and `PATTERNS.md`. The notes below were written on 2026-11-11 from the stage text and the earlier records, without playing the world. Treat every item as a lead to confirm against the source, and expect to find more.

- **Session:** World pass (Sonnet). After the Ember Reach exemplar. Not at the same time as Teeter (shared `eqdata.js`).
- **Earlier teaching pass:** 2026-11-06 (words by tool, glossary, moving particles; record `docs/teaching-pass/Verdigris.md`)
- **Quests:** `src/learn/quests/unit09/`. Chart `src/learn/worlds/unit09-acids-and-bases.js`. Bank `src/learn/bank/unit09.json`. Glossary `src/learn/glossary/verdigris.js`. Checks: `verify:verdigris`, `tools/verify-teaching-verdigris.mjs`.
- **Kits:** `ph*.js` in `src/learn/table/kits/`; `src/learn/engine/phdata.js`, `phmotion.js`, `eqdata.js` (shared with Teeter).
- **Report on 2026-11-11** (`node tools/teaching-report.mjs unit09 --totals`): 69 stages in 9 modules | briefing 0 | typed 15 (no instrument 0) | cards only 2 | reward long 14 | operation prompt 3 | hint 3 move/arithmetic 3 | vague 0 | register 0 | motive 2

## What is known to be wrong

- **pH is one sentence in a reward.** `q2-scale` stage 1's reward says "pH is minus the log of the H₃O⁺ concentration", and stage 2 demands a pH to two decimal places from it. Logarithms are assumed. Teach the scale on the bench (each tenfold dilution moves pH by one) before any stage asks for a number, and offer the logarithm recap there.
- **The student's action does not change the particles** in `q2`, `q5`, `q6`, `q7` and `q8` (the earlier pass's own finding): wobbling spheres beside a dial.
- **Long rewards carry the lesson**, six of eight in `q8-capacity`.
- **15 typed stages**, four in `q2-scale`.
- **Convoluted or double prompts:** "Dilute until one more dilution would change the pH by less than 0.1"; several "do X, then say Y".
- **Predict lead clips are missing where any clip of the topic shows the answer** (`q3` stage 1, `q4` stage 1, `q6` stage 2). Choose a neighbouring case from a different substance and record the choice.
- `q1` stage 7 (Lewis acids) says "beyond the exam" in its own prompt. It stays (owner decision): remove the label and make it followable.
- **Errors:** "Methyl red changed between 25.0 and 25.0 mL" (boss phase 4).

## Bench notes

- `q1-handover` (8): proton transfer. Two card-only stages; the proton moving between two drawn molecules should be the thing the student does.
- `q2-scale` (8): pH. See above; this is the bench most likely to lose a student.
- `q3-weak` (8): weak acids as an equilibrium (strong acids ionize completely, weak ones partly: the world's core idea). The count of ionized units is already honest; let the student act on it.
- `q4-structure` (8): structure and strength. No typed stages; check the reasons are shown and not asserted.
- `q5-salts` (8): salts in water.
- `q6-titrate` (8): titration curves. The flask's contents at each region of the curve should be visible.
- `q7-buffer` (8): buffers. Added acid being used up by the conjugate base is the thing to see.
- `q8-capacity` (8): buffer capacity. Shorten every reward by moving its content before the stage or into the bench.
- `boss-leach` (5): re-test; fix the indicator text.

## Owner requests to check against the source

None specific beyond `docs/feedback.md` general feedback.

## Traps

A painter must not write to its fixture; painter memory is `phmotion.scratch` (a `WeakMap`). *Strength* means concentration in most places and acid strength in `q4`; the rename tool has a skip list for it. `tools/teaching-ratchet.json` is rewritten whole by `--update`: write by merging under the world's key.

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
