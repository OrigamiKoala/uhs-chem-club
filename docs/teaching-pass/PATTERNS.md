# Teaching pass: redesign patterns

A short catalogue of ways to turn a stage that operates an instrument into a stage that teaches, each with a place in the code to copy from. Read it before planning a bench; name the pattern in the plan row's Change column.

Part A lists engine routes that already exist. Part B is filled by the exemplar sessions (Ember Reach, Lanternfall, Ligar): one entry per redesign they made that another world can copy. Keep every entry to the fault, the fix, and a pointer. Do not paste code here.

## A. Engine routes that exist today

| Route | What it does | Where |
| --- | --- | --- |
| Briefing | Two sentences shown before the stage. `briefing: { speaker, body }` on the stage object; the runner opens it on any stage that has one. Only boss phases use it today. | `src/learn/engine/stagerunner.js` (search `briefing`); example `src/learn/quests/unit04/boss-compressor.js` |
| Lead clip on a predict stage | A short clip of a neighbouring case, played before the student commits a prediction. | `leadFixture(...)` in `src/learn/quests/unit05/q7-gibbs.js`; clips in `src/learn/table/kits/heat-motion.js` (`lead`) and `matter-lead.js` |
| Tap a particle | A tap on a resting particle in the mechanism view sets a dial the stage already grades, so the check and the scripted solution do not change. | `kit.hotspots` in `src/learn/table/gestures.js`; used by the cell kit (`src/learn/table/kits/cell-*.js`) |
| Tap a place on the picture | The answer is a zone on the graph or vessel (above, on or below a line). Zones must use the painter's own scale. | `tapZones` in `src/learn/table/kits/pans-stress.js` and `heat.js` |
| Drag the apparatus | A piston, an atom pair or a ball on a line is dragged; `axis: 'x'` for along-the-bench, `invert` when down means more. | `tapDrag` in `src/learn/table/gestures.js`; `matter.js` (piston), `heat.js` |
| Drag the real object to the rail | Ranking moves the strips or samples themselves, not name cards standing for them. | Brinewire `q2-activity` (`src/learn/table/kits/cell-dip.js`) |
| Live mechanism view | A painter of state and `b.clock`; the kit's `live(state)` keeps the loop running; the 3D crowd is the same painter read through a recording context. | `src/learn/table/kits/heat-motion.js`, `matter-motion.js`, `pans-3d.js` (`dressRecorded`) |
| Miss replays the cause | `kit.onMiss` restarts the glides so the student sees again what their attempt did. | `src/learn/table/kits/matter.js`, `heat.js` |
| Glossary, banned words, recap | `TERMS` (term, gloss, first stage), `BANNED` (stand-in words), `NEEDS` (what a stage assumes, and the primer offered there). | `src/learn/glossary/ember.js`, `glossary/index.js`, `src/learn/engine/primers.js` |
| Briefing on any stage | `briefing: { speaker, body }` on an ordinary table stage is now the first Tour step of that stage (it was shown only on boss phases). Shown once per player; the Tour key shows it again. At most two sentences (`verify:learn`). | `stagerunner.js` (`setTourSteps` call), `table/tour.js` `tourSteps` |
| Worked case in a briefing | `briefing.worked: [lines]` prints the steps of one calculation under the briefing, on a neighbouring case. Works in every kit. | `tour.js` (`lines` on the intro step), `frame.js` `runTour`, `.lq-brief-worked` in `learn.css`; example `unit05/q2-calorimetry.js` stage 3 |
| Energy ladder on a stack | `stackFixture(..., { ladder: { lo, hi } })` draws one step per card, as tall as that card's ΔH as it stands, so routes are seen to end level and a flipped card is seen to climb. | `kits/heat.js` `stackFixture`, `heat-draw.js` `paintStack` |
| Worked problem | A guided calculation with the steps shown; lives in the bank and today opens after the bench. | `src/learn/bank/<unit>.json`, `src/ui/worked-problem.js`, `src/learn/worked.js` |
| Safe rename | Rewrites string literals only. Read the diff afterwards. | `tools/lib/rewrite-play-text.py` |

## B. Patterns from the exemplar worlds

Each exemplar session adds entries here in this form, as it finishes a bench:

```
### <fault type>: <short name>
- Before: <world> <quest> stage <n>, one line on what the student did and why it failed the standard.
- After: one line on what the student now does and sees.
- How: the route(s) from Part A, or the new helper, with file and function names.
- Use it when: the kind of stage in other worlds this fits.
- Cost: files touched; any check that had to change.
```

The fault types to cover, so that every kind of weak stage in the other seven worlds has an example:

1. The instrument prints the answer and the student ranks or sorts the readout.
2. The student sets a dial to a number the bench already shows.
3. A typed-number stage with a plate of figures and nothing the number describes.
4. A calculation used before it was taught (worked case placed before the first typed stage).
5. A card sort with no instrument.
6. The idea first appears in the reward card.
7. A predict stage with no model to predict from.
8. A convoluted answer form.
9. A boss phase that introduces a new idea or whose hints give the answer.
10. A world with no glossary: stand-in words replaced by real terms with glosses.

### 6. Idea first appears in the reward: definitions in a briefing, then apply them
- Before: Ember `q1-flow` stage 4. Sort four samples into "Heat leaves the chemicals" and "Heat enters the chemicals"; the reward then named exothermic, endothermic, system and surroundings.
- After: a two-sentence briefing defines the terms on the bench's own picture (the sample inside the dashed line, the bath outside it); the trays carry the real terms; the prompt asks which samples are which. The student has to turn a thermometer reading into a direction of heat flow and then into a term.
- How: `briefing` on the stage; tray labels; if a leak list (`tools/lib/<world>-learn-checks.mjs` `LEAKS`) bans the term in a refusal, lift that ban and say so.
- Use it when: a sort or a card choice whose categories are plain-word stand-ins for terms the reward later reveals.
- Cost: quest file, one line of the world's check.

### 2. Dial set to a number the bench shows: keep it only as the "see and compare" step, and print the cause
- Before: Ember `q2-calorimetry` stage 2. "Set the iron's heater so the iron rises as far as the water does"; the term arrived in the reward.
- After: briefing defines specific heat capacity; both cups print the heat and the rise; the prompt asks how much heat the iron needs. It is still a match of two readings, and is kept only because it is the no-arithmetic step before the first calculation.
- How: `cupFixture(..., { showHeat: true })`; briefing; prompt as a question.
- Use it when: a quantity must be met before it is calculated. Do not use it for more than one stage in a bench.
- Cost: quest file.

### 4. Calculation used before taught: worked case in the briefing, new case on the bench
- Before: Ember `q2-calorimetry` stage 3. "Type the heat the water bath absorbed"; a plate of symbols; the case was the previous stage's own number.
- After: the briefing states q = m × c × ΔT in words and shows one bath worked line by line; the bench holds a different bath; hint 3 points back to the worked case; a miss says how far the typed heat would have warmed this bath.
- How: `briefing.worked` (Part A). A check that the worked lines do not contain the bench's own numbers (`ember-learn-checks.mjs`, q2 stage 3).
- Use it when: the first stage of a bench that grades a calculated number.
- Cost: quest file; one check block.

### 3. Typed number with nothing it describes: let the student find where to read it
- Before: Ember `q2-calorimetry` stage 4. Ice dropped in a bath; type the heat the melting took (the bath's loss less the meltwater's warming).
- After: the student drags a burner along a heating curve of 10.0 g of ice. Temperature and heat added are printed; the trace stays flat while particles leave the lattice. The answer is the heat added where the last ice goes, for each gram. A miss says what state that much heat leaves the sample in.
- How: `curveFixture(..., { readout: 'both' })` in `kits/heat.js`; words by `paintCurveFace` in `heat-draw.js`; the burner's settings are chosen so one stands where the phase change ends (`MELT` in the quest file, checked in `ember-learn-checks.mjs`).
- Use it when: a quantity belongs to one stretch of a process the bench can play (a plateau, an equivalence point, a crossing).
- Cost: kit fixture option, a face painter, quest file, check.

### What is drawn is what is graded: a body in a bath
- Before: a hot block dropped in the cup went on printing its starting temperature.
- After: while it stands in the cup it reads what the bath settled at.
- How: `paintBlock` and `faceKey` in `heat-draw.js` read `props.trial`, which `settle` in `heat.js` already kept.
- Use it when: any piece keeps a starting reading on its face after the bench has changed it.
- Cost: two lines.

### 2. Dial copies a meter: observe one case, answer the reverse case
- Before: Ember `q4-bonds` stage 2. Pull the bond apart, then set a number dial to the 436 kJ/mol the meter already printed.
- After: the student pulls the bond apart and watches the energy go in; the question is what happens when the atoms bond again, answered on a dial of five options. The answer is nowhere on the bench.
- How: `selectorFixture(..., { list: true })` with a blank first option; the check refuses until the bond has been pulled apart. Change the stage's `LEAKS` entry to ban the new answer.
- Use it when: a stage asks the student to copy a reading. Find the neighbouring case (the reverse, double the amount, the other sign) and ask that.
- Cost: quest file, check file, one Tour demo pointer.

### 8. Convoluted answer form: let the construction be the answer
- Before: Ember `q5-hess` stages 3 and 4 and boss phase 3. Build the stack, then choose its ΔH from four numbers on a dial; the stack hid its own total.
- After: the stack prints its total and draws its ladder; a correct stack is the answer.
- How: `hideSum: false`, remove the `selectorFixture`, simplify the check to `stackRead(...).matches`.
- Use it when: a stage has "then set" or "then type" after a construction that already determines the number.
- Cost: quest file; remove the `picked(...)` lines from the world's check.

### 1. Instrument prints the answer: take the answer off the dial
- Before: Ember `q7-gibbs` stage 5 and boss phase 5. The temperature dial had a setting exactly at the answer, where the readout said zero.
- After: the dial straddles the answer; the plot shows which side each setting is on, and the value between them is worked out from the plate. A miss prints both parts and their difference at the typed temperature.
- How: choose the dial's list (`Ts`) without the answer; add a check that it stays out (`ember-learn-checks.mjs`).
- Use it when: a typed or set answer coincides with a detent, a label or a printed reading.
- Cost: one constant, one check line.

### 1. Labels that carry the ranking
- Before: Ember `q6-entropy` stage 4. Boxes labelled "Ice, −10 °C" to "Steam, 110 °C" were ordered by entropy, which is also the order of the printed numbers.
- After: labels are Ice, Cold water, Hot water, Steam; how fast the particles move is seen, not read.
- How: piece labels only.
- Use it when: a rank or sort whose pieces print a number that sorts the same way as the answer.
- Cost: none.

### 6 and 7. Idea in the reward of a typed stage: teach the equation, then let the student move one term
- Before: Ember `q7-gibbs` stage 2. Type the temperature (by interpolation) at which a salt starts to dissolve; the reward then introduced ΔG = ΔH − TΔS and "spontaneous".
- After: the briefing gives the equation and what negative means; a plate keeps it in view; the student drags the temperature and watches ΔH stay fixed while TΔS grows and ΔG changes sign; the graded act is placing the ball where the change happens.
- How: `briefing`; `plotFixture` with one setting at the crossing and its symbols shown; a `plaqueFixture` beside it; typed `entry` removed.
- Use it when: a formula with one variable the student can move.
- Cost: quest file, check block.

### 9. Boss phase that needs something no bench taught
- Before: Ember boss phase 4 needed a coefficient of 2 in an entropy sum; the only bench stage on the sum had all coefficients 1, so the boss's hint 3 taught it.
- After: the worked case in the briefing of the bench stage (`q6-entropy` stage 5) uses a reaction with coefficients.
- How: fix the bench, not the boss. Read each boss phase and name the bench stage that taught each thing it needs.
- Use it when: reviewing any boss.
- Cost: one briefing.

### 5. Card sort with no instrument
- Not solved in Ember Reach. `q6-entropy` stage 3 and `q7-gibbs` stage 3 remain sorts; the definitions moved into briefings and the trays took the real terms (pattern 6 above), and a miss that printed the answer's numbers was changed. A later exemplar should cover this type.

### 10. World with no glossary
- Not applicable to Ember Reach, which had one. What was done here: terms were moved in `glossary/ember.js` to the stage whose briefing now teaches them, and two terms that left the world were removed.

