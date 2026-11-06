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
