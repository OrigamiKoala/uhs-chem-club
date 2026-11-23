# Playtest feedback 2026-11-22 (Mirrowen)

Played: Mirrowen (unit06), 3D On, 1440 x 900, Continue as Guest. Reached each bench by URL (`#/learn/unit06/<quest>` plus reload) with all quests marked complete, as asked. Opened the world once: arrival cutscene (first shots only), flight, and the walk off the ship (I used `stage.voyage.disembark()` to leave the ship; I did not walk to the airlock).

Played to the end: q1-states stage 1 (wrong answer, miss message) and stage 7 (typed answer, reward card, four-slide debrief); q2-grip stage 1 (probe, miss, hints 1 and 2).
Opened with `__lqStage` and looked at the bench, prompt and first tour step only (not solved): q1 stages 2 to 6, q2 stages 2, 4, 5, 7, 9, q3 stages 1 (used), 2, 4, 5, 7, 8, q4 stages 1, 3, 5, q5 stages 1 (used) and 3, q6 stages 1, 2, 4, q7 stage 1, boss phase 1.
Not played: q2 stages 3, 6, 8; q3 stages 3, 6; q4 stages 2, 4, 6; q5 stages 2, 4 to 8; q6 stages 3, 5 to 8; q7 stages 2 to 7; boss phases 2 to 5; the reward cards and debriefs of q2 to q7 and the boss; hint rung 3 anywhere; the walking NPCs and opening scenes; the Vess debrief after q2 to q7; 3D Off; phone width.
Caveat: the Vess tour boxes that stayed open after a `__lqStage` jump (q1 stages 5 and 7, q3 stage 7) were an effect of jumping, so I have not written notes about them. Every other note comes from what I saw on screen.

## Mirrowen (unit06)

### Arrival and world

**Arrival cutscene.** Shot 2 (lander over the canal bank) has no caption line; shot 1 says "A strange chemical froze Mirrowen's shipping canals solid and trapped every supply boat." I could not watch the later shots (the player advanced on its own). Not checked in full.

**World, ground.** Standing at the airlock the ground is huge dark cracked paving cells, like cracked earth tinted blue, not snow or ice. Replace with a snow/ice texture, smaller cells. Camera on landing looks straight down at the ground.

**World, ship exit.** After "Disembark" the walk down the ramp takes about 40 s with no skip other than the top-left Skip. Board "UHS Chem Club / Next meeting 12/1 in 702" hides under the top HUD while walking.

**World, bench marker.** After walking forward ~6 s the marker still read "BENCH 1 - THREE STATES 140 M". Distance label looked stale (not sure).

### q1-states (Three States)

**q1-states, question card.** Card covers the left half of the bench until Start is pressed; the question "Is the ice still water, or something new?" is good, but the prompt line under it ("Which jar holds a solid, which a liquid and which a gas?") does not mention ice, so the premise and the task are two different questions.

**q1-states, stage 1, top bar.** Two lines stacked (orange italic story line + white prompt) plus seven tiny unlabeled squares at right. Squares need a label or removal.

**q1-states, stage 1, tour step 1.** The pointer shows jar A going through the piston and "Pour" into the tank, which shows what jar A is (gas particles fill the tank). That is the answer to one of the three jars. Show the gesture on a neutral demo or only highlight.

**q1-states, stage 1, tour step 1, bench.** During the pour demo gas dots fall out of the bottom of the tank, onto the table and off the bench edge. Keep particles inside the tank.

**q1-states, stage 1, tour step 2.** Text says "Jar" and "Drag it into an instrument, then into a tray." but the highlight box covers the piston instrument and the jar cards A to C are covered by the text box. Highlight the jars and the trays. Also "instrument" and "tray" are unexplained; say "piston" and "the three boxes labelled Stays a lump, Pools flat, Fills the tank".

**q1-states, stage 1, bench.** The jar card that sits in the instrument seat covers the "Piston and tank" label and most of the piston picture, and the jar's contents are drawn behind/over the card edge. Seat the jar beside the cylinder, not on top of it.

**q1-states, stage 1, bench, piston.** Gas and liquid dots are drawn outside the glass cylinder on the table (left of the cylinder). Keep every dot inside the glass.

**q1-states, stage 1, bench, piston.** The piston keeps its last setting ("Piston 3 atm") when a new jar is swapped in, so jar B first appears already squeezed and looks like a pile of dots at the bottom. I read B as a solid. Reset the piston to 1 atm every time a jar is seated.

**q1-states, stage 1, bench, camera.** A drag that misses a card or the piston handle tilts the whole bench camera (twice I ended looking along the table). Drags on empty table should do nothing, or the camera should return by itself.

**q1-states, stage 1, trays.** A second card dropped on a tray that already holds a card piles on top of it and hides it, and a card dropped near a tray edge lands overlapping two trays. Cards should snap into one slot each and push the old card back to the shelf.

**q1-states, stage 1, miss message.** "Jar B sits in the "Stays a lump" tray, and its contents compressed to 33 % of its volume." This does say why, which is good, but "tray" and "33 % of its volume" are unexplained. Say "Jar B was squeezed to a third of its size. A solid cannot be squeezed like that."

**q1-states, stage 2, tour.** Four steps: the molecule definition, then "Drag the piston down on the sample" and "Drag it into an instrument, then into a tray", which are the stage 1 steps again. This stage has no piston use. Cut those two steps; keep the molecule-picture step and the definition.

**q1-states, stage 2, bench.** The three molecule pictures (1, 2, 3) are small flat cards in the top right; at that size I could not tell whether the dots were moving or what the arrangement was. At 3D On these should stand up as molecules, larger, with the jar cards under each.

**q1-states, stage 3, prompt.** "When ice melts and boils, what happens to the molecules of water?" Ice melts, water boils; say "When ice melts and then the water boils, what happens to its molecules?".

**q1-states, stage 3, cards.** "Each molecule itself melts, then turns into a gas" is not a plausible idea for a student; the sentence is also differently shaped from the other two, so it is easy to rule out. Write all three as the same kind of claim.

**q1-states, stage 3, bench.** "Watch first" shows flat dots in a small card with the labels "WATER" and "HEATER" and tiny circles. At 3D On the molecules should be 3D and larger, and it is not clear that the circles are the heater setting. Label what is hot and what is cold.

**q1-states, stage 4, tour step 1.** The Vess line "In a phase change, molecules stay whole and only rearrange." is the answer to this stage, said before the question. Say what the analyzer does and stop.

**q1-states, stage 4, bench.** The card "Electricity splits water" sits on top of "Ice melts" and "Water boils" and cuts into their text. "Window" (the instrument name) means nothing. The heater reads "Heater -10 °C" with no dial to change it visible. "ANALYZER" is written in dim letters under the seat, hard to read.

**q1-states, stage 5, bench.** The Ice jar sits at the bottom left away from the instrument, the options are at the top right, and the lower right is empty. Put the jar beside the instrument and the options below it.

**q1-states, stage 6, bench.** The three jar cards are already lined up under "Least space each" ... "Most space each" (C, A, B) when the stage opens. If that is not the answer it is a misleading start; if it is, it is a giveaway. Start them unsorted in a row.

**q1-states, stage 6, tour.** Text "Each jar holds 1.00 L of water in a different state. Density is the mass in a given volume." Density is defined but the question never uses the word. The balance reads on a dial with a needle at zero and a tiny "Weigh" button; it is not clear what the dial measures (grams? kilograms?). Print a number with its unit.

**q1-states, stage 7, bench.** A jar card put on the balance sits over the dial and the printed reading ("1000 g" is only legible on the card itself, the big readout is half hidden behind it). Put the jar on a pan beside the readout.

**q1-states, stage 7, miss message.** "Both jars need weighing on the balance first." Clear, good wording. Nothing to change.

**q1-states, stage 7, reward card.** "A Gas Is Mostly Empty. A jar of liquid water holds about 1,700 times as many molecules as an equal jar of steam. A gas is mostly empty space." This is a one-line strip at the bottom of the screen, not an animation. Show the two jars with molecules, a crowd in one and a few in the other.

**q1-states, debrief slide 1.** "one jar of water, three ways / 8 molecules, 8 drawn whole". "8 drawn whole" is jargon. The solid is drawn as two loose rows with gaps as wide as the liquid's, so it does not look packed. Draw the solid touching and in a lattice, the liquid close but irregular, the gas far apart. Dead dark band under the pictures.

**q1-states, debrief slide 2.** The panel reads "READER H2O / molecules 8 / bonds drawn whole 0 / bonds broken 16" while the Vess line says "The molecules only change places, so no bonds break." The panel contradicts the line (broken 16, whole 0). Fix the counter so it reads "bonds broken 0", and say "analyzer", not "reader".

**q1-states, debrief slide 3.** The bars count up from "105 g" and "0.063 g" to "1000 g" and "0.598 g", so the numbers shown while it animates are wrong values for a moment. Start the bars at zero or at the final values. Vess line says "intermolecular forces" without having introduced the term in this quest's debrief.

In general for q1-states: stages 1 and 7 were played to the end (stage 7 with the reward and debrief); stages 2 to 6 were opened with `__lqStage` and looked at but not solved. The molecule pictures that matter most are small and flat on the bench and only appear large in the debrief.

## q2-grip (The Grip Between)

**q2-grip, question card.** "Water molecules are light, yet the canal ice grips like stone. What holds water molecules to each other so hard?" The question is good, but stage 1 then tests four noble gas atoms (Ar, He, Xe, Ne) and never mentions water or ice. Add one line on the bench or in the tour that says why atoms are tested first ("Start with single atoms: the simplest case of molecules attracting one another"), or open with a stage that uses water.

**q2-grip, stage 1, prompt.** "Which of the four atoms attracts its neighbours most weakly and which most strongly?" The rail labels say "Needs least heat" and "Needs most heat", and the probe says "HEAT TO SEPARATE ONE MOLE" for an atom. Three different phrasings for one idea, and "mole" is not explained. Use one: "least heat to pull apart / most heat to pull apart".

**q2-grip, stage 1, tour step 1.** The first step is a paragraph that explains London dispersion forces ("The electrons in an atom's cloud are always moving, so for an instant one side is slightly negative..."). It gives the whole cause before the student has seen a reading, and the probe window then shows two plain dots that do not show it. Cut this paragraph from the tour; show the flicker of charge in the probe window and explain it in the reward.

**q2-grip, stage 1, tour step 3.** "Drag it into the probe, onto the rail, or into a tray." There is no tray on this bench. Say "into the probe, then onto the rail".

**q2-grip, stage 1, bench, text on table.** "Test He and Ne in the probe, then order all four cards on the rail." is printed on the table under the rail. It is an instruction on the bench (the prompt must be the only instruction), and it hides under the He card when that card is put down. Remove it.

**q2-grip, stage 1, bench, rail.** The words "Needs least heat" and "Needs most heat" are covered by the Ar and Xe spheres (the sphere sits on top of the "l" and the "N"). Move the spheres lower or the labels higher.

**q2-grip, stage 1, bench, probe.** After pressing "Separate" the window shows two tiny dots drifting apart. They are too small to read as atoms, and nothing shows why one pair takes more heat than another. Draw the two atoms large with their electron clouds, flicker the charge, and show the attraction line.

**q2-grip, stage 1, hints.** Hint 1 ("Test helium and neon in the probe, then order all four cards on the rail.") repeats the bench text. Hint 2 ("Compare the electron cloud drawn on each card with how much heat helium and neon needed.") sends the student to an electron cloud, but the cards show only a plain white sphere of different sizes. Draw the cloud on the card, or say "compare the size of each sphere". The third hint is locked until two wrong answers, which is fine.

**q2-grip, stage 1, miss message.** Submitting with a card still off the rail gives "Put all 4 cards on the rail." Good and short.

**q2-grip, stage 2, tour step 1.** The Vess box says "A polar molecule has a permanent positive end and negative end, called a dipole. When two polar molecules meet, opposite ends attract: a dipole-dipole force." One of the answer cards reads "It has a permanent + end and - end", so the box hands over the answer before the student has tested anything. Show only what the probe does and put the explanation in the reward.

**q2-grip, stage 2, prompt.** "Why does hydrogen chloride attract its neighbours more strongly than krypton?" The prompt states the result before the student has measured it. Ask "Which of HCl and Kr attracts its neighbours more strongly, and why?" or let the probe decide first.

**q2-grip, stage 2, bench.** "Test HCl and Kr, then lay a reason." is printed on the table (a how-to line, "lay" is odd). Two of the three reason cards are about mass and cloud size, the third is the answer, written longest. Make the three cards the same length and kind.

**q2-grip, stage 4, tour step 1.** The Vess box gives the rule: "A hydrogen atom bonded to nitrogen, oxygen or fluorine is strongly attracted to a lone pair on a neighbouring molecule." With that rule the student sorts H2O, H2S, NH3, PH3 by formula alone and never needs the probe. Either hide the rule until after the stage, or make the probe the only way to decide (cards without formulas, readings only).

**q2-grip, stage 4, bench.** "Separate each molecule, then file it." printed on the table again. Four small molecule cards at the top, the probe at the bottom left, two trays on the right; the pictures on the cards are tiny and flat. At 3D On the molecules on the cards should stand up and be big enough to see which atom is H.

**q2-grip, stage 5, prompt.** "Which ion gives out the least heat when it enters water and which the most?" The quest asks what holds water molecules to each other; this stage is about ions and water, and nothing says why we moved from water to ions. Add the link ("Salt dissolves in canal water: what holds the ions among the molecules?") or move this stage after the water stages are done and call it out.

**q2-grip, stage 5, bench.** "Test Na+ in the probe, then order all four ions on the rail." is on the table; only one ion has to be tested, so three of the four cards are ordered without evidence. The "Gives out most heat" label is covered by the K+ sphere (same as stage 1).

**q2-grip, stage 7, bench.** The yellow curve of the bond-pull dial runs straight through the readout "O-H bond ENERGY IN 0 kJ/mol", so the number is hard to read. The H2O card is a small picture at the right of the probe. Move the readout out from under the curve.

**q2-grip, stage 9, tour.** The Vess box lists the whole answer ("polar groups with N-H or O-H form hydrogen bonds with water or partner strands, while nonpolar hydrocarbon chains cluster together away from water by dispersion"). It then asks the student to sort exactly those groups. Cut it down to what the probe shows. Also "biomolecule" and "hydrophobic" appear with no gloss, and nothing in the quest has mentioned DNA or proteins.

**q2-grip, stage 9, bench.** The "Water (reference)" and "Hexane (reference)" cards look the same as the sortable cards, so it is not clear which cards are to be sorted. Mark references differently (a different card colour or a separate "Known" strip).

In general for q2-grip: the same Vess box shape is used for every stage as a definition lecture before the stage. Across the quest the definitions (dispersion, dipole-dipole, hydrogen bond, ion-dipole) should appear in the reward after the student has seen the reading, not before. Every stage also prints a how-to sentence on the table ("Test X in the probe, then ...") and the molecule pictures are flat and small at 3D On.

## q3-boil (Liquids and Vapour)

**q3-boil, load.** The bench took about 25 s to build after a reload with only "Building the bench" on screen. Not a note on content, but a student would think it had hung.

**q3-boil, question line.** The orange line reads "See why canal water evaporates even below its boiling point." It is an instruction, not a question, and says nothing about what is being asked. Ask "Why does canal water evaporate when it is far below its boiling point?".

**q3-boil, stage 1, bench.** The first stage tests ether, not water. Nobody has said what ether is, and the question is about canal water. Use water here, or say "ether (a liquid that evaporates easily)" and why.

**q3-boil, stage 1, bench, flask.** The flask is drawn as a glass ball sitting in a grey box with a few tiny dots, so the leaving and returning of molecules cannot be seen. At rest (before Settle) it is a solid black ball. Draw a flask with a liquid at the bottom and molecules leaving and returning at the surface, big enough to count, with the leaving ones in one colour and returning ones in another.

**q3-boil, stage 1, bench, readout.** After "Settle" the panel prints "LEAVING 285 /s" and "RETURNING 285 /s", the same number twice. The answer card "As many return as leave" can then be picked by matching two equal numbers; nothing is predicted or found out. Show the rates as bars that start unequal and become equal while the pressure levels off, and let the student read the moment they meet.

**q3-boil, stage 1, bench, text.** "Drag ether into the flask, press "Settle", then put one card in the slot." is printed on the table. Remove it (the how-to belongs in the tour).

**q3-boil, bench edge.** A small black rectangle sits at the right edge of the table on every flask stage (stages 1 and 5) and looks like a stray object. Remove it or move it.

**q3-boil, stage 2, bench.** Same flask, same how-to line on the table ("Drag a card into the flask, press its key, then put the card on the rail."). "press its key" means the Settle button; call it by name. The rail labels "Lowest vapor pressure" and "Highest vapor pressure" are fine.

**q3-boil, stage 4 (predict), prompt.** "Where the outside air pressure is only 65 kPa, as on a high mountain, at what temperature will water boil?" but the three cards are "It still boils at 100 °C", "It boils below 100 °C", "It boils above 100 °C". The question asks for a temperature and the cards answer "higher or lower". Ask "On a high mountain, will water boil at the same temperature as here, hotter or cooler?". "kPa" and "outside air pressure" have never been explained at this point; the student has only seen "vapor pressure" in the flask.

**q3-boil, stage 4, bench.** The line "Drag the card you choose into the slot." sits on the table as a how-to. "Watch first" shows a cube with a few dots at the bottom right; the frame is small and clipped against the table edge.

**q3-boil, stage 5, tour.** The tour box reads "FLASK AND PRESSURE GAUGE ... Put a liquid in the flask and press "Settle". The gauge shows where pressure levels off." This is the same flask gesture as stage 1 and uses "gauge" (the owner has flagged "gauge" before). Drop the step or say "pressure reading".

**q3-boil, stage 5, bench.** Printed on the table: "Drag the water into the flask, set the dials, press its key at a heater step, then type your answer." Four operations in one line, and the two dials ("Heater 20 °C", "Outside sealed") have no explanation of what "Outside sealed" is or how to change it. Label the second dial "Outside pressure" with kPa values.

**q3-boil, stage 7, bench.** Each liquid card prints "attraction 48.7 kJ", "attraction 38.6 kJ", "attraction 28.9 kJ". Ordering these numbers answers "highest surface tension" without using the surface plate at all, which is a giveaway and makes the instrument useless. Remove the numbers from the cards.

**q3-boil, stage 7, prompt.** "surface tension" is never explained before this stage. The plate shows a reading in "mN/m" with a puck, which means nothing to a beginner. Add a picture of a drop standing up, a needle floating or a bug on water first, then ask which holds the surface up best.

**q3-boil, stage 7, answer dial.** The answer is a dial "Highest surface tension / Set to -" with three unlabeled stops. Picking a liquid by a dial is an odd gesture; drag the liquid's card into an "Answer" slot instead (and the label "Set to -" will not be needed).

**q3-boil, stage 8, bench.** The two pictures A and B are flat clusters of orange balls (no hydrogens), and both look crowded and similar. At 3D On ice should be an open hexagonal lattice standing up, and the water molecules should show both atoms. Weighing the cube and comparing masses is sound, but the pictures are not tied to it: put the pictures above the cube so the mass and the crowd match.

**q3-boil, stage 8, bench, text.** "Drag a sample into the cube, press its key, then drag each picture into a tray." how-to on the table again. "Equal boxes" and "Weigh" and "MASS OF THE CUBE": the cube holds "1 cm3" with no ice drawn in it.

## q4-solids (Kinds of Solid)

**q4-solids, question card.** "The canal barrier looks like ice, but glass looks like ice too. Which is it?" "Which is it?" has no clear answer (ice or glass?), and "canal barrier" has not been mentioned before. Ask "The canal barrier looks like ice. How can you tell ice from glass or quartz?".

**q4-solids, stage 1, prompt.** "Which of these are molecular solids?" The term "molecular solid" is not defined anywhere before this stage, and the question card is about ice vs glass. Add a line (or briefing) saying what a molecular solid is, or start with a stage that has the student test ice and glass.

**q4-solids, stage 1, tour step 1.** "Put a sample in. Turn the "Test" dial and press "Test"." The highlight box covers the tester, but the tour box then covers the "Molecular solid" tray. Move the tour box. Also, the heater/"Test Melt" dial and the "Test" button are two controls with the same name; call the dial "Heat to".

**q4-solids, stage 1, bench.** The five samples (ice, iodine, naphthalene, gallium, salt) are the same grey rock picture, so only the label differs. Naphthalene and gallium are not known to a beginner; say what each is (mothball, a metal that melts in the hand) or use common samples (wax, sugar, table salt, copper).

**q4-solids, stage 3, bench.** The samples are "quartz, fused silica, salt, copper". "Fused silica" is a new name; the premise says glass. Say "glass (fused silica)" on the card. "Melts at one temperature" and "Softens over a range" are the right labels, but the tester shows a scale "0 / 1000 / 2000" with a tiny trace, and the viewer next to the slot is an empty box until a sample is put in. All four samples look the same grey stone.

**q4-solids, stage 5, prompt.** "Use the hammer and current records on the cards and the melt-and-particle viewer to classify each solid." is an instruction, not a question. "current records" is unclear. Ask "What kind of solid is each of X1 to X5?".

**q4-solids, stage 5, bench.** Cards X1 to X5 print three lines in small orange text ("shatters / lamp cold: no / lamp molten: yes"). "lamp cold" and "lamp molten" are never explained (the lamp is the conductivity test, introduced in no earlier stage here). Say "conducts electricity when cold: no" instead. All the evidence is printed on the cards, so the Melt & Trace Viewer is not needed; the five categories can be matched from the card text. Make the viewer the evidence for at least one of the properties.

**q4-solids, stage 5, trays.** The five trays are "Metallic, Ionic, Network, Molecular, Amorphous". "Amorphous" is a different kind of sorting (how the particles are ordered) from the other four (what holds them together), so a solid can be two at once. Put "Amorphous" in a separate decision, or say "None of the above (amorphous)".

## q5-crossing (The Crossing)

**q5-crossing, question card and stage 1 prompt.** The card asks "The canal barrier has to be melted. Where does the heat go while it melts?" and the stage 1 prompt asks "How much heat does this ice take in while its temperature stays at 0 °C?". These are two different questions (where vs how much). Make stage 1 ask the card's question first ("What happens to the heat while the ice melts?") and use the amount in stage 3 or 4.

**q5-crossing, stage 1, tour.** The tour has one step: "Press "Heat". The pen draws temperature against the heat added." If you do what it says, "Heat" does nothing and a faint grey line at the bottom says "Set your prediction on the number dial first, then press "Heat"." The bench text on the table says the same wrong order ("Press "Heat" to draw the line, then set the number dial."). Both are in the wrong order: the dial must be set first. Reword the tour and the bench text, and show the pointer turning the dial and then pressing Heat. Make the message bar text readable (it is dark grey on black).

**q5-crossing, stage 1, bench.** The "Number dial" panel is the answer, but it sits half under the tour highlight and runs to the right edge. It is called "Set 4.5" and "kJ" with no word like "Answer". A small black square sits at the lower right corner of the table (as on Quest 3). The ice picture in the heater is a pale cube with "18.0 g" in it; it does not change while the plateau is drawn (no melting seen). Show the cube shrinking and water filling at the bottom during the flat part of the line.

**q5-crossing, stage 1, bench, graph.** Each press adds +3 kJ and the line is straight between the points, so the plateau end cannot be read to better than 3 kJ. The student guesses a number and the dashed line at 4.5 shows how far off it was, which works, but a smaller step (1 kJ) would let it be read.

**q5-crossing, stage 3, bench.** "Twelve Molecules": at -20 °C the ice is drawn as 12 separate orange and white dots scattered all over the window, like a gas, with no bonds between the atoms. Ice should be shown as molecules (each O with two H bonded) in fixed places, shaking more as it warms, then sliding, then flying apart. At present it contradicts the idea of the stage.

**q5-crossing, stage 3, bench, answer.** No answer cards or slot are visible when the stage opens; only the instrument and the text 'Set the dial, press "Heat" and watch the window.' The student does not know what they will be asked to choose. Show the answer cards from the start.

## q6-solution (Taken Into Solution)

**q6-solution, question card.** "The drums on the quay are empty, and their chemical is in the canal water. How much of it is in each litre?" Stage 1 then asks "Which powders dissolve in water?", which does not answer or lead toward "how much in each litre". Stage 1 is about dissolving at all; say so on the card ("Did the chemical dissolve? How much is in each litre?") or move the "how much" stages first.

**q6-solution, stage 1, tour.** The one tour step is "Drag it onto the balance or the flask, then into a tray." The highlight is a small box around Sample A only and the tour box sits over the "Dissolves" tray, hiding the tray label. Put the tour box under the bench. "balance" and "flask" are not shown being used.

**q6-solution, stage 1, bench.** Four cards, "Sample A" to "Sample D", all "white powder" with the same pile picture. The flask is drawn as a glossy blue ball (not a flask) with the faint words "A DROP, IN WATER" printed on the table over the water window, and the 250 mL line is partly under the ball. A beginner will not know what a "flask bench" is. Draw a real flask or beaker and label it "Water".

**q6-solution, stage 2, tour step 1.** The Vess box prints a worked solution: "1. 11.7 g / 58.5 g/mol = 0.200 mol  2. in 0.500 L: 0.200 / 0.500 = 0.400 M". This is the same sum as the stage (same salt, same mass) with 0.500 L in place of 400 mL, so only one number must be changed. It also says 58.5 g/mol while the "Molar mass" card on the bench says "58.44 g per mole". Use a different example (different salt and mass) in the tour, one number system, and show it as a Primer the student can open.

**q6-solution, stage 2, bench.** The Vess box covers the top right of the bench until dismissed. The how-to line is printed on the table ("Drag the salt onto the balance, then into the flask, then type your answer."). The label "A DROP, IN WATER" again sits over the flask window. The flask is a small blue ball with "100 mL" next to it, but the question says 400 mL, so the flask on screen does not match the question; a student could read 100 mL as the volume.

**q6-solution, stage 4 (predict), bench.** "Watch first" plays a picture of coloured ions in water before the student commits, which shows what one of the salts does and tips the prediction. Let the student commit first, then play it. The three answer cards mix two kinds of text (a formula alone, and "All three put the same number in"), and "0.100 mol" is used without saying what a mole counts here; say "the same number of formula units (0.100 mol)". The how-to "Drag the card you choose into the slot." is printed on the table.

In general for q6-solution: the flask is drawn as a glossy ball with a few dots, not a flask or beaker; the how-to sentence is printed on every bench; the question card asks how much is in each litre but the first stage is about which powders dissolve. Only stages 1, 2 and 4 were opened; stages 3 and 5 to 7 were not checked.

## q7-separate (Pulling Apart)

**q7-separate, question card.** "The Fifth's chemical is dissolved in the canal water. Can we get it back out, and how?" "The Fifth" has not been introduced in this world's story before this card (the student has only met the froze-canal premise). Say "the chemical" or explain who the Fifth are in one line.

**q7-separate, stage 1, tour.** The first tour step is only "A similar case plays by itself." and the highlight covers the "Watch first" box. The student is told to watch before choosing but not what to look for. Say "Watch what the filter paper does to the salt, then pick the card that matches".

**q7-separate, stage 1, bench.** "Watch first" shows a small box with tan balls (salt) and blue balls (water) passing a dotted line (the filter) and gives away the prediction: nothing is left to predict once it has been watched. Hide it until the prediction is committed. The three cards: "Clean water, with the salt left on the paper", "Water that is less salty than before", "Salty water, as it went in" are good, but "as it went in" is easy to misread; say "just as salty as before".

**q7-separate, stage 1, prompt.** "Salty water is poured through filter paper into a clean cup: what does the cup hold afterwards?" Good. No note.

In general for q7-separate: only stage 1 was opened (question card, tour step 1, bench). Stages 2 to 7 (chromatography Rf, distillation, boiling-point elevation, sand/salt/water) were not played.

## boss-undertow (The Undertow)

**boss-undertow, header.** The top of the screen holds four layers of text and bars: the orange story line, the white prompt, a strip "THE UNDERTOW [three squares] The Undertow drags the quay in three jars, each in a state of its own." and a red box "THE UNDERTOW / PHASE 1 OF 5 / 1000 / 1000". Two of these say the boss's name twice. Keep the prompt and one boss bar; drop the strip.

**boss-undertow, phase 1.** The prompt "Which jar holds a solid, which a liquid and which a gas?" is Three States stage 1 word for word, on the same piston bench. A boss re-test is intended, but this is the very first stage of the first quest again. Use a different jar set or ask the state of three new substances from their piston behaviour.

**boss-undertow, bench.** The bench stands on a thick black slab that overhangs the cracked-paving floor, with a small "AK-01" tag on its lower left edge that means nothing to the student. The jars A, B and C and the trays "Solid / Liquid / Gas" give the labels of the answer on the bench, while q1 had pictures-based trays ("Stays a lump / Pools flat / Fills the tank") that did not name the states. Fine to name them here since the student learned the words, but then it is not a re-test of the same stage.

In general for boss-undertow: only phase 1 was opened. Phases 2 to 5 (siphons, vent, melt, dose) were not played.

## In general, Mirrowen

- Nearly every bench prints a how-to sentence on the table ("Drag a card into the flask, press its key, then ...", "Test X in the probe, then ..."). The prompt is the only instruction; the how-to belongs in the first tour only.
- Many Vess tour boxes explain the concept before the student has seen evidence (q2 stages 1, 2, 4, 9; q6 stage 2). The tour should say how to use the instrument; the idea belongs in the reward and debrief.
- Flasks (q3, q6) are drawn as glossy balls with a few tiny dots. The molecule pictures (q1, q3, q5) are small flat pictures at 3D On. The world's core idea is molecules staying whole while they move, and at present the molecules cannot be seen well enough to count or compare.
- Every quest's question card asks something slightly different from the first stage's prompt (q3, q4, q5, q6). The card sets the mystery; stage 1 should start answering it.
- Loading a bench from the URL takes 20 to 30 s showing only "Building the bench" (q3 to q7, boss).
- A small black square sits at the lower right edge of the table on several benches (q3 stages 1 and 5, q5 stage 1).


---

## Second pass: detailed per-stage notes (raw, not yet merged with the notes above)

Where these contradict the first-pass notes above, these win. Not yet played: boss-undertow (all 5 phases) and the q7 debrief. Merging and deduplicating the two passes is not done.

## Second pass (full coverage), appended notes

**q1-states, stage 1, solving.** Once I knew which jar was which, the stage passed with all three cards dropped in trays and the piston never used. A student can pass by guessing. Require each jar to be put through the piston (or the tank) before it can go in a tray, with the message "Try jar A in the piston first."

**q1-states, stage 1, reward card.** "Solid, Liquid, Gas. A solid keeps its own shape. A liquid keeps its volume but takes the shape of its container, and a gas fills its container and can be compressed into less volume." One strip of text at the bottom, no picture. Show the three jars shrinking or spreading in an animation.

**q1-states, general, tour.** In normal play (after "Next stage") no tour box opens by itself; the Vess briefing, e.g. stage 2's definition of a molecule, appears only if the student presses TOUR. A student who never presses it is asked "Which picture of molecules belongs to which jar?" without ever being told what a molecule is. Put the definition in the prompt area as a short line shown on arrival.

**q1-states, stage 2, bench.** The picture cards and the three jar trays are the same size as, or larger than, the trays, so a dropped picture hangs over the tray edge and half-covers the next tray's label ("Jar A" tray with picture 2 sticking out; picture 3 left floating above "Jar B" and not counted until dragged again). Make the trays larger than the cards and snap the card into the middle.

**q1-states, stage 2, miss message.** Submitting with a picture not in a tray gives "Put every picture in a tray." Clear.

**q1-states, stage 2, reward card.** "Molecules in Three States. In a solid the molecules sit in fixed places. In a liquid they slide past one another, and in a gas they are far apart and move freely, so a gas can be compressed." One strip of text, no animation.

**q1-states, stage 3, tour.** Two steps: "Watch first: A similar case plays by itself." and "Card: Drag it to the slot." The second is a how-to-submit step for a gesture taught in stage 1; remove. The first does not say what to look at. Say "Watch what happens to the molecules as the heater turns up."

**q1-states, stage 3, bench, Watch first.** The picture draws each water molecule as one orange dot (in the first seconds blue and white dots are drawn, later all orange). Whether a molecule stays whole or splits cannot be seen from single dots, so the watch-first box cannot inform the prediction the stage asks for. Draw each molecule with its two hydrogens and show them staying joined while they move apart.

**q1-states, stage 3, bench, slot.** The prediction card is bigger than the "My prediction" slot and hangs over its edge; the slot label is half covered.

**q1-states, stage 3, after prediction.** Message "Now Test It. Next, heat a jar of ice and let the analyzer name the molecules it finds." Good, clear. The Hint button disappears as soon as the prediction is committed, so no hint can be opened on this stage afterwards (nothing to check).

**q1-states, stage 4, prompt (real play).** After the prediction the prompt line reads "You guessed each molecule stays whole: which of these changes leave the water molecule whole?" This is clear, but it assumes the student picked the right card; a student who picked another card is still told they guessed "stays whole". Make the sentence follow the card chosen.

**q1-states, stage 4, tour.** Four steps: (1) the Vess line "In a phase change, molecules stay whole and only rearrange. The analyzer names the molecules in a jar." (the answer, shown before testing); (2) "Turn the "Heater" dial. "Read Molecule" names the molecule in the window."; (3) "Drag it into an instrument, then into a tray." (taught in stage 1); (4) "Drag it to where it belongs." Remove steps 3 and 4 and the answer in step 1.

**q1-states, stage 4, bench, window.** After I seated Ice and pressed "Read Molecule" the window shows loose orange and white dots scattered with a yellow ring round one of them and the text "-10 °C H2O". No bonds are drawn between the dots, so the picture does not show molecules; the ring does not say what it marks. Draw each water molecule as O with two joined H, and ring the whole molecule.

**q1-states, stage 4, bench, jar card.** The seated jar card covers the "ANALYZER" label and the left half of the window, as on the piston bench.

**q1-states, stage 4, solving.** I sorted the three changes without turning the heater dial and without testing the "Split water" jar, and the stage passed. The evidence (ice read once at -10 °C) says nothing about melting or boiling. Require the ice to be heated through melting and boiling and the split-water jar to be read before the cards can be filed.

**q1-states, stage 4, reward card.** "Phase Change. The analyzer agreed with your guess. Melting and boiling are phase changes: the molecules stay whole and only rearrange." One strip of text. "agreed with your guess" is wrong if the student guessed something else, and wrong here because the analyzer was never run on melting or boiling.

**q1-states, stage 5, tour (real play).** Two steps: "Turn the "Heater" dial. "Read Molecule" names the molecule in the window." and "Drag it into an instrument, then into a tray." The second is the stage 1 gesture again; remove it. The first is the useful step; show the pointer turning the dial.

**q1-states, stage 5, bench, heater dial.** When the Ice jar card is seated in the window it sits on top of the heater dial, leaving only a sliver of the knob visible at the card's upper-left corner. The dial then takes several drags to move and its readout jumps (-10 to something like -50 and then 5 °C) so I could not tell how to reach a chosen setting. Move the dial away from the seat and use labelled steps (Cold, Cool, Warm, Hot) with the temperature printed.

**q1-states, stage 5, miss message.** After a wrong card: "The analyzer has not been pressed at 5 °C yet." The stage never says to use 5 °C and nothing points at a 5 °C step. The miss message is the first time the student learns that a specific setting is required. Say "Read the ice at two different temperatures" instead of a hidden number, or require "at least two settings".

**q1-states, stage 5, hints.** Hint 1 "Heat the ice jar in the window and press "Read Molecule" at each setting." Hint 2 "Compare how the molecules move at each setting, whether they stay together, and what the analyzer names." Hint 3 opens after one more wrong answer. Each hint has a "What is this?" button beside it, which is good. Hint 1 is the first place that says to heat the jar at all, so it should be in the bench instructions or tour.

**q1-states, stage 5, bench, window.** At 5 °C and at -10 °C the molecule picture is the same loose scatter of dots with a ring round one; it does not show ice molecules in fixed places, so the picture cannot show what holds the molecules of ice in their places. Show ice as a lattice at low settings, loosening as the heater rises.

**q1-states, stage 5, reward card.** "Intermolecular Forces. Molecules attract one another through intermolecular forces: attractions between one molecule and the next. They are separate from the bonds inside a molecule, and melting and boiling only overcome them." Two lines of small text. The new term is used to define itself ("through intermolecular forces: attractions between...") and it is the third time "bonds inside a molecule" appears. Say: "The attraction between one molecule and the next is called an intermolecular force. Melting and boiling overcome it; the bonds inside each molecule stay."

**q1-states, stage 6, tour (real play).** Three steps: "Each jar holds 1.00 L of water in a different state. Density is the mass in a given volume." / "Put a jar on the pan and press "Weigh"." / "Drag it into an instrument, then into a tray." Step 3 is stage 1's gesture (the "tray" here is the strip) and says "tray" for a strip; remove it. "Density" is defined here but the prompt and reward never need the word until the reward.

**q1-states, stage 6, bench, start.** The three jars start already standing on the strip ("Least space each" ... "Most space each") in the order C, A, B. The correct order is A, C, B, so the start is wrong but looks like an answer. Start them in a loose row beside the balance instead.

**q1-states, stage 6, miss message and hints.** Submitting at once: "Not every jar on the strip has been weighed yet." Hint 1: "Drag the jars onto the strip first, then weigh each jar on the balance with its "Weigh" key." but the jars were already on the strip, so the hint contradicts the bench. Hint 2: "Every jar has the same volume and holds the same kind of molecule." (with "What is this?"). Hint 3 not opened (needs one more wrong answer). Rewrite hint 1: "Weigh each jar, then put the jars in order of weight."

**q1-states, stage 6, bench, balance.** Putting a jar on the balance leaves the strip slot empty and then the next jar dropped on the balance knocks the previous jar down onto the lower table edge, where it sits half under the miss/hint panel and cannot be reached easily. Return a weighed jar to the strip by itself, or give the balance a tray for weighed jars. The readout is visible here (917 g beside the card), which it was not in stage 7.

**q1-states, stage 6, solving.** Weights: 1000 g, 917 g, 0.598 g. A student expects the solid to be densest; the stage is solved by reading numbers, which is good. The ranking is "most mass = least space" which takes two reasoning steps (same volume, same molecule) and is stated only in the reward.

**q1-states, stage 6, reward card.** "Density. In equal jars, greater mass means more molecules, so higher density means less space per molecule." One strip of text. It does not say that ice (917 g) is lighter than liquid water (1000 g), which is the surprising result in the stage.

**q1-states, stage 7, tour (real play).** Two steps: "Put a jar on the pan and press "Weigh"." and "Drag it into an instrument, then into a tray." (there is no tray here). The Vess density line seen earlier belongs to stage 6, not this stage. Cut step 2.

**q1-states, stage 7, hints.** Hint 1: "Weigh both jars on the balance with its "Weigh" key, then type your answer in the field at the bottom." The next hint opens "after a wrong answer, or in 41 seconds", a timer I did not see anywhere else. Good that it has a reason, but a student does not know why a hint is locked; say "Next hint in 41 s" with a count. Hint 1 is the first place that says to compare the two weights.

**q1-states, stage 7, reasoning gap.** The stage asks "how many times as many molecules" but the bench only gives grams. The step from "equal mass of the same molecule means equal molecule count" to "1000 g / 0.598 g" is never stated before the answer. Say "Both jars hold water molecules, so more mass means more molecules" on the bench.

**q1-states, debrief, slide 4.** The final slide has the bar picture of water and steam under the Case Pin line "It is still water. The Fifth only locked the molecules in place." The picture has nothing to do with the pin. "The Fifth" is named here with no earlier mention in this quest or this world; a student does not know who or what it is. Show the ice jar, the analyzer reading H2O and the lattice, and say "The Fifth" only once the student has met it.

**q1-states, debrief, slide 3.** On slide 3 the panel shows the gas with eight whole molecules while the counter still says "bonds drawn whole 0 / bonds broken 16" (see slide 2). The counter and the picture contradict each other on two slides.

## Second pass: q2-grip

**q2-grip, stage 1, solving.** Only He and Ne had to be probed. I ordered Ar and Xe by sphere size alone, and the stage passed; probing He and Ne (0.08 kJ and 1.7 kJ) says nothing about Ar or Xe except that the bigger sphere needed more. This is guessing from the pictures, not from heat readings. Require all four to be probed, or make the pictures the same size and let the probe decide.

**q2-grip, stage 1, rail.** A card dropped at the left end of the rail sits higher than the others (He's card floats above the rail line while Ne, Ar, Xe sit on it). Snap every card to the same line, in the order dropped.

**q2-grip, stage 1, reward card.** "London Dispersion Forces. A bigger cloud is pulled out of shape more easily: it is more polarizable, so its dispersion forces are stronger." One strip of small text at the bottom, no animation. "polarizable" is new and not explained. Show two atoms with their clouds flickering and attracting, the bigger cloud flickering more.

**q2-grip, stage 2, tour.** Three steps: the dipole definition (the answer), "Put a card in the slot. "Separate" shows what attracts its molecules and prints the heat." and "Drag it into the probe, onto the rail, or into a tray." (there is no rail or tray here; the last step is a how-to-submit step). Cut step 3; rewrite step 2 as "Drag a card onto the probe and press Separate".

**q2-grip, stage 2, miss message and hints.** Wrong reason without probing: "Separate both HCl and Kr in the probe first." (clear). Hint 1 "Separate hydrogen chloride and krypton in the probe, then lay one reason card in the slot." repeats the bench text. Hint 2 "Compare the masses on the cards and what the probe window shows for hydrogen chloride." but the probe window shows only two small yellow dots (HCl) and two overlapping grey and yellow dots (Kr); no permanent + and - ends are drawn anywhere in the window. Draw the two molecules with their + and - ends turning to face each other for HCl.

**q2-grip, stage 2, bench.** After I put the wrong reason card ("It is the heavier molecule") back, it landed half over the probe's upper edge and hid the "Probe" window's top. Cards dropped outside a zone should return to their starting place. The reason slot is smaller than the card so the card hangs out of it.

**q2-grip, stage 2, solving.** Probing HCl (16.2 kJ) and Kr (9.1 kJ) then choosing the reason card needs no deduction beyond "which card is different": the "permanent + end and - end" card is worded unlike the other two, and the HCl card already has a small dipole drawing on it. The stage would be a real test if all three reason cards were equally plausible.

**q2-grip, stage 2, reward card.** "Dipole-Dipole Forces. A polar molecule attracts through its permanent + and - ends as well as dispersion. These dipole-dipole forces let light HCl beat heavier Kr." One strip of text. "as well as dispersion" refers back to stage 1 without saying so.

**q2-grip, stage 3, prompt and cards.** Prompt "Which needs more heat to separate a mole: water, at 18 g, or hydrogen sulfide, at 34 g?" Cards: "Hydrogen sulfide, because it is the heavier molecule", "Water, because it is the lighter molecule", "About the same heat". The card that picks water (the right prediction) carries a wrong reason ("because it is the lighter molecule"), so a student who guesses right for the wrong reason is told nothing. Make the cards only the answers ("Water", "Hydrogen sulfide", "About the same") and ask for a reason separately, or word the reasons neutrally.

**q2-grip, stage 3, tour.** "Watch first: A similar case plays by itself." (does not say what to look for) and "Card: Drag it to the slot." (a how-to-submit step). Cut the second.

**q2-grip, stage 3, bench, Watch first.** Two blue balls slide along a line, one larger; they are not water or hydrogen sulfide, and nothing is labelled. It is not a "similar case". Show a water pair and a hydrogen sulfide pair and the heat each takes to separate, without the answer.

**q2-grip, stage 3, after prediction.** "Now Test It. Next, separate water, hydrogen sulfide and two more molecules with the probe." Clear. The prediction card hangs out of its slot over the "My prediction" label, the same as q1 stage 3.

**q2-grip, stage 4, prompt (real play).** "You guessed the lighter molecule: which of these molecules form hydrogen bonds with their own kind?" The first clause repeats the prediction card in an awkward way ("guessed the lighter molecule"); "hydrogen bonds" has not been defined at this point unless the student opened the tour. Drop the first clause.

**q2-grip, stage 4, tour.** Same three steps as stage 2: the hydrogen-bond rule (the answer), "Put a card in the slot..." and "Drag it into the probe, onto the rail, or into a tray." Remove the last and the first.

**q2-grip, stage 4, bench, probe window.** After "Separate" on water the window shows two tiny dots (one white, one orange), and on hydrogen sulfide two dots too. No hydrogen bond (dashed line from H to a lone pair) is drawn; the only difference a student sees between the molecules is the reading (40.7 kJ for water, 18.7 for H2S, 23.4 for NH3, 14.6 for PH3). The readings sort water and ammonia from the other two only if the student already believes in a split at about 20 kJ; ammonia (23.4) is not far above H2S (18.7). Show the bond.

**q2-grip, stage 4, bench, trays.** A card dropped in a tray hangs over its bottom edge; PH3 landed in the "Forms hydrogen bonds" tray instead of "Does not" when dropped at the tray's centre, and cards in the same tray overlap each other (NH3, H2O and PH3 stacked, hiding the heat readings). Make the trays tall enough for four cards laid out in a column and snap each card to a free place.

**q2-grip, stage 4, camera.** After submitting, the bench view swings round to look along the table from the side, so the trays are seen at an angle. I think my last drag started on the empty table. A drag on empty table should do nothing.

**q2-grip, stage 4, reward card.** "Hydrogen Bonding. You expected water to attract more strongly, and the probe agreed. Water and ammonia do, and need far more heat to separate than heavier H2S and PH3." "You expected" assumes the student's guess; "Water and ammonia do" has no object (do what?). Say: "Water and ammonia form hydrogen bonds, so they need much more heat to separate than H2S and PH3, which are heavier but do not." The stage passes by the rule in the tour (H on N, O or F), not by any reading.

**q2-grip, stage 5, tour.** Same three steps as stages 2 and 4: the ion-dipole definition (Vess), "Put a card in the slot. "Separate" shows what attracts its molecules and prints the heat." (this probe has a "Drop in Water" key, not "Separate", and an ion does not have "molecules"), and "Drag it into the probe, onto the rail, or into a tray." Rewrite step 2 for this probe and cut step 3.

**q2-grip, stage 5, hints.** Hint 1 is "Test Na+ in the probe, then order all four ions on the rail." (the bench text again) with "What is this?" beside it and a countdown "The next hint opens after a wrong answer, or in 40 seconds." Hint 2 not opened.

**q2-grip, stage 5, solving.** Na+ read 409 kJ. That single number does not place the other three ions, so I ordered them by the size of the sphere on each card (biggest = least heat) and passed: K+, Na+, Li+, Mg2+. A student can pass without reading anything but one value. Require all four ions to be dropped in water.

**q2-grip, stage 5, bench, probe window.** After "Drop in Water" the window shows a small dark ball with a few tiny dots; water molecules are not drawn around the ion, so ion-dipole attraction is not visible. Draw the ion with water molecules turned toward it (O end toward a positive ion) and show more of them closer for a small ion.

**q2-grip, stage 5, reward card.** "Ion-Dipole Forces. The smaller the ion and the larger its charge, the closer the water can come and the more heat is given out." Clear and correct; one strip of text, no animation. It does not say why this stage belongs here (the quest asks what holds water molecules together).

**q2-grip, stage 6, prompt versus bench.** The prompt asks about n-pentane against neopentane, but the text on the table says "Test butane and n-pentane, then lay your answer." and the miss message says "Separate butane and n-pentane in the probe first." Neopentane is never required to be probed. Make the stage ask for the two molecules named in the prompt, or change the prompt to butane and n-pentane.

**q2-grip, stage 6, tour.** Two steps: "Put a card in the slot. "Separate" shows what attracts its molecules and prints the heat." and "Drag it into the probe, onto the rail, or into a tray." (no rail or tray). There is no briefing for the new idea of shape; the student meets "neopentane" cold. Say in one line that neopentane is the same atoms joined as a ball instead of a chain.

**q2-grip, stage 6, hints.** Hint 1 repeats the bench text. Hint 2 "Compare the straight chain of n-pentane with the compact shape of neopentane." already tells the student which is which and, with the reward, gives the rule. Make hint 2 ask a question ("Which molecule can lie along its neighbours?").

**q2-grip, stage 6, bench.** Answer cards "n-pentane", "neopentane", "The same" and a slot "Needs more heat" whose label is covered when a card is placed (the card hangs over it). The skeletal drawings on the cards (a zigzag chain; a cross shape for neopentane) are small flat pictures; at 3D On the chains should stand up and show the bigger contact area. Butane read 22.4 kJ and n-pentane 25.8 kJ, but neopentane (the molecule in the question) has no reading, so the answer rests on the rule and not on evidence.

**q2-grip, stage 6, reward card.** "Shape and Contact. Two molecules with one formula can attract each other differently. A straight chain lies along its neighbours and touches them over its whole length, so it has more dispersion force than a compact molecule of the same formula." Two lines, small text, one idea; fine. Show two chains side by side against two balls to make it visible.

**q2-grip, stage 7, tour.** Four steps: (1) "Drag one atom away from the other. The meter shows the energy." (the only step this stage needs, and it should show the pointer pulling the atom), (2) the probe step, (3) "Drag it into the probe, onto the rail, or into a tray." (no rail or tray), (4) "Drag it to the slot." Cut 3 and 4.

**q2-grip, stage 7, bench.** Pulling the hydrogen away worked smoothly: the dial changes to "Pull Free atoms" and the readout climbs to "ENERGY IN 463 kJ/mol" with a curve drawn under it; this is a good instrument. The curve runs through the words "O-H bond ENERGY IN" under it, so they are hard to read; move the readout above the curve.

**q2-grip, stage 7, evidence versus options.** The bond readout gives 463 kJ/mol for one O-H bond and the probe gives 40.7 kJ for separating a mole of water. 463 against 40.7 is about eleven times, and the options are "About the same", "About twice as much" and "More than twenty times as much". "More than twenty times" is only right if the student knows that a molecule of water has two O-H bonds and doubles 463 (the prompt says "the O-H bonds in a mole of water", plural, with no explanation). Add a card "About ten times as much" and show that each water molecule has two O-H bonds in the picture, or change the prompt to one bond.

**q2-grip, stage 7, bench, answer.** The chosen card ("More than twenty times as much") is larger than the "Comparison" slot, so it sits on top of the slot label and covers the lower right corner of the probe window. After placing it the other two cards sit stranded at the top. Make slots as big as the cards.

**q2-grip, stage 7, reward card.** "An Attraction Is Not a Bond. Breaking the bonds inside water molecules costs over twenty times as much as separating them. When water boils, the molecules stay whole." Clear and short, good. It repeats the "twenty times" that the evidence did not show (see above).

**q2-grip, stage 7, miss message and hints.** Not opened this time (answer was right the first time); opened on the earlier pass only for stages 1 to 6. Hints of stages 7 to 9 unchecked.

**q2-grip, stage 8, tour.** Two steps: "Put a card in the slot. "Separate" shows what attracts its molecules and prints the heat." and "Drag it into the probe, onto the rail, or into a tray." (no rail). The second is the stage's only real action and the first sentence is wrong for it: a student can fill all trays without touching the probe. Rewrite as "Separate each sample in the probe, then drag it into the tray for its strongest force".

**q2-grip, stage 8, bench.** The title on the table does not exist; the prompt "What is the strongest force between the molecules of each sample?" is the only text. Five sample cards X1 to X5 sit along the bottom with pictures of the molecules drawn on them (dipole marks on X1, X2 and X4; a plain sphere on X3; a zigzag chain on X5). The pictures show the answer without any use of the probe, and the stage passed without a single Separate.

**q2-grip, stage 8, tray sizes.** Each tray fits about two cards; three cards stacked in "Dispersion" overlap (X3's sphere sticks out of its card and covers the "Dispersion" label; X1 sat half under it). Make the trays tall enough for three cards and keep spheres inside their cards.

**q2-grip, stage 8, miss message.** With X1 in "Dispersion": "X1 sits in the "Dispersion" tray, and its picture does not match the others there." This tells the student to match pictures, not readings; fine as a nudge but it says "the others there" when only X3 and X5 are there. Say why: "X1 has an O-H group, so its strongest force is not dispersion."

**q2-grip, stage 8, hints.** Hint 1 "Separate each sample in the probe, then drag it into a tray." (repeat of the tour). Hint 2 "Watch what appears between the molecules in the probe and compare the heat readings." (with "What is this?") but the probe window only shows two small dots, nothing "appears between the molecules". Hint 3 not opened.

**q2-grip, stage 8, reward card.** "Reading the Forces. Every molecule has dispersion forces. A polar one adds dipole-dipole forces, and one with hydrogen on nitrogen, oxygen or fluorine adds hydrogen bonds, the strongest of the three." One strip of text; good ranking, but no picture.

**q2-grip, stage 9, tour.** Four steps: (1) the Vess paragraph giving the whole rule (see earlier note), (2) "Put a card in the slot. "Separate" shows what attracts its molecules and prints the heat.", (3) "Drag it into the probe, onto the rail, or into a tray.", (4) "Drag it to the slot." The cards to be sorted are text strips, not molecules; none goes in the probe, so steps 2 to 4 describe actions this stage does not have. Cut them.

**q2-grip, stage 9, bench, cards and trays.** The three region cards ("DNA base pairs (N-H...O, N-H...N)", "Polar protein surface (-OH, -NH2)", "Nonpolar protein core (-CH3, -CH2-)") are wider than the trays, so a card sticks out on both sides and covers the neighbouring tray and other cards (DNA and Polar stacked in "Hydrogen bonding" with the Core card half over the "Dispersion (hydrophobic)" tray). Make trays wider than the cards. The "Water (reference)" and "Hexane (reference)" cards look like sortable cards. The probe is never needed for the answer.

**q2-grip, stage 9, miss message.** With the polar surface in the wrong tray: ""Polar protein surface (-OH, -NH2)" is in "Dispersion (hydrophobic)", which does not match its functional groups." Clear, good. "functional groups" has not been explained.

**q2-grip, stage 9, hints.** Hint 1 "Test water and hexane in the probe to compare polar and nonpolar attractions, then sort the three biomolecule cards." Hint 2 "Look at the atoms in each card: N-H and O-H groups can form hydrogen bonds, whereas -CH3 and -CH2- chains are nonpolar." (the rule again, with "What is this?"). Hint 3 not opened.

**q2-grip, stage 9, reward card.** "Biomolecule Interactions. DNA base pairs and polar protein surfaces use hydrogen bonds (N-H...O, N-H...N, O-H), while nonpolar -CH2- and -CH3 groups fold inward by dispersion forces." Dense for a first meeting with DNA and proteins, and "fold inward" is not shown. The stage is beyond what the quest asked (what holds water together); it reads as an add-on. Cut it, or give it a story reason.

**q2-grip, debrief, slide 1.** Bar chart "heat to pull one mole apart (kJ)" for He 0.08, Ne 1.7, Ar 6.4, Xe 12.6, with round atom icons under the bars. Vess: "Larger electron clouds pull harder on their neighbors: helium needs 0.08 kJ per mole to separate, while xenon needs 12.6 kJ." Fine; "pull" is used for the chart title and the text, but the bench words were "separate" and "attracts". Use one word. The clouds are not drawn anywhere in the debrief.

**q2-grip, debrief, slide 2.** Bars for water 40.6 and hydrogen sulfide 18.7 with their formulas and masses (18 g/mol, 34 g/mol). The probe printed 40.7 kJ for water in stage 4, the debrief says 40.6: use one number everywhere. Good message ("Hydrogen bonds outweigh mass").

**q2-grip, debrief, slide 3.** "one mole of water: pull the molecules apart 40.6 kJ / break every O-H bond 926 kJ". This is where the doubling (2 x 463) appears for the first time; it should have been on the bench in stage 7. The two bars are different colours with no axis.

**q2-grip, debrief, slide 4.** The same picture as slide 3 stays up while the Case Pin card appears under it: "Water molecules are light, yet the canal ice grips like stone. What holds water molecules to each other so hard?" -> "Strong hydrogen bonds between water molecules hold the ice together." The pin answers the card in one line, which is good; the pictures never showed ice or a hydrogen bond. Stages 4 to 6, 8 and 9 (hydrogen bonds themselves, ion-dipole, shape) have no slide.

## Second pass: q3-boil

**q3-boil, arrival.** No question card opened when the bench finished building (q1, q2 and q4 to q7 each showed one on a URL load). The quest starts on the prompt with only the orange line "See why canal water evaporates even below its boiling point." Show the question card here like the others.

**q3-boil, stage 1, tour.** Two steps: "FLASK AND PRESSURE GAUGE: Put a liquid in the flask and press "Settle". The gauge shows where pressure levels off." ("gauge" again; nothing in the flask tells the student what pressure is) and "LIQUID CARD: Drag it into the flask or plate, then to where it belongs." (a how-to-submit step, and there is no plate on this bench). Cut step 2. Say "pressure reading" not "gauge".

**q3-boil, stage 1, miss message and hints.** Submitting a card before using the flask: "Put ether in the flask and press "Settle" to see the two counters." Hint 1 "Use ether, the flask, its "Settle" key and the slot." (repeats the bench text). Hint 2 "Watch the LEAVING and RETURNING counters after you press "Settle"." Hint 3 "Compare the LEAVING and RETURNING numbers once the pressure levels off: they tell you what the molecules are doing." (the answer; it opens after more wrong answers). Hint 2 already gives the answer away.

**q3-boil, stage 1, solving.** After "Settle" the counters read "LEAVING 285 /s" and "RETURNING 285 /s" and the pressure 71.2 kPa. Matching the equal numbers to "As many return as leave" is all the stage asks. The flask picture (a glass ball in a box with a few dots) does not show molecules leaving or returning. The wrong card I removed fell on top of the "At steady pressure" label and covered it.

**q3-boil, stage 1, reward card.** "Vapor Pressure. Molecules still leave and return, at equal rates. The steady pressure of the vapor is the liquid's vapor pressure." One strip of text; the term "vapor pressure" is defined by itself. Say "The pressure the vapor settles at is called the vapor pressure" and show the exchange in an animation.

**q3-boil, stage 2, tour.** Same two steps as stage 1 ("Put a liquid in the flask and press "Settle". The gauge shows where pressure levels off." and "Drag it into the flask or plate, then to where it belongs."). The stage has no plate. Cut both; this stage's new idea (rank by what the flask reads) is not mentioned.

**q3-boil, stage 2, bench text versus hints.** The text on the table says "Drag a card into the flask, press its key, then put the card on the rail." Hint 1 says "Rank the liquids on the rail first, then use the flask and its "Settle" key." These contradict each other (rank first, or test first). A miss message after submitting untested cards says "Not every card on the rail has been through the flask yet."

**q3-boil, stage 2, hints.** Hint 2: "Compare the vapor pressure each card settled at with the attractions you measured on the second bench." (the student is sent back to an earlier bench with no way to look at it; "What is this?" buttons beside both hints).

**q3-boil, stage 2, solving.** Readings: water 3.2 kPa, ethanol 7.8 kPa, ether 71.2 kPa. The numbers decide the order, which is good, but ordering the three cards on the rail was hard: (1) the first card dragged into the flask leaves the rail and the others re-space themselves, so the next drag started on empty table and spun the whole bench camera 90 degrees (I had to reload); (2) cards waiting on the shelf at the right and the rail line moved up to the top edge of the table with its labels hidden behind the cards, so I could not tell where the rail was; (3) cards on the rail overlap each other (water, ethanol and ether stacked half over each other) and cover the "Highest vapor pressure" label. Keep the rail where it is, show its two end labels at all times, and make it wide enough for three whole cards.

**q3-boil, stage 2, flask.** The flask is still a dark glossy ball in a ring when empty, and a glass ball in a grey box when full. A student does not read it as a sealed flask with a liquid in it. Draw a flask.

**q3-boil, stage 2, reward card.** "Attractions Set Vapor Pressure. The weaker the attraction between molecules, the more easily they leave the liquid, so the higher the vapor pressure." Clear. One strip of text.

**q3-boil, stage 3, tour and prompt.** Same two flask steps as stages 1 and 2 (no mention of the temperature printed on each card, which is what this stage changes). Prompt "Which sample has the lowest vapor pressure and which the highest?" The words "warm" and "cold" in the stage title are on no card; each card shows only a number such as "80 °C". Say in the prompt that the samples are at different temperatures: "The four samples are held at the temperatures shown. Which has the lowest vapor pressure and which the highest?"

**q3-boil, stage 3, bench.** Four samples start already on the rail in a set order (ether, acetone, water, ethanol), so the rail looks answered. Testing each card means pulling it off the rail, which re-spaces the others; the rail line then sits at the top edge of the table and its end labels "Lowest vapor pressure" and "Highest vapor pressure" are covered by cards as they are put back. Cards on the rail overlap (four cards in a rail that fits about three).

**q3-boil, stage 3, solving and miss message.** Readings: ether (0 °C) 24.8 kPa, acetone (25 °C) 30.7, water (80 °C) 47.3, ethanol (40 °C) 17.8. Wrong order gave: "acetone sits left of ethanol, and the flask read 30.7 kPa for the one and 17.8 kPa for the other." That is clear and helpful. Hint 1 "Rank the samples on the rail first, then use the flask and its "Settle" key." (again test-after-rank, contradicting the bench text). Hint 2 "Compare the vapor pressure each card settled at with the temperature printed on it." is good.

**q3-boil, stage 3, reward card.** "Heat Raises It. Warming a liquid sends more of its molecules into the vapor, so its vapor pressure climbs steeply with temperature. Warm water settled above cold ether, though water's attraction is far stronger." True and useful (it is the point of the stage). One strip of text; a graph of vapor pressure against temperature for one liquid would show "climbs steeply".

**q3-boil, stage 4 (predict), tour and after.** Tour: "Watch first: A similar case plays by itself." and "Card: Drag it to the slot." (how-to-submit; cut). After the prediction: "Now Test It. Next, find where water boils at that pressure with the flask." The prediction card hangs over its slot as in q1 and q2. Prompt versus cards: the prompt asks "at what temperature" but the three cards answer higher or lower than 100 °C (see first-pass note). Nothing in the quest has introduced kPa or "outside air pressure" or why a mountain has less.

**q3-boil, stage 5, prompt (real play).** "You guessed below 100 °C: at what temperature does water boil when the outside pressure is 65 kPa?" The first clause assumes the guess (see q1).

**q3-boil, stage 5, tour.** The same two flask steps as stage 1. Nothing explains the two dials, which are the new part of this stage.

**q3-boil, stage 5, dials (blocks play).** The dials are not what they look like. Each has a small gold knob at the left of its label ("Heater 20 °C", "Outside sealed"). Dragging or clicking those knobs does nothing, and a drag that misses the knob tilts the whole bench. The settings are actually changed by clicking the long thin track to the right of each label (the top track sets the heater, the second sets the outside pressure; the gold knobs then jump to the clicked spot, at the far upper right). I only found this by trying clicks all over the panel. Move the knob onto its track and make it draggable, and label the tracks with their values (20, 30, ... 100 °C; sealed, 101, 85, 65 kPa).

**q3-boil, stage 5, dials, steps.** Clicking the outside track gave 101 kPa, 85 kPa and then 65 kPa for three clicks at different places along the track, and "sealed" at the start; the heater went 20, 70, 80, 90 °C. No tick has a number on it, so the student cannot choose a value on purpose. With only steps of 10 °C the boiling point (about 88 °C) cannot be read, only bracketed between 80 °C (47.3 kPa, "NOT BOILING") and 90 °C (70.0 kPa, "BOILS"); the answer box wants a number and accepted 90.

**q3-boil, stage 5, flask picture.** When the flask boils the glass ball and its box turn brown and bubble; that is a good visible cue. The label "NOT BOILING / BOILS" above the pressure reading is small. The ball is still a ball.

**q3-boil, stage 5, miss message and hints.** Typed 100 without using the flask: "At 100 °C the flask's pressure is 101.3 kPa, and the outside pressure is 65 kPa." This tells the student why 100 is wrong (good) but never says what to compare. Hint 1 "Use the water card, the Heater and Outside dials, the "Settle" key and the number field." Hint 2 "Compare the line of readings on the plot with the ember line for the outside pressure, and see which heater step the flask boils at." ("ember line" is the orange line labelled "65 outside"; call it "the outside pressure line").

**q3-boil, stage 5, reward card.** "Boiling Point. The flask agreed with your guess. A liquid boils when its vapor pressure reaches the pressure outside it, and that temperature is its boiling point." Good sentence. "agreed with your guess" assumes the guess again (see q1 stage 4). One strip of text; show the vapor pressure line rising to meet the outside line.

**q3-boil, stage 6, tour.** "PROBE: Put a card in the slot. "Separate" shows what attracts its molecules and prints the heat." and "MOLECULE CARD: Drag it into the probe, onto the rail, or into a tray." (copied from the previous quest; no tray). Nothing says that the stage ranks boiling points by the heat that the probe prints.

**q3-boil, stage 6, prompt versus evidence.** Prompt "Which liquid has the lowest boiling point and which the highest?" but the instrument prints "HEAT TO SEPARATE ONE MOLE" (butane 22.4 kJ, n-pentane 25.8, acetone 29.1, water 40.7), and no boiling point appears anywhere. The link "more heat to separate means a higher boiling point" is stated only in the reward after the stage. Add it to the stage (one line), or show the boiling temperature on the card after probing.

**q3-boil, stage 6, bench.** Cards start on the rail with their masses printed (18.0, 58.1, 58.1, 72.2 g/mol) in an order that puts water first and the heaviest last; the masses invite the wrong model (heavier boils hotter), which the quest meant to overturn at the second bench. Probing a card took it off the rail and moved the other cards, then back-to-back drops stacked cards on top of each other and hid the butane card entirely under water's card. The big instruction block "Drag a card into the probe, press its key, then put the card on the rail." is printed in large letters across the lower table and partly hidden behind cards.

**q3-boil, stage 6, miss message and hints.** Wrong order: "acetone sits left of butane, and the probe read 29.1 kJ for the one and 22.4 kJ for the other." Clear. Hint 1 "Use the probe, its key and the rail." Hint 2 "Compare each reading with the mass on its card, and look at which cards are drawn with + and - marks." (the cards in this stage do not show + and - marks).

**q3-boil, stage 6, reward card.** "The Attraction Sets the Boiling Point. Boiling pulls molecules away from their neighbours, so the stronger the attraction, the more heat it takes and the higher the boiling point. Light water boils far hotter than heavier butane." Good and short. One strip of text.

**q3-boil, stage 7, tour.** Step 1 "SURFACE PLATE: Put a liquid in the slot and press "Test"." Step 2 "LIQUID CARD: Drag it into the flask or plate, then to where it belongs." (no flask; how-to-submit step; cut). Neither says what surface tension is or what the number means.

**q3-boil, stage 7, answer dial.** Clicking the dial's tick marks does nothing (I clicked all three); only dragging the small gold knob works ("Set to Ethanol", "Set to Water"). On the flask benches (stage 5) the opposite was true: clicks on the track worked and dragging the knob did nothing. Use one behaviour for every dial: knob on its track, draggable, track clickable.

**q3-boil, stage 7, bench, plate.** Pressing "Test" shows a row per liquid on the plate: "water 72.8", "ethanol 22.3", "hexane 18.4" under the heading "SURFACE TENSION mN/m". A beginner does not know what this number is or why bigger is "higher surface tension" in the question; the picture on the plate is a small flat puck. The three liquid cards still print "attraction 40.7 kJ / 38.6 kJ / 28.9 kJ" (see first pass), so the ranking can be read without the plate.

**q3-boil, stage 7, miss message.** Submitting without any dial setting: "Point the answer dial at one of the three liquids." Wrong answer (ethanol): "The table reads water 72.8 mN/m on attraction 40.7 kJ; ethanol 22.3 mN/m on attraction 38.6 kJ; hexane 18.4 mN/m on attraction 28.9 kJ." This lists the numbers but does not say which is highest or why ethanol is wrong. Say "Ethanol read 22.3; water read 72.8, which is higher."

**q3-boil, stage 7, hints.** Hint 1 "Use the plate, its "Test" key and the answer dial." (repeats the bench text), shown with a countdown "The next hint opens after a wrong answer, or in 34 seconds." Hints 2 and 3 not opened.

**q3-boil, stage 7, reward card.** "Surface Tension. Water: its molecules attract each other most strongly, so its surface resists being broken. That resistance is surface tension." Fine, one strip. "Surface tension" is defined only here, after the question used it; add a one-line explanation (a drop that stands up) before the stage.

**q3-boil, stage 8, tour.** Three steps: "EQUAL BOXES: Put a sample in the box and press "Weigh"." / "LIQUID CARD: Drag it into the flask or plate, then to where it belongs." (no flask or plate; cut) / "PICTURE BOX: Count the discs. Drag it to where it belongs." The third step says to count "the discs" but the pictures are orange balls (and "count the balls" is already the method that gives the answer away). Say what to compare in the question, not in the tour.

**q3-boil, stage 8, bench.** The ice sample reads 0.917 g and water 1.000 g (a good, clear use of the balance, with the readout visible beside the card). The two pictures (A: twelve balls, B: eleven balls) are flat orange balls, not molecules, and differ by one ball; B is a ring of balls round a middle ball, not an open ice lattice. A student who weighs sees "ice weighs less" but has to count balls to match; counting 11 against 12 is fiddly. Use pictures that clearly differ (ice: an open hexagon pattern; water: closer and irregular), and put them standing up at 3D On.

**q3-boil, stage 8, miss message.** With A in "Ice" and B in "Water at 0 °C": "Picture B holds 11 molecules and picture A holds 12, and picture B sits in the "Water at 0 °C" tray." It tells the student to compare counts and which tray was wrong. Clear. It calls the balls "molecules".

**q3-boil, stage 8, hints.** Not opened (the miss message solved it).

**q3-boil, stage 8, reward card.** "Why Ice Floats. Hydrogen bonds hold the molecules of ice in an open lattice with more space between them than in liquid water. The same molecules take more space, so ice is less dense than water and floats." Good content. Nothing floats on screen; show a block of ice rising in water. The question card of this quest asks about water that evaporates below its boiling point, and this last stage is about ice floating; neither stage 7 nor 8 returns to that question.

**q3-boil, debrief, slide 1.** An animated sealed flask: liquid at the bottom, vapor molecules above, counters "left the liquid 95 / came back 87 / in the vapor now 8" and a jagged line plotting "molecules in the vapor". This is the picture the bench flask should have been (bench: a black glass ball with a few dots); it shows the exchange. Vess: "In a sealed flask molecules leave the liquid and come back to it. The gauge stops rising when the leaving and the returning match, and that steady pressure is the vapor pressure." ("gauge" again.)

**q3-boil, debrief, slide 2.** Two flasks, "25 °C" with one vapor molecule and "3.2 kPa", and "80 °C" with eight and "47.3 kPa", labelled "water, sealed". Good. While it changes slides the next slide's faint words ("boils at 100 °C", "101 kPa") show through behind it for a moment. The text "water pushes at 3.2 kPa" uses "pushes", a word the owner has flagged; say "water's vapor pressure is".

**q3-boil, debrief, slide 3.** A vapor-pressure curve for water from 20 to 100 °C with a dashed line "outside 65 kPa" meeting it at "boils at 88 °C". This is the only place the exact 88 °C appears (the bench could only give 80 and 90). Vess: "A liquid boils when its vapor pressure reaches the pressure outside it. Water does that at 100 °C at sea level, and at 88 °C where the outside pressure is 65 kPa." There is no fourth slide and no Case Pin that answers the quest's question ("Why does canal water evaporate even below its boiling point?"), unlike q1 and q2. Add a slide: "Water leaves the surface at any temperature; boiling is only when it reaches the outside pressure".

## Second pass: q4-solids

**q4-solids, arrival.** The bench took about 50 s to build after a reload ("Building the bench" with the question card half faded behind it). Question card: "The canal barrier looks like ice, but glass looks like ice too. Which is it?"; the first prompt "Which of these are molecular solids?" does not mention glass or the barrier.

**q4-solids, stage 1, tour.** Two steps: "TESTER: Put a sample in. Turn the "Test" dial and press "Test"." (the tour demo then seats the ice card in the tester) and "SOLID SAMPLE: Drag it into the tester, then into a tray." (cut). The tester has two tests (melt and a lamp/current test) but the tour names only "Test", and "the Test dial" is the tiny gold knob at the left of "Test Melt" with no label on its steps.

**q4-solids, stage 1, solving (blocks nothing, but the stage can be skipped).** I dropped all five cards in trays without putting any sample in the tester and the stage passed at once: "Molecular Solids. Ice, iodine and naphthalene are whole molecules held by weak attractions, so little heat frees them and the lamp stays dark. Gallium melts low but its lamp lit, so it is not molecular." The student never saw a melting trace or a lamp, yet the reward talks about both. Require every sample to be through the tester before it can go in a tray ("Ice has not been in the tester yet." is already the message for later stages).

**q4-solids, stage 1, bench.** Tray cards fill the tray edge to edge. Five grey rock pictures labelled ice, iodine, naphthalene, gallium, salt all look the same, so nothing on the bench but the tester tells them apart.

**q4-solids, stage 1, reward card.** The text above is two long lines at the bottom edge. "the lamp" is never explained: say "the lamp lights if the solid conducts electricity".

**q4-solids, stage 2 (predict), tour, bench, after.** Tour: "Watch first: A similar case plays by itself." and "Card: Drag it to the slot." (cut). The "Watch first" box shows the same orange dots with the caption "WATER" at the left and "HEATER" at the right that appear in the water benches; there is no quartz or glass in it, and the caption "WATER" on a quartz stage is wrong. Cards: "Both stay hard, then melt at one temperature" / "Quartz melts at one temperature; the glass goes soft gradually" / "The glass holds its shape to a higher temperature than quartz". The middle card is longer and more exact than the other two, so it reads as the answer. After the prediction: "Now Test It. Next, heat quartz, fused silica glass and two more solids in the tester."

**q4-solids, stage 3, prompt (real play).** "You guessed the glass would go soft gradually: which solids melt at one temperature and which soften over a range?" The first clause assumes the guess again.

**q4-solids, stage 3, tester (works well).** Seating quartz and pressing "Heat" draws a trace that stays flat and falls straight down at 1713 °C; fused silica falls in a slope over 1040 to 1585 °C. The card keeps its reading ("quartz 1713 °C", "fused silica 1040-1585 °C") after it leaves the tester. This is a clear bit of evidence. The particle window next to the trace is a small flat scatter of grey, white and red dots whose pattern cannot be told apart for the two solids; show an orderly lattice for quartz and a jumble for glass, standing up at 3D On.

**q4-solids, stage 3, solving.** I tested quartz and fused silica only and filed salt and copper without testing; the stage passed. Salt and copper cards still show only the grey rock picture. Require all four to be heated, as the later stages already do ("... has not been in the tester yet.").

**q4-solids, stage 3, reward card.** "Crystalline and Amorphous. Your guess matched the traces. The solids whose particles sit in a repeating pattern, crystalline solids, melt at one temperature." The title says "Amorphous" but the text never defines it (the second half about the glass is missing), and "Your guess matched the traces" is said to every student whatever they chose.

**q4-solids, stage 4, tour.** Step 1 is a Vess paragraph that defines all four kinds at once ("Metals hold ions in a sea of mobile electrons; ionic solids hold fixed ions that move only when molten; covalent network solids lock atoms in a full-crystal bond web, and molecular solids hold separate molecules."); with it the student only has to match each sample to a sentence. Steps 2 and 3 are the same two tester steps as stage 1 ("Put a sample in. Turn the "Test" dial and press "Test"." and "Drag it into the tester, then into a tray."). Show the three tests (melt, hammer, lamp) and let the student find out what each kind does.

**q4-solids, stage 4, tester dial.** The "Test" dial changes the test: "Test Melt" (trace to 2000 °C), "Test Strike" ("ONE HAMMER BLOW"; the hammer picture breaks into shards and the word "shatters" appears), and presumably the lamp. Clicking the knob does nothing; only dragging it works, and when a sample card is seated it covers the knob, so the student must take the card out, change the test and put it back. Put the test dial where a seated card cannot cover it. The hammer result is clear and good. The melt reading is printed on the card (X1 "1713 °C shatters") and stays after it leaves.

**q4-solids, stage 4, solving.** X1 (quartz) melted at 1713 °C and shattered. I did not test X2, X3 or X4 at all and filed them by what I expected (copper, naphthalene, salt) and the stage passed. The stage as built never requires evidence; a student who has not tested the samples can still pass by guessing.

**q4-solids, stage 4, bench.** Taking a card out of the tester dropped it on the "Molecular" tray label and hid it. Cards in the trays hang out of them to the right, leaving a dark half-tray empty beside each card. The tray names ("Metallic", "Ionic", "Network", "Molecular") are not defined anywhere but in the tour.

**q4-solids, stage 4, reward card.** "Four Records. Metals flatten and light the lamp cold; ionic solids shatter and light it only molten. Network solids shatter, never light it and melt highest; molecular solids crumble and melt low." One strip of small text with four rules packed in, and "light the lamp" again. This should be a four-row table animation: hammer, lamp, melt for each kind.

**q4-solids, stage 5, solving.** The cards print a hammer result and two lamp results; X1 (the glass) and X5 (the ionic solid) print the same three lines ("shatters / lamp cold: no / lamp molten: yes"). The reward says only their melting trace tells them apart, so the Melt & Trace Viewer is needed for those two. I filed all five on the first try and the stage passed without a single heating, so the one instrument that matters was never used. Require the two look-alike samples to be through the viewer, or make the pass depend on them.

**q4-solids, stage 5, bench.** "Melt & Trace Viewer" panel at the top left is empty until a sample is seated. Five trays "Metallic / Ionic / Network / Molecular / Amorphous" each about a card wide, so cards touch the next tray's label. Tour is the same two steps as before, with "turn the Test dial" for a tester that has no dial in this stage (the viewer has only "Heat").

**q4-solids, stage 5, reward card.** "The Whole Record. The window glass shattered, stayed dark cold and lit the lamp molten, just as the ionic solid did. Only its trace told them apart: no single melting temperature means no repeating pattern, so it is amorphous." Good idea; "window glass" and "the ionic solid" are not named on the cards (X1 and X5), so the student cannot tell which is which. Label the cards by their results, not by letters, in this sentence ("X1 and X5").

**q4-solids, stage 6, tour.** Step 1 (Vess): "Long polymer chains attract one another by dispersion forces that grow with chain length, yet soften when warmed; covalent cross-links between chains lock them into a rigid network." (gives the whole rule before any test). Steps 2 and 3 are the usual "Turn the "Test" dial" and "Drag it into the tester, then into a tray." The word "polymer" is not defined anywhere.

**q4-solids, stage 6, bench and solving.** Three samples (naphthalene, polyethylene, cross-linked resin) and two trays, "Dispersion between chains" and "Covalent cross-links". Naphthalene is a small molecule, not a chain, so "Dispersion between chains" is the wrong name for its tray (the prompt says "between molecules or chains"). I filed them without testing; a wrong placement (resin in the dispersion tray) gave no red message at all while hint 1 ("Heat and strike each sample in the tester, then sort them into trays.", with "The next hint opens after a wrong answer, or in 33 seconds.") was open: pressing Submit twice changed nothing visible. A refusal must always show its message, whatever else is open.

**q4-solids, stage 6, reward card.** "Polymers and Cross-Linking. Polyethylene softens higher than small naphthalene molecules because longer chains have stronger dispersion forces. Covalent cross-links lock chains together so the resin stays rigid until high heat." Two lines of small text; the stage never made the student see the difference in softening (nothing had to be heated). The facts are fine; the reward introduces "polymer" and "cross-link" for the first time after the stage.

**q4-solids, debrief, slide 1.** Fifteen iodine molecules, each drawn as two joined balls, drifting in a box at "120 °C" with the caption "15 of 15 molecules whole", and a number line of melting points for ice, naphthalene and iodine. Good and clear. Vess: "Iodine, naphthalene, and ice all melt below 115 °C while their molecules stay intact. Only the forces between molecules give way." The number line's tick labels (0, 50, 100) are small.

**q4-solids, debrief, slide 2.** Quartz (an even honeycomb of atoms) next to fused silica glass (a jumbled net) at "2000 °C", each with its melting trace under it. This is exactly the picture the bench "particle window" should have shown while the student was heating the samples. Vess: "Quartz stayed solid up to 1713 °C and then melted all at once. Fused silica, made of the same atoms, softened gradually from 1040 to 1585 °C."

**q4-solids, debrief, slide 3.** Two histograms of "angles at the silicon" (quartz: 2 bars at about 120 degrees, "every silicon alike: 2 angles at the silicon"; glass: 10 bars, "silicons differ: 10 angles at the silicon"), axis 60°, 120°, 180°. The label at the left is cut off at the window edge ("very silicon alike"). The idea (every bond the same, so it all breaks together) is good but "angles at the silicon" is jargon, and the histogram is a graph type no earlier stage showed. Show two bond lengths or a few bonds being broken at once vs one by one instead.

**q4-solids, debrief, slide 4 (Case Pin).** "The canal barrier looks like ice, but glass looks like ice too. Which is it?" -> "The barrier melts at one sharp temperature, proving it is a crystal, not glass." The quest never had the student test the barrier's melting; the pin states a result the student did not see. Either add the barrier as a sample in stage 3 (it melts sharply) or say "If the barrier melts at one sharp temperature, it is a crystal".

## Second pass: q5-crossing

**q5-crossing, arrival.** About 55 s of "Building the bench" after the URL load, and the words "Building the bench" stay printed inside the graph area for a moment after the bench is visible and the question card is already up.

**q5-crossing, stage 1, solving.** The number dial can be dragged smoothly (about 100 px of drag moved it from 0 to 7 kJ in steps of 0.5), pressing Heat three times drew the line to 9 kJ, and the stage passed with the dial at 7 kJ (the flat stretch ends at about 6.8). Good instrument. The ice picture turns orange once it is warm, which does show a change of state, but no ice is seen melting during the flat stretch. Reward: "The Heating Curve. A heating curve is a graph of temperature against the heat added. This ice stood still at 0 °C while about 6 kJ went in, so heat added does not always raise the temperature." Fine; one strip of text.

**q5-crossing, stage 1, tour.** The tour has a single step, "Press "Heat". The pen draws temperature against the heat added." which sends the student to press Heat first (it then refuses: see first pass). The briefing "A heating curve plots a sample's temperature against the heat added to it." is shown only when the student opens the tour.

**q5-crossing, stage 2 (predict), cards.** "It leaks out of the cup into the air" / "It works against the attraction between molecules" / "It warms the cup and the air, not the ice". The card with the right answer is the only one that uses the quest's own vocabulary ("attraction between molecules"), so it reads as the answer. After the prediction: "Now Test It. Next, warm the ice again with a window on twelve of its molecules, and watch what the heat does while the thermometer stands still."

**q5-crossing, stage 3, prompt (real play).** "You guessed that it separates the molecules: what does the heat do to the molecules while the thermometer stands still?" The first clause gives the answer, and a student who guessed something else is told they guessed "separates the molecules".

**q5-crossing, stage 3, tour.** One step: "HEATER AND RECORDER: Press "Heat". The pen draws temperature against the heat added." (stage 1 again); the demo that plays presses Heat and leaves the bench at 16.4 °C, +8.00 kJ.

**q5-crossing, stage 3, bench and solving (no answer control).** There is no card, dial or slot for an answer. The bench only has the heater with "Heat per press +8 kJ", a window on twelve molecules, a graph to 70 kJ and the text 'Set the dial, press "Heat" and watch the window.' (there is no dial). Pressing Submit after two presses (16 kJ, 100 °C) refused with "At 16.0 kJ the window shows 1 of the twelve molecules flying free." The student is never told that the stage ends when all twelve are free. I only found out by pressing Heat seven more times, to 56 kJ (the pen climbing to 129.6 °C), and pressing Submit again, which passed. Say in the prompt what to watch for ("Heat the ice until every molecule is flying free"), and put a counter "free: 3 of 12" next to the window.

**q5-crossing, stage 3, window.** The twelve molecules are drawn as orange and white dots; the ice at the start is not a lattice (see first pass). The bench drawing near the thermometer changes to a tall orange column when hot, which is the thermometer, not water.

**q5-crossing, stage 3, reward card.** "Heat Against the Attraction. You guessed this, and the window agrees. While the thermometer stood still, the molecules were being freed: first from their places in the ice, then from one another as steam." Good. "You guessed this" again assumes the guess.

**q5-crossing, stage 4 (More Ice), tour and bench.** The tour is one step ("HEATER AND RECORDER: Press "Heat". The pen draws temperature against the heat added."). The bench shows a card "What you may use: 1 mol of water is 18.0 g" and the text "Heat the cup to see its line, then type your answer." The cup is 18.0 g and the question asks about 36.0 g, so the student reads the flat stretch (6 kJ) and has to double it; "mol" is used before the quest has explained a mole (the card is the only help; the Primer button is there).

**q5-crossing, stage 4, miss message and solving.** Answer 6: "6.0 kJ melts about 18.0 g of ice at the rate the cup showed, not 36.0 g." This is a good message (it says what the number measured). 12 passed. Reward: "Heat of Fusion. Melting one mole of ice at 0 °C takes 6.01 kJ: its heat of fusion. The heat is the number of moles times that figure, so 36.0 g, which is 2.00 mol, takes 12.0 kJ." Clear; one strip of text.

**q5-crossing, stage 5, tour.** Step 1 is a Vess worked example for the previous question type: "A sloping stretch takes mass x c x dT. A level stretch takes moles x the heat of fusion or of vaporization, the heat to boil one mole. 18.0 g of ice at 0 °C to water at 100 °C: melt: 1.00 mol x 6.01 = 6.01 kJ; warm: 18.0 g x 4.18 x 100 = 7.52 kJ; total 13.5 kJ". This is the method and nearly the same sum as the stage (ice to water at 100 °C, instead of water at 0 °C to steam at 100 °C); the student only needs to swap the boiling term in. "c" and "dT" are not introduced. Step 2 is the usual "Press "Heat"" step.

**q5-crossing, stage 5, bench.** The bench shows a card "What you may use: Water: 4.184 J/(g.°C); Boiling: 40.65 kJ/mol; 1 mol of water is 18.0 g". The "Heat" button is on the recorder but the student never needs it: the stage is arithmetic. The title text on the table says "Type your answer in the field at the bottom." Using the recorder to find the answer by pressing Heat until the pen reaches steam (about 48 kJ in 12 kJ presses) would work without calculation; the data card makes the calculation the intended route. State which of the two the stage is for.

**q5-crossing, stage 5, miss message and hints.** Answer 7.5: "7.5 kJ would leave the 18.0 g as water at 100 °C." Clear. Hint 1 "Use the recorder to see the path, the plate for the figures, and the field for your answer." Hint 2 "Follow the sample from water at 0 °C to steam at 100 °C and count both stretches: one slope and one level stretch." (this is the structure of the answer). 

**q5-crossing, stage 5, reward card.** "Heat of Vaporization. Warming the water takes 7.53 kJ and boiling it takes 40.6 kJ, adding to 48.1 kJ. Boiling a mole takes 40.65 kJ, the heat of vaporization, almost seven times the heat of fusion." I typed 48.2 and it passed; the reward says 48.1; show one number. "Almost seven times" is a new comparison to the stage 4 figure (6.01); 40.65 / 6.01 = 6.8, which is right.

**q5-crossing, stage 6 (A Burn), tour and bench.** Tour: "COOLER: Put a sample in the slot and press "Cool"." and "SAMPLE CARD: Drag it into the cooler, then onto the rail." (no rail; cut). The bench is clear: a "Cooler: to 37 °C" box, two sample cards "Water 100 °C 1.00 g" and "Steam 100 °C 1.00 g", three answer cards and a slot "Extra heat comes". The cooler showed water gave 0.26 kJ and steam 2.52 kJ, with a long flat stretch drawn for the steam. This is the best use of evidence in the quest: the numbers decide it. The prompt says "gives a hand", but the box says "cooled to 37 °C" and "HEAT GIVEN TO A HAND"; the hand is never drawn.

**q5-crossing, stage 6, reward card.** "Why Steam Burns. Steam at 100 °C gave 2.52 kJ a gram, water at 100 °C only 0.26 kJ. Most of the steam's heat comes out as it condenses to liquid water, before it cools at all." Good and short; one strip of text.

**q5-crossing, stage 7, tour.** One step: "PRESSURE AND TEMPERATURE: Pick a pressure with the dial and press "Heat"." This is the only stage in the quest whose tour matches the stage. The bench text "Turn the "Pressure" dial and press "Heat"." is the same sentence on the table.

**q5-crossing, stage 7, solving and the answer.** The answer is the dial: set pressure low enough that the sweep shows no liquid, then Submit. Dragging the knob worked (101 kPa to 1 kPa to 0.3 kPa; the readout "0.3 kPa SET"). At 1 kPa the "LAST SWEEP" list read "solid -40 to 0 °C / liquid 0 to 7 °C / gas 7 to 400 °C"; at 0.3 kPa "solid -40 to -8 °C / gas -8 to 400 °C". That is clear evidence, but nothing tells the student the answer is the dial position: the prompt asks "At what pressure does warming ice never make liquid water?" and there is no answer field or label saying "Your answer: 0.3 kPa". Say "Leave the dial at your answer and press Submit."

**q5-crossing, stage 7, bench.** The knob sits over the readout "Pressure 0.3 kPa" so the number is half hidden while the dial is at the left. The pressure axis is "PRESSURE (kPa, TEN TIMES PER STEP)" from 0.1 to 100k kPa: the "ten times per step" wording and the log scale are new and unexplained. The card on the right "Water's states: Phase diagrams map state by pressure and T." says "T" for temperature.

**q5-crossing, stage 7, reward card.** "Phase Diagrams. On water's phase diagram, below 0.611 kPa (the triple point) ice turns straight to vapor. Far above it, past the critical point, liquid and vapor are no longer different." "triple point" and "critical point" are new terms with no picture; the second sentence is about something the bench never showed. A phase diagram (the map the bench is tracing) is never drawn until the debrief, if at all.

**q5-crossing, debrief, slide 1 and 2.** Slide 1: a heating curve drawn as it plays (the line, "6.01 kJ" on the first flat stretch) with a row of twelve molecule dots beneath ("twelve molecules"), the temperature "100.0 °C" and "26.0 kJ added". The two readouts print on top of each other ("100.0 °C" runs into "26.0 kJ added") and sit over the axis title "heat added (kJ)". Vess: "A heating curve climbs as heat warms the ice, then stays flat at 0 °C while 6.01 kJ per mole goes into melting." Slide 2: the same curve with "40.65 kJ" on the upper flat stretch and "110.0 °C / 54.9 kJ added". Vess: "That heat frees molecules from their fixed crystal spots, and boiling a mole of liquid water takes 40.65 kJ." The dots change colour (orange, green) with no key.

**q5-crossing, debrief, slide 3.** The curve run backwards: "-10.0 °C / 0.0 kJ added" and a new line "way down: -54.9 kJ", again overlapping the first readout. Vess: "Cool it back down and steam condenses and freezes, releasing the exact same heat: 54.9 kJ on the way down." "way down" is odd wording; the negative sign is not explained. Nothing here shows the stage 6 result (steam burns).

**q5-crossing, debrief, slide 4 (Case Pin).** "The canal barrier has to be melted. Where does the heat go while it melts?" -> "Melting uses heat to free the molecules, even while the temperature holds steady." Good; answers the card. The pin does not mention steam or pressure (stages 5 to 7).

## Second pass: q6-solution

**q6-solution, arrival.** About 65 s of "Building the bench" after the URL load (the longest of the quests).

**q6-solution, stage 1, tour.** One step: "SAMPLE CARD: Drag it onto the balance or the flask, then into a tray." The bench has a flask bench; the tour does not explain it and the balance is not used in this stage.

**q6-solution, stage 1, solving (works well).** Seating a sample card in the flask mouth shows the powder going into water in the window: A and C spread out as many separate particles (blue and green balls, with white dots), B and D stay packed in lumps; the card then prints "water: spreads" or "water: lumps". The evidence is real and the student must test each sample to read it. A wrong filing gave a clear message: "Sample B sits in the "Dissolves" tray, and in the window its particles stayed packed together." The stage passed after the swap.

**q6-solution, stage 1, bench problems.** (1) The particle crowd is not clipped to the window: green and blue balls and small dots float over the table above and beside the flask bench (see the first screenshot of Sample A). (2) The cards in the trays are two columns wide and hang over the tray edge. (3) A card put in the flask sits over the flask's own label ("Flask bench"/mouth), and the test card replaced by the next one jumps to a shelf. (4) The flask is still a glossy blue ball (see first pass).

**q6-solution, stage 1, reward card.** "Solutions. A solution is a mixture that is the same all the way through. The solute spreads out as separate particles through the solvent, so dissolved salt is not gone: it is still there, in pieces." Good, links to the premise (the chemical is in the canal water). One strip of text; "solute" and "solvent" are defined in one sentence each, which is fine, but a picture of the crowd spreading would do it better.

**q6-solution, stage 2, tour (real play).** Three steps: the Vess box (molarity definition and a worked example for 11.7 g in 0.500 L, different numbers from the stage's 5.85 g in 400 mL; the molar mass is 58.5 there and 58.44 on the bench plate), "FLASK BENCH: Drag a sample onto the balance or the flask. The window shows its particles." and "SAMPLE CARD: Drag it onto the balance or the flask, then into a tray." (no tray here; cut). Step 2 is correct for this stage.

**q6-solution, stage 2, bench and solving.** The salt card goes on the balance (reads 5.85 g, big readout beside the card, legible), the "Molar mass: sodium chloride 58.44 g per mole" card sits at the right, and the flask has a dial "Flask 100 mL" (steps 100, 250, 500). The answer needs 5.85 / 58.44 = 0.100 mol divided by 0.400 L, and 400 mL is not a flask size, so the student has to calculate; the flask and window are not needed. The balance and the plate are enough. Good for a calculation stage, but the instrument that is the point of the quest (a flask with crowded particles) is idle.

**q6-solution, stage 2, miss message and hints.** Answer 1.00: "1 does not fit 5.85 g of salt made up to 400 mL." (says it is wrong but not why or by how much). Hint 1 "Use the balance, the flask and its "Flask" dial: weigh the salt, then drag it into the flask." Hint 2 "Compare how crowded the window is at each flask size, and read the molar mass off the plate." Hint 2 is a good nudge; hint 1 repeats the bench text.

**q6-solution, stage 2, reward card.** "Molarity. The moles of solute in each litre of solution is its molarity, written M. Here 5.85 g is 0.100 mol, so 250 mL is 0.400 M and 500 mL is 0.200 M, and 400 mL, between them, is 0.250 M." The line "so 250 mL is 0.400 M" is a better teaching sentence than the tour. One strip of small text; a picture of the same crowd in three flasks would show "less crowded = lower molarity".

**q6-solution, stage 3, tour.** Two steps only: "FLASK BENCH: Drag a sample onto the balance or the flask. The window shows its particles." and "SAMPLE CARD: Drag it onto the balance or the flask, then into a tray." This stage has a stock card, one dial ("Stock poured in 10 mL") and no tray; neither step describes it. The text on the table is right ("Drag the stock into the flask, turn the dial, then type your answer.").

**q6-solution, stage 3, bench and solving.** Bench: a "Stock 2.00 M" card, the flask with a "Stock poured in 10 mL" dial (10 to 50 mL steps), and a card "Target: 100 mL of 0.500 M". 25 mL is not a dial step (the steps either side give 0.400 M and 0.600 M), so the answer must be calculated; I typed 25 without seating the stock or turning the dial at all and the stage passed. The window and dial are optional. Say whether the stage is for reading the dial or for calculating.

**q6-solution, stage 3, miss message and hints.** Answer 50: "50 mL does not give 0.500 M: the dial reads 1.00 M at 50 mL." (refers to a dial reading the student never took). Hint 1 "Drag the stock into the flask and turn the "Stock poured in" dial, reading the molarity under the window." Hint 2 "Compare the molarity at the two steps of the dial either side of the 0.500 M target." Both have "What is this?" buttons. They describe an interpolation route the stage does not require.

**q6-solution, stage 3, reward card.** "Dilution. Adding water changes the litres the moles share, not the moles. So M1V1 = M2V2: 25.0 mL of 2.00 M stock topped up to 100 mL makes 0.500 M, a dilution." Good first sentence (it is the idea). The formula appears with no derivation; one strip of text.

**q6-solution, stage 4 (predict), tour and after.** Tour: "Watch first: A similar case plays by itself." and "Card: Drag it to the slot." (cut). After the prediction: "Now Test It. Next, put each sample in the flask and count what the window shows." The prediction cards: "All three put the same number in", "Table salt, NaCl", "Calcium chloride, CaCl2", "Sugar, C12H22O11" (formulas never explained; a beginner cannot read CaCl2 as one calcium and two chlorine).

**q6-solution, stage 5, prompt (real play).** "You guessed calcium chloride: how many moles of particles does 0.100 mol of calcium chloride put in the water?" The first clause gives the answer for the card the student picked (the one that is right); the question itself, "how many moles of particles", is new vocabulary.

**q6-solution, stage 5, tour.** One step on a tour that shows the table salt card seated in the flask: "SAMPLE CARD: Drag it onto the balance or the flask, then into a tray." There is no tray here (the answer is typed). The demo seats the table-salt card, a sample that is not the one the prompt is about.

**q6-solution, stage 5, bench and miss message.** Seating calcium chloride in the 500 mL flask shows a window of green and blue balls and many small white dots, some outside the frame, none counted for the student. Typed 0.1: "0.1 mol is one particle for each calcium chloride, and the window shows more than one in the water." Typed 0.3 (known from the formula, not counted: the crowd has too many dots to count): passed. Counting ions in the window is impossible at this crowding (the dots flicker and overlap the frame); show a fixed count of formula units (say five) and let the student count each ion kind.

**q6-solution, stage 5, reward card.** "Dissolving Into Ions. You expected calcium chloride to put the most in, and the window agreed. A salt that dissolves in water separates into its ions, each wrapped in water." "ions" is introduced here, after the stage used the idea, and "wrapped in water" is not shown (no water molecules are drawn round any ion). "You expected" assumes the guess again.

**q6-solution, stage 6, tour.** "FLASK BENCH: Drag a sample onto the balance or the flask. The window shows its particles." and "SAMPLE CARD: Drag it onto the balance or the flask, then into a tray." The stage's new part, the "Liquid" dial that switches the flask between water and oil, is not mentioned. The text on the table does say "Drag a sample in, turn the dial, then file it." but does not say the dial has to be turned for every sample.

**q6-solution, stage 6, liquid dial (hard to operate).** Dragging the knob 85 px (what worked for the dials on other benches) leaves it on "Liquid Water"; clicking it or its track does nothing; only a full-width drag across the panel (from the knob to the far right, about 220 px) switched it to "Liquid Oil (hexane)" and the same long drag back switched it to water. Nothing shows this: the knob sits at the left under the label and the track is not drawn. It can only be changed while the flask is empty, because a seated sample card covers the knob. Draw the track, make the knob draggable over a short distance, and let the dial change with a card seated.

**q6-solution, stage 6, miss message and solving.** Filing the samples after testing salt in water only gave "Salt has not been in both liquids yet." So every sample must be tested in both liquids, eight tests in all (this is the most work of any stage in the quest, with the least-obvious dial). The window then shows "water: spreads / oil: lumps" for salt and sugar, "water: lumps / oil: spreads" for wax and "water: spreads / oil: spreads" for acetone, printed on the card (good). Each test after the first moved the previous card to a shelf above the table, where cards piled up.

**q6-solution, stage 6, hints.** Not opened (the miss message showed what to do).

**q6-solution, stage 6, reward card.** "Like Dissolves Like. Substances whose particles pull on each other in similar ways tend to dissolve in each other: like dissolves like. Salt and sugar are soluble in water, wax in oil, and acetone, which is miscible with both, in either." "pull on each other" is the euphemism the owner has flagged; "soluble" and "miscible" are new and not defined. "Like dissolves like" is a good phrase; show a polar and a nonpolar example with the attraction drawn.

## q6-solution, stage 7 (Three Sealed Flasks)

**q6-solution, stage 7, tour.** One step on the tour: "SAMPLE CARD: Drag it onto the balance or the flask, then into a tray." (no tray; the thing to put the cards on is a strip). The text on the table is right: "Drag a flask card onto the flask, then put it on the strip."

**q6-solution, stage 7, miss message and hints.** Submitting the starting order (Y, X, Z): "Y sits left of X, and the drop of Y shows 12 whole molecules against 6 positive and 6 negative particles for X." This message gives the data the student was supposed to find (without having tested any flask). Hint 1 "Drag each flask card onto the flask's mouth, then put it on the strip." Hint 2 "Count the particles of each kind in the window, and compare them with what each sample breaks into." ("each kind", "breaks into" are unexplained).

**q6-solution, stage 7, the evidence cannot decide it (important).** Putting a flask card on the flask shows a window with the counter "12 PARTICLES", and all three flasks (X, Y and Z) say "12 PARTICLES". The ranking needs the number of dissolved formula units (sugar 12, sodium chloride 6, calcium chloride 4), which the counter does not give and the window does not group (the ions are loose balls). The student can only pass by knowing the formulas of three unnamed samples (cards show only "X sealed", "Y sealed", "Z sealed"), or by guessing: the first-listed order was wrong and nothing on screen says which flask is which substance. Show the formula or the ion pairs on each card ("sugar", "table salt", "calcium chloride") and a counter of dissolved units ("6 formula units").

**q6-solution, stage 7, bench.** The crowd is not clipped to the window: a column of green and blue balls rises out of the flask window up through the air above the bench (the whole drop is visible far above the table). Taking a card out of the flask moves the others; a drag that missed a card (the second card had moved after the first swap) swung the camera up to the ceiling and I had to reload. The strip labels "Lowest molarity" and "Highest molarity" are mostly covered by the cards once three cards are on the strip.

**q6-solution, stage 7, reward card.** "Same Crowd, Different Molarity. Every drop held 12 particles, yet the molarities differ: sugar gives one particle for each molecule, sodium chloride two and calcium chloride three. Molarity counts what was dissolved, not the pieces it breaks into." This is the idea of the stage and it is clear and short; it is first said after the stage, and the substance names appear here for the first time.

**q6-solution, debrief, slide 1.** A box of 12 loose ions (blue "+" and green "-" balls) with small grey water molecules clustered around each, counters "ions in the water 12 / ions still in the crystal 0". Vess: "Dissolved salt does not vanish. Its ions leave the crystal one by one and spread through the water, each surrounded by water molecules." This is the first time the student sees water molecules round an ion, which the bench window (stage 5 reward: "each wrapped in water") never showed. Good picture; show it in stage 5.

**q6-solution, debrief, slide 2.** Three small boxes: "4 x NaCl particles 8", "4 x CaCl2 particles 12", "4 x sugar particles 4". Vess: "Four units of sodium chloride split into 8 ions, four of calcium chloride into 12 ions, and four of sugar stay 4 molecules. Molarity counts formula units, not split ions." Clear, and it is the missing explanation for stage 7. It comes after the stage and is the only place the formula-unit idea is stated plainly.

**q6-solution, debrief, slide 3.** A box with 8 ion pairs, "volume 100 mL" and "0.50 M" in orange. Vess: "Adding water leaves the moles unchanged and spreads them over more litres: 25 mL of 2.00 M stock diluted to 100 mL becomes 0.500 M." Good; the box does not change size while the volume label changes, so the picture does not show the spreading.

**q6-solution, debrief, slide 4.** A bar chart "bath after 0.100 mol dissolves in 100 g of water": sodium chloride -0.9 °C, potassium chloride -4.1 °C, calcium chloride +19.4 °C, ammonium nitrate -6.1 °C. Vess: "Dissolving also moves heat: calcium chloride warmed the water, while sodium chloride, potassium chloride, and ammonium nitrate cooled it." Heat of solution was not taught or measured in this quest (the plan moved it to Ember Reach); it is a new topic with four new salts in the debrief.

**q6-solution, debrief, slide 5 (Case Pin).** "The drums on the quay are empty, and their chemical is in the canal water. How much of it is in each litre?" -> "We measured its molarity: the moles of chemical in each litre of canal water." The pin restates the question and gives no figure, and the heat chart from slide 4 stays on screen behind it. A pin that says "we measured X mol per litre" (a number, from the stages) would close the mystery.

## Second pass: q7-separate

**q7-separate, arrival.** About 85 s of "Building the bench" after the URL load (longest of all). The question card text "The Fifth's chemical is dissolved in the canal water. Can we get it back out, and how?" names the Fifth with no earlier introduction (see first pass).

**q7-separate, stage 1 (predict), after.** After the prediction card is placed and Submit pressed: "Now Test It. Next, pour four mixtures through the paper and look at what each leaves." The "Watch first" picture shows blue and tan balls passing a dotted line: it shows what the filter does to a dissolved salt, which answers the prediction before the student commits.

**q7-separate, stage 2, prompt (real play).** "You guessed the same salty water in the cup: which mixtures can be separated by filtering, and which need the water boiled off?" The first clause repeats the guess; the question is clear apart from that.

**q7-separate, stage 2, tour.** The tour demo seats "Sand in water" in the filter and has two steps; the first reads "FILTER: Put a mixture in the slot and press the key to pour it through." It is correct and the only step that matters.

**q7-separate, stage 2, bench (works well).** Pouring each mixture through shows the paper V and the cup with the liquid running through, and the card then prints what happened ("paper: grains / cup drop: clean" for sand and sawdust, "paper: clean / cup drop: crust" for salt, "paper: clean / cup drop: stain" for the red dye). Evidence decides it. The mixture pictures on the cards are tiny and nearly black except for the dye (red); "Salt in water" and "Sand in water" look almost the same until poured.

**q7-separate, stage 2, miss message.** Sawdust filed under "Boil the water off": "Sawdust sits in the "Boil the water off" tray, and the paper held its grains while the drop of the cup dried clean." Clear and good.

**q7-separate, stage 2, tray cards.** Two cards fit each tray row; the third card in "Boil the water off" wraps to a second row overlapping the tray edge. Each card shows three lines of 8-point text.

**q7-separate, stage 2, reward card.** "The Filtrate. Your guess held. Filter paper holds back pieces too big for its pores." "Filtrate" is the title and is never defined (the vocabulary list expects it to be introduced here); "Your guess held" is said whatever the guess. Say: "What passes through the paper is called the filtrate. The paper holds back anything too big for its pores, such as sand and sawdust; salt and dye are small enough to pass."

**q7-separate, stage 3, prompt and tour.** Prompt "What is the Rf of the red dye?" with "Rf" undefined (the vocabulary table says it is introduced at this stage, but the stage's own words never explain it; the first explanation is the reward). Tour: "PAPER STRIP: Put an ink in the slot and press "Run Strip"." and "SAMPLE CARD: Drag it into an instrument, onto the strip or into a tray." (cut). The text on the table says "Drag the ink into the strip, press the key, then read the ruler and type."

**q7-separate, stage 3, bench (the front cannot be seen).** Seating "Black ink on paper" and pressing "Run Strip" splits the ink into three coloured dots (yellow, blue, red) that climb a vertical strip marked "WATER" beside a ruler "cm 0 to 11". The strip is dark and the spots small; I read the red dot at about 5 to 6 on the ruler. The wet edge of the paper, the solvent front that Rf divides by, is not drawn anywhere I could see, yet hint 2 says "Read the red spot and the wet edge of the paper on the ruler, both from the start line." Draw the wet edge as a line that climbs with the dots and stops, and put a mark on the ruler.

**q7-separate, stage 3, miss messages and hints.** 5.9 (a distance): "5.90 is longer than the whole climb of the wet edge on the ruler." 0.59: "0.59 puts the red spot farther from the start line than the ruler shows." 0.52 passed. Each message says which way the number is off but not what to divide by. Hint 1 "Use the strip, its "Run Strip" key and the answer field." Hint 2 "Read the red spot and the wet edge of the paper on the ruler, both from the start line." The answer field is labelled "Fraction"; say "Rf (a number between 0 and 1)".

**q7-separate, stage 3, reward card.** "Chromatography. Chromatography separates a mixture as a liquid climbs paper that holds each dye differently. A dye's retention factor, Rf, is its distance divided by the solvent front, how far the liquid reached; black ink held three dyes." Defines Rf only now, after the student has had to type one; "solvent front" is new. One strip of text; the ruler picture is not repeated with the front marked.

**q7-separate, stage 4, prompt versus bench.** Prompt: "In hexane and acetone, which dye travels least and which furthest?" The bench has three strips, labelled WATER, ETHANOL and HEXANE, and a solvent dial that reads "Solvent Water", "Solvent Hexane and acetone" (when set to the third strip). So the third strip is a mixture of two liquids but its label says only HEXANE, and ethanol is not mentioned in the prompt at all. Label the strip "Hexane and acetone" and drop the ethanol strip, or mention it.

**q7-separate, stage 4, tour.** The same two steps as stage 3 ("PAPER STRIP: Put an ink in the slot and press "Run Strip"." and "SAMPLE CARD: Drag it into an instrument, onto the strip or into a tray."), so nothing introduces the new dial. The text on the table is: "Set the dial to a liquid, press the key, then put the dyes on the rail."

**q7-separate, stage 4, solvent dial (hard to operate).** The first attempt to turn the dial (a drag of 260 px) missed the knob and swung the bench camera round to a low side-on view that stayed for the rest of the stage, with the last dye card half off the right edge of the screen. The knob, at the left end of the title, is small and sits under the seated ink card; a second drag from the knob across to the third strip worked and the label changed to "Solvent Hexane and acetone". It does not say which dial positions exist.

**q7-separate, stage 4, bench.** Running the strip in hexane puts the yellow dot near the top and the red and blue dots stacked on top of each other near the bottom, so their order cannot be read from the picture; I ordered them by the first message of the miss and the reward. The three dye cards start on the rail as Blue, Yellow, Red, which is a wrong-looking answer for water (yellow travels least there). Start them in a row beside the strip.

**q7-separate, stage 4, solving.** I ran only the hexane strip (the water strip already had the stage 3 run on it) and filed the dyes as Blue, Red, Yellow; the stage passed.

**q7-separate, stage 4, reward card.** "Reading Polarity. The order turned round: water carries polar dyes far, while hexane and acetone carry nonpolar dyes. How far a dye travels in each liquid tells you how polar it is." "turned round" refers to a comparison with stage 3 that the student was not asked to make; "polar" and "nonpolar" are Ligar's words and are not explained here. One strip of text.

**q7-separate, stage 5, tour.** "STILL: Press the key to heat the flask and fill the next vial." (correct) and "MOLECULE CARD: Drag it into the probe, onto the rail, or into a tray." (copied from q2; there is no probe; cut).

**q7-separate, stage 5, bench (the evidence is good, the rail is not).** Each press of "Collect Cut" heats the flask, shows the "TOP" temperature (59.6, 76.0, 96.0 °C) and fills the next of three vials with coloured bands (acetone orange, ethanol green, water blue), so vial 1 is mostly orange, vial 3 mostly blue. This is a clear picture of distillation and the colour key (acetone, ethanol, water) is printed beside the flask. Problems: (1) the three liquid cards start already on the rail as water, acetone, ethanol; (2) the rail between "Comes over first" and "Comes over last" is only about as long as two cards, so three cards cannot sit side by side: dragging water to the end stacked it over ethanol, the two overlapped in the "last" slot, and Submit answered "Put all 3 liquids on the rail." (I had to press Restart, which also emptied the vials, and re-collect three cuts); (3) a Restart empties the vials, which is not said. Lengthen the rail to fit three cards and keep the vials when the rail is rearranged.

**q7-separate, stage 5, reward card.** "Distillation. Distillation heats a mixture so the liquid held least tightly leaves first as vapour, then cools the vapour into a vial. Each vial is richer in one liquid but never pure; a longer column separates further." Clear; "vapour" is spelt with a "u" here and "vapor" in Liquids and Vapor. "held least tightly" is the attraction idea from q2 in different words. One strip of text.

**q7-separate, stage 6, tour.** Step 1 is a Vess line that gives the rule: "Dissolved particles raise water's boiling point. As a dilute-solution rule of thumb, each mole of particles per kilogram of water raises it by 0.51 °C." Step 2: "BOILING FLASK: Put a card in the slot, set the "Dissolved" dial and press "Boil"." Step 3: "SAMPLE CARD: Drag it into an instrument, onto the strip or into a tray." (cut). With the rule given, the stage is arithmetic.

**q7-separate, stage 6, bench and solving.** The boiling flask has a "Dissolved 0.50 mol in 1.00 kg of water" dial, a thermometer scale 100 to 103 °C and three cards (Sugar C12H22O11, NaCl, CaCl2) with their particles drawn (one, two and three balls). The question is 3.00 mol in 2.00 kg, which the dial cannot be set to, so the flask only gives the pattern; I typed 0.77 and 2.3 without using the flask at all and the stage passed on 2.3. The tour's text says "Put a card in the slot", but the card goes into the flask area.

**q7-separate, stage 6, miss message and hints.** 0.77: "0.77 °C is what the bench reads for another card at this amount, not for CaCl2." (names the mistake only if the student has used the bench). Hint 1 "Use a card, the "Dissolved" dial and the "Boil" key, then the answer field." Hint 2 "Compare the rise for sugar and for salt at the same amount, and count the particles drawn on each card." Good hints (they point to the particles).

**q7-separate, stage 6, reward card.** "Boiling Point Elevation. 1.50 mol of CaCl2 per kilogram is 4.50 mol of particles, a boiling point elevation of 2.3 °C. A property that counts particles only is a colligative property." Short and correct; "colligative" is new and is the title's only definition. This stage returns to particles in water (q6) and is beyond the quest's question about getting the chemical out of the canal.

**q7-separate, stage 7, bench.** The "What the plan does" board shows where sand, salt and water end up as each card is placed, so the answer is read off the board and no thinking is needed. "Run a paper strip" is never needed and is not marked as a wrong choice. Show the result only after Submit.

**q7-separate, stage 7, reward.** "Choosing a Method. Filtering removes what is too big for the paper, and boiling the water off leaves the salt. Choose each method by what differs between the parts." Plain enough, but "Choosing a Method." as a bold lead-in is not needed.
