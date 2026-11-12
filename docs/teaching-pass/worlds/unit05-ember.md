# Ember Reach (`unit05`): thermochemistry, entropy, free energy

Read with `docs/teaching-pass/BRIEF.md` and `PATTERNS.md`. The notes below were written on 2026-11-11 from the stage text and the earlier records, without playing the world. Treat every item as a lead to confirm against the source, and expect to find more.

- **Session:** Exemplar (Opus). First exemplar: it sets the patterns for calculation stages, briefings and worked cases that every other world copies. The owner plays it before any other session starts.
- **Earlier teaching pass:** 2026-11-06 (words, glossary, a moving model on every stage; record `docs/teaching-pass/Ember.md`, section "Open work")
- **Quests:** `src/learn/quests/unit05/`. Chart `src/learn/worlds/unit05-thermodynamics.js`. Bank `src/learn/bank/unit05.json`. Glossary `src/learn/glossary/ember.js`. Checks: `verify:ember`, `tools/verify-teaching-ember.mjs` with `tools/teaching-ratchet-ember.json`.
- **Kits:** `heat*.js` in `src/learn/table/kits/` (`heat-motion.js` holds the moving models and lead clips); `src/learn/engine/thermodata.js`, `heat-solids.js`, `heat-props.js`. `pans-3d.js` (`dressRecorded`) is shared with Teeter and Mirrowen.
- **Report on 2026-11-11** (`node tools/teaching-report.mjs unit05 --totals`): 47 stages in 8 modules | briefing 0 | typed 16 (no instrument 0) | cards only 3 | reward long 0 | operation prompt 21 | hint 3 move/arithmetic 3 | vague 6 | register 5 | motive 1

## What is known to be wrong

- **The model moves, the student still types.** 16 of 47 stages grade a typed number and 21 prompts open with an operation ("Type the temperature in kelvin at which..."). The 2026-11-06 pass says so itself: heat arithmetic, bond sums, Hess and free energy "still grade a typed number or an answer dial".
- **No stage has a briefing.** Every stage starts cold.
- **Ideas first appear in rewards.** `q7-gibbs` stage 2: Gibbs free energy, `ΔG = ΔH − TΔS` and "spontaneous" all first appear in the reward of a stage whose task was to type a temperature read from a plot. `q6-entropy` stage 2: "The measure of the number of microstates available to a system is its entropy".
- **Used before taught.** `q3-enthalpy` stage 7 ("Which Runs Out?") is limiting reactant, taught in Kettle; stage 8 ("The Way Back Over the Hill") is activation energy, from a unit not built. Both leave this world (owner decision).
- **Hint 1 is a tool list on every stage** ("Use the three cards and the slot"). Rung 1 should say where to look.
- **Register:** *yields*, *thermodynamic effects*, "based on whether endothermic dissolution can occur spontaneously" (a predict hint that also uses two terms not yet taught).
- **Errors:** "inspect the bond bond table", "Now Read the Bond table" (`q4` stage 4).

## Bench notes

- `q1-flow` (5): heat flows from hot to cold; temperature is particle motion. Closest to the standard; add briefings and fix hints.
- `q2-calorimetry` (8): q = mcΔT. Six typed stages. This bench sets the calculation pattern: the quantity seen and compared first (same heat into water and iron), one worked case placed before the first typed stage, then typed cases where the number describes something on the bench.
- `q3-enthalpy` (8): heat of reaction. Stages 7 and 8 go; five of the rest are typed. Cut to about six.
- `q4-bonds` (6): bond energies. The student already drags atoms apart; make the sum of broken and formed bonds something they build, not type.
- `q5-hess` (4): Hess's law. Two routes with one total should be seen on the energy diagram.
- `q6-entropy` (5): entropy as the number of arrangements. Stages 3 and 4 are card sorts. Gloss microstate at first use or use "arrangements".
- `q7-gibbs` (6): free energy. Teach `ΔG = ΔH − TΔS` before stage 2, in a briefing on the cold-pack case the predict stage just showed; let the student move the temperature and watch the two terms compete; then ask about a different case.
- `boss-crucible` (5): re-test; phases 1 and 5 are typed.

## Owner requests to check against the source

None specific. The general requests in `docs/feedback.md` (stop using confusing terminology; explain the instruments) apply.

## Traps

`VOCABULARY.introducedAt` gates Tour titles by stage (a Tour step that says "calorimeter" before the term is earned fails). Hand-placed layouts leave little free space: `verify:table` names the fixture that overlaps. The predict-stage check allows only a `lead` fixture.

## Record

Filled by the plan session (if any) and the pass session. Keep it current after every bench.

### Bench-level sequence

Written 2026-11-11 after reading the world as the student. 47 stages become 42. Every bench keeps its predict-then-test pair. Every stage that names a new term gets a briefing that teaches the term on a neighbouring case before the bench is touched.

| Bench | Idea | Structure | Terms it introduces (gloss in the briefing or prompt) |
| --- | --- | --- | --- |
| `q1-flow` 5 → 4 | Heat passes from hot to cold until the temperatures match; temperature is not the amount of energy; which way heat went is read from the surroundings. | Stage 5 (Unequal Blocks) cut: it needs specific heat capacity, which `q2` teaches, and its reward answered `q2`'s prediction. | temperature, heat, joule, thermal equilibrium, system, surroundings, exothermic, endothermic |
| `q2-calorimetry` 8 → 7 | The same heat warms different materials by different amounts (c); q = m × c × ΔT; a bath measures heat it cannot see; a phase change takes heat without a temperature change. | Order now: predict, compare, worked case then first typed, reaction in a bath (was 6), name a metal, melting on the heating curve (replaces Ice in the Bath, a two-step subtraction), ice to steam. Steam to Water cut (the same sum run backwards). | specific heat capacity, calorimeter, heat of fusion, heat of vaporization |
| `q3-enthalpy` 8 → 6 | ΔH is heat per mole of reaction; heat scales with moles; a ΔH belongs to its equation; per mole is not per gram. | Stages 7 (limiting reactant) and 8 (activation energy) cut by owner decision. Order: diagram, more powder, final temperature (same powder, was 6), per equation, predict fuel, ten grams. | mole (recap), enthalpy change ΔH |
| `q4-bonds` 6 → 6 | Breaking a bond takes energy in, forming gives the same out; ΔH ≈ energy of bonds broken − energy of bonds formed. | Stage 2 now asks about the reverse change (forming the bond) after the student has pulled the bond apart; the number dial that copied the meter is gone. | bond enthalpy |
| `q5-hess` 4 → 4 | The heat of a reaction is the same by any route; steps can be reversed and scaled; formation steps are one such route. | Stage 2 gains an energy ladder on each stack so the two routes are seen to end level. Stages 3 and 4 lose the second decision (the answer dial): the stack prints its own total. | Hess's law, enthalpy of formation |
| `q6-entropy` 5 → 5 | Spread-out arrangements outnumber crowded ones; entropy counts arrangements; gas ≫ liquid > solid, hotter > colder; ΔS from a table. | No stage moved. Entropy is named and glossed in a briefing before stage 3, not in the reward of stage 2. "Microstates" becomes "arrangements". | entropy S, kelvin (recap) |
| `q7-gibbs` 6 → 5 | Whether a change happens on its own is settled by heat (ΔH) and entropy (TΔS) together: ΔG = ΔH − TΔS. | Stage 2 is no longer typed: the student moves the temperature and places it where ΔG reaches zero, after a briefing that states the equation. Stage 6 (ΔG° from formation values) cut: a third products-minus-reactants sum with nothing on the bench. | spontaneous, free energy change ΔG |
| `boss-crucible` 5 → 5 | Re-test of q = mcΔT, bond sums, Hess, ΔS from a table, T = ΔH/ΔS. No new idea. | Phase 3 loses its answer dial as `q5` did. Hints rebuilt. | none |

### Plan rows

(One table per bench, in play order. Stage numbers are the new ones.)

#### `q1-flow` (4 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Where Two Blocks Meet | Touching things pass heat from hot to cold until they are at one temperature. | Joined blocks: packets cross from the hotter lattice to the colder, the hot atoms slow, the cold ones speed up, both thermometers glide to one reading. | 1 (prompt was "Join two blocks so that..."), 4 (heat and temperature used with no gloss), 6 (hint 1 a tool list, hint 3 gave "halfway"). | Reword. Briefing glosses heat and temperature and says what to watch. Prompt is a question. Hint 3 gives the reasoning (equal blocks: equal fall and rise). Miss names where the pair began and finished. | yes |
| 2 | Which Would Thaw It? (predict) | A guess: does the hotter thing always give more heat? | Lead clip of two equal blocks meeting. | 6 (hint 1 a tool list; hint 3 "Commit to the card"). | Reword hints: what the cards give, how this case differs from the clip, how to think about it. | yes |
| 3 | The Spark and the Tank | Temperature is not the amount of energy: a cool tankful has more heat to give than a white-hot speck. | Valve joined to the spark barely moves and the spark's two atoms slow at once; joined to the tank it climbs to 37 °C while packets keep crossing. | 1 (prompt "Warm the valve as far as you can"), 6 (hint 3 stated the answer). | Reword. Prompt asks which source warms it more. Miss says the spark cooled to the valve's reading almost at once. | yes |
| 4 | Warmers, Packs and Tablets | Which way the heat went is read from the water round the chemicals. | Each sample in the cup: packets leave it or enter it, the bath thermometer rises or falls, and each sample keeps the reading. | 4 and 2 (exothermic, endothermic, system, surroundings first appeared in the reward). | Briefing teaches the four terms; trays are now "Exothermic" and "Endothermic"; prompt asks which is which, so the student applies the definition to the thermometer. `LEAKS` for this stage no longer bans the two terms in a refusal (they are on the trays). | yes |
| (5) | Unequal Blocks | (cut) | | 7 (needs specific heat capacity, taught in `q2`); its reward answered `q2`'s prediction. | Cut. Archived in `archive/2026-11-11/ember/`. | yes |

#### `q2-calorimetry` (7 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Water or Iron? (predict) | A guess: does the same heat warm everything alike? | Lead clip: a heater feeding a bath, particles speeding up. | 6 (hints were a tool list and "Commit to the card"). | Reword hints. "Jacket water" and "iron pipe" become water and iron. | yes |
| 2 | Equal Rises | Different substances need different heat for the same rise: specific heat capacity. | Two cups, each printing HEAT and RISE; at the same heat the iron's particles race and it rises 46.6 °C against the water's 5.0 °C; the student turns the iron's heater down until the rises match. | 1 (prompt "Set the iron's heater so..."), 2 (c first defined in the reward), 4 (joule never glossed). | Briefing defines joule and c. Prompt asks how much heat the iron needs. Both cups now print the heat (`showHeat`). Still a dial turned until two readings match: kept as step one of the calculation pattern (the quantity seen and compared with no arithmetic). | yes |
| 3 | The Heat Equation (typed) | q = m × c × ΔT. | A 150 g bath that rose 8.0 °C; the number typed is the heat that bath took in; a miss says how far the typed heat would have warmed it. | 1 ("Type the heat..."), 7 (the first calculation, with no worked case), 6 (hint 3 was the arithmetic). The old case was stage 2's own 2,092 J. | Worked case in the briefing (new `briefing.worked`), on a different bath. New case on the bench. | yes |
| 4 | Catching a Reaction (typed) | A bath measures heat it cannot see: heat out of the reaction = heat into the water. | The mix dropped in the cup: packets leave it for the water, the bath rises 4.0 °C. | 1, 4 (calorimeter named only in the reward; "q_reaction = −q_bath" on the plate). Was stage 6, after the ice stage. | Moved to follow the heat equation. Briefing defines calorimeter. Plate says the relation in words. | yes |
| 5 | Naming a Metal | A measured c identifies a substance. | Hot fitting dropped in the bath: bath rises 2.0 °C, and the fitting standing in the bath now reads the bath's temperature (it used to go on printing 65.4 °C). | 6 (hint 3 was the two-step arithmetic), 7 (rearranging for c never shown). | Reword; `c = q ÷ (m × ΔT)` on the plate; block in a cup shows what it fell to (`paintBlock`). | yes |
| 6 | Heat With No Rise (typed, new) | Melting takes heat without a rise in temperature: heat of fusion. | Burner dragged along the heating curve: the temperature reads 0 °C and the trace is flat while particles leave the lattice one by one and HEAT ADDED climbs to 3,340 J; then the trace rises. | Replaces Ice in the Bath (idea only in the reward; answer a two-step subtraction). | New stage on the existing `curve` fixture with a new `readout`. Briefing states the idea; the student measures the value. | yes |
| 7 | Ice to Steam (typed) | A path through two phase changes is three heats added. | The same curve for 0 °C ice to 100 °C steam: flat, rise, long flat; particles go lattice, liquid, gas; temperature printed, heat not. | 1, 4 (heat of vaporization only in the reward), 6 (hint 1 "Use the plate of facts"). | Briefing defines heat of vaporization; plate uses the two terms; hints rebuilt. | yes |
| (8) | Steam to Water | (cut) | | A repeat of 7 run backwards. | Cut, archived. | yes |

#### `q3-enthalpy` (6 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Heat for Each Mole | ΔH is the heat for each mole that reacts, negative when heat is given out. | Powder in the cup: packets enter the bath, HEAT 8,000 J printed, 0.05 mol on the sample; the student builds the energy diagram with the products below the reactants. | 1 ("Set the diagram..."), 2 (ΔH and mole first in the reward), 6 (hint 3 the arithmetic). | Briefing glosses mole and ΔH. Prompt is the question. Dial renamed "ΔH". | yes |
| 2 | More Powder, More Heat (typed) | Heat grows in step with the moles. | Moles dial at 0.05, 0.1, 0.2 mol with the heat printed; the asked 0.30 mol is past the dial. | 1. | Reword only. | yes |
| 3 | Predicting a Temperature (typed, was 6) | Heat from moles becomes a rise in a bath. | Same powder, 400 g bath, rise read at two settings; asked case past the dial. | 1. | Moved next to the other powder stages; reworded. | yes |
| 4 | ΔH and Its Equation (typed, was 5) | A ΔH is for the moles in its equation as written. | Plate with the equation and the mass of a mole; the reaction as atoms. Nothing responds to the answer. | 1, 6. | Briefing; miss now says what mass of hydrogen the typed heat stands for. | yes (weak, see Still weak) |
| 5 | Which Fuel? (predict, was 3) | A guess: most heat for a mole, or for a gram? | Cards with both figures; lead clip of a fuel burning. | 6. | Reword. | yes |
| 6 | Ten Grams Each (was 4) | Heat for a gram depends on how many moles a gram is. | Each ten-gram sample now prints its moles; each keeps the bath reading it gave. | 3 (the order is read off the kept readings). | Samples print moles; hints point to moles × heat for a mole. Still a ranking of readouts. | yes (weak) |
| (7, 8) | Which Runs Out?, The Way Back Over the Hill | (cut) | | Owner decision. | Archived. | yes |

#### `q4-bonds` (6 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Pulling Atoms Apart (predict) | A guess: does breaking a bond take energy or give it? | Lead clip of a bonded pair. | 6. | Hints rebuilt. | yes |
| 2 | Apart and Back Together | Forming a bond gives out exactly what breaking it took in. | The student drags the atoms apart: the bond thins, the dot climbs the energy curve, the meter reads ENERGY IN up to 436 kJ/mol. The answer (what forming does) is not printed anywhere. | 2 and 6 (two decisions; the dial copied the meter; the idea was in the reward). | Redesign: observed case, then a question about the reverse case on an answer dial with five options. Briefing glosses bond enthalpy. `LEAKS` for the stage now bans "gives out / same / backwards" in a refusal, not 436. | yes |
| 3 | Burning Methane, Bond by Bond | A reaction breaks the bonds of what is used up and forms the bonds of what is made. | The student sorts four bond cards into Broken and Formed and sets how many of each; the bond table totals each side as they go. | 1 (two-part instruction), 6 (hint 1 a tool list). | Briefing; reworded. | yes |
| 4 | Air Joins Up (predict) | A guess on a new reaction. | Lead clip of N₂ and O₂. | 6; "bond bond table". | Reworded. | yes |
| 5 | The Bond Table for Air | If breaking takes in more than forming gives out, the difference comes from the surroundings. | The two totals (1,443 kJ in, 1,262 kJ out) are now printed; the student decides what that does to the bath. | 1 ("Read the bond table and lay the card"); the totals were hidden, so the stage was mental addition of five numbers. | Totals shown; prompt asks whether the bath warms or cools. | yes |
| 6 | Estimating a ΔH | ΔH ≈ broken − formed, as a number with a sign. | Student sorts three bond cards; totals appear; the net is not printed. | 1; "bond bond card"; hint 3 the arithmetic. | Briefing states the relation and its limit; reworded. | yes |

#### `q5-hess` (4 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | One Step or Two? (predict) | A guess: does the route change the heat? | Lead clip of C + O₂. | 6; "reaction pathway". | Hints rebuilt. | yes |
| 2 | Two Routes, One Total | The heat of a reaction is the same by any route. | Each stack now draws an energy ladder: Route A drops once, Route B drops twice, and both end at the same level beside the same printed ΔH. | 1 ("Build ... on both stacks"); hint 3 stated the law in textbook words. | Energy ladder (`stackFixture` `ladder`); briefing explains cards, cancelling and the ladder; prompt is the question. | yes |
| 3 | Building Methane | A step can be reversed (sign changes) and doubled. | Flipping a card changes its printed ΔH and turns its ladder step from a drop to a climb; the stack prints what it adds up to and its ΔH. | 5 (two decisions: build, then pick the number on a dial). | Answer dial removed; the stack prints its own total; briefing teaches reverse and double. | yes |
| 4 | Down to the Elements and Back | Formation steps are one route that always works. | Same stack with three formation cards. | 5 (two decisions); reward introduced the definition. | Answer dial removed; briefing defines enthalpy of formation. | yes |

#### `q6-entropy` (5 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Where Will They Stand? (predict) | A guess: where do free particles end up? | Lead clip of four particles behind a wall. | 4 ("distribute randomly"), 6. | Reworded; cards say "All in the left half". | yes |
| 2 | Shake and Count | Spread-out results turn up most because more arrangements give them. | Each shake flies the four beads to new cells; the bars grow. | 1 (two-step prompt), 4 (microstates, configurations), 2 (entropy defined in the reward). The answer could be laid with no shake. | Briefing explains the box and bars; ten shakes are needed before an answer counts; entropy is no longer named here. | yes |
| 3 | More Ways or Fewer? | Entropy counts arrangements; gas ≫ liquid > solid. | Four cards, each drawing its particles before and after (moving). | 2 and 4 (entropy and ΔS met only in rewards); the miss printed the table values, which gave the answer. | Briefing defines entropy and ΔS; trays are "Entropy rises / falls"; miss no longer prints the values. Still a card sort. | yes |
| 4 | Volume and Motion | Warmer also means higher entropy. | Four boxes of twelve particles each, packed and moving as their phase and temperature say. | 3 (the labels printed the temperatures, so ordering by the number worked); "microstates". | Labels are now Ice, Cold water, Hot water, Steam. | yes |
| 5 | Entropy From a Table | ΔS = entropy of what is made − entropy of what is used up. | Plate of three entropies; the reaction as atoms. Nothing responds to the answer. | 7 (first calculation of its kind, cold; kelvin unglossed), 6 (hint 3 the arithmetic). | Worked case in the briefing (ammonia, with coefficients, which the boss needs); kelvin glossed on the plate. | yes (weak) |

#### `q7-gibbs` (5 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | A Pack That Chills (predict) | A guess: can a change that takes heat in happen by itself? | Lead clip of a crystal in water. | 4 and 7 (hint used "endothermic dissolution ... spontaneously"). | Reworded. | yes |
| 2 | Heat Against Entropy | ΔG = ΔH − TΔS; the change is spontaneous when ΔG is negative. | The student drags the ball along the line: ΔH stays at +25.7 kJ, TΔS grows with temperature, ΔG is their difference and the ball changes colour as it crosses zero. A plate keeps the equation and kelvin in view. | 2 (ΔG, the equation and "spontaneous" first appeared in the reward of a stage that typed an interpolated number). | Briefing teaches the equation; typed entry removed; one dial setting stands at 238 K and the student places the ball there; plate added; plot prints ΔH, TΔS and ΔG, not HEAT, SPREAD and NET. | yes |
| 3 | The Four Cases | The signs of ΔH and ΔS decide whether temperature matters. | Four cards, each with its own ΔG line and shaded strip. | 4 ("thermodynamic effects", "crowds"), 1. | Reworded; cards say "Heat out, entropy up" and so on. Still a card sort. | yes |
| 4 | Free Energy at 298 K (typed) | ΔG as a number; the two parts must share a unit. | Plate and the reaction as atoms. | 7 (first ΔG calculation, cold), 6. | Worked case in the briefing on a different change. | yes (weak) |
| 5 | Where Ice Starts to Melt (typed) | ΔG = 0 gives T = ΔH/ΔS. | Plot whose dial straddles the melting point but has no setting on it; plate. | 3 (the dial had a setting at 273 K that read zero). | 273 K removed from the dial; the student brackets the answer on the plot and works it out. | yes |
| (6) | Free Energy From Formation | (cut) | | A third products-minus-reactants sum; plate and type. | Archived. | yes |

#### `boss-crucible` (5 phases)

| # | Phase | Re-tests | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- |
| 1 | The Jacket (typed) | q = m × c × ΔT, in kJ. | 1, 6 (hint 3 the arithmetic; "weight"). | Reworded. | yes |
| 2 | The Coil | ΔH ≈ broken − formed. | 1, 6. | Reworded. | yes |
| 3 | The Slag | Hess's law with a reversed step. | 5 (stack, then a number dial); "yields". | Answer dial removed; ladder added. | yes |
| 4 | The Vent | ΔS from a table, with coefficients. | 6 (hint 3 the move). Coefficients were first needed here; `q6` stage 5's worked case now shows them. | Reworded. | yes |
| 5 | The Seal (typed) | T = ΔH/ΔS. | 3 (the dial had a setting at 1,100 K); the plot hid ΔH and TΔS. | 1,100 K removed from the dial; plot prints the two parts. | yes |

### Structural changes

- 47 stages become 42: `q1-flow` 5 → 4, `q2-calorimetry` 8 → 7, `q3-enthalpy` 8 → 6, `q7-gibbs` 6 → 5. Cut stages and reasons: `archive/2026-11-11/ember/README.md`.
- `q2-calorimetry`: Catching a Reaction moved from 6 to 4; Ice in the Bath replaced by Heat With No Rise (stage 6, new id `s6-melt`).
- `q3-enthalpy`: order is now diagram, more powder, final temperature, per equation, predict fuel, ten grams.
- Second decisions removed: `q4` stage 2 (number dial), `q5` stages 3 and 4 and boss phase 3 (answer dial after the stack).
- 20 stages now carry a briefing (0 before); three of them carry a worked case (`q2` stage 3, `q6` stage 5, `q7` stage 4).
- Typed stages 16 → 11.

### Chemistry corrections

- `q1`: "the tank ... delivering far more heat" and "Temperature measures ... not total heat" treated heat as something a body holds. Now energy is what a body has and heat is what passes.
- `q2` stage 5: a block standing in the bath printed its starting temperature; it now reads the bath's.
- `q4` stage 6: "It is an estimate because bond enthalpies are averages" is not true of H–H, Cl–Cl and H–Cl. The briefing now says "for most bonds".
- `q6` stage 4 reward: "thermal energy can be distributed across more accessible energy levels" replaced by a plain statement; no claim changed.
- `q7`: the plot labelled TΔS as "SPREAD" and ΔG as "NET"; it now prints the symbols, which the briefing defines.
- `q3` stage 6 reward: "Fuel energy density depends on mass rather than moles" was not a meaningful statement; replaced.

### Still weak

1. `q7-gibbs` stage 4 and `q6-entropy` stage 5: a plate and a number, with a worked case before them but nothing on the bench that the number changes. A bench that showed the two parts of ΔG as bars the student fills would fix `q7` stage 4; not built.
2. `q3-enthalpy` stage 4: the same (plate, typed number). The miss ties the number to a mass of hydrogen; nothing else does. It also needs grams to moles, offered only as a primer.
3. `q7-gibbs` stages 2 and 5 and boss phase 5 are the same act three times (find where ΔG is zero). Stage 2 can be passed by dragging until the readout reads 0.0.
4. `q3-enthalpy` stage 6: the order can be read from the bath readings the samples keep.
5. `q2-calorimetry` stage 2: a dial turned until two rises match (kept as the no-arithmetic step). Stage 4 is stage 3 with a new meaning and new numbers.
6. `q6-entropy` stages 3 and 4 and `q7-gibbs` stage 3 are card sorts; the cards carry moving particles or a line, but nothing responds to the student.
7. `q4-bonds` stage 5: with the totals printed, the stage is a comparison of two numbers plus one inference.
8. `q2-calorimetry` stage 5: hints 2 and 3 together lay out the route. Rearranging for c is given on the plate, not taught.
9. `q5-hess` stage 3 asks for a flip and a doubling at once; no easier stage with only a flip comes first.
10. `q1-flow` stage 3: joining both sources shows the answer (it is the test of the prediction).
11. Rewards of predict stages are a line about what comes next.
12. "Product" and "reactant" are avoided in most play text but are not glossed; `(s)`, `(g)`, `=` and `≡` are not glossed in this world.
13. The field manual entries for Ember Reach (`src/ui/field-manual.js`) keep their textbook wording; only their stage numbers were corrected.

### For the owner to look at

Nobody has seen these on a screen.

- Any stage with a briefing: it opens as the first Tour card. `q2` stage 3, `q6` stage 5 and `q7` stage 4 show a worked case under it; check the lines fit the card on a phone.
- `q2-calorimetry` stage 6 (new table): a wide heating curve with the temperature and HEAT ADDED printed under it.
- `q2-calorimetry` stage 7: the curve is taller and prints the temperature; the axis captions "°C" and "HEAT ADDED →" are new on every curve.
- `q2-calorimetry` stage 5: the fitting in the cup should read about 22 °C.
- `q3-enthalpy` stage 6: each sample prints "10 g = n mol"; check it fits the face.
- `q4-bonds` stage 2: the answer dial lists five options beside the bond.
- `q5-hess` stages 2 to 4 and boss phase 3: the energy ladder down the right edge of each stack; the printed reactions have 14 units less width and may be squeezed.
- `q7-gibbs` stage 2: the new plate to the right of the plot.

### For close-out

- Counts: Ember Reach is 42 stages (was 47); the track is 605 (was 610). `PRODUCT.md` facts line and sentence were changed to 605 because `verify:docs` compares them. Other shared docs still say 47 and 610.
- Shared code changed: `engine/stagerunner.js` (a briefing on any table stage is the first Tour step), `table/tour.js` (`worked` lines on the intro step), `engine/frame.js` (`runTour` prints them), `styles/learn.css` (`.lq-brief-worked`). No other world had a briefing on an ordinary stage, so no other world changes.
- Heat kit: `curveFixture` `readout`, `paintCurveFace`, `curveShown`, `curveFoot`; `stackFixture` `ladder`; a block in a cup reads the bath's temperature; lattice title is "Particles in the blocks". The `levels` option of `shelvesFixture` (reaction-progress hill) is now unused.
- Checks changed: `tools/lib/ember-learn-checks.mjs` (stage counts; `LEAKS` renumbered; `q1` stage 4 may name its trays; `q4` stage 2 bans the new answer, not 436; new blocks for `q2` stages 3 and 6, `q5` and `q7` stage 2; boss phase 5 and `q7` stage 5 must not have the answer on the dial). No XP, leak, overlap, geometry or phone-size check was weakened.
- Glossary: limiting reactant and activation energy removed; joule and specific heat capacity first at `q2` stage 2; entropy at `q6` stage 3; spontaneous at `q7` stage 2.
- Bank: `q1-flow` and `q2-calorimetry` practice problems used ΔH before `q3`; rewritten. End problems that named activation energy or microstates reworded.
- Doctrine: `CLAUDE.md` says "Briefings are ≤2 sentences"; it should add that an ordinary stage may carry one, with optional worked lines. Engine lesson: `VOCABULARY.introducedAt` requires the term in that stage's reward card (title or body), so a term taught in a briefing must still be said in the reward.
- `verify:story` fails on `unit10/q1-halves` (baseline) and on `unit02/q10-wavefunctions has no story animation`, which the baseline table does not list. Neither is Ember Reach.
