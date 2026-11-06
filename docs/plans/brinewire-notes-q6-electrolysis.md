# Brinewire `q6-electrolysis`: build notes

## What was built
- Quest `src/learn/quests/unit10/q6-electrolysis.js` (8 stages), instrument `src/learn/table/kits/cell-supply.js` (+ `cell-supply-tour.js`), planners `src/learn/engine/celldata-electrolysis.js`, story painter `src/ui/story-scenes-brinewire-q6.js` (`electrolysis-push`), bank `src/learn/bank/unit10/q6-electrolysis.json`, checks `tools/lib/brinewire-q6-checks.mjs`.
- One fixture kind, `cellsupply`, with six scenes (`zncu`, `melt`, `plate`, `water`, `compare`, `weigh`) and two piece kinds (`cellsupplypack`, `cellsupplyplate`). Hidden dials `last` and `seen` (a bitmask) record the runs; every reading is recomputed from the planner.
- Model stated on the bench: ideal electrodes (no overpotential), circuit 2.0 Ω in the driven runs, gas at 25 °C and 1 bar (24.79 L/mol) all collected. Brine's chlorine is named an overpotential effect on the stage 7 reward card, not on the bench (printing it would give the answer).

## Stages as built
1 Make zinc plate out of the zinc–copper cell's solution (two dials: supply 0.5/1.5 V, where electrons are pushed; Run 60 s). 2 Which electrode makes sodium (melt at 6.0 V, one dial, answer dial pushed into / drawn out of). 3 Rank three silver runs by charge (rail; coulomb counter absent). 4 Typed copper, 2.00 A 30.0 min = 1.19 g (bench runs 1/2 A for 30/60 s; coulomb counter and half-reaction line shown). 5 Typed silver, 3.00 A 10.0 min = 2.01 g. 6 Seat cells in a chain until the water cell gives gas. 7 Four gas tubes (water, brine), five gas cards. 8 Typed current from the sealed plate (nickel, 0.365 g, 25.0 min = 0.800 A).

## Where it parts from the spec
- Stage 1 lead line is one sentence ("Someone is pushing current into the pools, and Vess wants to find what a pushed current does to the water.") because `verify:learn` requires one sentence; the task's two-sentence wording failed that check.
- Stage 2 answer is "electrons pushed into it / drawn out of it", not "cathode / anode": the words are earned by that stage's reward card (VOCABULARY: cathode, anode, reduction, oxidation at stage 2). If q1 or q3 earns them first, the entries can move.
- Stage 3 prompt says "electric charge" (plain word) while coulomb is earned on the reward; the rank is read from silver masses.
- Stage 4: spec's forgot-n figure 2.38 g is 2.371 g by hand (3600 × 63.546 / 96485.33); the check uses 2.371.
- Stage 6 current: a 2.0 Ω circuit turns the chain's excess voltage into a current for the gas volumes (spec had gas only as on/off). Stage 1 uses the same resistance to get the strips' mass change.
- Stage 8 plate is nickel (not named on the plate piece); the cell names it so the molar mass is a lookup on a plate listing four metals.
- No predict stage: the spec table has none for q6 (click s1). Bank has the two problems and one worked problem; 9.7.A.2 (ATP) stays out.
- BUILDS_ON is `unit10/q4-potential` only; q3 is not built.
- Story and `WITHHELD_VOCAB` (added after `unit09/q6-titrate`, no `unit10/q4` line existed): `unit10/q2-activity`'s story says "sacrificial anode", and this quest introduces "anode" at stage 2, so `verify:story` flags q2 until q3 (or q2) earns the word before this bench.

## Hints and prompts
See the quest file; every prompt is one sentence of 25 words or fewer, hints are control / look-at / method.

## Only a hand can judge
- Painted text inside the supply fixture (sizes, spacing between the readout rows, the zncu strip lines near the wires) at the default pane and at 375 px.
- The collector tubes' fill (scaled to 10 mL in stage 6, 8 mL in stage 7) and the seats under the tubes in stage 7.
- The chain seats and cell bars in stage 6; the plate on the balance in stage 8.
- Whether stage 6 (two to three drags and one Run) feels like more than a lookup; whether stage 3's three Run presses are tedious.
- The 3D glass dishes (never viewed).

## Defects noticed
- `verify:table` flagged recorder readings equal to card numbers (stage 3) and an off-table card (stage 7): fixed (recorder value is the plated mass; cards moved).
- Not mine: q1/q2/q3 failures in `verify:learn`/`verify:table`/`verify:story` as of this run.
