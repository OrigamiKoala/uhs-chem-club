# Brinewire boss-clamp: build notes

Scope: the Clamp's five phases, its table foe (planner, portrait, body), the finale `clamp-open`, the unit10 saga entry and clue, the end-of-world bank set, the chart line and the checks. The arena body (`boss-models.js` `buildClamp`) and the arena spot (`boss-arena.js`) were built earlier and are untouched.

## What was built

- `src/learn/quests/unit10/boss-clamp.js`: 5 phases, species `the clamp`, clue `clue_brinewire_clamp`, no lead line, no predict, no field, no VOCABULARY (a boss earns no word). `BUILDS_ON` = q2 to q6. Every phase is a new case on a finished bench's own fixtures:
  1. `p1-rank`: dip rack (`celldip`), rank iron, nickel, tin and silver (rail). Beakers, strips and cards each stand in an order that is not the answer's.
  2. `p2-anode`: open cell rig (`cellgalv`) with silver left and magnesium right, ammeter only; answer dial "The anode is" (left strip / right strip).
  3. `p3-volts`: potential board (`cellboard`), typed E°cell of iron and silver (1.24 V, within 0.02 V).
  4. `p4-bar`: concentration cell (`cellloadcc`), zinc, 0.010 M on the left and 1.0 M on the right; answer dial "Electrons leave" (left bar / right bar).
  5. `p5-plate`: supply bench (`cellsupply`, plate scene), typed grams of zinc plated by 1.50 A for 20.0 min (0.61 g, within 0.012 g).
- `foes.js`: `the clamp` (poses `idle`, `unmoved`, `live`, `flat`, `reversed`, `dispersed`; probe `{ kind: 'cell', E }` as a voltmeter reads a cell, or `{ pose }` on a table), `clampArt` portrait. `foebody.js`: `buildClamp` (mast, five cells, two arms with jaws), in `BODY_SPECIES`.
- `src/ui/story-scenes-brinewire-boss.js` `clamp-open` (5 beats; registered in `story-scenes.js`), `QUEST_STORY['unit10/boss-clamp']`.
- `saga.js`: `CLUES.clue_brinewire_clamp` ("The Marsh Copper") and the unit10 episode rewritten (arrival, closing, paragraphs, incident, objective, caseFileNote, `bossId`, `clueId`).
- `bank/unit10.json`: `end` = 7 problems (`q1-halves#e1`, `q2-activity#e1`, `q3-galvanic#e1`, `q4-potential#e1` coupled reactions through a shared intermediate (CED 9.7.A.2), `q4-potential#e2`, `q5-load#e1` Le Chatelier does not apply to a running cell, `q6-electrolysis#e1`) and `bench['boss-clamp']` = 2 problems (the bank checker requires two for every live quest, a boss included; Verdigris did the same).
- `worlds/unit10-electrochemistry.js`: the 7th chart line, `boss-clamp`, `arena: 'boss'`, `stageCount: 5`.
- `tools/lib/brinewire-boss-checks.mjs` (hand-worked values in its header) hooked in `verify-learn.mjs`; `boss-clamp` added to the boss loop and pose lists of `verify-bench.mjs` and to the boss list of `verify-story.mjs`. `verify-arena.mjs` already named the clamp.
- `node tools/gen-brinewire-layout.mjs` was rerun (no change: the boss has no site).

## Where this parts from the spec

- **Phase 1 uses Fe, Ni, Sn, Ag, not Pb, Sn, Fe, Ni.** Tin (E° −0.138 V) and lead (−0.126 V) differ by 12 mV, K for Sn + Pb²⁺ is about 2.5, so a real dip shows a partial swap in both directions and the planner's clean "coats / stays clean" would be a falsehood. The new set keeps every gap above 0.1 V.
- **Phase 2 has no ion windows.** `windowCounts` is drawn for 2+ ions only and silver is 1+, so the pair is judged on the ammeter alone (needle direction and its printed meaning), like q3 s3. The refusal names the needle and the reading in amperes.
- **Phase 4 asks left or right bar**, not "the bar in the 1.0 M / 0.010 M beaker" (q5 s5's wording), so the answer needs the new beaker order (dilute on the left) and not a remembered option.
- **Phase 5 is zinc**, not nickel: nickel is already q6 s8's sealed plate. The tolerance is 0.012 g (not 0.02) because copper's molar mass gives 0.593 g, 0.017 g away: at 0.02 that slip would be accepted as correct.
- **Phase 3 adds a slip** the spec did not list: silver's reading counted twice (2.04 V), a student's habit of scaling a reading with the equation.
- The finale's Filed line carries the spec's "its power was the marsh's own copper". No phase measures that; it is the one sentence of the finale that leans on the saga and on q6's Filed line rather than on a number.

## Hints and prompts as built

1. "Rank iron, nickel, tin and silver from the metal that gives electrons most readily to the one that gives least." Hints: dip the strips, then drag the four name cards onto the rail / each beaker keeps a mark for every strip dipped in it, compare which were coated / rank by how many of the other solutions each coated in.
2. "Find the anode of the magnesium and silver cell." Hints: press "Run", read the ammeter, use the answer dial / which way the needle swings and what the ammeter's dial says it means / the electrons move toward one beaker, so they left through the other strip.
3. "Find the voltage, in volts, of a cell made from iron and silver." Hints: read both electrodes, type the voltage / compare the two readings / take the lower away from the higher.
4. "Run the zinc cell and say which bar the electrons leave." Hints: press "Run", read the ammeter, use the answer dial / compare the needle's side with the strength printed under each beaker / find the bar the electrons move away from, left or right.
5. "Find the mass of zinc, in grams, plated by 1.50 A running for 20.0 minutes." Hints: pick current and time, press "Run", type grams / compare how the plated mass changes with current and time / charge to moles of electrons, then half-reaction line to moles and grams of zinc.

## Defects found in other builders' files (not edited)

- `q2-activity` stage 2: the name cards stand at x = 20, 52, 84, 116 in the order zinc, iron, lead, copper, which is also the answer (and the strips and beakers stand in that order too). The rail can be solved by reading the layout. Phase 1 here shuffles the cards and the beakers.
- `q2-activity` stage 2 pairs tin and lead nowhere, but `celldata.js` `displaces` treats any E° difference above 1e-9 V as a clean coating; any future stage that puts Sn and Pb in one rack will be wrong for the same reason as above.
- `windowCounts` throws for 1+ ions, so no open-cell stage can show silver's windows.

## What only a hand can judge

Whether the Clamp's body reads as a drain clamp at corner scale (0.6 of the arena scale; five cells, two jaws); the feel of the phase 1 rack (12 dips) on a phone; whether phase 2 without windows is enough evidence for a student who has not read the ammeter's printed dial; the finale's pacing and the scene art; the bench tables at 375 px in game mode.
