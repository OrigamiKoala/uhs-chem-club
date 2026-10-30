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

Instrument: the **vapour flask**: a liquid sealed with a gauge (kPa) and a **Heater** dial in °C, an **Outside** dial for the pressure
of the room around an open flask. Real data: Antoine fits in `matterdata.js` `ANTOINE` (water, ethanol, acetone, diethyl ether).

| # | Objective | Notes |
| - | --- | --- |
| 1 | Seal a liquid at 25 °C and set a marker to where the gauge settles (two liquids first, then a third on the plate). | Ether 70.6 kPa, acetone 30.8, ethanol 7.9, water 3.2; the gauge rises and stops, earns **vapor pressure** |
| 2 | Order the four liquids by vapour pressure and by pull-apart heat; mark whether the two orders agree. | Weak grip = high vapour pressure. The click on "stronger smell/ lighter ⇒ …" is avoided: compares two real orders |
| 3 | PREDICT: At 70 kPa (a mountain), what temperature does water boil at? | Cards: 100 °C always; lower; higher |
| 4 | Open the flask at the Outside pressure of the mountain and raise the heater until the liquid boils; type the boiling point. | The plot of vapour pressure against temperature is drawn from the flask's own readings; the heater has 10 °C steps and the answer lies between two of them; typed (T) |
| 5 | Rank four molecules by boiling point from the pictures of their grips. | Ranks C₄H₁₀, acetone, ethanol, water; the player sets the order before the flask confirms |
| 6 | Order water, ethanol and hexane drops by how tall a bead each stands on the surface, and by how slowly each pours. | Surface tension and viscosity with real values (73, 22, 18 mN/m) |
| 7 | Cool ice and water in the flask; say which is denser. | Why ice floats; the open lattice from the hydrogen-bond model |
| 8 | Collect a gas over water at 25 °C and type its own pressure when the total is 101.3 kPa. | Dalton + 3.17 kPa; T (past the dial) |

### 3.4 `q4-solids` — Kinds of Solid (CED 3.2, 3.3.A.1) — 6 stages

| # | Objective |
| - | --- |
| 1 | Test iodine, ice and wax for melting, and say what holds each solid's particles (molecules held by the grips of `q2`). |
| 2 | Predict then test: heat glass and quartz; the glass softens over a range, quartz holds then melts at one temperature. |
| 3 | Pick the picture of a crystal and of an amorphous solid from the window. |
| 4 | Test four sealed solids with melting, current and strike; file each under metallic, ionic, network or molecular. |
| 5 | Choose the solid for each job from four property cards (needs tested properties). |
| 6 | Sealed: five unknowns, all four kinds, one amorphous. |

### 3.5 `q5-crossing` — The Crossing (CED 6.5)

Instrument: the **curve**: a sample of water in a cup, a heater that feeds a fixed energy per setting, and a recorder that plots
temperature against heat added, with data from `matterdata.js` `PHASE` (water: c(s) 2.09 J/(g·K), c(l) 4.184, c(g) 1.97 [steam at 1 atm],
ΔHfus 6.01 kJ/mol, ΔHvap 40.7 kJ/mol).

| # | Objective |
| - | --- |
| 1 | Heat ice at −20 °C steadily and let the recorder draw the curve; set a marker where the temperature stalls first. |
| 2 | PREDICT: Where does the heat go while the temperature stands still? (cards: nothing, it is lost; into pulling the molecules apart; it warms something else) |
| 3 | Type the heat to melt 36.0 g of ice (2.00 mol × 6.01 = 12.0 kJ). |
| 4 | Type the total heat from ice at −10 °C to steam at 110 °C for 18.0 g, then the heat given out when it comes back (typed, two entries). |
| 5 | Order 1 g of steam at 100 °C and 1 g of water at 100 °C by the heat they give a hand: which burns worse? |
| 6 | Read a phase diagram: the phase at a given pressure and temperature (beyond the exam). |
| 7 | Find the triple point and the critical point (beyond the exam). |
| 8 | Why water's melting line leans back (beyond the exam). |

### 3.6 `q6-solution` — Taken Into Solution (CED 3.7, 3.8, 3.10, 6.1, 6.4)

Instrument: the **volumetric flask**: a balance pan, a flask with a graduation mark, a pipette; a window shows the dissolved salt as
ions each wrapped in water (`particlesOf` with the real ion counts). Typed stages: molarity (`s2`), dilution (`s3`), mass percent (`s7`).

| # | Objective |
| - | --- |
| 1 | Put 5.85 g of salt in water: the window shows the ions; set the counter to the number of particles per formula unit that go into the water (for NaCl, two). |
| 2 | Make a 0.100 M solution: type the molarity of 5.85 g of NaCl in a 250 mL flask (0.400 M) and then fill a flask to 0.100 M; typed past the dial. |
| 3 | Dilute: type the volume of 2.00 M stock needed for 100 mL of 0.500 M (M₁V₁ = M₂V₂). |
| 4 | Count the particles CaCl₂ gives per formula unit in the window (three). |
| 5 | A salt, a wax and an alcohol in water and hexane: predict then file each. |
| 6 | Dissolve ammonium nitrate and calcium chloride in the calorimeter cup: read ΔT and say which is endothermic. |
| 7 | Mass percent of a solution (beyond the exam; typed). |
| 8 | Sealed: prepare the solution to a specification from a stock. |

### 3.7 `q7-separate` — Pulling Apart (CED 3.9)

Instrument: a **strip** (paper chromatography with a solvent dial and spots whose travel is computed from a polarity model in
`matterdata.js` `CHROM`), a **still** (a flask, a column and a receiver) and a **filter**.

| # | Objective |
| - | --- |
| 1 | Run a dye: how many components? |
| 2 | Type the Rf of one spot from the ruler (spot distance ÷ front distance; typed). |
| 3 | Swap the solvent to nonpolar and say which spot now leads. |
| 4 | Distil ethanol and water; say which comes over first. |
| 5 | Choose filtering or evaporating for a dissolved solid. |
| 6 | Salt in water: boiling point rises (beyond the exam). |
| 7 | Plan the separation of a three-part mixture (sealed). |

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

## Build record

(Filled in at the end of the build; see the sections below.)
