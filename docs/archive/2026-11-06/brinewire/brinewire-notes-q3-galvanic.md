# Brinewire notes: q3-galvanic (Galvanic Cells)

## Built
Quest `src/learn/quests/unit10/q3-galvanic.js`; kit `table/kits/cell-galv.js` + `cell-galv-tour.js` (fixtures `cellgalv`, `cellgalvplot`, `cellgalvbal`; pieces `cellgalvtube`, `cellgalvrod`, `cellgalvwire`, `cellgalvstrip`); planners `engine/celldata-galvanic.js`; story `ui/story-scenes-brinewire-q3.js` (`cell-open`); bank `bank/unit10/q3-galvanic.json`; checks `tools/lib/brinewire-q3-checks.mjs`.

Stages: 1 predict (wire alone) · 2 keep the current (salt tube, glass rod, second wire; plot) · 3 electron direction on three cells · 4 mark atoms leave / join from counted windows (earns anode, cathode, oxidation, reduction, galvanic cell) · 5 negative ions in the bridge · 6 weigh strips · 7 shorthand (beyond the exam) · 8 sealed anode.

## Departures from the spec
- Current is E°cell / 2.2 ohm; no bridge (or rod, or second wire): straight fall to zero at 3 s, stated under the plot ("Simplified: a real cell's current would fall to a small trickle") without naming the cause.
- Stage 3 uses a visible dial on each rig instead of separate selectors; Zn|Cu appears again (as listed in the task), so it is not new relative to stage 2.
- Stage 4 windows show metal ions and strip atoms only; stage 5 adds sulfate and bridge ions (K⁺, NO₃⁻). A run moves 4 electrons (a few particles stand for a mole).
- Stage 5 uses Cu|Zn so the anode is on the other side from stage 4.
- Stage 6 uses Fe|Cu run for one hour (the balance reads 0.01 g); strips accumulate change over repeated runs. The balance keeps a list of masses read (the pan prints only while a strip is on it).
- Stage 8 answer is a card ("Strip A/B is the anode"), Ni|Zn with sealed letters; the run is one hour so the balance is usable.
- Stage 7 uses a rail of seven chips plus a plaque that states the notation convention (how-to).
- Lead line made one sentence: "Every marsh cell stopped when a bridge was cut, and Vess wants to find what keeps one running." Chart line likewise. BUILDS_ON is empty; oxidation/reduction are re-earned on stage 4 (VOCABULARY sources match q6's so verify:story passes).
- No + or − on electrodes. CLAUDE.md not edited (integrator's).

## Hints and prompts
See the quest file. Prompts one sentence, at most 25 words. Hints: control / what to compare / method.

## Only a hand can judge
Ammeter needle legibility and dial text size at phone scale; stage 2 plot legend; window particle density at stages 4 and 5; the strip seats in stages 6 and 8 (blank labels); 3D On look of strips and beakers (piece3d/dress3d not seen); feel of the weighing flow.

## Defects found and fixed
Forbidden prop name `link` (renamed `across`); chips too small at 340 px (table narrowed); wire-seat label hidden behind the ammeter; plot title overlapping the fixture label; story bridge ions stacked on one spot.
