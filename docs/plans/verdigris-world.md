# Verdigris (`unit09`, acids and bases): world spec and build record

Status: **Phase 0 spec** (2026-11-05). The build record is the last section and is filled in as phases land; a section marked *Not built* is a plan, not a claim.

Place: **the acid marsh**: a flooded fortress on boardwalks, with tanks, sluices and weirs whose water the Fifth has been souring. Case thread: the Fifth blames "an acid spill" for the fortress's corroding steel and its dead water; Vess's case is that nobody measured the acid's *kind* or *amount*. Strong, weak, diluted and buffered water can all read alike to an eye, so the Fifth's one word ("acid") hides the facts that matter. Each bench measures one more fact about the marsh water.

Brief: `docs/plans/learn-quests.md` World 9. Where this spec differs from the brief it says so ("Differs"). Registered in the chart as `unit09` (current chart holds four draft placeholder quests; replaced).

---

## 1. CED map (AP Chemistry CED, Unit 8; essential knowledge numbers from the PDF)

| Topic | Essential knowledge | Bench · stage(s) | Calc? |
| --- | --- | --- | --- |
| 8.1 Introduction to acids and bases | .A.1 pH = −log[H₃O⁺], pOH; .A.2 Kw; .A.3 pKw = pH + pOH = 14 at 25 °C; .A.4 neutral water, Kw varies with temperature | q1 s1 to s8 (proton transfer, conjugate pairs, autoionization); q2 s1, s3, s6, s7 | yes (q2 s2) |
| 8.2 pH and pOH of strong acids and bases | .A.1 strong acids and bases fully ionize; .A.2 [OH⁻] of group I and II hydroxides | q2 s2, s4, s5, s8 | **yes** (typed s2, s4, s8) |
| 8.3 Weak acid and base equilibria | .A.1 to .A.6: small fraction ionizes, Ka, Kb, percent ionization, Ka·Kb = Kw | q3 s1 to s8 | **yes** (typed s3, s5) |
| 8.4 Acid-base reactions and buffers | .A.1 strong+strong, .A.2 weak acid+strong base (excess weak = buffer, equimolar = basic, excess strong), .A.3 weak base+strong acid, .A.4 weak+weak | q5 s1 to s8; q7 s3, s4 | **yes** (typed q5 s6, s7) |
| 8.5 Acid-base titrations | .A.1 curve; .A.2 equivalence point moles; .A.3 half-equivalence pH = pKa; .A.4 equivalence pH from major species; .A.5 polyprotic curves (excl.: computing every species of a polyprotic curve) | q6 s1 to s8 | **yes** (typed s7, s5) |
| 8.6 Molecular structure of acids and bases | .A.1 strong acids have weak conjugate bases stabilised by electronegativity, induction, resonance; carboxylic acids weak; nitrogenous bases | q4 s1 to s8 | no |
| 8.7 pH and pKa | .A.1 predominant form below/above pKa; .A.2 indicators; .A.3 indicator with pKa near equivalence pH | q8 s1 to s3; q6 s5 | no |
| 8.8 Properties of buffers | .A.1 large concentrations of both members; the acid takes base, the base takes acid | q7 s1 to s4, s7 | no |
| 8.9 Henderson–Hasselbalch | pH = pKa + log([A⁻]/[HA]) | q7 s5, s6 | **yes** (typed s5, s6) |
| 8.10 Buffer capacity | capacity grows with concentration; ratio near 1 | q8 s4 to s6 | no |
| 8.11 pH and solubility | qualitative only; CED excludes computing solubility as a function of pH | q8 s7 | no |

Exclusions kept: the pH *change* on adding acid or base to a buffer is not computed (q7 s7 is qualitative, direction only; labelled on its card). Polyprotic species concentrations along the curve are not computed (q6 s6 qualitative). Lewis acids (q1 s7) are past the CED; the card says so and the chart marks nothing `optional` (stage inside a bench, like `q8-hybrid`).
Logged gaps: none in Unit 8. Beyond-first-course items held to bank/practice: amino acid forms, Kb of conjugate base in weak+weak (8.4.A.4 gets one qualitative bank problem).

## 2. Benches (teaching order)

World id `unit09`. Eight benches plus the boss; stage counts 8 except the boss (5). The old placeholder ids are replaced by the brief's ids.

| # | Id | Title | Idea thread | The one click (the wrong model) | Words earned | BUILDS_ON |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `q1-handover` | The Handover | an acid hands a proton over; a base takes it | "A base is something with OH in it; an acid just breaks up by itself" (NH₃ has no OH yet takes the proton) | Brønsted–Lowry acid and base, hydronium, conjugate pair, amphoteric, autoionization, Kw, Lewis acid and base | none (`unit07` reactions are not needed) |
| 2 | `q2-scale` | Reading the Scale | pH counts hydronium on a log scale | "Neutral is pH 7 whatever the water" (hot water is neutral below 7) and "pH is a linear count" | pH, pOH, strong acid, strong base | q1 |
| 3 | `q3-weak` | Weak Acids and Bases | same amount, different ionization (the world's central click) | "Same concentration, same pH: acid strength is concentration" | weak acid, percent ionization, Ka, pKa, Kb | q2 |
| 4 | `q4-structure` | Acid Strength and Structure | why some acids let go more easily | "Fluorine is the most electronegative, so HF is the strongest of the hydrogen halides" | proton race (instrument), conjugate base stability | q1, q3, `unit03/q5` resonance |
| 5 | `q5-salts` | Neutralization and Salts | what is left after a neutralization | "Neutralization always ends at pH 7; salts are neutral" | salt hydrolysis | q2, q3 |
| 6 | `q6-titrate` | Titration Curves | pH against volume of titrant | "The equivalence point is always pH 7" | titration curve, equivalence point, half-equivalence point, indicator, polyprotic acid | q2, q3, q5 |
| 7 | `q7-buffer` | Buffers | a weak acid and its conjugate base hold pH | "A buffer cancels any added acid, so pH does not move" or "adding acid always moves pH a lot" (it depends on what is in the flask) | buffer, Henderson–Hasselbalch equation | q3, q5 |
| 8 | `q8-capacity` | pKa, Protonation and Capacity | which form dominates, and how much a buffer can take | "A weak acid is the acid form everywhere" and "a buffer never runs out" | protonation state, buffer capacity, pH and solubility | q3, q6, q7, `unit08/q7-dissolve` |
| B | `boss-leach` | The Leach | five old ideas on new flasks | | | q2, q3, q5, q6, q7 |

**Differs from the brief:** the brief gives eight quests and no boss; this adds the boss (every built world has one). Quest ids follow the brief (`q1-handover`, `q2-scale`, ...). The brief's q1 has `Count the ions in pure water` and `Read Kw at 25 °C` as two stages; they are one stage here so that a predict pair fits (s2/s3). The brief's q2 stage 5 ("say why HCl is fully ionized") is moved to q3 s2 where a weak acid is its contrast. Arena for all benches is `bench`.

### Story stakes (case thread, lead lines, Filed lines)

Lead lines at most 20 words, on stage 1, never on the boss. `Filed:` closes the story animation. Only words earned by that quest, no invented numbers.

| Bench | Lead line | Filed |
| --- | --- | --- |
| q1 | "The Fifth calls the marsh water acid. Find out what an acid does to water." | Filed: an acid hands a proton to water; the water is what changes, so the Fifth's word names a transfer, not a substance. |
| q2 | "The Fifth gives one number for the marsh. Find out what a pH number counts." | Filed: pH counts hydronium on a scale where each step is ten times; the Fifth's one number hid the size of the steps. |
| q3 | "Two tanks hold the same amount of acid. Find out why they do not read the same." | Filed: the Fifth's tanks held equal amounts of acid but not equal amounts of hydronium. Amount is not strength. |
| q4 | "The Fifth ranked the tanks by what they were made of. Find what sets an acid's strength." | Filed: the Fifth ranked acids by their atoms. Strength follows how well the leftover base holds the charge. |
| q5 | "The Fifth neutralised a tank and called it safe. Measure what was left." | Filed: neutralising is not the same as neutral; the Fifth's salt left the water basic. |
| q6 | "The Fifth reported the moment a tank was neutral. Find out what a titration curve shows." | Filed: the equivalence point depends on the acid; the Fifth's pH of 7 was a guess, not a reading. |
| q7 | "One sluice resists acid and one does not. Find out what is in the water that does." | Filed: the sluice that resisted held a weak acid and its base together; the Fifth never mixed the two. |
| q8 | "The sluice held, then failed. Find out how much it could take." | Filed: a buffer has a limit; the Fifth's last tank was past it. |
| Boss | none | Finale: the Leach's last vat is read by every old method; each says the same thing the water does. |

(Tightened to the `verify:story` vocabulary gate when written.)

## 3. Stage tables

Notation: **P** prompt (at most 25 words, no "!", no route). **Ev** evidence on the bench. **Miss** plausible wrong answers → message naming what the table shows. **R** reward card gist (final text 1 to 3 sentences, about 45 words). **Rung** quantity ramp rung for numeric stages: 1 picture, 2 prediction, 3 proportional, 4 formula as shorthand, 5 friendly numbers, 6 past-the-dial typed figure. Hints (control, what to look at, method) are written at build time under the ladder rules; the build record states them. This is a deliberate shortening of the spec (as Teeter's was) and is logged in the audit.

### Shared instruments (the ph kit, `table/kits/ph*.js`; it extends the heat kit as the pans kit does)

- **Flask** (`phflask`): a beaker holding one named solution (substance, concentration) with a **particle window**: a magnified square holding a fixed count of the solute's formula units (200 acid units, 120 for salts) shown as spheres: hydronium (amber), hydroxide (blue), the acid (grey), its conjugate base (green). Water is not drawn except on `q1` (the window says "water not drawn" elsewhere). Ionized count = `round(units × fraction)` from the planner; the window never shows a fraction the planner does not give; a count under one of 200 shows none and says nothing it cannot support.
- **pH meter** (`phmeter`, a piece with a probe): lay it on a flask; it reads pH to 2 decimals from `phdata.js` (`readPH`). A stage that asks the player to *compute* a pH has no meter on that flask.
- **Pour key / measuring jug** (`phpour`): adds a stated volume of a reagent to a flask.
- **Ratio rig** (`phrig`): numerator and denominator slots taking species tiles; reads the product ratio with powers. Reuse or compose the pans kit's rig if the data shape fits; otherwise `ph-rig.js`.
- **Proton race** (`phrace`, q4): two slots, an acid card and the conjugate base of a second acid; **Run** shows the window where the protons end up; the planner uses K = 10^(pKa(Y) − pKa(X)).
- **Burette and curve plotter** (`phburette`, `phcurve`, q6): flat plot of pH against volume; the plotter paints only to the volume poured so far (no whole-curve reveal before the run; Teeter ledger).
- **Fraction strip** (`phstrip`, q8): flat plot of the HA and A⁻ fractions against pH, painted to the pH the dial has reached.
- Tour words: every new kind is in `ph-tour.js` and one `ph-<bench>-tour.js` per bench file.

### 3.1 `q1-handover` The Handover (8.1)

Chemistry: HCl + H₂O → H₃O⁺ + Cl⁻; NH₃ + H₂O ⇌ NH₄⁺ + OH⁻; pure water 2 H₂O ⇌ H₃O⁺ + OH⁻, Kw = 1.0 × 10⁻¹⁴ at 25 °C (CED 8.1.A.2); BF₃ + :NH₃ → F₃B–NH₃ (Lewis, beyond the exam, labelled on its card). Water molecules are drawn on this bench.

1. P: "Show what happens to the hydrogen of each HCl once it is in water." Ev: flask with HCl units; **Pour** key adds the acid to water; a **tag** key paints the original H of each HCl white. Answer: lay the pair of cards (carrier of the tagged H after the pour) on a "now holds it" slot: cards *HCl*, *Cl⁻*, *H₂O*, *H₃O⁺*, *OH⁻* (five, 20 % guess; the tagged H sits on a drawn water molecule). Miss: *HCl* → "The white hydrogens are no longer on the chlorine." R: acid hands its proton to water, hydronium. Earns **Brønsted–Lowry acid**, **hydronium**. Rung 1. 3D flask, flat cards.
2. **Predict** (no instrument). P: "Ammonia has no OH in it. What will it do in water?" Cards: *Nothing: no OH to give* · *Break apart and release OH⁻* · *Take a hydrogen from water, leaving OH⁻* · *Give a hydrogen to water* · *Dissolve and stay as it is*. The model students hold is card 1 or 2. Not graded.
3. P: "Add ammonia to water and say whether it acts as an acid or a base." Ev: flask (water drawn), tag key; the pour shows the tagged hydrogen of water moving onto NH₃ (NH₄⁺) and OH⁻ left. Verdict dial: *acid* / *base* / *neither*. Miss: *acid* → "The white hydrogen moved onto the ammonia, not off it." Quotes the guess. R: a base takes a proton; no OH needed. Earns **Brønsted–Lowry base**.
4. P: "Pair each acid with what is left of it after it hands over its proton." Ev: cards for four acids (HCl, H₂O, NH₄⁺, H₂CO₃... use HNO₃, H₂O, NH₄⁺, HCN) and four leftovers, laid in a grid ≥ 60 units apart; the **tag** shows each leftover is the acid minus one tagged H. Answer is a matching; Miss: a leftover with the wrong charge → "That card has one more electron pair than the acid minus its hydrogen" (no: names charge: "H₃O⁺ minus one hydrogen is not ..."). R: **conjugate acid–base pair**. Rung 1.
5. P: "Show that water can act as an acid and as a base." Ev: two flasks (water + HCl; water + NH₃), the tag key; verdict on water's role in each flask via two dials (acid/base). Miss: water "acid" in the HCl flask → "In the HCl flask the tagged hydrogen moved onto a water molecule." R: **amphoteric**. 
6. P: "Count the ions in pure water and find what their concentrations multiply to." Ev: a large window of pure water (1 × 10⁷ ... honest scaling printed: "one pair shown stands for ...") is not honest at 10⁻⁷; instead a **counting lens** gives the measured concentrations of H₃O⁺ and OH⁻ for water at 25 °C as 1.0 × 10⁻⁷ M each (planner `waterIons(T)`); typed: the product (answer 1.0 × 10⁻¹⁴); slip cards: the sum (2.0 × 10⁻⁷), the quotient (1). Rung 4/5. R: **autoionization**, **Kw** = 1.0 × 10⁻¹⁴ at 25 °C. Differs from brief: brief s5+s6 merged.
7. P: "Show what boron trifluoride does with ammonia." (labelled beyond the exam) Ev: window of BF₃ and NH₃ units with **electron-pair tag**: a lone pair of N drawn as two dots; pour: the pair moves to B; no proton moves (the proton tag stays put). Verdict: *proton transferred* / *electron pair shared* / *nothing*. Miss: *proton transferred* → "The white tag stayed on the nitrogen." R: **Lewis acid and base** (an acid accepts a pair), past the CED.
8. Sealed. P: "Find the conjugate pairs in each of four reactions." Ev: four sealed equation cards (H₂SO₄ + H₂O, CH₃COOH + NH₃, HCO₃⁻ + OH⁻, NH₃ + HCl) each with two blank pair slots; drag formula chips (acid, base, conjugate acid, conjugate base) into labelled slots ("acid", "base", "its partner of the acid", "its partner of the base" are plain labels, not answers). Miss: wrong charge. R: pairs differ by exactly one proton.
Click: s2 + s3. Form: flask 3D (water as spheres in a window), cards flat.

### 3.2 `q2-scale` Reading the Scale (8.1, 8.2)

Planner: `strongPH(c)`, `waterKw(T)` (table below). Meter reads the planner.

1. P: "Read the pH of the flasks of 0.1, 0.01 and 0.001 M hydrochloric acid and say how the pH steps." Ev: three flasks, one meter; reading 1.00, 2.00, 3.00. Verdict: step dial *+1 each* / *×10* / *+0.1* / *+10*. Miss: ×10 → "The meter went from 1.00 to 2.00, not from 1.00 to 10." R: **pH** = −log[H₃O⁺], one unit per tenfold step.
2. **Typed** pH of 3.2 × 10⁻⁴ M HCl to 2 decimals (3.49), meter off that flask. Slip cards: exponent only (4), forgot the minus sign (−3.49). Picture: window count scaled. Rung 4 then 6 (concentration beyond the three flasks).
3. P: "Read the pOH meter on the sodium hydroxide flasks and find what pH and pOH add to." Ev: NaOH flasks 0.1, 0.01, 0.001 M with pH and pOH meters; add the dial of "pH + pOH": options 14, 7, 1, 10. Miss: 7. R: **pOH**; pH + pOH = 14 at 25 °C.
4. **Typed** pH of 0.025 M Ba(OH)₂ (12.70). Slips: pOH given (1.30), forgot the doubling (12.40). Picture: window shows 2 OH⁻ per formula unit. R: **strong base** gives its full hydroxide count.
5. P: "Dilute hydrochloric acid again and again and say where its pH ends up." Ev: a dilution chain of flasks 10⁻⁴ ... 10⁻⁸ M with the meter reading 4.00, 5.00, 6.00, 6.98; verdict: *keeps rising past 7* / *stops at 7.00* / *ends just under 7* / *falls*. Miss: rising → "The 10⁻⁸ M flask read below 7." R: water's own hydronium sets a floor; acid and **strong acid** (fully ionized) earns here.
6. **Predict**. P: "Pure water is warmed to 50 °C. What will its pH be?" Cards: *7.00 exactly* · *above 7* · *below 7* · *0*. No instrument.
7. P: "Warm the pure water to 50 °C and say whether it is acidic, neutral or basic." Ev: flask with temperature dial 25/50 °C (two settings only; no hunting), meter 6.63 and the counting lens H₃O⁺ = OH⁻ = 2.3 × 10⁻⁷ M. Verdict: *acidic* / *neutral* / *basic*. Miss: acidic → "The hydronium and hydroxide counts are the same." R: neutral means equal hydronium and hydroxide; Kw grows with temperature, so neutral is not always pH 7.
8. Sealed. P: "Find the concentration of the sealed flask of hydrochloric acid." Ev: meter on a sealed flask (pH 2.62); typed [H₃O⁺] in mol/L (2.4 × 10⁻³). Slips: 2.62, 10^(+2.62). Rung 6.
Click: s1 (log scale) and s6/s7.

### 3.3 `q3-weak` Weak Acids and Bases (8.3) — the vertical slice

Planner: `weakAcid(Ka, c)` exact quadratic; `weakBase`. Data (see §4): acetic Ka = 1.8 × 10⁻⁵; HF 6.8 × 10⁻⁴ (hydrofluoric, one ionization); NH₃ Kb = 1.8 × 10⁻⁵; HCN 4.9 × 10⁻¹⁰.

1. **Predict** (no instrument). P: "A flask of 0.10 M hydrochloric acid and a flask of 0.10 M acetic acid are read. How do their pH readings compare?" Cards: *The same* · *Acetic acid is lower* · *Acetic acid is higher* · *Acetic acid reads 7*. The model held: *The same*.
2. P: "Read the three flasks of 0.10 M acid and sort them by how much of the acid has let go of its proton." Ev: flasks HCl, acetic, HF; meter on each (1.00, 2.88, 2.10) and a window with 200 units. Two trays (*nearly all*, *only some*). Miss: acetic in *nearly all* → "The meter read 2.88 for acetic acid, 1.00 for hydrochloric acid at the same concentration." R: **weak acid** versus strong acid (fully ionized). Quotes the guess. Rung 1/2.
3. **Typed** percent ionized of acetic acid (1.3 %) from the meter 2.88 and the 0.10 M label. Slips: 2.88 % (pH as percent), 0.0013. R: **percent ionization**. Rung 3/4.
4. P: "Complete the ratio on the rig so it gives the same reading in the three acetic acid flasks." Ev: three flasks 0.10, 0.010, 0.0010 M acetic acid, windows, tiles H₃O⁺, A⁻, HA; the rig reads 1.8 × 10⁻⁵ for the right arrangement and drifts otherwise. Miss: "The rig read 1.3 × 10⁻³, 4.2 × 10⁻⁴ and 1.3 × 10⁻⁴ on the three flasks." R: **Ka**, **pKa** = −log Ka. Not a dial hunt: the arrangement is the answer.
5. **Typed** pH of 0.15 M acetic acid (2.79). No flask with this concentration; ICE chips from `pans-ice` style are in a side card: picture is the 0.10 M flask. Slips: 5.57 (no square root), 0.82 (assumed fully ionized). Rung 6.
6. P: "Dilute the acetic acid and say what happens to the percent that has ionized." Ev: 0.10, 0.010, 0.0010 M flasks with meters and windows, percent printed nowhere (the window count shows). Verdict dial: *rises* / *falls* / *stays the same*. Miss: stays → "The window of the 0.0010 M flask shows more ionized units out of 200 than the 0.10 M flask." R: weak acids ionize a larger share the more they are diluted.
7. P: "Find the constant for ammonia from the rig on its three flasks." Ev: rig, tiles OH⁻, NH₄⁺, NH₃, flasks of NH₃ at three concentrations. R: **Kb**.
8. Sealed. P: "Find what the Ka and Kb of a conjugate pair always give when combined." Ev: three rigs (acetate/acetic acid, ammonium/ammonia, fluoride/hydrofluoric acid), each pair's Ka and Kb from its own rig; operations dial (Ka+Kb, Ka×Kb, Ka/Kb, Ka−Kb); the product reads 1.0 × 10⁻¹⁴. Miss: sum → "The three sums differ; the products agree." R: Kw = Ka × Kb for a conjugate pair.
Click: s1/s2.

### 3.4 `q4-structure` Acid Strength and Structure (8.6)

Instrument: **proton race**. For each test the player lays an acid card in one slot and the conjugate-base card of another acid in the other slot; **Run** shows the window of 100 proton-holding sites where the protons end up (`raceShare`, from the pKa pair). Cards print the structure (bond length and energy where stated). Reading is the *race result*, never the pKa.
pKa data (§4): HF 3.17, HCl about −6.3, HBr about −9; CH₄ about 50, NH₃ about 38, H₂O 15.7; HClO 7.5, HClO₄ about −10; acetic 4.74, ethanol about 16; CH₂ClCOOH 2.87, CHCl₂COOH 1.29, CCl₃COOH 0.65.
1. **Predict**: "Rank HF, HCl and HBr from strongest to weakest acid." Rail of three cards ordered by dragging; the model held: HF first (most electronegative). No instrument; blank cannot be submitted.
2. P: "Race the three acids and rank them from strongest to weakest." Ev: race instrument with cards HF, HCl, HBr and bond length/energy printed on each (HF 92 pm, 565 kJ/mol; HCl 127 pm, 431; HBr 141 pm, 366). Rail order. Miss: HF first → "In the race, HF's base kept the proton from Cl⁻." R: weaker/longer bond, easier to let go (down a group). Earns nothing new but **conjugate base stability** as idea. Quotes the guess.
3. P: "Rank CH₄, NH₃, H₂O and HF from strongest to weakest acid." Race; cards print electronegativity of the central atom (2.55, 3.04, 3.44, 3.98). R: across a period, the more electronegative atom holds the charge of the conjugate base better.
4. P: "Rank HClO and HClO₄." Race; cards print drawn structures with 1 and 3 extra O. R: more oxygens spread the charge (induction).
5. P: "Say which is the stronger acid, acetic acid or ethanol." Race; structures with resonance drawn on the conjugate base card (the two forms of acetate). R: resonance spreads the charge.
6. P: "Rank acetic acid and its three chlorinated forms." Race. R: electronegative atoms near the acid group pull charge (induction).
7. P: "Rank NH₃, OH⁻ and Cl⁻ as bases." Race against H₂O or each other; Ev: ranking bases = weaker acid's conjugate base is stronger. R: strong acid → very weak conjugate base.
8. Sealed: five unlabelled acid cards (structures only), the race; rank. Miss names a race result.
Click: s1/s2. Form: structure cards flat (drawn molecules), race window 3D-or-flat per kit. Beyond the exam: none.

### 3.5 `q5-salts` Neutralization and Salts (8.4)

1. P: "Add 0.10 M sodium hydroxide to 0.10 M hydrochloric acid until nothing is left over and read the pH." Ev: flask, pour jug (volumes 10 mL steps; equal volumes, equal c), meter; window shows H₃O⁺ and OH⁻ gone. Verdict class: *acidic* / *neutral* / *basic* (read from meter 7.00). R: strong + strong ends at pH 7 (8.4.A.1).
2. **Predict** (no instrument). P: "Equal amounts of acetic acid and sodium hydroxide are mixed. What is the pH afterwards?" Cards: *7* · *above 7* · *below 7* · *14*. Model held: 7.
3. P: "Mix equal amounts of acetic acid and sodium hydroxide and say whether the water ends acidic, neutral or basic." Ev: meter 8.72 (0.050 M acetate: Kb 5.6e-10, x = sqrt(2.8e-11) = 5.3e-6, pOH 5.28, pH 8.72); the window shows A⁻ takes protons from water. R: **salt hydrolysis**. Quotes the guess.
4. P: "Mix equal amounts of ammonia and hydrochloric acid and say whether the water ends acidic, neutral or basic." Ev: 0.050 M NH₄⁺: Ka 5.6e-10, pH 5.28. R: conjugate acid of a weak base is acidic.
5. P: "Sort the solutions of NaCl, NaF, NH₄Cl and KNO₃ by their pH." Ev: four flasks with the meter available (7.00, 7.9..., 5.1..., 7.00); trays acidic/neutral/basic. Miss: NaF neutral → "The meter on NaF reads above 7." R: ions of strong acids/bases do nothing; ions of weak ones take part.
6. **Typed** pH after mixing 30.0 mL of 0.10 M HCl with 20.0 mL of 0.10 M NaOH (1.70). Picture: window with bars of moles before and after; slips: pH 7, pH 1.00 (forgot to count the total volume), 1.30. R: excess strong reagent decides pH (8.4.A.1).
7. **Typed** pH of 0.10 M sodium acetate (8.87) given Ka of acetic acid 1.8 × 10⁻⁵ on the plate. Slips: 5.13 (pOH), 7. Rung 6.
8. Sealed: three unlabelled salt flasks with meter; match each to its parent acid and base from a card list (strong/weak). Miss names meter reading.
Click: s2/s3.

### 3.6 `q6-titrate` Titration Curves (8.5)

Instrument: burette (pour 5 mL steps, plus a finer 0.1 mL mode near the jump), pH meter, curve plotter (flat, painted only to the volume poured), indicator rack (strips with colour changes at their pKa).
1. P: "Titrate 25.0 mL of 0.100 M hydrochloric acid with 0.100 M sodium hydroxide and mark the volume at which the acid is used up." Ev: curve to the volume poured; marker on the volume axis; steep jump. Miss: marker before the jump → "The curve was still near pH 1 there." R: **titration curve**, **equivalence point**.
2. **Predict**. "Titrate 0.100 M acetic acid with 0.100 M sodium hydroxide. What is the pH at the equivalence point?" Cards 7 / above 7 / below 7 / 13.
3. P: "Titrate acetic acid and read the pH at the equivalence point." Ev: curve (8.72). Verdict: class. R: weak acid → basic at equivalence (conjugate base). Quotes the guess.
4. P: "Find the pH halfway to the equivalence point and say what it tells you." Ev: curve; marker at half the equivalence volume; the reading 4.74; verdict dial: pKa / Ka / 7 / equivalence pH. R: **half-equivalence point**: pH = pKa (8.5.A.3).
5. P: "Pick the indicator that changes colour at the equivalence of this curve." Ev: rack methyl orange (3.7), methyl red (5.1), bromothymol blue (7.0), phenolphthalein (9.3) laid on curves; a strip tints at its pKa. Two curves (strong/strong, weak/strong). Miss: bromothymol blue for acetic acid → "That strip changed colour before the jump." R: **indicator** (8.7.A.3, forward link q8).
6. P: "Titrate the diprotic acid and say how many acidic protons it has." Ev: sulfurous acid (pKa 1.9 and 7.2) with sodium hydroxide, curve with two jumps; verdict dial 1/2/3. R: **polyprotic acid**; qualitative only (CED exclusion on computing every species).
7. **Typed** concentration of 25.00 mL of unknown HCl whose equivalence needs 31.4 mL of 0.100 M NaOH (0.126 M). Slips: 0.100 × 31.4 (3.14), 0.0314. Picture: curve to the volume poured, volume on a 0.1 mL dial. Rung 6.
8. Sealed: a curve of an unknown weak acid; typed Ka (from the half-equivalence reading; 1.0 × 10⁻⁵ style). Miss: pH at start as pKa.
Click: s2/s3.

### 3.7 `q7-buffer` Buffers (8.4, 8.8, 8.9)

1. **Predict**. "A drop of acid is added to plain water and to a mixture of acetic acid and sodium acetate. Which flask's pH moves more?" Cards: *Water* · *Mixture* · *Both the same* · *Neither moves*. No instrument.
2. P: "Add the same acid to a flask of water and to a flask of the mixture and say which flask's pH moves more." Ev: two flasks, Pour key (the same volume), meters (7.00 → 3.00; 4.74 → 4.7x). Verdict. Quotes the guess. R: **buffer**.
3. P: "Say what the mixture holds that water does not." Ev: window of the mixture with 100 HA and 100 A⁻ units, versus water window; trays *acid and its conjugate base* is a plain label? That prints the answer. Rebuilt: the player lays species cards (HA, A⁻, H₃O⁺, OH⁻, Na⁺) on the mixture's window to match counts. Pieces graded against planner. R: both members of a pair in large amounts (8.8.A.1).
4. P: "Add acid to the mixture and watch what takes it." Ev: pour in 20 H₃O⁺ units; window animation: the A⁻ count falls by the same 20 and the HA count rises by 20 (counted, `story-sim`-style). Verdict dial: *A⁻ is used up* / *HA is used up* / *both unchanged*. R: the conjugate base takes added acid.
5. **Typed** pH of a mixture with 0.30 M acetate and 0.10 M acetic acid (5.22). Slips: ratio inverted (4.27), pKa only (4.74). Past the dial's range (flask ratios 1:1, 2:1 available). Rung 4/6. R: **Henderson–Hasselbalch equation** pH = pKa + log([A⁻]/[HA]) (8.9.A.1).
6. **Typed** the ratio of acetate to acetic acid needed for pH 4.40 (0.45). Slips: 2.2 (inverted), 4.40/4.74. Rung 6.
7. P: "Add strong base to the mixture and say which member of the pair it uses up." Ev: window animation; verdict dial *HA* / *A⁻* / *neither*. Qualitative: the pH change is not computed (8.4.A.2; CED exclusion stated on the card).
8. Sealed: three unlabelled flasks; find which two are buffers by adding acid and base (Pour key) and meters; typed pH of one by H–H from a window count. Miss: names the meter's reading.
Click: s1/s2.

### 3.8 `q8-capacity` pKa, Protonation and Capacity (8.7, 8.10, 8.11)

Fraction strip: acid dial pH 2 to 8 by 0.5; HA and A⁻ fractions drawn only up to the dial.
1. P: "Move the pH below the pKa and say which form of the acid there is more of." Ev: strip for acetic acid at pH 3.0 (HA 98 %) with the window; verdict HA / A⁻. R: **protonation state**.
2. P: "Move the pH above the pKa and say which form there is more of." pH 6.0. Verdict.
3. P: "Say which colour the indicator shows at pH 3, 5 and 9 and why it changes there." Ev: bromocresol-style strip (methyl red: pKa 5.1, red/yellow). Cards for colour at three pHs. R: indicator colours are the two forms (8.7.A.2).
4. **Predict** then test? Only one predict; here: P: "Compare a dilute buffer with a concentrated one when the same acid is added." Ev: two buffers with the same ratio and 0.05 M vs 0.50 M totals, pour, meters. Verdict: *dilute resists more* / *concentrated resists more* / *same*. R: **buffer capacity** grows with the amount of each member.
5. P: "Keep adding acid to a buffer until its pH collapses and say how much it took." Ev: pour in equal steps; meter; strip; stop when the A⁻ count in the window is gone. Typed count? Verdict on the number of pours (dial 1 to 10 chosen by the player is a hunt). Rebuilt: pour until the window shows no A⁻; the answer is the number of pours the buffer took, typed (equals A⁻ moles / pour). Rung 5.
6. P: "Compare buffers made with the acid and base in ratios 1:1, 10:1 and 100:1 and say which resists a drop of base best." Ev: three flasks. Verdict. R: ratio near 1 within a factor of ten.
7. P: "Add acid to a saturated solution of magnesium hydroxide and then of silver chloride and say which dissolves more." (8.11, qualitative) Ev: two beakers with solid at the bottom (windows show the ions: OH⁻ removed by H₃O⁺ in the first, Cl⁻ not); verdict: *Mg(OH)₂* / *AgCl* / *both* / *neither*. R: **pH and solubility**: a basic anion is removed by acid so more solid dissolves; an anion of a strong acid is not.
8. Sealed: unlabelled flask; find which form dominates at a stated pH and what a buffer made of it would resist; verdict plus typed pKa. 
Click: s1/s2/s4.

### 3.9 `boss-leach` The Leach (five phases, no lead line)

Species *the leach*: a sump pump with five intake vats; each vat is one sample of the stage. Foe from `planFoe()` for the titration/flask instrument; integrity 3; the miss reason is on screen before it answers; the answer slot is outside the foe's corner. Phases re-test:
1. q2 s7 (hot-water neutral) on new flasks (water at 60 °C, pH 6.51, plus an acid at 25 °C): "Pick the neutral flask."
2. q3 s2/s5: three weak acid flasks at one concentration; rank by pH without the meter on two flasks.
3. q5 s3/s5 on new salts (NH₄NO₃, Na₂CO₃ as sodium carbonate pH, KCl): sort acidic / neutral / basic.
4. q6 s5: pick the indicator for a base-in-acid titration (a weak base titrated with strong acid; equivalence acidic).
5. q7 s5/s6: a buffer target (type the ratio for pH 5.10 using acetic: 2.27).
Finale `leach-open` files the clue `clue_verdigris_leach`.

## 4. Data and planners (Phase 1; written in `src/learn/engine/phdata.js`)

All pure; no DOM. Each reading is one function the drawn and the built twin share.

| Function | Reads | Source / check |
| --- | --- | --- |
| `waterKw(T)` | Kw at 0, 10, 20, 25, 30, 40, 50, 60 °C: 1.14e-15, 2.93e-15, 6.81e-15, 1.00e-14, 1.47e-14, 2.92e-14, 5.48e-14, 9.61e-14 | CRC Handbook (Kw values; 25 °C = CED 1.0e-14); 50 °C neutral pH = 6.63, 60 °C = 6.51 (hand: −½ log Kw) |
| `strongAcid(c)`, `strongBase(c, n)` | exact with water: x² − c x − Kw = 0 | hand: 1e-8 M HCl → 6.98 |
| `weakAcid(Ka, c)` | exact quadratic x² + Ka x − Ka c = 0, percent, pH, species | hand: acetic 0.10 M: x = 1.33e-3, pH 2.88, 1.3 % |
| `weakBase(Kb, c)` | same with OH⁻ | NH₃ 0.10 M: pH 11.12 |
| `saltPH(Ka or Kb of the ion, c)` | hydrolysis of the conjugate | NaCH₃COO 0.10 M: pH 8.87; 0.050 M: 8.72 |
| `mixPH(...)` | titration/mixture solver by charge balance (bisection on pH), monoprotic, diprotic | hand: 30 mL 0.10 HCl + 20 mL 0.10 NaOH → 1.70; equivalence acetic 8.72 |
| `bufferPH(pKa, nA, nHA)` | exact charge balance and H–H | acetate/acid 3:1 → 5.22; target 4.40 → ratio 0.45 |
| `fractions(pKa, pH)` | α(HA), α(A⁻) | pH = pKa → 0.5/0.5 |
| `raceShare(pKaX, pKaY)` | share of protons on each side | K = 10^(pKaY − pKaX) |
| `INDICATORS` | methyl orange 3.7 (3.1 to 4.4), methyl red 5.1 (4.4 to 6.2), bromothymol blue 7.0 (6.0 to 7.6), phenolphthalein 9.3 (8.2 to 10.0) | standard |
| `ACIDS` | Ka/pKa: acetic 1.8e-5, HF 6.8e-4, HCN 4.9e-10, NH₄⁺ 5.6e-10 (Kw/Kb), HClO 3.0e-8, formic 1.8e-4, sulfurous 1.5e-2 and 6.4e-8; Kb NH₃ 1.8e-5 | standard text values (CRC / Zumdahl); the CED does not fix them |

Checks: `tools/lib/verdigris-data-checks.mjs` re-derives each value above by a different route (closed form or independent bisection) and compares against the table.

## 5. World plan

Place: acid marsh. Site layout: eight bench hosts plus the boss arena on boardwalks across a flooded fortress; generated by `tools/gen-verdigris-layout.mjs` into `src/three/world-data/verdigris.json`, built by `src/three/verdigris.js` and `src/three/verdigris/{terrain,atmosphere,stations,host-plan,plant}.js`, textures in `src/three/materials/verdigris-textures.js`. Hosts are built into the marsh's machinery (tanks, sluice gates, weir valves, a settling basin, a pump house) clear of the bay envelope; boss arena is the pump house court with the Leach (articulated sump pump) in `engine/boss-models.js`. Verify: `tools/verify-verdigris.mjs` modelled on `verify-teeter.mjs` (overlap, buried bodies, walkability flood fill, lamps-only-lit, bay clearance). Registered in `worlds3d.js`, `voyage.js`, `stage.js`, galaxy map, field manual, commendations, requisitions, learn styles, saga.

## 6. Pitfall review (every row of `PRODUCT.md` section 5)

| Row | Verdict |
| --- | --- |
| A plate/header/readout prints the answer | **Avoided by**: the meter is absent on a flask whose pH is to be computed; the rig prints only its reading, never the arrangement; the window shows counts never fractions; windows of `q3` s6 print no percent; the race prints no pKa. Checked in the per-stage "prints" list during build and `verify:learn` leak search. |
| A refusal states the rule | **Avoided by**: misses name a reading ("the meter read 2.88"), never "weak acids ionize partly". |
| A miss message gives the reasoning | **Avoided by**: same. |
| Tray or rail names state the possible answers | **Avoided by**: trays are *nearly all / only some* (named after what the window shows), never "strong / weak" before q3 s2's reward. |
| A term used before it is taught | **Avoided by**: `VOCABULARY`, `BUILDS_ON`, `WITHHELD_VOCAB` (conjugate base, buffer, Ka held until earned); `q4` uses the race words only. Electronegativity and resonance are earned in Ligar and listed in `BUILDS_ON`. |
| The model offered is not the model students hold | **Avoided by**: each predict offers the held model (same pH, neutral = 7, no OH no base, pH of the mixture unchanged). |
| Stages that repeat | **Avoided by**: the brief's overlapping q1 s5/s6 and the q2 strong/weak stage were merged or moved. |
| Story that does not touch the bench | **Avoided by**: lead lines name the stake; the bench's own readings feed `Filed:`. |
| Crowded rows cause accidental joins | **Avoided by**: pair/grid layouts ≥ 60 units apart (`q1` s4, `q4` rails). |
| A dropped tool never joins a card | **Avoided by**: the meter is a probe that lays on a flask fixture, not a card drop; the pour key acts on the fixture. Checked with a real drag in `verify:bench`. |
| A missed grab throws the camera | **Not applicable**: shared gesture code, unchanged. Re-checked in play. |
| A drop beside a slot strands a piece | **Avoided by**: shared gesture rule; no special-casing. |
| Dials | **Avoided by**: temperature dial has two settings; the fraction-strip pH dial has steps wide enough; no stage depends on hunting a dial. |
| A tool laid on the plate vanishes | **Avoided by**: the probe/meter has a brass body and caption. |
| Needed control not mentioned | **Avoided by**: every control has a plain caption on the object and a Tour step. |
| A control that reacts late | **Avoided by**: Pour acts at once, then disables for the animation. |
| Text a player must read is tiny | **Avoided by**: ≥ `LABEL.min`; window counts and plot axes at 20 px or more; zoomed in play. |
| Black pane at bench entry | **Not applicable** (shared overlay). |
| `c.label` takes metres | **Avoided by**: metre sizes only; `verify:table` overlap. |
| Opaque slab over a painted display / glass over text / lining plate | **Avoided by**: the flask body is glass beside the display, never in front; the meter display faces the player; no lining on the plot card. |
| A pour leaves no trace | **Avoided by**: any pour fills ≥ 0.018 m. |
| A lens kept the old picture | **Avoided by**: windows redraw from the planner every frame state change. |
| Painted words under 3D hardware | **Avoided by**: dial names 3.6 units in, ladder labels outside posts, flask names above the rim. |
| Fonts | **Avoided by**: sans symbols for element letters; true minus in pH values; "O" never in a mono face. |
| Drawn contents off the puck | **Not applicable** (no pucks); particle sizes ≥ 2.5 units. |
| Heaps cover gauges | **Avoided by**: windows placed away from gauges. |
| Plots too small | **Avoided by**: curve and strip plots ≥ 36 × 22 units. |
| Generic ball faces | **Avoided by**: spheres carry no text; legend names the colours. |
| Option object drops keys | **Avoided by**: unit tests call every fixture builder and check the prop reached the painter. |
| Disposal recursion | **Not applicable** (shared engine). |
| A comparison trace shown whole | **Avoided by**: the curve plotter and fraction strip paint only to the volume/pH reached. |
| A stat read of a finite-particle simulation | **Avoided by**: counts come from the planner and are deterministic; no stochastic windows. |
| A zero printed in scientific form | **Avoided by**: a number painter that prints 0 plainly; tested at 0. |
| Trays at the table's right edge | **Avoided by**: trays left of x 120; `verify:table`. |
| A lead line that states the click | **Avoided by**: lead lines state the stake only. |
| Tiny words on cards | **Avoided by**: card kinds whose face text scales; formula cards use the `arw`-style large face. |
| Parallel builders and shared files | **Avoided by**: one file per bench for kit and checks; shared lists by single-line Edits at marker lines. |
| A card prints two lines on one row | **Avoided by**: one row per line; card height set by rows. |
| A tray's cell shorter than its card | **Avoided by**: `cellH` ≥ card height; taller tables where needed. |
| A rail's end label under a tall fixture | **Avoided by**: rails below a fixture's bottom edge by a label height. |
| `toFixed` rounds a half down | **Avoided by**: epsilon in every printer (`fmt` helper in `phdata.js`). |
| A correct order refused for want of a pull | **Avoided by**: the correct rank is accepted without every race having been run; only a wrong order is told which race is missing. |
| Escape leaves a bench | **Not applicable** (shared). |
| The stage count lives in five places | **Avoided by**: a checklist in the build record: quest meta, chart, PRODUCT facts line and sentence, `verify-learn` indices, `NOTES`/`LEAKS`. |
| Question bank moved mid-pass | **Avoided by**: no `PRACTICE` in quests; unique ids. |
| `selectorFixture` answer cards | **Avoided by**: trailing blank option on every dial verdict. |
| Shared-engine change breaks other worlds | **Avoided by**: opt-in options only; all world scripts re-run after any shared edit. |
| Full verify wipes `dist/` | **Avoided by**: individual scripts only. |
| Several agents in one tree | **Handled by**: one integrator committing explicit paths; builders do targeted Edits and never `git add -A`. |
| Scripted solutions pass while hands fail | **Handled by**: `verify:bench` pointer paths plus a play pass; the audit labels what was played. |
| Stale templates and plans / copy in several places / doc counts drift | **Handled by**: `verify:docs`; one source per copy. |

Stage anti-patterns (section 4): sort of printed facts (q3 s2 sorts by meter vs the log of the concentration, a reasoning step; q5 s5 sorts by meter on a flask that must be measured); copying a number from a gauge (typed stages never put the answer on a gauge; q2 s8 typed [H₃O⁺] is a computation from the pH, not a copy); dial hunts (none: temperature two settings, pH dial in the strip is read, not hunted); plug-and-chug with all constants (typed stages print the constants the stage needs only where the CED hands them, never the result); a stage that only shows a refusal (none); two printed totals subtracted (q5 s6 hides the mole totals); twelve things on a bench (each stage lists one flask, a meter, and at most one other tool); a fetch copying the bench (no fetches).

## 7. Build record

*Not built yet.* Filled in as phases land.

### World notes (walkable world, built 2026-11-05)

Built: `src/three/verdigris.js` (`VerdigrisWorld`, the Teeter contract), `src/three/verdigris/{host-plan,terrain,atmosphere,plant,stations}.js`, `src/three/materials/verdigris-textures.js`, `src/three/world-data/verdigris.json` (written by `tools/gen-verdigris-layout.mjs`, deterministic, self-checking), `tools/verify-verdigris.mjs` (`npm run verify:verdigris`, also in the `verify` chain after `verify:teeter`). Registered in `worlds3d.js` (`unit09`), `voyage.js`, `stage.js` (`enterVerdigrisScene`, `setVerdigrisSiteComplete`, exposure 0.96), `verify-voyage`, `verify-bench`, `verify-arena`, `commendations.js` (`learn_q6_handover`). The galaxy map already had `unit09`.

Place: the same plan as Teeter on purpose (spine south from the pad, eight spurs, odd benches west, even east, pools between spurs, court at the south end), dressed as the marsh. Boardwalks are flush planks (`boardwalk` texture, solid, no feather) over olive peat; pools are cut 0.5 m, water at -0.2 m (never waded: each is fenced by a box); edge posts are one ambient object with no collider. Pool landmarks (`fort-tower`, `tank-pier`, `valve-pier`, `pump-house`) stand on the pool floor; the valve piers' handwheels are the only moving parts (40 s a turn, kept out of the bake). Land: `storage-tank`, `rubble-heap`, `drum-stack`, `crate-stack`, T4 `reeds` (no collider).

Hosts (site id, bench, structure, `kind` of the cased instrument), all with the Teeter host frame (plate at origin, machinery at z < -2.05 or |x| > 2.85, lamp boom above 2.4 m):
| site | quest | host | extent (x0,x1,z0,z1) |
| --- | --- | --- | --- |
| site-1 | `q1-handover` | `sluice-gate` (two cells, water held higher on the left, lift gate, gantry) | -7,7,-9.4,0.8 |
| site-2 | `q2-scale` | `gauge-house` (staff in a stilling well, scale board with marks closing up) | -7,7,-8,0.8 |
| site-3 | `q3-weak` | `twin-tanks` (two equal tanks, a dial on each facing the plate: TANK A / TANK B) | -7,7,-8.6,0.8 |
| site-4 | `q4-structure` | `valve-gallery` (header on a gantry, six handwheel branches) | -7.2,7.2,-8,0.8 |
| site-5 | `q5-salts` | `settling-basin` (basin with a bloom crust, rake bridge, outfall weir) | -7,7,-9.2,0.8 |
| site-6 | `q6-titrate` | `dosing-tower` (header tank, glass metering run, receiving vat, ladder) | -7,7,-8.6,0.8 |
| site-7 | `q7-buffer` | `surge-tank` (standpipe, overflow weir, catch channel) | -7,7,-9,0.8 |
| site-8 | `q8-capacity` | `reserve-vats` (four vats, each larger, with level staffs) | -7.2,7.2,-8.4,0.8 |

A site is `built` when `src/learn/quests/unit09/<questId>.js` exists: **rerun `node tools/gen-verdigris-layout.mjs` when a bench module lands** (`verify:verdigris` fails on a stale flag). Bench builders: `HOST_PLAN[site].kind` picks the cased instrument (`flask`, `meter`, `race`, `dish`, `burette`, `plot`; change it in `host-plan.js` and `buildVdBench` in `stations.js`); labels are `Bench N - ...` signposts of at most six words. The table's dressing comes from `anchor.dormant.userData.benchMats` (`top: benchTop`, `dark: darkSteel`, `tray: timberDark`).

Boss: `boss-leach` (species `the leach`, `BOSS_ARENA_SPOTS` in `engine/boss-arena.js`, `BOSS_LOOK` entry) is fought on the court at (0, 0, -54), player mark (0, 1.6, -38), ground shared with `verdigris.json` `arena`; the sump (`pool-sump`) lies south of it and the pump house stands in `pool-w4`, facing the court. Body: `buildLeach` in `engine/boss-models.js` (volute casing on four braced legs, five intake vats ringed behind, two intake hoses jointed at shoulder, elbow and wrist, bell-mouth muzzle on the right hose, four armour plates). Not yet wired: `verify-bench`'s per-boss "on its tables" list takes `boss-leach` once `unit09/boss-leach.js` exists, and its fight poses (the Tipper's are `level`/`tipped`) are the quest builder's to name.

Checks run green at build: verify:verdigris, teeter, ember, mirrowen, kettle, ligar, lanternfall, bellows, tallow, arena, voyage, bench, docs, progression, galaxy, learn, run. Not browser-tested (the integrator plays). The chart (`worlds/unit09-acids-and-bases.js`) still holds the draft ids; `verify:verdigris` waits on it for the charted-bench check and compares site labels to `HOST_PLAN` titles until then.

### Slice notes (`q3-weak` and the ph kit, built 2026-11-05)

**Built:** the ph kit (`table/kits/ph.js`, extends the heat kit as the pans kit does), `q3-weak` (8 stages), the chart (nine entries, `q3-weak` live), the lead line, the bank entry (`q3-weak#b1`, `#b2`, `#w`), the story `weak-windows`, and `tools/lib/verdigris-q3-checks.mjs` (run from `verify:learn`). Green when written: `verify:learn`, `table`, `story` (one failure that is not ours: `unit02/q10-wavefunctions` has no story animation), `bench` (all 8 stages at 7 viewports by drag and by two taps, in the Verdigris world), `verdigris`, `teeter`, `ember`, and `node tools/lib/verdigris-data-checks.mjs`. `verify:docs` fails on counts only (9 built worlds, 71 quests, 63 benches, 496 stages): the integrator updates the PRODUCT.md facts line and sentence. No shared engine code was changed.

**The kit.** Files: `ph-read.js` (pure: `flaskSol`, `windowOf`, `speciesOf`, `meterRead`, `rigRead`, `steady`, `numText`, the window's cell and colour helpers; no THREE, so story painters import it), `ph-registry.js` (`registerFixture`, `registerPiece`), `ph-flask.js` (fixture `phflask`, piece `phmeter`), `ph-rig.js` (fixture `phrig`, piece `phtile`), `ph-tour.js`, `ph.js` (the kit; `phTable(spec, {w, h})`). Builders a stage calls: `flaskFixture(id, at, {solute: {id, c, T?}, label, w, window, meter, legend, waterNote, units, cols})` returns `{fixture, slot, size}` (slot is null with `meter: false`: that flask has no seat and no meter reading, for a stage that asks the player to compute its pH); `meterPiece(id, at)`; `rigParts(id, at, {cols: [{flask} | {values, title, lines}], top, bottom, pitch, h})` returns `{fixture, slots, size, lw}`; `tile(id, key, label, at)` (key is a flask species `H A HA` for an acid, `OH BH B` for a base, or any key of a column's `values`). The window draws `round(units x fraction)` pairs from the planner; a flask keeps the last reading its meter gave (`settle` writes `props.noted`, printed in the seat once the meter is lifted). Heat-kit builders (`selectorFixture`, `plaqueFixture`, `note`, `tag`) are re-exported.

**To add a bench** (the checklist, in order): (1) `quests/unit09/<id>.js`, copy `q3-weak.js` (imports from `table/kits/ph.js`); (2) a new instrument gets `table/kits/ph-<name>.js` plus `ph-<name>-tour.js`, ONE import line in `ph.js` at the line marked `(marker: ph instruments)`, and its builder exported from `ph.js`; (3) the chart entry in `worlds/unit09-acids-and-bases.js`: `status: 'live'` and the `module` import; (4) a lead line in `engine/stage-story.js` (the Verdigris block at the top of `STAGE_STORY`); (5) `bank/unit09.json`: `bench.<id>.problems` (`#b1`, `#b2`) and a `worked` if computational (the file is already registered in `bank.js`); (6) `story/quest-story.js` entry keyed `unit09/<id>` and its painter in `ui/story-scenes-verdigris.js` (`VERDIGRIS_SCENES`, already spread into `story-scenes.js` through `legacy()`); (7) `tools/lib/verdigris-<id>-checks.mjs` and one block in `verify-learn.mjs` at the line marked `(marker: verdigris bench checks)`; (8) a `WITHHELD_VOCAB['unit09/<id>']` regex in `verify-learn.mjs` for the words the bench earns; (9) `BUILDS_ON`; (10) rerun `node tools/gen-verdigris-layout.mjs` (the site's `built` flag); (11) the PRODUCT.md counts. `verify:story` already requires an animation for every unit09 quest that has a module.

**Differs from section 3.3.** s8 uses the ratio rig with `Ka` and `Kb` tiles on three pair columns (the rig multiplies and divides, so there is no operations dial and no sum or difference); the spec's miss "the products agree" would have named the answer. s5 has no ICE chips: the picture is the 0.15 M flask and its window, with Ka on a plate. s3's typed percent is accepted within 0.25 or 7 percent, because the window holds 200 units and can only show a share to the nearest half. The lead line says the tanks hold the same amount and that Vess wants to compare what they read (the spec's "why they do not read the same" states the click on a stage that is a prediction). The meter is one piece moved from flask to flask; the flask prints the last reading.

**Traps hit.** (1) `verify:table` and `verify:bench` want every loose piece 28 px across on a phone-width table: a table wider than 150 units needs a larger `r` (the ph kit gives `tag` r 8.4; tiles r 8.4) and loose pieces at least 2r apart. (2) A tool's caption is centred on the piece's home and 40 units wide, so a piece at x = w - 20 or more puts it off the table. (3) A fixture with `backdrop: true` and no dial is skipped by the Tour; flask and rig carry a hidden dial `x` so they get a step. (4) In an acid flask the hydronium and the leftover base are equal (water's own ions are 1e-9 of it), so `H3O+ over A-` reads 1.00 on every flask and is steady; `rigCheck` refuses a steady reading of 1. (5) `export *` of a name that two modules export is silently dropped: `ph-read.js` does not re-export `fmt` or `sci`. (6) `sci()` can print "10.0 x 10^-15" for a product that is 9.99e-15 (not hit here; guard a product of constants). (7) The window at 200 units on a 35-unit flask has spheres of about 0.6 units; the 44-unit flasks (three across, meter seats) are the readable ones. Unverified: the look of any stage at 3D On or at 375 px (the checks measure layout and pointer paths only), the glass dish dress (`dress3d`) and the meter solid, and whether three flasks across feel crowded on s2 and s6. `phdata.js` `PKA.acetic` is 4.76 (the q4 race table) while `q3-weak` prints the pKa as -log Ka = 4.74; `q6` s4 quotes 4.74: the integrator should decide which one the race uses. `BUILDS_ON` is `[]` until `q1-handover` and `q2-scale` exist (the bench uses their words proton, hydronium, conjugate base and pH).

### q6-titrate notes (built 2026-11-05)

**Built:** `quests/unit09/q6-titrate.js` (8 stages), instruments `table/kits/ph-burette.js` (fixture `phburette`: burette over one or two flasks, Pour key, dial "Pour size" 5 / 1 / 0.1 mL, hidden dial `v` in tenths of a mL, per-flask display, optional dye rack, optional tint) and `ph-curve.js` (fixture `phcurve`: flat plot, dots joined by straight lines for the pours only, optional volume mark dial, optional list of readings), tours `ph-burette-tour.js`, `ph-curve-tour.js`, planners in `phdata.js` (`titrationML`, `equivalenceML`, `volumeAtPH`, `indicatorShare`, `indicatorWindowML`, `indicatorEndsAtEquivalence`, `TITRATION_UNKNOWNS`), story `titration-reads` (`ui/story-scenes-verdigris-titrate.js`), bank `q6-titrate#b1`, `#b2`, `#w`, checks `tools/lib/verdigris-q6-checks.mjs`. Pours write one paper-strip row per flask (`label` "<burette>|<flask>"); the plot reads those rows, so a curve cannot hold a volume that was not poured and Undo removes points with the pour.

**Stages.** 1 mark the volume that uses up HCl (mark dial on the volume axis, no printed answer; ±0.5 mL). 2 predict acetic equivalence pH. 3 HCl and acetic acid poured together under one Pour key, two traces, verdict dial vs 7 (8.72 beside 7.00). 4 acetic (25.0 mL) and formic (20.0 mL) with different equivalence volumes, so each half-way volume (12.5, 10.0 mL) must be worked out; the Ka of each is printed under its flask and the verdict is what the half-way reading equals. 5 four dyes in a rack over 20.0 mL of 0.150 M acetic acid (equivalence 30.0 mL, not printed), no meter, no curve; pick the dye whose whole change falls within 0.3 mL of equivalence (only phenolphthalein; the bromothymol blue tube runs 28.4 to 30.0 mL). 6 sulfurous acid, 20.0 mL of 0.0500 M (rises at 10.0 and 20.0 mL), verdict One / Two / Three. 7 typed strength of 25.00 mL HCl (31.4 mL of 0.100 M, 0.1256 M): no meter and no curve (a start reading of 0.90 would hand over the strength), the flask is tinted by bromothymol blue; ±2.5 %. 8 typed Ka of a sealed weak acid of unknown strength (Ka 7.0e-6): equivalence found from the curve (20.0 mL), half way read (5.16); ±12 %.

**Differs from 3.6.** s5 uses one titration (weak acid) and the dye tubes, not two curves, because every dye changes within 0.3 mL for a strong acid; the strong/weak-base case is the boss's. s7 replaces the curve and the 0.1 mL dial by a tinted flask. s4 uses two acids at once. s8 hides the concentration so the equivalence volume has to be found.

**Traps.** (1) At 2 decimals the half-way reading is 0.01 above the pKa (4.75 against 4.74, 3.75 against 3.74) because of the hydronium term; the bench prints Ka only, the reward says "within 0.01". (2) A start pH reading reveals a strong acid's strength: stage 7 has no meter. (3) `verify:verdigris` site-5 built flag belongs to q5-salts (rerun `gen-verdigris-layout.mjs` once it lands). Unverified: the look at 3D On and at 375 px; the flask and burette are flat drawings with no `dress3d`; the dye names under the rack tubes are small.

### q4-structure notes (built 2026-11-05)

**Built:** `quests/unit09/q4-structure.js`, the proton race (`table/kits/ph-race.js`, `ph-race-tour.js`: fixture `phrace`, card piece `phacid`), `phdata.js` `RACE` / `raceCount` / `raceOrder`, painter `race-pairs` (`ui/story-scenes-verdigris-q4q5.js`), checks `tools/lib/verdigris-q4-checks.mjs`. The race keeps its results in the table recorder (label `race:<fixture>:<cardA>|<cardB>`, y = protons on the base of 100), so the list of races run survives putting the cards back on the rail. Cards start on the rail; a card in the first place is the acid, in the second the base it leaves. A correct rank is accepted with no race run; a wrong one quotes the race of the first out-of-order pair, or says none has been run. Stages: 1 predict (rail, cards loose, remembers the card placed first); 2 HF/HCl/HBr with bond length and energy; 3 CH4/NH3/H2O/HF with electronegativity; 4 HClO to HClO4 (HClO2 1.96 and HClO3 -1.0 added to `RACE`); 5 ethanol/acetic/formic (rank of three, not the spec's pair); 6 acetic and three chlorinated forms; 7 four bases ranked by what they take from one fixed acetic acid card (pre-seated), rail ends "Takes the fewest" / "Takes the most"; 8 five lettered acids. Differs from 3.4: s4, s5 are ranks of 4 and 3 cards (a pair is a 50 % guess); s7 uses a fixed reference acid because a single rank across 50 pKa units saturates at 0 and 100. `PKA.acetic` is 4.74 in the file. Weakest: s3 (every race reads 0 or 100, so the rank rests on direction, not size), s5 (formic over acetic can only be found by racing). Not seen: 3D On, 375 px (checks measure layout and pointer paths).

### q5-salts notes (built 2026-11-05)

**Built:** `quests/unit09/q5-salts.js`, the mixing flask (`table/kits/ph-mix.js`, fixture `phneut`, `neutParts`; reading `ph-read.js` `mixOf`, which `flaskPH` uses so the meter reads it), `phdata.js` `NEUTRAL_SALTS` (NaCl, KNO3 as flask solutes with `side: 'salt'`), painter `salt-reads`, checks `tools/lib/verdigris-q5-checks.mjs`. The jug has no separate piece: the fixture's "Pour" key adds one measured step (10 mL; 6 pours), the window is 100 units of the analyte (grey left, green used up). Stages 1, 3, 4 pour until the window is empty and give a verdict; the verdict is accepted without pouring (a correct answer is never held for a key), and a miss quotes the planner's pH at the equal point. s2 predict (cards and slot). s5 four salt flasks sorted by the meter. s6 typed pH after 30.0 mL acid and 20.0 mL base (no meter; the window shows 33 of 100 left); s7 typed pH of 0.10 M sodium acetate (no meter, Ka on a plate); s8 three lettered flasks, a dial each (Both strong / Weak acid / Weak base). Worked problem `q5-salts#w` (40.0 mL acid + 25.0 mL base). Differs from 3.5: the speccd `mixture` solver is used through `titrationPH`; s8 asks which parent is weak (one dial a flask) instead of two card lists. Weakest: s1/s3/s4 are three near-identical pour stages (a verdict dial is a 1 in 3 guess); the window cannot show hydrolysis (under one unit in 120). Not seen: 3D On, 375 px.

### q1-handover and q2-scale notes (built 2026-11-05)

**q1-handover** (`quests/unit09/q1-handover.js`, kit `ph-pour.js` + `ph-pour-tour.js`, checks `tools/lib/verdigris-q1-checks.mjs`, story `handover` in `ui/story-scenes-verdigris-q1q2.js`). The pour window (`phpour`) is its own fixture, not a flask prop: 8 cells, each a unit beside one drawn water molecule; the cells that change are `windowOf(...units 8).ionized` (HCl 8, ammonia at 1.0e-4 M 3, BF₃ + NH₃ all 8). A Mark dial (off / the substance's hydrogens / water's hydrogens, or lone pairs on the Lewis scene) and a Pour key; marks paint from atom identity so order does not matter. `formulaChip` (`phchip`) is the formula piece. Pairs are judged from `formulaStats` / `isConjugate` in `phdata.js` (hydrogens and charge parsed from the formula; the check file holds a by-eye table). Differs from the spec: s5 is "find the substance that acts as acid in one window and base in the other" (two pours, water answer) instead of two role dials; s6 is the ratio rig on three waters (pure, acid added, base added) with the measured ions printed per column, not a typed product; s8 has three reactions (not four), 12 chips and 12 places, pairs laid side by side with no role labels; ammonia is poured at 1.0e-4 M so three of eight cells visibly change. Weakest: s1 (the legend names H₃O⁺, so the card is readable from it) and s4 (a formula derivation, no instrument).

**q2-scale** (`quests/unit09/q2-scale.js`, kit `ph-scale.js` + tour, checks `verdigris-q2-checks.mjs`, story `scale`). Own flask fixture `phscale` (strong acid, strong base incl. Ba(OH)₂ with two OH⁻ per unit, pure water) plus `phmeter2` with props.scale `pH` / `pOH` (a flask keeps both last readings); opt-ins: `temps` (Temperature dial of two settings), `lens` (measured H₃O⁺ and OH⁻), `sealed`, `meter: false`. Planner `scaleSolution`, `waterIons`, `STRONG_BASES`, `WATER_MOLAR` added to `phdata.js`. Differs: s3 types "pH + pOH" instead of a 14/7/1/10 dial (a dial with the answer on it); s5 uses four flasks (1e-6 to 1e-9) and a three-way dial (rising / levels off / falls); s8 types the hydronium as 2.4e-3 style (the entry label says the form). `sci()` in `phdata.js` now carries a mantissa that rounds to 10 into the exponent (it printed 10.00 × 10⁻¹³). Not verified: 3D On look, 375 px beyond the layout checks, the glass dish of both new windows, three flasks across on s1 to s4.

### q7-buffer and q8-capacity notes (built 2026-11-05)

**Built.** Planner: `phdata.js` `bufferState` (exact charge balance: pH and moles of HA and A⁻ after strong acid or base is poured in). Instruments: the mixing flask `phmix` (`ph-buffer.js`, builder `mixFixture`, reader `mixRead`), the fraction strip `phstrip` (`ph-strip.js`, `stripFixture`, `stripRead`) and the beaker with a solid `phsolid` (`ph-solid.js`, `solidFixture`, `solidAfter`, `Ksp` from `eqdata.js` `KSP`); each with its `-tour.js`. `ph.js` gained three import lines, three export lines and a `dialed` hook on `PH_KIT` (the strip keeps the pH range the dial has crossed; opt-in, delegated to a fixture handler's `dialed`). Quests `q7-buffer`, `q8-capacity`; stories `buffer-catch` (`ui/story-scenes-verdigris-buffer.js`) and `capacity-limit` (`ui/story-scenes-verdigris-capacity.js`); checks `tools/lib/verdigris-q7-checks.mjs`, `-q8-checks.mjs` (hand-worked closed forms in each header); bank `#b1 #b2 #w` for both. Green: `verify:learn`, `table`, `bench`, `verdigris`, `arena`, `teeter`, `ember`, the data checks; `verify:story` fails only on `unit02/q10-wavefunctions`.

**Differs from 3.7 / 3.8.** The flask has a built-in meter (no seat; `meter: false` for a computed pH), one Pour key and a "Pour in" dial (acid or base) where a flask takes both. The "caught" animation is a static ringed sphere in the window (painters have no clock); the moving version is the story scene. q7 s3 is a build (two dials of 0/25/50/100 spheres; accepted when an acid pour and a base pour each move the pH under 0.5), not cards laid on a window. q7 s7 is the direction verdict; q7 s8 is "which sealed flask is not a buffer" with no typed pH. q8 s1/s2 were one predict and one test of both pH (the spec's two near-identical stages); the freed stage is the typed indicator pKa (s3, methyl red). q8 s5 is flask 1 poured to exhaustion, then a typed pour count for a flask three times larger that has no key (proportion, past the live range). q8 s8 is "which sealed acid makes the best buffer at pH 4.5" on a strip with an "Acid" dial, not a typed pKa. Acetic acid pKa is -log Ka = 4.74 (as q3), not the race table's 4.76.

**Traps.** (1) `kit.dialed` exists only on kits that define it; `setDial` calls it with the dial already set. (2) A fixture's hidden dials still get a Tour sentence unless the Tour entry has `dials: false`. (3) A 100 : 1 flask is not a Henderson-Hasselbalch case: free hydronium is comparable to the acetate, so its hand value is a quadratic. (4) A tolerance written as `<= 0.15` fails at `|5.25 - 5.1|` in floating point. (5) The bank JSON was overwritten once by another agent's whole-file write; re-insert the `bench.<id>` key. Unverified: the look at 3D On and 375 px (windows hold up to 280 spheres on a 44-unit flask), the glass dish dress of the mixing flask, and whether three flasks plus a dial feel crowded on q7 s8 and q8 s6. Weakest: q8 s2 (a verdict readable off a strip once the dial is moved) and q7 s3 (a 16-setting build whose accept region is wide).

### boss-leach notes (built 2026-11-05)

**Built:** `quests/unit09/boss-leach.js` (5 phases, ph kit, no new instrument), species `the leach` in `engine/foes.js` (poses `unmoved`, `acid`, `neutral`, `base`, `dispersed`; a `{kind: 'ph', pH, T}` probe puts the vats level on the neutral pH of the flask's own temperature), table body `buildLeach` in `engine/foebody.js` (scaled 0.6 to fit the 23-unit corner pad), portrait `leachArt`, the finale `leach-open` (`ui/story-scenes-verdigris-boss.js`, registered in `story-scenes.js`), `QUEST_STORY['unit09/boss-leach']`, `clue_verdigris_leach` and the rewritten `unit09` episode in `story/saga.js`, the live chart entry, bank (`boss-leach#b1/#b2` and nine `end` problems `q1..q8#e1`, `q2-scale#e2`), `tools/lib/verdigris-boss-checks.mjs` (block in `verify-learn.mjs`), and the boss lists in `verify-bench.mjs` and `verify-story.mjs`. The arena body (`buildLeach` in `boss-models.js`) needed no change. Added data: `BASES.carbonate` (Kb = Kw / 4.7e-11), `NEUTRAL_SALTS.kcl`, hand checks in `verdigris-data-checks.mjs`. The burette Tour text now covers a base flask (the acid tube is named under the flask in `sub`).

**Phases (each a different tool, one decision, new case).** 1 scale flasks with lens: water at 60 °C (6.51), HCl 2.8e-7 M at 25 °C (also 6.51) and NaOH 8.6e-7 M at 60 °C (7.00); pick the neutral flask (dial). The meter cannot separate them; the lens can. 2 weak acids: acetic 0.10 M (meter), hydrofluoric 0.0010 M and formic 0.050 M (no meter); rank on a rail by pH from the windows (12, 3 and 110 units of 200) and the strengths; the largest share ionized (HF) is not the lowest pH. 3 salts: ammonium nitrate 0.20 M (4.98), sodium carbonate (11.65), potassium chloride (7.00) into trays. 4 burette: ammonia with hydrochloric acid, four dyes, only methyl red ends at 25.0 mL. 5 mixing flask: ratio of acetate to acetic acid for pH 5.10 (2.27), between the 4.74 and 5.74 reference flasks (q7 s6 extrapolated). Misses name readings (lens counts, window counts, tube volumes, the flask's reading).

**Differs from the spec.** Phase 2 ranks three acids at different strengths (spec: one concentration) because at one strength the windows alone give the order; phase 1 adds a base at 60 °C that reads 7.00. The Leach has one foe per phase (as the Tipper) and reacts only through the pose it is handed on a table. The bank gives the boss `#b1/#b2` because `verify:learn` demands two bench problems of every quest.

**Unverified:** 3D On look of the Leach on the table and its 0.6 scale; 375 px; the new tables at six aspects are checked by `verify:bench` only for layout and pointer paths. Weakest: phase 3 (a meter-read sort, like q5 s5) and phase 4 (q6 s5 with the base flipped).
