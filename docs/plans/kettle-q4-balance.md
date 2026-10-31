# Kettle `q4-balance` — Balancing Equations (design and build record)

CED 4.3 (representations of reactions). Module `src/learn/quests/unit07/q4-balance.js`; kit `src/learn/table/kits/pot-balance.js`; planners `src/learn/engine/reactdata-balance.js` (over `reactdata.js` `parseEquation`, `atomLedger`, `balance`, `equationText`); checks `tools/lib/kettle-q4-balance-checks.mjs`; scene `recipe-board` in `src/ui/story-scenes-kettle-q4.js`.

## The bench

The furnace control room. One **board** (a line of formulas with a dial under it for each number the player sets), a **particle window** that draws exactly what the board says (small clusters of atoms, before the change left and after it right), an **atom ledger** (rows per kind of atom: count left, count right; no tick, no lamp, the player compares), and per stage a **tally** (stage 1), **state tiles** (stage 5) or a **formula builder** (stage 8). Dials are integers 1 to 6 (0 to 6 on the tally and the builder).

- Words earned: *chemical equation, reactant, product* (stage 1), *coefficient* (stage 3), *state symbol* (stage 5). Before a word is earned the board, ledger and Tour use plain labels (`lex` 0, 1, 2 on the board fixture); a dial is labelled by the term it sets (`2 H₂`), never by the word.
- Builds on `unit07/q1-recipe` (atoms are not destroyed) and `unit06/q1-states` (solid, liquid, gas pictures).
- Lead line: the furnace recipe card on the control-room wall has no numbers, and Vess cannot tell whether it is right. Filed: the furnace recipe, Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂, is balanced.

## The click and the wrong model

Students hold **"to balance it, change the little numbers"** (the small numbers inside a formula). Stage 2 asks them to commit to a way (a card for each: change a small number / put a number in front / add the missing atom). Stage 3 offers both on the board: a dial for each coefficient and a dial that turns the small number after the O of H₂O. Turning it gives H₂ + O₂ → H₂O₂, which **agrees in atoms** (2 H and 2 O each side) and is refused because the window now draws a different molecule. The refusal names what the window shows ("The window now shows H₂O₂ after the change, a different molecule from the one you started with") and never the rule. The reward then states it.

## Stages

Quantity ramp: counting a picture (1), then a prediction (2), then a first balance (3), a diagram read for what changed (4), notation (5), a larger balance (6), a balance by pieces (7), a formula deduced from a picture (8). No arithmetic past counting and sharing; the typed-figure rung does not apply (stage 8 is a built formula, see "weak").

| n | Prompt | Evidence on the bench | Prints (and why none is the answer) | Wrong answer → message | Hints (1 control · 2 compare · 3 structure) | Answer |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Count the oxygen atoms the window shows before the change and after it, and set the tally to match. | board `H₂ + O₂ → H₂O` (no dials), window, tally (two dials from 0) | the equation line and the picture; the tally starts at 0 and prints no count; the ledger is off | before 2 / after 2 → "The right half of the window does not show that many oxygen atoms." (no number in any refusal) | tally dials · count each half · add the oxygen of every cluster | before 2, after 1 |
| 2 | PREDICT. Choose how you would make the oxygen atoms agree on both sides of H₂ + O₂ → H₂O. | cards only (plaque with the line) | none | never graded | cards · what each change does to atoms and substances · commit, test next | any card (recalled by stage 3) |
| 3 | (Your guess,) make the atoms on the left of the arrow agree with the atoms on the right. | board with three coefficient dials and the small-number dial, ledger, window | the ledger prints the starting counts (H 2 / 2, O 2 / 1); nothing says which dial | small number turned → "different molecule" (see above); counts disagree → "The ledger counts O: 2 on the left and 1 on the right." | dials and ledger · compare columns after each turn, watch the window · one dial changes how many, the other changes which | any whole-number set that agrees with the small number left alone (2 : 1 : 2 and its multiples) |
| 4 | Set the board so the equation describes the change in the window. | locked pot diagram (1 Fe₂O₃ + 4 CO before; 1 CO, 2 Fe, 3 CO₂ after, from `reactPlan`), four dials, no ledger | the diagram only (it is a pot, not the equation); the lead-line stake is the furnace recipe | CO set to 4 (the number before the change) → "The window shows 1 CO still there after the change."; other mismatch → "The board does not match the number of X in the window." | dials · compare before with after, one substance at a time · only molecules that changed belong in the equation | 1 : 3 : 2 : 3 |
| 5 | Write the state of each substance after it on the board. | `2 Na + 2 H₂O → 2 NaOH + H₂`, four tiles with their words ((s) solid, (l) liquid, (g) gas, (aq) in water), a slot under each substance, window drawing each substance in its own state | how the particles sit; the tiles say what each symbol means (how to answer), not which belongs where | a tile on the wrong substance → "Na is marked (g), but the window does not draw its particles far apart." (uses the player's choice, never the real state) | drag a tile · how each substance is drawn · match each way of sitting to a tile | Na (s), H₂O (l), NaOH (aq), H₂ (g) |
| 6 | Make the atom counts agree on both sides for propane burning in oxygen. | C₃H₈ + O₂ → CO₂ + H₂O, four dials, ledger, window | ledger counts only | O₂ set to 2 → "The ledger counts O: 4 on the left and 10 on the right." | dials and ledger · compare one atom at a time · fix the atoms found in one substance each side first, oxygen last | 1 : 5 : 3 : 4 (the only set in range 1 to 6) |
| 7 | Make the pieces on the left of the arrow agree with the pieces on the right. | Ca(OH)₂ + H₃PO₄ → Ca₃(PO₄)₂ + H₂O; the ledger counts Ca, H, OH and PO₄ once each; the window rings OH and PO₄ where they stay whole (the water's OH is ringed) | the ledger of pieces | mismatch on OH → "The ledger counts OH: 6 on the left and 3 on the right." | dials · look at the rings · pieces that appear once each side first | 3 : 2 : 1 : 6 (the only set in range) |
| 8 | Build the formula of the substance in the sealed bags. | `P₄ + 5 O₂ → 2 ?`, window (1 P₄ and 5 O₂ before, two sealed bags after), formula builder (P atoms, O atoms dials from 0) | the bags print `?`, the formula is nowhere on the table; the ledger is off so the player counts | P₄O₅ → "P₄O₅ has 4 P and 5 O, and the window shows 2 sealed bags after the change." | builder dials · count the left half, see how many bags · the atoms in the bags are the atoms that went in, shared equally | P₂O₅ (order of dials immaterial) |

Rewards: 1 reactants and products (the line shows 2 O before, 1 after); 3 the coefficient (and what a small number is; the verdict on the guess comes first); 4 the furnace recipe; 5 state symbols; 6 propane; 7 groups that stay whole; 8 an unknown formula from the atoms. Predict stage 2's card says only "Now Test It".

## Flat or 3D

Flat. The window is a counted picture (clusters of atoms drawn from `shapeOf`, whose atom counts are held to each formula in Node); `3D Off` and `3D On` draw the same picture. No `dress3d` solids: the particle window would be the natural candidate (spheres on a base), and is left for the integrator's play to judge.

## What is weak

- The window's atoms are small on a 375 px phone (an atom is 3 to 7 px across at the plate scale; hydrogen is the smallest). Counting oxygen on stage 1 is possible but not generous; the lean-in view helps. Raise `K` in `pot-balance.js` or enlarge the window if play says so.
- Stage 1 asks the player to read a picture (rung P of the ramp). It is a count, not a copy of a printed label, but it is the nearest thing to "report what is visible".
- Stage 3 accepts any set that agrees (2 : 1 : 2 and 4 : 2 : 4 and 6 : 3 : 6); the "smallest numbers" convention is not taught, since dials cap at 6 and stages 6 and 7 have one answer in range.
- Stage 4 grades the coefficients against the diagram's change, so a set that balances but doubles the diagram (2 : 6 : 4 : 6) is refused with a message about the number of Fe₂O₃ in the window.
- Stage 8 is a built formula (two dials, 0 to 6), not a typed one: the frame's number field opens a numeric keypad on a phone, which cannot type letters. No shared file was changed.
- State symbols: the real state of each substance is a datum (`STATE_OF`) for the one equation used; other equations would need entries.
- The molecule drawings are clusters of touching atoms, not bond-accurate shapes (water is bent, carbon dioxide linear, the rest are plausible clusters). Nothing says more than the formula does.
