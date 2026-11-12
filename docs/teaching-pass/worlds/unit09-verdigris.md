# Verdigris (`unit09`): acids and bases

Read with `docs/teaching-pass/BRIEF.md` and `PATTERNS.md`. The notes below were written on 2026-11-11 from the stage text and the earlier records, without playing the world. Treat every item as a lead to confirm against the source, and expect to find more.

- **Session:** World pass (Sonnet). After the Ember Reach exemplar. Not at the same time as Teeter (shared `eqdata.js`).
- **Earlier teaching pass:** 2026-11-06 (words by tool, glossary, moving particles; record `docs/teaching-pass/Verdigris.md`)
- **Quests:** `src/learn/quests/unit09/`. Chart `src/learn/worlds/unit09-acids-and-bases.js`. Bank `src/learn/bank/unit09.json`. Glossary `src/learn/glossary/verdigris.js`. Checks: `verify:verdigris`, `tools/verify-teaching-verdigris.mjs`.
- **Kits:** `ph*.js` in `src/learn/table/kits/`; `src/learn/engine/phdata.js`, `phmotion.js`, `eqdata.js` (shared with Teeter).
- **Report on 2026-11-11** (`node tools/teaching-report.mjs unit09 --totals`): 69 stages in 9 modules | briefing 0 | typed 15 (no instrument 0) | cards only 2 | reward long 14 | operation prompt 3 | hint 3 move/arithmetic 3 | vague 0 | register 0 | motive 2

## What is known to be wrong

- **pH is one sentence in a reward.** `q2-scale` stage 1's reward says "pH is minus the log of the H₃O⁺ concentration", and stage 2 demands a pH to two decimal places from it. Logarithms are assumed. Teach the scale on the bench (each tenfold dilution moves pH by one) before any stage asks for a number, and offer the logarithm recap there.
- **The student's action does not change the particles** in `q2`, `q5`, `q6`, `q7` and `q8` (the earlier pass's own finding): wobbling spheres beside a dial.
- **Long rewards carry the lesson**, six of eight in `q8-capacity`.
- **15 typed stages**, four in `q2-scale`.
- **Convoluted or double prompts:** "Dilute until one more dilution would change the pH by less than 0.1"; several "do X, then say Y".
- **Predict lead clips are missing where any clip of the topic shows the answer** (`q3` stage 1, `q4` stage 1, `q6` stage 2). Choose a neighbouring case from a different substance and record the choice.
- `q1` stage 7 (Lewis acids) says "beyond the exam" in its own prompt. It stays (owner decision): remove the label and make it followable.
- **Errors:** "Methyl red changed between 25.0 and 25.0 mL" (boss phase 4).

## Bench notes

- `q1-handover` (8): proton transfer. Two card-only stages; the proton moving between two drawn molecules should be the thing the student does.
- `q2-scale` (8): pH. See above; this is the bench most likely to lose a student.
- `q3-weak` (8): weak acids as an equilibrium (strong acids ionize completely, weak ones partly: the world's core idea). The count of ionized units is already honest; let the student act on it.
- `q4-structure` (8): structure and strength. No typed stages; check the reasons are shown and not asserted.
- `q5-salts` (8): salts in water.
- `q6-titrate` (8): titration curves. The flask's contents at each region of the curve should be visible.
- `q7-buffer` (8): buffers. Added acid being used up by the conjugate base is the thing to see.
- `q8-capacity` (8): buffer capacity. Shorten every reward by moving its content before the stage or into the bench.
- `boss-leach` (5): re-test; fix the indicator text.

## Owner requests to check against the source

None specific beyond `docs/feedback.md` general feedback.

## Traps

A painter must not write to its fixture; painter memory is `phmotion.scratch` (a `WeakMap`). *Strength* means concentration in most places and acid strength in `q4`; the rename tool has a skip list for it. `tools/teaching-ratchet.json` is rewritten whole by `--update`: write by merging under the world's key.

## Record

Filled by the plan session (if any) and the pass session. Keep it current after every bench.

### Bench-level sequence

Planned 2026-11-11 by a plan session (no code changed). 69 stages become 65. Stage numbers are the new ones; "was n" gives the old index. Size: S strings and question only, M existing instrument with a new graded act or view, L new instrument. Most prompts here are already questions; the work is in `q2`, in the double prompts, in rewards that carry the lesson, and in the first use of each calculation.

| Bench | Idea | Structure | Terms it introduces (gloss) |
| --- | --- | --- | --- |
| `q1-handover` 8 → 7 | An acid passes a proton to a base; each leaves behind its conjugate; water can do either, and does both to itself. | Pairs in Reactions cut (stage 4 again, cards only). Stage 7 (Lewis acids; owner decision: stays) loses its label. | proton (H⁺), hydronium (H₃O⁺), Brønsted–Lowry acid and base, conjugate acid–base pair, amphoteric, autoionization, Kw, Lewis acid and base |
| `q2-scale` 8 → 9 | pH counts H₃O⁺ in tenfold steps: each tenfold dilution raises it by one. Between the steps the logarithm gives it. pH + pOH = 14 at 25 °C; neutral means equal H₃O⁺ and OH⁻. | The scale is taught on the bench before any number is asked: stage 1 asks what a dilution does, new stage 2 asks for a whole-number pH from a power of ten, and only stage 3 needs the log key, after a worked case and a logarithm primer. | pH, logarithm (recap), pOH, strong acid, strong base, neutral |
| `q3-weak` 8 → 8 | A weak acid ionizes only in part and reaches an equilibrium with a constant, Ka. | No stage moved. Stage 6 asks what dilution does, not for a count to hit. | weak acid, percent ionization, Ka, pKa, Kb |
| `q4-structure` 8 → 7 | An acid is stronger the better its conjugate base carries the negative charge: a larger atom, a more electronegative atom, electron-pulling neighbours, or resonance. | Chlorine Nearby cut (the inductive effect a second time). Each card draws its conjugate base with the charge on it. The last stage is ranked from structure with no race. Order runs weakest on the left. | conjugate base (recap), inductive effect, resonance (recap) |
| `q5-salts` 8 → 7 | The ion left by a weak acid or weak base reacts with water, so a salt solution need not be neutral. | Three Unlabelled Salts cut (stage 5 again, as three dials). In stage 5 the meter reads two flasks and the other two are predicted. | neutralization, salt hydrolysis |
| `q6-titrate` 8 → 8 | A titration curve shows the equivalence point; for a weak acid it lies above 7 and the half-way pH is the pKa. | No stage moved. | titration curve, equivalence point, half-equivalence point, indicator, polyprotic acid |
| `q7-buffer` 8 → 7 | A weak acid with its conjugate base holds the pH: the base takes up added acid, the acid added base. | Sealed Flasks cut (stage 3 again). | buffer, Henderson–Hasselbalch equation |
| `q8-capacity` 8 → 7 | Which form of an acid is present depends on pH against pKa; a buffer holds best near its pKa and holds more the more it contains. | Acid on a Solid cut (solubility, with a 60-word reward that says its size is not worked out). Every reward shortened; its content goes before the stage or onto the bench. | protonation state, buffer capacity |
| `boss-leach` 5 → 5 | Re-test of `q2`, `q3`, `q5`, `q6`, `q7`. No new idea. | Indicator text corrected. | none |

Words (extend `glossary/verdigris.js`): "hands over", "lets go of", "gives up" a proton → "donates" or "passes" (one verb: "donates", glossed once as "passes to another particle"); "takes" a proton → "accepts"; "comes apart" → ionizes (for acids) and dissociates (for ionic bases), each glossed once; "units" → molecules or formula units; "spheres" in windows stays as a word for the picture only; "dye" → indicator after `q6` stage 5; "strength" meaning concentration → concentration. Add logarithms, moles, molarity and equilibrium constant to `NEEDS` with primers at first use.

### Plan rows

#### `q1-handover` (7 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Where the Hydrogen Goes | HCl donates a proton to water. | "Pour": the white hydrogen leaves each HCl and ends on a water molecule; the student carries a proton to that particle on the bench. | 2 (proton, hydronium and Brønsted–Lowry acid all in a 35-word reward). | **S.** Briefing: "A hydrogen atom without its electron is a single proton, written H⁺. Watch the white hydrogen when the HCl is poured." Prompt: "Which particle holds the proton after HCl is poured into water?" Reward: "Each HCl passed a proton to a water molecule, making hydronium, H₃O⁺, and leaving Cl⁻. A substance that donates a proton is a Brønsted–Lowry acid." | |
| 2 | Ammonia in Water (predict) | A guess. | Lead clip of HCl in water (the neighbouring case); five cards. | None of weight. | Keep. | |
| 3 | Ammonia Acts | Ammonia accepts a proton from water, leaving OH⁻. | The white hydrogens of water end on ammonia. | 1 ("Carry the proton the way it moves"). | **S.** Prompt: "Which particle donates a proton when ammonia is poured into water, and which accepts it?" (answered by carrying the proton). Reward: "Water donated a proton to ammonia, making NH₄⁺ and leaving OH⁻. A substance that accepts a proton is a Brønsted–Lowry base." | |
| 4 | What Is Left | An acid and what is left of it after donating a proton are a conjugate pair. | Formula cards; nothing responds. Kept as the one application stage. | 2 (term in the reward). | **S**, pattern 6. Briefing: "What is left of an acid after it donates a proton is its conjugate base. The two differ by exactly one proton." Prompt: "What is the conjugate base of each acid?" | |
| 5 | Two Ways Round | Water is an acid with one partner and a base with another. | Two windows poured: water gains a proton in one and loses one in the other. | 1 ("Find the substance that..."). | **S.** Prompt: "Which substance acts as an acid in one window and as a base in the other?" Reward kept. | |
| 6 | Ions in Pure Water | [H₃O⁺] × [OH⁻] is the same in every water at 25 °C: Kw. | The board prints a number for each of three waters as the two tiles are arranged. | 7 (nothing says pure water has ions at all until the reward); 42-word reward. | **S.** Briefing: "Now and then one water molecule donates a proton to another, so pure water always holds a little H₃O⁺ and OH⁻. This is autoionization." Prompt: "Which combination of the two concentrations is the same for all three waters?" Reward: "[H₃O⁺] × [OH⁻] is 1.0 × 10⁻¹⁴ in every water at 25 °C. That number is Kw." | |
| 7 | Without a Proton (owner: stays) | Some acid–base reactions move an electron pair, not a proton. | "Mark" dial tags the hydrogens or the lone pairs; after the pour, nitrogen's lone pair lies between N and B and no hydrogen has moved. | "beyond the exam" in the fixture title, prompt and reward. | **S.** Fixture title "Particle window". Briefing: "Not every acid–base reaction moves a proton. The Mark dial lets you follow either the hydrogens or the lone pairs." Prompt: "What moves when boron trifluoride, BF₃, meets ammonia?" Reward: "Nitrogen shared its lone pair with boron, and no proton moved. A substance that accepts an electron pair is a Lewis acid; one that donates it is a Lewis base." | |
| (cut) | Pairs in Reactions | | | Cards only; stage 4 again. | Archive under `archive/2026-11-11/verdigris/`. | |

#### `q2-scale` (9 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Reading the Steps | Each tenfold dilution raises the pH by one. | "Dilute": the H₃O⁺ in the sample falls 1000, 100, 10 and the meter reads 1, 2, 3. | 3 ("Dilute the acid until its pH is 3": a key pressed until a reading); 2 (pH defined in the reward as "minus the log"). | **M** (four cards and a slot: "Rises by 1", "Falls by 1", "Halves", "Rises by 10"; the check refuses until two dilutions are made). Briefing: "The pH meter reads how much H₃O⁺ a solution holds. The lower the pH, the more H₃O⁺." Prompt: "What does a tenfold dilution do to the pH of an acid?" Reward: "Each tenfold dilution leaves a tenth of the H₃O⁺ and raises the pH by 1. One step on the pH scale is a factor of ten." | |
| 2 | Powers of Ten (typed, new) | For a concentration that is a power of ten, the pH is the power with its sign dropped. | Two flasks read by the meter: 1.0 × 10⁻² M reads 2.00 and 1.0 × 10⁻³ M reads 3.00. A third, 1.0 × 10⁻⁵ M, has no seat. | New. Before this the first number asked for needed a logarithm. | **M** (old stage 2's table with the third flask at 1.0 × 10⁻⁵ M). Prompt: "What is the pH of 1.0 × 10⁻⁵ M hydrochloric acid?" Reward: "5.00. A strong acid is completely ionized, so its H₃O⁺ concentration is its own concentration, and the pH is the power of ten with its sign dropped." | |
| 3 | Between the Flasks (typed, was 2) | pH = −log[H₃O⁺] places every concentration on the scale. | Flasks at 1.0 × 10⁻³ and 1.0 × 10⁻⁴ M read 3.00 and 4.00; the flask at 3.2 × 10⁻⁴ M has no seat. | 7 (logarithm assumed; hint 3 "take its negative log"). | **S**, worked case in the briefing, logarithm primer offered. Briefing: "For a concentration between two powers of ten, the logarithm gives the place between: pH = −log[H₃O⁺]. The log key on the calculator works it out." Worked lines: "[H₃O⁺] = 2.0 × 10⁻³", "log = −2.70", "pH = 2.70". Prompt: "What is the pH of 3.2 × 10⁻⁴ M hydrochloric acid, to two decimal places?" Miss: which two flasks the typed pH lies between. | |
| 4 | Two Meters (typed, was 3) | pH + pOH = 14 at 25 °C. | A pH meter and a pOH meter on three sodium hydroxide flasks. | 1 (a two-part instruction). | **S.** Briefing: "The pOH meter counts OH⁻ the way the pH meter counts H₃O⁺." Prompt: "What do the pH and the pOH of a solution add up to?" | |
| 5 | Two Hydroxides Each (typed, was 4) | A strong base dissociates completely; one Ba(OH)₂ gives two OH⁻. | The barium hydroxide window shows two OH⁻ for each Ba²⁺. | 6 (hint 3 the route). | **S.** Prompt: "What is the pH of 0.025 M barium hydroxide, to two decimal places?" Hint 3: "The pH follows from the OH⁻ actually in the water, which is not the concentration on the label." Reward: "0.025 M Ba(OH)₂ gives 0.050 M OH⁻: pOH 1.30, pH 12.70. A base that dissociates completely is a strong base." | |
| 6 | Diluting Again and Again (was 5) | Water's own H₃O⁺ sets a limit: diluting an acid brings the pH to 7, never past it. | Each press: the step in pH shrinks as the acid's H₃O⁺ falls below the 10⁻⁷ M that water supplies. | 5 ("Dilute until one more dilution would change the pH by less than 0.1"). | **M** (three cards and a slot: "It keeps rising past 7", "It stops near 7", "It stops near 14"; the check refuses until the flask is below 10⁻⁷ M). Prompt: "What pH does hydrochloric acid approach as it is diluted again and again?" Reward kept, cut to: "Water supplies 1.0 × 10⁻⁷ mol/L of H₃O⁺ of its own, so the 1.0 × 10⁻⁹ M flask reads 7.00, not 9.00." | |
| 7 | Warm Water (predict; was 6) | A guess. | Flask of pure water at 25 °C; four cards. | None of weight. | Keep. | |
| 8 | Warming the Water (was 7) | Neutral means equal H₃O⁺ and OH⁻, which is pH 7 only at 25 °C. | Temperature dial: both ion counts rise together and the meter falls to 6.63. | 1 (two-part). | **S.** Prompt: "Is pure water at 50 °C acidic, neutral or basic?" | |
| 9 | Sealed Flask (typed, was 8) | The log is undone with a power of ten: [H₃O⁺] = 10^(−pH). | Meter reads 2.62 on the sealed flask. | 7 (the inverse never shown). | **S**, worked case. Briefing worked lines: "pH = 3.30", "[H₃O⁺] = 10^(−3.30)", "= 5.0 × 10⁻⁴ mol/L". Prompt: "What is the concentration of H₃O⁺ in the sealed flask, in mol/L?" | |

#### `q3-weak` (8 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Same Reading? (predict) | A guess. | Two tags; four cards. No lead clip: a clip of acetic acid would show the answer. | 7. | **S.** Use the HCl pour from `q1` stage 1 as the lead (every HCl ionizes), labelled as hydrochloric acid only; record the choice. Prompt kept. | |
| 2 | Sorting the Flasks | Some acids ionize almost completely, others only slightly. | Each window shows 200 molecules: nearly all ionized for HCl, a few for acetic and hydrofluoric acid; the meters differ. | "let go of its protons". | **S.** Trays: "Nearly all ionized", "Only a little ionized". Prompt: "Which acids are nearly all ionized and which only a little?" Reward: "At the same concentration every HCl ionized and only a few acetic acid molecules did. An acid that ionizes only in part is a weak acid; one that ionizes fully is a strong acid." | |
| 3 | How Much Ionized (typed) | Percent ionization = H₃O⁺ formed ÷ acid put in. | Meter reads 2.88; the flask prints 0.10 M. | 6 (hint 3 the steps). | **S.** Briefing: "Percent ionization is the share of an acid's molecules that have donated a proton, as a percent." Prompt: "What percent of the acetic acid in this flask is ionized?" Hint 3: "The meter tells how much H₃O⁺ formed (stage 9 of the last bench shows how), and the label tells how much acid went in." | |
| 4 | The Steady Ratio | One ratio is the same at every concentration: Ka. | Three flasks; the board prints a number for each as tiles are arranged. | None of weight. | **S.** Prompt: "Which ratio of concentrations is the same for all three acetic acid flasks?" Reward kept. | |
| 5 | A Concentration Between the Flasks (typed) | Ka gives the pH at a concentration no flask shows. | Flask at 0.15 M with no meter; plate with Ka. | 7 (first equilibrium calculation here, cold; hint 3 is the method). | **S**, worked case in the briefing (0.10 M). Worked lines: "x² ÷ 0.10 = 1.8 × 10⁻⁵ (x is small beside 0.10)", "x = 1.3 × 10⁻³ mol/L", "pH = 2.88". Prompt: "What is the pH of 0.15 M acetic acid, to two decimal places?" | |
| 6 | Diluting the Acid | The more dilute a weak acid, the larger the share ionized. | Each "Dilute": the count of ionized molecules among the 200 rises while the meter's pH also rises. | 3 ("Dilute until 25 of the 200 units have come apart"). | **M** (three cards and a slot: "A larger share is ionized", "A smaller share is ionized", "The share does not change"; the check refuses until two dilutions). Prompt: "What happens to the share of acetic acid that is ionized as it is diluted?" Reward kept. | |
| 7 | The Base Constant | A weak base has the same kind of constant: Kb. | Three ammonia flasks; board. | None of weight. | **S.** Prompt: "Which ratio is the same for all three ammonia flasks?" | |
| 8 | Acid and Base Together | For an acid and its conjugate base, Ka × Kb = Kw. | Board with Ka and Kb tiles for three pairs. | Nothing physical; kept because `q5` stage 7 needs it. | **S.** Prompt: "Which combination of Ka and Kb is the same for every acid and its conjugate base?" | |

#### `q4-structure` (7 stages)

Card face (M, one painter change): each acid card draws its conjugate base beside it with the negative charge shown as a shaded region: small and dense on fluoride, spread over a large bromide, spread over two oxygens in acetate. Rails run weakest acid on the left.

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Which Is Strongest? (predict) | A guess. | Three cards. | "holds on harder". | **S.** Prompt: "Which of HF, HCl and HBr is the weakest acid and which the strongest?" | |
| 2 | Racing the Halides | A larger conjugate base spreads the charge and is more stable, so its acid is stronger. | Race: two acids compete for a base and the count of protons each kept is shown; cards show the three halide ions' sizes with the charge spread on each. | 2 (the reason was in the reward only). | **S** plus card face. Briefing: "In a race two acids compete to donate their protons to a base; the stronger acid ends with fewer protons." Prompt kept, reordered: "Which of the three acids is weakest and which strongest?" Reward: "HF is the weakest. Bromide is the largest ion and spreads its negative charge over the most space, so HBr donates its proton most easily." | |
| 3 | Across a Period | A more electronegative atom carries the charge better. | Electronegativity on each card; races. | None of weight. | **S.** Prompt: "Which of CH₄, NH₃, H₂O and HF is the weakest acid and which the strongest?" | |
| 4 | Extra Oxygens | Electronegative atoms nearby pull charge away through the bonds: the inductive effect. | Each extra oxygen drawn pulling shading off the O⁻. | "pull" is the right word here; reward kept. | **S.** Prompt: "Which of the four chlorine acids is weakest and which strongest?" | |
| 5 | Sharing the Charge | A conjugate base that spreads its charge over two atoms by resonance is more stable. | Acetate and formate drawn with the charge over both oxygens; ethoxide with it on one. | None of weight. | **S.** Prompt: "Which of ethanol, acetic acid and formic acid is the weakest acid and which the strongest?" | |
| 6 | Bases from Acids (was 7) | The stronger an acid, the weaker its conjugate base. | Each base raced against acetic acid: Cl⁻ takes 0 of 100 protons, OH⁻ takes 100. | None of weight. | **S.** Prompt: "Which base accepts the fewest protons from acetic acid and which the most?" | |
| 7 | Five Unlabelled Acids (was 8) | Structure predicts strength. | Five cards with structures and conjugate bases drawn. No race. | 3 (ranked by racing neighbours; hint 3 said so). | **M** (the race fixture removed). Prompt: "From their structures, which acid is weakest and which strongest?" Reward kept. | |
| (cut) | Chlorine Nearby | | | The inductive effect again. | Archive. | |

#### `q5-salts` (7 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Acid Used Up | A strong acid and a strong base that exactly use each other up leave a neutral solution. | Each pour removes acid from the window; at none left the meter reads 7.00. | 1 (the prompt is the move). | **S.** Prompt: "What is the pH when sodium hydroxide has exactly used up the hydrochloric acid?" Reward: "7.00. Na⁺ and Cl⁻ do not react with water. An acid and a base using each other up is neutralization." | |
| 2 | What Will It Read? (predict) | A guess. | Four cards. | None of weight. | Keep. | |
| 3 | Acetic Acid Used Up | The acetate left behind accepts protons from water, so the solution is basic. | At none left the meter reads above 7; the window shows a few acetate turned back to acetic acid and OH⁻ present. | 1. | **S.** Prompt: "What is the pH when sodium hydroxide has exactly used up the acetic acid?" Reward kept. | |
| 4 | Ammonia Used Up | The ammonium left behind donates protons to water, so the solution is acidic. | Meter reads 5.28. | 1. | **S.** Prompt: "What is the pH when hydrochloric acid has exactly used up the ammonia?" | |
| 5 | Four Salts | The ion from a weak parent reacts with water; the ion from a strong parent does not. | Meter seats on sodium chloride and sodium fluoride; a plate lists the strong acids and strong bases. | 3 (all four were read and sorted against 7; hint 3 said so). | **M**, pattern "observe one case, answer the neighbouring case" (two meter seats; a `plaque` "Strong acids: HCl, HNO₃ … Strong bases: NaOH, KOH …"). Prompt: "Which salt solutions are acidic, which neutral and which basic?" | |
| 6 | Acid Left Over (typed) | When one is in excess, what is left over sets the pH. | The window shows the molecules of acid still unreacted after the pour. | 1 (a 27-word prompt). | **S.** The amounts move onto the flask's label. Prompt: "What is the pH of the flask after the pour?" | |
| 7 | A Salt Between the Flasks (typed) | A salt's pH follows from its ion's Kb, which comes from Ka. | Flask of 0.10 M sodium acetate; plate with acetic acid's Ka. | 7 (four steps, cold). | **S**, worked case in the briefing (the 0.050 M acetate of stage 3). Worked lines: "Kb = 1.0 × 10⁻¹⁴ ÷ 1.8 × 10⁻⁵ = 5.6 × 10⁻¹⁰", "x² ÷ 0.050 = 5.6 × 10⁻¹⁰, x = 5.3 × 10⁻⁶ = [OH⁻]", "pOH 5.28, pH 8.72". Prompt: "What is the pH of 0.10 M sodium acetate, to two decimal places?" | |
| (cut) | Three Unlabelled Salts | | | Three dials, three decisions; stage 5 again. | Archive. | |

#### `q6-titrate` (8 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Using Up the Acid | The steep rise of a titration curve marks the equivalence point. | Each pour extends the curve; the flask's window shows acid falling to none at the steep rise. | 1 ("Mark the volume..."). | **S.** Briefing: "A titration curve plots the pH in the flask against the volume of base poured in." Prompt: "What volume of sodium hydroxide exactly uses up the hydrochloric acid?" | |
| 2 | The Next Acid (predict) | A guess. | Four cards. | None of weight. | Keep. | |
| 3 | Two Acids, One Burette | A weak acid's equivalence point is above 7. | Two curves side by side; two displays. | 1. | **S.** Prompt: "Is the pH at acetic acid's equivalence point below, at or above 7?" | |
| 4 | Half Way | Half way to equivalence, pH = pKa. | Displays at half the equivalence volume beside each acid's Ka and pKa. | 1 (a 26-word two-part prompt). | **S.** Prompt: "Half way to the equivalence point, what does the pH equal?" Reward kept. | |
| 5 | The Right Indicator | An indicator must change colour within the steep rise. | Four tubes change colour at different volumes as base is poured. | "dye" (the term is indicator; the reward defines it). | **S.** Briefing: "An indicator is a substance whose colour depends on the pH." Prompt: "Which indicator changes colour at the equivalence point of this titration?" Reward shortened to its first two facts. | |
| 6 | More Than One Rise | A polyprotic acid donates its protons one at a time, each with its own rise. | Two steep rises, at 10.0 and 20.0 mL. | 1 (two-part); reward 46 words. | **S.** Prompt: "How many protons does one molecule of sulfurous acid donate?" Reward: "The curve rose steeply twice, at 10.0 and 20.0 mL: two protons, each needing the same amount of base. Such an acid is polyprotic." | |
| 7 | How Concentrated Is the Acid (typed) | Moles of base at the colour change equal the moles of acid. | Burette reading at the colour change. | "How Strong" in the title means concentration. | **S.** Prompt kept. | |
| 8 | A Sealed Weak Acid (typed) | The half-equivalence pH gives Ka. | Curve; display; list. | 6 (hint 3 the route). | **S.** Hint 3: "One point on this curve was shown, two stages back, to equal the pKa." | |

#### `q7-buffer` (7 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Which Moves More? (predict) | A guess. | Four cards. | None of weight. | Keep. | |
| 2 | The Same Acid, Two Flasks | A mixture of a weak acid and its conjugate base resists a change in pH: a buffer. | One pour moves water from 7.00 to 2.04 and the mixture from 4.74 to 4.66. | 1 (two-part). | **S.** Prompt: "Which flask's pH moves more when the same acid is poured into each?" | |
| 3 | Making a Flask That Holds | A buffer needs both members of a conjugate pair, in good amounts. | Dials for acetic acid and acetate; pours of acid and of base. | None of weight (an open build; keep). | **S.** Prompt: "What must a flask contain to hold its pH against both added acid and added base?" (answered by making one). | |
| 4 | Who Accepts the Acid | The conjugate base accepts the added protons. | After the pour acetate falls 100 to 90 and acetic acid rises 100 to 110; the student carries the proton to an acetate. | 1. | **S.** Prompt: "Which particle in the buffer accepts the protons of the added acid?" | |
| 5 | The pH of a Mixture (typed) | pH = pKa + log(base ÷ acid). | Two metered flasks: equal amounts read the pKa; ten acetate to one acetic acid reads one unit above. | 6 (hint 3 the rule); 2 (the equation named in the reward). | **S**, pattern 6. Briefing: "A buffer's pH sits at the pKa when its two members are equal, and one unit above for each tenfold excess of the base. In full: pH = pKa + log(base ÷ acid), the Henderson–Hasselbalch equation." Prompt kept. | |
| 6 | Making a Target pH (typed) | The equation run backwards gives the ratio for a wanted pH. | The same two flasks; plate. | 7 (the inverse step never shown). | **S**, worked case. Worked lines (target 5.04): "5.04 − 4.74 = 0.30", "ratio = 10^0.30 = 2.0". Prompt kept. | |
| 7 | Base Into the Mixture | The acid member uses up added base. | Acetic acid falls 100 to 90, acetate rises to 110, pH 4.74 to 4.83. | 1; reward ends "The exam does not ask for its size". | **S.** Prompt: "What happens to the buffer's pH when base is poured in?" Reward: "Acetic acid donated protons to the added base, falling from 100 to 90 while acetate rose to 110. The pH rose only from 4.74 to 4.83." | |
| (cut) | Sealed Flasks | | | Stage 3 again. | Archive. | |

#### `q8-capacity` (7 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Which Form? (predict) | A guess. | Four cards. | None of weight. | Keep. | |
| 2 | Reading the Strip | Below its pKa an acid is mostly in its acid form; above, mostly its conjugate base. | pH dial slides along a strip showing the percent of each form. | 1 (two-part); reward 47 words. | **S.** Prompt: "Which form of acetic acid is there more of at pH 3, and which at pH 6?" Reward: "98% acetic acid at pH 3 and 95% acetate at pH 6. The acid form is the larger below the pKa, 4.74, and the base form above it." Term "protonation state" goes; it is not needed. | |
| 3 | An Indicator (typed) | An indicator is a weak acid whose two forms differ in colour; it changes round its pKa. | Strip for methyl red: percentages cross and the colour passes through orange. | Reward 39 words. | **S.** Briefing: "An indicator is a weak acid whose acid form and base form have different colours." Prompt kept. Reward: "The two forms are equal at pH 5.1, methyl red's pKa: red below, yellow above." | |
| 4 | Two Concentrations | A more concentrated buffer changes less for the same added acid. | Same pour: the 0.010 M flask moves to 4.27, the 0.10 M flask to 4.70; windows show how much acetate each had to give. | 1; reward 47 words. | **S.** Briefing: "Buffer capacity is how much acid or base a buffer can take before its pH changes much." Prompt: "Which buffer has the larger capacity?" Reward: "The same pour moved the dilute buffer to 4.27 and the concentrated one only to 4.70. More of each member means more capacity." | |
| 5 | The Limit (typed) | A buffer fails when the member that reacts with what is added runs out. | Flask 1 loses 5 acetate with each pour and fails at 8 pours; flask 2 holds three times as much. | Reward 49 words. | **S.** Prompt: "How many pours of acid can the second flask take before its acetate is used up?" Reward: "Flask 1's 40 acetate lasted 8 pours, so flask 2's 120 last 24. A buffer is spent when one member is used up." | |
| 6 | Three Ratios | A buffer holds best when its two members are near equal. | Same base into 1 : 1, 10 : 1 and 100 : 1 flasks: steps of 0.09, 0.21 and 0.61. | 1; reward 47 words. | **S.** Prompt: "Which ratio of acetic acid to acetate holds its pH best?" Reward: "The 1 : 1 flask moved least. A buffer works well only while its members are within about a factor of ten of each other." | |
| 7 | Choosing an Acid (was 8) | The best buffer for a pH uses the acid whose pKa is nearest it. | Strip for three sealed acids at pH 4.5: one is near half and half. | Hint 3 nearly the rule; reward 47 words. | **S.** Prompt: "Which sealed acid makes the best buffer at pH 4.5?" Reward: "Acid Y: at pH 4.5 it is 64% acid form and 36% base form. Choose the acid whose pKa is closest to the pH wanted." | |
| (cut) | Acid on a Solid | | | See the sequence table. | Archive. | |

#### `boss-leach` (5 phases)

| # | Phase | Re-tests | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- |
| 1 | The Warm Flasks | `q2` stage 8. | 1 ("Set the dial to..."); hint 3 the rule. | **S.** Prompt: "Which flask is neutral?" | |
| 2 | The Three Acids | `q3` stages 2 and 3. | 6 (hint 3 the arithmetic); order as built is fine (lowest pH on the left). | **S.** Prompt: "Which acid solution has the lowest pH and which the highest?" | |
| 3 | The Salt Vats | `q5` stage 5. | 3 (meter on all three). | **M** (meter seat on one flask; the plate of strong acids and bases). Prompt: "Which salt solutions are acidic, which neutral and which basic?" | |
| 4 | The Dosing Run | `q6` stage 5. | Error: "Methyl red changed between 25.0 and 25.0 mL". | **S.** Reward: "Ammonia needed 25.0 mL of acid and the pH there was 5.28. Methyl red changes colour at about that pH, so it is the indicator for this titration." | |
| 5 | The Mixing Flask (typed) | `q7` stage 6. | None of weight. | **S.** Prompt: "What ratio of acetate to acetic acid gives a pH of 5.10?" | |

### Open for the builder

- `q2` stage 2: a new stage id and new numbers in `verify:learn`'s indices for this quest; the bank's problems for `q2`.
- `q2` and `q7`: confirm the calculator has log and 10^x keys and that `primers.js` has a logarithm primer; add one if not.
- `q4`: the conjugate-base drawing on `phacid` cards. If it does not fit a card at phone size, draw it on the race fixture for the two cards in the race.
- `q5` stage 5 and boss phase 3: `phmeter` seats on some flasks only (boss phase 2 already does this).
- Stages that gain cards and a slot (`q2` stages 1 and 6, `q3` stage 6) must re-lay inside the phone-size floors.
- Lead clips: `q3` stage 1 uses the HCl pour; `q4` stage 1 and `q6` stage 2 stay without one. Record each choice in this file.
- `tools/teaching-ratchet.json` is rewritten whole by `--update`: merge under the world's key.

### Hand-back (plan)

- 65 stages: kept as built 6, reworded (S) 52, redesigned M 7, L 0. Of the 65, 1 is new (`q2` stage 2). Cut: 5.
- Most likely to go wrong in the build: `q2-scale` (a new stage, two changed graded acts, the first logarithm, and hard-coded indices); `q4-structure` (a new drawing on every card, and the last stage loses its instrument); `q5-salts` stage 7 (a four-step calculation that depends on the worked case being read).

### Structural changes

### Chemistry corrections

### Still weak

(Ordered by how likely a student is to get lost. For each: the stage, what is weak, why it was not fixed.)

### For the owner to look at

(Stages whose table was rebuilt or added. Nobody has seen these on a screen.)

### For close-out

(Stage and quest counts that changed; shared code changed; doctrine or engine lessons.)
