# Ember Reach teaching pass (2026-11-06)

Run from `docs/fix-world-teaching-prompt.md` for WORLD = Ember Reach, UNIT = unit05. Nothing was played in a browser; the owner play-tests (`CLAUDE.md`). Checks: `npm run verify:teaching` (Ember is `tools/verify-teaching-ember.mjs`), `verify:table`, `verify:bench`, `verify:learn`, `verify:ember`, `verify:run`, `npm run build`.

**This pass is partial in one respect, and says so.** Every stage now has a moving model; seven stages and the Crucible's last phase change what the student *does* to the particles. The rest still grade a typed number, a card in a slot or an answer dial, now with the cause moving beside the answer. The rebuilt-from-scratch bench the prompt asks for (every graded move is a hand on a particle) was not reached for the calculation stages.

## Tally

| | Stages |
|---|---|
| Total (7 benches 5+8+8+6+4+5+6, Crucible 5) | 47 |
| Static before the pass (no clock anywhere in the heat kit) | 47 |
| With a moving model now | 47 |
| Static now | 0 (no exception file needed) |
| Graded move is a hand on the particles or the apparatus | q1 1, 3, 5 (join blocks), q1 4 (drop samples in the cup), q2 2, 4, 5, 6 (heater, ice, fitting, mix), q3 1 (drag the products level), q3 4 (rank by the water's rise), q4 2 (drag the atoms apart), q6 2 (shake), q7 2/5 and Crucible 5 (the ball on the line shows the crossing; the answer is still typed) |
| Graded move is a calculation (typed number or answer dial) with the model beside it | q2 3, 7, 8, q3 2, 5, 6, 7, 8, q4 6, q5 3, 4, q6 5, q7 4, 6, Crucible 1, 2, 3, 4 |
| Predict stages with a lead-in clip | 8 of 8 (q1 2, q2 1, q3 3, q4 1, q4 4, q5 1, q6 1, q7 1) |
| Stages added or cut | none (ids and counts unchanged) |

## What was built

- **`kits/heat-motion.js`** (new): the moving models, all pure functions of the table state and the clock, drawn flat on the 2D table and run against the recording context (`pans-3d.js` `dressRecorded`) for the 3D crowd. Cup (water molecules at the bath temperature, a glide to the new reading, packets of energy in the direction of the planner's sign, ice that loses atoms as it melts, a metal bath as a lattice), `lattice` (new fixture: each block's atoms, count by mass, shake by temperature, packets across joined blocks), `rxn` (new: a reaction as atoms; bonds break, atoms travel, new bonds form), `curve` (new: a sample heated or cooled through its phases by a burner the student drags, with the temperature–heat trace), `lead` (new: lead-in clips), shelves (marble and energy packets), plot (ball and the two pulls), stack (species that cancel).
- **In `heat-draw.js`**: the bath thermometer and the block readings glide; the bond atoms shake, and in the Broken tray they pull apart; phase and change cards' particles shake; the warm sample's particles bounce at the speed the temperature gives; the chamber's beads fly to their cells; line cards carry a running ball.
- **In `heat.js`**: `live`, `onMiss` (a miss restarts every glide: the bath, the blocks and the burner replay their cause), `tapZones` (drag the atoms apart; drag the products level; drag the ball along the line; drag the burner), the 3D crowd merged with the existing solid dresses, constructors `latticeFixture`, `rxnFixture`, `curveFixture`, `leadFixture`.
- **Shared code touched**: `table2d.js` passes the clock to piece painters; `gestures.js` `tapDrag` takes `axis: 'x'`; `pans-3d.js` exports `dressRecorded`; `verify-table.mjs` and `verify-bench.mjs` drive an x-axis drag zone; `ember-learn-checks.mjs` allows the `lead` clip on a predict stage.
- **Glossary** `src/learn/glossary/ember.js`: 23 terms (gloss, first stage, banned words, primers offered at five stages). Registered in `glossary/index.js`, so the bench frame's Glossary key and the hint panel's "What is this?" work.
- **Language**: `tools/lib/rewrite-ember-text.py` (string literals only) renamed *tin* → sample, *ledger* → bond table, *chip* → bond card, *shelf* and *chart* → energy level and diagram, *marker* → dial; the *crank* is gone from play text (the dial reads "Pull"); *room* became volume or ways; the bank and the Tour follow. Internal ids (`crank`, `chart`, `ledger`, `marker`) were not renamed.
- **Reading load**: ten reward cards over two sentences or 40 words were rewritten to one fact each; the derivations stay in the bank's worked problems.
- **Tour**: `kits/heat-tour-min.js` replaces every step with at most 16 words and a film (a real stage's own scripted solution, or a hand moving the dial). Particles move in the film because the film is drawn by the bench's painters.
- **Checks**: `tools/verify-teaching-ember.mjs` (banned words, define on first use, needs map, every moving model moves, stands still when frozen, responds to its control, stays under 160 circles; 3D crowd moves, holds still, stays under 220 spheres; a miss restarts the bath; Tour short and moving; static ratio per world and per bench; lead-in on every predict stage; reading load ratchet `tools/teaching-ratchet-ember.json`).
- **Doctrine**: `WITHHELD_VOCAB` had no Ember entries, and `CLAUDE.md` already carries the new language rule, so nothing was removed there.

## Stage audit

Before: no stage had anything that moved in time (the heat kit had no clock), so every row was static and every picture was a reading. Words before: *tin*, *ledger*, *crank*, *chip*, *marker*, *shelf*, *chart*, *room* and the *knock/push* family stood where *sample*, *bond table*, *bond card*, *energy level*, *dial* and the real quantity belong. Prerequisites: moles (Tallow), kelvin (Bellows) and bonds (Ligar) were assumed; they are now glossed as recaps and `NEEDS` offers the amount and ratio primers at five stages.

| Stage | Before | Prompt | What moves now | Graded move |
|---|---|---|---|---|
| q1-flow:1 Where Two Blocks Meet | static (no clock in the kit) | Join two blocks so that both finish at 50 °C. | block atoms shake with temperature; packets cross joined blocks; block reading glides | join two blocks (the blocks are the particles' carrier) |
| q1-flow:2 Which Would Thaw It? | static (no clock in the kit) | Which will warm the frozen valve more: the welding spark or the warm tank? | lead-in clip of a neighbouring case | card in slot (prediction) |
| q1-flow:3 The Spark and the Tank | static (no clock in the kit) | Warm the frozen valve as far as you can by joining it to a source. | block atoms shake with temperature; packets cross joined blocks; block reading glides | drag the valve onto a source |
| q1-flow:4 Warmers, Packs and Tablets | static (no clock in the kit) | Sort each sample by whether heat left the chemicals or entered them. | water molecules move at the bath temperature, packets of energy cross | drop samples in the cup, sort by what the water did |
| q1-flow:5 Unequal Blocks | static (no clock in the kit) | Join two blocks so that both finish at 27 °C. | block atoms shake with temperature; packets cross joined blocks; block reading glides | join two blocks |
| q2-calorimetry:1 Water or Iron? | static (no clock in the kit) | The same heat goes into 100 g of jacket water and 100 g of iron pipe: which warms up more? | lead-in clip of a neighbouring case | card in slot (prediction) |
| q2-calorimetry:2 Equal Rises | static (no clock in the kit) | Set the iron's heater so the iron rises as far as the water does. | water molecules move at the bath temperature, packets of energy cross | iron heater power dial |
| q2-calorimetry:3 The Heat Equation | static (no clock in the kit) | Type the heat the water bath absorbed, in joules. | water molecules move at the bath temperature, packets of energy cross | typed joules |
| q2-calorimetry:4 Ice in the Bath | static (no clock in the kit) | Type the heat the ice absorbed while it melted, in joules. | water molecules move at the bath temperature, packets of energy cross; block reading glides | typed joules after dropping ice in |
| q2-calorimetry:5 Naming a Metal | static (no clock in the kit) | Which metal is the siphon fitting? | water molecules move at the bath temperature, packets of energy cross; block reading glides | drop fitting in, name card |
| q2-calorimetry:6 Catching a Reaction | static (no clock in the kit) | Type the heat the reaction gave out into the bath, in joules. | water molecules move at the bath temperature, packets of energy cross | typed joules after dropping the mix in |
| q2-calorimetry:7 Ice to Steam | static (no clock in the kit) | Type the heat needed to turn 10.0 g of ice at 0 °C into steam at 100 °C, in kilojoules. | sample changes phase as the burner is dragged; trace of temperature against heat | typed kJ (burner drag shows the phases) |
| q2-calorimetry:8 Steam to Water | static (no clock in the kit) | Type the heat given out when 10.0 g of steam at 100 °C turns into water at 25 °C, in kilojoules. | sample changes phase as the burner is dragged; trace of temperature against heat | typed kJ (burner drag shows the phases) |
| q3-enthalpy:1 The Diagram for a Powder | static (no clock in the kit) | Set the diagram to the energy change per mole of the powder. | water molecules move at the bath temperature, packets of energy cross; marble rolls over the energy diagram; energy leaves or enters | drag the products level on the energy diagram |
| q3-enthalpy:2 More Powder, More Heat | static (no clock in the kit) | Type the heat that 0.30 mol of the powder gives out, in kilojoules. | water molecules move at the bath temperature, packets of energy cross | typed kJ (moles dial on the cup) |
| q3-enthalpy:3 Which Fuel? | static (no clock in the kit) | Which fuel gives the skiff the most heat from every gram of its tank? | lead-in clip of a neighbouring case | card in slot (prediction) |
| q3-enthalpy:4 Ten Grams Each | static (no clock in the kit) | Order the four samples by how far each warms the same tank. | water molecules move at the bath temperature, packets of energy cross | rank samples on the rail by the water's rise |
| q3-enthalpy:5 Per Equation | static (no clock in the kit) | Type the heat released when 6.0 g of hydrogen burns, in kilojoules. | atoms: bonds break, atoms travel, new bonds form | typed kJ |
| q3-enthalpy:6 The Bath's Final Temperature | static (no clock in the kit) | Type the temperature the bath reaches with 0.25 mol of the powder, in °C. | water molecules move at the bath temperature, packets of energy cross | typed final temperature |
| q3-enthalpy:7 Which Runs Out? | static (no clock in the kit) | Type the heat given out when the acid and the base react completely, in kJ. | atoms: bonds break, atoms travel, new bonds form | typed kJ |
| q3-enthalpy:8 The Way Back Over the Hill | static (no clock in the kit) | Type the activation energy of the reverse reaction, in kJ. | marble rolls over the energy diagram; energy leaves or enters | typed kJ |
| q4-bonds:1 Pulling Atoms Apart | static (no clock in the kit) | Two hydrogen atoms are held together by a bond: does pulling them apart take energy in or give energy out? | lead-in clip of a neighbouring case | card in slot (prediction) |
| q4-bonds:2 Pulling a Bond Apart | static (no clock in the kit) | Pull the bond completely apart, then set the dial to the energy change of the two atoms. | atoms shake; bond stretches as pulled | drag the atoms apart, then the number dial |
| q4-bonds:3 Burning Methane, Bond by Bond | static (no clock in the kit) | Fill the bond table for burning methane: put each bond in its tray and set how many of it there are. | bond atoms shake, pulled apart in the Broken tray | bond cards into trays, scale them |
| q4-bonds:4 Air Joins Up | static (no clock in the kit) | Nitrogen and oxygen in air can join to make nitric oxide: will that reaction warm the bath or cool it? | lead-in clip of a neighbouring case | card in slot (prediction) |
| q4-bonds:5 The Air Bond table | static (no clock in the kit) | Read the bond table and lay the card for what the bath will do. | bond atoms shake, pulled apart in the Broken tray | read bond table, card in slot |
| q4-bonds:6 Estimating a ΔH | static (no clock in the kit) | Set the dial to the estimated ΔH for H₂ + Cl₂ → 2 HCl, in kJ. | bond atoms shake, pulled apart in the Broken tray | bond cards, number dial |
| q5-hess:1 One Step or Two? | static (no clock in the kit) | Carbon can burn to carbon dioxide in one step or through carbon monoxide in two: which route gives out more heat? | lead-in clip of a neighbouring case | card in slot (prediction) |
| q5-hess:2 Two Routes, One Total | static (no clock in the kit) | Build C(s) + O₂(g) → CO₂(g) on both stacks, by two different routes. | species cancel when on both sides | reaction cards onto two stacks |
| q5-hess:3 Building Methane | static (no clock in the kit) | Make the stack add up to C(s) + 2 H₂(g) → CH₄(g), then set its net ΔH. | species cancel when on both sides | reaction cards on the stack, answer dial |
| q5-hess:4 Down to the Elements and Back | static (no clock in the kit) | Make the stack add up to CaCO₃(s) → CaO(s) + CO₂(g) from the formation steps, then set its net ΔH. | species cancel when on both sides | reaction cards on the stack, answer dial |
| q6-entropy:1 Where Will They Stand? | static (no clock in the kit) | A box of four particles opens onto an empty half, and is shaken again and again: where will they be most often? | lead-in clip of a neighbouring case | card in slot (prediction) |
| q6-entropy:2 Shake and Count | static (no clock in the kit) | Shake the chamber repeatedly, then place the card for where particles occur most often. | beads fly to new cells on each shake | press Shake, card in slot |
| q6-entropy:3 More Ways or Fewer? | static (no clock in the kit) | Sort each change by whether it gives the particles more ways to arrange or fewer. | particles shake | sort change cards (particles drawn) |
| q6-entropy:4 Volume and Motion | static (no clock in the kit) | Order the four boxes from the fewest ways to arrange the particles to the most. | particles shake | order particle boxes on the rail |
| q6-entropy:5 Entropy From a Table | static (no clock in the kit) | Set the dial to the entropy change ΔS for CaCO₃(s) → CaO(s) + CO₂(g), in J/(mol·K). | atoms: bonds break, atoms travel, new bonds form | number dial after reading a table |
| q7-gibbs:1 A Pack That Chills | static (no clock in the kit) | A cold pack takes heat from the water as its salt dissolves: will the salt dissolve on its own at room temperature? | lead-in clip of a neighbouring case | card in slot (prediction) |
| q7-gibbs:2 Heat Against Spreading | static (no clock in the kit) | Type the temperature in kelvin at which the salt starts to dissolve on its own. | ball on the free-energy line with the two pulls | typed kelvin (ball on line) |
| q7-gibbs:3 The Four Cases | static (no clock in the kit) | Sort the four kinds of change by the temperatures at which they run on their own. | ball runs along the line | sort line cards |
| q7-gibbs:4 Free Energy at 298 K | static (no clock in the kit) | Type the free energy change ΔG of this reaction at 298 K, in kJ. | atoms: bonds break, atoms travel, new bonds form | typed kJ |
| q7-gibbs:5 Where Ice Starts to Melt | static (no clock in the kit) | Type the temperature in kelvin at which ice starts to melt. | ball on the free-energy line with the two pulls | typed kelvin (ball on line) |
| q7-gibbs:6 Free Energy From Formation | static (no clock in the kit) | Type ΔG° of this reaction at 298 K, in kJ, from the formation free energies on the plate. | atoms: bonds break, atoms travel, new bonds form | typed kJ |
| boss-crucible:1 Phase 1 · The Jacket | static (no clock in the kit) | Type the heat the water jacket absorbed from the Crucible, in kilojoules. | water molecules move at the bath temperature, packets of energy cross | typed kJ after the cup |
| boss-crucible:2 Phase 2 · The Coil | static (no clock in the kit) | Read the bond table and set the estimated ΔH for N₂ + 3 H₂ → 2 NH₃, in kJ/mol. | bond atoms shake, pulled apart in the Broken tray | bond cards, answer dial |
| boss-crucible:3 Phase 3 · The Slag | static (no clock in the kit) | Make the stack add up to Fe₂O₃(s) → 2 Fe(s) + 1.5 O₂(g), then set its net ΔH. | species cancel when on both sides | reaction cards, answer dial |
| boss-crucible:4 Phase 4 · The Vent | static (no clock in the kit) | Use the entropy table to set the entropy change for 2 H₂O(g) → 2 H₂(g) + O₂(g) on the dial. | atoms: bonds break, atoms travel, new bonds form | answer dial after a table |
| boss-crucible:5 Phase 5 · The Seal | static (no clock in the kit) | Type the temperature in kelvin at which the free energy reaches zero for the limestone seal. | ball on the free-energy line with the two pulls | typed kelvin (ball on line) |

## Words added to the glossary, with the stage that first uses them

See `src/learn/glossary/ember.js` (23 terms). Recaps: mole (Tallow), kelvin (Bellows).

## Decisions the owner might reverse

- **Fiction kept**: the Crucible's scenario nouns (cooling jacket, vent, coil, slag, seal), the welding spark, frozen valve, warm tank, skiff and siphon fitting. They are story objects in prompts, not instruments.
- **"Bath"** stays as the short name for the water in the cup; it is a real calorimetry word. **"Cup"** is a calorimeter cup.
- **Lead-in clips show a neighbouring case**, never the case predicted: q1 two lattices meeting, q2 a heater on a bath, q3 ethanol burning (not one of the four fuels), q4 a quivering bond and mixed air with nothing happening, q5 carbon burning, q6 particles behind a wall, q7 a crystal sitting in water. q4 stage 4's air clip and q7 stage 1's salt clip show the system before the change only; whether a student can still guess from them is the owner's call.
- **Atom counts on a block are logarithmic in mass** (`atomsFor`): two atoms for a speck, sixteen for a kilogram. A speck and a tank are therefore visibly different amounts, not proportional ones.
- **The heating curve's dial runs by heat**, so a plateau's length is the heat of that phase change. Nothing prints the heat.
- **Reward models** were not added to the stages: only the existing ones stay (verify:ember counts 0 that build). The new `rxn` view is what a reward model would show.

## Only the owner can judge these

Ordered by how likely a first-time student is to get stuck.

1. **q4 stage 2, pulling the atoms apart by dragging.** The drag zone sits over the atoms and the fixture still shows the "Pull" dial as the twin. If the zone is too narrow on a phone, the dial is the way in. Feel and grab size need a hand.
2. **q2 stages 7 and 8 and the heating curve.** The burner is dragged along a graph with no printed axis scale; a student who does not know a flat stretch is a phase change may not link it to the plate's 334 J/g and 2260 J/g. The Tour film shows the drag; there is no lead-in.
3. **q3 stage 1, dragging the products level.** Five levels only; the marble's climb and the packets leaving need pacing judged by eye. The graded answer is still a size per mole worked from the cup.
4. **q6 stage 2, the shaken beads.** Beads fly for 0.9 s then shake in place; whether the flight reads as "a new arrangement" and not as noise is a pacing call.
5. **The `rxn` view**: loops every 6.4 s; the product atoms are matched to the reactants by element in order, so the bonds that form are an honest example, not necessarily the real mechanism. Check it reads well for CaCO₃ and for ten molecules in q3 stage 7.
6. **3D was not seen.** The crowd is checked in Node only (it builds, moves, holds still, stays under the sphere cap). Whether it sits right over each deck and does not collide with knobs needs an eye at 3D On. Pieces (blocks, samples, bond cards) are still solids with a still face at 3D On; their atoms move on the flat bench only.
7. **Nothing graded changed for the typed-number stages**: they still ask for a calculation. The prompt's "graded answer is the interaction with the particles" is met for the stages in the tally, not for these.

## Open work, in the order I would do it

1. Make the calculation stages a hand on the particles: q2 7/8 (drag the burner to the temperature the question names and read the plateaus), q3 5/7 (drag molecules from a box into the reaction until the heat meter is right), q4 6 and the Crucible's bond stage (drag the bond cards and watch the atoms rearrange in the `rxn` view), q5 3/4 (stack cards by dragging the species).
2. Reward models on the spatial stages (the `rxn`, `lattice` and `curve` views are ready to be reused as models).
3. Inline worked step before each first typed stage (the bank's worked problems are at the end of the bench).
4. A recap card with a small animation at q3 stage 1 for moles, and at q6 stage 5 for kelvin (today the glossary and the primer key carry them).
5. Move pieces' atoms (blocks, samples, bond cards) into the 3D solids.
