# Ligar (`unit03`): bonds, lattices, molecular shape

Read with `docs/teaching-pass/BRIEF.md` and `PATTERNS.md`. The notes below were written on 2026-11-11 from the stage text and the earlier records, without playing the world. Treat every item as a lead to confirm against the source, and expect to find more.

- **Session:** Exemplar (Opus). Third exemplar; may run alongside Lanternfall in its own worktree.
- **Earlier teaching pass:** none (operability fixes and added stages on 2026-10-29, none played by a student)
- **Quests:** `src/learn/quests/unit03/`. Chart `src/learn/worlds/unit03-bonding.js`. Bank `src/learn/bank/unit03.json`. No glossary: create `src/learn/glossary/ligar.js`. Checks: `verify:ligar`.
- **Kits:** `bonds.js`, `atoms.js` (shared with Tallow and Kettle), `domain*.js`, `mo.js` in `src/learn/table/kits/`; `src/learn/engine/vsepr.js`, `lewis.js`, `mo.js`, `bonddata.js`, `ligar-mol3d.js`, `joinbench.js`.
- **Report on 2026-11-11** (`node tools/teaching-report.mjs unit03 --totals`): 74 stages in 10 modules | briefing 2 | typed 0 (no instrument 0) | cards only 13 | reward long 16 | operation prompt 22 | hint 3 move/arithmetic 18 | vague 31 | register 9 | motive 1

## What is known to be wrong

- **Two bad voices in one stage.** Prompts say *arms*, *balloon*, *hub*, *slate*, *stamp*; rewards say "trigonal bipyramidal electron domain geometry", "Lateral overlap of unhybridized parallel p orbitals above and below the axis forms a pi bond", "Molecules with permanent dipole moments reorient in the presence of an electric field". Target: electron domain, lone pair, bond angle, Lewis structure, formal charge, each glossed once, in short sentences.
- **Convoluted answer forms in `q6-shape`.** "Set the marker to how many degrees the H-O-H angle falls short of 109.5", "the middle value of the three different angles between pairs of five arms", "the fewest arms that cannot all lie flat on the plate". Ask for the angle or the shape.
- **Readouts that print the answer.** `q7-polarity` stage 1 (the card prints the electronegativity difference); `q5-resonance` stage 4 (a stamp prints each atom's formal charge).
- **Hints that give the answer** (18 stages). `q6` stage 1: "set the marker to 180 degrees". Boss phase 2: "Form a triple bond between carbon and nitrogen, leaving one lone pair on nitrogen". Boss phase 5: "Select oxygen, whose molecular orbital configuration contains two unpaired electrons". `q9` stage 6: the prompt states the formula and rung 2 works all four answers.
- **`q9-orbitals` stages 4 to 6 are the opposite of what the owner asked for.** Asked for: show "visually how the atomic orbitals add up or subtract", with "atoms transitioning between free and bonded". Built: card sorts whose prompts state the rule.
- **Slogans.** `q1-joins` explains bonding as reaching a full shell; nothing shows why (lower energy, attraction to both nuclei). `q7` stage 1: "Above about 1.7 the bond is counted as ionic" as a law (it is a rough guide). A predict prompt leaks with "despite possessing polar bonds".
- **Errors:** "diamagnetic and unpulled" (`q9` stage 2).

## Bench notes

- `q1-joins` (5): why atoms bond. Show attraction of shared electrons to both nuclei and the energy falling; electronegativity is needed here in a clause, before `q7` treats it.
- `q2-lattice` (10): ionic and metallic solids. Too long: three stages on alloys, and stages 2 and 3 sort to a taxonomy without a reason. Draw the mobile electrons in the metal and the fixed ions in the salt so "conducts" is seen. Cut to about seven.
- `q3-distance` (6): bond length and energy. Stage 6 is card-only with a 52-word reward.
- `q4-dots` (8): Lewis structures. *Slate* becomes drawing board or simply "the structure". Rebuild hints.
- `q5-resonance` (8): resonance and formal charge. The student should count formal charge from the drawing (electrons owned against valence), not read a stamp.
- `q6-shape` (10): VSEPR, a rotating 3D model (the world's core idea; keep it). Direct answer forms; real terms; five- and six-domain shapes stay.
- `q7-polarity` (7): bond and molecular polarity. Stage 7 (percent ionic character) stays by owner decision: give the unit conversion on a plate and make the idea (how far the electrons have shifted) visible.
- `q8-hybrid` (9): hybridization, sigma and pi. Stage 2's reward concludes "Consequently, atomic orbitals must hybridize"; the puzzle (four equal bonds from unequal orbitals) must be seen first.
- `q9-orbitals` (6): **rebuild stages 4 to 6 (L)**, and thin stage 3 (twelve electron pieces, a ladder, "PUSHES" and "HOLDS" labels, counters and a magnet at once). Two atoms approach; their orbitals are seen to add (density between the nuclei) or cancel (a node between them); the student fills the resulting levels.
- `boss-warden` (5): phases re-test, never introduce; rebuild hint ladders.

## Owner requests to check against the source

`docs/feedback-11-01.md` section "Lanternfall and Ligar"; `docs/plans/feedback-11-01-plan.md` items 6 to 8 and 11 (marked completed; check the source).

## Traps

`tools/verify-learn.mjs` hard-codes stage indices for several Ligar quests; inserting a stage shifts them and the `NOTES` keys in the quest file. A new bench needs a site in `tools/gen-ligar-layout.mjs` and `src/three/world-data/ligar.json` (`verify:ligar` checks overlap and walkability): prefer stages to benches. The `q7` Arrows tool only joins a field card (`molCard(..., { field: true })`).

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
