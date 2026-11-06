# Brinewire notes: `q5-load` (Under Load, CED 9.10)

Built from the amended spec section 3.5. Files: `src/learn/quests/unit10/q5-load.js`; kit `src/learn/table/kits/cell-load.js` + `cell-load-tour.js` (one import line added to `cell.js`); planners `src/learn/engine/celldata-q5.js`; checks `tools/lib/brinewire-q5-checks.mjs`; story painter `src/ui/story-scenes-brinewire-q5.js` (`load-down`); bank `src/learn/bank/unit10/q5-load.json`.

## What was built

Three fixtures, all thin wrappers over the planners:

- `cellloadrun`: tin (left) and lead (right) beakers with ion windows (one dot is 0.02 M), a voltmeter, a load block and a voltage-against-time plot. "Run" advances 8 ticks (`LOAD.perPress`); the bench stops at 40 ticks. The plot and the windows are the planner's state at the tick reached (`loadAt`, `loadTrace`); before the first press the voltmeter shows a dash and the plot is empty.
- `cellloadread`: two beakers with a voltmeter, right bar against left. An optional dial gives the left beaker two strengths (0.010 M, 1.0 M); "Run" reads the cell as set and keeps a line per strength read. `wired: false` leaves it with no Run key.
- `cellloadcc`: a concentration cell with a voltmeter (signed) and an ammeter whose needle swings toward the bar the electrons go to. Strengths can be sealed ("?").

The load: each tick the reaction advances by `4 × E` mol/L (current in proportion to voltage). The meter reads 0.000 V first at tick 26, so after the fourth press; the cell then sits at 72 tin dots and 28 lead dots (K = 2.545, balance extent 0.4358 M).

Stages as built: 1 predict (four cards); 2 run the cell, selector over the end state; 3 zinc strength dial, selector rises/falls/same; 4 typed tin count ÷ lead count on the dead cell (2.6); 5 copper concentration cell, selector on the bar the electrons leave; 6 typed Nernst voltage, cell unwired, plate (1.01 V); 7 rank three prepared Zn|Cu cells on a rail (C 1.16, A 1.10, B 1.04); 8 sealed silver concentration cell, selector A/B.

## Where this parts from the spec

1. **Stage 1 and 2 wording.** The spec's card "Both still hold both kinds of ion" is false (the tin beaker holds tin ions only). The cards are now: all the tin ions are gone / all the lead ions are gone / both beakers are empty of ions / both kinds of ion are still there. The stage 1 prompt says "small load", not "lamp": a 0.012 V cell lights nothing.
2. **One-sentence prompts.** The spec's stage prompts with two sentences were folded into one (`verify:learn` demands exactly one).
3. **Lead line is one sentence.** The assigned line "The marsh cells fade over a day. Find out what a cell does as it runs." fails `verify:learn` ("story line is 2 sentences"). Built as "The marsh cells fade over a day, and Vess wants to find out what a cell does as it runs." (same content, the q4 pattern). The integrator can restore the two-sentence form only by relaxing that check; `unit10/q6-electrolysis` hits the same rule.
4. **Stage 3 has one dial, not two.** One decision per stage: only the zinc beaker has a dial; copper stays at 1.0 M and is printed. The dial starts at 0.010 M so "raise" means going to 1.0 M. Stage 3's prompt names the two strengths, which is the objective, not the route to the answer.
5. **Stage 4 is typed, not a selector.** "Quantities beyond the dial must be typed": the ratio is typed (2.6, accepted 2.35 to 2.79, so a student who reads K as 2.5 passes). The cell is mounted already run to its end (tick 40, counts printed under the windows) so the stage does not repeat stage 2's five presses; stage 2's windows print no counts, stage 4's do.
6. **Stage 5 and 8 voltmeter is signed.** The voltmeter reads right bar against left (as the q4 rig does), so the sign and the ammeter needle both give the electron direction. In stage 8 silver (n = 1, 0.118 V) is used, with the dilute beaker on the left, so the new case differs from stage 5 (copper, dilute on the right).
7. **Stage 6 plate prints Q's definition in words** ("Q = products ÷ reactants, ions only") because the equation sheet does; n is not printed (the student reads Zn²⁺ and Cu²⁺).
8. **Stage 7 cells.** Three fixed cells, each with its own Run key; the rank is accepted at once, a wrong one is refused naming two readings.
9. **Sacrificial anode / anode in reward 5.** Reward 5 says "the anode" after the dilute bar; q3 is not built yet to earn it. The word is in the reward only (not in play copy).
10. **Concentration cells show no particle windows** (the spec's small-fraction pitfall): 0.010 M is half a dot.

## Hints and prompts as built

Prompts: (1) "When a tin and lead cell has driven a small load until its voltmeter reads zero, what does each beaker hold?" (2) "Run the tin and lead cell and say what each beaker holds when the voltmeter reads zero." (3) "Raise the zinc ion strength in the zinc beaker, from 0.010 M to 1.0 M, and say what the voltmeter does." (4) "Find the tin count divided by the lead count in the cell that reads zero." (5) "Run a copper cell with a 1.0 M beaker and a 0.010 M beaker, and say which bar the electrons leave." (6) "Find the voltage, in volts, of the zinc and copper cell with 1.0 M zinc ions and 0.0010 M copper ions." (7) "Rank the three zinc and copper cells by voltage, highest first." (8) "Say which beaker of the sealed silver cell holds the more dilute solution." Hints are in the quest file (control, compare, method). No stage uses "shift" or Le Châtelier language (checked by regex in the checks file); "Q" and "Nernst" and "concentration cell" appear only from the stage that earns them (`VOCABULARY` plus `WITHHELD_VOCAB`).

## What only a hand can judge

- The dot windows (100 slots, 24 × 26 units) and how legible a 0.002 V difference on the plot is at a small pane; the plot's vertical scale is fixed at 0.012 V.
- Whether five Run presses in stage 2 feel like watching a cell run down or like busywork (the fall is fastest in the first press).
- The ammeter needle as a half dial at about 22 × 11 units.
- Layout of the 150-wide run fixture beside a list selector on a 176-wide table, and the three 50-wide cells in stage 7, at 375 px and at 3D On.
- The painter `load-down` in the story player (scenes were checked to paint at every line, not looked at).

## Defects found

- None in the shared tree; two other benches' failures (`q1-halves`, `q2-activity`, `q6-electrolysis`, `verify:story` for q2's use of "anode") were seen while running the checks and are not this bench's.
