# Kettle (`unit07`) — world spec and build record

Status: **spec (Phase 0).** Written 2026-10-30 on branch `world/unit07`. Section 9 is the build record and is filled in as the build lands.
This file is the contract the build is audited against. Hint and reward wording lives in the quest modules; this file fixes the *design*:
the objective, the evidence, what is printed (and the check that it is not the answer), the slips and what they are told, the quantity-ramp rung.

Sources: `PRODUCT.md` ("Building a Learn world", pitfall ledger §5, anti-patterns §4), `CLAUDE.md`, `docs/engineering/engine-and-worlds.md`,
`docs/plans/learn-quests.md` (World 7), `docs/AP-coverage-audit.md`, AP Chemistry CED Unit 4 (Chemical Reactions) and the Unit 1 composition topics.
Exemplars read: Ember Reach (`unit05/q3-enthalpy`, heat kit), Bellows (gas kit), Mirrowen (`matter.js` + `matter-registry.js`, the fixture-registry pattern).

## 0. What is already there, and what it means

- `unit07/q1-recipe` (8 stages, heap kit) and `unit07/boss-golem` (2 phases, heap kit) exist, built under the older rules. They are **kept, re-audited, and brought up
  to the rules** (stage briefings → Tour, story animation and lead line, boss grown to five phases). Nothing is deleted; superseded stages are archived.
- The chart (`worlds/unit07-stoichiometry.js`) holds four placeholder quests (`q2-ledger`, `q3-ratios`, `q4-shortfall`, `q5-kinds`). They are **replaced** by the eight benches below
  (`q1-recipe` … `q8-kinds`) and the boss. The brief in `learn-quests.md` fixed the eight; this spec follows it.
- Kettle has no walkable world. It gets one (`kettle`, an automated foundry works on a soda flat; see §5). The saga (`story/saga.js`) already says "automated metal factories";
  the chart's "soda lake" `place`/`brief` is rewritten to match.
- The story thread: the **forged production ledger** (`clue_kettle_ledger`): *fifty tons of metal from forty tons of ore*. Every bench adds one fact that makes that line impossible;
  `q6-stoich` computes the most iron 40 t of ore can give (28 t) and the Golem's last phase files the forgery.

## 1. CED map (Unit 4, plus Unit 1 composition)

| CED topic | Bench · stage | Note |
| --- | --- | --- |
| 1.3 Elemental composition of pure substances | `q1-recipe` s5, s6 | built; **audit** |
| 1.4 Composition of mixtures (purity) | `q6-stoich` s8 | percent purity of a salt by mass of precipitate |
| 4.1 Introduction for reactions (physical vs chemical change, evidence) | `q3-change` s1–s5 | |
| 4.2 Net ionic equations | `q5-ionic` s1–s8 | |
| 4.3 Representations of reactions (balanced equation, particle diagrams) | `q4-balance` s1–s8 | |
| 4.4 Physical and chemical changes | `q3-change` s3–s8 | conservation of mass s6, s7 |
| 4.5 Stoichiometry (moles, grams, limiting reactant, yield, gas) | `q6-stoich` s1–s7 | 4.5.A.3 gas in s6 |
| 4.6 Introduction to titration | `q7-titrate` s1–s8 | |
| 4.7 Types of chemical reactions | `q8-kinds` s1–s3, s8 | |
| 4.8 Introduction to acid–base reactions | `q8-kinds` s4 | proton transfer; Teeter/Verdigris take the quantitative side |
| 4.9 Oxidation–reduction (redox) reactions | `q8-kinds` s5–s7 | oxidation numbers; Brinewire takes cells |
| (not a CED topic, assumed by every unit) names and formulas | `q2-names` | labelled "assumed" in the chart and AP audit |
| 3.4/4.5.A.3 gas stoichiometry | `q6-stoich` s6 | closes the Bellows gap (B2) |

**Gaps, logged with reason.** (a) 4.2.B.1 "solubility *rules* beyond the four always-soluble ions plus Cl⁻/SO₄²⁻/CO₃²⁻/OH⁻ groups" — the bench holds the AP's table, not a memorised one, and teaches
it by experiment. (b) 4.9 balancing redox half-reactions (not a CED requirement in Unit 4; Brinewire). (c) Quantitative acid–base (pH of a titration curve, buffers) — Verdigris. (d) Net ionic
equations for weak acids are stated (q5 s7), not computed. (e) Thermochemistry of reactions — Ember Reach already holds it and supplies `BUILDS_ON`.

## 2. Bench list (teaching order)

All benches: 8 stages (stage 8 a sealed sample), except `q2-names` (8) which is a card board. One click each; the *wrong model* is a card, a dial label or a trap on the table.

| Bench | Idea thread | Instrument family | The click (what students hold) | Story stake · lead line | Filed line | Words earned |
| --- | --- | --- | --- | --- | --- | --- |
| `q1-recipe` (built) | a compound's recipe is fixed | heap kit: atoms, maker, share bar | "extra atoms make a bigger molecule of the same stuff" (stage 2) | Vess holds three scoops from three floors | the ledger's ore is a compound with a fixed share of metal | fixed composition, conservation of mass, limiting reactant, percent composition, empirical formula |
| `q2-names` | a formula is a count of ions that cancel; a name is a charge | card board: ion discs, a cell with a charge needle, a label maker | "a formula is the symbols side by side, one of each" (MgCl, AlO) | the foundry's crates carry labels nobody can read | the manifest's ore is iron(III) oxide, Fe₂O₃ | ionic formula, ionic compound name, Roman numeral, polyatomic ion, molecular prefix, acid name |
| `q3-change` | a change that makes a new substance | the pot: lid, balance, particle window, evidence strip | "burning loses mass" (an open pot gets lighter) | the ledger says metal came from nowhere; first ask whether anything can | the sealed pot weighs the same before and after | physical change, chemical change, evidence of reaction, conservation of mass (applied) |
| `q4-balance` | an equation counts atoms | the pot's equation board (coefficient dials, atom ledger, particle window) | "to balance it, change the little numbers" (subscripts) | the furnace recipe card is unbalanced | the furnace recipe: Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂ | chemical equation, reactant, product, coefficient, state symbol |
| `q5-ionic` | which ions actually reacted | the pot with conductivity lamp and particle window | "when two solutions mix, everything in them reacts" | the waste pond turned cloudy; what is in it | the pond's cloud is lead(II) iodide-like: a precipitate of one pair of ions | precipitate, spectator ion, net ionic equation, solubility, complete ionic equation |
| `q6-stoich` | moles are the currency, grams the weights | the pot, balance, jars, gas syringe, filter and oven | "grams react in the ratio of the coefficients" | how much iron can 40 t of ore give | 40 t of ore gives at most 28 t of iron; the ledger says 50 | mole ratio, theoretical yield, excess reactant, percent yield, gravimetric analysis (limiting reactant: re-earned on masses) |
| `q7-titrate` | counting acid by the base that meets it | the pot with a burette head, indicator | "the colour change is where the acid is used up" (it lags the equivalence point) | the pickling tank's acid strength is unknown | the pickling bath is [x] mol/L, so the foundry's acid use is (counted) | titration, burette, indicator, equivalence point, endpoint |
| `q8-kinds` | the same reaction seen four ways | the pot, gas tests, card board | "a reaction is one kind only" (s8: Mg + O₂ is synthesis *and* redox *and* combustion) | the furnace log: which reactions are running | the furnace log shows iron(III) oxide losing oxygen: it was reduced, not made from nothing | synthesis, decomposition, combustion, acid–base reaction, oxidation, reduction, redox, oxidation number |
| `boss-golem` | five phases re-testing q1, q3, q4, q6 and q7 | the pot (new cases) | — | — | the Golem's own ledger: iron out exceeds the ore in: forged | — |

## 3. Stage tables

Column shorthand. **Ev** = the evidence on the bench. **Pr** = what the bench prints, and the leak check. **Slip** = the plausible wrong answer and what the refusal says (it names what the table shows, never the reasoning).
**Ramp** = the quantity-ramp rung (P picture · G prediction · R proportional · F formula as shorthand · N friendly numbers · T typed past the dial, with slips as refused cards). **Mode**: F flat, 3 = 3D object (a 3D Off twin draws the same).
Hints and reward bodies follow the contract in `_template.js` and live in the quest modules; the *idea* each reward names is given here.

### 3.1 `q1-recipe` — The Same Recipe (built; audit only)

Re-audit the eight built stages against §7; known suspects: per-stage `briefing`s that the Tour should replace (stages 2, 3, 4 carry one), stage 2 (a two-sample, 50 % tray),
stage 5 (the share bar reads a dial the player sets after weighing: copy-the-number risk), stage 8. Fixes are logged in `docs/kettle-audit.md`; changes that alter a stage's check are
replayed. Adds: lead line exists; **story animation** (new, §6); `Filed:` as above.

### 3.2 `q2-names` — Names and Formulas (assumed; card board; flat)

Kit: pot kit pieces `ion` (disc with symbol and charge), `cell` fixture (a box for ions, with a **charge needle** that reads the cell's net charge: the same needle Tallow's `q4-ledger` taught) and `labeler` fixture
(three slots for name tiles). Ramp: P/N only (no arithmetic beyond counting).

| n | Objective (prompt) | Ev | Pr · leak check | Slip → refusal | Idea |
| --- | --- | --- | --- | --- | --- |
| 1 | Build the smallest group of Mg²⁺ and Cl⁻ ions that has no charge. | loose Mg²⁺ ×3, Cl⁻ ×5 discs; cell with needle | disc charges, needle total. No ratio printed. | one of each → "The needle reads +1." Six and four ions (neutral but not smallest) → "The cell holds the same group twice." | ionic formula (subscripts count the ions in the smallest neutral group) |
| 2 | Name the compound in the cell. (NaCl built, then MgO) | the cell shows the built group; name tiles: sodium, magnesium, chlor-, oxid-, chlorine, oxygen, -ide, -ate, -ine | tiles, no answer | "sodium chlorine" → "The label ends in the plain element name; the second ion here is a single atom with a charge" (names the table) | naming ionic compounds (-ide) |
| 3 | Name the two iron oxides FeO and Fe₂O₃. | cells hold the built groups with needle; Fe discs carry **no printed charge**, the needle shows what each group's iron must be; tiles I II III, iron, oxide | no charge on Fe; no numeral given | "iron(II) oxide" for Fe₂O₃ (numeral = subscript) → "The needle reads zero with 3 oxide of 2− … " is the reasoning; refusal instead: "Fe₂O₃ holds 2 irons; the needle gives each iron …" — see note | Roman numeral = the metal ion's charge, not the subscript (**the click**: Fe₂O₃ is iron(III)) |
| 4 | Dissolve each salt and list which ions travel as one piece. | a bath: Ca(NO₃)₂, NaCl, Na₂SO₄, NH₄Cl dropped in; particle window shows the ions with groups drawn joined | window, no names | marks a lone atom (Cl⁻) as a group → "In the window Cl⁻ is one atom" | polyatomic ion |
| 5 | Build the smallest neutral group of calcium and nitrate ions and write its formula. | Ca²⁺, NO₃⁻ discs, cell, needle, formula tiles with parentheses | no formula given | Ca(NO₃)₂ without parentheses (CaNO₃₂) → "The cell holds one group of NO₃ twice; the tile you set reads as 32 oxygens"; lone Ca NO₃ → needle +1 | parentheses around a group |
| 6 | Name CO, CO₂ and N₂O₄. | pot-free; three sample dishes with a particle window; prefix tiles mono- di- tri- tetra- | window shows the atoms counted | "carbon oxide" / "carbon oxide(IV)" → "There are two carbon dioxides … " → refusal: "The dish shows one C and 2 O; the label lists no count" | molecular prefixes (nonmetal pairs name the count) |
| 7 | Name HCl(aq) and HNO₃(aq). | cells show H⁺ with Cl⁻ and with NO₃⁻; name tiles hydro-, -ic acid, nitr-, nitric | tiles | "hydrochloric" vs "hydrochlorine acid" → names table | acid names |
| 8 | Sealed: name or write each of three labelled crates. | three crates with either a formula or a name (sealed side hidden); label maker and cell | none | each part of 2/3/5 | all together |

Note on stage 3's refusal: a refusal may say what the cell shows ("the cell holds 2 Fe and 3 O; its needle reads zero") but not "so each iron is 3+".

### 3.3 `q3-change` — Physical or Chemical (CED 4.1, 4.4)

Kit: the pot (`pot` fixture: a vessel with a mouth slot, a **lid** dial {open, sealed}, a Run key), a **balance** fixture (reads whatever stands on it: pot + contents in g), a **particle window** (a glass strip beneath the pot showing the molecules), an **evidence strip** (four lamps that light only from the planner: gas given off, new colour, solid forms, temperature change — each lit by what the pot did; a lamp does not say "chemical").

| n | Objective | Ev | Pr · leak | Slip → refusal | Ramp / idea |
| --- | --- | --- | --- | --- | --- |
| 1 | Pick the change that made a new substance. | four pots (melt ice, dissolve sugar, heat sugar to black, rust the nail wool), each with window and balance | windows (what is in the pot after) | picks melting → "The window after still shows water molecules only" | chemical vs physical change |
| 2 | Read the evidence: file each of four changes under the clue it showed. | evidence strip lamps; clues as slots | lamps lit by the planner, no verdict | wrong slot → names the lamp that was lit | evidence of reaction |
| 3 | PREDICT: an open pot of steel wool is burned; will it weigh more, less or the same? | no instrument; cards more / less / same | none | — | prediction (held model: burning loses mass) |
| 4 | Burn the wool in the open pot and read the balance. **The click.** | pot with steel wool, balance, window | balance only | marks "less" because the card says it | the wool gains mass (oxygen joins) |
| 5 | Why does a log get lighter? Weigh the same burn in a sealed pot. | lid dial sealed; window shows gas particles trapped | balance, window | open pot of wood chips lighter → "The window shows CO₂ and water vapour that left" | conservation of mass |
| 6 | Weigh a sealed pot before and after. Type the mass of the sealed pot after if 72.0 g before (past the dial). | sealed dial settings at 3 amounts, balance | — | — | conservation of mass (typed, T) |
| 7 | Tell dissolving salt in water from a reaction. | conductivity-free: window shows ions leaving the crystal and no new substance | window | calls it chemical → "The window shows the same ions" | dissolving is physical in the AP framing; state why |
| 8 | Sealed: sort three unlabelled changes. | three sealed pots, window opened by Run | none | — | all |

### 3.4 `q4-balance` — Balancing Equations (CED 4.3)

Kit: the pot's **equation board** (`board`): each species a card with a **coefficient dial** (1–6) and a **subscript dial** only on stage 2; an **atom ledger** (rows per element, left count | right count, no tick, no lamp; the player compares); a **particle window** that draws exactly what the coefficients say. Ramp: P/N, with a typed figure in s8.

| n | Objective | Ev | Pr · leak | Slip → refusal | Idea |
| --- | --- | --- | --- | --- | --- |
| 1 | Set the left and right atom counts the board shows for H₂ + O₂ → H₂O. (typed counts) | board at all 1s, ledger hidden, window | window only | miscounts → "the window shows 2 O on the left, 1 on the right" | equation, reactant, product |
| 2 | **The click.** Make the oxygen count agree. (Subscript dial is on the board.) | subscript dial changes H₂O into H₂O₂; the window redraws it as a different molecule | window, ledger | subscript changed → "The window now shows a different molecule" | coefficient |
| 3 | Balance the combustion of methane. | board (CH₄, O₂, CO₂, H₂O), window | ledger counts | any slip → names the unbalanced element's counts | balancing |
| 4 | Turn a particle diagram into a balanced equation. | a fixed diagram (the window locked to a reaction); coefficient dials | diagram | — | reading a diagram |
| 5 | Add the state of each species. | state tiles (s)(l)(g)(aq) on each species; the window shows spacing | window | wrong state → "In the window the particles are …" | state symbols |
| 6 | Balance propane's combustion (needs a 5 and a 3 and 4). | board | ledger | stopping at C₃H₈ + O₂ with 2 → names O counts | balancing |
| 7 | Balance a reaction with a polyatomic ion kept as one group: Ca(OH)₂ + H₃PO₄ → Ca₃(PO₄)₂ + H₂O. | board, groups counted once | ledger counts PO₄ as a unit | — | polyatomic unit |
| 8 | Sealed: find the unknown product's formula from the atom counts. | board with one species sealed; typed formula | — | wrong formula → ledger counts | applying |

### 3.5 `q5-ionic` — Net Ionic Equations (CED 4.2)

Kit: the pot with two jar seats, a **conductivity lamp** (brightness from ion count), a **particle window** (ions drawn), a **filter** key (separates the solid).

| n | Objective | Ev | Pr · leak | Slip → refusal | Idea |
| --- | --- | --- | --- | --- | --- |
| 1 | Mix the two clear solutions. Say what formed. | lead nitrate + potassium iodide: cloud; window | window | — | precipitate |
| 2 | PREDICT: which ions are still in the beaker after the cloud settles? | no instrument; ion cards | — | held model: every ion reacted | prediction |
| 3 | TEST: filter, then read the window. | window, lamp | lamp, window | — | spectator ions |
| 4 | Write only what reacted. | ion chips on a rail; net ionic card | — | spectators included → "K⁺ is in the window both before and after" | net ionic equation |
| 5 | Use the four always-soluble ions. Which mixtures can never cloud? | four mixtures; test by mixing | window | — | solubility rules |
| 6 | Predict whether three mixtures give a precipitate. | three, mix to test | — | — | solubility |
| 7 | Strong acid + strong base: write the net ionic equation. | lamp dims | window | writes the whole salt | H⁺ + OH⁻ → H₂O |
| 8 | Sealed: molecular, complete ionic, net ionic for one reaction. | typed in three slots | — | — | complete ionic |

### 3.6 `q6-stoich` — Stoichiometry (CED 4.5, 1.4) — **the vertical slice, the world's central click**

The click: *grams react in the ratio of the coefficients.* Prediction offers the held model as a card ("4.0 g of H₂ makes 4.0 g of water"). The pot with a balance shows the mass of product; equal grams are not equal moles.

Kit: pot (two feed seats for jars, product seat), **jar** pieces (`species`, `grams`, printed label and amount only where the amount is the given), **balance** (reads a jar or the pot), **dial** `grams fed`, **gas syringe** (volume of CO₂ at stated T, P), **filter + oven** (gravimetric), the **equation plate** (a balanced equation printed — balancing is q4's), the **listed masses plate** (constants given when the stage needs them).

| n | Objective | Ev | Pr · leak | Slip → refusal | Ramp / idea |
| --- | --- | --- | --- | --- | --- |
| 1 | PREDICT: how many grams of water 4.0 g of hydrogen makes with oxygen to spare. | no instrument; cards 2.0 g · 4.0 g · 18 g · 36 g · 72 g (4.0 g, the coefficient card, is the held model) | the equation | — | G |
| 2 | Type the grams of water that 5.0 g of hydrogen makes. (pot, balance, dial 1/2/3 g) | pot runs 1, 2, 3 g H₂ → balance reads 9, 18, 27 g; the dial stops at 3 | equation, no masses | 5.0 (1:1) and 10 (coefficient) → "your figure does not extend the three readings: 9, 18, 27" | R |
| 3 | Type the moles of ammonia that 12 mol of H₂ makes (N₂ + 3 H₂ → 2 NH₃). | pot in moles, window 1 particle = 1 mol; dial 3/6/9 mol | equation | 12, 18 → names the readings | mole ratio · P/R/T |
| 4 | Type the grams of iron 80 g of Fe₂O₃ gives (Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂). | listed-masses plate, equation, no dial | masses plate, equation | 28 (skipped the ratio), 112, 80 | grams to grams · F/T · theoretical yield |
| 5 | Type the grams of hydrogen left over when 10.0 g H₂ meets 64.0 g O₂ (water). | jars, pot run, leftover H₂ drawn in the window, balance | masses, equation | 0, 2.0·(wrong), 10 | limiting + excess (re-earned on masses) |
| 6 | Type the litres of CO₂ that 50.0 g of CaCO₃ gives at 25 °C and 1.00 atm. | pot heated, syringe with a barrel reading, R plate | R plate, masses | 12.2 (STP molar volume), 11.2, 5.5 g/mol confusions | gas stoichiometry · T |
| 7 | Type the percent yield of iron if 80 g of Fe₂O₃ gave 34.6 g of iron on the balance. | the balance reading of the product jar; theoretical not printed | masses | 100 (nothing lost), 61.8 (used 56.0 as Fe₂) | percent yield · T |
| 8 | Sealed: filter, dry and weigh the precipitate, then type the percent chloride and the percent purity. | filter, oven, balance, silver nitrate, salt of unknown purity | masses, equation | purity = chloride % | gravimetric analysis, purity (CED 1.4) |

### 3.7 `q7-titrate` — Titration (CED 4.6)

Kit: pot + **burette** (drip dial in 0.5 mL steps, stopcock Run), indicator card (phenolphthalein), a flask window showing ions.

| n | Objective | Ev | Pr | Slip | Idea |
| 1 | Add base from the burette until the colour changes. | burette, flask, indicator | none | — | titration, burette, indicator |
| 2 | Mark the volume where the moles of acid and base are equal on the window. | window particle counts | none | marks the colour change volume | equivalence point |
| 3 | Type the acid concentration (mol/L). | burette reading, 25.0 mL acid, 0.100 M base | — | uses mL, uses ratio wrong | T/F |
| 4 | Titrate H₂SO₄. | needs twice the base | — | — | stoichiometry in titration |
| 5 | What does overshooting do to the answer? PREDICT then run. | | | | |
| 6 | Tell the colour change from the true match point. | indicator at pH window vs equivalence | | | endpoint |
| 7 | Titrate with permanganate (self-indicating). | | | | |
| 8 | Sealed unknown. | | | | |

(Stage rows 5–8 are fixed at design level here; their evidence and prints are completed when the bench is built.)

### 3.8 `q8-kinds` — Kinds of Reaction (CED 4.7, 4.8, 4.9)

Kit: pot, **gas tests** (glowing splint, lit splint, limewater), card board of reaction cards, an electron-flow window for redox.

| n | Objective | Idea |
| 1 | Sort reactions that join and reactions that split (five pots; the window shows the pieces). | synthesis, decomposition |
| 2 | Burn a fuel and test the products. | combustion |
| 3 | File the precipitation reactions from `q5`. | (applied) |
| 4 | Watch a proton move from one molecule to another. | acid–base reaction |
| 5 | Drop zinc into copper sulfate and watch the electrons move. | oxidation, reduction, redox |
| 6 | Assign oxidation numbers. | oxidation number |
| 7 | Identify three gases by test. | gas tests |
| 8 | **The click.** Sort eight reactions by every type they belong to (Mg + O₂ is synthesis, combustion and redox). | reaction types overlap |

### 3.9 `boss-golem` — the Recipe Golem (five phases)

Each phase re-tests an earlier bench on a new case and introduces no concept; the golem is the foe from the instrument's own planner, mapped one to one onto the stage's samples; no lead line; the answer slot sits clear of the foe's corner.

| Phase | Re-tests | Case |
| 1 | `q1` limiting heaps | built; rewritten as a combined case |
| 2 | `q4` balance | the golem's recipe board with one coefficient wrong |
| 3 | `q3` conservation | the ledger: a sealed pot's mass after |
| 4 | `q6` grams to grams | the ore feed by weight |
| 5 | `q6/q7` yield and titration | the forged ledger: percent yield above 100 |

## 4. Kit plan

**One new kit, `pot`, extending the heat kit** (the cup, tins, plaques, number marker, answer dial, rail, particle boxes and equation cards are Ember Reach's and are used as they are), built on the fixture-registry pattern of the matter kit (`pot-registry.js`; each bench's instruments in `pot-<name>.js`).
It authors nothing: every reading is a pure planner in `engine/reactdata.js`, shared by the drawn and the built twin, from real data.

| Planner (`reactdata.js`) | What it answers | Independent source for the check |
| --- | --- | --- |
| `ION`, `ionicFormula(cat, an)`, `nameIonic`, `nameMolecular`, `nameAcid` | neutral group, subscripts with parentheses, names | CED/AP nomenclature conventions, worked on paper |
| `parseEquation`, `countAtoms`, `isBalanced`, `balance` | atoms each side; the smallest integer coefficients | rational nullspace; known textbook equations |
| `molarMass(formula)` with `ATOMIC` (extends scope masses with Fe 55.8, Ca 40.1, …) | grams per mole | IUPAC rounded to 0.1 |
| `reactPlan(eq, amountsMol)` | limiting species, extent, products made, excess left | hand arithmetic |
| `percentYield`, `gasVolume(n, T, P)` (R 0.08206 L·atm/mol·K), `waterVapourPressure` | typed figures | ideal gas law; vapour table from `gasdata.js` |
| `solubility(cat, an)` and `planMix(A, B)` | precipitate, spectators, net ionic | AP solubility rules |
| `titrate(acid, base, vAdded)` | moles left, pH (strong–strong), indicator colour, equivalence volume | stoichiometry on paper |
| `oxidationNumbers(species)`, `REACTION_TYPES` | redox assignment; every type a reaction belongs to | CED 4.9 conventions |

New kinds of piece and fixture and their Tour words (`pot-tour.js`, asked after the heat kit's): `ion`, `jar`, `cell`+needle, `labeler`, `pot`, `balance`, `board` (equation board), `window`, `burette`, `syringe`, `filter`/`oven`, `tests`. A step per kind in earned words; `verify:table` fails otherwise.

## 5. World plan

Kettle: an automated **foundry works on a soda flat**: a white crust under amber haze, the plant's machinery in a row, one host per bench, each built *into* the works and clear of the bay envelope.
Host assignment (footprints in `kettle/host-plan.js`, the one source the generator, world and `verify:kettle` share):

1 assay yard (the heap sorting floor) · 2 the labelling shed (crate labels) · 3 a sealed charging pot on a weighbridge · 4 the recipe board room (furnace control room) · 5 the effluent sump and settling tanks ·
6 the blast-furnace charge floor (balance, charging pot) · 7 the pickling line (burette over an acid tank) · 8 the furnace tapping floor (gas tests at the flues).
The Golem is fought on open ground in front of the furnace (`BOSS_ARENA_SPOTS`). Generator `tools/gen-kettle-layout.mjs` writes `world-data/kettle.json`; builders `src/three/kettle/`; textures `materials/kettle-textures.js`;
registration in `worlds3d.js`, `voyage.js`, `stage.js`; checker `tools/verify-kettle.mjs` modelled on `verify-ember.mjs` (overlap, buried bodies, walkability flood fill, lamps-only-lit, bay clearance).
The existing `foundry` room (`rooms.js`) is retained as the `3D On` room for any quest played off-world.

## 6. Story, bank, Tour

- Lead lines (`stage-story.js`, ≤20 words, plain, earned words): one per bench's first stage; none on the boss.
- Story animations (`story/quest-story.js`, painters `ui/story-scenes-kettle.js` + `-mech`): one per quest, 3–5 beats, a `Filed:` line, every number counted from the drawn thing (atoms balanced one by one; a sealed pot's mass as a running sum of drawn atoms; moles as drawn particles; a burette's drops counted).
- Bank (`bank/unit07.json`): per bench exactly two problems and, where computational (`q4`, `q6`, `q7`), one worked problem with `calc` steps; an end set. Ids never reused.

## 7. Pitfall review (every row of `PRODUCT.md` §5, and the §4 anti-patterns)

| Row | Verdict |
| --- | --- |
| Plate/header/readout prints the answer | **Avoided by:** a per-stage "Pr" column above; ledgers print counts only where counting is the previous stage's skill; typed stages print the equation and constants, never the product count; `verify:learn` string search plus a read of every plate in the audit. |
| A refusal states the rule | **Avoided by:** the Slip column names what the table shows ("the balance read 18 g from 2 g"); audit reads each refusal. |
| A miss gives the reasoning | as above. |
| Tray/rail names state the answers | **Avoided by:** trays named by what the player saw or did ("Cloudy after mixing"), not by the concept. |
| Term used before taught | **Avoided by:** `VOCABULARY` per quest and `WITHHELD_VOCAB` for later words (spectator, equivalence, oxidation); Ember's balanced equations are supplied by Ember; here `q4` earns "coefficient". |
| The model offered is not the held one | **Avoided by:** each click's wrong model is the card students hold (§2). |
| Stages that repeat | **Avoided by:** §3: each stage has a distinct idea; `q1`'s audit may cut one. |
| Story that does not touch the bench | **Avoided by:** one stake per bench, the ledger thread (§0). |
| Crowded rows, accidental joins | Ion discs and name tiles are laid on a grid ≥ 60 units apart (the table is 150 × 64). |
| A dropped tool never joins | **Not applicable:** the pot has no tools that join; jars seat in slots. `verify:bench` gestures check the seats. |
| Missed grab throws the camera | shared engine behaviour; re-checked in play. |
| Drop beside a slot strands a piece | shared `gestures.js` rule; the pot's seats are generous. |
| Dials stop a step short | tolerance of one step on the coefficient dials; dials are integer. |
| Tool vanishes once placed | jars have a body and a label; lids are brass discs. |
| Needed control not mentioned | each fixture's cap and caption say it; Tour step per kind. |
| Control that reacts late | Run keys disable while the pot settles. |
| Tiny text | all painted words ≥ `LABEL.min`; windows have ≤ 24 drawn particles each. |
| Black pane at entry | shared "Building the bench" overlay. |
| `c.label` in metres | all labels sized in metres. |
| Opaque slab over a painted display | pot/balance have open frames, no slabs. |
| Glass over printed text | nothing painted within 7 units behind a tube; burette tube stands on the flask side. |
| Lining plate over painted contents | `noJarFill` on containers that paint their contents. |
| Lens kept old picture | not applicable. |
| Painted words under hardware | dial names start 3.6 units in, pitch 7; ladder labels outside posts. |
| Fonts (O vs 0, no superscript minus) | element letters in sans; true minus (−) in charges; charges drawn as small caps text via `plateText`. |
| Drawn contents off the puck | ions drawn as discs with the charge inside a clear margin. |
| Heaps cover gauges | gauges at y 29–31, clear of the foe's corner. |
| Plots too small | the one plot (titration curve, stage 6) ≥ 36 × 22 units. |
| Generic ball faces | pieces named in earned words. |
| Option object drops a key | each new option is asserted in `verify:table`. |
| Disposal recursion | `Table3D` flags disposed before unmount (shared). |
| Stage count in five places | chart, quest `meta`, facts line, counts sentence, `verify-learn` indices: all updated in the close-out. |
| Bank moved mid-pass | quests export no `PRACTICE`. |
| Shared change breaks other worlds | all engine changes opt-in; every world script run after. |
| Full verify wipes dist | individual scripts only. |
| Several agents in one tree | **a git worktree** (`../chem-3d-kettle`) is used; Mirrowen's agent keeps the main tree. |
| Scripted pass vs hand fail | Phase 5 by hand; evidence labels in the audit. |
| Stale templates | `_template.js` is current. |
| Copy in several places | one source per piece of copy. |
| Doc counts drift | `verify:docs`. |
| §4 anti-patterns: sort of printed facts; copy a number; hunt a dial; plug-and-chug with all printed; refusal-only; two printed totals subtracted; twelve things on a bench; fetch that copies | each is checked per stage in §3 (the "Pr" and "Ev" columns); `q2` s4 and `q8` s1 are experiments, not sorts of printed labels; no dial has a setting at an answer. |

## 8. Phases and checks

Phase 1 planners + Node checks → Phase 2 `q6-stoich` end to end → Phase 3 remaining benches (`q2`, `q3`, `q4`, `q5`, `q7`, `q8`) → Phase 4 boss + world → Phase 5 audit (`docs/kettle-audit.md`) → Phase 6 close-out. Each phase ends green and committed on `world/unit07`.

## 9. Build record

(Filled in as the build lands.)


---

## 10. Builder Brief & Bench Build Records

### 10.0 Builder Brief
# Kettle: how to build one bench (brief for a builder)

You are building ONE bench of Kettle (`unit07`, stoichiometry and reactions) in Avalon, a browser chemistry game for students aged 12 to 17. The slice, `q6-stoich`, is built,
played and green: copy its pattern, do not reinvent it. You work in your OWN git worktree (the directory and branch are in your prompt). The integrator merges your branch.

## Ground rules

- **Work only in your worktree directory** (use absolute paths). Commit on your branch with explicit paths (`git add <files>`, never `git add -A` or `git add .`). **Never push.**
  End commit messages with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Untracked Mirrowen copies may sit in the tree: never add them.
- **Do not use the browser** (Browser pane, Chrome, Playwright, a dev server). The integrator plays the benches by hand. You verify with Node scripts only.
- **Do not edit** `PRODUCT.md`, `CLAUDE.md`, `package.json`, `docs/plans/kettle-world.md`, `src/learn/table/kits/pot.js`, `pot-draw.js`, `pot-registry.js`, `pot-reactor.js`, `pot-read.js`, another bench's files,
  or `tools/verify-*.mjs` (except where this brief says). If you need a shared change, make it opt-in inside your own file; if you cannot, say so in your report.
- Chemistry must be accurate: simplify freely, say nothing false. Every number a player sees comes from `src/learn/engine/reactdata.js` (add to it ONLY with a new exported function, never change an existing one;
  prefer your own data file `src/learn/engine/reactdata-<name>.js`) and is held in Node to a value worked by hand (`tools/lib/kettle-data-checks.mjs` shows the style: literals worked on paper, never the code under test).
- Never delete code. Run `node tools/verify-learn.mjs`, `node tools/verify-table.mjs`, `node tools/verify-story.mjs` often (seconds). `verify-docs` fails on counts until integration: ignore it.

## Read first (in this order; read big files in chunks)

1. `PRODUCT.md`: "Building a Learn world" sections 3, 4 and 5 (the bench contract, how to design a stage, the pitfall ledger: every row is a defect that was built) and principles 1 to 22.
2. `docs/plans/kettle-world.md`: sections 0, 2 and 7, and the section of YOUR bench in 3 (it is thin for some benches: YOU write the full stage table, see item 11).
3. The slice: `src/learn/quests/unit07/q6-stoich.js` (stages, `SOLUTIONS`, `MISSES`, `NOTES`, `CHECKS`, predict pair, typed figures), `src/learn/table/kits/pot-reactor.js` + `pot-read.js` + `pot-draw.js` + `pot.js` (pieces, fixtures, painters, Tour words),
   `tools/lib/kettle-learn-checks.mjs` (the verifier pattern), `src/ui/story-scenes-kettle.js` and the entries in `src/story/quest-story.js` (the story pattern), `src/learn/quests/_template.js`.
4. The heat kit your kit extends: `heat.js`, `heat-draw.js`, `heat-read.js` (plaque, marker, selector, rail, note, tag, stmt, num, chip, eqn and shift cards are yours to use). How a table is graded: `src/learn/table/model.js` (actions `place`, `setDial`, `run`, `type`), `engine/stagerunner.js`.
5. `docs/plans/learn-quests.md` World 7 (your bench's brief) and, if you need CED wording, `docs/ap-chemistry-course-and-exam-description.pdf` (read by page range; the Unit 4 topics are 4.1 to 4.9).

## What a finished bench is (every item, no stubs)

1. **The quest module** `src/learn/quests/unit07/<questId>.js` copied from the pattern: `meta.stageCount` (8), `STAGES`, `SOLUTIONS`, `MISSES` (one plausible wrong answer per stage, each refused with a reason that names what the table shows and never the rule or the answer), `stateFor`,
   `mount` (pass `room: ROOM` with `export const ROOM = 'foundry'`), `VOCABULARY` (term to the stage whose reward card defines it), `BUILDS_ON` (real built quest ids only; use `unit07/q1-recipe` and `unit07/q6-stoich` only if you truly use their words), `DEBRIEF`, `CHECKS`. No `PRACTICE`. No XP calls.
2. **Stages**: 8 (stage 8 normally a sealed sample). Each: a prompt (ONE sentence, at most 25 words, no "!", objective never route), exactly three hints (one sentence each: which control / what to look at or compare / the method, never the answer or the arithmetic), a reward card (1 to 3 sentences, about 45 words, real terms), and a `check` returning
   `{ ok }`, `{ ok:false, notYet:true, msg }` for a blank bench, or `{ ok:false, msg }` naming what the table shows. A predict stage (`predict: true`) shows ONLY the question and the guess cards (no instrument, no runnable control) and its `onClear` calls `remember`; the next stage's `prompt` and `reward` are getters that call `recall`. Predict only on the bench's click and on a new case.
   One decision per stage. Numeric stages follow the quantity ramp (picture, prediction, proportional, formula as shorthand, friendly numbers, then a figure PAST the dial's range, typed: `entry: { id, label, unit }`, `entryNumber`); slips are kept as refused answers in `MISSES`. A typed stage needs a picture behind it.
3. **Discover it, never read it off.** Nothing on the bench prints the answer, the capacity or the rule; if a student could answer by looking at the table, rebuild the stage around an instrument. No sort of printed facts, no hunting a dial until a readout goes green, no plug-and-chug with every constant printed. **Never print a number that equals the stage's answer** (q6 once printed a molar mass equal to its answer).
   Plain labels until the word is earned; every term is defined by an earlier reward card (list it in `VOCABULARY`; nothing unearned appears in a prompt, hint, plate or caption: `verify:learn` and `verify:story` check). The Tour replaces briefings: do not add a `briefing`.
4. **The kit part**: your instruments and pieces live in your own file `src/learn/table/kits/pot-<name>.js` (a stub is waiting, already imported by `pot.js`). Register with `registerFixture(kind, { paint, run, dress3d?, settle? })` and `registerPiece(kind, { kind: {r, rect, nojoin: true}, paint, faceKey, piece3d?, printed? })` from `pot-registry.js`.
   Export builder functions (`xxxFixture(id, at, opts)` returning `{ fixture, slots, size }`) and piece constructors, and re-export them from your quest through `pot.js`-independent imports (import from your own kit file). A painter is a pure function of the table state: it prints what the planners say and never decides. Painted text is 6 px or larger; nothing is painted under a knob, rail post, rim, glass, or the Run key
   (the engine puts the key at the fixture's bottom right: leave a 7-unit strip). Fixtures with dials leave the dial rows free (`topOf`/`contentTop`). A card is at least as tall as a tray's cell. **Option objects silently drop keys they do not list: pass every option through and check it reached the drawing.** Every drag has a two-tap twin (the engine gives it for free for pieces in slots, trays, rails).
   Add Tour words for EVERY new fixture and piece kind with `addTourText({ 'pot:<kind>': { title, dials: false, text } }, { <pieceKind>: [title, text] })` at the bottom of your kit file: three beats (what it is, what to do with it, what it tells you), plain words, no unearned term, never which move solves the stage; a text must name a control exactly as it is labelled on the table.
   Build a `dress3d`/`piece3d` solid only if cheap and clearly correct; the flat picture must be complete without it (`3D Off` draws the same picture).
5. **Data**: planners are pure and Node-importable with the source in the header; check each in Node against values you work by hand. Add your checks to a new file `tools/lib/kettle-<questId>-checks.mjs` exporting `async function check({ near })` that returns a list of problem strings (it is loaded automatically by `kettle-learn-checks.mjs`): recompute every graded figure from an INDEPENDENT literal, replay the pot/instrument on the real table through `stateFor` scripts, assert no plate or jar prints a number equal to an answer, no dial stands at an asked amount, a blank table never passes, each predict stage shows no instrument, and no refusal carries the method (`METHOD` regex style in `kettle-learn-checks.mjs`).
6. **The chart**: in `src/learn/worlds/unit07-stoichiometry.js` flip YOUR quest only: `status: 'live'`, `module: () => import('../quests/unit07/<id>.js')`.
7. **The bank**: `src/learn/bank/unit07.json` gains `bench.<questId>.problems` (exactly two multiple-choice problems after the debrief, ids `<questId>#b1`, `#b2`), and, if the bench is computational, `bench.<questId>.worked` (4 to 8 steps, number steps carry a `calc` expression the checker recomputes; id `<questId>#w`). Edit the JSON with a short Python script that loads, adds only YOUR keys and dumps with `ensure_ascii=False, indent=2`.
8. **Lead line**: add `'<questId>': { 1: '...' },` to `src/learn/engine/stage-story.js` under the Kettle block (one sentence, at most 20 words, only earned words, a stake rather than a task, none on a boss).
9. **Story animation**: your painter(s) go in `src/ui/story-scenes-kettle-<q#>.js` (a stub is waiting and is already spread into `KETTLE_SCENES`; export the `Q#_SCENES` object). Painters take `(ctx, w, h, t, clock)`, draw on a 960 x 540 plate with `story-kit.js` as `story-scenes-kettle.js` does, and **every number on screen is counted or computed from what is drawn or from the planners, never typed**.
   Add `'unit07/<questId>': { scene, beats: [{to, say} ...3 to 5], filed: 'Filed: ...' }` to `src/story/quest-story.js` (Kettle block). A beat is at most 2 sentences and 36 words; `filed` is one sentence of at most 24 words that moves the case against the Fifth on (the thread is the forged production ledger: fifty tons of metal from forty tons of ore); every word must be earned by your bench's last reward card and none introduced by a later bench.
10. **Reward models**: only if the idea is spatial and the existing `reward.model` machinery shows it honestly; otherwise none.
11. **The design file**: write `docs/plans/kettle-<questId>.md`: per stage the prompt, the evidence on the bench, everything the bench prints and why none of it is the answer, the wrong answers and the message each gets, the three hints, the reward, flat or 3D and why, the ramp rung for numeric stages; the click and the wrong model students hold; what is weak.
12. **Layout**: the table is 150 x 64 units. A fixture is `at` its centre. Keep jars/cards on a grid at least 60 units from stranger pieces for drag-safety where they could join (nothing joins in the pot kit). `verify:table` fails any overlap, a how-to line (`applyNotes`) with no clear strip, a tool with no Tour step. After building run it and fix every failure.

## Lessons from the slice (all of these were defects)

A reactor panel too short so the Run key sat on it; a balance title hidden by its readout; a jar helper that silently dropped the `pure` option (caught by the independent weighing check); a typed answer that equalled a printed molar mass (copying a plate); a Tour sentence that named a dial by a label it did not carry;
a refusal that would have named the method. Check each of these on your bench. A stage must be passable by someone who does not already know the answer and not passable by copying a number, matching a printed fact, or a 50 % guess.

## Before you report

Run `node tools/verify-learn.mjs`, `node tools/verify-table.mjs`, `node tools/verify-story.mjs` (your quest must appear in each and pass). Commit. Report: files changed, the stage list with each answer, what you verified in Node, what is weak, and every stage you want the owner to play. Be honest about anything you did not check.


### 10.1 Bench 2 (`q2-names`) Build Notes
# Kettle bench 2: `q2-names` (Names and Formulas)

Status: design written before the code (2026-10-30, branch `world/unit07-q2`). The quest module, kit (`pot-names.js`), data (`reactdata-names.js`), checks and story hold the facts; this file holds the reasoning.

**CED honesty.** Names and formulas are not a CED topic; every AP unit assumes them (the chart and `docs/AP-coverage-audit.md` say "assumed"). The bench says so in the chart line only; nothing on the bench claims exam coverage.

**The setting.** The labelling shed of the foundry. Crates carry labels nobody can read; the player writes the labels. Lead line: *The foundry's crates carry labels nobody can read.* Filed: the manifest's ore is iron(III) oxide, Fe2O3 (so it is a compound with a fixed share of metal).

**The clicks.** (1) "A formula is the symbols side by side, one of each" (MgCl, AlO). Predicted on stage 1, tested on stage 2 in a cell whose needle reads the charge. (2) "The Roman numeral is the subscript" (FeO would be iron(I), Fe2O3 iron(II)): the numeral is the charge of one iron ion, and the cell's needle shows what the oxide ions add to.

**Deviations from the seed table (and why).** The seed's eight stages become: a predict/test pair on the click (stages 1 and 2, as the doctrine asks), naming with -ide (3), the numeral (4), the dissolving experiment merged with formula writing (5: the four-salt sort became a two-sample experiment whose answer is a written formula, so the polyatomic ion is discovered and used in one stage), prefixes (6), acid names (7) and a sealed crate (8). Stage count stays 8.

## Kit (all in `pot-names.js`, names chosen not to collide with Tallow's `ion`/`needle` or Optics' `cell`)

- piece `ionchip` (a square slab with a round ion drawn on it; a polyatomic ion is its atoms joined inside one outline). It may hide its charge.
- fixture `ionneedle` (a charge needle reading one tray: the sum of the charges PRINTED on the pieces in it; a piece that hides its charge adds nothing). A cell is a plain tray plus this gauge.
- fixture `labeler` (backdrop): a label strip with N slots; frame words printed round the slots (e.g. "iron ( ) oxide"). It reads what stands in the slots and prints the label it spells.
- fixture `window` (backdrop, has a Run key "Dissolve" or "Look"): one seat for a crate; Run draws what is in the water (atoms labelled, a polyatomic ion joined) or the molecule's atoms. A crate is a piece `crate` (a box with a printed name or none).
- Name tiles are the heat kit's `tag` cards; formula tokens are `chip` cards.

All readings come from `reactdata.js` (`IONS`, `ionicFormula`, `netCharge`, `nameIonic`, `nameMolecular`, `nameAcid`, `parseFormula`) and `reactdata-names.js` (ion atom layouts, molecule atom layouts, salt and crate tables, token joining).

## Stages

Answers are in the quest's `SOLUTIONS`; every refusal names what the table shows and never the rule or the answer.

1. **Predict** (`s1-predict`): choose the formula for Mg2+ and Cl-. Cards MgCl, MgCl2, Mg2Cl, Mg2Cl2, Mg3Cl2 and a slot; no instrument. Never graded; recalled by stage 2.
2. **Build the group** (`s2-group`): a supply tray (3 Mg2+, 5 Cl-) and a cell with a needle. Answer: 1 Mg and 2 Cl in the cell. Prints: disc charges, the needle total; never a ratio. Slip: 1 Mg + 1 Cl ("The needle reads +1 with 1 Mg and 1 Cl in the cell"); 2 Mg + 4 Cl ("The needle reads 0, and the cell holds one group twice"). Earns *ionic formula*. Flat. Ramp: picture.
3. **Name the compound** (`s3-ide`): a cell holds Mg2+ and O2-; labeler with two slots; tiles sodium, magnesium, chlorine, chloride, oxygen, oxide. Answer: magnesium oxide. Plate: an example (K+ with Br- is potassium bromide), the convention. Slip: "magnesium oxygen" ("The label has the element name oxygen; the cell holds an O disc that carries 2-"). Earns *naming ionic compounds* (-ide).
4. **The numeral** (`s4-numeral`): two cells, FeO and Fe2O3, the Fe chips hide their charge, each needle adds the printed charges (-2, -6); a labeler per cell with one slot in "iron ( ) oxide"; tiles (I)-(IV). Answer: (II) and (III). Slip: (I) and (II) (the count of iron in the cell). Earns *Roman numeral*.
5. **Write the formula** (`s5-dissolve`): two crates (A holds NaCl, B holds Ca(NO3)2) go in the window, Dissolve shows what is in the water; the formula of crate B is written with chip tokens in a row of slots. Answer: Ca ( NO3 ) 2. Slips: CaNO32 (no brackets), CaN2O6 (atoms apart). Earns *polyatomic ion*.
6. **Name the molecule** (`s6-prefix`): crate A (printed "carbon dioxide" = CO2) and crate B (N2O4) in a window that draws the molecules' atoms; a labeler with four slots (prefix, element, prefix, ending); plate of prefixes. Answer: dinitrogen tetroxide. Slips: "nitrogen tetroxide" (no first prefix), "dinitrogen dioxide" (counted the wrong atom). Earns *molecular prefixes*.
7. **Acid names** (`s7-acid`): two cells (H+ with Cl-, H+ with NO3-), a labeler each with one slot in "( ) acid"; plate with two examples (hydrobromic, sulfuric). Answer: hydrochloric, nitric. Earns *acid names*.
8. **The unmarked crate** (`s8-sealed`): a crate with no label in the window (Dissolve): 2 Fe with hidden charge and 3 SO4 groups carrying 2-; plate of polyatomic names; labeler with three slots (metal, numeral, ion). Answer: iron(III) sulfate.

## Weak points

Naming is convention, so the rule is printed on the object (an example or a prefix plate); the discovery is only in what to apply it to (the charge arithmetic, the atom counts, which ions are joined). Stage 6 is the weakest: counting atoms in a picture is reading, kept because the prefix IS the count. The numeral stage hides the iron charge but the oxide charge is printed, so the arithmetic is two steps.

## Build record (as built)

- Files: `src/learn/quests/unit07/q2-names.js`, `src/learn/table/kits/pot-names.js`, `src/learn/engine/reactdata-names.js`, `src/ui/story-scenes-kettle-q2.js` (scene `crate-labels`), `tools/lib/kettle-q2-names-checks.mjs`; edits to `unit07-stoichiometry.js` (live), `stage-story.js`, `quest-story.js`, `bank/unit07.json` (`bench.q2-names.problems`, two items; no worked problem: the bench is not computational).
- Layout as built: stage 2 has a supply tray and a cell with a needle; stages 3 and 7 need no needle (the chips print their charges and the ions are the evidence); stage 4 carries the convention ("the number in brackets is the charge of one iron ion") as a printed how-to line, because it is how to answer, not which move solves; stage 5's formula strip has five slots with six cards (one spare); the cards for stages 5, 6 and 8 start in a tray so the 150 x 64 table stays clear.
- Piece and fixture kinds are `ionchip`, `crate`, `ionneedle`, `labeler`, `window`; the names `ion`, `needle` and `cell` are not used because Tallow's atom kit, Tallow's tour and the optics kit already own them. Every piece is a rectangular slab so it builds as a card at `3D On`; there is no `piece3d`/`dress3d`, so `3D Off` and `3D On` show the same picture.
- Tour: pieces `pot:ionchip`, `pot:crate`; fixtures `pot:ionneedle`, `pot:window`. The `labeler` is a backdrop with no key, so the Tour skips it (as it skips the slice's balance: `tour.js` passes over a backdrop fixture with no key and no dial); the slots are explained by the how-to lines and by the card and chip steps.
- Graded by: stage 1 a card in the slot (never graded); 2 chips in the `cell` tray; 3 to 8 the words in the label's slots read in order (`labelWords`), compared with `nameIonic` / `nameMolecular` / `acidWord` / `ionicFormula` and the `spell` of the formula cards.
- Checks (Node, independent literals): the graded names and formula, the roman numerals, the needle on every table the stages build (stage 2 four ways, stage 4 -2 and -6, hidden iron adds nothing), the atoms each window draws, the predict stage holds no instrument, a blank table never passes, no plaque prints an answer, no refusal carries the method or the answer.
- Words printed that are, strictly, answer material and why they stay: the cards and chips carry the candidate words (a naming bench has to offer words); stage 6's plaque pairs each count word with its number and stage 8's plaque lists ion names (SO4 is sulfate), because both are conventions that cannot be discovered; the discovery left is which tile fits (the charge arithmetic, the atoms drawn, which atoms are joined).


### 10.2 Bench 3 (`q3-change`) Build Notes
# Kettle `q3-change` — Physical or Chemical (CED 4.1, 4.4)

Status: built on branch `world/unit07-q3`. Files: `src/learn/quests/unit07/q3-change.js`, `src/learn/table/kits/pot-change.js`, `src/learn/engine/reactdata-change.js`,
`src/ui/story-scenes-kettle-q3.js`, `tools/lib/kettle-q3-change-checks.mjs`, plus the chart flip, the bank (`bench.q3-change`), the lead line and the story entry.

## The click and the bench

Students hold "burning loses mass". The bench shows three things the belief misses: an OPEN pot of burning steel wool GAINS mass (iron takes oxygen from the air,
4 Fe + 3 O₂ → 2 Fe₂O₃: 55.8 g becomes 79.8 g, +24.0 g), an open pot of burning wood loses mass (carbon dioxide and water vapour leave), and a SEALED pot weighs the same
before and after in both. Words earned: **physical change**, **chemical change** (stage 1), **evidence of reaction** (stage 2). `conservation of mass` is q1-recipe's (`BUILDS_ON`); stage 6
uses it on a whole pot. Lead line: *The forged ledger says metal came from nowhere, and Vess wants to know whether anything can.* Filed: a sealed pot weighs the same before and after, so the ledger's extra
metal came from somewhere.

## Instruments (`pot-change.js`, all numbers from `reactdata-change.js` `planChange`)

- **Pot** (`changepot`): a seat for a sample jar (or one change fixed on the pot), an optional "Lid" dial (Open / Sealed), an optional amount dial, a "Run" key and a window:
  one disc for each `unit` moles, what stands in the pot BEFORE on the left, AFTER on the right (a gas an open pot loses is drawn in grey, marked "out"; oxygen the open air supplies is drawn after the run
  as "+O₂"). The foot prints SEALED or OPEN TO AIR, IN WATER, and the disc size. Run is a set-up lookup: a different jar, lid or amount is a new set-up and reads "press Run" again.
- **Balance** (`potscale`): weighs the WHOLE pot (its own weight left out, jar weights never counted): a BEFORE line and an AFTER line (after only once the pot is run). A sealed pot counts the oxygen sealed in with it.
- **Lamps** (`evidence`): gas given off, new colour, solid forms, temperature change. Dark until a run; then lit only by the planner. No lamp says "chemical".
- **Sample jar** (`cjar`): names what it holds and what is done to it ("Steel wool / burned"); in stage 8 it is "Sample A/B/C" and prints nothing else.

## The planner (`planChange(id, { sealed, scale })`)

Eight changes. Physical: ice melts (18.0 g), sugar in water (17.1 g in 90 g), salt in water (11.7 g in 90 g, drawn as its two ions held in the crystal and then in the water), dry ice warming (44.0 g). Chemical: sugar heated
(C₁₂H₂₂O₁₁ → 12 C + 11 H₂O(g), 34.2 g), steel wool burned (4 Fe + 3 O₂ → 2 Fe₂O₃, 55.8 g), magnesium burned (2 Mg + O₂ → 2 MgO, 24.3 g), wood chips burned (C₆H₁₀O₅ + 6 O₂ → 6 CO₂ + 5 H₂O, 16.2 g).
Products are `reactPlan`; a gas leaves an open pot and stays in a sealed one; an open pot takes its air reactants (O₂) in plenty, a sealed pot holds the amount sealed in with the sample.
Lamps: gas = a gas stands in the pot (or has left it) that was not a gas before; colour = a colour stands in it that was not there; solid = a solid stands in it that was not there; temperature = the change gives out or takes in at
least 2 kJ for the amount in the pot (a change the pot's heater drives, heated sugar, reads no temperature lamp). Heats of change are listed in the planner's header with their sources. A new substance = a species (by formula,
a salt's ions counting as the salt) in the pot after that was not before.

**Simplifications, said honestly:** wood is drawn as cellulose C₆H₁₀O₅ burning completely (real wood leaves ash; the open pot reads 0.0 g after); rust and the iron oxide of burning wool are Fe₂O₃; heated sugar is C₁₂H₂₂O₁₁ → 12 C + 11 H₂O
(a real caramel also loses volatile oils); a sealed pot is large enough to hold the oxygen the burn takes (the foundry's charging pot); the pot's heater is not modelled.

## Stages

Mode: **flat** everywhere (a window of discs, a balance and lamps are flat pictures; there is no spatial idea to stand up, so no `dress3d`/`piece3d` was built; `3D Off` draws the same thing). Ramp rung marked R.
Every stage: reward 1 to 3 sentences, hints three rungs (rung 1 names the control, 2 what to compare, 3 the method), refusals name what the table shows.

| n | Prompt | Evidence on the bench | Printed, and why none of it is the answer | Slip → refusal | Reward (idea) |
| --- | --- | --- | --- | --- | --- |
| 1 | Sort the four changes by whether a new substance is in the pot afterwards. | pot, window, jars Ice (melts), Sugar (in water), Sugar (heated), Steel wool (burned), trays "Same substance after" / "New substance after" | jar names and what is done to them; nothing about the result. The window is read after a run. | a physical change filed "new" → "Ice: the window shows H₂O before and H₂O after; lit: Temperature change." (the facts, not the rule) | **physical change**, **chemical change** |
| 2 | Pick the change that lit a lamp without making a new substance. | pot, window, four lamps, jars Dry ice, Wood chips, Steel wool, Sugar (in water); slot | Dry ice and wood chips light the SAME two lamps (gas, temperature); only the window tells them apart. | wood chips or sugar → their window and lit lamps | **evidence of reaction** (a lamp is evidence, not proof) |
| 3 | PREDICT: Choose how an open pot of steel wool weighs after the wool burns, compared with before. | only a plaque (open pot, steel wool 55.8 g), three chips, a slot | no instrument, no runnable control | — (a guess is never graded) | the guess is locked (`remember`) |
| 4 | (getter) Lay the chip for what the balance shows after the steel wool burns in the open pot. **The click.** | pot, window, balance, wool jar, three chips, slot | balance prints BEFORE only until run | "Lighter" or "The same" → "The balance read 55.8 g before and 79.8 g after." | an open pot gains: iron took oxygen from the air |
| 5 | Sort the three burns by whether the open pot weighs more or less afterwards. | pot, window (grey "out" rows for gas that left), balance, jars Steel wool, Magnesium, Wood chips, trays | no verdict printed | wood filed "more" → "Wood chips: the balance read 16.2 g before and 0.0 g after." | what crosses the lid decides |
| 6 | Type what a sealed pot weighs after 83.7 g of steel wool burns in it, with 36.0 g of oxygen sealed in. (R: picture, friendly numbers, then a figure PAST the dial) | pot with Lid and "Steel wool" dial (11.2, 22.3, 33.5 g), window, balance; typed figure | the prompt's 83.7 and 36.0 are inputs; 119.7 is printed nowhere; no dial stands at 83.7 | 83.7 → "83.7 g is the steel wool alone; 36.0 g of oxygen was sealed in with it."; other → the sealed pot's own before/after readings | **conservation of mass** applied to a whole pot (119.7 g) |
| 7 | Pick the change after which the pot holds the same particles it began with. | pot, window, jars Salt (in water), Wood chips, Steel wool, Magnesium; slot | the window shows Na⁺ and Cl⁻ in the crystal and again in the water | a burn → its window and lit lamps | dissolving a salt is classed as physical; the AP course notes a case can be made the other way because ionic bonds break |
| 8 | Sort samples A, B and C by whether a new substance forms in the sealed pot. | sealed pot, window, lamps, jars Sample A (wood chips), B (dry ice), C (ice); trays | jars hide what they hold; A and B light the same gas and temperature lamps | any wrong tray → the sample's window and lit lamps | a lit lamp is evidence; a new substance is proof |

Hints, prompts and rewards are in the module. No stage's check requires a run (a player who knows the answer is never blocked); a refusal before a run says the pot has not been run.

## Weak points, honestly

- Stages 2 and 7 are one-of-four picks (25 % blind). Stages 1, 5 and 8 are sorts (1/16 and 1/8 blind). All of them are decided by running the jars and reading the window.
- Stage 7 is the easiest stage: three decoys are plainly burning. The nuance (the AP course accepts an argument either way) is in the reward, not in a decision the table could grade.
- Stage 5 leaves an open wood pot reading 0.0 g after (complete combustion); it may read as "matter destroyed" until the grey "out" rows are noticed. Stage 6's typed figure is an addition, honest as a conservation check but not hard.
- The temperature lamp is a rule on the size of the heat (2 kJ), with heats from the formation table or the CRC; the lit/dark outcome for each change is checked, the exact kJ is not shown.
- The sealed pot for steel wool holds 24.0 g of oxygen (about 18 L): it is a big pot, which the bench never says.
- Window labels use formulas with state letters, (s) (l) (g) (aq), not explained anywhere on the table; the Tour text does not define them (the term "state symbol" belongs to q4-balance).
- Untested by hand: the 2D window's panel widths at 70 units, tray overflow when three or more jars go in one tray, the jar names at 6.2 px. Please play it.

## Verified in Node

`verify:learn`, `verify:table` (including "Predict first" and the Tour step per fixture and piece kind), `verify:story`, and `verify:quest-run` pass. `tools/lib/kettle-q3-change-checks.mjs` holds: the planner's weights, open and
sealed, for all eight changes against figures worked on paper; each change's four lamps and whether it made a new substance; dry ice and wood chips light the same lamps and differ in the window; the asked figure (83.7 + 36.0 = 119.7);
the pot, balance and lamps replayed through the real table (an after reading only after a run, a changed lid is a new set-up); blank benches never pass; the predict stage has no instrument; the hidden samples print nothing;
no plate or dial prints 119.7 and no dial stands at 83.7; every miss is refused with a reason that carries no method word and not the answer.


### 10.3 Bench 4 (`q4-balance`) Build Notes
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


### 10.4 Bench 5 (`q5-ionic`) Build Notes
# Kettle `q5-ionic` — Net Ionic Equations (CED 4.2) — design

Files: `src/learn/quests/unit07/q5-ionic.js`, kit `src/learn/table/kits/pot-ionic.js`, planner `src/learn/engine/reactdata-ionic.js` (on `reactdata.js` `planMix`, `solubility`; nothing there changed),
story painter `src/ui/story-scenes-kettle-q5.js` (`cloudy-pond`), checks `tools/lib/kettle-q5-ionic-checks.mjs`, bank `bench.q5-ionic` (two problems, no worked problem: not computational).

**The click.** Students hold "when two solutions are mixed, everything in them reacts" (and, extended, "no cloud means no reaction"). Stage 2 puts that model on the table as cards
("No ions are left in the water"), stage 7 attacks the extension (clear solutions that still react).

**The kit.** The pot (`ionpot`) pours two solution jars together with just enough of each that neither is left over (`mixUnits`), so the water afterwards holds exactly the spectators.
Its WINDOW draws BEFORE (jar 1's ions on the left half, jar 2's on the right) and AFTER (ions still dissolved, loose; ions that left the water packed together at the bottom), one disc per ion with its charge printed
and a key under BEFORE. Its LAMP has two bulbs whose brightness is the number of dissolved ions / 8 (no number printed). The FILTER lifts the solid onto a paper. All of it is `mixOutcome`; painters decide nothing.
Equations are built from **counted ion pucks** (one puck per ion, so a coefficient is a count of pucks) and **formula chips** (`PbI₂(s)`). Pucks are 12.6 units across (the 28 px finger floor at 340 px).
Flat only: the picture is complete and no `dress3d`/`piece3d` was built (3D On falls back to the kit's default pieces and the flat fixture picture).

Words earned: precipitate (1), spectator ions (3), net ionic equation (4), solubility rules (6), complete ionic equation (8). `BUILDS_ON`: `unit01/q4-ledger` (ion, cation, anion).
Deviations from the seeds: the FILTER is on stage 1 only (on stage 3 the window already separates dissolved from packed ions, so a filter key would be a control the answer does not use);
stage 5/6 became predict then test of the four always-soluble ions (the seed's "predict three mixtures" would need a third predict/test pair and drop the acid-base stage); stage 8 asks for the
complete ionic equation only (the net ionic equation is stage 4's skill and the molecular equation is balancing's, `q4-balance`, so three slots would be three decisions).

## Stages

| n | Prompt | Evidence on the bench | Printed (and why not the answer) | Wrong answer and its refusal | Idea · mode |
| --- | --- | --- | --- | --- | --- |
| 1 | Pour the two solutions together and collect on the paper what forms. | Pb(NO₃)₂ and KI jars, pot (glass goes cloudy), filter paper | jar formulas and names; the glass says CLOUDY/CLEAR | mixed, not filtered → "The glass of the pot is cloudy and the paper is still empty." (blank: not yet) | precipitate · flat |
| 2 | PREDICT: Choose which ions are still in the water after the lead nitrate and potassium iodide solutions are mixed and the cloud settles. | none: five cards and a slot | cards only | none (never graded; held model = "No ions are left", "All four ions") | the click |
| 3 | Put in the tray each ion that is still dissolved in the water (the prompt quotes the player's guess). | pot, window, lamp (7 → 4 ions), four ion pucks | window discs and key; bulbs without numbers | all four in the tray → "There are no Pb²⁺ discs loose in the water of AFTER."; short → "AFTER still shows K⁺ discs loose in the water, and the tray has none." | spectator ions · flat |
| 4 | Build the equation for only the ions that reacted. | pot + window, seven counted pucks, three formula chips, tray + "Solid formed" slot | window; nothing of the equation | K⁺ in the tray → "K⁺ is in the window both before and after."; one I⁻ → "2 I⁻ discs left the water, and the tray holds 1."; wrong chip → "The packed discs at the bottom of AFTER do not match the chip in the slot." | net ionic equation (counts: 1 Pb²⁺, 2 I⁻) |
| 5 | PREDICT: Choose the ions you think stay in the water, whatever solution they are mixed with. | eight pucks (Na⁺ K⁺ NH₄⁺ NO₃⁻ Ag⁺ Pb²⁺ Cl⁻ SO₄²⁻) and a tray | pucks | none | new case |
| 6 | Put in the tray the ions that stayed in the water in every mixture (quotes the guess). | pot with a "Mixture" dial of four ready mixtures (AgNO₃+NaCl, Pb(NO₃)₂+K₂SO₄, NH₄Cl+KNO₃, (NH₄)₂SO₄+NaCl), window, eight pucks | formulas of the two jars | Cl⁻ in the tray → "Cl⁻ was packed into a solid in mixture 1."; a mixture not run → "Mixture 3 has not been poured together yet." Cl⁻ and SO₄²⁻ stay dissolved in two mixtures each, so a halide/sulfate shortcut fails | solubility rules |
| 7 | Build the equation for only what reacted when these two clear solutions were mixed. | HCl + NaOH jars, window (H₂O drawn as a new particle), lamp 4 → 2 (dimmer, not dark), pucks H⁺ OH⁻ Na⁺ Cl⁻, chips H₂O(l) and NaCl(aq) | window | Na⁺ and Cl⁻ in the tray → "Na⁺ is in the window both before and after." | H⁺ + OH⁻ → H₂O; clear is not "no reaction" |
| 8 | Build the equation for the sealed jars with every dissolved ion shown, before and after the mixing. | Jar A, Jar B (AgNO₃, KBr, names hidden), window, six pucks, chips AgBr(s), KNO₃(aq), AgNO₃(aq), trays Before / After / Solid formed | window | Ag⁺ in the After tray → "Ag⁺ discs are packed together at the bottom of AFTER, not loose in the water."; counts → "BEFORE shows 4 discs, and the first tray holds 3." | complete ionic equation |

## Hints (three each, in the module) and rewards
Rung 1 names controls (`"Mix"`, `"Filter"`, `"Mixture"`), rung 2 says what to compare (BEFORE with AFTER, the bulbs), rung 3 the structure (an ion belongs in the tray only if…); none gives the answer.
Rewards: Precipitate; Spectator Ions (quotes the guess verdict); Net Ionic Equation; Solubility Rules; Clear Does Not Mean Nothing Happened; Complete Ionic Equation. Stages 2 and 5 are "Now Test It" prediction cards.
No ramp (nothing numeric is typed); the counts are the quantity ramp: pictures (window), prediction, counted pucks, new cases.

## What is weak (for the owner to judge)
- Stage 1 is an operating stage (mix and filter), easy by design; it earns a word.
- Stage 6 has a hunt of four dial settings, bounded, and the rule is induced from four mixtures (the reward states the AP rule).
- The window keeps discs of a jar to six per half; every case in the bench fits (checked in Node).
- Stage 4's solid chip choice (3 chips) is a 1-in-3 guess on its own, but passes only together with the exact puck counts.
- The lamp compares ion counts, not conductivities (charge and size ignored): fine for this bench, said nowhere.
- Pucks/chips at 3D On use the kit's default piece bodies; not looked at in the browser.


### 10.5 Bench 7 (`q7-titrate`) Build Notes
# Kettle `q7-titrate` — Titration (CED 4.6): design record

Built on branch `world/unit07-q7`. Files: `src/learn/quests/unit07/q7-titrate.js`, kit `src/learn/table/kits/pot-titrate.js`, planners
`src/learn/engine/reactdata-titrate.js` (on `titrate` and `indicatorColour` in `reactdata.js`, which are unchanged), checks
`tools/lib/kettle-q7-titrate-checks.mjs`, story painter `src/ui/story-scenes-kettle-q7.js` (`burette-count`), entries in `quest-story.js`,
`stage-story.js`, `bank/unit07.json`, and the chart. No pH value is shown anywhere; a plot is not drawn.

## The click

Students hold "an acid takes an equal volume of base". Stage 1 offers it as a card (25.0 mL) beside 5.0, 10.0 and 62.5 mL; the case
(25.0 mL of 0.100 mol/L acid, 0.250 mol/L base) needs 10.0 mL. The H2SO4 stage (5) contradicts "one for one" a second time.
Prediction pair: stage 1 (no instrument) then stage 2 (the burette). The guess comes back in stage 2's prompt and reward.

## The kit

`titrator` fixture: a burette (tube, 0 to 50 mL scale, level, strength printed, "reading" = total let out), a "Per press" dial (mL one press
lets out; settings differ by stage), a key "Open Tap", a flask under the tip drawn in the planner's colour with its colour word, a slot for a
dye card beside it, and an optional window of discs (H+ and OH- still free, one disc a printed number of mol, a half-filled disc for a half).
The burette only gives out (each press is a recorder row, `x` = the total); Undo is the way back; it holds 50 mL. `perm` mode is the
permanganate flask (no dye slot). `indicator` piece: a card with the dye's name and swatches of the colours it can show (no volume on it).
Flat only; no `dress3d`/`piece3d` (the picture is complete and honest; a solid burette was not cheap enough to be sure of).
Tour: `pot:titrator` and `indicator` (printed "Dye cards" because "indicator" is earned in stage 2; the fixture title is "Tube and flask" until
stage 3, "Burette and flask" after: option `named`).

## Planners (`reactdata-titrate.js`) and hand-worked values

`flaskAt(sys, v, indicator)`, `equivalenceMl`, `endpointMl(sys, indicator, step)` (first grid volume at which the dye differs from its colour at
0 mL), `acidMolarity`, `permanganateAt`, `permanganateEndMl`, `ironMolarity`. Paper values are in the header of the checks file
(eq 10.0 / 20.0 / 22.5 / 36.0 / 25.0 / 22.5 / 45.0 mL; first colour 10.5 / 23.0 / 36.5 / 23.5 (methyl orange) / 23.0 (purple) / 45.5 mL).

## Stages

Ramp: P picture, G prediction, R proportional, F formula as shorthand, N friendly numbers, T typed. "Prints" lists everything the bench shows
and why none of it is the answer. Every refusal names the burette's own reading (what the table shows), never the rule.

| n | Prompt | Evidence · prints | Slip → message | Hints (1 / 2 / 3) | Reward | Ramp · mode |
| --- | --- | --- | --- | --- | --- | --- |
| 1 predict | Choose how much of the base it takes to use up all the acid. | four cards (5.0, 10.0, 25.0, 62.5 mL), slot; plate: 25.0 mL of 0.100 mol/L acid, base 0.250 mol/L, what mol/L means, one base particle uses up one acid particle. No instrument. Constants only. | none: never graded (blank → "Lay a card in the slot") | the cards and slot / compare particles in a litre of each / work out the acid's particles then the base that holds that many | "Now Test It" | G · F |
| 2 | (You guessed X.) Add base until the dye in the flask first changes colour. | tube and flask, dye card, press dial 0.5 / 1 / 2 / 5 mL. Prints strength of base, volume of acid, the reading. The answer is a state (pink within 1.0 mL of the first change), not a number, and no setting equals 10.0 or 10.5. | 5 mL presses to 15.0 → "The flask had already changed colour before the reading reached 15.0 mL."; no dye → "has no dye in it"; colourless → "still colourless at X mL" | the card, slot, dial, key / watch flask and reading together / big presses then small | Titration (titration, burette, indicator earned); quotes the guess and 10.5 mL | P · 3 (flat) |
| 3 | Stop the burette where the base has exactly used up the acid in the flask. | window of discs (H+ 20 at the start, one disc 0.00025 mol = 1 mL of base), no dye; plate: 25.0 mL of acid, 0.200 mol/L. Discs, not numbers; the volume is never printed. Presses 0.5 / 1 / 2 / 5. | 20.5 mL → "The window shows 0.5 discs of OH- left over at 20.5 mL."; early → discs of H+ still shown | dial and key, watch window / compare H+ and OH- discs / count what is left, press that much | Equivalence Point | R · F |
| 4 | Type the concentration of the acid in the flask in mol/L. | burette (0.200 mol/L), flask 25.0 mL HCl, dye card; no window (the window would show the acid's amount). Acid 0.180 (hidden); eq 22.5, colour 23.0 gives 0.184: accepted 0.174 to 0.186. | 0.2 (equal strengths) → "0.200 mol/L does not follow from the burette: the flask first changed colour at 23.0 mL." | card, dial, key, then type / compare the reading at the change with the 25.0 mL / the base run in holds as many particles as the acid, find the acid's share of each litre | Counting Acid by Base | F · T |
| 5 | Type the concentration of the sulfuric acid in the flask in mol/L. | as 4; plate: each H2SO4 particle gives 2 H+. Acid 0.072; eq 36.0, colour 36.5 gives 0.0730 (one-for-one 0.146). Accepted 0.0695 to 0.0745. | 0.146 → same form, names 36.5 mL | card, dial, key / compare H+ per sulfuric particle with HCl's one / count base particles then share among the H+ of each acid particle | Two H+ for One Acid | F · T |
| 6 | Type how many mL the burette gives between the first colour change and the equivalence point. | window (25 discs, 0.00002 mol each), methyl orange card (red, orange, yellow swatches), acid 0.0200 mol/L, base 0.0200 mol/L. Dye goes red to orange at 23.5; discs match at 25.0; the answer is 1.5 (±0.3). Dilute on purpose: in 0.1 mol/L solutions the two coincide within a drop. | 0 ("the colour change is the match") → "0.0 mL does not match the readings: the flask first changed colour at 23.5 mL." | card, dial, key, window / note the reading at the first change and at nothing left over / small presses near each, then how far apart | Endpoint | T |
| 7 | Type the concentration of the Fe2+ ions in the flask in mol/L. | permanganate 0.0200 mol/L, 25.0 mL Fe2+ sample, no dye: pale to purple (purple means permanganate left over). Plate: the equation, "only the 5 to 1 count is used here", "purple needs no indicator" (the balancing is not asked; stated on the card). Fe 0.0900; first purple 23.0 gives 0.092: accepted 0.085 to 0.095. | 0.0184 (one-for-one) → same form | dial, key, type / first purple that stays / count permanganate, scale by the equation's count | A Dye of Its Own | T |
| 8 sealed | Type the concentration of the acid from the pickling bath in the sealed flask in mol/L. | as 4 with sulfuric acid 0.450, base 0.500: eq 45.0, colour 45.5 gives 0.455; accepted 0.438 to 0.462. No legend of 2 H+ is printed (transfer from stage 5). | 0.91 (one-for-one) | as 4, plus think H+ per particle | The Bath Is Counted | T |

The overshoot idea of the first draft is not a stage: it is the refusal form of stages 2, 3 and 4 (a reading past the change is named in the message).

## Words and story

Earned: titration, burette, indicator (2), equivalence point (3), endpoint (6). `BUILDS_ON`: `unit07/q6-stoich` (mole ratio, moles). Lead line: "Nobody at the foundry knows
how strong the acid in the pickling tank is." Story animation `burette-count`: drops of 0.5 mL are counted into the flask; base discs
(one per drop) and acid discs (planner) are counted against each other; the dye turns on the drop after they match; the strength is the printed
arithmetic on the counted volume. Filed: the pickling bath is 0.450 mol/L sulfuric acid, so the foundry's acid use can be checked against its ledger.
The bank has `q7-titrate#b1`, `#b2` and `#w` (5 steps with `calc`: sulfuric acid against sodium hydroxide, 30.0 mL).

## What is weak

- Stages 2 and 3 are, honestly, hunts: a titration is. Stage 2 is graded on a state and compared with the guess; stage 3 on the window. Neither has a number to copy.
- Stage 6 needs a dilute pair to make the gap visible on a 0.5 mL grid; the reward says why. It is a second reading subtracted from the first.
- Stage 5 states the 2 H+ on a plate (a fact about the acid, not the move); the discovery that the base doubles is by the typed figure being refused.
- Permanganate is simplified: pale versus purple only (the yellow of Fe3+ is ignored), acid taken as plentiful, and a faint pink counted as soon as any permanganate is left over.
- Flat burette; no solid at `3D On`. The stage-1 window of discs was kept off stage 4, 5 and 8 so it cannot show the unknown amount; those three rely on the colour alone.
- Burette holds 50.0 mL; a coarse run past it is refused with the mL left and the player uses Undo.

## For the owner to play

Stage 2 (the press dial and dye slot, and whether the colour change is readable), 3 (the window discs against the reading), 6 (the three-colour methyl orange and the two readings),
7 (the purple), 4/5/8 (typing from the first-colour reading), the Tour on stage 2 and 3, and the story animation.


### 10.6 Bench 8 (`q8-kinds`) Build Notes
# Kettle `q8-kinds` — Kinds of Reaction (CED 4.7, 4.8, 4.9)

Branch `world/unit07-q8`. Quest `src/learn/quests/unit07/q8-kinds.js`; kit `src/learn/table/kits/pot-kinds.js`; planners `src/learn/engine/reactdata-kinds.js`
(`reactdata.js` is untouched); story `src/ui/story-scenes-kettle-q8.js` (`furnace-log`); checks `tools/lib/kettle-q8-kinds-checks.mjs`.

## The click

Students hold **"a reaction is one kind only."** Stage 7 asks for the guess (four cards: three single kinds and "More than one kind", no instrument on the table);
stage 8 gives eight reaction cards and a "Look for" dial over five kinds. The dial remembers the light of each card per kind, so the same card can be lit under
several kinds. Magnesium burning is lit under synthesis, combustion and redox; the table refuses a card lit under one kind only by naming the reading it shows.

The five kinds are synthesis, decomposition, combustion, acid-base, redox (`kindsFull`). `reactdata.js` `kindsOf` is not used: it misses a metal burning, an
acid giving a proton to ammonia, and mis-reads a hydroxide's hydrogen. Combustion here is "a substance burning in oxygen": O₂ is a reactant and the reaction is redox,
so Mg + O₂ counts. Hydrogen burning would count too and is not on the log.

## Stage table

Dependencies: `unit07/q1-recipe`, `unit07/q6-stoich` only. **No precipitation stage:** the seed's stage 3 (file the precipitation reactions from `q5-ionic`) waited, since
`q5-ionic` is a separate build and this bench may not use a word earned only there. Its place became the prediction that opens the click (7 + 8). Precipitation is not one of
the five kinds on the board. The integrator may add it back as a new case once `q5-ionic` is merged.

| n | Prompt | Evidence on the bench | Printed, and why none of it is the answer | Slip → refusal | Ramp / idea |
| --- | --- | --- | --- | --- | --- |
| 1 | Put each pot in the tray that matches what the window shows. | window (pieces): six pots, dial + Run; atoms before and after | pot names and formulas under the atoms; trays named by what is seen ("Several become one") | Pot F (burning methane) in "Several become one" → "Pot F showed 2 substances before and 2 after, and it is in the tray…" | synthesis, decomposition |
| 2 | Burn the fuel, test the gas it leaves, and file what the burning made. | burner (methane jar, empty gas jar), gas rig with four tests (legend on the rig says what each test answers) | the legend says what a test does, never what the jar holds | Carbon filed with water, limewater never tried → "Carbon is in the tray, but none of the tests tried in the jar found it." | combustion |
| 3 | Put each pot in the tray that matches what the window shows. | window (proton): five pots; an amber ring marks a hydrogen ion only if one passes (acid + base) | formulas; the ring appears only after Run | Pot E (Mg with HCl: electrons, no proton) in the ring tray → names what the window shows after Run | acid-base reaction |
| 4 | Choose the particle that gave electrons and the one that took them. | window (electrons): Zn + CuSO₄; amber dots count the electrons from the oxidation-number change | the charges after each symbol; "2 electrons moved" is not the answer (the answer is who gave) | swapped → "Cu²⁺ has no dots before the reaction."; sulfate → "has no dots before the reaction or after it" | oxidation, reduction, redox |
| 5 | Type the number manganese carries in MnO₄⁻. | window (numbers): CO₂, NO₃⁻, SO₄²⁻ worked out; typed answer +7 is past every worked case | the rules plate (lone atom 0, oxygen −2, hydrogen +1, all together the charge); worked rows | 8 (charge forgotten) → "With +8 on manganese and −2 on each of four oxygens, all together is 0, and the ion's charge is −1." | oxidation number; ramp: picture (worked species), proportional-free, typed past the worked range |
| 6 | Name the gas in each sample jar. | gas rig + three sample jars (CO₂, H₂, O₂) + four names (nitrogen is the decoy) | the legend per test; samples named only A, B, C | CO₂ sample named hydrogen → lists what that sample's tests gave | gas tests applied |
| 7 | Choose what kind of reaction magnesium burning in oxygen is. (PREDICT) | none: equation plate, four guess cards, a slot | the equation only | — | the held model |
| 8 | Light each reaction card under every kind it belongs to. (prompt quotes the guess) | eight cards (equation + states only), "Look for" dial, a raw reading beside each card per kind | readings are raw: "2 in, 1 out"; "O₂ goes in"; "H⁺: HCl to NH₃" / "no H⁺ moves"; the oxidation numbers before→after. No card names a kind. | only Mg lit under synthesis → names the first reading it disagrees with | reactions overlap |

Hints (three rungs, one sentence each) and rewards are in the module. Mode: all flat; the idea is pieces, readings and counts, not shape or position, so no reward model.

## The eight cards of the log (hand-worked)

Zn + CuSO₄ → redox. 2 Mg + O₂ → MgO: synthesis, combustion, redox. HCl + NaOH: acid-base. CaCO₃ → CaO + CO₂: decomposition. CH₄ + 2 O₂: combustion, redox.
NH₃ + HCl → NH₄Cl: synthesis, acid-base. Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂: redox (the furnace log). 2 H₂O → 2 H₂ + O₂: decomposition, redox. Every kind lights on at least two cards.

## Story

Lead line: "Vess finds a furnace log that lists reactions nobody has named." Scene `furnace-log`: Fe₂O₃ + 3 CO, numbers from `oxNumbers`, six electron dots travelling from the
three carbons to the two irons; each atom's number moves one step per dot. Filed: the ore gave up its oxygen to carbon, so it was reduced, not made from nothing.

## What is weak

- Stage 1 and 3 are two sorts of the same mechanics (chips into trays after reading a window). They differ in the idea; an owner who finds them alike could merge 3 into 8.
- Stage 5 is arithmetic on rules; the worked cases are the picture, but it remains the closest thing to plate-and-type on the bench.
- Stage 8 prints a per-kind reading beside every card. The readings are raw (counts, oxygen side, the numbers), but "H⁺: HCl to NaOH" is close to the definition of acid-base.
- Combustion has no instrument of its own on the board beyond which side O₂ stands on; the heat and light are in the reward only.
- Marks per kind are kept by a kit `settle` hook reconciling `flipped` with the dial; if undo/redo in play drops a light, that is the place to look.
- Not played in a browser (by rule). The owner should play 1, 2, 4, 6 and 8.


---

## 11. Site rebuild (2026-11-13)

Branch `site/kettle`. Contract: `docs/plans/world-distinction-plan.md` (section 3 the standard, section 6 the row). This section is what the
build is audited against; its last part (11.10 onward) is the build record. It changes the 3D site only: no quest, stage, kit, bank entry,
glossary entry, story line, site id, quest id or bench label.

### 11.1 The place

Kettle is one ironworks building that the player walks into at the charge end and through to the furnace at the tapping end.
In the first ten seconds after landing the player is standing in a yard looking at the works' end wall, with one tall door in it, stoves and a
furnace top standing over its roof at the far end, and a slag tip to the west; through the door is a long crane aisle with the furnace mouth at
the end of it.

### 11.2 Signature (checked against every row of section 6)

| | Kettle | Nearest other row, and why it is not the same |
| :--- | :--- | :--- |
| Landform | One foundry building the size of the site, with floors at five levels inside it; a slag tip outside | Tallow's plant is several buildings on a flat; Quicklight is an outdoor refinery. No other row is one interior. |
| Walk shape | Up one crane aisle from the charge door to the cast house, with bays opening off it, two ramps up and two ramps down | Tallow walks a process line outdoors; Ligar is a hub with adits. No other row is a nave with side bays. |
| Bench housing | The building's own bays: a stores lean-to, the scale bay, a control cabin on a plinth, the sump cellar, the charge bank, the pickling bay, the tapping pit, the refining bay | Ligar's are rock chambers; Tallow's are separate buildings. |
| Light | Indoors under a cover mask: the hall is dim, shafts come through the clerestory and the door, the furnace's tap hole is the one fire | The built sky is kept outside. |

The row is built as written. One addition to it: a second closed heap outside (the ore stock at the east side), because a works that takes
charge needs one; it is not a third landform, it is the slag tip's counterpart.

### 11.3 Plan (x east, z south; metres; every rectangle on a 2 m grid)

The walk is the square of 100 m about the origin, as before. The landing pad stays at (56, 78) and the spawn at (0, 76), in the yard south
of the works. The building is a set of rooms (volumes) that meet at doorways; `src/three/kettle/works-plan.js` is the one declaration.

| Room | x | z | Floor | Roof over floor | What it is |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `nave` | -6 to 6 | -36 to 46 | 0 | 13 | the crane aisle; the charge door (8 m wide, 6 m high) is in its south wall |
| `cast` | -12 to 12 | -64 to -36 | 0 | 14 | the cast house in front of the furnace; the Golem's ground |
| `stores` | 6 to 28 | 28 to 44 | 0 | 5.2 | Bench 1; a lean-to on the east side |
| `scale` | -30 to -6 | 18 to 40 | 0 | 7.5 | Bench 2; the weighbridge bay |
| `lobby` | -30 to -6 | 6 to 18 | 0 | 6 | west aisle: doors to the nave and the scale bay, and the mouths of two ramps |
| `cabin-ramp` | -20 to -14 | -8 to 6 | 0 at z = 6, 1.2 at z = -8 | 5 | up to the cabin |
| `cabin` | -20 to -6 | -22 to -8 | 1.2 | 4.8 | Bench 3; control cabin on a plinth, a window on the nave |
| `sump-ramp` | -30 to -26 | -8 to 6 | 0 at z = 6, -2.4 at z = -8 | 5 | down to the cellar |
| `sump` | -40 to -20 | -28 to -8 | -2.4 | 4.8 | Bench 4; the effluent cellar |
| `foot` | 6 to 12 | 22 to 26 | 0 | 6 | the foot of the charge ramp; door to the pickling bay |
| `charge-ramp` | 6 to 12 | 2 to 22 | 0 at z = 22, 3.2 at z = 2 | to 13 | up to the charge bank, beside the nave, behind a railing |
| `charge` | 6 to 32 | -28 to 2 | 3.2 | to 13 | Bench 5; the charge bank, open to the nave over a railing |
| `pickling` | 12 to 34 | 6 to 26 | 0 | 6.5 | Bench 6 |
| `pit-ramp` | 12 to 26 | -42 to -38 | 0 at x = 12, -2.2 at x = 26 | 6 | down from the cast house |
| `pit-landing` | 26 to 30 | -44 to -38 | -2.2 | 6 | the turn at the ramp's foot |
| `pit` | 12 to 30 | -62 to -44 | -2.2 | 7 | Bench 7; the tapping pit, open to the cast house over a railing |
| `refining` | -36 to -12 | -62 to -40 | 0 | 7 | Bench 8 |

- **Closed high ground and drops.** Every room's walls are colliders (`lib/workings.js` `wallColliders`), inside and out. The charge bank
  and its ramp (3.2 m over the nave) and the tapping pit (2.2 m under the cast house) are closed along their open sides by railings that
  are colliders (`pass: false` openings). The slag tip (x -98 to -54, z 30 to 98, 11 m high) and the ore stock (x 50 to 96, z -64 to 8, 8 m)
  are in the height field and closed by collider rings. The furnace, stoves and stack stand north of the cast house on their own colliders.
- **No water.** The liquids are in tanks inside hosts.
- **Route, in bench order.** Spawn (0, 76) north across the yard to the charge door (0, 46). Bench 1: up the nave to z = 34, east through
  the stores door. Bench 2: back across the nave, west through the scale door (z 24 to 30). Bench 3: out of the scale bay's north door into
  the lobby, up the cabin ramp. Bench 4: back to the lobby, down the sump ramp. Bench 5: lobby east door to the nave, across to the ramp
  foot (z 22 to 26), up the charge ramp. Bench 6: back down to the foot, east into the pickling bay. Bench 7: up the nave into the cast
  house, east door at z -42 to -38, down the pit ramp, round the landing. Bench 8: back up, across the cast house, west door (z -52 to -46).
- **The Golem's ground.** Player (0, -40.5), boss (0, -54.5), on the cast house floor (level, 0.00), the furnace's breast 9.5 m behind the boss.
  `BOSS_ARENA_SPOTS['boss-golem']` moves from (0, -44)/(0, -60) to these.

### 11.4 Section along the route

Yard 0.00, door 0.00, nave 0.00; cabin 1.20 (14 m ramp, 1 in 11.7); cellar -2.40 (14 m ramp, 1 in 5.8); charge bank 3.20 (20 m ramp,
1 in 6.3); pickling 0.00; tapping pit -2.20 (14 m ramp, 1 in 6.4); refining 0.00; the Golem's ground 0.00.
Bench ground, in order: 0, 0, 1.2, -2.4, 3.2, 0, -2.2, 0. Span 5.6 m (the standard asks 3).

### 11.5 The benches

1. **Bench 1, Names and Formulas (`q2-names`): the stores.** Ions are named and their formulas written on cards. The stores is where
   everything that comes into the works is labelled and shelved, so it is the room of names. A lean-to 22 x 16 m with a 5.2 m roof, closed
   on all four sides; the one door is in its west wall, onto the nave. The plate stands with its back to the north wall, racks of crates and
   carboys on that wall behind it, pallets along the east wall. The player comes in from the nave and finds the plate to the left, ahead.
   Lamps: one over the plate, two over the racks.
2. **Bench 2, Physical or Chemical (`q3-change`): the scale bay.** The bench weighs a sealed pot before and after a change. The scale bay
   is where every charge is weighed in, on a weighbridge. 24 x 22 m, 7.5 m roof, closed all round, a 6 m door onto the nave and a door to
   the lobby. The plate faces the nave door; the weighbridge deck, the sealed charging pot on it and the hoist frame stand behind the plate.
   Lamps: one over the plate, one over the pot, one at the lobby door.
3. **Bench 3, Balancing Equations (`q4-balance`): the control cabin.** The furnace recipe is an equation that has to balance. The cabin is
   where the recipe board hangs. 14 x 14 m, 4.8 m ceiling, on a plinth 1.2 m over the works floor, reached up a ramp from the lobby; its east
   wall is a long window onto the nave. The plate has its back to the north wall, the recipe board on that wall, relay cabinets to the west.
   Lamps: one over the plate, one over the cabinets.
4. **Bench 4, Net Ionic Equations (`q5-ionic`): the sump cellar.** Mixed solutions throw down a precipitate; the bench asks which ions made
   it. The cellar is where the works' effluent settles. 20 x 20 m, 4.8 m ceiling, floor 2.4 m under the works, down a ramp from the lobby,
   walls all round. The plate has its back to the west wall; a walled settling basin and two tank bottoms through the ceiling stand behind
   it, a launder and a pump to the sides. Lamps: one over the plate, two over the basin. The lowest ground on Kettle.
5. **Bench 5, How Much Is Made (`q6-stoich`): the charge bank.** How much iron a weighed charge can give. The charge bank is the raised
   floor where the charge is weighed into the skip. 26 x 30 m at +3.2 m, the roof 9.8 m over it, walls on three sides and a railing over
   the nave on the west. The plate has its back to the north wall under three bunkers; the weigh hopper stands beside it and the skip rail
   climbs from the bank toward the furnace top. Lamps: one over the plate, two under the bunkers. The highest ground on Kettle.
6. **Bench 6, Titration (`q7-titrate`): the pickling bay.** The strength of the pickling acid is found by titration. 22 x 20 m, 6.5 m
   roof, closed all round, one door from the ramp foot. The plate has its back to the east wall, the long acid tank and the rinse tank
   along that wall behind it under a gantry with the burettes. Lamps: one over the plate, two over the tanks.
7. **Bench 7, Kinds of Reaction (`q8-kinds`): the tapping pit.** The furnace's reactions are sorted by kind. The pit is where the iron
   and the gases come out. 18 x 18 m, floor 2.2 m under the cast house, retaining walls all round, a hood 7 m over the floor, open above
   the west wall to the cast house. The plate has its back to the north wall; the runner comes over the pit's west lip to a ladle on rails
   beside it, flues rise behind. Lamps: one over the plate, one over the ladle.
8. **Bench 8, Hard and Soft (`q9-hsab`): the refining bay.** Which ions pair with which in the refining vats. 24 x 22 m, 7 m roof,
   closed all round, one door from the cast house. The plate has its back to the south wall and faces north; two precipitation vats and
   the reagent manifold stand behind it, carboys to the side. Lamps: one over the plate, two over the vats.

No two rooms share a size, a level, an entry and a roof: two are raised, two are sunk, two are open over a railing, one has a window.

### 11.6 How it differs from each neighbour

- Tallow: a white pan with separate plant buildings; Kettle is entered once and not left.
- Lanternfall: ice and night; Kettle has a roof.
- Ligar: rock chambers reached from open quarry ground; Kettle's rooms are brick and steel and open off one aisle.
- Bellows: platforms over a drop with no ground; Kettle has no open sky from the first door on.
- Ember Reach: a road down a caldera wall; Kettle's levels are floors.
- Mirrowen: quays and hulls on water; Kettle has no water.
- Teeter: terraces down an open hillside; Kettle is level outside and stepped inside.
- Verdigris: towers in a swamp in fog; Kettle is one room after another under one roof.
- Brinewire: the crest of a wall; Kettle has a nave.
- Quicklight: alleys between vessels outdoors under a storm; Kettle is indoors and its one fire is the furnace.
- Lodestone: one path down a canyon; Kettle's path branches at every bay.

### 11.7 The far country

North: the furnace top, two stoves and the stack over the cast house, and past the walk a second, cold works on the horizon.
East: the ore stock (closed), and past the walk an ore bridge crane standing over it. South: past the pad, a line of pylons going out
across the flat to the mesas. West: the slag tip (closed) with the tipping trestle on its crest. The ring of mesas is kept.

### 11.8 Numbers held

- `world-shape.mjs`: bench ground -2.40 to 3.20 (span at least 5 m), housed at least 6 of 8, no shared coordinates.
- Plates in view from the spawn: 0.
- Not one circle; not two columns (at least four separate x and four separate z among the plates).
- Triangles at most 900k, draws at most 566 at T4 (`perf-worlds.mjs`). Three pooled lights; no other point light.
- Every room at least 11.2 x 11 m with at least 4.4 m over the plate.

### 11.9 Kept, rebuilt, archived

| File | Fate |
| :--- | :--- |
| `src/three/kettle.js` | rewritten in place (same public contract); the old file archived |
| `src/three/kettle/atmosphere.js`, `materials/kettle-textures.js` | kept (the built sky and the surfaces) |
| `src/three/kettle/terrain.js`, `plant.js`, `stations.js`, `host-plan.js` | rebuilt; old files archived |
| `src/three/kettle/works-plan.js`, `works.js` | new: the plan (pure data) and the building built from it |
| `tools/gen-kettle-layout.mjs`, `tools/verify-kettle.mjs` | rewritten; old files archived |
| `src/three/world-data/kettle.json` | regenerated; old file archived |
| `src/learn/engine/boss-arena.js` | the `boss-golem` spot only |
| Archive | `archive/2026-11-13/site-kettle/` |
