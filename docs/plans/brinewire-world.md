# Brinewire (`unit10`, electrochemistry): world spec and build record

Status: **Phase 0 spec** (2026-11-05). The build record is the last section and is filled in as phases land; a section marked *Not built* is a plan, not a claim.

Place: **the copper marsh**: a salt marsh crossed by a power grid whose cells stand in brine pools, with pylons, plating tanks and a bridge-and-cable works. Case thread: the Fifth has cut the marsh's power and says "the cells ran out" and "the pylons are rotting". Vess's case is that nobody measured a voltage, a current or a mass. A cell does not run out; it runs down to a balance point, and a current pushed the wrong way plates metal out of the water. Each bench measures one more fact about the marsh's cells; the last shows the Fifth's drain clamps are an electrolytic cell plating the marsh's copper onto the Fifth's plates.

Brief: `docs/plans/learn-quests.md` World 10. Where this spec differs from the brief it says so ("Differs"). Registered in the chart as `unit10`.

Build method: copy Verdigris (`docs/plans/verdigris-world.md`) and Ember Reach. Spec shortened where Verdigris's was: **hints are written at build time** under the ladder rules and are recorded in the quest files (a deliberate shortening, logged in the audit).

---

## 1. CED map (AP Chemistry CED, Unit 9 electrochemistry topics 9.7 to 9.11, and 4.9 redox; read from the PDF pp. 173 to 178)

| Topic | Essential knowledge | Bench · stage(s) | Calc? |
| --- | --- | --- | --- |
| 4.9 Oxidation-reduction (redox) reactions | .A.1 redox = electron transfer; .A.2 oxidation numbers (the CED excludes naming oxidising and reducing agent: those stages are labelled beyond the exam) | q1 s1 to s8; q2 s1 to s8 (displacement, descriptive) | balance (q1 s4, s6, s7) |
| 9.7 Coupled reactions | .A.1 external energy drives an unfavoured process (electrical energy to drive an electrolytic cell or charge a battery); .A.2 coupling through a shared intermediate, ΔG°(sum) < 0 | q6 s1 (electrical energy), q6 s6 (a galvanic cell drives an electrolytic cell); .A.2 is one bank problem (ATP and a shared intermediate need no bench) | no |
| 9.8 Galvanic (voltaic) and electrolytic cells | .A.1 components and roles: electrodes, half-cells, salt bridge, meter; direction of electron flow, mass change, gas evolution, ion flow in the bridge; .A.2 galvanic = favoured, electrolytic = unfavoured; .A.3 oxidation at the anode, reduction at the cathode in every cell (labelling electrodes +/− is excluded: no stage and no plate does it) | q3 s1 to s8; q6 s1, s2 | no |
| 9.9 Cell potential and free energy | .A.1 favoured = positive voltage; .A.2 E°cell from standard reduction potentials; .A.3 ΔG° = −nFE° | q4 s1 to s8 | **yes** (typed s2, s6, s7, s8) |
| 9.10 Cell potential under nonstandard conditions | .A.1 voltage depends on concentrations; farther from equilibrium = bigger voltage; .A.2 **Le Châtelier does not apply** to a cell (no stage says "shifts"); .A.3 E° at Q = 1, falls to 0 at Q = K; concentration cells; .A.4 the Nernst equation, used qualitatively and once as a typed figure | q5 s1 to s8 | **yes** (typed s6) |
| 9.11 Electrolysis and Faraday's law | .A.1 moles of electrons, mass plated, current, time, ionic charge; I = q/t | q6 s3 to s8 | **yes** (typed s4, s8) |

Logged gaps: 9.7.A.2 (ATP-style coupling through a shared intermediate) has no bench stage: one bank problem per world end set. Writing cell notation (q3 s7) and balancing in base are past the CED and labelled so (base moves to the bank). The numerical value of the Faraday constant and R are given on a plate when a stage needs them (CED equation sheet). Everything in Unit 9 that is entropy and Gibbs energy (9.1 to 9.6) is Ember Reach's and Teeter's; Brinewire builds on `ΔG` only through q4 s6.

## 2. Benches (teaching order)

World id `unit10`. **Six benches plus the boss; 8 stages each, the boss 5** (6 benches is the brief and the CED's electrochemistry content fills no more; adding a bench would need padding). 53 stages. Arena for all benches is `bench`.

| # | Id | Title | Idea thread | The one click (wrong model) | Words earned | BUILDS_ON |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `q1-halves` | Half-Reactions | a redox reaction is two halves joined by electrons | "The electrons lost just vanish into the water, or are made new" (zinc's electrons are exactly the copper's) | oxidation number, oxidation, reduction, half-reaction, oxidizing agent, reducing agent (beyond the exam) | none |
| 2 | `q2-activity` | Which Metal Gives | metals take electrons from each other in a fixed order | "If zinc coats from copper's solution, copper coats from zinc's too" (displacement runs one way) | activity series, sacrificial anode, displacement | q1 |
| 3 | `q3-galvanic` | Galvanic Cells | split the halves, wire them, the electrons do work | "A wire between the beakers is enough" (it stops at once without a bridge); and "electrons swim through the bridge" | galvanic cell, salt bridge, anode, cathode, cell notation (beyond the exam) | q1, q2 |
| 4 | `q4-potential` | Cell Potential | voltage is energy per electron | "Double the reaction, double the volts" (volts per electron do not change; the energy does) | standard reduction potential, E°cell, ΔG° = −nFE°, Faraday constant | q3 |
| 5 | `q5-load` | Under Load | a cell runs down to Q = K | "A cell holds its voltage until it is empty, and an empty cell is a cell with no zinc" | concentration cell, Nernst equation, reaction quotient Q in a cell | q4 |
| 6 | `q6-electrolysis` | Electrolysis | pushing a cell backwards; charge counts atoms | "A pushed current just heats the water" (it undoes the reaction) | electrolytic cell, electrolysis, coulomb, Faraday's law | q3, q4, q5 |
| B | `boss-clamp` | The Clamp | five old ideas on new cells | | | q2, q3, q4, q5, q6 |

The world's central click is `q4-potential` (**the vertical slice**), because it holds the quantity ramp (typed ΔG°, log K, E°cell) and the intensive-versus-extensive idea that students most often get wrong, and it needs the whole cell kit (beaker, electrodes, bridge, wire, voltmeter, board).

### Story stakes (case thread, lead lines of at most 20 words, Filed lines)

| Bench | Lead line | Filed |
| --- | --- | --- |
| q1 | "The Fifth says the pylons are rotting. Find out what moves when a metal rots." | Filed: a rotting pylon passes electrons to something else; the Fifth's word named the loss and missed the gain. |
| q2 | "Two bolts on one pylon rot at different speeds. Find which metal gives." | Filed: the bolt that rotted first was the more active metal; the Fifth bolted a copper clamp to an iron pylon. |
| q3 | "Every marsh cell stopped when a bridge was cut. Build one and find what keeps it running." | Filed: the Fifth cut the bridges, not the wires; a cell with no bridge stops almost at once. |
| q4 | "Each marsh cell reads a different voltage. Find out what sets the number." | Filed: a cell's voltage comes from its two metals, not its size; the Fifth's big cell was no stronger. |
| q5 | "The marsh cells fade over a day. Find out what a cell does as it runs." | Filed: a cell does not run out, it runs down toward a balance; the Fifth's dead cells had reached it. |
| q6 | "Someone is pushing current into the pools. Find what a pushed current does to the water." | Filed: the drain clamps are electrolysis; the copper they plate comes from the marsh, grams for every coulomb. |
| Boss | none | Finale: the Clamp's last cell reads the same as every cell on the road; its power was the marsh's own copper. |

## 3. Stage tables

Notation: **P** prompt (at most 25 words, no "!", no route). **Ev** the evidence on the bench. **Prints** what the bench prints (and why none is the answer, the capacity or the reasoning). **Miss** plausible wrong answers → the message names what the table shows. **R** reward gist (final text 1 to 3 sentences, about 45 words). **Rung** the quantity-ramp rung of a numeric stage: 1 picture, 2 prediction, 3 proportional, 4 formula as shorthand, 5 friendly numbers, 6 past-the-dial typed figure. Flat or 3D is stated per instrument in section 4. All voltages, masses and counts are the planner's (`engine/celldata.js`), never typed in a stage.

### 3.1 `q1-halves` Half-Reactions (4.9)

Instruments: the **redox beaker** (`cellbeaker`: a beaker with a metal strip, a solution and a window of 120 particles: atoms of the strip, ions, spectators) with a **number probe** piece (lay it on a species to read its oxidation number), and the **half-reaction ledger** (`cellledger`: a card per half with dials for coefficients and chips for electrons, H⁺ and H₂O, which prints a row per element and for charge: left count, right count).

1. P: "Mark every species whose oxidation number is different after zinc is put into copper(II) sulfate." Ev: beaker before and after (window), number probe, cards Zn, Cu²⁺, Zn²⁺, Cu, SO₄²⁻ (five, in a grid). Prints: the probe's number on whatever it touches; never "oxidised" or "changed". Miss: SO₄²⁻ marked → "The probe read the same on SO₄²⁻ in both windows." R: oxidation number tracks electron bookkeeping; the sulfate did not change. Earns **oxidation number**. Rung 1.
2. **Predict** (no instrument). P: "Each zinc atom loses two electrons. Where do those electrons end up?" Cards: *Free in the water* · *Gone, they disappear* · *On the copper ions, exactly as many* · *On the copper ions, fewer* . The held model: free in the water or disappear.
3. P: "Write each half of the zinc and copper reaction so that its charge balances." Ev: ledger with a Zn half and a Cu half, electron chips; the ledger prints charge left and right for each half. Prints: the two charge totals per half (not the electron count: the player places the chips). Miss: "The charge on the left of the Zn half is 0 and on the right is 2+." Quotes the guess. R: **half-reaction**, **oxidation** (loses electrons), **reduction** (gains); electrons lost equal electrons gained. Rung 1.
4. P: "Balance aluminium with copper(II) ions so no electrons are left over." Ev: ledger with an Al half and a Cu half, a multiplier dial on each half, and an electron-tally row (electrons given, electrons taken). Prints: the tally; never the multipliers. Miss: "Aluminium gives 3 electrons and copper takes 2 in this setting." R: halves are scaled until the electrons match: 2 Al and 3 Cu²⁺ (kept off the card text; the card states the principle). Rung 3.
5. P (beyond the exam): "Mark the species that gives up the electrons in each beaker: silver nitrate with copper, and iron(II) with magnesium." Ev: two beakers (windows), number probe. Slot per beaker. Miss: marks the ion → "In the window the Cu atoms became Cu²⁺." R: **reducing agent** (the species oxidised) and **oxidizing agent**; the CED will not assess these words (labelled on the card).
6. P: "Balance the permanganate half in acid by placing electrons, hydrogen ions and water." Ev: ledger with MnO₄⁻ → Mn²⁺ and the three chip dials; rows for Mn, O, H, charge. Prints: only the row differences, never the target counts. Miss: names the row left unbalanced ("The O row reads 4 on the left and 0 on the right"). R: in acid, O is balanced with H₂O and H with H⁺; then charge with electrons. Rung 4.
7. P: "Join the permanganate half and the iron(II) half so that no electrons are left over." Ev: ledger with both halves, multiplier dials, tally row. Miss: tally text. R: the overall equation has no electrons in it. Typed? No (the ledger is the answer); the final reward prints the overall equation counted from the ledger.
8. Sealed. P: "Sort the four reactions into redox and not redox." Ev: four sealed reaction cards (Zn + CuSO₄, AgNO₃ + NaCl, Mg + HCl, NaOH + HCl) read with the number probe; two trays. Miss: names a probe reading. R: redox needs a number that changes; precipitation and neutralisation have none.
Click: s2/s3. Differs from the brief: base-solution balancing moves to the bank; the brief's s2/s3 are the predict pair here; s4 (agents) becomes s5 and keeps its label.

### 3.2 `q2-activity` Which Metal Gives (descriptive, 4.9)

Instrument: the **dip rack** (`celldip`): beakers of metal-ion solutions (Zn²⁺, Cu²⁺, Ag⁺, Fe²⁺, Pb²⁺) and strips of Zn, Cu, Ag, Fe, Pb, Mg, Au to dip (drag or two-tap). A window on each dip shows the strip: a coating of the other metal (grey for Ag, red-brown for Cu, dull for Pb) or clean. The result is the planner (`displaces(metal, ion)` from E°).

1. P: "Find the solution that put a coating on both of the other metals." Ev: three solutions (Zn²⁺, Cu²⁺, Ag⁺), three strips; six dips possible. Verdict selector of the three solutions with a trailing blank. Miss: names a dip ("Zinc stayed clean in the zinc solution and coated in the other two"). R: **displacement**: one metal takes the place of another.
2. P: "Rank zinc, iron, lead and copper from the metal that gives electrons most readily to the one that gives least." Ev: the rack with four solutions and four strips (twelve dips); rail of four cards. No printed log: the player's own dips are the evidence, and each dip leaves a mark on its beaker for the session. Miss: names a dip. R: **activity series**. Differs: four metals, not three, so the rank is not a lookup of stage 1.
3. **Predict**. P: "Zinc coats a strip of copper from zinc's neighbour solution. What does a copper strip do in zinc sulfate?" Cards: *Coated with zinc* · *Stays clean* · *Dissolves* · *Swaps and is coated and thinner*. Held model: the reverse works too.
4. P: "Dip a copper strip in zinc sulfate and say what happens." Ev: dip, window. Verdict selector. Quotes the guess. R: the exchange goes one way only.
5. P: "Place hydrogen in the list of metals." Ev: acid beakers and the strips (Mg, Zn, Fe, Cu, Ag): bubbles on the strips that give hydrogen; rail with a hydrogen card. Miss: names the strips that bubbled. R: metals above hydrogen give it from acid; below, they do not.
6. P: "Find which metal wired to an iron nail keeps it from rusting in brine." Ev: four brine beakers, each a nail wired to Zn, Cu, Mg or Sn; rust (blue ferroxyl spots) appears on the nail where the partner is less active than iron; tick the protecting partners (multi-select). Miss: names a beaker. R: **sacrificial anode**.
7. P: "Place the sealed metal X in the list of zinc, iron, lead and copper." Ev: X (nickel, labelled X) and the rack; slot position on the rail. Miss: names a dip. R: a metal sits between the one it displaces and the one that displaces it.
8. P: "Choose a strip that takes the copper out of a solution of copper(II) and iron(II) ions and leaves the iron ions." Ev: mixed beaker (window shows copper and iron ions) and four strips; each dip's window shows what coated it. Selector of the four (Zn, Fe, Mg, Ag). Miss: names what coated. R: the choice uses the order, a new case of the same idea.
Click: s3/s4.

### 3.3 `q3-galvanic` Galvanic Cells (9.8)

Instrument: the **cell rig** (`cellrig`): two beakers with an electrode seat each, a bridge seat above, a wire loop with an **ammeter** (a needle: deflected one way for electrons moving left to right through the wire, the other way for right to left; the direction convention is printed on the dial, which is how-to) and a **voltmeter**; a Run key that runs the cell for a fixed time (a plot of current against time painted to the tick reached); a **balance** for weighing electrodes.

1. **Predict**. P: "A zinc electrode in zinc sulfate and a copper electrode in copper sulfate are joined by a wire. What does the ammeter show?" Cards: *A steady current* · *A brief current that dies* · *No current at all* · *Current only if the wire is thick*. Held model: steady.
2. P: "Make the ammeter keep a current for the whole run." Ev: cell rig, pieces: a wire only, a salt bridge, a second wire, a spoon-shaped glass rod (a distractor that carries no ions: a glass rod). Plot of current against time. Quotes the guess. Miss: names the plot ("The current fell to zero in 3 seconds"). R: **salt bridge**. Differs from the brief: brief s1 and s2 are one predict/test pair.
3. P: "Say which beaker the electrons move toward, from the ammeter." Ev: cell Zn|Cu then Cu|Mg then Ag|Zn in turn (three runs, new pairs); verdict selector toward-left/toward-right per run. The direction convention is on the dial. Miss: names the needle. R: the metals decide the direction, not the position of the beaker.
4. P: "Mark the electrode where oxidation happens and the electrode where reduction happens in the Zn|Cu cell." Ev: cell windows (atoms leaving the strip as ions; ions arriving as atoms) and two slots. R: **anode** (oxidation), **cathode** (reduction), **galvanic cell**.
5. P: "Show which way the negative ions in the bridge move while the cell runs." Ev: bridge window with coloured ions, run; the beakers' charge balance as counted ions in the windows; verdict card: toward the anode beaker / toward the cathode beaker. Miss: names the count ("The Zn²⁺ count rose in the left beaker"). R: ions complete the circuit; electrons stay in the wire.
6. P: "Weigh each electrode before and after the run and say which one gained mass." Ev: balance, electrodes, run; strip masses printed by the balance only when a strip is on it. R: the cathode gains metal and the anode loses it.
7. P (beyond the exam): "Write the zinc–copper cell in shorthand." Ev: chips for Zn, Zn²⁺, Cu²⁺, Cu, two bars and a double bar; ordering rail. R: **cell notation**.
8. Sealed. P: "Find the anode of the sealed cell." Ev: a cell of two unlabelled metals with the ammeter and balance; slot. Miss: names a reading. R: electrons leave the anode through the wire.
Click: s1/s2 and s5.

### 3.4 `q4-potential` Cell Potential (9.9) — the vertical slice

Instrument: the **potential board** (`cellboard`): a reference half-cell (hydrogen, 1.00 M H⁺) and a metal half-cell seat, a voltmeter, and a **recorder strip** (a flat plot of every reading taken, a column per metal, with the voltmeter's signed value). Plus the cell rig of q3 with voltmeter. An **energy counter** on the cell rig (kJ released per mole of reaction as written) and a **scaler** piece (×1, ×2 on the written equation). The Faraday constant and R are printed on a plate when a stage needs them (CED equation sheet).

1. P: "Rank the metals Mg, Zn, Cu and Ag by the voltage each gives against the hydrogen reference." Ev: board, four electrodes; rail of four cards. Prints: the signed reading of the electrode on the seat (never a rank). Miss: names the reading. R: **standard reduction potential**, the reading against the reference at 1 M and 25 °C.
2. **Typed** E°cell of an Mg|Ag cell in volts (cathode minus anode; 3.17 V). Ev: the recorder strip holds the Mg and Ag readings from stage 1 (or they are laid again); the cell is not wired. Slips: the sum (0.43 given −2.37 + 0.80 = −1.57? wrong order: refuse), doubling, a negative sign. Rung 4 then 6 (cell not on the bench). Reward card shows the measured value after the check.
3. P: "Wire the six cells from the metals Zn, Cu and Ag in both directions and keep the ones that run by themselves." Ev: cell rig, voltmeter, ammeter (current or none); trays *runs* / *does not run*. Miss: names the pair and its two readings. R: a positive E°cell is a cell that runs.
4. **Predict**. P: "A zinc–copper cell reads 1.10 V. The reaction is written twice over, 2 Zn + 2 Cu²⁺. What does the cell read?" Cards: *1.10 V* · *2.20 V* · *0.55 V* · *0 V*. Held model: 2.20 V.
5. P: "Write the reaction twice over and say what happens to the voltage and to the energy released." Ev: the scaler key on the written equation; voltmeter and energy counter. Verdict selector (voltage same, energy doubles / both double / voltage doubles, energy same / neither). Quotes the guess. R: voltage is energy per electron, so it does not change; the energy follows the electrons moved.
6. **Typed** ΔG° in kJ for Mg + Cu²⁺ (−523 kJ). Ev: the electrons-moved counter (mol e⁻ for the equation as written: 2) and E° from the recorder; F and the equation-sheet form on a plate. Slips: forgot n (−261), forgot ×1000 (−523 000), sign (+523). Rung 4 to 6. R: **ΔG° = −nFE°**.
7. **Typed** log K of the same cell (92). Ev: n, E°, F, R and T on a plate; log K = nE°/0.0592 given as the shorthand on the plate (derived: ΔG° = −RT ln K = −nFE°). Slips: ln instead of log (211), forgot n (46). Rung 6. R: huge K = reaction goes to completion.
8. Sealed. P: "Find the voltage of the cell made from the two sealed metals." Ev: metals A and B read against the reference on the board; recorder strip; **typed** (the cell not wired). Sealed means unlabelled metals. R: the same subtraction on a new pair.
Click: s4/s5. (Brief's s3 "say what a positive E° means" is s3; the brief's s7 "pick the best pair for a battery" moves to the bank and boss because s8 already uses the table in a new case.)

### 3.5 `q5-load` Under Load (9.10)

Instrument: the cell rig with concentration dials (two settings or steps of ×10, never a free dial), a **load** (a lamp or resistor), a run clock, and a voltage plot painted only to the tick reached. A reaction quotient shown only as the two ion concentrations (counted ions in the windows), never as "Q".

1. **Predict**. P: "A tin–lead cell lights a lamp until the voltmeter reads zero. What does each beaker hold afterwards?" Cards: *No tin ions left* · *No lead ions left* · *Both beakers are empty of ions* · *Both still hold both kinds of ion*. Held model: used up. (Tin and lead are used because a cell with a large E° such as zinc–copper holds close to its voltage until almost all of its copper ions are gone, which hides the idea; Sn|Pb has E° = 0.012 V and K about 2.5, so the whole run-down is on the dial.)
2. P: "Run the tin–lead cell under load until the voltmeter stops falling and say what the two ion counts hold." Ev: plot painted to the tick, windows with the ions counted (planner `runCell`). Verdict selector over the end state. Quotes the guess. R: the voltage falls as the products build up and the reactants thin out, and the cell is dead while both ions are still there; the dead cell is not an empty cell.
3. P: "Raise the zinc ion concentration in the anode beaker and say what the voltage does." Ev: two concentration settings per beaker (1.0 M and 0.010 M), voltmeter. Verdict (rises / falls / same). R: more product ion, lower voltage, qualitatively (9.10.A.1).
4. P: "Compare the tin ion count with the lead ion count when the tin–lead cell reads zero, and say which count is larger and by about how much." Ev: the dead cell's windows (both counted, for a 1.0 M start); verdict selector over the ratio (about 2.5 to 1 tin to lead, i.e. K). Only on a cell whose K is on the dial. R: at Q = K the cell is at balance and reads zero; **reaction quotient** in a cell.
5. P: "Join two copper half-cells, 1.0 M and 0.010 M, and say which electrode the electrons leave." Ev: cell rig, ammeter. R: **concentration cell**: the dilute side is the anode.
6. **Typed** the zinc–copper cell's voltage with [Zn²⁺] = 1.0 M and [Cu²⁺] = 0.0010 M (1.01 V). Ev: the 1.0 M / 0.010 M settings only; E° on a plate; E = E° − (0.0592/n) log Q on a plate as the equation-sheet form. Slips: Q inverted (1.19), log omitted. Rung 6. R: **Nernst equation**.
7. P: "Rank three zinc–copper cells with different ion concentrations by voltage, highest first." Ev: three prepared cells with voltmeter (1.10 ± shifts); rail. Miss: names the reading. R: farther from balance, higher voltage (9.10.A.3); Le Châtelier is not used (9.10.A.2).
8. Sealed. P: "Say which beaker of the sealed concentration cell holds the more dilute solution." Ev: two beakers of unlabelled strength, ammeter and voltmeter. Selector. R: the electrons leave the dilute side.
Click: s1/s2. Differs from the brief: the descriptive battery comparison (alkaline, lead–acid, lithium) is bank; stage 7 is the voltage rank.

### 3.6 `q6-electrolysis` Electrolysis (9.7, 9.8, 9.11)

Instrument: the **supply bench** (`cellsupply`): a power supply (voltage setting and current setting from a short list, a polarity switch), a cell (two electrodes in a solution or a melt), a **timer**, a **balance**, and a gas collector tube. The coulomb counter integrates I·t and is painted only on the stages that ask for charge from current and time.

1. P: "Make zinc plate out of the zinc–copper cell's solution." Ev: the cell with a supply wired in against it; settings 0.5 V and 1.5 V, polarity switch. Miss: names the window ("The zinc strip lost mass at 0.5 V"). R: **electrolytic cell**, **electrolysis**: an external supply above the cell's voltage reverses the reaction (9.7.A.1).
2. P: "Say which electrode makes sodium in molten sodium chloride." Ev: the melt cell, supply on; collectors; selector over cathode / anode. Miss: names the product and electrode. R: reduction at the cathode in every cell, galvanic or electrolytic.
3. P: "Rank the three runs by the charge each passed: 1 A for 30 s, 2 A for 10 s and 0.5 A for 100 s." Ev: balance; a silver plating cell; three runs; the balance reads the silver plated each run. R: **coulomb**: charge = current × time.
4. **Typed** grams of copper plated by 2.00 A in 30.0 min (1.19 g; Cu²⁺ + 2e⁻). Ev: the plating cell run for a shorter time on the bench; F and the molar mass on a plate; timer and current dial. Slips: minutes not seconds (0.0198), forgot n (2.38), mass of the wrong metal. Rung 6. R: **Faraday's law**.
5. P: "Plate silver for a set time and say how much silver 3.00 A deposits in 10.0 minutes." (new case, typed) Ev: bench; slip cards. R: 2.01 g; Ag⁺ takes one electron per ion.
6. P: "Make a zinc–copper cell power the electrolysis of water." Ev: cell packs (1.10 V each), a water-electrolysis cell (back voltage 1.23 V; simplification: no overpotential, stated under the model), a chain to build by adding cells in series; collectors show gas only when the supply exceeds the back voltage. R: coupling a favoured reaction to an unfavoured one (9.7.A.1).
7. P: "Compare electrolysing water and electrolysing brine: say what each gas tube collects." Ev: two cells; a sealed bunch of gas cards; R: the product depends on which species is easier to reduce or oxidise (brine: H₂, Cl₂, OH⁻; reasoning kept qualitative). Chemistry check: at the anode of brine chlorine forms in practice (overpotential), stated as such.
8. Sealed. P: "Find the current that plated the mass of the sealed plate in the given time." Ev: balance with the sealed plate, timer; **typed** current in amperes. R: Faraday's law backwards.
Click: s1.

### 3.7 `boss-clamp` The Clamp (five phases, no lead line)

Species *the clamp*: a drain clamp with five cells, each cell one sample of the stage. Foe from `planFoe()` for the cell rig; integrity 3; the miss reason is on screen before it answers; the answer slot is outside the foe's corner.
1. q2 s2: rank four metals Pb, Sn, Fe and Ni from fresh dips.
2. q3 s3/s4: pick the anode of a new pair (Mg|Ag).
3. q4 s2: type E°cell of a new pair (Fe|Ag).
4. q5 s5/s7: pick the concentration-cell electrode the electrons leave.
5. q6 s4: type grams plated for a new metal (Ni or Zn).
Finale `clamp-open` files the clue `clue_brinewire_clamp`.

## 4. Kit plan

**New kit: the cell kit** (`table/kits/cell.js`), extending the heat kit like the ph and pans kits (cards, number marker, answer dial, plaque, rail). Each bench's instruments live in their own files (`cell-<name>.js` + `cell-<name>-tour.js`), registered through `cell-registry.js`; pure reads in `cell-read.js`; planners in `engine/celldata.js`.

| Instrument | File | Used by |
| --- | --- | --- |
| Beaker with window and seat; number probe; electrode pieces | `cell-beaker.js` | q1, q2, q3, q4 |
| Half-reaction ledger | `cell-ledger.js` | q1 |
| Dip rack | `cell-dip.js` | q2 |
| Cell rig (beakers, bridge, wire, ammeter, voltmeter, Run, plot, balance) | `cell-rig.js` | q3, q4, q5 |
| Potential board and recorder strip, scaler, energy counter | `cell-board.js` | q4 |
| Supply bench (supply, timer, balance, collector) | `cell-supply.js` | q6 |

Flat or 3D: windows, plots and the recorder strip are flat pictures (a plot is drawn flat). The beaker, the electrodes, the bridge, the supply and the balance are 3D solids at `3D On` (`dress3d`, `piece3d`), and `3D Off` draws the same parts flat. The particle windows are low glass dishes (as the ph flask's).

**Planners** (`engine/celldata.js`, pure; one function per reading):

| Function | Reads | Source / independent check |
| --- | --- | --- |
| `E0[species]` | standard reduction potentials at 25 °C, 1 M: Li⁺ −3.04, Mg²⁺ −2.37, Al³⁺ −1.66, Zn²⁺ −0.76, Fe²⁺ −0.44, Ni²⁺ −0.26, Sn²⁺ −0.138, Pb²⁺ −0.126, H⁺ 0.00, Cu²⁺ +0.34, Ag⁺ +0.80, Au³⁺ +1.50, MnO₄⁻/Mn²⁺ +1.51, Fe³⁺/Fe²⁺ +0.77, O₂/H₂O +1.23 | CRC Handbook, "Electrochemical series" |
| `cellE0(cathode, anode)` | cathode minus anode | hand: Zn|Cu 1.10 V; Mg|Ag 3.17 V |
| `deltaG0(E, n)` | −nFE, kJ, F = 96485 C/mol | hand: Zn|Cu −212.2 kJ; Mg|Cu −522.9 kJ |
| `logK(E, n)` | nE/(RT ln 10) = nE/0.05916 at 298.15 K | hand: Zn|Cu 37.2; Mg|Cu 91.6; Sn|Pb 0.41 |
| `nernst(E0, n, Q)` | E0 − (RT/nF) ln Q | hand: Zn|Cu with Q = 1000: 1.0112 V |
| `displaces(metal, ion)` | whether a strip coats | E°(ion) > E°(metal) |
| `faradayMass(I, t, n, M)` | I t M/(nF) | hand: Cu 2.00 A, 1800 s: 1.186 g; Ag 3.00 A, 600 s: 2.01 g |
| `oxNumber(species)` | oxidation numbers | rules; hand-checked for each species used |
| `ledgerRows(halves)` | per-element and charge counts of a half-reaction builder | hand |
| `ionFlow(...)` | bridge ion directions and the beakers' charge counts | derived from the electrode roles |

Checks: `tools/lib/brinewire-data-checks.mjs` re-derives each value by a route not used in `celldata.js` (closed forms on paper and an independent calculation in Python/numpy, never the module).

Tour words (new kinds): beaker, number probe, ledger, dip rack and strips, cell rig, bridge, wire, ammeter, voltmeter, balance, potential board, recorder strip, scaler, energy counter, supply, timer, collector. Each in `cell-<name>-tour.js`, earned words only.

## 5. World plan

Place: copper marsh: a salt flat with brine pools, cable runs and pylons, a plating works and a bridge-and-cable yard. Six bench hosts plus the boss arena (the drain clamp). Hosts built into the machinery of the marsh: q1 a rotting pylon base (redox beaker), q2 a dip pool, q3 a pair of pools with a bridge, q4 a metering shed, q5 a battery bank, q6 the plating works. Layout generated by `tools/gen-brinewire-layout.mjs` into `src/three/world-data/brinewire.json`; built by `src/three/brinewire.js` and `src/three/brinewire/` (terrain, atmosphere, stations, plant, host-plan, `materials/brinewire-textures.js`); registered in `worlds3d.js`, `voyage.js`, `stage.js`; checked by `tools/verify-brinewire.mjs` (overlap, buried bodies, walkability flood fill, lamps-only-lit, bay clearance), added to `package.json`'s verify chain. Each bench is checked from the lean-in view.

## 6. Pitfall review (every row of `PRODUCT.md` section 5)

| Row | Verdict |
| --- | --- |
| A plate/header/readout prints the answer | **Avoided by**: meters read the electrode on the seat, never a rank or a verdict; the voltmeter is absent or the cell unwired on every typed stage; the recorder strip prints readings, not differences; the ledger prints row counts, not targets; the dip windows show coatings, never "displaces". |
| A refusal states the rule | **Avoided by**: misses name a reading ("the left strip lost mass"), never "the more active metal oxidises". |
| A miss message gives the reasoning | **Avoided by**: same. |
| Tray or rail names state the possible answers | **Avoided by**: trays are *runs by itself* / *does not run* (named after the ammeter) only after q4 s3's reading; `q3` slots are *where atoms leave the strip* / *where atoms join the strip* before the words anode and cathode are earned. |
| A term used before it is taught | **Avoided by**: `VOCABULARY`, `BUILDS_ON` and `WITHHELD_VOCAB` (anode, cathode, E°, Nernst, Faraday held until earned). Oxidation numbers are earned locally in q1 s1; ΔG° is given its own card in q4 s6 (Ember Reach teaches ΔG; `BUILDS_ON` lists the built quests that earn the word). |
| The model offered is not the model students hold | **Avoided by**: each predict offers the held model (electrons vanish; the reverse exchange works; a wire is enough; double the reaction, double the volts; a cell holds then drops). |
| Stages that repeat | **Avoided by**: q1 s5 and s8 differ by case; the brief's q2 s1/s4 pair and q3 s1/s2 are merged; q4 s3 and s8 use different tools. |
| Story that does not touch the bench | **Avoided by**: lead lines state the stake; Filed lines use the bench's own readings. |
| Crowded rows cause accidental joins | **Avoided by**: grids at least 60 units apart; electrodes are pieces dropped on seats, not cards on cards. |
| A dropped tool never joins a card | **Avoided by**: electrodes, probe, meters and bridge are pieces that seat on fixtures (not `nojoin` cards); verified with a real drag in `verify:bench` and by hand. |
| A missed grab throws the camera / a drop beside a slot / camera | **Not applicable** (shared gesture code); re-checked in play. |
| Dials | **Avoided by**: concentration, supply voltage and current settings are two or three fixed steps, no stage depends on hunting; hit bands tolerate one step. |
| A tool laid on the plate vanishes | **Avoided by**: every electrode, probe and bridge has a visible body and a caption. |
| Needed control not mentioned | **Avoided by**: every control has a plain caption on the object and a Tour step. |
| A control that reacts late | **Avoided by**: Run disables for the run and the plot paints to the tick. |
| Text a player must read is tiny | **Avoided by**: plots at least 36 × 22 units, ledger rows at 20 px; zoomed in play. |
| Black pane / label in metres / slab over painted display / glass over text / lining plate / pour leaves no trace / lens kept the old picture / words under hardware | **Avoided by**: the ph kit's rules copied: beaker bodies are glass beside the displays, meters face the player, ledger rows are paint with no lining, fills at least 0.018 m, dial names 3.6 units in. |
| Fonts | **Avoided by**: sans symbols for element letters; a true minus; the ° sign; "E°" printed with a real degree; no mono-face "O". |
| Drawn contents off the puck / heaps over gauges / plots too small / generic ball faces | **Avoided by**: windows placed away from meters; spheres carry no text. |
| An option object silently drops keys | **Avoided by**: checks call every fixture builder and test that each prop reaches the painter. |
| Disposal recursion | **Not applicable** (shared engine). |
| A comparison trace shown whole before the run | **Avoided by**: the voltage plot and the recorder strip paint only to the tick or reading reached. |
| A stat read of a finite-particle simulation | **Avoided by**: windows are counted from the planner, deterministic; no stochastic tallies. |
| A zero printed in scientific form | **Avoided by**: the number painter prints 0 plainly; tested at 0 and at negative zero (a voltmeter reading −0.00). |
| Trays at the table's right edge | **Avoided by**: trays left of x 120 on 184-wide tables. |
| A lead line that states the click | **Avoided by**: lead lines name the stake. |
| Tiny words on cards / a card prints two lines on one row / a cell shorter than its card / a rail's end label under a fixture | **Avoided by**: card kinds whose face scales; one row per line; `cellH` at least a card tall; rails below fixtures. |
| Parallel builders and shared files | **Avoided by**: one file per bench for kit and checks; shared lists edited by single-line Edits at marker lines; the bank JSON edited by a script that reads it just before writing. |
| `toFixed` rounds a half down | **Avoided by**: the `fmt` helper with epsilon in `celldata.js`; voltages and masses print through it. |
| A correct order refused for want of a pull | **Avoided by**: a correct rank is accepted at once; only a wrong one names what is unmeasured. |
| Escape leaves a bench / Full verify wipes `dist/` / several agents in one tree | **Handled by**: individual scripts only; explicit paths when committing. |
| The stage count lives in five places | **Avoided by**: a checklist in the build record (meta, chart, facts line and sentence, `verify-learn` indices, `NOTES`/`LEAKS`). |
| Question bank moved mid-pass | **Avoided by**: no `PRACTICE` in quests; unique ids. |
| `selectorFixture` answer cards | **Avoided by**: a trailing blank option on every verdict. |
| Shared-engine change breaks other worlds | **Avoided by**: opt-in options only; all world scripts re-run after a shared edit. |
| Scripted solutions pass while hands fail | **Handled by**: `verify:bench` pointer paths plus a play pass; the audit labels what was played. |
| Stale templates and plans / copy in several places / doc counts drift | **Handled by**: `verify:docs`; one source per copy. |
| A start reading gives the answer (Verdigris) | **Avoided by**: a stage that asks for E°cell has the cell unwired; no stage that asks for a rank prints a difference. |
| Two builders register one kind name | **Avoided by**: every fixture and piece kind is prefixed `cell` and the bench (`cellrig`, `celldip`, `cellboard`). |
| A float tolerance on a boundary value | **Avoided by**: tolerances carry `+ 1e-9`; typed stages grade on a rounded value. |
| A window cannot show a small fraction | **Avoided by**: concentration cells show the voltage and the ammeter, not a count that rounds to zero; dilute settings stay at 0.010 M. |
| A caption longer than the table | **Avoided by**: meters seated 30 or more units from the right edge. |
| A hidden dial still gets a Tour sentence | **Avoided by**: fixtures with a bookkeeping dial set `dials: false`. |
| `sci()` carried a rounded mantissa | **Avoided by**: the same carry as `phdata.js` `sci`, tested at 9.999e-15. |
| Two conventions for one constant | **Avoided by**: one table (`E0`); every E°cell is derived from it. |

Stage anti-patterns (section 4): a rank that ends in a lookup (q4 s1 ranks from a fresh reading per electrode, q2 s2 from fresh dips); copying a number from a gauge (the typed stages hide the target value: the cell is unwired); hunting a dial (none: two settings); plug-and-chug with all constants printed (q4 s6 and s7 print F and R because the CED sheet does, but the quantities n and E° come from the bench); a stage that shows only a refusal (none); twelve things on a bench (the ledger shows one reaction; the supply bench only what the stage uses).

## 7. Build record

Built 2026-11-05 on branch `world/unit10` by the integrator (spec, planners, the `q4-potential` slice, docs) and seven builders (q1, q2, q3, q5, q6, the world, the Clamp), each from `docs/plans/brinewire-builder-brief.md`. Per-bench notes, hints and prompts as built: `docs/plans/brinewire-notes-*.md`. Audit: `docs/brinewire-audit.md`.

Built: 6 benches of 8 stages and the Clamp of 5 phases (53 stages), the cell kit (`cell-*.js`), planners `engine/celldata*.js` checked in `tools/lib/brinewire-*-checks.mjs`, six story animations plus the Clamp's finale, the bank (two problems per bench, a worked problem on each bench but the boss, a seven-problem end set), the walkable copper marsh (six hosts, the Clamp's arena) with `verify:brinewire`.

Where it differs from the spec: lead lines are one sentence (a `verify:learn` rule); hints are in the quest files; q1 s1 sorts four atom cards with a probe fixture (a seat, not a laid piece); q5's click is the tin–lead cell and stage 4 is typed; q6 stage 2's dial reads "pushed into it / drawn out of it" until the reward earns cathode and anode; q6 has no predict stage; the boss's phase 1 uses Fe, Ni, Sn, Ag (Sn and Pb differ by 12 mV) and phase 5 plates zinc. 9.7.A.2 is a bank problem. Open items are in `PRODUCT.md` section 8.


---

## 8. Builder Brief & Bench Notes

### 8.0 Builder Brief
# Brinewire: builder brief (read this first if you are building one bench or the world)

You are one of several builders working in ONE git tree (`~/chem-3d`, branch `world/unit10`) on Avalon's world 10, Brinewire (electrochemistry). The integrator owns commits, shared docs and the browser. **You never run `git add`, `git commit`, `git stash`, `git checkout` or `git reset`, never run `npm run verify` (it wipes `dist/`), never run `npm run build`, and never use a browser or the preview tools.** Verify with the individual scripts below and Node.

## Read, in this order

1. `docs/plans/brinewire-world.md`: the spec. Your bench's stage table (section 3), section 4 (kit plan, planners), section 6 (pitfall review) are your contract. Where your build parts from it, say so in your notes file.
2. `PRODUCT.md` section 3 (bench module), 4 (stage design, the quantity ramp, anti-patterns), 5 (the pitfall ledger: every row is a defect that was built once). `CLAUDE.md` teaching doctrine.
3. **The finished vertical slice is your template. Copy its patterns file by file**:
   - quest: `src/learn/quests/unit10/q4-potential.js` (STAGES, SOLUTIONS, MISSES, VOCABULARY, predict pair, typed stages with slip refusals that name a reading, `rigRead`/`boardRead` use in `check`)
   - kit: `src/learn/table/kits/cell.js` (kit shell, `cellTable`), `cell-registry.js`, `cell-read.js`, `cell-board.js` (fixture + piece + `settle` memory + `dress3d` + `piece3d`), `cell-rig.js` (a fixture with a Run key, hidden dials, a log), `cell-board-tour.js` / `cell-rig-tour.js` (Tour words)
   - planners: `src/learn/engine/celldata.js` (pure; read it, reuse it) and its independent checks `tools/lib/brinewire-data-checks.mjs`
   - checks: `tools/lib/brinewire-q4-checks.mjs` (hand-worked values at the top, then slips, refusals, story numbers)
   - story: `src/ui/story-scenes-brinewire.js` (painter `cell-gap`), the `unit10/q4-potential` block in `src/story/quest-story.js`, lead line in `src/learn/engine/stage-story.js`
   - bank: `src/learn/bank/unit10/q4-potential.json`
   - Verdigris's equivalents (`unit09/q3-weak.js`, `ph-*.js`, `verdigris-q*-checks.mjs`) show more instrument patterns (a plot painted to the reached tick: `ph-curve.js`; a burette Run key: `ph-burette.js`; a rail rank; trays; `selectorFixture` verdicts).
4. Skim `docs/plans/verdigris-world.md` section 6 and `docs/verdigris-audit.md` for what went wrong last time.

## What you deliver (all of it, for your bench)

- `src/learn/quests/unit10/<quest>.js`: 8 stages (the boss 5) per the spec table. Prompt one sentence, at most 25 words, no "!"; exactly three hints (control, what to look at, method; one sentence each; never the answer or the arithmetic); reward 1 to 3 sentences, about 45 words, naming the idea in real terms; `VOCABULARY` (term to the 1-based stage whose reward card defines it); `BUILDS_ON` (only real built quests, e.g. `unit10/q4-potential`, and only if you use their words); `SOLUTIONS` and `MISSES` (scripts replayed through the real action path); `meta.stageCount`; `DEBRIEF`; `mount`; `stateFor`; `CHECKS`. No `PRACTICE`; no `session.addXp`, `api.gradeStage`, `api.completeQuest`, `session.recordProgress`.
- Your instruments in NEW files `src/learn/table/kits/cell-<name>.js` + `cell-<name>-tour.js` (every new kind of piece, tool or fixture needs a Tour step in earned words). Import them in your quest **directly from the file** (not through `cell.js`). The only edit to `cell.js` is ONE line: `import './cell-<name>.js';` added after the line `import './cell-rig.js';` (re-read the file afterwards: another builder may have added a line there at the same time; both lines must be present). Prefix every fixture and piece kind with `cell` and the bench (`celldip`, not `dip`). Kinds you register must not collide with existing ones (`grep -rn "registerFixture('" src/learn/table/kits/cell-*.js`).
- Planners you need that `celldata.js` lacks go in a NEW pure file `src/learn/engine/celldata-<quest>.js` (import `celldata.js`; do not edit it). Each is checked in your checks file against values worked by an independent route (paper, or Python: never the code under test).
- Story animation: a painter in NEW `src/ui/story-scenes-brinewire-<quest>.js` (3 to 5 beats of Vess, at most 2 sentences and 36 words each, then a `Filed:` line; every number on screen counted or measured from what is drawn; 960-wide plate, `(ctx, w, h, t)`); register it with two lines in `src/ui/story-scenes.js` (an `import` line after `import { BRINEWIRE_SCENES } ...` and a `...legacy(...)` line after `...legacy(BRINEWIRE_SCENES),`); add the quest's block to `src/story/quest-story.js` (insert it just above the `'unit10/q4-potential': {` line, `to` values rising to about 0.94; a beat ends at `t = to`, so the painter switches scene on `t <= to`); the lead line (at most 20 words, stage 1, never the boss, never stating the click) in `stage-story.js` above `'q4-potential': {`.
- Bank: `src/learn/bank/unit10/<quest>.json` = `{ "problems": [two problems, ids "<quest>#b1","<quest>#b2"], "worked": {... id "<quest>#w", 4 to 8 steps, number steps carry a `calc` expression} }` (the boss has none). Then add ONE import line after `import b10q4 ...` in `src/learn/bank.js` and one entry in the `bench: { ... }` object on the next line.
- Chart: flip your quest's line in `src/learn/worlds/unit10-electrochemistry.js` (`status: 'live'`, `module: () => import(...)`, a one-line descriptor from the spec's story table; descriptors are factual and plain). Edit only your own line.
- Checks: `tools/lib/brinewire-<quest>-checks.mjs` exporting `checkBrinewire<Q>({ ok, fail })` (model: `brinewire-q4-checks.mjs`), and in `tools/verify-learn.mjs` (a) a `WITHHELD_VOCAB` line for your quest after the `'unit10/q4-potential':` line and (b) the import+call after `await checkBrinewireQ4({ ok, fail });` inside the Brinewire block. In `tools/verify-story.mjs` nothing is needed (the loop covers unit10).
- Notes: `docs/plans/brinewire-notes-<quest>.md`: what you built, every place you parted from the spec and why, the hints and prompts as built, what only a hand can judge, defects you found. And `docs/brinewire-audit-<quest>.md`: the per-stage audit table (Operable, Intuitive, Busywork, Builds intuition, Accurate, AP topic, evidence label: `Code`, `Scripted` or `Bench` only; you have no browser, so never claim `Played`).

## Checks you run (each on its own; filter to your quest; never the full verify)

```
npm run verify:learn 2>&1 | grep -E "FAIL|PROBLEM|unit10|Brinewire"
npm run verify:table 2>&1 | grep -E "FAIL|PROBLEM|unit10"
npm run verify:story 2>&1 | grep -E "FAIL|unit10|story animations"
```
Known and not yours: `unit02/q10-wavefunctions has no story animation` (pre-existing) and `verify:docs` count mismatches (the integrator updates counts at the end). `verify:table` replays your `SOLUTIONS`/`MISSES` by script, by drag and by two taps, and fails on layout overlap (pieces, captions, rail labels, fixtures), a tool with no Tour step, an unearned word and a predict stage with an instrument: fix what it says. Iterate until all three are green for your quest.

## Rules that were broken most often (full list: `PRODUCT.md` section 5)

- A plate, header, readout, caption, tray name or refusal that prints the answer, the capacity or the reasoning. A refusal names a reading the table shows ("Cell B read −0.46 V and its lamp stayed dark"), never the rule. Typed stages: the instrument that would show the answer is absent or unwired; the slips a student makes (wrong sign, forgot n, forgot a factor, joules for kJ, minutes for seconds) are each refused by a message naming what the table shows, and each is checked in your checks file.
- Discover, never read off: the property under study starts hidden; compare two or more readings; no sorting of printed facts; no hunting a dial (a dial has two or three settings, not a range); a correct answer is accepted at once (a wrong order is told which reading is missing; a right one needs no pull).
- One decision per stage; a predict stage shows NO instrument and offers the model students actually hold; the next stage quotes the locked guess (`remember`/`recall`).
- Every drag has a two-tap twin (the engine gives it; your pieces must be pieces/slots/trays/rails). A tool laid on a card must be able to join (avoid `nojoin` cards as targets).
- Layout: sizes in table units; text at least `LABEL.min`; nothing painted under a dial's strip (content starts about 11 units below the fixture's top where it has a dial); keep the Run key's corner (bottom right, about 8 units) free of text; trays and captions inside the table; `cellH` at least a card tall; pieces and captions at least 18 units apart in a column. `verify:table` finds overlaps; fix the layout, not the check.
- Words: plain labels until the reward card earns the term; no word a later bench introduces (`verify:story` and `verify:learn` hold it); no Le Châtelier language for cells (the CED says it does not apply); no +/− electrode labels (the CED excludes them).
- Fonts: sans symbols for element letters; true minus; "O" never in a mono face.
- Chemistry accuracy over everything: a simplification is fine, a falsehood is not; where the kit simplifies, say so on the bench.
- Do not edit another builder's files. Shared files get single-line anchored insertions only, done with one atomic command (a short Python read-modify-write), then re-read the file to confirm your line and the others' lines are all there.

## When you finish

Reply with: the files you created or edited, the stage list as built, what the three checks say, every place you parted from the spec, and the stages whose feel only a hand can judge. Do not claim anything you did not run.


### 8.1 Bench 1 (`q1-halves`) Build Notes
# Brinewire q1-halves: build notes

Status: built 2026-11-05, checked by script only (`verify:learn`, `verify:table`, `verify:story` filtered to unit10; `verify:bench` has no unit10 world yet). Nothing here was played.

## What was built

- Quest `src/learn/quests/unit10/q1-halves.js` (8 stages, predict pair 2 and 3, stage 5 labelled beyond the exam in its title and reward).
- Kit files `table/kits/cell-redox.js` (+ `-tour`): fixtures `cellredox` (beaker, two windows) and `cellprobe` (seat, readout, strip). `cell-ledger.js` (+ `-tour`): fixtures `cellledger` (a half-reaction card with chip dials or a "Written this many times" dial) and `celltally`. One line each added to `cell.js`.
- Planners `engine/celldata-q1.js`: probe cards (`CARDS`), the four sealed reactions (`SORT`, `reactionStates`, `isRedox`, `movers`), window counts from `matchElectrons` (`windowOf`, `windowCharge`), halves (`HALF`, `bare`, `scaleHalf`, `overall`, `equationText`), ledger rows in a fixed order (`rowsFor`, `firstOff`). `celldata.js` untouched.
- Story: painter `half-join` in `ui/story-scenes-brinewire-q1.js`, block in `story/quest-story.js`, lead line in `stage-story.js`. Bank `bank/unit10/q1-halves.json` (+ `bank.js`). Chart line flipped live. Checks `tools/lib/brinewire-q1-checks.mjs` (+ `verify-learn.mjs`).

## Where this parts from the spec (3.1) and why

1. **Number probe is a fixture with a seat, not a piece laid on a species.** A piece "laid on" a species needs a join the cell kit does not have (only blocks join). It is the potential board's pattern: a seat, a readout and a strip that remembers (`settle`). The card is dragged to the seat, so the two-tap twin comes with it.
2. **Stage 1 has four cards, not five** (Zinc, Copper, Sulfur in the sulfate ions, Oxygen in the sulfate ions). A card has to stand for one kind of atom so one number can be read per window; the whole sulfate ion has no single number. Sorting is into two trays ("Number different", "Number the same") rather than marking, because marking cards (`markable`) cannot also be carried to the probe seat. The probe prints Before and After together, so one placement per card reads both.
3. **Stage 1 prompt does not say "oxidation number"** (the reward earns it). It asks for the sort by "whether the probe reads the same number before and after".
4. **Stage 5 puts the probe and two beakers on one table** with one slot per beaker. The probe has no strip there. Cards: Cu, Ag⁺, Mg, Fe²⁺.
5. **Stage 6 uses six chip dials** (H⁺, H₂O, electrons, each on the left and on the right) because the side of each chip is part of what is being worked out. Ranges are 0 to 10, 0 to 6, 0 to 6. This is a build, not a hunt: the ledger names the row that is off. The ledger prints left and right counts (as the brief says) and not row differences (as the spec table says); it never marks a row.
6. **Stage 3 prints only the charge row**; stages 4 and 7 print no rows (the halves are given balanced, only their multiples change, the card shows the scaled half and the tally shows the electrons).
7. **Stage 7 multiplier ranges are 1 to 3 (permanganate) and 1 to 6 (iron(II))**; stage 4 uses 1 to 4 on both. Only the lowest matching pair fits each range.
8. **Stage 8 tray names ("Redox", "Not redox") are the two answers** (the spec's sort); "redox" is earned on stage 3's reward. Sealed means labelled Reaction A to D; the reward names them.
9. **Lead line is one sentence** ("The Fifth says the pylons are rotting, and Vess wants to find out what moves when a metal rots."), because `verify:learn` requires a one-sentence story line; the caller's two-sentence text failed that check. The Filed line is as given.
10. **Stage 2 prompt is one question** ("Where do the two electrons that each zinc atom loses end up?") for the same one-sentence rule.
11. **`WITHHELD_VOCAB` line sits before the `unit09/q6-titrate` line** (there is no `unit10/q4-potential` line to follow). The `checkBrinewireQ1` call follows the Q4 call as asked.
12. Chart descriptor: "The pylons are rotting; find what moves when a metal rots."

## Prompts and hints as built

1. "Sort the four cards by whether the probe reads the same number before and after." 1 Drag a card onto the probe seat to read it, then drag each of the four cards into a tray. 2 Compare the "Before" number with the "After" number the probe prints for each card. 3 Put a card in the first tray when its two numbers are not equal and in the second when they are.
2. "Where do the two electrons that each zinc atom loses end up?" (predict) 1 Use the four cards and the slot. 2 Picture the zinc strip in the "Before" and "After" windows and ask what in the After window could hold electrons the strip lost. 3 Ask whether the electrons can end up anywhere that is not a particle.
3. "Write each half of the zinc and copper reaction so that its charge balances." (quotes the guess) 1 Turn the electron dials on each card until the charge row has the same count on both sides. 2 Compare the charge on the left and on the right of the arrow for the zinc card and for the copper card. 3 An electron carries one unit of negative charge, so place electrons on the side that has too much positive charge to cancel it.
4. "Balance aluminium with copper(II) ions so no electrons are left over." 1 Turn the "Written this many times" dial on each card and watch the tally. 2 Compare the electrons given with the electrons taken for each pair of settings. 3 Write each half enough times that both halves handle the same number of electrons.
5. "Lay the species that gives up its electrons in each beaker on its slot." 1 Drag a card onto the probe seat to read it, then lay one card on each beaker's slot. 2 Compare the "Before" and "After" numbers of the two species in each beaker. 3 The species that gives up electrons is the one whose number rises.
6. "Balance the permanganate half in acid by placing electrons, hydrogen ions and water." 1 Turn the dials for hydrogen ions, water and electrons on the left and the right of the arrow. 2 Compare the left count with the right count in each row of the ledger, one row at a time. 3 Settle the oxygen row with water, then the hydrogen row with hydrogen ions, then the charge row with electrons.
7. "Join the permanganate half and the iron(II) half so that no electrons are left over." 1 as stage 4. 2 Compare how many electrons one copy of each half handles with the tally at each setting. 3 Write the halves enough times that the electrons given equal the electrons taken.
8. "Sort the four sealed reactions into redox and not redox." 1 Drag a reaction card onto the probe seat to read it, then drag each card into a tray. 2 Compare the "Before" and "After" numbers the probe prints for every element in a reaction. 3 A reaction is redox when the numbers of at least one of its elements are not equal.

## What only a hand can judge

- Stage 1 and 8: whether reading four (or four) cards on the probe then sorting feels like discovery or like a chore, and whether the probe's Before/After columns read at a glance at phone size.
- Stage 5: the table is tall (two stacked beakers, a probe and four cards); crowding at 375 px.
- Stage 6: six dials on one card (dial labels at the dial strip's pitch, 5 units); dragging a dial to a number from 0 to 10 on a phone.
- The windows: whether 8 strip atoms and about 10 ions are readable with the labels at the minimum size.
- 3D On: the beaker windows get low glass walls (`dress3d`, copied from the board); the ledger, tally and probe are flat. Not seen in 3D.
- Story painter pacing and sizes.

## Defects found while building

- `ledgerRows` lists the elements of every species in a half, so a half with a zero-count entry would print extra rows; the ledger builds halves without zero entries and `rowsFor` pins the row labels per card.
- `balanceAcidHalf` returns the balanced half including its electrons, so a card started from it is already solved. `bare()` strips the electrons for the student's starting card (found by `verify:table` on stage 3).
- The `tag` piece is 26 units wide, so a probe seat is 32 by 14.
- Not mine, seen in the filtered output: `unit10/q3-galvanic` fails `verify:learn` (prompt two sentences, no lead line, no bench problems) and `verify:story` (no animation); those builds are in progress.


### 8.2 Bench 2 (`q2-activity`) Build Notes
# Brinewire q2-activity (Which Metal Gives): build notes

Built 2026-11-05 on the cell kit. No browser was used; nothing here is `Played`.

## What was built

- Quest `src/learn/quests/unit10/q2-activity.js` (8 stages), planners `src/learn/engine/celldata-q2-activity.js` (pure; `dipResult`, `dipWords`, `coated`, `nailSpots`, `stripsTakingOnly`; all of it is `celldata.js` `displaces`, `givesHydrogen`, `protectsIron`, `takesOutOnly`, `activityOrder`).
- Kit `src/learn/table/kits/cell-dip.js` + `cell-dip-tour.js`: fixtures `celldip` (the dip rack), `celldipnails` (iron nails in brine wired to partners, with a "Leave a Week" key) and piece `celldipstrip`. One import line in `cell.js`.
- Story painter `dip-order` (`src/ui/story-scenes-brinewire-q2-activity.js`), block in `quest-story.js`, lead line in `stage-story.js`, bank `bank/unit10/q2-activity.json`, chart line flipped live, checks `tools/lib/brinewire-q2-checks.mjs`, one `WITHHELD_VOCAB` line and the check call in `verify-learn.mjs`.

## Stages as built

1 coated or clean (selector of three solutions) · 2 rank Zn, Fe, Pb, Cu (rail, four beakers) · 3 predict (cards only) · 4 copper in the zinc solution (selector, quotes the guess) · 5 hydrogen among five metals (five acid beakers, rail of six) · 6 iron nail and four partners (Leave a Week, tray of cards) · 7 sealed X among four (rail pre-seated with the four known metals, X last) · 8 the strip that takes copper from the Cu/Fe mix (four mixed beakers, selector).

Prompts and hints are in the quest file. The rack prints no results log: each beaker keeps a small mark per strip dipped in it (`settle`, `props.noted`), a coloured square for a coating, a ring for bubbles, an empty square for none.

## Where this parts from the spec

- Lead line stage 1 is one sentence ("Two bolts on one pylon rot at different speeds, and Vess wants to find which metal gives."), because `verify:learn` requires a one-sentence lead; the two-sentence wording given in the spec fails that check. Filed line is the one asked for.
- Stage 3 prompt is one sentence with a semicolon (the verifier needs exactly one sentence).
- Stage 5: five acid beakers (one per strip) rather than one beaker; only the position of hydrogen is graded, so the order of Mg, Zn and Fe among themselves is free (the bench shows nothing that separates them).
- Stage 7: the four known metals start on the rail in the order stage 2 found, so the stage is about X alone; the whole rail is still graded.
- Stage 4 verdict options are the same four cards as the prediction ("Coated and thinner" is the held model). A wrong verdict is refused with "compare it with the zinc strip", not with the reading itself, because the reading is the answer.
- Stage 6 uses a tray "Nail with no blue spots" and cards (the multi-select), and a Run key "Leave a Week" so the spots are found, not printed at the start.
- The story's last beat avoids "anode" (`verify:story` holds it for q3); the reward card of stage 6 names "sacrificial anode" as the spec asks. `BUILDS_ON` is empty because q1 is not used for words.
- The Pb strip bubbles in acid per `givesHydrogen` (E° below 0); real lead in acid is slow, and the bench does not use lead there.

## Simplifications said on the bench or here

All solutions 1 M and strips left long enough to finish. One bubble pattern for every metal that gives hydrogen (real rates differ). A bare nail also rusts slowly; the nails show only the spots that wiring to a less active metal adds (5 each, the same for copper and tin). Mixed-beaker ions swap charge for charge, 6 of each at the start.

## What only a hand can judge

Whether the thin coated strip in each beaker reads as a coating at phone size (grey on grey: lead and iron coatings rely on the colour word under the beaker and the rough edge); the fit of the 5-beaker rack on stage 5 at 375 px; the two-tap twin for dipping a strip over a beaker seat; the marks (2 px squares) on each beaker; the 3D low dishes and flat bar strips at `3D On`.

## Defects found on the way

`verify:learn` crashes on a missing `brinewire-q1-checks.mjs` while another builder's bench is in progress; q2's checks were run on their own as well. `verify:story` known failure `unit02/q10-wavefunctions` is not this bench.


### 8.3 Bench 3 (`q3-galvanic`) Build Notes
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


### 8.4 Bench 5 (`q5-load`) Build Notes
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


### 8.5 Bench 6 (`q6-electrolysis`) Build Notes
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


### 8.6 Boss Clamp Build Notes
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


### 8.7 Walkable World Notes
# Brinewire: the walkable world (builder notes)

Scope: the copper marsh as a place (spec section 5), the six bench hosts, the Clamp's arena spot and arena body. Not here: the quests, the cell kit, the Clamp's table foe body (`foebody.js`, `foes.js`), the boss quest and the finale.

## What was built

- `tools/gen-brinewire-layout.mjs` writes `src/three/world-data/brinewire.json` (seeded, self-checking, refuses to write on a layout clash). It reads `src/learn/quests/unit10/` to set each site's `built` flag, so **rerun it whenever a quest module lands** (`verify:brinewire` fails on a stale flag).
- `src/three/brinewire.js` (the `BrinewireWorld` class, same contract as `VerdigrisWorld`) and `src/three/brinewire/{terrain,atmosphere,stations,plant,host-plan}.js`, `src/three/materials/brinewire-textures.js` (`saltMud`, `saltBoard`, `brineWater`, `pourConcrete`).
- Layout: a plank spine from the pad and spawn (z 92) south to the switch-house court (boss ground at 0,-54), six spurs (odd benches west at x -42, even east at x +42, z 62/28/-6 west and 46/12/-22 east), nine near pools between the spurs fenced by boxes, the lagoon (largest pool, z -62 to -130) on the court's south shore. Pools carry a lattice pylon or a brine tank; the court's west pool carries the switch house; the lagoon carries three pylons and four rotor piers (the only moving parts, cup wheels, one turn in 40 s). Five cable spans (two conductors each) hang from pylon arm tips, 8 m or more over the water and the spurs, as one ambient object. Land: transformers, cable reels, salt heaps, ingot and crate stacks, salt grass, 37 work lamps.
- Hosts (one per quest id of the plan, built whether or not the quest exists): site-1 `q1-halves` pylon base in a brine sump; site-2 `q2-activity` dip pool with a gantry of hung strips; site-3 `q3-galvanic` pool pair with an arched pipe bridge and a strung cable; site-4 `q4-potential` metering shed; site-5 `q5-load` battery bank; site-6 `q6-electrolysis` plating works. Each bench's cased instrument (`kind`: beaker, rack, rig, meter, load, supply) differs.
- Boss arena: `boss-arena.js` gains `BOSS_LOOK['the clamp']` and the `boss-clamp` spot (unit10, same court coordinates as the other end-of-spine arenas); `boss-models.js` gains `buildClamp` (a drain clamp on a lattice pylon: concrete sled, braced mast, patina housing with two lenses, five glass cells with copper caps ringed round the back on cables, two three-joint arms ending in working jaw pairs, four armour plates). **Hook for the later builder:** the species name is `'the clamp'`; `foes.js` and `foebody.js` need an entry under that name (Leach entries are the model); the saga/finale files nothing yet.
- Registered: `worlds3d.js` (`unit10`), `voyage.js` (`brinewire`), `stage.js` (world, exposure 0.9, `enterBrinewireScene`, `setBrinewireSiteComplete`, `isLearnWorld`), `commendations.js` (`learn_q7_halves`, earned by `unit10/q1-halves`), `verify-bench.mjs` (import, foes list, `WORLD_OF`), `verify-voyage.mjs`, `verify-arena.mjs` (world, ten bodies, scale), `package.json` (`verify:brinewire`, and in the `verify` chain before `verify:bench`).
- `tools/verify-brinewire.mjs`: modelled on `verify-verdigris.mjs`: the planner data check, landmark and host declarations, built-flag staleness, sites and labels, tier parity, the lamp lane, the Clamp's ground against `boss-arena.js`, then the real world in Node: overlap, buried bodies, lit materials, water, bench anchors and lamps, the walk flood fill (ledges, wading, fenced pools, reachable approaches), host extents, level ground, the bay and lean-in view at seven viewports. New checks: cable spans (ambient, end at pylons, 7.5 m clearance, no host under one) and the rotor wheels.

## Where this parts from the spec or from Verdigris

- Spec section 5 says hosts are "built into" marsh machinery; the plan's names are used (`pylon-base`, `dip-pool`, `pool-pair`, `metering-shed`, `battery-bank`, `plating-works`). Six hosts means six spurs and nine near pools, not Verdigris's ten.
- The boss arena sits on the same court coordinates as Verdigris (0,-54), because the court geometry (plaza, shore of the largest pool) is the proven one. The brief did not give coordinates.
- A new landmark kind, the cable run, is data (`cables` in the JSON) rather than a landmark; it is ambient and has no collider. The pad, lamps and landing code are Ember Reach's own, as in Verdigris.
- The commendation is an addition the brief only allowed "if Verdigris touched it"; it names the first bench by id only, so it works before the quest is wired.
- Host extents are the slab each host stands on; `verify:brinewire` keeps the bodies inside it (within 0.25 m).

## What only a hand can judge

No browser was used. Unseen: whether the salt-crust ground, the bleached boards and the teal brine read as a salt marsh at the light the sky gives; the pylon lattice thickness from the walk; whether the white crust at the pool lips is too bright against the 0.9 exposure; the cable sag against the sky; whether the host dressing (dip-pool strips, battery cells, anode bars) is legible from the approach mark; the Clamp's jaws and cell levels in motion; the rotor piers' speed.

## Defects found along the way

- `verify:bench` currently reports six lines for `unit10/q2-activity` (pieces `s-zn` and `s-fe` 25.9 to 27.9 px across at the two phone-landscape viewports, under 28 px). That is the q2 builder's table, not the world; every Brinewire host line in `verify:bench` is green.
- The built flags in `brinewire.json` go stale each time another builder lands a quest. Rerun the generator last.

