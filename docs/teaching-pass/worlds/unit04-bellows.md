# Bellows (`unit04`): gases

Read with `docs/teaching-pass/BRIEF.md` and `PATTERNS.md`. The notes below were written on 2026-11-11 from the stage text and the earlier records, without playing the world. Treat every item as a lead to confirm against the source, and expect to find more.

- **Session:** World pass (Sonnet). A plan session first is strongly advised: this world has the most worksheet stages.
- **Earlier teaching pass:** none
- **Quests:** `src/learn/quests/unit04/`. Chart `src/learn/worlds/unit04-gases.js`. Bank `src/learn/bank/unit04.json`. No glossary: create `src/learn/glossary/bellows.js`. Checks: `verify:bellows`.
- **Kits:** `gas.js`, `gas-draw.js`, `gas-read.js`, `gas-3d.js` in `src/learn/table/kits/`; `src/learn/engine/gasdata.js`, `gas-particles.js`, `gas-props.js`. Not shared.
- **Report on 2026-11-11** (`node tools/teaching-report.mjs unit04 --totals`): 49 stages in 7 modules | briefing 1 | typed 17 (no instrument 0) | cards only 2 | reward long 15 | operation prompt 31 | hint 3 move/arithmetic 6 | vague 36 | register 6 | motive 2

## What is known to be wrong

- **The owner asked twice (2026-10-09, 2026-11-01) and it is still not done:** *pressure* and *volume* for *gauge*, *room*, *push*, *knocks*, *squeeze* (36 of 49 stages); kelvin taught first (it is needed in `q1` and introduced in `q2` stage 3); the ideal gas law stated before it is needed; sorts run lowest on the left. "Holder 8" is a container: call it a cylinder or a tank and drop the numbers where a stage has one.
- **Worksheets.** 17 typed stages; `q3-ideal` is five in nine. `q1` stage 7 teaches the manometer with no manometer, only a plate of mercury levels. Multi-step conversions with one formula hint (`q5` stage 7: rms speed with kg/mol).
- **Two stages are about percentage error in a student's lab report** (`q3` stage 9 "A Thermometer That Reads Low", `q4` stage 8 "A Forgotten Correction"), which is not gas chemistry. Cut them or ask the gas question underneath.
- **31 prompts open with an operation** ("Type the temperature at which Holder 8's room is twice Holder 7's").
- **Rewards in textbook register:** "Mole quantity in a gas is directly proportional to pressure and volume, and inversely proportional to absolute temperature. Combining these dependencies yields the ideal gas law."

## Bench notes

- `q1-knocks` (8): pressure is particles hitting the walls (the world's core idea; the particles are simulated live, so use them). The student should change the volume or the number of particles and see the hits on a wall change. Kelvin is introduced here, on the bench, before any stage needs it. The manometer stage gets a drawn manometer or goes.
- `q2-laws` (7): Boyle, Charles, Gay-Lussac. Each law seen as a change in the particles before it is a number; then one worked case; then typed cases.
- `q3-ideal` (9): PV = nRT. State the law in a briefing before the first stage that needs it. Cut to about six. Stage 3 is a card sort of tanks whose hint 3 is the formula in stand-in words.
- `q4-mixtures` (8): partial pressures. Two kinds of particle visible in one container, each kind's hits counted.
- `q5-speed` (8): speeds, effusion, diffusion. Stage 7 (rms speed) needs its unit conversion on a plate and a worked case, or it goes.
- `q6-real` (4): real gases. Particle size and attraction should be visible at high pressure.
- `boss-compressor` (5): re-test; rename.

Quest ids such as `q1-knocks` stay (ids are internal); titles and all play text change.

## Owner requests to check against the source

`docs/feedback-11-01.md` section "Bellows"; `docs/plans/feedback-11-01-plan.md` item 9.

## Traps

A rename of *room* and *push* by tool will hit ordinary English uses ("room temperature", "push the piston"): use the skip list in `tools/lib/rewrite-play-text.py` and read the diff. Checks under `tools/` may match the old words.

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
