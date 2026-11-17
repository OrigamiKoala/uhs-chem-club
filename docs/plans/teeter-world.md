# Teeter (`unit08`, equilibrium): world spec and build record

Status: **built** (benches 2026-11-04; site rebuilt 2026-11-16, section 9). Originally: Phase 0 spec (2026-11-04). The build record at the foot is filled in as phases land; a section marked *Not built* is a plan, not a claim. The chart in `src/learn/worlds/unit08-equilibrium.js` still holds the old four placeholder quests until Phase 2 replaces it with the eight benches below.

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

- q1 s1 and s4 once read a level off a curve with a marker. Replaced on 2026-11-05: s1 asks what the settled pan holds (only A, only B, both) and s4 compares the B-only pan's A with the dashed line (lower, level, higher).
- q1 s5 snapshot-then-pick is a read-off of colour counts; kept because AP 7.8 asks for a particulate representation.
- q2 to q8 and the boss are at row level, not column-complete (see above).
- Stage-level numbers marked † are placeholders until Phase 1 recomputes them.

## 8. Build record

*(Filled in as phases land. Nothing below is built until stated.)*

- 2026-11-04: Phase 0 spec written (this file). Branch `world/unit08` cut from `main`.
- 2026-11-04: **Phase 1 done.** `src/learn/engine/eqdata.js` (pans simulation and tallies, ratio/Q, direction, K rules, ICE by bisection, Ksp and common-ion solubility, K from ΔG°, coupling) and `tools/lib/teeter-data-checks.mjs` (32 checks against hand-worked values; `npm run verify:teeter`, data checks only for now, not yet in the `verify` chain). Hand figures: AgCl 1.342e-5, PbI2 1.348e-3, Ag2CrO4 6.50e-5, K(−10 kJ) 56.5, ICE for H2 + I2 ⇌ 2 HI (x = 0.7861) and others.
- (superseded) **Not built (earlier stop point):** Phases 2 to 6. No pans kit, no quest module, no chart change (the chart still holds the four placeholder quests), no bank entry, no story, no 3D world, no boss, no hand play, no audit file. Spec correction found while checking data: the N2O4 pan uses Kp = 6.7 (1/atm), not Kc ≈ 170 as an early draft said; section 4 now lists the right figure. Pre-existing: `verify:docs` fails on `main` (registry has 61 modules, 54 benches, 419 stages; PRODUCT.md says 60/53/411), not caused by this branch.

- 2026-11-04 (second session): **Phases 2 to 5 built.** `q1-both` was built first and played by hand (all 8 stages, 3D Off, real two-tap gestures and a selector/marker tap), then benches 2 to 8 and the boss were built in parallel (one agent per bench or pair, one for the walkable world, one for the boss) and integrated. All checks listed in the audit pass except `verify:story`'s `unit02/q10-wavefunctions` (not Teeter's).
- **Built differently from the spec:** the pan is a flat top-down dish (no 3D particle solids); `q2-k` gained a predict stage and lost the Kp gauge stage; `q3-q` stage 1 is "lay the mixture at equilibrium"; `q4-properties` has no Kp/Kc stage (beyond the exam) and stage 4 halves every amount; `q6-lean` stage 8 takes NH₃ out of the vessel (the three-dial search was replaced); `q7-dissolve` stage 4 is the predict stage; `q8-free` stage 1 is a predict stage; the boss phase 4 is a stress alone. Hints, misses and rewards for q2 to q8 and the boss were written by the builders to the ladder in each module.
- **Walkable world:** `src/three/teeter.js` and `teeter/`, layout from `tools/gen-teeter-layout.mjs`, eight hosts on dike tops, the Tipper arena in the largest pan. `verify:teeter` holds overlap, walkability, lamps, bay clearance and lean-in for every host. The `q2-k` bench was seen once built in the world at `3D On`.
- **Shared code changed:** `stage.js`, `voyage.js`, `worlds3d.js`, `boss-arena.js`, `foes.js`, `foebody.js`, `boss-models.js`, `verify-arena/bench/voyage/story.mjs` (Teeter added; opt-in lists), `eqdata.js` (appended).

---

## 9. Site rebuild (2026-11-16)

Branch `site/teeter`. This section is the spec the rebuilt site is audited against (`docs/plans/world-distinction-plan.md`
section 3) and, at its foot, the build record. It changes the 3D site only: no quest, stage, kit, bank entry, glossary,
story line, site id, quest id or label changes.

### 9.1 The place

**Teeter is a hillside of salt terraces: pans of brine stepping down a slope in five levels, each terrace held up by a
masonry wall, with one stair cut straight down the fall line and the works' rooms dug into the terrace walls under the
pans above them.** In the first ten seconds after landing a player stands on the top shelf by the spring house, looks west
down the hill over four terraces of flat brine to the valley floor, and sees the head of the stair dropping away at their
left; no bench is in sight.

### 9.2 Signature

| Landform | Walk shape | Bench housing | Light |
| :--- | :--- | :--- | :--- |
| A west-facing hillside cut into five level terraces 5.5 m apart, each a band of pans behind a masonry wall; the terraces fill the head of a side valley closed by spurs to the north and south | One straight stair down the fall line (four ramps through four walls, all on one line at the south edge), with a level dike branching north from its foot on every terrace; a comb, not a switchback | Rooms dug into the terrace walls under the pans: the wall is the room's front, a pan of brine is its roof; entered from the dike through a passage in the wall. Two of the eight are weir houses whose upper storey stands up among the pans above | Bright pale afternoon from the west-south-west, the brine glare, the sky's own evaporation shimmer; inside, the cover mask with the sun let in through each doorway's first metres and down one pump shaft |

Checked against section 6: no other row has terraces of pans (Tallow is a dead-flat pan, Brinewire a barrage wall);
the walk is not Ember Reach's switchback road (Teeter's descent is one straight line of ramps and its level walking is
on dead-end dikes off it), not Lodestone's single path bend after bend, not Cinder Halo's inward spiral, not Thornmere's
zigzag chain. The housing is not Cinder Halo's shielded cells (no dog-leg; the room's roof is a working pan with brine on
it), not Kettle's bays inside one building, not Lodestone's alcoves (closed on four sides, roofed by built masonry).
Drift from the row: the row says "weir houses and sluice chambers built into each terrace wall"; that is what is built,
two rooms to each of the four walls that stand above a dike. The row's walk ("down the dikes and stairs-as-ramps, top pan
to bottom") is kept; the dikes branch off the stair rather than zigzag, so the walk is not a second switchback.

### 9.3 Plan (x east, z south, metres; downhill is west)

- **Levels.** Terrace 0 (the top shelf) 22.0; terrace 1 16.5; terrace 2 11.0; terrace 3 5.5; terrace 4 (the drying
  floor) 0.0. Below the walk, decor terraces at -5.5 (the great pan), -11, -16.5 and the valley floor at -22.
- **Walls.** The downhill face of wall k stands at x = 40 (wall 1), 12 (wall 2), -16 (wall 3), -44 (wall 4), -66
  (wall 5, the drying floor's parapet), then -90, -114, -138 (decor). Each wall is 1 m thick and rises from the terrace
  below it to the bank of the pans above (5.6 m), or to a 0.9 m parapet where the walk is above it. Walls and pans run
  north and south to |z| = 128, where the spurs rise over them.
- **The walk** (all `lib/workings.js` volumes, closed on every side that is not a doorway):
  - the shelf (terrace 0): x 62 to 95, z -24 to 44, at 22.0; the pad at (80, 10), the spawn at (70, 30);
  - the stair: four ramps, each x F to F+22, z 34 to 38.4, rising 5.5 m over 22 m (1 in 4), cut down through the
    terrace above and through the wall, from the shelf to terrace 1, 1 to 2, 2 to 3, 3 to 4;
  - the dikes: terrace 1 x 34 to 40, z -10 to 40; terrace 2 x 6 to 12, z -22 to 40; terrace 3 x -22 to -16,
    z -10 to 40; each 6 m wide along the foot of the wall above it, a kerb on its west side over the pans;
  - the drying floor (terrace 4): x -65 to -44, z -34 to 40, the parapet over the great pan on its west.
- **Closed ground.** Every pan (0.35 m under its terrace, brine on it), the top of every wall, every roof, the hill
  east of the shelf and the spurs: no volume reaches them, and the workings' wall colliders close every volume side.
- **Route in bench order:** shelf, down ramp 1, north along terrace 1 to bench 1 (z 24) and bench 2 (z 1), back to
  the stair, down ramp 2, north to bench 3 (z 16) and bench 4 (z -11.5), back, down ramp 3 to bench 5 (z 24) and
  bench 6 (z 1.5), back, down ramp 4 onto the drying floor to bench 7 (z 12) and bench 8 (z -13.6).
- **The boss's ground.** The Tipper at (-55, 0, -24) at the drying floor's north end, the player's mark at
  (-55, 1.6, -8); the great pan lies below the parapet to its west.

### 9.4 Section along the route

Spawn 22.0 (shelf) - ramp 1 down to 16.5 - benches 1, 2 at 16.5 - ramp 2 to 11.0 - benches 3, 4 at 11.0 - ramp 3 to
5.5 - benches 5, 6 at 5.5 - ramp 4 to 0.0 - benches 7, 8 and the Tipper at 0.0. Bench ground spans 16.5 m on four levels.

### 9.5 The benches and their rooms

Every room is dug in east of its wall's face, entered through a 3.6 m passage in the wall (a lintel at 3.4 m), and lit
by its own pendant lamps; the cover mask takes the sun and 0.7 of the sky out of it, the sun reaching only the floor
inside the doorway. The plate stands 3 m from the back wall facing the door; the player stands with their back to the
door. No two rooms share a size, a roof or a fit-out.

1. **Running Both Ways (`q1-both`), the sluice chamber**, wall 1, 13.0 wide x 12.4 deep, a barrel vault running east
   and west (crown 4.7 m). A settled pan still exchanges brine both ways; this is the room where brine is let from the
   pan above to the pan below and back, so the culvert crosses the back wall behind the plate with a gate at each end on
   a handwheel. Closed on three sides and overhead (the pan); the dike outside the door. The player comes off the stair
   foot and the doorway is the first opening in the wall on their right, 10 m along.
2. **The Number That Holds (`q2-k`), the weigh house**, wall 1, 14.0 x 11.4, a weir house: its walls rise 1.2 m above
   terrace 0's pans and carry a gabled timber roof (ridge 7.6 m over the floor). A platform scale on its pit beside the
   plate, a steelyard on the back wall, sacks on pallets: the same ratio is weighed whatever the batch. Its roof is the
   one building a player on the shelf can see among the pans.
3. **Which Way It Goes (`q3-q`), the gauge chamber**, wall 2, 11.6 x 13.0, a flat roof on rolled steel beams at 4.6 m.
   A trough on a pivot over a catch basin with a graduated gauge post: which way the level runs before it settles.
4. **Combining K (`q4-properties`), the tally room**, wall 2, 13.0 x 12.0, timber joists on two timber girders at
   4.5 m. Walls of pigeonholes and a sorting table: the pans' numbers filed and combined.
5. **Equilibrium Concentrations (`q5-ice`), the ledger house**, wall 3, 12.4 x 11.4, a weir house with a monopitch roof
   rising to 7.2 m at the back. The clerk's sloped desk, a column board, record books: start, change, what is left.
6. **Le Chatelier's Principle (`q6-lean`), the pump chamber**, wall 3, 15.0 x 13.6, a slab roof at 4.6 m with a
   square shaft open to the sky behind the plate; the beam pump on terrace 2's pan above rocks over the shaft and its rod
   comes down it to the pump barrel in the room. Push the pan, it moves back: the one room with a working machine in it.
7. **Solubility Equilibria (`q7-dissolve`), the settling cistern**, wall 4, 13.6 x 12.2, a barrel vault running north
   and south (crown 4.7 m). A sunk settling tank behind the plate with crust on its walls, a cone-bottomed tank on legs,
   drums of reagent: how much salt a pan can hold.
8. **Free Energy and K (`q8-free`), the plotting room**, wall 4, 12.8 x 11.8, brick jack arches between steel beams at
   4.5 m. A gridded board on the back wall, a drafting table, a rack of rolled charts.

### 9.6 How it differs from each neighbour

- Tallow: one dead-flat white pan to the horizon; Teeter is a hill of stacked pans you walk down.
- Lanternfall: ice and a frozen lake at night; Teeter is brine under a bright sky, and you descend.
- Ligar: hills you walk round and mines you walk into; Teeter's levels are built terraces, the rooms are masonry under water.
- Bellows: decks over a cloud sea; Teeter stands on the ground, terraced.
- Ember Reach: a caldera wall with a switchback road; Teeter has one straight stair and level dikes, and no fire.
- Mirrowen: quays and hulls at sea level; Teeter is a hillside with no sea.
- Kettle: inside one building; Teeter is outdoors with rooms in its retaining walls.
- Verdigris: towers in a fogged swamp, short sightlines; Teeter sees across the whole hill and the valley.
- Brinewire: one long wall across a marsh, walked along its crest; Teeter has five walls stacked down a slope.
- Quicklight: refinery alleys under pipe racks in a storm; Teeter is open terraces in sun.
- Lodestone: a narrow canyon walked bend after bend; Teeter is a broad open slope walked straight down.
- Thornmere: mounds in a tar lake; Teeter's ground is level stone terraces and brine.
- Cinder Halo: craters and shielded cells behind dog-legs; Teeter's rooms open straight off a dike, under pans.

### 9.7 The far country

North: the terraces run on along the hill to the north spur, on which a graduation tower stands (a long timber frame
stacked with brushwood). East: the hill rises behind the spring house to a bare ridge, a white salt scar in the gully
above the spring. South: the south spur, with the brine main on trestles running down it to the valley. West: the
valley floor 22 m below the drying floor, a river channel, and a far range of hills on the horizon.

### 9.8 The numbers held

- `world-shape.mjs`: 8 of 8 housed, each R5 or better; bench ground 0.0 to 16.5 m (16.5 m) on 4 levels; no clones;
  not one circle, not two columns.
- Plates in view from the spawn: 0. From each bench's mark, no other plate.
- Every room at least 11.2 x 11 m inside with 4.4 m over the plate's floor.
- Budget at T4 (`perf-worlds.mjs`): at most 566 draws and 900k triangles; target under 300 draws and 400k triangles.

### 9.9 Kept, rebuilt, archived

- Kept: `teeter/atmosphere.js` (the sky; the sun is exported for the cover mask), `materials/teeter-textures.js`, the
  beam pump (`buildBeamPump`, moved into the new `plant.js`), `world-data/teeter.json`'s ids, labels and quest ids.
- Rebuilt: `teeter.js`, `teeter/terrain.js`, `teeter/stations.js`, `teeter/plant.js`, `teeter/host-plan.js`,
  `tools/gen-teeter-layout.mjs`, `tools/verify-teeter.mjs`; new `teeter/terrace-plan.js` (pure data).
- Archived to `archive/2026-11-16/site-teeter/`: the old versions of every rebuilt file, with a README.
- Shared: `learn/engine/boss-arena.js` (the Tipper's spot moves); no shared library changes planned.

### 9.10 Build record (2026-11-16)

Built on branch `site/teeter` in four commits after the spec. Nothing was looked at in a browser: every claim below is a
Node measurement; section 9.12 is what the owner should look at.

- **The plan** (`teeter/terrace-plan.js`, pure data on `lib/workings.js`): 25 volumes (the shelf, four ramps, three dikes,
  the drying floor, eight passages, eight rooms), 364 pans, the height field, the cover spec and the guide's route.
  The shared layers are used as they are; no shared code changed except `learn/engine/boss-arena.js` (the Tipper's spot).
- **The ground** (`teeter/terrain.js`): a grid to 900 m with a vertex row on every step line; a hole over every room and
  passage; masonry by material per 40 m square: terrace walls and the drying floor's parapet, kerbs, the stair's side
  walls, the shelf's bank, timber fences across the closed ends of the dikes, the pans' bunds, and each room's floor,
  walls and roof by its shell (`vaultX`, `gable`, `steel`, `joists`, `mono`, `shaft`, `vaultZ`, `jack`). The ground's
  colours mark clay dikes, crust, stair stone, hill rock and valley; a trodden way darkens the middle of the stair, each
  dike's line and the shelf from the pad to the stair head; the hill pales to a salt scar down the gully above the spring.
- **The hosts** (`teeter/stations.js`): as section 9.5, each furnishing three walls of its room; room 6's barrel is worked
  by the beam pump on the terrace above (`plant.js`), its rod stroking 0.06 to 0.96 m over the barrel's gland.
- **The plant** (`teeter/plant.js`): four beam pumps (three on piers in the pans away from the walk, one over room 6's
  shaft), the spring house and its lade, a bracket lamp on each side wall of each ramp, seven brine falls on the terrace
  walls away from the walk (a moving sheet each), three salt heaps and a barrow on the drying floor; the far country: a
  graduation tower on the north spur, the cistern house at the head of the gully east of the shelf, the brine main on
  trestles down the south spur, the river on the valley floor west.
- **Checks**: `tools/verify-teeter.mjs` rewritten (section 9.11). The first build's script is archived.

**Where the build parted from the spec:**
- Room 6's shaft was first declared behind the plate across the room's middle; that put it straight over the plate. It
  stands 4.6 m to the south of the plate instead (`shaft.side`), over the barrel at the side of the bay.
- The spec said the sun would come "down one pump shaft". With the sun 14 degrees up, light through a roof opening lands
  about 17 m to the side, outside the room. Every room, room 6 included, takes its sun through its door's first 2.5 m;
  the shaft lets in sky only. (The door light was also cut back from 4 m to 2.5 m so it reaches neither the lane nor
  the plate.)
- The spec targeted under 300 draws; the build costs 401 (inside the 566 budget). The masonry is the cost: eleven
  materials over 40 m squares.
- Phases 3 and 4 were built in one pass (one shared room-host pattern, eight different fit-outs) and committed together.
- The four beam pumps, the falls and the fences are additions the spec did not list; each belongs to a working
  (lifting brine, spilling pan to pan, closing a dike's end where the clay runs on level).
- Section 7 of the distinction plan asks for the standard to be re-read after world 3 against the owner's view of worlds
  1 to 3; the owner has seen none of them yet, so the standard is unchanged.

### 9.11 Measurements, before and after

`node tools/world-shape.mjs teeter ligar`

| | Benches | Ground under the benches | Relief | Housed | Per bench |
| :--- | :---: | :--- | :---: | :---: | :--- |
| Before | 8 | 0.00 to 0.00 | 0.34 m | 0/8 | -1 -1 -1 -1 -1 -2 -1 -1 |
| After | 8 | 0.00 to 16.50 | 22.00 m | 8/8 | R7 R8 R7 R7 R7 R7 R7 R7 |
| Ligar | 9 | -2.60 to 0.89 | 21.55 m | 7/9 | -2 R6 R4 R4 -2 R7 R6 R5 R7 |

No two worlds share bench coordinates (before, Teeter's benches stood on Verdigris's).

`node tools/perf-worlds.mjs teeter ligar`

| | Build ms | Objects | Draws | k tris | Materials | Casters | Caster k tris | Transparent |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Before | 137 | 599 | 390 | 184 | 56 | 189 | 22 | 54 |
| After | 332 | 519 | 401 | 263 | 57 | 222 | 29 | 17 |
| Ligar | 1119 | 752 | 566 | 867 | 200 | 198 | 455 | 64 |

`node tools/perf-bench-rest.mjs`: all eight Teeter benches come to rest untouched (684 of 689 stages over all worlds;
the five that do not are in other worlds and this branch changes no table code).

`verify:teeter` holds: 22,307 walkable cells, no ledge, every reachable cell inside a walk volume, none in a pan; every
approach, the pad and the arena reached; no overlaps; nothing buried; 8 of 8 housed R7 or R8; bench ground 16.5 m on
4 levels in walk order; no plate in view from the spawn, and from each bench's mark no other plate; one floor; at every
mark the sun and 0.7 of the sky taken away, the dikes and the shelf uncovered, sun on the floor inside every door; the
guide's way to every bench, on to the next and back up stays on the walk and within 12 m of a lamp; the Tipper's ground
open for 7 m, level, in view; the cover mask's GLSL compiles (`node tools/glsl-check.mjs teeter`).

Every other check run on this branch is green: `verify:bench`, `verify:arena`, `verify:voyage`, `verify:learn`,
`verify:table`, `verify:docs`, `verify:story`, `verify:normals`, and every world's own script (`tallow`, `lanternfall`,
`ligar`, `bellows`, `ember`, `mirrowen`, `kettle`, `verdigris`, `brinewire`, `quicklight`, `lodestone`, `thornmere`,
`cinderhalo`).

Archived: `archive/2026-11-16/site-teeter/` (the old `teeter.js`, `terrain.js`, `stations.js`, `plant.js`,
`host-plan.js`, generator, verify script and JSON), with a README.

### 9.12 The owner's viewing list

Nothing here has been seen. For each place: where to stand, what should be in view, and what would mean it failed.

1. **The landing** (spawn, the shelf at 22 m, facing west-south-west). The shelf's yard; to the left the head of the
   stair dropping away between two low walls; ahead, past a kerb, terrace 0's pans and then four terraces of brine
   stepping down to a broad floor and the valley beyond; to the right among the pans, the weigh house's gabled roof;
   behind the north fence, the spring house. *Failed if* any bench plate is visible, or the hill reads as one flat plate.
2. **The stair head** (the shelf's west edge at z 36, facing west). Ramp 1 running down 22 m between its side walls,
   through a gap in terrace wall 1, a bracket lamp on each side; the next three ramps in line below it. *Failed if* a
   side wall floats, a step shows at a ramp's foot, or the ramp looks like a cliff.
3. **First sight of bench 1** (the foot of ramp 1 on terrace 1, facing north). On the right the face of wall 1, 5.6 m
   of dressed stone, with a doorway 12 m along (room 1) and another 35 m along (room 2); on the left the kerb and the
   pans, then the edge. *Failed if* a doorway is hard to pick out of the wall.
4. **The sluice chamber** (at Bench 1's plate, facing the door). A barrel vault overhead; the culvert of brine high
   behind the plate with a gate on its handwheel at each end; a trough along the left wall, a hand pump by the door on
   the right; the floor sunlit only just inside the door. *Failed if* the room is as bright as outside on a phone, the
   vault shows gaps against the walls, or the sun lies across the plate.
5. **The weigh house** (Bench 2's plate, then from the shelf above). Inside: a tall timber roof on tie beams, the scale
   by the right wall, the steelyard hanging inside its rope rail on the left. From the shelf: the house's roof standing
   up out of the pans. *Failed if* the house's walls do not meet the pans.
6. **The pump chamber** (Bench 6's plate, then its pier on terrace 2). To the right of the plate the rod slides up and
   down a shaft open to the sky into the barrel; the brine main along the left wall. Above, on terrace 2, the beam pump
   rocks on a stone pier among the pans over the shaft's mouth. *Failed if* the rod and the barrel do not line up, or
   the rod leaves the shaft.
7. **The other rooms** (Benches 3, 4, 5, 7, 8, each at the plate). Each roof differs: rolled steel beams; timber joists
   on two girders; a monopitch house rising to the back; a vault running across the room; brick jack arches between
   steel beams. *Failed if* two rooms read as the same room.
8. **The highest ground** (the shelf's east bank, facing east). The hill rising behind the spring house, a white salt
   scar down the gully, the cistern house at the gully's head. *Failed if* the bank and the hill meet with a gap.
9. **The lowest ground** (the drying floor's parapet, facing west). The great pan 5.5 m below, the decor terraces
   stepping down to the valley floor, the river, a far range on the horizon. *Failed if* the terraces end in a cut edge.
10. **The Tipper's ground** (the player's mark on the drying floor, (-55, -8), facing north). Open level floor to the
    Tipper 16 m ahead, the parapet and the great pan on the left, wall 4's face on the right. *Failed if* anything
    stands in the way or the floor slopes.
11. **The terraces beyond the walk** (the north end of dike 2, facing north). The dike closed by a timber fence; the
    pans running on along the hill; a brine fall down wall 2 about 30 m off; the graduation tower on the north spur.
    *Failed if* the fall's sheet floats off the wall or does not move.
12. **South** (the foot of ramp 4, facing south). The brine main on its trestles coming down the south spur to the
    valley. *Failed if* it floats over or sinks into the spur.
