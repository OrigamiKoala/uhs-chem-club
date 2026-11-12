# Mirrowen teaching pass (2026-11-06)

Run from `docs/archive/2026-11-11/fix-world-teaching-prompt.md` for WORLD = Mirrowen, UNIT = unit06 (7 benches 8+8+8+6+8+8+7, Undertow 5 = 58 stages). Nothing was played in a browser; the owner play-tests (`CLAUDE.md`). Checks: `npm run verify:teaching` (Mirrowen is `tools/verify-teaching-mirrowen.mjs`), `verify:table`, `verify:bench`, `verify:learn`, `verify:mirrowen`.

**This pass is partial in one respect, and says so.** Every stage now has a moving model, and one instrument (the piston) is operated by dragging the particles' container. The rest still grade a card in a tray or on a rail, a typed number or an answer dial, now with the cause moving beside the answer. The brief's bar ("the graded answer is the student's interaction with the particles") is met only for the piston; the other benches need a design for each (what the student drags to *be* the sorting or the sum), not a painter. See "Only the owner can judge these".

## Follow-up: q1 (same day)

The answer trays of q1 stages 1 and 8 and of Undertow phase 1 are now pictures of the poured sample in the tank, drawn as moving particles: a shaking lump, a sliding pool, a flying gas (\`kit.paintTray\`, tray \`view\`; hook added to \`table2d.js\`, \`model.js\`). The student drops each jar under the picture its contents made. The jar is still a card and the filing is still a tray drop, so the graded move is "match the particles you saw", not "operate the particles". Stage 2 (boxes to jars), 4 to 7 are unchanged; the next candidates are q1 4 and 5 (the analyzer prints a name) and q1 6 and 7 (weighing).

Later the same day: the same tray pictures were added to q4 stage 4 (a repeating pattern against an irregular one, same number of particles), and q6 stage 1 (particles spreading apart against staying clumped). In q1 stages 4 and 5 the analyzer now rings the molecule it examined. **Not rebuilt, and why:** q2 stages 1 to 6 and 8 (ranking or filing by the probe's heat: the probe is the experiment and the cards are the answer; a version where the student pulls the molecules apart to a measured distance needs a per-stage design), q3 (flask and plot readings), q5 4 to 6 (typed heat sums), q6 2, 3 and 5 (typed moles), q7 2 to 7 (filter, strip, still, boiling flask and plan board each have a moving model but still grade cards or a typed value), and q1 6 and 7 (weighing and a typed ratio). These remain the owner's list below.

## Tally

| | Stages |
|---|---|
| Total | 58 |
| Static before the pass (the matter kit had no clock) | 58 |
| With a moving model now | 58 (the checker counts a stage when a fixture on it moves; see the caveat above) |
| Static now | 0 (no exception file) |
| Graded move is a hand on the apparatus | q1 1, 2, 8 and Undertow 1: the piston is dragged down to set the dial the stage grades (the dial's own track is the two-tap twin) |
| Graded move is a card in a tray or on a rail after running the instrument | 31 (15 trays, 16 rails) |
| Graded move is a typed number or an answer dial | 15 typed, 15 with a number or answer dial |
| Predict stages with a lead-in clip | 7 of 7 (q1 3, q2 3, q3 3, q4 2, q5 2, q6 4, q7 1) |
| Stages added or cut | none (ids and counts unchanged) |

Counts in the graded-move rows overlap (a stage can run an instrument, then type); they come from each stage's scripted solution.

## What was built

- **`kits/matter-motion.js`** (new): where a particle of a state stands at a clock time (gas flies and bounces off walls; liquid slides; solid shakes about its place; all faster as the square root of the kelvin temperature), and `glide`, a value that moves to a new target over a couple of seconds so a change the student makes takes time to arrive. `replayMatter()` rewinds every glide.
- **Painters made time-aware, in place** (`b.clock`): the particle window and the molecule boxes (`matter-window.js`), the piston cylinder and the tank (jarDots), the probe's four molecules (pulled apart on a glide), the vapor flask (sliding liquid, flying vapor in the planner's count, rising bubbles), the heating curve (twelve molecules in their state, pen and thermometer following the heat as it goes in), the cooler and the phase-diagram sweep (the pen is drawn over time), the solution flask (solute leaves a packed clump and wanders among sliding solvent), the solid tester (particles and shared electrons shake, the melt trace is drawn, the hammer swings), the paper strip (the solvent climbs and carries each dye), the filter (grains fall onto the paper, liquid drips into the cup), the still (bubbles, vapor up the column, drops into the vial), the boiling flask, the plan board (each part travels to where the steps send it), the balance (a needle swings to the weight and settles), and the jar over water.
- **`kits/matter-lead.js`** (new): three watch-first clips for the predict stages (`pull`, `sealed`, `sieve`), each a neighbouring case, never the one predicted. The heat kit's `heater` and `salt` clips serve q1 3, q4 2 and q6 4.
- **`kits/matter.js`**: `live` (the table keeps moving), `onMiss` (a miss restarts every glide, so the pull, the heat or the sweep plays again), `tapZones` (the piston can be dragged), and a 3D dress that stands the same painters up as a crowd of spheres through the recording context (`pans-3d.js` `dressRecorded`), plus the heat kit's models for the cup, the bond and the lead-in clips.
- **Shared code touched**: `gestures.js` `tapDrag` takes `invert` (the pointer's depth sets the dial: pushing a piston down raises the setting); `verify-table.mjs` and `verify-bench.mjs` drive an inverted drag zone; `tools/lib/mirrowen/q*.mjs` allow a lead-in clip on a predict stage.
- **Glossary** `src/learn/glossary/mirrowen.js`: 36 terms (gloss, first stage, banned words, primers offered at six stages). Registered in `glossary/index.js`, so the bench frame's Glossary key and the hint panel's "What is this?" work.
- **Language**: `tools/lib/rewrite-mirrowen-text.py` (string literals only) renamed *grip* to attraction, *reader* to analyzer, *crank* to pull dial, *pan* to balance, *pot* to flask, *tin* to sample, *marker* to number dial, the *Squeeze* dial to Piston (its settings now read 1 atm to 3 atm), *squeezed* to compressed, *room* to volume or space, and a bare *gauge* to pressure gauge. The piston and tank replace "the press".
- **Reading load**: sixteen reward cards over two sentences or 40 words were rewritten to one or two facts each.
- **Tour**: `kits/matter-tour-min.js` replaces every step with at most 16 words and a film (a real stage's own scripted solution, or an idle loop), so the particles move in the film because the bench's painters draw it. Piece steps are keyed `matter:<kind>` because the Kettle kit registers `jar` and `sample` words of its own.
- **Checks**: `tools/verify-teaching-mirrowen.mjs`: banned words (play text and bank), define on first use, needs map, every moving fixture moves with the clock and stands still when frozen and stays under its circle cap, the piston, the heater, the heat, the settling flask each change the model, the 3D crowd of each instrument moves, holds still under reduced motion and stays under 220 spheres, a miss restarts the pull, the Tour is short and moving, static ratio per world and per bench, lead-ins, reading load. The ratchet is `tools/teaching-ratchet-mirrowen.json` (all zero).
- **Doctrine**: `WITHHELD_VOCAB` has no Mirrowen entries (it never gated this world), and `CLAUDE.md` already carries the new language rule; nothing was removed.

## Stage audit

Before: no stage had anything that moved in time. Words before: *grip* (about 90 times) for the attraction between molecules, *Squeeze* and *squeezed* for compressing, *room* for volume and space, *reader* for the molecule analyzer, *crank*, *pan*, *pot*, *tin* and *marker*, a bare *gauge*, and *the press* for the piston cylinder. Terms used before they were glossed are now listed in the glossary with the stage where each first appears (the check fails if one is used earlier).

| Stage | Prompt | What moves now | Graded move |
|---|---|---|---|
| q1-states:1 Three Jars | Sort the three jars by what their contents do when compressed and when poured. | gas molecules fly and bounce in the cylinder (packed into less volume as the piston goes down); liquid molecules slide; solid molecules shake in a lattice; the same in the tank after a pour | file samples in trays after running the instrument; answer or number dial |
| q1-states:2 Molecules in the Jars | Put each box of molecules in the tray of the jar it shows. | gas molecules fly and bounce in the cylinder (packed into less volume as the piston goes down); liquid molecules slide; solid molecules shake in a lattice; the same in the tank after a pour | file samples in trays after running the instrument; answer or number dial |
| q1-states:3 Melting and Boiling | When ice melts and then boils, what happens to the molecules of water? | a neighbouring case plays by itself | card in a slot (prediction, never graded) |
| q1-states:4 The Analyzer | Sort the three changes by whether the analyzer names the same molecule afterward. | molecules shake, slide or fly by state, faster when warmer; the heater changes the state | file samples in trays after running the instrument; answer or number dial |
| q1-states:5 What Holds the Ice | Pick what holds the molecules of the ice in place. | molecules shake, slide or fly by state, faster when warmer; the heater changes the state | answer or number dial |
| q1-states:6 Equal Jars | Order the three jars by the space each molecule has, from the most to the least. | the balance needle swings to the weight and settles | rank cards on the rail from readings |
| q1-states:7 Water and Steam | Type how many times as many molecules the water jar holds as the steam jar. | the balance needle swings to the weight and settles | typed number |
| q1-states:8 Four Sealed Jars | Sort the four sealed jars into solid, liquid and gas. | gas molecules fly and bounce in the cylinder (packed into less volume as the piston goes down); liquid molecules slide; solid molecules shake in a lattice; the same in the tank after a pour | file samples in trays after running the instrument; answer or number dial |
| q2-grip:1 Four Atoms | Order the four atoms by the heat needed to pull one mole of them away from their neighbours. | four molecules shake, then glide apart when pulled | rank cards on the rail from readings |
| q2-grip:2 A Polar Molecule | Order argon, krypton and hydrogen chloride by the heat needed to pull one mole of each apart. | four molecules shake, then glide apart when pulled | rank cards on the rail from readings |
| q2-grip:3 Which Holds On? | Which needs more heat to be pulled apart, water at 18 g per mole or hydrogen sulfide at 34 g per mole? | a neighbouring case plays by itself | card in a slot (prediction, never graded) |
| q2-grip:4 Four Hydrides | Order the four molecules by the heat needed to pull one mole of each apart. | four molecules shake, then glide apart when pulled | rank cards on the rail from readings |
| q2-grip:5 Ions in Water | Order the four ions by the heat given out when one mole of each is dropped in water. | four molecules shake, then glide apart when pulled | rank cards on the rail from readings |
| q2-grip:6 Same Formula | Order butane, n-pentane and neopentane by the heat needed to pull one mole of each apart. | four molecules shake, then glide apart when pulled | rank cards on the rail from readings |
| q2-grip:7 An Attraction and a Bond | Type how many times more heat it takes to break every O–H bond in a mole of water than to pull the molecules apart. | atoms shake; the bond stretches; four molecules shake, then glide apart when pulled | typed number |
| q2-grip:8 Five Sealed Samples | File each sealed sample under the strongest force between its molecules. | four molecules shake, then glide apart when pulled | file samples in trays after running the instrument |
| q3-boil:1 Sealed Liquids | Order ether, ethanol and water by the pressure at which the pressure gauge settles in a sealed flask. | liquid molecules slide; vapor molecules (the planner's count) fly above the surface; bubbles rise when boiling | rank cards on the rail from readings |
| q3-boil:2 Warm and Cold | Order the four samples by the pressure at which the pressure gauge settles. | liquid molecules slide; vapor molecules (the planner's count) fly above the surface; bubbles rise when boiling | rank cards on the rail from readings |
| q3-boil:3 On the Mountain | Where the outside air pressure is only 65 kPa, as on a high mountain, at what temperature will water boil? | a neighbouring case plays by itself | card in a slot (prediction, never graded) |
| q3-boil:4 Where It Boils | Type the temperature at which water boils when the outside pressure is 65 kPa. | liquid molecules slide; vapor molecules (the planner's count) fly above the surface; bubbles rise when boiling | typed number |
| q3-boil:5 Four Boiling Points | Order butane, n-pentane, acetone and water by boiling point. | four molecules shake, then glide apart when pulled | rank cards on the rail from readings |
| q3-boil:6 Surface and Pour | Which reading follows the attraction across the three liquids: surface pull, pour time, both or neither? | — | answer or number dial |
| q3-boil:7 Two Boxes | File each picture box under the sample it shows. | — | file samples in trays after running the instrument |
| q3-boil:8 Gas Over Water | Type the pressure of the gas alone in the jar, whose pressure gauge reads 101.3 kPa. | liquid molecules slide; vapor molecules (the planner's count) fly above the surface; bubbles rise when boiling; gas and water-vapor molecules fly and bounce | typed number |
| q4-solids:1 Five Solids | Sort the solids by whether melting each one only has to overcome attractions between molecules. | particles of the sample shake (window); the pen draws the melt trace; the hammer swings | file samples in trays after running the instrument; answer or number dial |
| q4-solids:2 Same Atoms | Quartz and fused silica glass are both made only of silicon and oxygen: how will each give way as it is heated? | a neighbouring case plays by itself | card in a slot (prediction, never graded) |
| q4-solids:3 Quartz and Glass | Heat each solid and file it by how it gives way. | particles of the sample shake (window); the pen draws the melt trace; the hammer swings | file samples in trays after running the instrument |
| q4-solids:4 Inside the Solid | File each sample as crystalline or amorphous. | particles of the sample shake (window); the pen draws the melt trace; the hammer swings | file samples in trays after running the instrument |
| q4-solids:5 Four Sealed Solids | Sort the four sealed solids into the tray for the kind of solid each is. | particles of the sample shake (window); the pen draws the melt trace; the hammer swings | file samples in trays after running the instrument; answer or number dial |
| q4-solids:6 Five Sealed Solids | Sort the five sealed solids into the tray for the kind of solid each is. | particles of the sample shake (window); the pen draws the melt trace; the hammer swings | file samples in trays after running the instrument; answer or number dial |
| q5-crossing:1 Ice on the Heater | Warm the ice until its temperature stands still, then set the number dial at the heat where it rises again. | twelve molecules shake, slide or fly as heat goes in; the pen and the thermometer follow the heat | answer or number dial |
| q5-crossing:2 Where Did It Go? | The temperature stood still while the ice took in heat: where did that heat go? | a neighbouring case plays by itself | card in a slot (prediction, never graded) |
| q5-crossing:3 Twelve Molecules | Heat the ice until the window shows all twelve molecules flying free of one another. | twelve molecules shake, slide or fly as heat goes in; the pen and the thermometer follow the heat | answer or number dial |
| q5-crossing:4 More Ice | Type the heat needed to melt 36.0 g of ice at 0 °C, in kilojoules. | twelve molecules shake, slide or fly as heat goes in; the pen and the thermometer follow the heat | typed number |
| q5-crossing:5 Ice to Steam | Type the heat needed to take 18.0 g of ice at −10 °C to steam at 110 °C, in kilojoules. | twelve molecules shake, slide or fly as heat goes in; the pen and the thermometer follow the heat | typed number |
| q5-crossing:6 The Way Back | Type the heat change when 18.0 g of steam at 110 °C is cooled to ice at −10 °C, in kilojoules. | twelve molecules shake, slide or fly as heat goes in; the pen and the thermometer follow the heat | typed number |
| q5-crossing:7 A Burn | Order the four samples by the heat each gives a hand as it cools to body temperature. | the pen draws the cooling line | rank cards on the rail from readings |
| q5-crossing:8 Skipping the Liquid | Beyond the exam: find a pressure at which warming ice never makes liquid water. | the sweep is drawn from cold to hot, changing state as it passes each temperature | answer or number dial |
| q6-solution:1 Four White Powders | File each white powder by what it does when it goes into water. | solute particles leave a packed clump and wander among sliding solvent molecules | file samples in trays after running the instrument |
| q6-solution:2 Salt in a Flask | Type the moles of salt in each litre of solution once the salt on the balance is made up to 400 mL. | solute particles leave a packed clump and wander among sliding solvent molecules | typed number |
| q6-solution:3 Stock to a Flask | Type how many mL of the 2.00 M stock make 100 mL of 0.500 M when topped up with water. | solute particles leave a packed clump and wander among sliding solvent molecules | typed number |
| q6-solution:4 Which Puts More In? | Which puts the most particles in the water: 0.100 mol of table salt, of calcium chloride, or of sugar? | a neighbouring case plays by itself | card in a slot (prediction, never graded) |
| q6-solution:5 Particles in the Water | Type the particles that 0.100 mol of calcium chloride puts in the water, in units of 10²³. | solute particles leave a packed clump and wander among sliding solvent molecules | typed number |
| q6-solution:6 Water and Oil | File each sample under the solvent, or both solvents, that it dissolves in. | solute particles leave a packed clump and wander among sliding solvent molecules | file samples in trays after running the instrument; answer or number dial |
| q6-solution:7 Four Salts in a Bath | Order the four salts by the temperature the bath ends at after each dissolves in it. | water molecules at the bath temperature | rank cards on the rail from readings |
| q6-solution:8 Three Sealed Flasks | Order the three sealed flasks by the molarity of what was dissolved in each, lowest first. | solute particles leave a packed clump and wander among sliding solvent molecules | rank cards on the rail from readings |
| q7-separate:1 Through the Paper | Salty water is poured through filter paper into a clean cup: what does the cup hold afterwards? | a neighbouring case plays by itself | card in a slot (prediction, never graded) |
| q7-separate:2 Four Mixtures | File each mixture under the method that separates its solid from the water. | grains fall and stay on the paper; liquid drips through into the cup | file samples in trays after running the instrument |
| q7-separate:3 Black Ink | Type how far the red spot travelled as a fraction of how far the liquid travelled. | the solvent climbs the paper and carries each dye behind it | typed number |
| q7-separate:4 Another Liquid | Order the three dyes by how far each travelled in hexane and acetone. | the solvent climbs the paper and carries each dye behind it | rank cards on the rail from readings; answer or number dial |
| q7-separate:5 Three Liquids | Order acetone, ethanol and water by when each comes over into the receiver. | the flask bubbles, vapor climbs the column, drops fall into the vial | rank cards on the rail from readings |
| q7-separate:6 Beyond The Exam: A Salted Flask | Type how many degrees hotter than water alone boils with 3.00 mol of calcium chloride, CaCl₂, dissolved in 2.00 kg of water. | water molecules slide, bubbles rise, the thermometer column climbs | typed number |
| q7-separate:7 Sand, Salt and Water | Lay steps on the row until the sand, the salt and the water each end up alone. | each part travels from the start line to where the steps send it | rank cards on the rail from readings |
| boss-undertow:1 Phase 1 · The Hold | Sort the three jars from the crawler's hold into solid, liquid and gas. | gas molecules fly and bounce in the cylinder (packed into less volume as the piston goes down); liquid molecules slide; solid molecules shake in a lattice; the same in the tank after a pour | file samples in trays after running the instrument; answer or number dial |
| boss-undertow:2 Phase 2 · The Siphons | Order ether, acetone, ethanol and water by the heat needed to pull one mole of each apart. | four molecules shake, then glide apart when pulled | rank cards on the rail from readings |
| boss-undertow:3 Phase 3 · The Vent | Type the temperature at which ethanol boils when the outside pressure is 45 kPa. | liquid molecules slide; vapor molecules (the planner's count) fly above the surface; bubbles rise when boiling | typed number |
| boss-undertow:4 Phase 4 · The Melt | Type the heat needed to melt 54.0 g of ice at 0 °C and warm the water to 100 °C, in kilojoules. | twelve molecules shake, slide or fly as heat goes in; the pen and the thermometer follow the heat | typed number |
| boss-undertow:5 Phase 5 · The Dose | Type how many mL of the 1.50 M stock make 250 mL of 0.300 M when topped up with water. | solute particles leave a packed clump and wander among sliding solvent molecules | typed number |


## Glossary

36 terms in `src/learn/glossary/mirrowen.js`, each with a one-clause gloss and the stage it first appears in. Recaps (re-glossed because the earlier world may not have been played): molecule and ion (Tallow), pressure (Bellows), mole (Tallow), polar (Ligar), heat of fusion and heat of vaporization (Ember Reach). Prerequisites with a primer offered on the stage: ratio (q2 7, q6 3) and amount (q5 4, q5 5, q6 2, q6 5).

## Decisions the owner might want to reverse

- **Beyond-the-exam stages kept.** q5-crossing stage 8 (phase diagram of water) and q7-separate stage 6 (boiling point elevation, ΔT = i K_b m) say so in their own headers. The brief says to cut such content unless the owner wants it; cutting needs a new stage count and an archive, so both stay for the owner's decision.
- **`jar`, `tank`, `probe`, `window` and `trays` stay as names.** A jar and a tank are lab words; the probe and window are plain descriptions of the instrument's job. *Reader* became *analyzer*, and the Read Molecule key keeps its name.
- **The balance needle is decoration on a measurement.** It swings to the weight and settles on a log scale; the printed mass is the reading. It shows that weighing is a measurement that takes time, and carries no figure.
- **The flask's flat painter draws up to about 540 circles** (every water molecule of its window is three circles); the 3D crowd is capped at 220 spheres whatever the flat bench draws. The check allows 640 for the flask and 220 for the rest.
- **The piston setting is 1, 1.5, 2 and 3 atm** (it read Off, Light, Firm and Hard). The planner is unchanged.

## Only the owner can judge these

Ordered by how likely a first-time student is to get stuck.

1. **q6-solution 5, 6 and 8 (counting particles in the flask, dissolving in two liquids, three sealed flasks).** The window now draws a packed clump spreading out, but the count of particles is still read off a drawing with up to 540 circles at 2D; whether a student can count 12 moving particles is a pacing question.
2. **q5-crossing 4, 5 and 6 (typed heat from a heating curve).** The model shows the sample freeing its molecules as heat goes in, but the calculation (n × ΔH and m × c × ΔT) is still a typed number with no worked step inline. The bank has a worked problem; it is placed at the end of the bench, not before stage 4.
3. **q2-grip 1 to 6 (ranking by the probe's heat).** The four molecules shake and glide apart, but the graded move is ranking cards. Whether the pull feels like the cause of the number needs a human eye.
4. **q3-boil 4 (boiling point at 65 kPa from a plot).** Reading where the plotted line meets the amber line is still a graph reading; the flask boils and bubbles at the matching step.
5. **q1-states 4 and 5 (the analyzer).** The window moves, but the analyzer only prints a name; nothing shows *why* the name stays H₂O.
6. **Pacing of every glide** (the pull, the pen, the climbing solvent, the balance needle, the heat going in): 1.4 to 3 seconds each. These are guesses.
7. **The lead-in clips** (`pull`, `sealed`, `sieve`, and the heat kit's `heater` and `salt`): each is a neighbouring case, but any clip of the topic can lean toward an answer; check that none does.
8. **Not rebuilt:** the sorting benches are still cards in trays after running an instrument. A rebuild that makes the student drop each jar into a field, beam or heater and sort by what they saw is the next step for q1 1, 2 and 8, q4, q6 1 and 6, and q7 2.
