# Mirrowen (`unit06`) — spec and build record

World 6 of the Learn road. States of matter, intermolecular forces, solutions and the energy of phase changes
(AP Unit 3 in the 2024 CED, plus 6.5). Written before any code (2026-10-29) as the contract the build is audited
against; the "Build record" at the end says where the build differs.

Branch `world/unit06`. Nothing here is pushed.

## 0. Constraints that shaped the spec

- **Audience:** 12 to 17, phone, 375 px. No term before its card. Prompts at most 25 words.
- **Kits:** one new kit, `matter` (`table/kits/matter*.js`), that *extends the heat kit*: it re-uses the heat kit's
  cards, plaque, marker, selector, phase box, rail and cup, and adds six instruments (window, probe, vapour flask,
  curve, volumetric flask, strip). All readings come from one pure module, `engine/matterdata.js`.
- **Data first.** Every number a player sees is a row in `matterdata.js` with its source, or is computed from rows.
- **World:** Mirrowen has no ground in this build unless Phase 4 lands it; `PRODUCT.md` allows the Kettle route
  (the bench builds its own room) rather than blocking the quests on terrain. Recorded in the build record.

## 1. CED map

All topics are from the 2024 CED (Unit 3 *Properties of Substances and Mixtures*, Unit 6 topic 6.5).

| CED topic | Where | Notes |
| --- | --- | --- |
| 3.1 Intermolecular and interparticle forces (3.1.A.1 to .4) | `q2-grip` s1 (London dispersion), s2 (dipole–dipole), s3–s4 (hydrogen bonding, the click), s5 (ion–dipole), s6 (shape: pentane vs neopentane); `q3-boil` s6 (surface tension, viscosity) | 3.1.A.5 (biomolecules) is a bank problem in `q2` |
| 3.2 Properties of solids (3.2.A.1 to .7) | `q4-solids` (molecular, amorphous vs crystalline, four-way sealed sort, pick for a job); Ligar `q2-lattice` (ionic, metallic, network, alloys); `q3-boil` s7 (ice) | Ligar already teaches 3.2.A.3, .4, .6. `q4` is a 6-stage recap built on what Ligar does not cover |
| 3.3 Solids, liquids, gases (3.3.A.1 to .4) | `q1-states` all; `q4-solids` s4 (amorphous) | Phase diagrams are excluded from the exam; `q5` s6–s8 are labelled beyond the exam |
| 3.7 Solutions and mixtures (3.7.A.1, .2; M = n/L) | `q6-solution` s1 (solution vs heterogeneous), s2 (molarity, typed), s3 (dilution, typed) | |
| 3.8 Representations of solutions | `q6-solution` s1, s4 (a particle picture of a salt in water, counted) | Mass percent and colligative properties are excluded from the exam; `q6` s7 labelled beyond |
| 3.9 Separation of solutions and mixtures | `q7-separate` s1–s5 (chromatography, Rf, distillation, filtering) | s6–s7 colligative: beyond the exam, labelled |
| 3.10 Solubility (like dissolves like) | `q6-solution` s5 (a salt, an oil and a polar liquid in water and hexane) | |
| 6.5 Energy of phase changes (6.5.A.1, .2) | `q5-crossing` s1–s5 (heating curve, q = nΔH, condensation is the negative of vaporization) | Ember Reach `q2` s7–s8 already runs a one-way trip; `q5` adds the whole curve and the return trip |
| 6.1.A.4, 6.4.A.7 Dissolving as exo- or endothermic | `q6-solution` s6 (calorimeter cup reading ΔT) | |
| 6.4 (calorimetry) | used in `q5`, `q6` s6 | Ember Reach's cup, re-used |

**Logged gaps (with reason).** 3.1.A.5 and 3.2.A.7 (large biomolecules, polymers): a bank problem only, no bench; no honest tabletop
would show noncovalent folding without a protein viewer. 3.8 mass percent: past the exam, kept as one stage. Solubility versus
temperature (a curve): a bank problem.

## 2. Benches in teaching order

Eight modules: seven benches and the boss. The chart in `worlds/unit06-states-of-matter.js` currently holds four placeholder
quests with different ids; it is replaced by these.

| # | id | Title | CED | Stages | Instrument family | The one click (the wrong model) | BUILDS_ON |
| - | --- | --- | --- | -: | --- | --- | --- |
| 1 | `q1-states` | Three States | 3.3 | 8 | particle window + jars + molecule reader | "When ice melts or water boils, the bonds in the molecules break" | `unit04/q1-knocks`, `unit01/q4-ledger` |
| 2 | `q2-grip` | The Grip Between | 3.1 | 8 | pull-apart probe | "A heavier molecule always holds on harder" (water against hydrogen sulfide) | `q1-states`, `unit03/q7-polarity` |
| 3 | `q3-boil` | Liquids and Vapour | 3.1, 3.2 | 8 | vapour flask + manometer | "Water boils at 100 °C, always" | `q2-grip`, `unit04/q4-mixtures` |
| 4 | `q4-solids` | Kinds of Solid | 3.2, 3.3 | 6 | bench tester | "A solid is a solid: the same arrangement, just harder or softer" (glass is not a crystal) | `unit03/q2-lattice`, `q2-grip` |
| 5 | `q5-crossing` | The Crossing | 6.5 | 8 | heating curve | "Heat added always raises the temperature" | `unit05/q2-calorimetry`, `unit05/q3-enthalpy`, `q1-states` |
| 6 | `q6-solution` | Taken Into Solution | 3.7, 3.8, 3.10, 6.1, 6.4 | 8 | volumetric flask + window | "A dissolved solid is gone: the salt melted" | `unit01/q6-weigh`, `q2-grip`, `unit05/q2-calorimetry` |
| 7 | `q7-separate` | Pulling Apart | 3.9 | 7 | paper strip, still | "Filtering separates any mixture" | `q2-grip`, `q6-solution` |
| 8 | `boss-undertow` | The Undertow | 3.1, 3.3, 3.10, 6.5 | 5 | window, probe, flask, curve | – | all of the above |

Total: 53 stages in 8 modules. Stage counts: 8, 8, 8, 6, 8, 8, 7, 5 (the Wrong-model column is each bench's click).

### The story (the case against the Fifth)

Saga (`story/saga.js`): raiders have frozen the canal ice at ordinary temperature. Spoil family: **brine crawlers**. One thread through
the world: *what is the canal ice made of, and why does it stay solid when the water beside it does not?* Each bench produces one
measurement the next uses. The ice sample in the bench is labelled "CANAL ICE" only where the bench has a table row for it
(`matterdata.js` `CANAL`); nothing is claimed that a bench did not measure.

| Bench | Lead line (at most 20 words) | `Filed:` line |
| --- | --- | --- |
| q1 | Vess: "Is the canal ice a different substance from the water under it, or the same one held still?" | Melting the canal ice broke none of its molecules, so what holds it solid lies between molecules. |
| q2 | Vess: "Every molecule here holds its neighbours. I need to know how hard." | Water holds on harder than a molecule twice its weight, so the canal ice is held by more than size. |
| q3 | Vess: "The canal still hasn't boiled off. How does the water in it leave?" | The canal water leaves as vapour at any temperature, faster where the grip is weak and the air thin. |
| q4 | Vess: "The ice sheets shatter like glass. Is that what they are?" | The canal ice shatters like a molecular crystal and not like glass, so its molecules sit in an order. |
| q5 | Vess: "Ice does not warm while it melts. I want to know what that heat is doing." | The canal ice takes heat at one temperature until it melts, so it is one pure substance. |
| q6 | Vess: "Something was poured into the canal. I need to know how much, from what it left behind." | The canal water carries a dissolved salt, so the agent is in solution and not a second solid. |
| q7 | Vess: "Whatever was added has to come out again before the fleet can move." | The dissolved agent separates from the water by boiling it off, so the canal can be cleared. |
| boss | none (no lead line on a boss) | Filed with the Case File clue: the freezing agent was a synthetic fluid, made, not mined. |

(Wording is finalised in `engine/stage-story.js` and `story/quest-story.js`; each line is checked by `verify:story` for earned words.)

## 3. The stages

Common to all stage tables: **Prompt** at most 25 words, no "!", objective only; **Evidence** = what the bench holds that lets
someone who does not know the answer work it out; **Prints** = everything the bench prints and why none of it is the answer; **Wrong**
= the plausible mistakes and the message each gets; **Hints** = (control, look at, method) one sentence each; **Reward** = 1–3
sentences, about 45 words; **Form** = flat or 3D and why; **Ramp** for numeric stages (P picture, G guess, R proportional, F formula
as shorthand, N friendly numbers, T typed figure past the dial).

Formal tables were written per bench before each bench was built and are kept under each heading; where the table is short, the
reward sentence and hints live in the quest file and are the single source (this file does not duplicate copy).

### 3.1 `q1-states` — Three States (CED 3.3)

Instrument: the **window** (a sealed jar seen through a glass, its particles drawn from `matterdata.js` `particlesOf`) with a
**Squeeze** dial, a **Heater** dial and a **Pour** key (pour into the wide tank); the **molecule reader** names the molecule it
sees. Samples are jars A, B, C of water in three states (ice, water, steam), a fourth of the gases that water splits into, and a
sample of CO₂ for the second case. Flat or 3D: the window particles are small spheres at `3D On` (spatial), flat discs at `3D Off`.

| # | Objective (prompt) | Evidence on the bench | Prints (and why it is not the answer) | Wrong answers and message | Ramp / form |
| - | --- | --- | --- | --- | --- |
| 1 | Sort the three jars into trays by what the samples do when they are squeezed and poured. | Squeeze dial and Pour key per jar; a sample's response is shown in the window and in the tank | Jar letters only; tray names are the three behaviours, printed after the player has seen the behaviours | A gas in "keeps its shape": "Jar B spread across the whole tank." | Discover, 3 cases |
| 2 | Match each particle box to the jar it shows. | The jars' behaviours (stage 1 readings are kept on the jars) and three boxes drawn at the same scale and temperature | Boxes are not labelled with their state | A close, still box on the gas: "Jar C compressed to a third, and box 2 shows particles that cannot come closer." | Match to evidence, not to a printed fact |
| 3 | PREDICT: When ice melts and then boils, what happens to the molecules? | none (predict stage: three cards and a slot) | The three cards are the beliefs students hold: bonds in the molecule break and atoms drift; the molecules stay whole and move apart; the molecules shrink | – | Predict, the click |
| 4 | Heat jar A until it fills the tank, then sort the four jars by whether the reader names the same molecule as the ice. | Heater dial, the reader, jar D holds hydrogen and oxygen made from water | The reader prints the molecule it finds in the window, which is evidence, not the rule | A steam jar in "different": "The reader names H₂O in jar C, the same as the ice." | Discover; the quoted guess is contrasted on the reward |
| 5 | Pick what holds the ice's molecules to each other, out of the cards on the tray. | The window freezes the molecules in place at −10 °C and the heater frees them at 5 °C; the molecule is unchanged | Card names: "Bonds inside each molecule", "Pulls between molecules", "Gravity" | A bond card: "The reader still names H₂O after melting, so those bonds were not undone." | Earns **intermolecular forces** |
| 6 | Order the three jars from the most space between particles to the least. | Window, with a ruler line per box; each box holds the same number of particles in a different volume | Box volumes are drawn, not printed | Solid first: "Jar A has its particles touching." | Intuition for 3.3.A.3, .4 |
| 7 | Rank ice, water and steam by how much a jar of each weighs. | A balance with three equal jars | None; the readings are the evidence | Steam heaviest: "The steam jar weighs less than the water jar." | Density, counted; the click on "gas weighs nothing" is Bellows' |
| 8 | Sealed jars X, Y and Z: put each in the tray for its state. | Window, Squeeze, Pour; no labels | Letters only | Per jar, as stage 1 | Sealed sample |

Reward models: stage 4 (`reward.model: { type: 'gas'/'molecules' }` showing H₂O molecules whole as they move apart), stage 6 (three
boxes). Story scene `q1-states`: three beats (a solid's molecules in place, a liquid sliding, a gas apart) with the molecule
count drawn and the bonds counted, 0 broken.

### 3.2 `q2-grip` — The Grip Between (CED 3.1) — the vertical slice

Instrument: the **probe**: a slot for a sample card, a **Pull Apart** key, and a read-out of the heat needed to pull one mole of the
liquid's molecules apart from their neighbours, in kJ per mole (`matterdata.js` `GRIP`, the molar enthalpy of vaporization at the
boiling point, CRC Handbook). A sample card that has been in the probe keeps its reading (`props.grip`), as a tin keeps its rise, so
readings can be compared on a rail. The word *vaporization* is not yet earned: the probe's plate says "heat to pull one mole apart".

| # | Objective | Evidence | Prints | Wrong answers and messages | Hints (control / look / method) | Form |
| - | --- | --- | --- | --- | --- | --- |
| 1 | Order helium, argon and xenon by the heat their neighbours need to be pulled apart. | Probe + a rail; each card draws the atom's cloud to scale (van der Waals radius) | Atom symbol and a cloud only; the probe prints a reading once pulled | Reversed: "Helium needed 0.08 kJ for a mole and xenon needed 12.6." | Use the probe and the rail. / Compare each reading with how big the cloud on the card is. / Rank by the readings, bigger cloud against smaller. | flat |
| 2 | Pull argon and hydrogen chloride apart, and say which holds on harder. | Probe; two cards of about the same weight, one drawn with a dipole | Formula, molar mass | Argon harder: "Argon needed 6.4 kJ and hydrogen chloride 16.2." | probe / compare the two readings with the two masses on the cards / the one with the uneven charge has more | flat |
| 3 | PREDICT: Water weighs 18 g per mole and hydrogen sulfide 34. Which needs more heat to pull apart? | none | Three cards: "Hydrogen sulfide, because it is heavier", "Water", "About the same" | – | all three on the science | predict |
| 4 | Pull water, hydrogen sulfide, ammonia and phosphine apart and file each in the tray for the one it should be compared with. Rank the four. | Probe on four cards with masses | Formulas and masses | Water below hydrogen sulfide: "Water needed 40.7 kJ and hydrogen sulfide 18.7." | probe / compare each card's reading with its mass / the two lighter ones pair with the two heavier | flat |
| 5 | Pull a lithium, a sodium and a potassium ion out of water and put them in the order of how hard water holds each. | A second probe head, **Ion in water**, reads the heat given out when a gaseous ion is dropped in water (hydration enthalpy) | Symbols; ion radii drawn | Potassium first: "Lithium gave out 519 kJ and potassium 322." | probe / compare each reading with the size of the ion drawn / smaller ions hold water harder | flat |
| 6 | Pull n-pentane and neopentane apart, and say which has the longer contact. | Probe; both cards show their shape (line and ball) | Both formulas read C₅H₁₂ | Equal: "The two readings are 25.8 and 22.7 kJ." | probe / compare shape against reading / the more spread-out molecule touches its neighbours over more of its length | 3D molecules at `3D On` |
| 7 | A bond and a grip: pull one water molecule's O–H bond with the crank, then pull a mole of water apart with the probe; mark the larger. | Ember Reach's crank (O–H 463 kJ/mol) and the probe (40.7) side by side | Both readings are shown | "Grip larger": "Pulling the O–H bond took 463 kJ and the grip 40.7." | – | flat |
| 8 | Sealed: five samples X1 to X5; file each under the force that holds it (dispersion, dipole, hydrogen bond, ion–dipole). | Probe + the molecule shown on each card | Formulas only | Per sample: names the reading that disagrees | – | flat |

The *click* is stage 3 → 4: the prediction cards offer the belief students bring (heavier holds harder), which stage 1 has just
rewarded in the noble gases. Rewards: s1 **London dispersion forces, polarizability**; s2 **dipole–dipole forces**; s4 **hydrogen bonding**;
s5 **ion–dipole forces**; s6 *shape sets how much of one molecule touches its neighbours*; s7 *a grip is far weaker than a bond*.

### 3.3 `q3-boil` — Liquids and Vapour (CED 3.1, 3.2.A.1, 3.3)

# Mirrowen · `q3-boil` — Liquids and Vapour (CED 3.1, 3.2.A.1, 3.3)

Eight stages, one click ("water boils at 100 °C, always"), built on the matter kit's vapour part (`table/kits/matter-vapour.js`), data in
`engine/matterdata-vapour.js` (and `matterdata.js` `ANTOINE`, `vaporPressure`, `boilingPoint`, `LIQUID_PROPS`, `WATER_DENSITY`). Quest module
`quests/unit06/q3-boil.js`, verifier `tools/lib/mirrowen/q3-boil.mjs`, painter `ui/story-scenes-mirrowen-q3.js` (`boil-flask`).
BUILDS_ON: `unit06/q2-grip`, `unit04/q1-knocks` (pressure, kPa), `unit04/q4-mixtures` (gas over water), `unit03/q2-lattice`.
VOCABULARY: vapor pressure (s1), boiling point (s4), surface tension and viscosity (s6). The copy spells "vapor" (the CED's spelling);
the chart title keeps "Vapour".

## Instruments and pieces

| Kind | What it does | Reads |
| --- | --- | --- |
| `vapour` (flask) | A liquid card in a slot, a gauge that rises and levels off when "Settle" is pressed (a trace, or a plot of pressure against temperature built from the readings taken), dots above the liquid counted as P over T. Optional Heater dial (20 to 100 °C in tens) and Outside dial (sealed, 101, 65, 45 kPa). Boils (bubbles, "BOILS") when the Settle reading's pressure is at or above the Outside setting. | `vaporPressure(substance, T)`; T is the card's own temperature, else the Heater dial, else 25 °C |
| `surface` (plate) | "Test" lifts a ring off the liquid (the pull is the surface tension, mN/m) and times 5 mL through a narrow tube. A table keeps one row per liquid tested. | `LIQUID_PROPS`, densities (`matterdata-vapour.js`) |
| `cell` (equal boxes) | "Weigh" prints the mass of a 1 cm³ cube of ice or of water at 0 °C. | `WATER_DENSITY` |
| `jar` | A gas collected over water: printed gauge (101.3 kPa) and temperature (35 °C), molecules mixed (not counted by kind). Fixed. | the stage's own numbers |
| `liquid` card | Molecule glyph, name, a second line, and the pressure (or mass) it kept. | the flask / cell stamp |
| `pack` card | A box of molecules at one scale: an open lattice of 11 or a packed liquid of 12 (the ratio of the densities). | `PICTURE_COUNT` |

Reused: `probe` and `mol` cards (q2) in stage 5, the heat kit's `note` cards and `selector`. Flat only; no `dress3d` / `piece3d`, so `3D On`
shows the flat pictures on the plate with the default card slabs.

## The stages

| # | Prompt | Evidence on the bench | Prints (and why it is not the answer) | Ramp / form |
| - | --- | --- | --- | --- |
| 1 | Order ether, ethanol and water by the pressure the gauge settles at in a sealed flask. | Flask at 25 °C, three liquid cards on a rail | Each card prints its q2 grip (26.5, 38.6, 40.7 kJ). The pressures print only after Settle; the grip is a different quantity, so the order must be read from the flask. Earns **vapor pressure** | Picture; flat |
| 2 | Order the four samples by the pressure the gauge settles at. | Same flask; cards carry their own temperature (water 80 °C, ether 0 °C, ethanol 40 °C, acetone 25 °C) | The temperature on each card. Not the readings (17.8, 24.8, 30.7, 47.3 kPa). The strongest grip settles highest because it is hot | Proportional picture; flat |
| 3 | Where the outside air pressure is only 65 kPa, as on a high mountain, at what temperature will water boil? | None (predict stage): cards "It still boils at 100 °C", "It boils below 100 °C", "It boils above 100 °C" and a slot | The guess cards only | Guess (the click) |
| 4 | (Quotes the guess) Type the temperature at which water boils when the outside pressure is 65 kPa. | Flask with Heater (20 to 100 °C) and Outside dials, the plot of readings, an amber line at the outside pressure, bubbles at a step where the liquid boils | The plot axes and the outside value from the dial. No boiling point is printed. The answer (88.06 °C) lies between the 80 and 90 °C steps (flask 47.3 and 70.1 kPa) | Typed figure past the dial's steps, tolerance ±3 °C; earns **boiling point** |
| 5 | Order butane, n-pentane, acetone and water by boiling point. | The q2 probe (kJ per mole read per card), cards with masses and partial charges, a rail | Masses and partial charges. The probe reading is the grip, not the boiling point; the order follows from stages 1 to 4 | New case; flat |
| 6 | Which reading follows the grip across the three liquids: surface pull, pour time, both or neither? | Surface and pour plate (table of results), cards printing the grip, an answer dial | Grips on the cards. The two columns print after Test | Reading of two orders; earns **surface tension**, **viscosity** |
| 7 | File each picture box under the sample it shows. | Equal boxes (0.917 g, 1.000 g per cm³), two picture boxes of 11 and 12 molecules, trays Ice and Water at 0 °C | Box labels A and B; counts are drawn, not printed | Counted evidence; flat |
| 8 | Type the pressure of the gas alone in the jar, whose gauge reads 101.3 kPa. | Flask with Heater (20 to 50 °C) and plot; jar picture (35 °C) | Gauge and temperature of the jar. The water's pressure at 35 °C lies between the 30 and 40 °C steps (4.2 and 7.4 kPa on the cards of the flask) | Typed figure past the dial; ±0.4 kPa |

## Wrong answers, hints and rewards

1. Reversed rail → "ether sits left of ethanol, and the flask read 71.2 kPa for the one and 7.8 kPa for the other." Hints: Use the flask, its "Settle" key and the rail. / Compare what the gauge settled at for each card with the number printed on the card. / Rank the cards by the pressure each one settled at, from the lowest to the highest. Reward "Vapor Pressure": molecules leave and return; the gauge stops when the flows match; the weaker the grip, the higher it settles.
2. The 25 °C order (the click's cousin: strong grip means low pressure always) → "water sits left of ethanol, and the flask read 47.3 kPa for the one and 17.8 kPa for the other." Hints: flask and rail / compare the reading with the temperature on each card / rank by what the flask settled at, whatever the liquid. Reward "Heat Raises It".
3. Predict: no wrong answer; the guess is stored (`remember`) and quoted by stage 4. Hints: the cards and the slot / the last two stages / commit to the card you believe. Reward "Now Test It".
4. 100 → "At 100 °C the flask's pressure is 101.3 kPa, and the outside pressure is 65 kPa." Any wrong figure gets the same sentence with its own pressure. 80 or 85 (the middle of the bracket) are refused the same way; 86 to 90 pass. Hints: dials, "Settle" and the number field / compare the plotted line with the amber line and see which step the flask boils at / read where the line meets the amber line between two steps. Reward "Boiling Point" with a verdict line on the guess.
5. Rank by mass (water, acetone, butane, n-pentane) → "water sits left of acetone, and the probe read 40.7 kJ for the one and 29.1 kJ for the other." Hints: probe, key, rail / compare each reading with the mass and the + and − marks / rank by boiling point from the probe and what the flask showed. Reward "The Grip Sets the Boiling Point".
6. "Both" (or any wrong position) → the whole table read back: "water 72.8 mN/m and 10.0 s on grip 40.7 kJ; ethanol 22.3 mN/m and 15.2 s on grip 38.6 kJ; hexane 18.4 mN/m and 4.7 s on grip 28.9 kJ." Hints: plate, "Test", answer dial / compare each column with the grips on the cards / line up by grip, see which column keeps the order. Reward "Surface Tension and Viscosity" (ethanol grips less than water yet pours slower).
7. Boxes swapped → "Box B holds 11 molecules and box A holds 12, and box B sits in the "Water at 0 °C" tray." Hints: boxes and trays / compare the two masses and count molecules / the box with fewer molecules in the same space goes under the lighter sample. Reward "Why Ice Floats".
8. 101.3 → "The jar's gauge reads 101.3 kPa, and the gauge counts everything inside the jar." The 30 °C and 40 °C steps (97.1, 93.9), a sum (106.9) or the vapor alone get "The gas and the water vapor make up the gauge's 101.3 kPa between them, and … kPa of gas leaves a different share for the vapor than the plot shows at 35 °C." Hints: card, Heater, "Settle", number field / compare the jar's temperature with the steps either side / read the water's pressure between them, then work out what is left of the gauge. Reward "Gas Over Water".

Bank: `bench.q3-boil` has two problems and one worked problem (gas over water at 40 °C, five steps), plus three end problems (`q3-boil#0` to `#2`).

## What is weak

* Stage 1 and 2 are both ranks on one instrument. Stage 1 makes the discovery that every liquid has a plateau and prints the grips beside it, but
  it does not force the grip pattern: a student who notices the printed grips can rank without the flask. Stage 5 is where the pattern is needed.
* Stage 4 has nine heater steps and a plot built from the readings; a student who knows the bracket (80 to 90 °C) can type 88 without taking every
  reading. That is allowed (never block a correct answer). The "bubbles at this step" cue is a bracket, not a lamp to hunt for.
* Stage 6's surface and pour readings are model readings of CRC values (a ring without a correction factor, a tube whose water time is a convention of
  10.0 s); the Tour says what each does. Viscosity is not explained beyond "the grip is not all that sets it".
* Stage 7 asks for a match of two pictures to two samples. The lattice picture is drawn as an ordered network and the liquid as a packing, so a student
  who knows ice is ordered can match without weighing; the counts (11 and 12) and the masses agree with each other.
* Stage 8 is not a sealed sample of the whole bench. It does use stages 1 to 4 (the plot, the temperature rise) and Bellows' Dalton.
* The grip beside each liquid on the cards is the enthalpy of vaporization at that liquid's own boiling point, so "weaker grip, higher pressure at 25 °C" is
  a pattern among these three or four liquids, not a law (hexane and acetone would swap), and the reward says only what the bench measured.
* Nothing here was viewed in a browser or at `3D On`; the flat painters were run in Node against a stub context (no NaN, no exceptions) and laid out by
  `verify:table`.


### 3.4 `q4-solids` — Kinds of Solid (CED 3.2, 3.3.A.1)

# Mirrowen `q4-solids` — Kinds of Solid (CED 3.2, 3.3.A.1) — stage table

Six stages (a recap). Ligar's `unit03/q2-lattice` already teaches ionic, metallic and network solids, alloys, conduction and brittleness, so
this bench adds only **molecular solids** (the grips of `q2-grip`) and **crystalline against amorphous**, then uses all of it in two sealed
sorts. `BUILDS_ON`: `unit03/q2-lattice`, `unit06/q2-grip`. Vocabulary earned here: *molecular solid* (stage 1), *crystalline* and
*amorphous* (stage 3).

**The click.** "A solid is a solid: the same arrangement, only harder or softer." Stage 2 offers it as a card; stage 3 overturns it with
quartz and fused silica glass, which are the same atoms and give way differently.

**Instrument: the tester** (`kits/matter-tester.js`, fixture kind `solidtest`, piece kind `solid`). A slot for a sample card, a "Test" dial
(Melt, Strike, Current; a stage may offer one test, which has no dial and a key named for it) and a key. The panel shows the dial's test:
Melt, a trace of how rigid the sample stays from `T0` to `maxT` °C; Strike, one hammer blow and what is left; Current, two lamps (cold,
molten). A stage may swap the panel for a **window** that draws the particles of the sample (no dial, no key). A card keeps what each
test showed (`props.melt`, `strike`, `cur`), so readings can be compared in trays.
All figures: `engine/matterdata-tester.js` (sources and rounding in its header). Flat only: a trace, a hammer picture, two lamps and a
particle picture are flat things, and the window is a labelled cartoon, so `3D On` draws the same panel on the plate (no `dress3d`).

**Substitutions from the seeds.** Paraffin wax is a mixture and melts over 47 to 64 °C, which would blur the very click this bench is about
(a range means glass); **naphthalene** (CRC 80 °C, a pure molecular solid) stands in for it. Iodine sits in a sealed tester so it melts at
114 °C and does not sublime. The "job" stage is dropped: Ligar's `q2-lattice` stage 5 already picks a liner from tested properties.

## Stages

| # | Prompt | Evidence | Prints (and why it is not the answer) |
| - | --- | --- | --- |
| 1 | Sort the solids by whether melting each one only has to overcome grips between molecules. | Melt only, heater −40 to 200 °C; ice, iodine, naphthalene, salt, copper | Axis ticks and the trace; the card keeps `0 °C`, `114 °C`, `80 °C`, `> 200 °C`. No picture, no formula |
| 2 | (predict) Quartz and fused silica glass are both made only of silicon and oxygen: how will each give way as it is heated? | none (three cards and a slot) | Cards: both melt at one temperature (the held belief); quartz at one, glass gradually; glass holds longer |
| 3 | `You guessed …: heat each solid and file it by how it gives way.` | Melt only, 0 to 2000 °C; quartz, fused silica, salt, copper | The trace, the card (`1713 °C` against `1040–1585 °C`). Tray names state two observations, not the explanation |
| 4 | File each sample as crystalline or amorphous. | The window only, no heater; samples A to E: window glass, copper, fused silica, ice, quartz | The window's picture of the sample in the slot; letters, no names |
| 5 | Sort the four sealed solids into the tray for the kind of solid each is. | Melt, Strike, Current, 0 to 2000 °C; X1 quartz, X2 copper, X3 naphthalene, X4 salt | Traces, hammer pictures, lamps; letters only, no window |
| 6 | Sort the five sealed solids into the tray for the kind of solid each is. | As 5; X1 window glass, X2 iodine, X3 iron, X4 quartz, X5 potassium chloride | As 5. The glass matches the salt on the hammer and on both lamps; only the trace differs |

### Wrong answers and the message each gets (the reading the table shows, never the rule)

1. Salt in "Only grips between molecules": *Salt's trace stayed rigid to the top of the heater's range, 200 °C, and it sits in the "…" tray.* (An untested sample: *X has not been in the tester yet.*)
2. (A card in the slot passes; the guess is never graded.)
3. Fused silica in "Gives way at one temperature": *Fused silica's trace fell a little at a time from 1040 °C to 1585 °C, and it sits in the "…" tray.* The same for quartz: *stood flat to 1713 °C and fell at once*.
4. A crystal in "Amorphous": *The picture of sample B does not look like the picture of sample A, which is filed with it* (the mate is always of the other class; with none, *Look at the picture of sample B again beside the pictures of the other samples*).
5. and 6. X filed wrongly: *X1 showed 1713 °C, shatters, lamp cold: no, lamp molten: no, and it sits in the "Ionic" tray.* (the whole record the card kept).

`LEAKS` (`tools/lib/mirrowen/q4-solids.mjs`): no refusal may carry *amorphous, crystal, pattern, order, jumbled, glass* (3), *pattern, repeat, regular, rows, jumbled, glass* (4), *because, conduct, brittle, malleable, metal* (5 and 6).

### Hints (control / what to look at / method) and rewards

1. Use the tester, its "Heat" key and the two trays. / Compare how far up the heater's range each sample held its shape before it ran. / The weaker the hold between particles, the less heat it takes to loosen them, and the grips between molecules are weak holds. — *Molecular Solids*: whole molecules held by weak grips; melting moves them apart and leaves each whole.
2. Use the three cards and the slot. / Think about what the two solids share and what could still be different. / Commit to the way you expect each to give way as the temperature climbs. — *Now Test It* (the guess comes back in stage 3's prompt and reward).
3. Use the tester, its "Heat" key and the two trays. / Compare the shape of each trace as the temperature climbs. / Some samples lose their stiffness at a single temperature, and others a little at a time. — *Crystalline and Amorphous*.
4. Use the window: drag a sample into the slot, then into a tray. / Compare whether the particles of each sample sit in a pattern that repeats. / A pattern that repeats in every direction is crystalline, and particles with no repeating pattern are amorphous. — *Reading the Picture* (metals, molecules and quartz are crystalline; glass has no pattern).
5. Use the tester: drag a sample in, turn the "Test" dial, press "Test" for each test. / Compare the melt trace, the hammer result and the two lamps of each sample with the others. / Ask which solid lights the lamp cold, which only molten, which melts lowest and which holds out longest. — *Four Records*.
6. As 5. / Two solids can agree on most tests, so compare every reading of every sample. / A trace that falls at one temperature and a trace that falls over a range mean different things about the particles. — *The Whole Record*.

## What the data says

Melting points (CRC, rounded): ice 0, naphthalene 80, iodine 114, potassium chloride 770, sodium chloride 801, copper 1085, iron 1538, SiO₂
1713 °C. Glass has no melting point; the two ends given are the standard annealing and softening points: fused silica 1040 and 1585 °C
(Corning 7980), soda-lime window glass 510 and 700 °C (Corning 0080). The trace between the two ends is a smoothstep: **a model**, not a
measurement (the plate shows only the shape). Hammer outcomes and the two lamps are the textbook behaviour of each solid; molten
soda-lime glass lights the lamp because its sodium ions move.

## Form, flat or 3D

Flat. A trace, a hammer picture, two lamps and a particle picture are flat things, and `3D Off` draws the same plate. The window is a 2D
cartoon (a silicon with three bonds, an oxygen at the middle of each bond, so the network is a plane picture of SiO₂). The amorphous
networks are the same number of silicons scattered at random, each joined to its nearest neighbours up to three, with arms at least 70°
apart; the crystal is a honeycomb. Both come from seeded functions, so a picture never changes between visits.

## Story

Lead (stage 1): *The ice sheets shatter like glass, and Vess wants to know whether that is what they are.* The animation (`solid-order`):
iodine heats in a lattice and its molecules loosen and stay whole (a count of whole molecules, from the drawn pairs); quartz and fused
silica are heated together and each draws its own trace from `stiffness`; the angles at every silicon are counted from the drawn picture
(one angle in the crystal, many in the glass). Filed: *ice melts at one temperature where glass softens over a range, so the ice sheets
are crystals and not glass.* (The bench's ice melted at 0 °C in stage 1; the claim about the sheets is Vess's inference.)

## What is weak (honest)

- Stage 1 is nearly a lookup once the player has heated the five samples: the answer is "melted low or not". It is the on-ramp that teaches
  the tester and earns *molecular solid*, and it is not trying to be deep.
- Stage 4 reads a picture. It is the CED's own objective (represent the difference), but the picture is the answer once it is seen; the
  discovery is in stage 3 and stage 6.
- The stage 3 traces for glass are a model between two real fixed points (see above). A glass trace is not a measured heating curve.
- Quartz is shown melting at 1713 °C without following its changes of crystal form on the way up (stated in the data header).
- Stages 5 and 6 reuse quartz; there is no second network solid the tester can honestly melt (diamond graphitises, silicon carbide
  sublimes, silicon is a semiconductor).
- The bench tables are full, so only the prediction carries a printed how-to line; the tester's own plate and its Tour step say how it works.
- Not looked at by eye: the window pictures were plotted flat in Node (`matterdata-tester.js`) and judged there, not at `3D On` on the table.


### 3.5 `q5-crossing` — The Crossing (CED 6.5)

# `q5-crossing` — The Crossing (Mirrowen bench 5, CED 6.5)

Files: `src/learn/quests/unit06/q5-crossing.js`, `src/learn/table/kits/matter-curve.js`, `src/learn/engine/matterdata-curve.js`,
`src/ui/story-scenes-mirrowen-q5.js`, `tools/lib/mirrowen/q5-crossing.mjs`. Eight stages (the chart says 8). BUILDS_ON `unit05/q2-calorimetry`,
`unit05/q3-enthalpy`, `unit06/q2-grip`. The one click: **heat added always raises the temperature.**

## The instruments (all flat; the picture is complete at `3D Off`, and `3D On` paints the same plate under real knobs)

- **Heat recorder** (`heatcurve`, 98 x 49 units, plot 54 x 22.4). A cup (or, from stage 3, a window of twelve molecules), a thermometer column, and a pen.
  The "Heat per press" dial sets a fixed heat (kJ, negative to cool) and the key adds it. The pen draws the whole line from the old total to the new
  one (`traceOf`), flats included, so a coarse dial never hides a corner. The running total is the last row the recorder took; no new state.
- **Cooler** (`cooler`): a slot for a sample card; one press cools it to 37 °C, draws the way down and stamps `gave` (kJ) on the card, as the q2 probe does.
- **Phase map** (`phasemap`, beyond the exam): a "Pressure" dial of six settings and a key that warms ice from −40 to 400 °C at that pressure; draws the line
  coloured by state and a square at each change; the list on the left names the states of the last sweep. Nothing is drawn but what sweeps found.
- Piece `hsamp`: a 20 x 14 sample card (name, mass, "gave x kJ" once cooled).

Data: `matterdata-curve.js`. One planner, `planThermal`, runs both directions along a single line of heat (`heatOf`/`stateAt`), agrees with `planHeating`
(held in the verifier at ten heats), and `heatBetween` gives the signed total. Phase diagram: IAPWS-IF97 saturation, IAPWS R14-08 sublimation and ice-Ih melting
(held to CRC/IAPWS values: 3.169 kPa at 25 °C, 101.42 kPa at 100 °C, 1.5549 MPa at 200 °C, 8.588 MPa at 300 °C, 0.260 kPa sublimation at −10 °C, ice melts
near 110 MPa at −10 °C).

## Stages

Hint rungs are control / what to look at / method in the quest file (single source). Ramp: P picture, G guess, R proportional, F formula, N friendly, T typed.

| # | Prompt (objective) | Evidence on the bench | Prints, and why it is not the answer | Wrong answers and messages | Reward / ramp |
| - | --- | --- | --- | --- | --- |
| 1 | Warm the ice until its temperature stands still, then set the marker at the heat where it rises again. | Recorder (cup, no window), Heat dial, marker whose line crosses the plot | Axes, the running heat and temperature. The end of the level stretch (6.76 kJ) is not printed anywhere; it is read where the pen turns. Marker starts at 0. | Marker inside the level stretch: "At 1 kJ the line there is level." Pen not drawn far enough: "The pen has drawn to x kJ, and the line has not yet stood still and climbed again." | *The Heating Curve* (heating curve). P |
| 2 | PREDICT: The temperature stood still while the ice took in heat: where did that heat go? | Three cards and a slot, no instrument | Cards: leaks into the room / works against the pull between the molecules / warms the cup and the air. Never graded | – | *Now Test It*. G |
| 3 | You guessed (x): heat the ice until the window shows all twelve molecules flying free. | Same recorder plus the window of twelve molecules, up to 70 kJ | The window shows molecules, never a word for the state; streak lengths follow the temperature only, so they do not change on a level stretch | Stopping early: "At 8.0 kJ the window shows 0 of the twelve molecules flying free." | *Heat Against the Pull*, quotes the guess. R |
| 4 | Type the heat needed to melt 36.0 g of ice at 0 °C, in kilojoules. | A cup of 18.0 g at 0 °C with window, dial 1/2/4 kJ, plot to 10 kJ; plate "1 mol of water is 18.0 g" | The cup's own line shows 6.0 kJ for its 18.0 g; no ΔH is printed | 6.0 (one cup): "6.0 kJ melts about 18.0 g of ice at the rate the cup showed, not 36.0 g." Any other figure gets the same sentence with its own mass | *Heat of Fusion* (heat of fusion). F, N |
| 5 | Type the heat needed to take 18.0 g of ice at −10 °C to steam at 110 °C, in kilojoules. | Recorder to 70 kJ, window, no running total; plate of the three c values, two ΔH values, molar mass | The plate is constants only; the total is neither printed nor reachable by pressing (dial 4/12/40 kJ cannot land on 54.9) | 48.9 (no melting): "48.9 kJ would leave the 18.0 g boiling at 100 °C with 86% of it turned to steam." Every wrong figure says where it leaves the sample | *Heat of Vaporization*. T |
| 6 | Type the heat change when 18.0 g of steam at 110 °C is cooled to ice at −10 °C, in kilojoules. | Recorder in cooling (dial −4/−12/−40, key "Cool"), plot with heat added below zero, no total, no plate | The mirrored line; nothing is printed about sign | +54.9: "That figure puts heat into the sample, and the pen for this sample runs to the left of zero." Other wrong figures say where they leave the sample | *Condensing and Freezing* (condensation, freezing). T |
| 7 | Order the four samples by the heat each gives a hand as it cools to body temperature. | Cooler, four 1.00 g cards (water 60 °C, water 100 °C, steam 100 °C, steam 120 °C), a rail; each card keeps what it gave | Card names and mass; readings only after the cooler | Steam left of water: "Steam 100 °C sits left of Water 100 °C, and the cooler read 2.52 kJ for the one and 0.26 kJ for the other." | *Why Steam Burns*. New case |
| 8 | Beyond the exam: find a pressure at which warming ice never makes liquid water. | Phase map, six pressures (0.1 kPa to 100 MPa), plate "Phase diagrams are not on the AP exam." | Axes only; lines appear as sweeps are run | 101 kPa: "At 101 kPa the ice melted to liquid water before it went further." | *Phase Diagrams* (phase diagram, triple point, critical point). Beyond the exam |

Sweeps at 30 MPa and 100 MPa also show the melting point falling below 0 °C and no boiling; the card names the triple and critical points.

## Honest weaknesses

- Stage 3 repeats the flat stretch of stage 1 on purpose (that is what a test is), but its task, "heat until all twelve molecules fly free", is nearly a
  goal state; the learning is in watching the window. The molecules in the window are twelve, so shares are to the nearest twelfth (stated in the data header).
- Stages 4, 5 and 6 are typed figures behind a picture, but a player who knows q = n ΔH can skip the picture. Stage 4's constant is measured off the cup; stage 5
  prints its constants on a plate (the instrument cannot read 40.65 to the accuracy needed).
- Stage 8 folds three phase-diagram ideas of the old plan (read a phase, triple and critical points, why the melting line leans back) into one experiment.
  The lean back is in the data (`meltingAt`) and on the plot only as a few pixels; it is not stated on a card. Stage 7's burn is a rank by the cooler's
  readings, so it is read off; the near tie of steam at 100 and 120 °C is the thing to think about.
- Pressure dial positions are six; two are right (0.1 and 0.3 kPa). It is a small search, not a hunt for a green lamp.
- Stage 1's marker is read off a plot (with a cursor line); it is the only stage that grades a plot reading.


### 3.6 `q6-solution` — Taken Into Solution (CED 3.7, 3.8, 3.10, 6.1, 6.4)

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


### 3.7 `q7-separate` — Pulling Apart (CED 3.9)

# Mirrowen `q7-separate` — Pulling Apart (CED 3.9): stage table

Seven stages, one click. **The click:** "filtering separates any mixture". Stage 1 predicts what salty water leaves in the cup; stage 2 tests it
with a filter, a cup and a dried drop of the cup; stages 3 to 7 are the three other ways round it. Files: `quests/unit06/q7-separate.js`,
`table/kits/matter-strip.js` (five instruments, one card), `engine/matterdata-strip.js`, `ui/story-scenes-mirrowen-q7.js`,
`tools/lib/mirrowen/q7-separate.mjs`.

Changes from the spec table in `mirrowen-world.md` section 3.7: the spec's s1 (count the components) is folded into s3 (running the ink is the
count; the typed Rf needs the picture); s3 (swap solvent) became a rank and gained the strip's three-lane comparison; the predict+test pair on the
click is new (stages 1 and 2) and takes the filter/evaporate decision with it; s6 (colligative) and s7 (plan) are kept. The chart says 7, so
7 it stays.

## Instruments (all pure readers of `matterdata-strip.js`)

| Fixture | What the player does | What is drawn | Planner |
| --- | --- | --- | --- |
| `strip` | Ink card into the slot; a Solvent dial (stages with more than one liquid); "Run Strip" | Paper per liquid, a drawn ruler in cm (millimetre ticks when the picture is big enough, else half centimetres), the wet edge, spots; "A SIMULATION" | `spotCm`, `rfOf` over `retention()` (a model) |
| `filter` | Mixture card into the slot; "Pour Through" | Funnel with grains caught on the paper, the cup, a slide with a dried drop of the cup | `pourThrough` (grain size against the paper's 11 µm pore) |
| `still` | "Collect Cut" three times (a hidden dial counts the cuts) | A flask whose level falls by a third per cut, a column of three steps, three vials of ten counted cells, the temperature at the top for each cut; "SIMPLE MODEL" | `stillCuts` (Raoult's law, Antoine fits, three-step column, Rayleigh batch) |
| `boiler` | Card into the slot; an Amount dial (0.50, 1.00, 2.00 mol in 1.00 kg); "Boil" | A pot, a thermometer 99.5 to 103.5 °C with a mark where water alone boils; "IDEAL SOLUTION" | `boilingRise` (i K_b m) |
| `plan` | Nothing to press; reads the steps on the rail | Where sand, salt and water end: on the paper, in the flask, in the receiver | `planSeparation` |

What a run leaves is written on the card (`ran`, `poured`, `boiled`) or in a hidden dial, so a table is plain data. The strip is a simulation
and prints that; the still prints that it is a simple model (ideal mixture, three steps); stage 6 prints that it is beyond the exam.

## Stages

| # | Prompt | Evidence on the bench | Everything printed, and why it is not the answer | Wrong answers and the message each gets | Hints (control / look at / method) | Reward | Form and ramp |
| - | --- | --- | --- | --- | --- | --- | --- |
| 1 PREDICT | Salty water is poured through filter paper into a clean cup. What does the cup hold afterwards? | None (three cards and a slot; no instrument) | The three beliefs students hold: "Clean water, with the salt left on the paper", "Salty water, as it went in", "Water that is less salty than before" | None: never graded; the slot must not be empty ("Lay a card in the slot.") | the cards and slot / what the paper holds back and where the salt is / commit even if unsure | "Now Test It" | Predict, the click |
| 2 | (quotes the guess) File each mixture under the method that separates its solid from the water. | Filter with four cards (sand, sawdust, salt, red dye, each "in water"); a card keeps "paper: grains/clean" and "cup drop: crust/stain/clean" after a pour | Card names only; two trays "Filter it" and "Boil the water off" (acceptable: the evidence is discovered on the card before a tray is chosen); the filter prints nothing it did not do | Salt filed under "Filter it": "Salt sits in the 'Filter it' tray, and the paper held nothing while the drop of the cup dried to a crust." An unpoured card: "X has not been poured through the filter yet." | filter and its key, then a tray / what the paper holds and what the dried drop shows / filter when the paper takes the solid, boil when it stays in the cup | "The Filtrate": the filtrate carries a dissolved solid | Flat. Discover, 4 cases, 2 of them fail the click. The salt cup looks as clear as water; only the dried drop shows the crust |
| 3 | Type how far the red spot travelled as a fraction of how far the liquid travelled. | Strip in water, ink card, a ruler; front at 10.0 cm (friendly) | A ruler and "A SIMULATION"; nothing prints a distance. The typed figure is read off the ruler and divided | "5.1" (the distance): "5.1 is longer than the whole climb of the wet edge on the ruler." Above or below the red spot: "... puts the red spot farther from / nearer the start line than the ruler shows." Not run: "The strip has not been run yet." Accepts 0.51 +/- 0.03 (a half-division of the ruler) | strip, key, field / read the spot and the wet edge on the ruler from the start line / divide the spot's distance by the front's | "Chromatography": solvent front, retention factor (Rf); the ink held three dyes | Flat. Ramp: picture (a ruler), friendly numbers (front 10.0 cm), typed. The figure past the strip is stage 6 and the bank's worked problem (front 15.0 cm) |
| 4 | Order the three dyes by how far each travelled in hexane and acetone. | Strip with three lanes and a Solvent dial; the ink arrives already run in water so the comparison is on the paper | Lane headers WATER, ETHANOL, HEXANE; coloured spots; no numbers | The water order: "Yellow sits left of Red on the rail, but on the hexane and acetone strip the yellow spot stands higher than the red one." Not run: "The ink has not run in hexane and acetone yet." | Solvent dial, "Run Strip", rail / compare each spot with where it ended in water / rank by travel, nearest the start first | "Reading Polarity": the order turns round; polar dyes lead in a polar liquid | Flat. The second belief (the liquid carries every dye alike, or in one order) is met here and reversed; no second prediction, to keep one decision per stage |
| 5 | Order acetone, ethanol and water by when each comes over into the receiver. | Still; three cuts; each vial ten counted cells in the liquids' colours, with the top-of-column temperature; molecule cards for the three liquids | A legend (swatch and name) and "SIMPLE MODEL". No boiling points anywhere on the table | Rail wrong: "Water sits left of ethanol, but the vial richest in water is vial 3 and the one richest in ethanol is vial 2." Not all collected: "The receiver holds 1 of 3 vials so far." | "Collect Cut" then the rail / what each vial holds and the temperature at the top / rank each liquid by the vial that holds most of it | "Distillation": the least tightly held leaves first; vials richer, never pure | Flat. The cuts are honest: the best vial is 83 to 90 % of one liquid, never pure |
| 6 BEYOND THE EXAM | Type how many degrees hotter than water alone boils with 3.00 mol of calcium chloride, CaCl₂, dissolved in 2.00 kg of water. | Boiling flask; sugar, NaCl and CaCl₂ cards with their particles drawn; the dial gives 0.50, 1.00, 2.00 mol per 1.00 kg, so 3.00 mol in 2.00 kg (1.50 mol/kg) lies between two steps | The mark for water alone (100.0 °C); the thermometer prints the boiling point reached (the rise is the player's subtraction); "IDEAL SOLUTION" | 1.54 (NaCl's count): "1.54 °C is what the bench reads for another card at this amount, not for CaCl₂." 4.61 (kilograms ignored): "4.61 °C is the rise for 3.00 mol in 1.00 kg, and the pot holds 2.00 kg." Accepts 2.30 +/- 0.05 | card, dial, key, field / compare sugar and salt at the same amount and count the particles drawn / moles per kilogram, particles per formula unit, scale | "Boiling Point Elevation": i K_b m, colligative property; says it is beyond the exam | Flat. Ramp: picture of particles, proportional readings, then a typed figure between the dial's steps (the reading for 1.50 mol/kg is not on the dial) |
| 7 | Lay steps on the row until the sand, the salt and the water each end up alone. | Plan board and three step cards (filter, boil the water off, run a paper strip: the strip is a decoy) | The board prints where each part ends for the steps on the rail; it prints no plan | Boil then filter: "The flask holds sand and salt together." Filter alone: "The flask holds salt and water together." A wasted step: "The 'Run a paper strip' step changed nothing: the board is the same with it as without it." | cards onto the row / any place that holds more than one part, and any step that changes nothing / which step stops working once the water has gone | "Choosing a Method" | Flat. Sealed: the bench's ideas at once. Weak: only two steps are needed, so a student can solve it by trial against the board |

## Honest simplifications and what is weak

- The strip is a model (`retention()`); its values are design values, checked in the verifier against 0.26/0.51/0.74, 0.74/0.89/0.39 and 0.95/0.56/0.09 and
  against the one property a polarity model must have (the order reverses). The bench says "A SIMULATION".
- The still treats ethanol-water and acetone-water as ideal (they are not; ethanol-water cannot be pushed past about 96 % ethanol). Three steps of a column
  give vials of 83 to 90 % of the leading liquid; the reward says "never pure". Acetone's Antoine fit is taken a little past 80 °C.
- The boiling flask uses ideal i (real NaCl gives about 1.8 to 1.9). Labelled "IDEAL SOLUTION".
- Stage 7 is a two-step plan with a decoy; dissolving the salt back, dyes, or a third method would make it richer.
- The ruler's millimetre ticks are drawn only when the picture is large enough; on a phone the reading is to half a centimetre (the tolerance, 0.03, allows it).
- No reward models, no `dress3d`/`piece3d`: the flat picture is complete (3D Off draws the same). Every drag is a card into a slot, tray or rail, so the two-tap
  twin comes free.
- `q6-solution` words (dissolved is used as plain English; the ion picture on the solute cards is the only link) are not relied on.


### 3.8 `boss-undertow` — The Undertow (five phases, new cases of earlier ideas)

Brine crawler foe from the window planner (`planFoe`), mapped one to one onto the stage's samples. Phases: (1) five jars sorted
by state (`q1`); (2) five liquids ranked by grip (`q2`); (3) boiling point at a new pressure (`q3`); (4) heat to take an ice sample
through a phase change (`q5`); (5) a dilution plus a miscibility check (`q6`).

## 4. Kit plan

Pieces (all in `matter.js`, cards inherited from the heat kit unless noted):

- `mol` — a molecule or ion card (symbol, formula), a ball-and-stick glyph at `3D On`, flat at `3D Off`. Keeps `props.grip` once pulled.
- `jar` — a sealed sample in a state, T and V (samples A, B, C); carries `props.squeezed`, `props.poured`.
- `salt`, `dye`, `spot` as needed (cards re-used from `note`/`tag`/`chip`).
- from the heat kit: `phase`, `block`, `charge`, `stmt`, `note`, `tag`, `num`, `chip`, `shift`, `eqn`.

Fixtures (all in `matter-draw.js`, readings in `matter-read.js`, each reading calls a function of `matterdata.js`):

| Fixture | Reads | Planner (pure) |
| --- | --- | --- |
| `window` | particles of the sample in its slot, with Squeeze and Heater dials, a molecule reader | `particlesOf(substance, state, T, V)`; `readerOf(jar)` |
| `probe` | heat to pull a mole apart; ion hydration heat | `gripOf(substance)`, `hydrationOf(ion)` |
| `vapour` | gauge (kPa), boiling point at the Outside pressure | `vaporPressure(substance, T)`, `boilingPoint(substance, P)` |
| `curve` | temperature against heat added | `planHeating(m, T0, q)`, `heatToReach(m, T0, T1)` |
| `flask` | molarity, dilution, ions in the window | `molarity(g, M, L)`, `dilute(C1, V1, V2)`, `ionsPerFormula(f)` |
| `strip` | spot travel, solvent front, Rf | `spotTravel(dye, solvent, t)` |

Tour: `matter-tour.js` registers `matter:window|probe|vapour|curve|flask|strip` and the new piece kinds `mol`, `jar`. Words: only
what the bench has earned, no `grip` before `q2` s1's card, no `vapour` before `q3`'s card.

Real data (sources): CRC Handbook of Chemistry and Physics, *Enthalpy of Vaporization*, *Vapor Pressure of Water 0 to 370 °C*,
*Antoine* constants from NIST WebBook; *Hydration enthalpy of gaseous ions* from Marcus, *Ion Properties* (1997); van der Waals radii
from Bondi 1964; surface tension from CRC. No number is invented. Where a value is rounded the rounding is stated in the data row.

## 5. World plan

- **Site.** A tidal shelf (saga: waterways, canals, crystal ice walls). Seven hosts on a ring of quays beside a canal: 1 ice-breaker's
  chart house, 2 a tank farm bay, 3 pumping station, 4 ice-cutting yard, 5 harbour boiler house, 6 dosing station, 7 distillery. Boss
  arena on the open quay. Generator `tools/gen-mirrowen-layout.mjs` → `src/three/world-data/mirrowen.json`; host builders
  `src/three/mirrowen/`; verify `tools/verify-mirrowen.mjs` (overlap, buried bodies, walkability, lamps only, bay clearance, the
  arena's ground).
- **Fallback if time runs out:** the benches build their own room (as Kettle's) and `worlds3d.js` has no `unit06` entry; recorded in
  the build record. The quests and the checks do not depend on the walkable world.

## 6. Pitfall review (`PRODUCT.md` §5 and §4)

| Row | Verdict |
| --- | --- |
| Plate prints the answer | Avoided: the probe prints a reading only after "Pull Apart"; a plaque prints only constants the stage gives on purpose (M for a moles stage, never ΔH of the answer). Every plate is read against its answer in the audit |
| Refusal states the rule | Avoided: misses name the readings the table holds ("Water needed 40.7 kJ") and never "because water hydrogen bonds" |
| Miss gives the reasoning | Avoided as above; `verify:learn` greps for the answer string, and I read each |
| Tray or rail names state answers | Rails say "Needs least heat / Needs most heat". Trays on `q1` s1 are the behaviours, shown after the behaviours are seen |
| Term used before taught | `VOCABULARY` + `BUILDS_ON` + `WITHHELD_VOCAB` (`vapor pressure`, `hydrogen bond`, `molarity`, `dilution`, `Rf`, `chromatography`, `miscible`, `heating curve`, `fusion`, `vaporization`) |
| Model offered is not the one held | Each predict stage offers the belief students hold (heavier holds harder; bonds break on boiling; water boils at 100 °C) |
| Stages repeat | Each stage has its own idea (table); `q4` is cut to 6 because Ligar holds the rest |
| Story does not touch the bench | One thread (§2), lead line per bench, `Filed:` from the bench's own reading |
| Crowded rows cause joins | Pieces laid on a grid at least 60 units apart on pairable surfaces; only `block` joins (inherited), the new pieces are `nojoin` |
| Dropped tool never joins a card | The new kit has no tool that must join; `block` keeps heat's rule |
| Missed grab throws camera | Engine rule; verified by `verify:bench` at six aspects and by hand |
| Drop beside a slot strands a piece | Engine rule (`gestures.js`); slots are sized as the cup's (20 × 14) |
| Dials | Hit bands from `dial.js`; dial step 1; every dial has at least 3 positions; played by hand |
| Tool vanishes | The only loose tool is the sample card; it has a body |
| Needed control not mentioned | Tour words and fixture notes for every dial and key |
| Control reacts late | Probe and window update the same frame as the dial |
| Tiny text | Painted words at `LABEL.min`; plots 36 × 22 units or larger; checked at 375 px |
| Black pane | The overlay holds until the table is built (engine) |
| `c.label` metres | All 3D labels use fixture sizes through `toPlate` |
| Opaque slab over display | Window and flask glazing are frames, with the picture beneath; checked in the audit |
| Glass bodies lean over text | Nothing is painted within 7 units behind a flask or window glass |
| Lining plate hides contents | No lining under the particle trays; `liningMat` omitted |
| Pour leaves no trace | Fills at least 0.018 m |
| Lens kept old picture | No lens |
| Painted words under hardware | Dial names start 3.6 units in at pitch 7; rail `labelLift` used |
| Fonts | Sans symbols for element letters; true minus; H₂O written with subscripts in a sans face |
| Drawn contents off the puck | Molecule glyphs are inside the card; ion charges drawn inside |
| Heaps cover gauges | Gauges at y 29 to 31 |
| Plots too small | Heating curve is 60 × 30 units, strip 40 × 30 |
| Generic ball faces | Atoms named by symbol and colour (CPK); no "X" |
| Option object drops keys | Checked per option with a test in `verify:mirrowen` |
| Disposal recursion | The kit has no custom disposal |
| Stage counts in five places | One constants block in `verify-mirrowen.mjs` plus the chart, the quests, PRODUCT.md, the field manual |
| Bank moved | Ids `q1-states#b1` etc. never reused |
| Selector blanks | `selectorFixture` gets a trailing blank option |
| Shared change breaks worlds | The kit is new; the only shared edits are registration lists and opt-in; every world script is run after each |
| Full verify wipes `dist/` | Not run; `dist/` copied if a build is ever needed |
| Several agents in one tree | Own branch; commit only own files |
| Scripted passes while hands fail | Phase 5 is by hand; the audit labels the evidence |
| Stale templates | Copied `_template.js` as it stands |
| Copy in several places | One source for each line of copy |
| Doc counts drift | `verify:docs` run after every count change |
| Anti-patterns (§4) | No sort of printed facts, no hunt for a dial (every stage with a heater has a typed or ranked answer between steps), no plug-and-chug with all constants printed, no printed totals to subtract, no crowded bench |

## 7. Gate: read as a 13-year-old with a phone

Cut or changed at the gate: `q1` s7 (density) is a weigh-and-rank of three jars with equal volume, not a formula; `q3` s5 is a
ranking by the grips already measured and is dropped as a repeat if the audit finds it adds nothing; `q4` s1 to s4 of the brief
(metal, brass, steel) are not rebuilt (Ligar); `q7` s6–s7 merged into one beyond-the-exam stage. The boss has no new idea.

## Build record (2026-10-30)

**Built.** Seven benches and a boss, 53 stages: `q1-states` 8, `q2-grip` 8, `q3-boil` 8, `q4-solids` 6, `q5-crossing` 8, `q6-solution` 8, `q7-separate` 7, `boss-undertow` 5 (the registry counts the world's 52nd module and 351st stage with it). One new kit, `matter` (extends the heat kit; each bench's instruments register from their own file through `matter-registry.js`), one data module with sources (`engine/matterdata.js`) and one per bench (`matterdata-<name>.js`), 8 story scenes, a question-bank entry per bench (two problems each, worked problems on `q3`, `q6`, `q7`, end problems), a check file per bench in `tools/lib/mirrowen/`, a walkable world (`three/mirrowen*`, `tools/gen-mirrowen-layout.mjs`, `tools/verify-mirrowen.mjs`), the Undertow's arena, rig and corner body, and the player-facing lists.

**Where the build differs from the spec above, and why.**
- Stage tables for `q3` to `q7` and the boss, originally drafted in separate bench files, are fully consolidated here into Section 3; Section 8 preserves the builder brief.
- `q1`: stages 6 and 7 are a weigh-and-rank and a typed ratio of molecules (1672, from CRC densities), because a picture cannot show ice and water differing by 9 %. The third belief card reads "each molecule itself melts".
- `q2`: the rank of four ions replaces the brief's rank of four pairs; stage 7 asks for the ratio of every O–H bond in a mole of water to the pull-apart heat (23).
- `q3`: stage 1 no longer prints each card's grip, so the flask is the only evidence; the typed boiling point is read between heater steps (88 °C at 65 kPa, ±3); the gas over water is at 35 °C and typed (95.7 kPa).
- `q4`: stage 1 offers a Melt and a Current test, and gallium (a metal that melts at 30 °C) is the trap for 'low melting means molecular'; naphthalene replaces wax (wax melts over a range and would muddy the glass click); the "pick the solid for a job" stage is dropped (Ligar's lattice bench has it).
- `q5`: the three phase-diagram stages are one labelled experiment (a phase map), and stage 7 is a ranked burn.
- `q6`: **mass percent has no stage** (one end-set problem carries it, labelled beyond the exam); stage 2 asks for the molarity at 400 mL, a volume the Flask dial (100, 250, 500) lacks. The click is the particle count (which of three salts puts the most particles in the water), not dissolving as melting.
- `q7`: "count the dyes" is folded into the Rf stage to make room for the predict and test pair.
- The chart's four placeholder quests were replaced by these eight; the saga's Mirrowen entry gained a boss and a clue.
- The boss phases rebuild five benches with a new case (jars of other substances; four liquids whose grip order is the reverse of their mass order; ethanol at 45 kPa; 54.0 g of ice melted and warmed to 100 °C; 50 mL of 1.50 M stock for 250 mL of 0.300 M).
- The world was built by a separate builder from `docs/plans/ember-reach-world.md`'s pattern: a round basin and a frozen canal, seven hosts on a 44 m ring; nothing in it has been walked by a person. The quests' `ROOM` exports and `room: ROOM` lines were dead once the world existed (the engine ignores them when a bench is deployed on a world) and were removed.

**Shared code changed (all opt-in).** `table/tour.js` (`aliasTourKit`), `engine/foes.js` (the species `the undertow`), `engine/foebody.js` (`buildUndertow`), `engine/boss-arena.js`, `engine/boss-models.js`, `engine/instruments.js`, `three/stage.js`, `three/voyage.js`, `learn/worlds3d.js`, `story/saga.js`, `ui/field-manual.js`, `progression/commendations.js`, `progression/requisitions.js`, `tools/verify-learn.mjs` (one block for Mirrowen), `tools/verify-story.mjs` (unit06 required), `tools/verify-bench.mjs`, `verify-arena.mjs`, `verify-voyage.mjs`, `package.json`. Every world script and every shared check was run after the last change and is green.

**Checks (2026-10-30).** `verify:learn`, `:table`, `:story`, `:docs`, `:drills`, `:sync`, `:run`, `:bench`, `:arena`, `:voyage`, `:tallow`, `:lanternfall`, `:ligar`, `:bellows`, `:ember`, `:mirrowen`, `:quest`, `:console`, `:galaxy`, `:progression` all pass. Not run: `npm run verify` itself (it ends in `npm run build`, which empties `dist/`), `:geometry`, `:media`, `:flows`, `:ship`, `:holo`, `:normals`.

**What was and was not played.** See `docs/mirrowen-audit.md`. In short: every stage was solved by script and by a real pointer path at seven viewports; the first stages of `q2-grip` were played by hand; a few stages of `q1`, `q3`, `q5` and `q6` were viewed in the browser; the rest were not looked at.


---

## 8. Builder Brief & Parallel Build Specifications

# Mirrowen: how to build one bench (brief for a builder)

You are building ONE bench of Mirrowen (`unit06`, states of matter) in Avalon (`/Users/carlliu/chem-3d`, branch `world/unit06`). Other builders are
building the other benches in the SAME working tree at the same time, each in their own files. The slice, `q2-grip`, is built, played and green: copy its
pattern, do not reinvent it.

## Ground rules for a parallel build

- **Do not commit, stage, stash, reset, checkout or reformat anything.** The owner of the integration commits. Only touch the files listed under "Your files".
- **Do not use the browser** (Browser pane, Chrome, Playwright). There is one pane and the integrator uses it. You verify with Node scripts only.
- **Do not edit `PRODUCT.md`, `CLAUDE.md`, `package.json`, `tools/verify-*.mjs`, `matter.js`, `matter-draw.js`, `matter-registry.js` or another bench's files.** If you
  need a change to shared code, make it opt-in inside your own file; if you truly cannot, say so in your report.
- Run `node tools/verify-learn.mjs`, `node tools/verify-table.mjs` and `node tools/verify-story.mjs` often (each takes seconds to a minute); `node tools/verify-docs.mjs`
  will fail on stage counts until integration: ignore that one. Output other builders' failures you did not cause is not yours; say so.
- Never delete code. Chemistry must be accurate: simplify freely, say nothing false. Every number a player sees comes from a data row with a source.

## Read first (in order; read big files in chunks)

1. `PRODUCT.md`: "Building a Learn world" sections 3, 4 and 5 (the bench contract, how to design a stage, the pitfall ledger). Every row of 5 is a defect that was built.
2. `docs/plans/mirrowen-world.md`: sections 0, 2, 3 (your bench), 4 (kit plan), 6 (pitfall review). It is the contract; where this file is thin, YOU write the stage table
   (below). Your bench's design seeds are in the prompt that sent you here.
3. `src/learn/quests/unit06/q2-grip.js` (the pattern: stages, `SOLUTIONS`, `MISSES`, notes, `CHECKS`), `src/learn/quests/unit05/q3-enthalpy.js` (typed worked figure,
   rank on a rail, predict pair), `src/learn/quests/_template.js` (the contract).
4. The matter kit: `src/learn/table/kits/matter.js`, `matter-registry.js`, `matter-draw.js` (`say`, `slab`, `frameOf`, `topOf`, `paintGlyph` are exported),
   `matter-read.js`, `matter-parts.js`, `matter-tour.js`, and the heat kit it extends (`heat.js`, `heat-draw.js`, `heat-read.js`: cup, plaque, marker, selector, phase box,
   rail, note, tag, stmt, num, chip, shift cards are yours to use). The pure data and planners: `src/learn/engine/matterdata.js` (read its header: sources).
5. How a table is built and graded: `src/learn/table/model.js` (actions: `place`, `setDial`, `run`, `type`; zones: trays, rail, slots), `src/learn/engine/stagerunner.js`.
6. The AP CED text for your topics is in `/private/tmp/claude-501/-Users-carlliu-chem-3d/36dbefac-af21-4c4a-9eb3-1a72e51ba45f/scratchpad/ced.txt` (search "TOPIC 3.x").

## What a finished bench is (every item, no stubs)

1. **The quest module** `src/learn/quests/unit06/<questId>.js` copied from the pattern: `meta.stageCount`, `STAGES`, `SOLUTIONS`, `MISSES` (one plausible wrong answer per
   stage, each refused with a reason that names what the table shows and never the rule or the answer), `stateFor`, `mount` (pass `room: ROOM` with `export const ROOM = 'foundry'`
   as q2-grip does: Mirrowen has no ground yet), `VOCABULARY` (term -> stage whose reward card defines it), `BUILDS_ON` (real built quest ids only), `DEBRIEF` (one section,
   used only if the story animation is missing), `CHECKS` (exports for the verifier). No `PRACTICE`. No XP calls.
2. **Stages**: the count in your prompt (6 to 8). Each stage: prompt (ONE sentence, at most 25 words, no "!", objective never route), exactly three hints (one sentence each:
   control / what to look at / method, never the answer or the arithmetic), a reward card (1 to 3 sentences, about 45 words, real terms) and a `check` that returns
   `{ ok }`, `{ ok:false, notYet:true, msg }` for a blank bench, or `{ ok:false, msg }` naming what the table shows. A predict stage (`predict: true`) shows ONLY the question and
   the guess cards (no instrument, no runnable control) and its `onClear` calls `remember`; the next stage's `prompt` and `reward` getters call `recall` (see q2-grip).
   Predict only on the bench's click and on a new case. One decision per stage. Stage 8 (or the last) is normally a sealed sample. Numeric stages follow the quantity ramp
   (picture, prediction, proportional, formula as shorthand, friendly numbers, then a figure PAST the dial's range that is typed: `entry: { id, label, unit }`,
   `entryNumber`); the slips a student makes (a factor of ten, a missing step) are kept as refused answers in `MISSES`. A typed stage needs a picture behind it.
3. **Discover it, never read it off.** Nothing on the bench prints the answer, the capacity or the rule; if a student could answer by looking at the table, rebuild the stage
   around an instrument. No sort of printed facts, no hunting a dial until a number goes green (a heater with steps has a typed or ranked answer BETWEEN its steps), no
   plug-and-chug with every constant printed. Plain labels until the word is earned; every term defined by an earlier reward card (list it in `VOCABULARY`; nothing unearned
   appears in a prompt, hint, plate or caption: `verify:learn` and `verify:story` check).
4. **The kit part**: your instrument(s) and pieces live in your own file `src/learn/table/kits/matter-<name>.js` (a stub is waiting; it is already imported by `matter.js`).
   Register with `registerFixture(kind, { paint, run, dress3d?, settle? })` and `registerPiece(kind, { kind: {r, rect, nojoin: true}, paint, faceKey, piece3d?, printed? })`.
   A painter is a pure function of the table state: it prints what `matterdata.js` (or your own data file `src/learn/engine/matterdata-<name>.js`) says, never decides. Text on
   a plate is 6 px or larger, nothing is painted under a knob, a rail post, a rim or glass; fixtures that carry dials leave the dial rows free (`topOf`/`contentTop`). A card is
   at least as tall as a tray's cell. Pieces are `nojoin` unless physics says they join. Every drag has a two-tap twin (the engine gives it for free for pieces in
   slots, trays and rails). Add Tour words for EVERY new fixture and piece kind with `addTourText({ 'matter:<kind>': { title, dials: false, text } }, { <pieceKind>: [title, text] })`
   at the bottom of your kit file: three beats (what it is, what to do with it, what it tells you), plain words, no unearned term, never which move solves the stage.
   Build a `dress3d`/`piece3d` solid only if cheap and clearly correct; the flat picture must be complete without it (`3D Off` draws the same picture).
5. **Data**: new constants go in `src/learn/engine/matterdata-<name>.js` (pure, Node-importable, source in the header comment, rounding stated). Check every planner in Node
   against values you work by hand or read from the CRC/NIST; never certify a value with the code that produced it.
6. **The chart**: in `src/learn/worlds/unit06-states-of-matter.js` flip YOUR quest only: `status: 'live'`, `module: () => import('../quests/unit06/<id>.js')`, the right `stageCount`.
7. **The bank**: `src/learn/bank/unit06.json` gains `bench.<questId>.problems` (exactly two multiple-choice problems after the debrief, ids `<questId>#b1`, `#b2`) and, for a
   computational bench, `bench.<questId>.worked` (4 to 8 steps, number steps carry a `calc` expression the checker recomputes; id `<questId>#w`) plus 2 to 3 `end` problems
   (ids `<questId>#0..`). Edit the JSON with a short Python script that loads, merges only YOUR keys and dumps with `ensure_ascii=False, indent=2` (other builders do the same: be quick).
8. **Lead line**: replace the marker `  // @mirrowen <questId>` in `src/learn/engine/stage-story.js` with `  '<questId>': { 1: '...' },` (one sentence, at most 20 words, only earned words, a stake, not a task).
9. **Story animation**: put your painter(s) in `src/ui/story-scenes-mirrowen-<q#>.js` (a stub is waiting; export the `Q#_SCENES` object `{ 'name': painter }`; painters take
   `(ctx, w, h, t, clock)`, draw on a 960 x 540 plate, use `story-kit.js` and `story-sim.js` as `story-scenes-mirrowen.js` does, and every number on screen is counted or read from
   the data, never typed). Replace the marker `  // @mirrowen <questId>` in `src/story/quest-story.js` with the entry
   `'unit06/<questId>': { scene, beats: [{to, say}...3 to 5...], filed: 'Filed: ...' },`. A beat is at most 2 sentences and 36 words; `filed` is one sentence of at most 24 words that
   moves the case on, using only what the bench measured; every word must be earned by the bench's last reward card and none introduced by a later bench (`verify:story`).
10. **The verifier file** `tools/lib/mirrowen/<questId>.mjs` (pattern: `q2-grip.mjs`): `LEAKS` (words a refusal may not carry, 1-based stages) and `check(c)` that recomputes every
   graded figure from an INDEPENDENT value (hand-worked or CRC), the rank orders, that each predict stage shows no instrument, that an untouched table never passes, and that each
   stage's evidence is really on the bench.
11. **The stage table**: write `docs/plans/mirrowen-<questId>.md`: per stage the prompt, the evidence on the bench, everything the bench prints and why none of it is the answer,
   the wrong answers and the message each gets, the three hints, the reward, flat or 3D and why, the ramp rung for numeric stages. Be honest about what is weak.

Verification you must run before reporting: `node tools/verify-learn.mjs`, `node tools/verify-table.mjs`, `node tools/verify-story.mjs` (your quest must appear in each and pass; the story check needs your
entry; if it does not require unit06 yet, run the painter yourself against a stub 2D context at every beat with a Node script and say so). Read every refusal and every plate against its stage's answer.

## Layout rules that cost the most (table units; a table is 150 x 64 by default, `bounds: { w: 150, h: 72 }` is allowed)

A fixture box carries its dial rows at the top (`contentTop(nDials)`); a probe-like fixture is about 58 x 40, a cup 46 x 45. A card is 20 x 19 (`mol`) or 20 x 14 (heat cards).
A tray's `cellH` must be at least a card tall and the tray tall enough for the label strip above the first card. Pieces that rest in a rail are laid by the rail (`items`, `start`:
a start that is NOT the answer). Pieces resting at the table's lower edge need `y` at most `bounds.h - card half height`. `verify:table` fails any overlap of a zone, label, note, fixture or
piece, and any how-to note line with no clear strip (drop a note rather than crowd a table). Words are paint: nothing under a knob, a post or glass.

## Report (at most 300 words)

Files created and changed; the stage list with each stage's one-line idea and the click; the planner values you checked and against what; the check results; what you know is weak or could
not do; and the list of stages the integrator must view at `3D On` and play by hand (which fixtures are new, which gestures are unusual).

