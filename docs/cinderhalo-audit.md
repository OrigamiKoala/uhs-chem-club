# Cinder Halo (`unit14`) — Audit

Built 2026-11-14 on `world/unit14` from `docs/plans/cinderhalo-world.md`. 6 benches of 8 stages and the Transmutation Core (5 phases): 53 stages.

## How this was audited, and what it is worth

- **No stage was played by a hand and nothing was seen in a browser.** The owner's standing instruction (`CLAUDE.md`, the global instructions) is that agents do not test in a browser; the owner plays.
- **Scripted:** every stage's solution and miss scripts are replayed through the real action path by `verify:learn`, `verify:table` (drag and two taps, the drawn tabletop's own gestures) and `verify:cinderhalo` (51 typed slips refused with a reason).
- **Bench:** `verify:bench` solved every stage by pointer path, by drag and by two taps, at seven viewports including 812 × 375 phone landscape, with every piece at 28 px or more; it also measured each cell's bay and leaned-in view at 3D On.
- **Code:** every string was read in play order (`node tools/teaching-report.mjs unit14 --read`) and the cold-read fixes are listed below.
- **Not done:** no stage was drawn to PNG (the Thornmere stills tool needs a Node canvas package the project does not ship, and installing one was not cleared); 3D Off and 375 px were not looked at, only measured by `verify:table` (340 px) and `verify:bench` (812 × 375).

Evidence labels below: **S** scripted, **B** pointer path at seven viewports, **C** code read. No row is **Played** or **Viewed**.

## Per-stage table

Operable = a script and a pointer path solve it and refuse the miss with a reason. Intuitive / Busywork / Builds intuition are my reading of the text and the table, not a student's; the owner's play is the judge.

| Stage | Operable | Intuitive | Busywork | Builds intuition | Accurate | AP | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| q1 s1 The Clicking Ore | yes | yes | no | counts against the empty slot | yes | — | S B C |
| q1 s2 Clicks From Nowhere | yes | yes | no | lead housing drops the count | yes | — | S B C |
| q1 s3 Which Element Now | yes | yes | no | proton count changes in front of the student | yes | 1.5 | S B C |
| q1 s4 The Cold Drum (predict) | yes | yes | no | lead clip of a cold chemical reaction | yes | — | S B C |
| q1 s5 The Cold Count | yes | yes | no | the click; atoms slow, counts do not | yes (chemistry can change electron-capture rates by under 0.1 %; not said) | — | S B C |
| q1 s6 Twice the Ore (typed) | yes | yes | some arithmetic | proportional, past the cards | yes | — | S B C |
| q1 s7 Where the Warmth Comes From | yes | yes | no | tracks stop, atoms shaken | yes | — | S B C |
| q1 s8 The Sealed Drums | yes | yes | no | the warm-drum trap | yes | — | S B C |
| q2 s1 Between the Plates | yes | yes | no | tracks bend by charge | yes (plates drawn stronger than real; said in the Tour) | — | S B C |
| q2 s2 Toward the Positive Plate | yes | yes | no | as s1 | yes | — | S B C |
| q2 s3 Heavy and Positive | yes | yes | no | sign and size of bend | yes | — | S B C |
| q2 s4 Through or Not (predict) | yes | yes | no | the click | — | — | S B C |
| q2 s5 Paper, Aluminium, Lead | yes | yes | no | trails of ions, dense to rare | yes | — | S B C |
| q2 s6 Inside the Body | yes | yes | no | breaks per trail (drawn, not printed) | yes, qualitative | — | S B C |
| q2 s7 The Mixed Source | yes | yes | no | counts behind shields | yes | — | S B C |
| q2 s8 Three Sealed Sources | yes | yes | sort of three | shields alone | yes | — | S B C |
| q3 s1 Alpha Decay | yes | yes | no | particle counted leaving; equation writes the pick in | yes | 1.5 | S B C |
| q3 s2 Beta Decay (predict) | yes | yes | no | the click | — | — | S B C |
| q3 s3 Inside Beta Decay | yes | yes | no | a neutron changes colour | yes (neutrino named once) | — | S B C |
| q3 s4 A Positive Electron | yes | yes | no | proton changes | yes | — | S B C |
| q3 s5 Pulled In | yes | yes | no | electron falls in | yes | — | S B C |
| q3 s6 Only Energy | yes | yes | no | nothing leaves but the ray | yes | — | S B C |
| q3 s7 Uranium to Lead | yes | yes | stepping 14 times | the walk is the answer | yes (real series order in the script) | — | S B C |
| q3 s8 Thorium to Lead (typed) | yes | yes | arithmetic | worked case first | yes | — | S B C |
| q4 s1 The Stable Squares | yes | yes | no | the band against the line | yes | — | S B C |
| q4 s2 The Heavy End (predict) | yes | yes | no | the click | — | — | S B C |
| q4 s3 Repulsion and the Strong Force | yes | yes | no | repelling pairs grow faster than held pairs | yes, a drawing (the strong force's range is shown as touching) | 1.7 | S B C |
| q4 s4 Too Many Neutrons | yes | needs the legend read | no | arrow toward the band; no landing preview | yes | — | S B C |
| q4 s5 Too Few Neutrons | yes | as s4 | no | as s4 | yes (EC said) | — | S B C |
| q4 s6 Past Lead | yes | as s4 | no | as s4 | yes | — | S B C |
| q4 s7 The Ratio (typed) | yes | yes | arithmetic | worked case first | yes | — | S B C |
| q4 s8 The Fifth's Isotope | yes | as s4 | no | as s4 | yes | — | S B C |
| q5 s1 Half the Nuclei | yes | yes | no | grid halves | yes (large-sample law said on the grid) | 5.3.A.5 | S B C |
| q5 s2 Two Half-Lives (predict) | yes | yes | no | the click | — | 5.3.A.5 | S B C |
| q5 s3 Sixteen Days | yes | yes | no | 128 → 64 | yes | 5.3.A.5 | S B C |
| q5 s4 Big Sample, Small Sample | yes | yes | no | two grids, one clock | yes | 5.3.A.5, 5.3.A.6 | S B C |
| q5 s5 Five Half-Lives (typed) | yes | yes | arithmetic | past the clock | yes | 5.3.A.5 | S B C |
| q5 s6 The Rate Constant (typed) | yes | yes | arithmetic | ln plot straight; worked case | yes | 5.3.A.3, 5.3.A.5, 5.3.A.6 | S B C |
| q5 s7 The Carbon Clock (typed) | yes | yes | arithmetic | count rate falls by halves | yes (5,730 y conventional) | — | S B C |
| q5 s8 The Unlabelled Vial | yes | yes | no | measure, match | yes | 5.3.A.5 | S B C |
| q6 s1 Whole or Parts (predict) | yes | yes | no | the click | — | — | S B C |
| q6 s2 The Balance | yes | yes | no | the beam tips | yes | — | S B C |
| q6 s3 Mass Into Energy (typed) | yes | yes | arithmetic | worked case first | yes | — | S B C |
| q6 s4 Held Tightest | yes | yes | read a graph | peak of the curve | yes | — | S B C |
| q6 s5 Splitting Uranium | yes | yes | no | mass before and after | yes | — | S B C |
| q6 s6 The Chain | yes | yes | no | generations; the steady setting is not on the rods | yes (3 neutrons is a round figure; 2.4 on average) | — | S B C |
| q6 s7 Joining Hydrogen | yes | yes | no | balance and curve | yes | — | S B C |
| q6 s8 Neither Way | yes | yes | no | unnamed marks on the curve | yes | — | S B C |
| boss p1 The Vented Cans | yes | yes | no | new case of q1 s5, s8 | yes | — | S B C |
| boss p2 The Leaking Cask | yes | yes | no | new case of q2 s7 | yes | — | S B C |
| boss p3 The Coolant | yes | yes | no | new case of q3 s3 | yes | — | S B C |
| boss p4 The Burned-Out Source (typed) | yes | yes | arithmetic | new case of q5 s5 | yes | 5.3.A.5 | S B C |
| boss p5 The Core Itself (typed) | yes | yes | arithmetic | new case of q6 s3, s5 | yes | — | S B C |

## Cold-read fixes (2026-11-14)

- "push", "pushes" (a stand-in for repulsion) in q2 s1 and q4 s2, s3, the nucleus view's footer and the q4 story beat: now "repel", "repulsion", "proton pairs repelling · touching pairs held"; q4 s3 retitled *Repulsion and the Strong Force*.
- q5 s1 hint 3 gave the arithmetic (half of 256); q5 s6 hint 3 gave the move: both rewritten to the method.
- q4 s4, s5, s6, s8: the chart drew where each tapped move would land, so three taps found the answer. The landing is no longer drawn (`preview: false`); a miss names where the move lands. Hint 3 on each was the move; rewritten to "follow each arrow and ask which heads toward the filled squares".
- q1 s4 hint 2 said "where reactions happen"; now "where chemical reactions happen".

## Still open (most likely to lose a student first)

1. q4 s4 to s8 rest on reading the legend's arrows on a fine chart (cells about 3 units at Z 1 to 10); whether a 12-year-old reads the arrows as moves is the owner's to judge.
2. The typed stages (9 of 53) are arithmetic after a worked case; whether they feel like understanding is the owner's to judge.
3. q3 s7 needs fourteen taps; Undo takes one back.
4. The tissue strip (q2 s6) draws broken molecules as a picture, not a measurement; the stage's reward says only what the picture shows.
5. The saga's Cinder Halo paragraphs (`src/story/saga.js`, written before this build) call the world "an abandoned space station" and say the core could "detonate in a nuclear blast"; the bench teaches that a reactor's chain runs away by heat, not as a bomb. Changing lore is the owner's decision.

## Owner's list

See `docs/plans/cinderhalo-world.md` section 8 (the stages only play can judge, and the 3D viewing list).
