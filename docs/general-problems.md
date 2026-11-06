# General teaching problems in the Learn worlds

Written 2026-11-06 from a read of the quest sources (`src/learn/quests/unit01`–`unit10`), the kits (`src/learn/table/kits/`), the vocabulary gate in `tools/verify-learn.mjs`, `CLAUDE.md`, `PRODUCT.md` and the owner's feedback files (`docs/feedback.md`, `docs/feedback-11-01.md`). Nothing was played in a browser. Counts below come from `grep` over the source, so treat them as orders of magnitude; the fixing agent re-measures them for its own world.

The fix for a whole world is in [`docs/fix-world-teaching-prompt.md`](fix-world-teaching-prompt.md).

## Summary

| # | Problem | Where it comes from |
|---|---|---|
| 1 | Real terms are withheld and replaced by vague words | The "plain labels until the word is earned" rule, enforced by `WITHHELD_VOCAB` |
| 2 | Apparatus and quantities have metaphor names | Fiction-first naming of pieces and tools |
| 3 | The same thing has several names | No glossary; each stage written separately |
| 4 | Prior knowledge is assumed, especially maths and other worlds | `BUILDS_ON` is a comment; every world is open from the start |
| 5 | The bench is a plate of cards, dials and numbers, not a moving model | Most kits draw state, not motion |
| 6 | Concepts arrive in a paragraph after the fact | Reward cards carry the teaching |
| 7 | The student reads numbers instead of watching the mechanism | Dial-and-read stages |
| 8 | Predictions come before the student has any model | Predict stages ask for a guess among four sentences |
| 9 | Hints, misses and tours do not teach | Hints describe a method; misses state a mismatch |
| 10 | Stage order and level are uneven | Content beyond the exam, ideas before their prerequisites, jumps in difficulty |
| 11 | Reading load is high | Dense prompts, long reward cards, story lines on top |
| 12 | The checks reward the wrong things | `verify:*` forbids words but does not require explanation or motion |

---

## 1. Real terms are withheld and replaced by vague words

**What it looks like.** The doctrine says "plain labels until the word is earned, then the real term". In practice the plain label is often not plainer, only vaguer, and the student has to decode it.

- **Bellows `q1-knocks`** withholds `pressure`, `kPa`, `Boyle's law`, `kinetic energy` until stage 2, 3 or 6 (`WITHHELD_VOCAB`, `tools/verify-learn.mjs`). Stage 1 asks which of three "gauges" reads highest and never says what a gauge reads. Stage 2's own hint says "see which of them ever differ". The stage-2 reward finally says "That push is pressure". Hints and rewards across the world say "the gas pushes", "the knocks on its walls", "how hard the gas pushes", "the squeeze", "nitrogen's own push". A student meets *push*, *knock*, *squeeze* and *gauge reading* for a single quantity.
- **"Room" for volume.** Bellows quest sources use "room" about 95 times and "volume" about 56 (this includes code comments). Prompts say "the room that gives six times the gauge", "equal numbers of particles fill equal rooms". A middle schooler will not know "room" means volume until a card says so, and many will not know it afterwards because the card is a paragraph.
- **Tallow `q1-grain`** is the first screen of the whole course. Its stage 1 asks "At what lowest power do separate particles show in Sample A?" The word *atom* is gated until its reward card (`unit01/q1-grain` withholds atoms, elements, molecules, compounds, mixtures). The student is asked to look at "particles" without being told what kind of thing they are looking at.
- **Tallow `q2-core`** withholds `nucleus`, `protons`, `neutrons`, `electrons`, `shells`, `valence`, `ions`. The stage that builds an atom out of those pieces has to avoid their names in its own prompt.
- The same gate exists for most quests: `unit02/q3-lines` (energy levels, ground state), `unit03/q4-dots` (lone pairs, octets), `unit09`, and so on.
- The gate is only a words list, so authors reach for a synonym whenever the word is blocked. The result is the circumlocution the owner sees: *push* instead of *pressure*, *room* instead of *volume*, *gauge* instead of *pressure gauge*, *rig* instead of *apparatus*.

**Why it matters.** The student is not protected from the term; they are only made to translate. When the real word finally arrives, they have to attach it to a word they learned two stages earlier. This is exactly the "code word" problem the doctrine bans in other places.

**What is right.** Use the real term on first contact, with a gloss in the same breath: "Pressure (how hard the gas pushes on the walls)". Afterwards use only the real term. The things that must stay hidden are *answers* (which wall reads highest, which sample is the element), not the *names of the quantities being measured*.

## 2. Apparatus and quantities have metaphor names

The kits name pieces by what they look like on the table, not by what they are in chemistry or in a real lab. Rough counts of these words in the quest sources: `tray` (~1000, many are code identifiers), `pan` (~380), `pot` (~300), `rig` (~240), `jar` (~190), `chip`/`chips` (~160), `holder` (~95), `tile`/`tiles` (~110), `token(s)` (~70), `well` (~55), `slate` (~45), `crate` (~30), `drum` (~20).

Examples a student meets in play:

- Teeter's reaction vessel is a **pan**. Kettle's is a **pot**. Verdigris has a **rig** (ratio of ion concentrations), a **pour window**, **chips** and **tiles**. Bellows' cylinders are **holders** ("Holder 13").
- Tallow sorts into **trays**, uses a **cutter**, a **shaker**, a **needle**. The owner has already said (feedback.md, 11-01) that even "Cutter" was not self-evident, and that "Tip Sample", "Read element" and "reader" needed to be renamed.
- **Crates** hold compounds in Kettle; stages say "the unmarked crate". **Drums** hold samples in Tallow's mole bench.

A name from the lab (flask, beaker, cylinder, piston, burette, thermometer, balance, test tube) teaches something transferable. A name from the fiction (pan, pot, crate, drum, rig, slate) does not.

**What is right.** Name every instrument as the real instrument or as a plain description of its job ("pressure gauge", "gas cylinder with piston", "reaction vessel"). Keep fiction for boss names, the saga and the Case File, not for objects the student has to operate or reason about.

## 3. The same thing has several names

Inside one world a quantity can appear under three or four labels:

- Pressure: *gauge*, *gauge reading*, *knocks*, *push*, *pressure*.
- Volume: *room*, *the piston's setting*, *size*, *volume*.
- A measuring device: *reader*, *scale*, *meter*, *gauge*, *probe*, *dial*.
- A sample: *sample A*, *specimen*, *grain*, *pile*, *speck*.

A student who is learning a new field is also learning which of these are the same thing. Pick one word per concept per world, put it in a short glossary the player can open from any bench, and use it everywhere.

## 4. Prior knowledge is assumed, especially maths and other worlds

### 4a. Maths that is never taught

- **Logarithms.** Verdigris `q2-scale` stage 2 asks "Find the pH of the 3.2 × 10⁻⁴ M hydrochloric acid, to two decimal places" and hides the meter on that flask (`meter: false`). The only statement that pH is "minus the log of the H₃O⁺ concentration" is one sentence inside the stage 1 reward card. A student who has not met logs cannot do the stage; one who has can do it without the bench.
- **Natural log.** Teeter `q8-free` hands over `ΔG° = −RT ln K` on a plate.
- **Scientific notation, powers of ten, significant figures, unit conversion** (`mmHg` → `atm`, `kPa`, `L`, `mol/L`, `J/(mol·K)`), **ratios and proportional reasoning**, **slopes of a fitted line** (Bellows `q1-knocks` stage 8: "enter that slope value").
- **Calculators.** Typed-answer stages expect a two-decimal answer from a multi-step calculation, with no calculator on the bench and no step-by-step support.

### 4b. Chemistry from other worlds

`BUILDS_ON` in each quest is only a list in the file (for example Bellows `q1` says `['unit01/q6-weigh']`). `PRODUCT.md` says "Every built world is open from the start". Nothing checks that the student ever played Tallow before opening Verdigris. The quests use moles, molar mass, ions, valence, electronegativity, equilibrium, Kelvin and so on as if they were known.

### 4c. Things first-time students would not know

- What *a gauge*, *a meter*, *a burette* or *an ammeter* is and how to read it.
- What a formula, subscript, charge or state symbol means (`H₃O⁺`, `Cu²⁺`, `(aq)`).
- What a tenfold dilution is, what *mmHg* is, what *STP* is.
- That a term like *hydronium*, *Brønsted–Lowry acid*, *amphoteric* is a name for something they just watched, and not a new thing to learn.

### 4d. Level

Verdigris `q1-handover` opens with Brønsted–Lowry acids, hydronium and conjugate pairs in its first stages, and stage 7 is Lewis acids, which the stage header itself calls "beyond the exam". Ligar `q9-orbitals` was already flagged as beyond AP. The audience is 12 to 17; the course is aimed at AP-level content, but the entry point to each world is not stepped.

## 5. The bench is a plate of cards, dials and numbers, not a moving model

The owner's request: "This game should be filled with animations, but there are almost none on the benches."

**What the repo shows.**

- About 495 stage prompts. Roughly: 100 sort, order, pair or match cards; 85 type a number or find a value; 60 pick one of several statements; 75 build, set, run or turn a dial. Most of the last group still end in "read the number off the dial".
- The kit families by time-based code (searching for animation or time functions in `src/learn/table/kits/` and the matching `src/learn/engine/*-props.js`): the gas kit (live particles), parts of the pans, matter, cloud and cell kits, and the atom and orbital viewers. The **heat, ph, pot, cuvette, domain, mass, cards, atoms, bonds and heap** kits show state changes, not motion: a thermometer column moves, a cell turns another colour, a card appears. The 3D props mostly follow the table's state (`dress.userData.update(fixture, state)`) rather than run in time.
- About 62 reward models (`reward.model`) over about 610 stages: roughly one in ten stages ends on a 3D model, and those are shown only after the stage is solved.
- The one place animation is plentiful is the quest-ending story scene (75 of them). It plays after the lesson, when the student has already done the stages with static pictures.
- `CLAUDE.md` says "Flat things are drawn flat; spatial things are 3D objects" and "Non-explanatory 3D animations that merely spin an idle molecule are removed". Both are right, but together they have been read as "keep it still". The doctrine says what to *remove*; it never says what must *move*.

**What is missing.** For every idea there is an event at the particle level, and the student should see it as it happens while they change a control:

- Temperature up → particles move faster; pressure gauge rises because of more wall collisions.
- Piston down → the same number of particles in less volume → collisions per wall increase.
- Dissolving → ions leave a lattice, surrounded by water.
- Acid in water → a hydrogen jumps from HCl to H₂O.
- Equilibrium → forward and reverse events continue after the graph goes flat.
- Reaction → bonds break and form; atoms rearrange; the count of each atom is unchanged.
- Titration → the indicator changes colour as OH⁻ is added; pH curve is drawn as the drop falls.
- Galvanic cell → electrons travel through the wire; ions travel through the salt bridge; the electrode loses mass or gains it.

Today these are mostly described in a reward card or shown in the story scene at the end of the quest.

**What is right.** Each instrument ships with a live **mechanism view** (3D when spatial, 2D canvas when flat) that runs in time and reacts to the controls. The student should see the cause of the number before they read the number. Static plates are for reading sources (tables, printed facts) and for placing answers (cards in slots), not for the experiment.

## 6. Concepts arrive in a paragraph after the fact

The doctrine says every stage owes a reward card of 1–3 sentences. In practice the cards are the only place the concept is stated, and they are often dense:

- Bellows `q1` stage 3: "Squeezing a gas into less room makes the same particles knock more often, and the gauge rises as the room falls: 24 L and 104 give about 2500, and so do 4 L and 623. At one temperature, pressure times volume is constant (Boyle's law)." That is a mechanism, two worked data points, a relation and a name in one paragraph, and it contains the withheld-then-revealed word *pressure* in a sentence about "room" and "knocks".
- Bellows `q2` reward: "P₁V₁ ÷ T₁ = P₂V₂ ÷ T₂ with T in kelvin. Here the squeeze triples the gauge and heating from 300 K to 600 K doubles it: 100 × 3 × 2 = 600 kPa."
- Verdigris `q1` stage 1 reward introduces *Brønsted–Lowry acid* and *hydronium* in a single card.

Reading time and vocabulary load make these cards the weakest part of the loop: the only place the lesson is told is the place the student is most tempted to click through.

**What is right.** Name the idea *before or while* it is seen, show it moving, then let the card state the one new fact in one or two short sentences with the real term.

## 7. The student reads numbers instead of watching the mechanism

Many stages are "turn the dial, read the meter, compare". The designer wants this to avoid giving the answer away, but the student gets only the *what*, never the *why*:

- Bellows stage 3: turn the piston dial, watch a needle, find the volume that gives six times the pressure. A particle view exists as a knock counter, not as particles bouncing.
- Verdigris `q2`: read pH off a meter on three flasks, compare. No picture of ions at all on the flask (the particle window appears in `q3`).
- Many typed-number stages end with "type a figure" and a reward that shows the arithmetic. The student calculates; the bench does not help them see the quantity.

## 8. Predictions come before the student has any model

The "predict first" rule is good, but the predict stage often asks for a guess about a thing the student cannot picture yet.

- Bellows `q1` stage 1: four sentences about three gauges ("The roof gauge reads most", ..., "All three read the same"). A student who does not know what a pressure gauge is, or that a gas consists of particles, has nothing to base the guess on, and the stage tests the incorrect "gas weighs down" model that the bench is built to contradict. It is a good misconception test for a student who has the vocabulary; it is a coin flip for one who does not.
- Verdigris `q1` stage 2 offers sentences such as "Break apart and release OH⁻" and "Take a hydrogen from water, leaving OH⁻" to a student who has just met the idea of a proton hand-over in a single stage.

**What is right.** Before a prediction, show the quantity in a small moving demonstration (a 10-second lead-in, no controls) so the student can form a picture. The sentences must be in the real terms.

## 9. Hints, misses and the tour do not teach

- Hint rung 1 names a control ("Turn the Piston dial and watch the gauge"), rung 2 says what to compare, rung 3 describes the method. These are good for navigation and poor for conceptual rescue. A student who does not know what the gauge is has nothing in the three rungs to tell them.
- Hints and misses use the same euphemisms as prompts ("the knocks", "nitrogen's own push", "the gas pushes less hard than that"). A student stuck on a term gets a hint in another unexplained term.
- A miss message says what the bench showed ("The meter went from 1.00 to 2.00, not from 1.00 to 11.00"). It states the mismatch; it does not show *why*. No miss replays the mechanism.
- The Tour explains each tool in three beats but is still text. It does not show the tool being used. The owner has repeatedly reported (feedback.md, 11-01) that tools are not self-evident: "Cutter", "needle", "shaker", "detector", "what is all solid vs hard crust vs tiny lump".

## 10. Stage order and level are uneven

- **Concepts used before they are taught.** Ligar's `q1-joins` stage 3 sorts by charge on the atom faces; electronegativity (the reason) is taught in `q7`. (Both from `docs/ligar-teaching-pass-prompt.md`.)
- **Sorting to a taxonomy.** Ligar `q2-lattice` stages 2–3 ask for lists (conducts cold / only molten / never; rank by melting point) with no step that asks *why*.
- **Overloaded stages.** Ligar `q9-orbitals` stage 3 stacks twelve electron pieces, a ladder, jargon labels, counters and a magnet. The rule "one decision per stage" is stated in `CLAUDE.md` and still broken.
- **Observing a refusal instead of predicting.** Ligar `q8` stage 5.
- **Gaps in the arc.** `q6` and `q7` of Ligar have little quantitative content; five-domain shapes are missing; the electron sea is only implied.
- **Out-of-scope content.** Lewis acids (Verdigris `q1` stage 7, marked beyond the exam in its own header). `PRODUCT.md` also says boss phases must re-test and never introduce; each world's boss should be re-checked for that.
- **Difficulty jumps.** Qualitative to a typed three-step calculation without a worked example. `worked-problem` exists but is skippable, pays nothing, and appears at the end of a bench, after the student already needed the skill.

## 11. Reading load is high

- Prompts follow the "at most 25 words" rule, but nearly all are a dense single sentence with chemistry nouns and a symbol ("Find the concentration of hydronium, in mol/L, in the sealed flask.").
- Reward cards are 1–3 sentences by rule but each sentence carries a clause list.
- The story layer adds a lead line, a Vess debrief of 3–5 beats and a `Filed:` line on top of the lesson. The owner's global rule is to remove all text that is not necessary; the story is optional text that sits between the student and the lesson.
- The instruments carry plaques, captions, legends and printed notes. Some are essential (how a tool works); many are not.

## 12. The checks reward the wrong things

`verify:learn`, `verify:table`, `verify:story`, `verify:run` check that:

- no stage leaks the answer, uses a word before its reward card (the cause of problem 1), exceeds word limits, or lacks a hint ladder;
- the table geometry, overlap and walkability are valid;
- every stage mounts and runs.

None check that:

- every term in a prompt, hint or reward is either defined where first used or already earned in an earlier bench;
- one concept uses one word;
- each stage shows its mechanism in motion;
- the mechanism view reacts to the controls;
- the maths a stage needs has been taught by an earlier stage;
- the student never needs knowledge from a world they have not played.

So a world can pass `npm run verify` and still be unreadable.

---

## Worked example: Brinewire `q1-halves` stage 3, "Writing the Halves"

Source: `src/learn/quests/unit10/q1-halves.js`, stage `s3-halves`. The owner pointed at this bench as typical of the worst case.

**What the student gets.** Two text cards, "Zinc half" and "Copper half". Each prints `Zn → Zn²⁺` or `Cu²⁺ → Cu` and a two-row count (`charge`, left and right). The only controls are four electron dials (left and right, per card). The student turns dials until the charge numbers match on both sides, then presses Submit.

**What is wrong, using the problems above.**

- **No picture of what is being taught (5, 7).** The idea is that a zinc atom *gives up two electrons* and a copper ion *takes two*. Nothing shows a zinc atom, an electron leaving, an ion forming or an electron arriving. The student balances two printed numbers by turning a dial.
- **It can be solved without chemistry (7, 9).** A student who has never heard of electrons can keep turning dials until `0 = 0` and `2 = 2` read equal. The hint says exactly this ("turn the electron dials until the charge row has the same count on both sides"). The miss message states a mismatch in numbers.
- **Words and notation unexplained (1, 4c).** "Half" is never explained (half of what?). `Zn²⁺`, "left" and "right" of the arrow, "charge", "oxidation number" and "ledger" are used as if known. "Electrons on the left 0" is printed over the dial heads in a way that overlaps the dial knobs (visible in the screenshot).
- **The prediction is buried (8).** The prompt line is "You predicted 'On the copper ions, exactly as many'. Write each half ..."; the guess is recalled but the bench has no way to look at where the electrons actually go.
- **Fiction/vague objects (2).** "Ledger", "card", "half" and "base" are the nouns; no instrument is a real one.

**What it should be (a model for the fix).** A live two-beaker scene or a particle window:

1. A zinc strip in water. A zinc atom at the surface wobbles, then two electrons leave it (animated, drawn as small spheres with the same colour everywhere in the world) and it drifts off as a Zn²⁺ ion. The strip is visibly left with two extra electrons in its metal.
2. A copper ion Cu²⁺ in solution drifts to a copper strip, picks up two electrons from the strip and settles on it as an atom.
3. The student *drags the electrons* (or taps) from the zinc side to the copper side, and the charge counters (live, drawn on the particles: `+2`, `0`) update as each electron moves. The half-reaction line under each beaker writes itself from what is on screen: `Zn → Zn²⁺ + 2 e⁻`.
4. The graded thing is still the equation (same planner `halfOf`, `firstOff`), so the picture and the check stay honest.
5. A miss shows the unbalanced beaker (an ion with too much positive charge left, or an electron with nowhere to go) and says why in one sentence.

Dials of this kind are the common shape of a "balance the ledger" bench in several worlds (the `ledgerFixture`, `selectorFixture`, `dial` and tile-rig benches). The audit in the fix prompt must list every bench whose only interaction is a dial or a card over a text readout and replace the experiment with a mechanism view.

---

## What the new standard should be

1. **Say the real word, then gloss it, then use it.** The only things hidden are answers.
2. **Name things the way a lab does.** Fiction names belong to bosses and story.
3. **One word per concept per world, plus a glossary.**
4. **Teach the prerequisite where it is first needed**, including the maths, with a short worked example on the bench. Do not assume another world was played; either teach it again briefly or gate the world on the earlier one.
5. **Every bench is a dynamic interactive, and 3D wherever it can be; static plates are the rare exception.** Every instrument is a live model. The student changes a control and sees the particles, ions, bonds, electrons or energy respond, in time, before reading the number.
6. **Name the idea while the student is watching it**, then let the card say it in one or two short sentences.
7. **Predictions follow a short demonstration** and use the real terms.
8. **Hints and misses explain by replaying the mechanism**, not by repeating the mismatch.
9. **Teach in steps:** see it, name it, use it, calculate with it.
10. **New checks** so the above is enforced by `npm run verify` and not by taste.

---

## Lessons from Brinewire (2026-11-06)

- **The 2D table had no clock.** Painters were pure functions of table state and the loop stopped when pieces stopped easing, so a moving model had nowhere to run. Fixed once, in shared code: a kit's `live(state)` keeps the loop going and `b.clock` is passed to fixture painters (`table2d.js`). Other kits adopt it by declaring `live` on a fixture handler.
- **The rule that caused the euphemisms was also the check.** Removing `WITHHELD_VOCAB` entries was one line each; the harder part is that the prose written under the old rule still has to be rewritten stage by stage. Only Brinewire's banned list exists so far.
- **A moving model beside the dials is a half-fix.** The graded move is still turning a dial; the model shows the consequence. The prompt's goal (the student acts on the electrons) needs the cards' dials replaced by dragging electrons, which was not done.
- **A pass this large does not fit one run.** Fifty-three stages across six kits each need their own mechanism, planner wiring and Tour step. Rule 6 (hard rules) held; the rule that was hard to keep was "do not stop for the owner" against "rebuild everything": the honest tally is in `docs/teaching-pass/Brinewire.md`.
- `npm run verify` stops at the first failure and `verify:story` fails on `unit02/q10-wavefunctions` (no story animation), so the later checks only run when called one by one.

## Requirement added 2026-11-06: 3D visualizations first

Whenever possible a mechanism view is a **3D visualization**, not a 2D one. Atoms, ions, electrons, strips, beakers, wires, orbitals and lattices are solid objects in space, seen by a camera that leans over the plate. Things may hover in the air and gravity may be ignored (a hovering ion cloud, electrons floating along a wire): physical realism of support is not the point, spatial clarity is. A flat canvas is used only for things that are flat by nature (a graph, a printed spectrum, a table of values), and for `3D Off` / reduced motion, where the same model is drawn flat from the same planner. Each mechanism view therefore ships both: a 3D dress that ticks in time (`dress3d` with `userData.tick(dt, still)`), and a flat painter driven by the table clock (`live`); both read the same pure model so the picture is the same fact.


### More lessons from Brinewire (second run)

- **Two phone-floor checks pin the table's area.** `verify:table` (340 px wide) and `verify:bench` (3D leaned in at 812 x 375) each hold every piece at 28 px, one by width and one by depth, so a tall table cannot be given free width beside it and a wide one cannot be given depth below it. Adding a mechanism view to a table that is already at the floor is impossible without re-laying the table; eight Brinewire stages were in that state and were re-laid by hand: cards and strips in rows or blocks, wider tables up to the 340 px limit, and `cell-room.js` to find the empty rectangle. Widening is cheap in 3D (the plate is 3.7 times wider than deep) but pieces far to the side or back shrink by perspective, so keep pieces near the middle. A view that lives inside an instrument's own beakers (`cellgalv`, `cellboard`) costs no area.
- **A view needs the instrument's read function, not the stage.** One builder per fixture kind (`cell-scenes.js`) covered 53 stages; stage-by-stage models would not have.
- **Another session may be editing the same checkout.** Running `git stash` in a shared working tree reverted the other session's files for a few minutes; restoring meant a three-way merge per file. Do not stash in this repository while another run is active.

## Lessons from Verdigris (2026-11-06)

- **A wording pass can be done by tool, and should be.** `tools/lib/rewrite-play-text.py` rewrites only string literals, so renaming *rig*, *tile*, *chip*, *lens* and *strength* across a world's quests, kits, Tours and bank took minutes and touched no code. The one real hazard is a word with two meanings: *strength* meant concentration in most places and "how strong an acid is" in `q4`; the script has a skip list and the banned entry has a `skip` pattern.
- **A painter must not write to its fixture.** `verify:table` builds each table twice and compares; a painter that cached a shuffle or a start time on the fixture made every Verdigris stage fail it. Painter memory belongs in a `WeakMap` (`phmotion.scratch`).
- **"Moving" is cheap to add and easy to overclaim.** Wobbling spheres and a proton hop make 57 of 69 stages count as live, but the graded move in most is still a dial or a card. The honest unit is "the student's action changes the particles", which this pass did not reach for q2, q5, q6, q7 and q8.
- **Dynamic equilibrium is a good first mechanism because the count is graded and the identity is not.** Swapping which units are ionized while their number stays the planner's keeps the picture honest and shows the exchange the doctrine asks for.
- **Predict lead-ins conflict with the no-leak rule.** For q3 stage 1, q4 stage 1 and q6 stage 2 any clip of the topic shows the answer; they need an owner decision on which neighbouring case to show.
- **Concurrent sessions edit the shared tools.** `tools/teaching-ratchet.json` is rewritten whole by `--update`, so one world's update can erase another's keys; keep each world's ratchet under its own key and write by merging.

## Lessons from Teeter (2026-11-06)

- **A shared checkout is not safe for `git stash`.** Another session was editing Verdigris files at the same time; a stash and pop to compare test results swept up their edits and one of my own files reverted. Compare against a worktree or read the failing checks instead.
- **The cheapest honest mechanism view is shared, not per-stage.** Seven fixture kinds cover 52 of 69 stages because the kit already drew every stage through a few painters; one `driftOf` helper, a per-fixture glide and the table clock did the work. The cost is that this adds motion beside the graded move and does not change it (the same half-fix Brinewire recorded).
- **A rename pass on string literals needs a tokenizer, not sed.** Ids (`'pan'`), paths and template expressions share the words with play text; a scanner that skips comments, `${}` and strings without a space made it safe, and the new check found the single-word labels it deliberately skipped.
- **Checks written against the old words break on the rename.** `teeter-q8-checks.mjs` required "pan" in a refusal; a rename pass must grep `tools/` too.
- **A wholly static bench slipped through.** `q4-properties` has no fixture that moves and no ratchet failed, because the ratchet counts the world, not each bench. The static-ratio check should also fail per bench.
- **A recording context gives a 3D form for free.** If a flat painter is a pure function of state and clock, running it against a context that records circles, rings and rectangles yields the 3D crowd with no second layout to keep in step (Teeter, `pans-3d.js`). The painter must not read the real canvas, and any per-fixture animation state must be keyed by scope so the two forms do not fight.
- **Making the table taller shrinks every piece.** Adding a fixture by enlarging a stage's bounds fails `verify:bench` (pieces under 28 px at phone landscape); rearranging the existing pieces is the fix.
- **A film of the tool can be the stage's own solution.** The Tour demos replay each stage's scripted `SOLUTIONS` on its real table, so no second picture of the tool exists to go stale. The cost is that a demo shows the solution of one stage; keep demos to stages whose solution does not reveal the answer to the stage you are teaching from (Teeter's demos use the first stage that meets the tool).
- **A harness that drives a dial by its track cannot drive a tap.** `verify:table` and `verify:bench` assumed every `setDial` has a track; answering by tapping needed a `pickSpot` in both.
- **An outcome can be a place.** "Rises / falls / stays the same" becomes a tap above, on or below the dashed line the graph already draws, so the student answers on the model and the grading dial is untouched. Zones that follow a picture (`kit.tapZones`) must be computed from the same scale the painter uses, or the bands drift from the line.

### Lessons from Brinewire (third run)

- **Give the answer to the particles, with a hidden dial underneath.** A tap on a resting particle sets a dial the stage already grades, so no check had to change and a scripted solution plays by tapping (`kit.hotspots`, `touchSpots`). The cost is one site set per stage; the benefit is that the graded fact is a thing in the model.
- **Where the answer is a metal, move the metal.** Ranking is dragging the strips themselves onto the rail; choosing is laying the strip in the answer seat. Name cards were a second object standing for the first.
- **3D and flat must share one fit.** A 3D dress scaled to the fixture box and a flat painter scaled to a uniform fit put the same particle in two places, and a tap landed on its neighbour.
- **A shared Tour needs a shared clip.** The other teaching session built `tour-demo.js` the same hour; a kit adds clips by registering demos built from its own stages (`stageDemo`), not by drawing pictures of the tools.

### Lessons from Brinewire (fourth run)

- **A mechanism view can give the sealed answer away.** The model was built from the instrument's read function, so it drew a hidden metal in its true colour and a sealed cell with its true concentrations. Every builder must read what the player may see, not what the planner knows; `verify:teaching` now plays the sealed stages and looks at what the model draws.
- **Most "pick a statement" stages are really "pick a thing".** Which bar the electrons leave, which beaker is dilute, which strip gained mass: all are an object in the model. Five stages stay statements because the answer is a relation between readings, an equation or arithmetic.
