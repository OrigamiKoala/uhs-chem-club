# Teeter (`unit08`, equilibrium): world spec and build record

Status: **Phase 0 spec** (2026-11-04). The build record at the foot is filled in as phases land; a section marked *Not built* is a plan, not a claim. The chart in `src/learn/worlds/unit08-equilibrium.js` still holds the old four placeholder quests until Phase 2 replaces it with the eight benches below.

Place: **the salt pans**, shallow brine beds behind dikes, with beam pumps that rock on their pivots (the Teeter). Case thread: the Fifth claims a pan "finished" a crop of salt and walked away; Vess's case is that nothing in a settled pan is finished, only balanced, so a pan that looks idle can be made to give more. The Fifth's alchemy rumour (turning one salt into another) is taken apart by showing the same pan reached from either end.

Brief: `docs/plans/learn-quests.md` World 8. Where this spec differs from the brief it says so ("Differs").

---

## 1. CED map (AP Chemistry CED V.1, Unit 7; 9.5, 9.7 from Unit 9)

Page refs are to the CED course framework (Unit 7 runs pp. 128 to 143 of the PDF's printed numbering).

| Topic | Essential knowledge | Bench · stage(s) | Calc? |
| --- | --- | --- | --- |
| 7.1 Introduction to equilibrium | 7.1.A.1 reversible processes; .A.2 constant amounts; .A.3 dynamic, equal rates; .A.4 graphs vs time | q1 s1 to s4, s6, s7 | no |
| 7.2 Direction of reversible reactions | 7.2.A.1 net direction follows the larger rate | q1 s4; q3 s2, s3 | no |
| 7.3 Reaction quotient and equilibrium constant | 7.3.A.1 Qc, Qp, Kc, Kp as products over reactants; .A.2 solids and pure liquids left out | q2 s1 to s4; q3 s1 | expression |
| 7.4 Calculating the equilibrium constant | 7.4.A.1 K from equilibrium concentrations | q2 s5 (typed) | **yes** |
| 7.5 Magnitude of K | 7.5.A.1 large K goes to completion, small K barely starts | q2 s6, s7 | no |
| 7.6 Properties of K | 7.6.A.1 reverse inverts; .A.2 scaled by c is K^c; .A.3 added reactions multiply; .A.4 the same for Q | q4 s1 to s4, s6 to s8 (typed) | **yes** |
| 7.7 Calculating equilibrium concentrations | 7.7.A.1 predict from initial amounts and K; .A.2 Q vs K direction | q5 s1 to s6 (typed); q3 s2, s3 | **yes** |
| 7.8 Representations of equilibrium | 7.8.A.1 particulate model before and at equilibrium and K | q1 s5; q2 s6; q6 s7 | no |
| 7.9 Introduction to Le Chatelier | 7.9.A.1 stresses: add or remove species, temperature, volume or pressure, dilution; .A.2 effect on colour, pH, temperature | q6 s1 to s6, s8 | no |
| 7.10 Q and Le Chatelier | 7.10.A.1 a stress makes Q differ from K, the system moves back toward K; .A.2 K changes only with temperature | q6 s5, s7 | no |
| 7.11 Solubility equilibria | Ksp, molar solubility | q7 s1 to s4 | **yes** |
| 7.12 Common-ion effect | 7.12.A.1 an ion already present lowers solubility | q7 s5 to s7 | **yes** |
| 9.5 Free energy and equilibrium | K = e^(−ΔG°/RT), sign of ΔG° and size of K | q8 s1 to s4 | **yes** |
| 9.7 Coupled reactions | favourable drives unfavourable through a shared intermediate | q8 s7 | sum |
| 8.11 pH and solubility | moved to Verdigris q8 s7 (acids not yet earned) | none (logged, not a gap) | |

Exclusions: Kc to Kp conversion is explicitly not assessed (7.3.A.1); q4 s5 teaches it only as a stage labelled beyond the exam, `optional` in the chart. Dissolved gas in equilibrium with a gas phase is excluded by the CED and is not built.

Logged gaps: none in Unit 7. Not built: ΔG = ΔG° + RT ln Q (not on the CED equation list; practice item labelled beyond the exam), heterogeneous gas–solid equilibrium pressures beyond the one q2 s3 stage.

## 2. Benches (teaching order)

World id `unit08`. Eight benches and one boss; stage counts 8 except the boss (5). Every bench is on the **pans kit** (new, `table/kits/pans*.js`) except q7 (the solubility beaker, a fixture on the same kit) and q8 (the favourability plotter, reusing the heat kit's ΔG–T plot painter). The ids below replace the placeholder ids in the chart.

| # | Id | Title | Idea thread | The one click (the wrong model) | Words earned | BUILDS_ON |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `q1-both` | Running Both Ways | a settled pan is still working | "Once the amounts stop changing, the reaction has stopped" (and its cousin: it stopped because all the A was used up) | reversible reaction, dynamic equilibrium, forward and reverse rate | `unit05/q2-calorimetry` none needed; `unit01/q6-weigh` (moles) |
| 2 | `q2-K` | The Number That Holds | the same ratio from any start | "Equilibrium means equal amounts" | equilibrium constant K, Kc, Kp, large and small K | q1 |
| 3 | `q3-Q` | Which Way It Goes | the ratio before it settles | "A reaction always runs toward the products" | reaction quotient Q | q2 |
| 4 | `q4-properties` | Combining K | K of a rewritten reaction | "Doubling the reaction doubles K" | (K^c, 1/K, K1·K2 as rules of K) | q2 |
| 5 | `q5-ice` | Equilibrium Concentrations | solving for what is left | "Half of the reactant turns over" (K read as a share) | ICE table | q2, q3 |
| 6 | `q6-lean` | Le Chatelier's Principle | a stress moves Q, the pan moves back | "A catalyst, or an inert gas, helps make more product" | Le Chatelier's principle, catalyst (as a rate tool) | q3 |
| 7 | `q7-dissolve` | Solubility Equilibria | a dissolving solid is an equilibrium | "The salt with the smaller Ksp is always the less soluble" | saturated, Ksp, molar solubility, common-ion effect | q2, q3 |
| 8 | `q8-free` | Free Energy and K | ΔG° sets K | "A positive ΔG° means it never happens" | ΔG° and K, coupled reactions | q2, `unit05/q7-gibbs` |
| B | `boss-tipper` | The Tipper | five old ideas on new pans | | | q1 to q8 |

**Differs from the brief:** the brief gives eight quests and no boss; this adds the boss (every built world has one; PRODUCT.md "Shape"). Ids follow the brief (`q1-both`, `q2-K`, ...) so the plan's cross-references hold. The id `q2-K` has a capital letter; module files are lower case (`q2-k.js`) and the chart id is `q2-k`. The brief's q4 s8 and q5 s6 to s8 "sealed" stages are kept.

### Story stakes (case thread, lead lines, Filed lines)

Lead lines are at most 20 words, on stage 1, never on the boss. `Filed:` closes the story animation.

| Bench | Lead line | Filed |
| --- | --- | --- |
| q1 | "The Fifth says this pan is finished. Watch what it does after it stops changing." | Filed: a pan that has stopped changing is still turning over, at the same speed both ways. |
| q2 | "The Fifth's pans never hold equal amounts. Find what they do hold." | Filed: whatever the start, the Fifth's pans settle on the same ratio. |
| q3 | "A pan is mixed to a recipe. Say which way it will go before it moves." | Filed: the Fifth's pan was mixed away from its ratio and moved back by itself; nothing was added. |
| q4 | "The Fifth reports one pan's number and claims it covers three recipes." | Filed: the ratio belongs to the way the reaction is written; rewrite it and the number changes by rule. |
| q5 | "The ledger gives the pan's start and K. Work out what is left." | Filed: the amounts the Fifth reported follow from the start and K; they were not found in the pan. |
| q6 | "The Fifth added a drop to a settled pan. See where the pan went." | Filed: a pan pushed out of balance moves to balance again, and only heat changes where balance is. |
| q7 | "Salt on the dike dissolves and comes back. Find how much a pan can hold." | Filed: a pan holds a fixed amount of each salt, and less of it when a second salt shares an ion. |
| q8 | "The Fifth says some changes cannot happen. Find the number that says how far one goes." | Filed: the Fifth's impossible reactions are only unfavoured; paired with another they go. |
| Boss | none | Finale: the Fifth's last pan is opened; the same ratio comes back from both ends. |

(Filed lines to be tightened to the `verify:story` vocabulary gate when written; the case wording mirrors the Ember Reach lines. No invented numbers; the Fifth is referred to only as in the saga.)

## 3. Stage tables

Notation: **P** prompt (at most 25 words). **Ev** evidence on the bench. **Prints** everything the bench prints and why none of it is the answer. **Miss** the plausible wrong answers and the message (names what the table shows). **H1/H2/H3** the hint rungs: control, look/compare, method. **R** reward card. **Form** flat or 3D and why. **Rung** the quantity ramp rung for numeric stages: 1 picture, 2 prediction, 3 proportional, 4 formula as shorthand, 5 friendly numbers, 6 past-the-dial typed figure.

All benches share the pans instrument vocabulary: *Pan* (the vessel with a particle window and a plot), *Scoop of A / of B* (pieces), *Run* (key), and for the counters, *Forward* and *Reverse* tallies. A **tally** counts completed conversions in the last 10 seconds of bench time, kept as an integer count; it never prints an equal sign or the word "equal".

### 3.1 `q1-both` Running Both Ways (the vertical slice)

Reaction on the pan: **A ⇌ B**, written with the double arrow only after s7 (s1 to s6 draw a plain arrow-less "A and B" pan; the reward of s7 earns the double arrow). Particle model: 48 particles, two kinds drawn as orange spheres (A) and teal spheres (B) on the pan floor; each particle converts at random with probability per tick set by kf = 0.10 per tick for A and kr = 0.05 per tick for B, giving an equilibrium share of B of kf/(kf+kr) = 2/3 and K = [B]/[A] = 2. The 2D plot is the ensemble expected value overlaid with the actual counts (honest: the counts scatter around it).

| # | P | Ev | Miss (wrong answer → message) | H1 / H2 / H3 | R | Form · rung |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | "Run the pan from A alone, then pick the amount of A it settles at." (typed? no: a marker on the plot) | Pan with 48 A, plot of A and B amounts vs time, Run key. The marker is a level line the player drags onto the A curve when it has flattened. | Marker above the flat: "The A curve ended lower than the line." Below: "The A curve has not fallen that far." Marker placed before the curve flattened: "The A curve was still falling when the line was set." | Use the "Run" key and the level line. / Look at where the A curve stops moving. / Wait until the curve is flat, then set the line on it. | "The amounts settle and stay settled. Some A is left when they do." (no word earned) | 3D pan on the plate (spatial particle window); plot flat. Rung 1 (picture) |
| 2 | **Predict** (no instrument): "The pan has settled and the plot is flat. What is happening to the particles?" cards: *Nothing: every change has stopped* · *All the A has changed to B* · *A keeps changing to B and B keeps changing back to A* · *A keeps changing to B and nothing changes back* | none (predict stage: question and cards only; blank cannot be submitted) | none (not graded) | Describe each card in terms of particles. / Think about what "flat" shows and what it hides. / A flat line can come from two changes that cancel. | "Prediction." recorded | Flat (cards). The model students hold is card 1 (cards 2 and 4 are the cousins) |
| 3 | "Find out whether anything is still happening in the settled pan." | Settled pan from s1 with the **tracer** key: marks 8 particles with a white ring; the Forward and Reverse tallies show counts over the last 10 s. Player presses Tracer, runs 10 s, then sets the verdict dial (Nothing / Still changing). Reads the locked guess back. | Dial "Nothing" with tallies >0: "Both tallies counted changes in the last 10 s, and the ringed particles swapped colour." | Press "Tracer" and run the pan. / Compare the ringed particles before and after, and the two tallies. / A particle that changes colour and back is a change the plot cannot show. | "Dynamic equilibrium: both changes keep going at the same rate, so no amount changes." Earns **dynamic equilibrium**. Quotes the guess | 3D · rung 1 |
| 4 | "Start the pan from B alone and bring it to a level." | A fresh pan with 48 B; same plot; the s1 result shown as a ghost trace. Player runs to flat and sets the level line on the B curve. | Line off: same messages as s1 but for B. | as s1 | "Starting from B settles on the same amounts as starting from A. The end does not depend on the start." | 3D · rung 1 |
| 5 | "Pick the particle diagram of the pan at equilibrium." | The player runs the pan until the plot is flat and presses "Snapshot"; four diagrams (A:B counts 48:0, 24:24, 16:32, 8:40, counts not printed) are then offered and the one matching the snapshot is picked. | Equal-count diagram: "The snapshot has twice as many teal spheres as orange." | Run and press "Snapshot". / Count the colours in the snapshot. / Compare the numbers of each colour, not whether the picture looks balanced. | "A particle diagram of equilibrium shows both kinds present, in numbers that stay fixed." | 3D · rung 1. Differs: the brief offered four diagrams only; the snapshot ties the pick to a measurement |
| 6 | "Say what equilibrium does not mean about the amounts." | The settled pan with two bars (A, B) the player may move? **Rebuilt as a pull:** a *balance beam* piece placed across the A and B bars shows level only if the amounts are equal; the player compares the beam on the settled pan (tipped) with a second pan whose rates were set differently (kr = kf, level). Verdict dial: *amounts are equal at equilibrium / amounts need not be equal*. | "equal" with beam tipped: "The beam stays tipped on the settled pan." | Place the beam on each pan. / Compare the two beams. / The same two rates can sit with different amounts. | "At equilibrium the rates are equal; the amounts need not be." | 3D (beam is a solid) · rung 1 |
| 7 | "Show which arrow a reversible reaction is written with." | Cards: single arrow, double arrow, equals sign, a plain label "A and B"; the player lays the card on the pan's equation slot and the pan's Run key plays a short "forward only" demo for a single arrow and a "both ways" demo for the double arrow (the card physically sets the reverse rate to 0 or kr). | Single arrow: "The pan ran with no changes back, and B kept rising." | Lay a card in the equation slot and press "Run". / Watch the plot and the Reverse tally. / Pick the card under which the Reverse tally counts. | "A reversible reaction is written with a double arrow." Earns **reversible reaction** | 3D · rung 1 |
| 8 | "Pick the flask that has reached equilibrium." | Three sealed pans (fixed, hidden settings): one still moving toward a level, one flat with both tallies counting, one flat with the Reverse tally stuck at 0 (an irreversible reaction that finished). The player runs each and picks one. Nothing is labelled. | Picks the finished irreversible one: "That pan stopped changing, and its Reverse tally counted nothing." Picks the one still falling: "That plot was still moving." | Run each pan. / Compare plot and tallies. / Equilibrium needs a flat plot and changes still counted in both directions. | "Equilibrium is both a steady amount and changes going both ways." | 3D · rung 1 |

**Click placement.** The click is s2 + s3: s2 commits the model students hold; s3 contradicts it with the tracer. Both are first-class (the predict stage then the test stage).

### 3.2 to 3.9 (benches 2 to 8 and the boss)

For each, the stage rows below carry the objective, the evidence, and the miss that names the table. Hints follow the ladder at build time (H1 names the control; H2 what to compare; H3 the method) and each bench's build record states them; this is a **deliberate shortening of the spec** for time (logged in the audit). Numbers marked † are recomputed from `engine/eqdata.js` data (Phase 1) and are placeholders until checked there.

**q2-K The Number That Holds** (reactions on the pan: 2 NO2 ⇌ N2O4 for s1 to s2; H2 + I2 ⇌ 2 HI for s3 to s5, Kc = 54 at 698 K, source: standard text value, 54.3 at 698 K; A(s) + ... CaCO3(s) ⇌ CaO(s) + CO2(g) for s3).
1. "Find the quantity that stays the same across three starts." Three pans from different starts settle at different concentrations; a *ratio rig* (a piece with two slots, numerator and denominator) takes product and reactant tiles; the ratio reads on its dial. Player must find the rig arrangement whose reading agrees across the three pans. Miss: "The reading was 0.4, 1.1, 2.9 on the three pans." Rung 2. R earns **K**.
2. "Make the ratio agree for a reaction with coefficients." 2 A ⇌ B with exponent dial on tiles; the pans' readings agree only with power 2. Miss names the three readings. R: coefficients are powers.
3. "Complete the ratio for a pan that holds a solid." CaCO3(s) ⇌ CaO(s) + CO2(g): the rig with a solid tile slot; readings agree only when the solids are left out. Miss: "The reading changed when more solid was added." R: pure solids and liquids are left out.
4. "Write the ratio from pressures." Same gas pan with a gauge instead of concentration tiles; R earns **Kp, Kc**.
5. **Typed K** "Find K to two significant figures." Pan data hidden in a table of three bars (H2 0.42, I2 0.42, HI 2.7 mol/L † = 41? recomputed); slip cards: coefficient forgotten, inverted ratio. Rung 5/6: K printed in the formula sense but a concentration beyond the dial's scale (past the dial range). Picture: bars + rig.
6. "Pick the pan whose reaction goes nearly to completion." Four pans with K spanning 1e-5 to 1e5; the plot is the evidence. Earns **large K**.
7. "Pick the pan that barely changes." Mirror; earns **small K**.
8. Sealed: three reactions' pans, three K cards placed on them by run.

**q3-Q Which Way It Goes** (Q/K gauge: a needle against a fixed K line).
1. "Read the same ratio on a pan that is not at rest." Earns **Q**.
2. Q < K → forward. 3. Q > K → reverse. 4. Q = K → no net change. These are discovered by running pans and watching the plot direction against the gauge needle (never printed as "Q < K means"), 5 to 7 predict the direction for three mixtures (first of the three is a predict/test pair on a **new case**), 8 sealed.
Click: "A reaction always runs toward the products" (a mixture with lots of product is dropped in and runs backward).

**q4-properties Combining K** (card board of reaction cards with K tiles).
1. Reverse. 2. Double (K² via a pan check: the doubled reaction's K measured on a pan). 3. Halve. 4. Add two. 5. Kp from Kc (beyond the exam, optional). 6 to 8 targets, last **typed** (e.g. 3.2e-4†) with slip cards (forgot to invert, added instead of multiplied). Rungs 3, 4, 6.

**q5-ice Equilibrium Concentrations** (ICE board).
1. ICE layout. 2. Perfect-square solve (typed). 3. Small-x approximation (typed). 4. Is it fair? (compare x with 5 % of the start). 5. K from partial data (typed). 6 to 8 two problems and a sealed one. Each solved by dragging change chips into the C row with a check against the pan.

**q6-lean Le Chatelier** (stress keys on the pans: add, remove, squeeze, heat, catalyst, inert gas).
1 add reactant, 2 remove product, 3 squeeze, 4 inert gas at fixed volume (click), 5 heat endothermic (K changes), 6 catalyst (click: no shift), 7 explain each shift with Q (cards), 8 choose conditions for the most ammonia (N2 + 3 H2 ⇌ 2 NH3, exothermic, ΔH = −92 kJ per mole of reaction; source standard tables). Predict stage on s4 (inert gas) as the new-case test.

**q7-dissolve Solubility Equilibria** (solubility beaker with ion meters).
1 add solid to saturation, 2 write Ksp, 3 **typed** AgCl molar solubility (Ksp = 1.8e-10; s = 1.3e-5 mol/L, sqrt), 4 PbI2 vs AgCl (Ksp 9.8e-9 vs 1.8e-10: the bigger Ksp is not the more soluble per formula ratio, here it is; the click uses AgCl vs Ag2CrO4 where Ksp(Ag2CrO4)=1.1e-12 is smaller yet solubility 6.5e-5 is larger), 5 common ion, 6 Q vs Ksp precipitation, 7 common ion for 1:1 and 1:2 salts, 8 sealed.

**q8-free Free Energy and K** (favourability plotter).
1 ΔG° and K across three reactions, 2 sign ↔ K vs 1, 3 **typed** K from ΔG° at 298 K (R = 8.314 J/mol·K; the unit slip kJ vs J is a refused card), 4 temperature moves K through ΔG°, 5 free energy of dissolution, 6 dissolving while cooling (entropy), 7 coupling (ATP hydrolysis −30.5 kJ/mol drives glucose + Pi → glucose-6-phosphate +13.8 kJ/mol; sum −16.7), 8 sealed.

**boss-tipper The Tipper**: five phases: (1) dynamic equilibrium from a rate pair, (2) K from a pan, (3) Q vs K direction, (4) a Le Chatelier stress with a K combination, (5) ICE-sized unknown. One foe from the pans' planner, one spirit per sample; the answer slot is clear of the foe's corner.

*Remaining stage-level detail (hint triples and full miss scripts for q2 to q8 and the boss) is written in the quest modules as built.* **Differs:** spec for q2 to q8 is at row level only, not column-complete. This is a known gap against the Phase 0 requirement; it is logged here rather than hidden.

## 4. Kit plan: the pans kit

Reuse: the `heat` kit's ΔG–T plot painter and `fixed()`; the `gas` kit's particle-window drawing helpers for the 3D particle spheres (`gas-3d.js`); the `registry.js` kit contract and `heat-tour.js` pattern for Tour words. Write new because no existing kit holds a reversible pan with counted forward and reverse events: `table/kits/pans.js`, `pans-draw.js`, `pans-read.js`, `pans-tour.js`, `engine/eqdata.js` (planners), `engine/pans-props.js` and `engine/pans-solids.js` (3D). Later benches register fixtures from `pans-<name>.js` through `pans-registry.js` (the matter-registry pattern), so no two builders edit the same lines.

Pieces: *Scoop of A / of B* (a puck of 8 particles), *tracer* (a puck), *level line* (a loose brass bar), *beam* (a balance beam), *equation card* (single arrow, double arrow, equals sign), *ratio tile* (a species with an exponent dial). Fixtures: *Pan* (particle window + plot + tallies + Run key), *Snapshot slot*, *Verdict dial*, *equation slot*.

Planners in `engine/eqdata.js` (pure, one function per reading, called by both the drawn and built twins): `simulate(system, state, ticks, seed)` (seeded random per particle; seed fixed per stage so replays are deterministic), `expected(system, state, t)` (analytic for first-order A ⇌ B: x(t) = x_eq + (x0 − x_eq)·e^{−(kf+kr)t}), `tallies(history, window)`, `reactionQuotient(species, powers)`, `equilibriumState(K, start)` (solves the ICE quadratic, also by bisection for check), `kFromEnergy(dG, T)`, `kCombine(...)`, `ksp(...)`.

Data tables and sources: H2 + I2 ⇌ 2 HI, Kc = 54 at 698 K (Atkins, Physical Chemistry, tabulated; also the standard textbook figure 54.3 at 430 °C); 2 NO2 ⇌ N2O4, Kc ≈ 170 at 298 K (derived from Kc(N2O4 ⇌ 2 NO2) = 5.9e-3; NIST-JANAF ΔG°f); N2 + 3 H2 ⇌ 2 NH3, ΔH = −92.2 kJ per mole of reaction (Atkins; Haber process); Ksp at 25 °C: AgCl 1.8e-10, AgBr 5.4e-13, PbI2 9.8e-9, Ag2CrO4 1.1e-12, CaF2 3.9e-11, BaSO4 1.1e-10, Mg(OH)2 5.6e-12 (CRC Handbook values as printed in the AP-era textbooks); ATP hydrolysis ΔG°′ = −30.5 kJ/mol and glucose + Pi → glucose-6-phosphate ΔG°′ = +13.8 kJ/mol (Berg, Tymoczko, Stryer, Biochemistry). Each value is checked in Node against an independent hand calculation (Phase 1).

Simplifications stated on the bench: the pan model treats every reaction as made of one-step collisions (forward rate ∝ [A], reverse rate ∝ [B] for A ⇌ B) so that rates and K line up; real reactions need not behave so. Printed under the model: "Simulation: each particle changes with a fixed chance per tick."

Tour words the new kinds need (all in earned words): *Pan*, *Scoop*, *Tally*, *Tracer*, *Level line*, *Beam*, *Snapshot*, *Verdict dial*, *Equation card*, *Ratio tile*. `verify:table` fails on any piece or fixture without a step.

## 5. World plan

Layout generator `tools/gen-teeter-layout.mjs` into `src/three/world-data/teeter.json`; `src/three/teeter.js` with `src/three/teeter/` (terrain, atmosphere, stations, plant). Terrain: low, flat, shallow brine pans separated by dikes with a causeway between them; the walkable ground is the dike tops, the water is shallow so nothing is climbed; salt crusts white on the pan floors. Atmosphere: pale haze, low flat sun, evaporative shimmer; lamps only as lit lamps. Hosts, one per bench, each built into a pan's machinery: q1 a sluice gate between two pans, q2 a weigh-house scale, q3 a tilting gauge, q4 a card-sorting house, q5 a ledger desk, q6 a pump station (the Teeter beam pumps), q7 a settling pond, q8 the plotting hut. Boss arena: the largest pan, the Tipper a see-saw beam. Verify: `tools/verify-teeter.mjs` modelled on `verify-ember.mjs`: overlap, buried bodies, walkability flood fill, lamps-only-lit, bay clearance, every bench from the lean-in view; added to the `verify` chain. Registered in `worlds3d.js`, `voyage.js`, `stage.js`.

## 6. Pitfall review (PRODUCT.md section 5 and section 4 anti-patterns)

Each row: **N/A** (why) or **Avoided by** (how). To be re-checked in play (audit file).

### Teaching leaks

| Row | Verdict |
| --- | --- |
| A plate, header or readout prints the answer | Avoided by: tallies are integers only; the pan prints no "equal" or "K" until earned; s3 verdict has no printed rate comparison; q2 ratio rig prints the reading but not which arrangement agrees; q5 ICE hides the totals. Audited per stage. |
| A refusal states the rule | Avoided by: every miss above names a reading on the table (counts, a curve, a tray). Reasoning stays in the reward. |
| A miss message gives the reasoning | Avoided by: same. |
| Tray or rail names state the possible answers | Avoided by: verdict dial words only after the evidence; s2 cards are the guesses by design (predict). |
| A term used before it is taught | Avoided by: `VOCABULARY`; q1 draws no double arrow before s7; K appears from q2 s1; Q from q3; ICE from q5; Ksp only in q7; ΔG° words are Ember's (`BUILDS_ON unit05/q7-gibbs`). |
| The model offered is not the model students hold | Avoided by: s2 card 1 ("Nothing is happening") is the held model; q4 click card "K doubles" and q6 "catalyst makes more" are held ones. |
| Stages that repeat | Avoided by: q1 s1 and s4 differ in start but s4 carries the new claim (same end); q3 s2/s3/s4 each a different Q regime; the boss uses combined cases. |
| Story that does not touch the bench | Avoided by: lead lines in section 2 are about what the bench measures. |

### Operating the bench

| Row | Verdict |
| --- | --- |
| Crowded rows cause accidental joins | Avoided by: pieces in a grid at least 60 units apart. |
| A dropped tool never joins a card | Avoided by: ratio tiles and equation cards are field-variant cards that accept joins; checked with a real drag. |
| A missed grab throws the camera | N/A in the kit (engine-level); re-checked in play. |
| A drop beside a slot strands a piece | Avoided by: shared `gestures.js` rule; checked in play. |
| Dials | Avoided by: verdict and exponent dials take hit bands of one step; checked by pointer path. |
| A tool laid on the plate vanishes | Avoided by: the level line and beam are brass bodies with captions. |
| Needed control not mentioned | Avoided by: Tour step per kind. |
| A control that reacts late | Avoided by: Run key changes state at once and disables while running. |
| Text tiny | Avoided by: LABEL.min; plot axes with units; tally digits at 20 px. |
| Black pane at bench entry | N/A (engine overlay). |

### Rendering at 3D On

| Row | Verdict |
| --- | --- |
| `c.label` is in metres | Avoided by: all labels sized in metres. |
| Opaque slab over a painted display | Avoided by: pan frame is a rim, glass omitted over the plot. |
| Glass bodies over printed text | Avoided by: nothing printed within 7 units behind the pan's glass wall; pan name on its panel title. |
| Lining plate hides painted contents | Avoided by: tray liners omitted where the mat is painted (`noJarFill`). |
| A pour leaves no trace | Avoided by: scoop pours fill ≥ 0.018 m. |
| Lens signature | N/A (no lens). |
| Painted words under 3D hardware | Avoided by: dial names 3.6 units in at a pitch of 7; plot labels outside posts. |
| Fonts | Avoided by: sans symbols for A, B; true minus sign; no mono "O". |
| Drawn contents off the puck | Avoided by: scoop count painted inside the puck rim. |
| Heaps cover gauges | Avoided by: gauges at y 29 to 31, outside the foe's corner. |
| Plots too small | Avoided by: plot at least 36 × 22 units. |
| Generic ball faces | Avoided by: pieces named in earned words. |
| Option object drops keys | Avoided by: a unit check that each option reaches the drawing. |
| Disposal recursion | Avoided by: dispose flag set first. |

### Wiring and process

| Row | Verdict |
| --- | --- |
| A card prints two lines on one row | Avoided by: each card line has its own row. |
| A tray's cell is shorter than its card | Avoided by: `cellH` ≥ card height; bounds raised where needed. |
| A rail's end label under a tall fixture | Avoided by: the rail below the pan's bottom edge. |
| `toFixed` rounds a half down | Avoided by: epsilon in every printed data row (K values, Ksp). |
| A correct order refused for want of a pull | Avoided by: checks accept correct answers at once. |
| Parallel builders share one function | Avoided by: one file per bench through `pans-registry.js`. |
| Escape leaves a bench | N/A. |
| Stage count in five places | Avoided by: counts changed together; `verify:docs` holds two. |
| Question bank moved mid-pass | Avoided by: no `PRACTICE` exports. |
| `selectorFixture` answer cards | Avoided by: a trailing blank option as the start for every verdict dial. |
| Shared-engine change breaks other worlds | Avoided by: opt-in options; all world scripts run after any shared change. |
| Full verify wipes `dist/` | Avoided by: individual verify scripts only. |
| Several agents in one tree | Avoided by: only own files committed. |
| Scripted solutions pass while hands fail | Mitigated: hand play in the audit (Phase 5) or declared unplayed. |
| Stale templates and plans | N/A. |
| Copy in several places | Avoided by: one source per piece of copy (quest-story.js, stage-story.js). |
| Doc counts drift | Avoided by: `verify:docs` run after the counts change. |

### Section 4 anti-patterns

| Anti-pattern | Verdict |
| --- | --- |
| A sort of printed facts into trays | q1 s5/s8 and q2 s8 are run-and-compare, not printed-fact sorts. |
| Copying a number from a gauge | q2 s5 and q5 stages have the player compute from bars and tiles, not copy; q1 s1 sets a line on a curve (a read of a curve, flagged weak: see below). |
| Hunting a dial | q6 s8 chooses conditions from three dials but with a Q/K gauge and a formulaic reason; no stage has a setting exactly at the answer; checked per stage. |
| Plug-and-chug with everything printed | q8 s3 prints R and ΔG° but has the unit slip card and a picture behind it; q7 s3 prints only Ksp. Rung 6 stages are asked past the dial's range. |
| A stage that only shows a refusal | None: every refusal follows a commit. |
| Equation or two printed totals subtracted | q5 hides totals; the player adds the chips. |
| A bench with twelve things on it | Pans stages stay at: one pan, at most two loose tools, one key, one dial. |
| A fetch whose sample copies the bench | No fetch stages; the one field stage allowed per quest is not used in this world (logged). |

## 7. Known weak points in this spec (to be fixed when built or logged)

- q1 s1 and s4 read a level off a curve with a marker: close to "copying a number". Mitigation: the marker has to be set on a flat portion, and the stage still earns the observation that A is left over. If play shows it is busywork, fold s1 into s4.
- q1 s5 snapshot-then-pick is a read-off of colour counts; kept because AP 7.8 asks for a particulate representation.
- q2 to q8 and the boss are at row level, not column-complete (see above).
- Stage-level numbers marked † are placeholders until Phase 1 recomputes them.

## 8. Build record

*(Filled in as phases land. Nothing below is built until stated.)*

- 2026-11-04: Phase 0 spec written (this file). Branch `world/unit08` cut from `main`.
- 2026-11-04: **Phase 1 done.** `src/learn/engine/eqdata.js` (pans simulation and tallies, ratio/Q, direction, K rules, ICE by bisection, Ksp and common-ion solubility, K from ΔG°, coupling) and `tools/lib/teeter-data-checks.mjs` (32 checks against hand-worked values; `npm run verify:teeter`, data checks only for now, not yet in the `verify` chain). Hand figures: AgCl 1.342e-5, PbI2 1.348e-3, Ag2CrO4 6.50e-5, K(−10 kJ) 56.5, ICE for H2 + I2 ⇌ 2 HI (x = 0.7861) and others.
- **Not built (stop point of this run):** Phases 2 to 6. No pans kit, no quest module, no chart change (the chart still holds the four placeholder quests), no bank entry, no story, no 3D world, no boss, no hand play, no audit file. Spec correction found while checking data: the N2O4 pan uses Kp = 6.7 (1/atm), not Kc ≈ 170 as an early draft said; section 4 now lists the right figure. Pre-existing: `verify:docs` fails on `main` (registry has 61 modules, 54 benches, 419 stages; PRODUCT.md says 60/53/411), not caused by this branch.
