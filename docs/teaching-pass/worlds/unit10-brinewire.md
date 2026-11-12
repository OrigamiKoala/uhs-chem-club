# Brinewire (`unit10`): electrochemistry

Read with `docs/teaching-pass/BRIEF.md` and `PATTERNS.md`. The notes below were written on 2026-11-11 from the stage text and the earlier records, without playing the world. Treat every item as a lead to confirm against the source, and expect to find more.

- **Session:** World pass (Sonnet). After the Ember Reach exemplar. The world in the best state: expect the shortest session.
- **Earlier teaching pass:** 2026-11-06, four runs (glossary, tap-a-particle answers, strips dragged to the rail; record `docs/teaching-pass/Brinewire.md`)
- **Quests:** `src/learn/quests/unit10/`. Chart `src/learn/worlds/unit10-electrochemistry.js`. Bank `src/learn/bank/unit10.json` and `src/learn/bank/unit10/`. Glossary `src/learn/glossary/brinewire.js`. Checks: `verify:brinewire` (`tools/lib/brinewire-*-checks.mjs`), `tools/verify-teaching.mjs` with `tools/teaching-ratchet.json`.
- **Kits:** `cell*.js` in `src/learn/table/kits/`; `src/learn/engine/celldata*.js`, `cellscene.js`. Not shared.
- **Report on 2026-11-11** (`node tools/teaching-report.mjs unit10 --totals`): 53 stages in 7 modules | briefing 0 | typed 11 (no instrument 0) | cards only 0 | reward long 0 | operation prompt 10 | hint 3 move/arithmetic 3 | vague 6 | register 0 | motive 0

## What is known to be wrong

- **`verify:story` fails on this world today** (the only baseline failure): the `q1-halves` story animation uses "oxidation" before the bench that `VOCABULARY` says introduces it. Fix it here: either the term is properly introduced in `q1` (it is the bench about half-reactions, so it should be) and `VOCABULARY` is corrected, or the story wording changes.
- **11 typed stages**, four in `q4-potential` and three in `q6-electrolysis`. `q4` stage 7 computes log K from a cell voltage in several steps with one formula hint.
- `q1` stage 5 is titled "Who Gives (Beyond the Exam)". It stays (owner decision): remove the label and make it followable.
- **No stage has a briefing.**
- **Five stages still answer by picking a statement** because the answer is a relation between readings; check each is still the best form.
- The mechanism views were built from the instrument's read function and once drew sealed answers; the check for that exists. Keep it passing.

## Bench notes

- `q1-halves` (8): oxidation and reduction as electrons lost and gained. Introduce oxidation, reduction and oxidation number here with glosses.
- `q2-activity` (8): the activity series. Strips are dragged to the rail already; make sure the cause (which metal gives up electrons more readily, seen as atoms leaving the strip) is what the student reasons from.
- `q3-galvanic` (8): building a cell. No typed stages.
- `q4-potential` (8): cell potential and free energy. Voltage is energy per electron (the world's core idea). Calculation pattern for the four typed stages; stage 7 needs a worked case or a simpler ask.
- `q5-load` (8): non-standard conditions. A cell runs down until Q = K, not until the reactants are gone: that should be seen.
- `q6-electrolysis` (8): electrolysis and Faraday's law. Count electrons to atoms plated before the formula.
- `boss-clamp` (5): two typed phases; re-test.

## Owner requests to check against the source

None specific beyond `docs/feedback.md` general feedback.

## Traps

3D and flat views must share one fit, or a tap lands on the neighbouring particle. A view needs the instrument's read of what the player may see, not the planner's. One builder per fixture kind lives in `cell-scenes.js`; do not write per-stage models.

## Record

Filled by the plan session (if any) and the pass session. Keep it current after every bench.

### Bench-level sequence

Planned 2026-11-11 by a plan session (no code changed). 53 stages become 50. Stage numbers are the new ones; "was n" gives the old index. Size: S strings and question only, M existing instrument with a new graded act or view, L new instrument. This world is closest to the standard: rewards are short and the model responds. The work is briefings before each new term, prompts that are questions, the worked cases in `q4` to `q6`, and three cuts.

| Bench | Idea | Structure | Terms it introduces (gloss) |
| --- | --- | --- | --- |
| `q1-halves` 8 → 8 | In a redox reaction one particle loses electrons and another gains exactly as many; each half is written with its electrons. | No stage moved. Oxidation, reduction and oxidation number are introduced here, in briefings (this also clears the `verify:story` failure: set `VOCABULARY.introducedAt` for oxidation to stage 3 and name it in that stage's reward). Stage 5 stays (owner decision) without its label. | oxidation number, oxidation, reduction, half-reaction, redox reaction, reducing agent, oxidizing agent |
| `q2-activity` 8 → 8 | A more active metal loses electrons to the ions of a less active one, never the reverse; the order is the activity series. | No stage moved. | displacement, activity series, sacrificial anode |
| `q3-galvanic` 8 → 8 | Separating the two halves makes the electrons travel through a wire: a galvanic cell, with an anode, a cathode and a salt bridge. | No stage moved. Stage 7 stays without its label. | galvanic cell, anode, cathode, salt bridge, cell notation |
| `q4-potential` 8 → 7 | Each half has a potential against one reference; a cell's voltage is the difference; voltage is energy for each unit of charge. | Two Sealed Metals cut (stage 2 again). Stages 6 and 7 get worked cases. | standard reduction potential E°, cell voltage E°cell, Faraday constant, ΔG° = −nFE° |
| `q5-load` 8 → 7 | A cell's voltage falls as it runs and reaches zero when Q = K, with both ions still present; concentration changes the voltage. | Sealed Beakers cut (stage 5 again, and boss phase 4 re-tests it). The Balance Point asks why the cell stopped, not for a division of two printed counts. | concentration cell, Nernst equation, reaction quotient Q (recap) |
| `q6-electrolysis` 8 → 7 | A supply can drive a cell backwards; the charge passed counts the electrons, and so the atoms plated. | Plating Silver cut (Plating Copper with one electron). | electrolytic cell, electrolysis, coulomb, Faraday's law |
| `boss-clamp` 5 → 5 | Re-test of `q2`, `q3`, `q4`, `q5`, `q6`. No new idea. | Rewording. | none |

Words (extend `glossary/brinewire.js`): "gives" and "takes" electrons → "loses" and "gains" (one pair of verbs; "gives up" stays only where a metal atom is the subject and the sense is plain); "bar" → electrode; "strip" stays for the dipped strips of `q2`; "written twice over" → "with every coefficient doubled"; "dots" → ions; "(Beyond the Exam)" leaves two titles and two rewards.

### Plan rows

#### `q1-halves` (8 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Before and After | Some atoms change oxidation number in a reaction and some do not. | Tap a particle: its oxidation number before and after; the model shows zinc atoms leaving the strip and copper forming. | 4 (oxidation number used in the prompt with no gloss). | **S.** Briefing: "An oxidation number is the charge an atom has, or would have if its shared electrons went to the atom that pulls them harder. An uncombined element is 0; a lone ion is its charge." Prompt: "Which particles change oxidation number when zinc meets copper(II) sulfate?" Reward kept. | yes |
| 2 | Where They Go (predict) | A guess. | Lead clip; four cards. | None of weight. | Keep. | yes |
| 3 | Writing the Halves | Each half of the reaction is written with the electrons that balance its charge. | Electrons tapped onto either side of each card; the charge row updates. | 1 ("Write each half ... so that its charge balances"); 2 (oxidation and reduction first in the reward). | **S.** Briefing: "Losing electrons is oxidation and gaining electrons is reduction. Each is written as a half-reaction that shows the electrons." Prompt: "How many electrons does each half-reaction need, and on which side?" Reward: "Zn → Zn²⁺ + 2 e⁻ is the oxidation and Cu²⁺ + 2 e⁻ → Cu the reduction. The electrons zinc lost are the ones copper gained: a redox reaction." | yes |
| 4 | Matching the Electrons | The halves are multiplied so electrons lost equal electrons gained. | Tally of electrons lost against gained as the multipliers change. | 1 ("Balance ... so no electrons are left over"). | **S.** Prompt: "How many aluminium atoms react with how many copper(II) ions?" Reward kept. | yes |
| 5 | Who Loses (owner: stays) | The particle that loses electrons is the reducing agent; the one that gains them is the oxidizing agent. | Two beakers with before and after counts; the model shows which metal dissolves. | Title and reward say "beyond the exam"; 2 (both terms first in the reward). | **S.** Title "Who Loses". Briefing: "The particle that loses electrons makes the other one gain them, so it is called the reducing agent. The particle that gains them is the oxidizing agent." Prompt: "Which particle is the reducing agent in each beaker?" Reward: "Copper and magnesium lost electrons: they are the reducing agents. Ag⁺ and Fe²⁺ gained them: the oxidizing agents." | yes |
| 6 | Permanganate in Acid | In acid, oxygen is balanced with H₂O, hydrogen with H⁺ and charge with electrons. | Dials for H⁺, H₂O and e⁻ on each side; three rows compare left with right. | 6 (hint 3 is the method in order: acceptable as reasoning, but the prompt also lists the tools). | **S.** Briefing: "In acid solution there is plenty of H⁺ and H₂O, and a half-reaction may use them to balance its hydrogen and oxygen." Prompt: "What balances the permanganate half-reaction in acid?" | yes |
| 7 | Joining Two Halves | With the electrons matched, the overall equation has none. | Tally; two cards. | 1. | **S.** Prompt: "How many iron(II) ions react with one permanganate ion?" Reward kept. | yes |
| 8 | Four Sealed Reactions | A reaction is redox only if some atom's oxidation number changes. | Four beakers in the model; particles change or do not. | Hint 3 nearly the rule. | **S.** Prompt: "Which of the four reactions are redox?" Hint 3: "Look for an atom that goes from a lone element to an ion, or back." | yes |

#### `q2-activity` (8 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Coated or Clean | A metal ion gains electrons from a more active metal and coats it. | Strips dipped in each solution come out coated or clean; in the model atoms leave the strip as ions while the other metal forms on it. | 1 ("Find the solution that put a coating on both of the other metals"). | **S.** Prompt: "Which solution's ions gain electrons from both of the other metals?" Reward: "Zinc and copper were both coated in the Ag⁺ solution. The strip's atoms went into solution as ions and silver took their place: a displacement." | yes |
| 2 | Ranking Four Metals | The more solutions a metal is coated in, the more readily it loses electrons. | A mark for every dip, coated or clean. | "gives". | **S.** Prompt: "Which of zinc, iron, lead and copper loses electrons most readily and which least?" (rail, most readily on the left, as the activity series is written). Reward kept. | yes |
| 3 | Back the Other Way (predict) | A guess. | Lead clip; cards. | None of weight. | Keep. | yes |
| 4 | Copper in Zinc | A displacement runs one way only. | The copper strip stays clean in the zinc solution. | 1 (two-part). | **S.** Prompt: "What happens to a copper strip in a zinc solution?" | yes |
| 5 | Hydrogen in the List | Metals above hydrogen release it from an acid; those below do not. | Bubbles on magnesium, zinc and iron in acid; none on copper and silver. | 1. | **S.** Prompt: "Where does hydrogen belong in the activity series of these five metals?" | yes |
| 6 | Iron and a Partner | A more active metal wired to iron loses its electrons in iron's place. | After a week, blue spots mark dissolving iron on some nails and not on others. | 6 (hints 1 and 3 are the move). | **S.** Prompt: "Which metals, wired to an iron nail, keep it from rusting?" Hint 3: "Set the partners that worked beside the activity series." | yes |
| 7 | The Sealed Strip | An unknown metal is placed by what it displaces. | Strip X coated in some solutions and clean in others. | None of weight. | **S.** Prompt: "Where does metal X belong among zinc, iron, lead and copper?" | yes |
| 8 | Take Out the Copper | A metal displaces only metals less active than itself. | Each strip's coating and the ions left in its beaker. | 1 (a 22-word instruction). | **S.** Prompt: "Which metal removes copper(II) ions from the solution and leaves the iron(II) ions?" | yes |

#### `q3-galvanic` (8 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | A Wire Between Beakers (predict) | A guess. | Lead clip; cards. | None of weight. | Keep. | yes |
| 2 | Keep It Running | A wire alone gives a current that dies; a salt bridge lets ions complete the circuit. | Runs plotted with a glass rod, a second wire or a salt tube between the beakers. | 1 ("Make the ammeter keep a current"). | **S.** Prompt: "Which piece between the beakers keeps the current flowing?" Reward: "Only the salt tube did. Its ions move into the beakers and complete the circuit; it is called a salt bridge." | yes |
| 3 | Which Way the Electrons Go | The metals decide the direction, not where the beakers stand. | Three cells, three ammeters. | 1. | **S.** Prompt: "Toward which beaker do the electrons move in each cell?" | yes |
| 4 | Atoms Leave, Atoms Join | Atoms leave the anode as ions (oxidation); ions join the cathode as atoms (reduction). | Counts in each beaker before and after; the model shows atoms leaving one strip and forming on the other. | 2 (anode, cathode and galvanic cell first in the reward). | **S.** Briefing: "The electrode where oxidation happens is the anode. The electrode where reduction happens is the cathode." Markers: "Anode: atoms leave", "Cathode: atoms join". Prompt: "Which strip is the anode and which the cathode?" Reward: "Zinc atoms left as Zn²⁺ at the anode and Cu²⁺ ions became atoms at the cathode. A cell that runs by itself like this is a galvanic cell." | yes |
| 5 | What the Bridge Carries | Negative ions move toward the anode beaker, where positive ions are being made. | Ion counts after the run; trails behind the bridge's ions. | 1. | **S.** Prompt: "Toward which beaker do the negative ions in the salt bridge move?" | yes |
| 6 | Weighing the Strips | The anode loses mass and the cathode gains it. | Balance readings before and after for each strip. | 1 (two-part); 6 (hint 1 is a 40-word procedure; hint 3 the subtraction). | **S.** Prompt: "Which strip gains mass as the cell runs?" Hints rebuilt. | yes |
| 7 | Shorthand (owner: stays) | Cell notation writes the anode half on the left and the cathode half on the right. | Plate describing the cell; seven symbols to order. | Title and reward say "beyond the exam". | **S.** Title "Shorthand". Briefing: "Cell notation lists a cell from anode to cathode. A single bar separates a solid from its solution and a double bar stands for the salt bridge." Prompt: "How is the zinc–copper cell written in cell notation?" Reward: "Zn | Zn²⁺ || Cu²⁺ | Cu." | yes |
| 8 | The Sealed Cell | The anode is found from the direction of the electrons and from the mass lost. | Ammeter and balance on a sealed cell. | 6 (hint 3 the inference). | **S.** Prompt: "Which strip is the anode of the sealed cell?" | yes |

#### `q4-potential` (7 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Against a Reference | Every metal's half can be measured against one reference: its standard reduction potential. | Each electrode seated on the board reads a signed voltage. | 2 (E° defined in a 39-word reward); a ranking of readings, kept as the first sight of the scale. | **S.** Briefing: "Each electrode is measured against the same hydrogen electrode, which is set at 0 V. The reading is the metal's standard reduction potential, E°." Prompt: "Which metal has the lowest standard reduction potential and which the highest?" Reward: "Magnesium −2.37 V, zinc −0.76 V, copper 0.34 V, silver 0.80 V. The higher the E°, the more readily the metal's ions gain electrons." | yes |
| 2 | A Cell Nobody Wired (typed) | A cell's voltage is the difference between its two potentials. | Two readings on the board; the model shows which metal dissolves. | 6 (hint 3 the subtraction). | **S.** Briefing: "A cell's voltage is the gap between its two electrodes' potentials: the higher one is the cathode." Prompt kept. Hint 3: "Find how far apart the two readings are on one scale; one of them is below zero." | yes |
| 3 | Which Cells Run | A cell with a positive voltage runs by itself; reversed, the sign changes and it does not. | Voltmeter and lamp on four cells. | 1. | **S.** Prompt: "Which cells run by themselves?" | yes |
| 4 | Twice Over (predict) | A guess. | Lead clip; cards. | "written twice over". | **S.** Prompt: "A zinc–copper cell reads 1.10 V: what does it read when every coefficient in its equation is doubled?" | yes |
| 5 | Doubling the Equation | Voltage is energy for each unit of charge, so it does not change with the amount; the energy does. | Two kept lines: 1.10 V and 212 kJ; 1.10 V and 425 kJ. | 1 (a 23-word two-part instruction). | **S.** Prompt: "What changes when twice as much zinc reacts: the voltage, the energy released, or both?" Reward kept. | yes |
| 6 | The Energy Released (typed) | Energy released = moles of electrons × charge of a mole × voltage. | Cell meter; equation under the cell; plate with the Faraday constant. | 7 (no worked case; hint 3 is the formula). | **S**, worked case in the briefing (stage 5's cell). Briefing: "The Faraday constant, F, is the charge of one mole of electrons: 96,485 coulombs. One volt is one joule for each coulomb." Worked lines: "2 mol e⁻ × 96,485 C/mol = 192,970 C", "× 1.10 V = 212,000 J = 212 kJ". Prompt kept. Reward: "2 × 96,485 × 2.71 = 523 kJ released using the Faraday constant F, so ΔG° = −nFE° = −523 kJ." | yes |
| 7 | How Far It Goes (typed) | A larger E° means a larger K: log K = nE° ÷ 0.0592 at 25 °C. | Cell meter; plate with the relation. | 7 (several steps with one formula hint). | **S**, worked case in the briefing (zinc–copper: "n = 2, E° = 1.10 V", "2 × 1.10 ÷ 0.0592 = 37.2", "K is about 10³⁷"). Briefing: "A cell runs until it reaches equilibrium. The larger its E°, the further that equilibrium lies toward products." Prompt: "What is log K, to the nearest whole number, for zinc reacting with silver ions?" | yes |
| (cut) | Two Sealed Metals | | | Stage 2 again. | Archive under `archive/2026-11-11/brinewire/`. | yes |

#### `q5-load` (7 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Run Until It Stops (predict) | A guess. | Lead clip; cards. | None of weight. | Keep. | yes |
| 2 | The Cell Runs Down | A cell stops with both kinds of ion still present. | Each run: ions move between the two windows; the plot of voltage falls to zero. | 1 (two-part). | **S.** Prompt: "Which ions are still present when the cell's voltage reaches zero?" | yes |
| 3 | More Zinc Ions | More product ions lower the voltage. | Two kept lines: concentration and voltage. | 1. | **S.** Prompt: "What happens to the cell's voltage when the zinc ion concentration is raised from 0.010 M to 1.0 M?" | yes |
| 4 | The Balance Point | The cell reads zero when Q reaches K. | The counts under the two windows at 0 V (72 and 28); a plate with K = 2.5 for this reaction. | 3 (a typed quotient of two printed counts, rounded to one place). | **M** (typed entry replaced by three cards and a slot: "The reactant ions ran out", "The two kinds of ion became equal", "The ratio of ions, Q, reached K"; add K to a `plaque`). Briefing: "The ratio of product ions to reactant ions at any moment is the reaction quotient, Q." Prompt: "Why does the cell's voltage reach zero?" Reward: "72 ÷ 28 = 2.6, close to K = 2.5. A cell is at equilibrium, and reads 0 V, when Q reaches K." | yes |
| 5 | Two Copper Beakers | The same metal at two concentrations makes a cell: the dilute side is the anode. | Ammeter needle; concentrations under each beaker. | 1; "bar". | **S.** Prompt: "In a copper cell with a 1.0 M beaker and a 0.010 M beaker, which electrode do the electrons leave?" | yes |
| 6 | A Cell Nobody Wired (typed) | The Nernst equation gives the voltage at any concentrations. | Cell with printed concentrations; plate with E° and the equation. | 7 (no worked case; hint 3 is the method). | **S**, worked case in the briefing (stage 3's cell). Briefing: "The Nernst equation corrects E° for concentration: E = E° − (0.0592 ÷ n) × log Q." Worked lines: "Q = 0.010 ÷ 1.0 = 0.010, log Q = −2", "(0.0592 ÷ 2) × (−2) = −0.059", "E = 1.10 + 0.059 = 1.16 V". Prompt kept. | yes |
| 7 | Three Prepared Cells | More reactant ions than product ions puts the voltage above E°; the reverse, below. | Concentrations under each cell; "Run" reads each voltmeter. | 3 and 6 (hint 3: order by the reading); order ran highest first. | **S.** Prompt: "Which cell has the lowest voltage and which the highest?" (rail, lowest on the left). Hint 3: "Compare product ions with reactant ions in each cell before you run it." | yes |
| (cut) | Sealed Beakers | | | Stage 5 again; boss phase 4. | Archive. | yes |

#### `q6-electrolysis` (7 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Reversing the Cell | A supply with a larger voltage than the cell's drives it backwards. | Two dials (supply voltage, direction); the zinc strip gains or loses mass. | 1 ("Make zinc plate out"); 6 (hint 3: try all four settings). | **S.** Prompt: "What does a supply need to do to make zinc plate out of the solution?" Hint 3: "Compare the supply's voltage with the 1.10 V the cell gives by itself." Reward kept. | yes |
| 2 | Molten Salt | Reduction is at the cathode in every cell, galvanic or electrolytic. | Sodium forms at the electrode the electrons are sent into. | 6 (hint 3 the move). | **S.** Prompt: "At which electrode does sodium form in molten sodium chloride?" | yes |
| 3 | How Much Passed | Charge = current × time, and more charge plates more metal. | Each run: electrons arrive at the plate in the model and one silver atom forms for each; the plated mass is read. | Reward 39 words. | **S.** Briefing: "Electric charge is counted in coulombs. A current of one ampere carries one coulomb each second." Prompt: "Which run passed the least charge and which the most?" Reward: "30 C, 20 C and 50 C: charge in coulombs is amperes × seconds, and the silver plated grew in step with it." | yes |
| 4 | Plating Copper (typed) | Charge gives moles of electrons, which give moles and grams of metal. | Current and time dials with the plated mass read at their stops; the asked run is off the dials. | 7 (no worked case; hint 3 is the method). | **S**, worked case in the briefing. Worked lines (aluminium, Al³⁺ + 3 e⁻ → Al): "1.00 A × 965 s = 965 C", "965 ÷ 96,485 = 0.0100 mol e⁻", "÷ 3 = 0.00333 mol Al = 0.090 g". Prompt: "What mass of copper, in grams, is plated by 2.00 A running for 30.0 minutes?" Reward: "3600 C is 0.0373 mol of electrons; two for each copper atom gives 0.0187 mol, 1.19 g. This is Faraday's law." | yes |
| 5 | Cells Driving Cells (was 6) | Cells joined in a chain add their voltages; a reaction that runs by itself can drive one that does not. | Chain voltage; gas gathers only above 1.23 V. | 1. | **S.** Prompt: "How many zinc–copper cells does it take to split water?" | yes |
| 6 | Water and Brine (was 7) | What forms at each electrode depends on what is in the solution. | Four gas tubes with volumes; each gas's test. | 1 (two-part); "overpotential" unglossed. | **S.** Prompt: "Which gas does each tube collect?" Reward kept (names `overpotential` as required by `VOCABULARY`). | yes |
| 7 | The Sealed Plate (typed; was 8) | The law runs from mass back to current. | Plate on the balance; time shown; half-reaction on the plate. | 6 (hint 3 the steps). | **S.** Prompt: "What current, in amperes, plated the sealed plate in the time shown?" Hint 3: "Run stage 4's chain backwards, from grams to coulombs." | yes |
| (cut) | Plating Silver | | | Stage 4 with one electron for each atom. | Archive under `archive/2026-11-11/brinewire/q6-s5-silver.js`. | yes |

#### `boss-clamp` (5 phases)

| # | Phase | Re-tests | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- |
| 1 | The Dip Rack | `q2` stage 2. | "gives". | **S.** Prompt: "Which of iron, nickel, tin and silver loses electrons most readily and which least?" | yes |
| 2 | The Open Cell | `q3` stages 3 and 4. | 1. | **S.** Prompt: "Which strip is the anode of the magnesium and silver cell?" | yes |
| 3 | The Potential Board (typed) | `q4` stage 2. | Hint 3 the subtraction. | **S.** Prompt: "What is the voltage, in volts, of a cell made from iron and silver?" Hint 3: "Find how far apart the two readings are on one scale; one of them is below zero." | yes |
| 4 | The Zinc Beakers | `q5` stage 5. | 1; "bar". | **S.** Prompt: "Which electrode do the electrons leave in the zinc cell?" | yes |
| 5 | The Plating Run (typed) | `q6` stage 4. | Hint 3 the method. | **S.** Prompt: "What mass of zinc, in grams, is plated by 1.50 A running for 20.0 minutes?" Hint 3: "Connect the charge passed in that time to moles of electrons and the half-reaction line on the bench." | yes |

### Open for the builder

- `verify:story`: resolved — removing duplicate `oxidation`/`reduction` `VOCABULARY` entries from `q3-galvanic.js` and `q6-electrolysis.js` (and setting `BUILDS_ON` to `'unit10/q1-halves'`) fixed the baseline `unit10/q1-halves` story failure.
- `q5` stage 4: `K = 2.5` is shown on the `At equilibrium` plaque alongside the `load` fixture.
- `q4` stage 7 and `q5` stage 6: `log` primer exists in `src/learn/engine/primers.js` and is declared in `src/learn/glossary/brinewire.js` `NEEDS`.
- Mechanism views: `verify:table` and `verify:teaching` sealed-bench checks pass with `q5` stage 4 redesigned and the 3 cut stages removed.
- Bank `unit10.json` and `unit10/*.json`: updated `gives`/`takes`/`bar` wording to `loses`/`gains`/`electrode`.

### Structural changes

- Brinewire reduced from **53 stages to 50 stages** (6 benches + 1 boss):
  - Cut `q4-potential` stage 8 (`s8-sealed`, "Two Sealed Metals") → `archive/2026-11-11/brinewire/q4-s8-sealed.js`.
  - Cut `q5-load` stage 8 (`s8-sealed`, "Sealed Beakers") → `archive/2026-11-11/brinewire/q5-s8-sealed.js`.
  - Cut `q6-electrolysis` stage 5 (`s5-silver`, "Plating Silver") → `archive/2026-11-11/brinewire/q6-s5-silver.js`.
- Redesigned `q5-load` stage 4 (`s4-balance`, was `s4-ratio`): replaced typed quotient entry with three note cards (`out`, `equal`, `eq`) + `reason` slot + `At equilibrium` (`K = 2.5`) plaque, stacked below the `load` fixture.
- Reversed `q5-load` stage 7 (`s7-rank`) rail order from highest-first to lowest-first (`tb`, `ta`, `tc`).
- Added briefings to 14 stages, including `worked` lines on `q4-potential` stages 6–7, `q5-load` stage 6, and `q6-electrolysis` stage 4.
- Removed `(Beyond the Exam)` / `AP exam` wording from `q1-halves` stage 5 and `q3-galvanic` stage 7.
- Updated `tools/lib/brinewire-q1-checks.mjs`, `brinewire-q4-checks.mjs`, `brinewire-q5-checks.mjs`, `brinewire-q6-checks.mjs`, `brinewire-boss-checks.mjs`, `tools/verify-teaching.mjs`, and `src/learn/table/kits/cell-tour-demos.js` to match the new stage counts, indices, and wording.

### Chemistry corrections

- `q1-halves` stage 1 briefing: defined oxidation number via electrons lost/gained compared with the lone atom.
- `q1-halves` stage 6 reward: removed unshown `+7` oxidation number claim.
- `q1-halves` stage 8 hint 3 & reward: replaced `"different partners"` (false criterion for redox) with `"In these reactions, look for an atom that goes from a lone element to an ion, or back."` and clarified element pairings (`Zn and Cu in A; Mg and H in C`).
- `q4-potential` stage 7 & `q5-load` stage 6 worked cases: added reaction equation / cell concentrations (`Zn + Cu²⁺ → Zn²⁺ + Cu (n = 2 e⁻, E° = 1.10 V)` and `0.010 M Zn²⁺, 1.0 M Cu²⁺`) so `n` and `Q` are grounded.

### Still weak

- **`q2-activity` stage 5 (`Hydrogen in the List`):** Prompt and 6-slot rail ask where hydrogen belongs among five metals (`Mg, Zn, Fe, Cu, Ag`), though the table only has acid beakers (`Mg` and `Ag` were not in stage 2), so students can only determine which side of `H₂` each metal sits on (which is all `check()` grades). Fixing this requires a partial-order UI or adding metal-ion beakers.
- **`q4-potential` stage 6 (`The Energy Released`):** Briefing uses `coulomb` and `joule` before `coulomb` is glossed in `q6-electrolysis` stage 3, and the reward introduces `ΔG°` ("Free Energy from a Voltage") which is not explained in the stage briefing (required by `q4-potential.js` `VOCABULARY`).
- **`q4-potential` stage 7 (`How Far It Goes`):** Uses `equilibrium` and `K` without defining `K` in the stage briefing (though `K` was introduced earlier in Teeter / `unit08`).
- **`q6-electrolysis` stage 6 (`Water and Brine`):** `overpotential` is named in the reward without the bench demonstrating reaction rate or extra voltage.
- **`q3-galvanic` stage 7 (`Shorthand`), `q4-potential` stage 3 (`Which Cells Run`), `q5-load` stage 7 (`Three Prepared Cells`):** Can be solved mechanically (matching the plaque's left-to-right text in `q3:7`, or running all cells and reading outputs in `q4:3` and `q5:7`) without reasoning first.
- **Ranking prompts (`q2:2`, `q4:1`, `q5:7`, `q6:3`):** Prompts ask for the two extremes (`most`/`least`, `lowest`/`highest`) while the rail requires ordering all 3–4 items.
- **`boss-clamp` phase 2 (`The Open Cell`):** `check()` still says `needle` because `tools/lib/brinewire-boss-checks.mjs` asserts `/needle swung to the left and read 1\.44 A/`.

### For the owner to look at

- `q5-load` stage 4 (`s4-balance`): redesigned table with `loadFixture`, `At equilibrium` (`K = 2.5`) plaque, 3 `note` cards (`out`, `equal`, `eq`), and `Why it stopped` slot stacked below on `{ w: 176, h: 140 }` — verify visual spacing on screen.

### For close-out

- `src/learn/worlds/unit10-electrochemistry.js`: `q4-potential` `stageCount: 7` (was 8), `q5-load` `stageCount: 7` (was 8), `q6-electrolysis` `stageCount: 7` (was 8). World total: **50 stages** (was 53).
- `PRODUCT.md`: updated `facts` comment (`stages=595`, was `598`) and Learn track prose (`595 stages`) so `verify:docs` passes.
- `src/learn/table/kits/cell-tour-demos.js`: updated `pc_cellsupplypack` (`Q6, 4`) and `pc_cellsupplyplate` (`Q6, 6`) after cutting `q6` stage 5.
- `docs/teaching-pass/PROGRESS.md`: updated Brinewire status to `done`.
