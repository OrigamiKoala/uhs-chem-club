# Ember Reach (`unit05`): thermochemistry, entropy, free energy

Read with `docs/teaching-pass/BRIEF.md` and `PATTERNS.md`. The notes below were written on 2026-11-11 from the stage text and the earlier records, without playing the world. Treat every item as a lead to confirm against the source, and expect to find more.

- **Session:** Exemplar (Opus). First exemplar: it sets the patterns for calculation stages, briefings and worked cases that every other world copies. The owner plays it before any other session starts.
- **Earlier teaching pass:** 2026-11-06 (words, glossary, a moving model on every stage; record `docs/teaching-pass/Ember.md`, section "Open work")
- **Quests:** `src/learn/quests/unit05/`. Chart `src/learn/worlds/unit05-thermodynamics.js`. Bank `src/learn/bank/unit05.json`. Glossary `src/learn/glossary/ember.js`. Checks: `verify:ember`, `tools/verify-teaching-ember.mjs` with `tools/teaching-ratchet-ember.json`.
- **Kits:** `heat*.js` in `src/learn/table/kits/` (`heat-motion.js` holds the moving models and lead clips); `src/learn/engine/thermodata.js`, `heat-solids.js`, `heat-props.js`. `pans-3d.js` (`dressRecorded`) is shared with Teeter and Mirrowen.
- **Report on 2026-11-11** (`node tools/teaching-report.mjs unit05 --totals`): 47 stages in 8 modules | briefing 0 | typed 16 (no instrument 0) | cards only 3 | reward long 0 | operation prompt 21 | hint 3 move/arithmetic 3 | vague 6 | register 5 | motive 1

## What is known to be wrong

- **The model moves, the student still types.** 16 of 47 stages grade a typed number and 21 prompts open with an operation ("Type the temperature in kelvin at which..."). The 2026-11-06 pass says so itself: heat arithmetic, bond sums, Hess and free energy "still grade a typed number or an answer dial".
- **No stage has a briefing.** Every stage starts cold.
- **Ideas first appear in rewards.** `q7-gibbs` stage 2: Gibbs free energy, `ΔG = ΔH − TΔS` and "spontaneous" all first appear in the reward of a stage whose task was to type a temperature read from a plot. `q6-entropy` stage 2: "The measure of the number of microstates available to a system is its entropy".
- **Used before taught.** `q3-enthalpy` stage 7 ("Which Runs Out?") is limiting reactant, taught in Kettle; stage 8 ("The Way Back Over the Hill") is activation energy, from a unit not built. Both leave this world (owner decision).
- **Hint 1 is a tool list on every stage** ("Use the three cards and the slot"). Rung 1 should say where to look.
- **Register:** *yields*, *thermodynamic effects*, "based on whether endothermic dissolution can occur spontaneously" (a predict hint that also uses two terms not yet taught).
- **Errors:** "inspect the bond bond table", "Now Read the Bond table" (`q4` stage 4).

## Bench notes

- `q1-flow` (5): heat flows from hot to cold; temperature is particle motion. Closest to the standard; add briefings and fix hints.
- `q2-calorimetry` (8): q = mcΔT. Six typed stages. This bench sets the calculation pattern: the quantity seen and compared first (same heat into water and iron), one worked case placed before the first typed stage, then typed cases where the number describes something on the bench.
- `q3-enthalpy` (8): heat of reaction. Stages 7 and 8 go; five of the rest are typed. Cut to about six.
- `q4-bonds` (6): bond energies. The student already drags atoms apart; make the sum of broken and formed bonds something they build, not type.
- `q5-hess` (4): Hess's law. Two routes with one total should be seen on the energy diagram.
- `q6-entropy` (5): entropy as the number of arrangements. Stages 3 and 4 are card sorts. Gloss microstate at first use or use "arrangements".
- `q7-gibbs` (6): free energy. Teach `ΔG = ΔH − TΔS` before stage 2, in a briefing on the cold-pack case the predict stage just showed; let the student move the temperature and watch the two terms compete; then ask about a different case.
- `boss-crucible` (5): re-test; phases 1 and 5 are typed.

## Owner requests to check against the source

None specific. The general requests in `docs/feedback.md` (stop using confusing terminology; explain the instruments) apply.

## Traps

`VOCABULARY.introducedAt` gates Tour titles by stage (a Tour step that says "calorimeter" before the term is earned fails). Hand-placed layouts leave little free space: `verify:table` names the fixture that overlaps. The predict-stage check allows only a `lead` fixture.

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
