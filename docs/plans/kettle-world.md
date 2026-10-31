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
