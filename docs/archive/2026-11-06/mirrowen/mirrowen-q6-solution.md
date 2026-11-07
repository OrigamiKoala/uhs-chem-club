# Mirrowen `q6-solution` — Taken Into Solution (stage table and build record)

CED 3.7 (3.7.A.1, 3.7.A.2), 3.8 (3.8.A.1), 3.10 (3.10.A.1), 6.1.A.4, 6.4.A.7. Eight stages, one click. Files: `src/learn/quests/unit06/q6-solution.js`,
`src/learn/table/kits/matter-flask.js` (the flask bench and the `sample` card), `src/learn/engine/matterdata-flask.js` (window drop, particles per mole,
solubility rows, bath change), `src/ui/story-scenes-mirrowen-q6.js` (`solution-drop`), `tools/lib/mirrowen/q6-solution.mjs`, plus the marked entries in the chart,
`stage-story.js`, `quest-story.js` and the `q6-solution` keys of `bank/unit06.json`.

## The instrument: the flask bench

A balance pan (optional), a volumetric flask with a mark on its neck, and a window that draws a small drop of the flask, particle by particle. There is no key: a card
seated in the flask's mouth, or a dial turned, answers at once. Dials (a stage uses at most one): `Flask` (100, 250, 500 mL, always filled to its mark), `Stock poured in`
(10 to 50 mL, topped up to a fixed 100 mL), `Liquid` (water or oil). The drop is the same size every time and holds `BOX_PER_M = 20` formula units for every 1.00 mol/L, so a
crowded window is a concentrated flask. An ion is drawn with three water molecules touching it; its cation carries a +, its anion a −. A card that has been on the pan keeps its
grams (`weighed`); a dry card that has been in the flask keeps a line for what the window showed (`water: spreads`, `oil: lumps`).

Chemistry simplifications (stated in `matterdata-flask.js`): the drop is a sample, not the flask; three waters per ion stand for a hydration shell of four to nine; the solution's
volume is the mark; ion sizes are scaled but never drawn smaller than a readable disc.

## Stages

Ramp for the numeric stages: picture (stage 2's window thins as the flask grows), prediction (stage 4), proportional (stage 3's dial: 20 mL reads 0.400 M, 30 mL reads 0.600 M), formula
as shorthand (reward of stage 3), friendly numbers (5.85 g is exactly 0.100 mol), a figure between and past the steps (25.0 mL; 1.81 × 10²³).

| # | Prompt | Evidence on the bench | Everything it prints, and why none of it is the answer | Wrong answer and message | Form |
| - | --- | --- | --- | --- | --- |
| 1 | File each white powder by what it does when it goes into water. | Flask, window, four samples (A NaCl, B chalk, C sugar, D sand), trays "Spreads out" and "Stays in lumps". | Cards say "Sample A" and "white powder" only; the card learns its water line from the window. The tray names are what the window shows, not which powder is which. | A in "Stays in lumps": "Sample A sits in the 'Stays in lumps' tray, and in the window its particles sat apart from one another." An unseen card: "has not been in the flask yet." | flat |
| 2 | Type the moles of salt in each litre of solution once the salt on the pan is made up to 400 mL. (0.250 mol/L; 400 mL is not a step of the Flask dial, which reads 0.400 M at 250 mL and 0.200 M at 500 mL) | Pan reads 5.85 g, plate gives 58.44 g per mole, flask dial 100/250/500 mL, window crowd. | Molar mass is a constant the stage needs. No molarity printed. The prompt defines the measure in plain words. | 0.100: "0.100 is the amount of salt on the pan alone, and the solution is 400 mL." Other: "{v} does not fit 5.85 g of salt made up to 400 mL." | flat |
| 3 | Type how many mL of the 2.00 M stock make 100 mL of 0.500 M when topped up with water. (25.0 mL) | Stock card, dial 10 to 40/50 mL (steps, not 25), the molarity under the window, plate "Wanted: 100 mL of 0.500 M". | The molarity at each step. 25 is not a step; it lies between 20 (0.400 M) and 30 (0.600 M). | 50: "50 mL does not give 0.500 M: the dial reads 1.00 M at 50 mL." 400: "more than the 100 mL flask holds." | flat |
| 4 | PREDICT: Which puts the most particles in the water: 0.100 mol of table salt, of calcium chloride, or of sugar? | Only four cards and a slot. | Cards: "All three put the same number in" (the held belief), "Table salt, NaCl", "Calcium chloride, CaCl₂", "Sugar, C₁₂H₂₂O₁₁". | Blank: "Lay a card in the slot." The guess is never graded. | flat |
| 5 | You guessed {…}: type the particles that 0.100 mol of calcium chloride puts in the water, in units of 10²³. (1.81) | Flask (500 mL), three cards of 0.100 mol, window drop of 4 formula units each (8, 12 and 4 particles), plate "One mole: 6.022 × 10²³ particles". | No count printed; the player counts the kinds of particle. N_A is a constant the stage needs. | 0.602: "is one particle for each calcium chloride, and the window shows more than one in the water." Other: "does not follow from the 0.100 mol on the card and the particles the window shows." | flat |
| 6 | File each sample under the solvent, or both solvents, that it dissolves in. | Flask with a Liquid dial (Water, Oil (hexane)), four samples (salt, wax, acetone, sugar), trays Water, Oil, Both. | Cards keep a `water:` and an `oil:` line from the window. Names are plain; nothing says "polar". | Salt in "Both": "Salt sits in the 'Both' tray, and its card reads water: spreads, oil: lumps." Unseen: "has not been in both liquids yet." | flat |
| 7 | Order the four salts by the temperature the bath ends at after each dissolves in it. | The heat kit's cup (100 g, 22 °C), four tins of 0.100 mol, a strip "Coolest bath … Warmest bath". | The cup prints bath and rise; a tin keeps its change once it has been in. | By size of change: "Sodium chloride sits left of Potassium chloride, and the bath changed −0.9 °C for the one and −4.1 °C for the other." | flat |
| 8 | Order the three sealed flasks by the molarity of what was dissolved in each, lowest first. | Flask with a particle count, three sealed flasks X (NaCl 0.300 M), Y (sugar 0.600 M), Z (CaCl₂ 0.200 M), a strip. | The window prints "12 PARTICLES" for every one; the cards say "sealed". The player must work back from the particles to the dissolved units. | Y first: "Y sits left of X, and the drop of Y shows 12 whole molecules against 6 positive and 6 negative particles for X." | flat |

## Hints, rewards

Each stage has the three rungs in the file (rung 1 names the control, rung 2 what to look at, rung 3 the method; none gives a number). Rewards: 1 "Solutions" (solution, solute, solvent), 2 "Molarity",
3 "Dilution", 4 "Now Test It" (prediction), 5 "Dissolving Into Ions", 6 "Like Dissolves Like" (like dissolves like, miscible, soluble), 7 "Heat of Solution" (exothermic and endothermic dissolving, 6.1.A.4, 6.4.A.7),
8 "Same Crowd, Different Molarity". No stage carries a reward model: the window is the picture and stage 5's rule is already shown there.

## The click

The belief is "a mole of anything dissolved puts a mole of particles in the water". Stage 4 offers it as a card; stage 5's window shows the same four units of each as 8, 12 and 4 particles; stage 8 uses
the contradiction again (equal crowds, unequal molarities).

## Logged gaps and what is weak

- Mass percent (CED 3.8, excluded from the exam) has no stage. The spec asked for it as stage 7; with the click pair and the cup it did not fit in eight stages without padding.
- Stage 2 is the weakest: the figure is a plain conversion, and every constant is on the bench. The window that thins with the flask and the prompt's plain-words definition are the only picture behind it; it is friendly numbers, not past the dial.
- The like-dissolves-like stage (6) is a sort with no prediction pair, since the click is stage 4/5. Acetone is the stage's trap (it dissolves in both); a student with no prior idea can still get it from the card lines but must make eight looks.
- Ion discs of Na⁺, K⁺ and Ca²⁺ are drawn larger than their radii to stay legible, so the picture's size ratios between a cation and an anion are only roughly honest.
- Stage 7 is a rank of readings the cup produces (the accepted pattern of Ember Reach), not a calculation; the ΔH of solution is never shown to the player.
- No `dress3d` or `piece3d`: the flask bench and cards are flat in both views.

## Verification

`node tools/verify-learn.mjs`, `verify-table.mjs`, `verify-story.mjs` pass for this bench; `tools/lib/mirrowen/q6-solution.mjs` re-derives molarity, dilution, N_A arithmetic, bath changes, the sealed flasks' molarities and each window's counts from hand-worked values and the CRC.
