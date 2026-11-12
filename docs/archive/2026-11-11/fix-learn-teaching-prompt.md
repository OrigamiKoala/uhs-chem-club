# Prompt: fix the teaching in the Learn worlds

Written 2026-11-09 from a read of every stage's prompt, hints and reward card in the ten live worlds (610 stages, dumped from the quest modules), the earlier problem list (`docs/general-problems.md`), the owner's feedback (`docs/feedback.md`, `docs/feedback-11-01.md`) and the five teaching-pass records (`docs/teaching-pass/`). Nothing was played in a browser.

This supersedes `docs/fix-world-teaching-prompt.md` as the brief to work from. That file and `docs/general-problems.md` stay as background, mainly for their "Lessons from ..." sections, which record engine traps you will otherwise hit again.

Give this whole file to an agent. It covers all ten worlds; the work is done one world at a time and resumed across runs.

---

## 1. The situation

Avalon's Learn track teaches chemistry to students aged 12 to 17 who are meeting each topic for the first time. Each world is a course unit; each quest is a bench of about eight stages; each stage is one decision made on a tabletop of physical pieces.

The owner's judgement of the track as it stands: it does not explain things intuitively, it is often confusing and overcomplicated, and in places it oversimplifies. The survey below agrees, and finds the cause is mostly in the **design of the lessons**, not in the engine.

Five worlds have already had a "teaching pass" (Ember Reach, Mirrowen, Teeter, Verdigris, Brinewire). Those passes renamed vague words, added glossaries, and put moving particles on the instruments. Their own records say what they did not do: in nearly every stage the student still turns a dial, lays a card or types a number, and the moving model sits beside that as decoration. The passes also measured themselves by counts (stages "live", words banned, ratchets held), and the counts went to target while the teaching stayed about the same. The other five worlds (Tallow, Lanternfall, Ligar, Bellows, Kettle) have had no pass at all, and still carry wording the owner asked to have removed twice.

So the job is not another wording pass and not another animation pass. It is to make each stage teach: a first-time student should be able to say, after the stage, what they found out and why it is so, because of what they did and saw on the bench.

## 2. What a stage that teaches looks like

Hold every stage to these. They are the standard; everything in section 3 is a way of missing one of them.

1. **The student knows what question they are answering before they touch anything.** Not which button to press: what we are trying to find out, in words a 13-year-old has. A stage that opens with "Set the marker to..." or "Lay the card for..." has given an operation, not a question.
2. **The idea is visible on the bench while the student acts.** The cause of the result is in front of them (particles, charges, energy, bonds), and it responds to what they do. If the idea appears for the first time in the reward card, the stage did not teach it; the card did, in a paragraph, after the fact.
3. **The answer cannot be reached without the idea.** If a student can pass by reading a number off an instrument and ranking, by turning a dial until two readouts match, or by copying the last hint, the stage tests operation of the game.
4. **Every word is either already known, or explained where it stands.** The real term, with a short gloss, the first time; that term only from then on. No euphemisms and no unexplained textbook register either.
5. **It is as simple as the idea allows, and no simpler.** One decision. The answer is entered in the most direct form. Nothing on the table the decision does not need. But where the real rule has a limit or a reason, the stage says so in a clause instead of teaching a slogan the next world has to un-teach.
6. **Getting stuck leads to understanding, not to the answer.** Hints build the idea a step at a time on the student's own bench; a miss shows why the attempt did not work. Neither hands over the answer or the full procedure.
7. **It needs nothing the track has not taught.** Maths, notation, how to read the instrument, facts from other worlds: taught on the bench first, or given on a plate.

"Never give away answers" (`CLAUDE.md`) still holds. It has been over-applied into "never explain". Explaining the concept and the instrument is not giving away the answer: teach the idea on one case, then ask about a different case.

## 3. What the survey found

Counts are from the stage dump (section 5 says how to regenerate it) and are orders of magnitude. Each finding names examples so you can see the pattern; they are examples, not the full list. Finding every instance in a world is your job.

| World | Stages | Typed-number | Reward over 40 words | Teaching pass | Most frequent non-lab nouns in play text |
|---|---|---|---|---|---|
| Tallow (`unit01`) | 55 | 10 | 13 | none | needle, tray, bin, fulcrum, pan, pile |
| Lanternfall (`unit02`) | 61 | 3 | 27 | none | lamp, strip, rack, box, holder |
| Ligar (`unit03`) | 74 | 0 | 30 | none | arms, slate, tray, lamp, tile, balloons |
| Bellows (`unit04`) | 49 | 17 | 19 | none | gauge (64), room (44), pushes, holder |
| Ember Reach (`unit05`) | 47 | 16 | 4 | 2026-11-06 | few |
| Mirrowen (`unit06`) | 58 | 15 | 13 | 2026-11-06 | tray, box, gauge |
| Kettle (`unit07`) | 75 | 16 | 28 | none | pot (50), tray, heap, recipe, chips |
| Teeter (`unit08`) | 69 | 11 | 25 | 2026-11-06 | few |
| Verdigris (`unit09`) | 69 | 15 | 26 | 2026-11-06 | few |
| Brinewire (`unit10`) | 53 | 11 | 11 | 2026-11-06 | strip |

### 3.1 The idea arrives in the reward card, after the stage is over

This is the most common fault and the one that most makes the track feel unexplained. The stage is an operation on an instrument; the meaning is a paragraph shown after Submit.

- Tallow `q2-core` stage 3: the student sorts "specks" by whether charged plates bend them. The reward then introduces protons, neutrons and electrons in one card, and the electrons were not in the experiment at all ("Much further out ... sit the electrons").
- Lanternfall `q2-photon` stage 2: the reward says a wave model predicts brightness should matter, "so light must deliver its energy in discrete packets". That is the central idea of the quest, given as a one-clause inference.
- Lanternfall `q4-cloud` stage 3: strings on a ring; the reward ends "Electrons follow this same rule: wave-particle duality."
- Ligar `q8-hybrid` stage 2: the reward concludes "Consequently, atomic orbitals must hybridize".
- Ember `q7-gibbs` stage 2: Gibbs free energy, `ΔG = ΔH − TΔS` and "spontaneous" all first appear in the reward of a stage whose task was to type a temperature read from a plot.
- Verdigris `q2-scale` stage 1: "pH is minus the log of the H₃O⁺ concentration" is one sentence in a reward, and stage 2 demands a pH to two decimal places from it.

About 200 of 610 reward cards run over 40 words, because they are carrying the lesson.

### 3.2 Two bad voices: euphemism and textbook

The un-passed worlds use the old "withhold the word" voice. Bellows still says *gauge*, *room*, *push*, *knocks*, *squeeze* and *Holder 8* throughout ("Type the temperature at which Holder 8's room is twice Holder 7's"; "nitrogen alone pushes 60 kPa"), which the owner asked to have replaced with pressure and volume on 2026-10-09 and again on 2026-11-01. Lanternfall says "crests that pass each second" in stage 6 of a quest whose stage 1 already named frequency. Kettle has *pot*, *heap*, *recipe*, *chips*, "Tray the sample", "the number manganese carries". Tallow has *shots*, *specks*, *the needle* (a charge meter), *bins*, *piles*, *fulcrum* (a mass spectrometer the student is never told is one), and mixes *weight* with *mass* ("atoms of weight 20").

Rewritten text swings to the opposite voice, which a 13-year-old cannot read either:

- Ligar `q8` stage 4 reward: "Lateral overlap of unhybridized parallel p orbitals above and below the axis forms a pi bond".
- Ligar `q7` stage 5 reward: "Molecules with permanent dipole moments reorient in the presence of an electric field and are attracted to an electrostatic charge. Consequently, ..."
- Lanternfall `q10` stage 2 hint: "squaring any real amplitude produces an exclusively non-negative probability density".
- Ember `q6` stage 2 reward: "The measure of the number of microstates available to a system is its entropy".
- Ligar predict prompts: "Does carbon dioxide align in an external electric field despite possessing polar bonds?" (which also leaks the answer with "despite").

Often both voices are in one stage: Ligar's shape bench says "arms", "balloon" and "hub" in the prompt and "trigonal bipyramidal electron domain geometry" in the reward. The target voice is neither: the real term, glossed once, in short plain sentences.

### 3.3 Instruments that print the answer

Many stages give the student a black box that outputs the very property being taught, then ask them to rank or sort by its readout. The student compares numbers; the reason is in the reward.

- Lanternfall `q8-trends`: "Tug Electron", "Remove Electron", "Add Electron", "Measure Pull" each print a number per atom; five of seven stages are "read, then order on the rail". Shielding, effective nuclear charge and the two exceptions (boron below beryllium, nitrogen's electron affinity) are asserted in reward clauses.
- Ligar `q7-polarity` stage 1: the card prints the electronegativity difference; `q5-resonance` stage 4: a stamp prints each atom's formal charge.
- Tallow `q1-grain` stage 3: a reader prints each atom's name and mass; `q3-catalogue` stages 5 and 6: "Test Card" reports what each element does.
- Teeter `q4-properties`: "Read K" prints K for a card; the student matches cards.
- Mirrowen `q2-grip`: a probe prints the heat to separate a mole; six of eight stages are "order by the reading".

Reading a measurement is fine. The fault is when nothing on the bench connects the reading to its cause, so the trend is memorised and not understood.

### 3.4 Worksheet stages

About 130 stages are typed-number answers and about 60 have no instrument at all: a printed plate of figures and an entry field. Bellows `q3-ideal` is five of these in nine stages; `q1-knocks` stage 7 teaches the manometer with no manometer, only a plate of mercury levels. Many are multi-step with a unit conversion (Bellows `q5` stage 7: rms speed with kg/mol; Ligar `q7` stage 7: percent ionic character via ångström conversion; Brinewire `q4` stage 7: log K from a cell voltage). The support is one hint line that states the formula. Two Bellows stages are about percentage error in a student's lab report, which is not gas chemistry.

A calculation stage teaches when the student has first seen what the quantity is, has worked one example with the steps shown (the bank's worked-problem format exists for this but sits at the end of the bench, after the skill was needed), and then does a new case. A calculator is now on every stage; that removes arithmetic pain but not the question of whether the student knows what to compute or why.

### 3.5 Hints and prompts that give the answer, and hints that do not help

The hint ladder is meant to be: which control, what to compare, the method. In practice rung 1 is usually a list of the tools ("Use the heap, the two trays and the needle"), and rung 3 is often the answer.

- Tallow `q6-weigh` stage 1 rung 3: "Add 12.0 + (4 × 1.0) and type the total mass." Stage 3 rung 3: "72 divided by 18 gives the number of portions."
- Tallow `q1` stage 3 rung 2: "Two of the elements look alike, but their masses differ: one reads 23.0 and the other 24.3."
- Lanternfall `q6-filling` stage 5 rung 3: "Place two electrons in 4s and one electron in 3d." `q10` stage 3 rung 3: "Place 1s in 0, 2s in 1, and 3s in 2 radial nodes."
- Lanternfall `q9-absorb` stage 4 rung 3: "Add stock until Cuvette B reaches 8.0 mmol/L".
- Ligar `q6-shape` stage 1 rung 3: "set the marker to 180 degrees." Ligar boss phase 5 rung 3: "Select oxygen, whose molecular orbital configuration contains two unpaired electrons." Phase 2 rung 3: "Form a triple bond between carbon and nitrogen, leaving one lone pair on nitrogen."
- Ligar `q9-orbitals` stage 6: the prompt states the formula and rung 2 works all four answers.
- Lanternfall `q5-numbers` stage 1: the prompt names the target orbital and the three hints are a three-line lecture defining n, l and mₗ.

Elsewhere the ladder is procedural and gives a stuck student nothing conceptual: "Put the atom with the smallest cost at the left of the rail and the largest at the right."

`verify:learn` has an answer-leak check; these pass it, so do not rely on it.

### 3.6 Overcomplicated

- **Convoluted answer forms.** "Set the marker to how many degrees the H–O–H angle falls short of 109.5°" (the idea is: lone pairs squeeze the angle; ask for the angle). "Set the marker to the middle value of the three different angles between pairs of five arms." "Set the marker to the fewest arms that cannot all lie flat on the plate." "... in tenths, so 0.5 is 5." "Dilute until one more dilution would change the pH by less than 0.1." "Set the dial to where its A ends against the dashed line." "... with a minus sign if they come out too low." Each makes the student decode the entry format before they can think about chemistry.
- **Too many stages on one idea.** Tallow `q5-assay` spends 11 stages on the weighted average (the owner already asked for most of that quest to be removed). Ligar `q2-lattice` has 10 stages, three of them on alloys. Teeter `q4-properties` is eight stages of algebra on K with nothing physical happening. Teeter `q5-ice` is five typed ICE-table problems including a quadratic.
- **Abstraction where a real case would do.** Teeter's reactions are letters: `E ⇌ 2 D`, `F + G ⇌ H`, `M + N ⇌ W`, `X ⇌ Z`. A student cannot picture any of them.
- **Tools that need learning.** The owner's 2026-10-09 audit ("figuring out this game is harder than learning the chemistry") named the cutter, shaker, needle and moving detector. The same kind of piece is still there: the fulcrum dial, the coder, the stamp, the mixing bowl, the hub and turner, the ratio board, "Larger" keys held while holding a card.
- **Two things at once.** Kettle `q1` stage 4 marks a heap and sets a tally; several Verdigris and Brinewire prompts are "do X, then say Y".

### 3.7 Oversimplified

- Tallow `q3-catalogue` stage 5: "Atoms are happy when they have a full outer shell (8 electrons)." Atoms want nothing; the next three worlds have to replace this with energy and attraction.
- Tallow `q1` stage 4: "A lone atom cannot be divided", one quest before the student builds atoms out of protons and electrons.
- Tallow `q2` stage 5: shells hold "2 in the first, 8 in the second and third" with no "for these first eighteen elements"; Lanternfall later says the third holds 18.
- Tallow `q2` stage 6: "one valence electron is given away, seven takes one, and a full shell of eight trades nothing" as a rule with no reason; Ligar `q1` then explains bonding as reaching a full shell again.
- Ligar `q7` stage 1: "Above about 1.7 the bond is counted as ionic" (stage 7 of the same quest then says it is only a rule of thumb).
- Kettle `q9-hsab`: "hard prefers hard, and soft prefers soft" as a slogan across eight stages.
- Rules of thumb presented as laws, exceptions waved through in a clause, and human motives given to atoms ("trade", "reaching for", "prefers", "wants") wherever they occur.

The repair is usually one honest clause ("for the first 18 elements", "by ordinary chemical means", "a rough guide") or showing the reason (lower energy, stronger attraction) instead of the slogan.

### 3.8 Order, scope and repeats

- **Used before taught.** Limiting reactant is the point of Ember `q3` stage 7 (unit 5) and is taught in Kettle (unit 7). Kettle `q1` stage 4 teaches limiting reactant before balanced equations (`q4`) or mole ratios (`q6`). Activation energy is a typed stage in Ember `q3` stage 8; kinetics is unit 11 and not built. Bellows needs kelvin from `q1` and introduces it in `q2` stage 3 (the owner asked for kelvin first). `BUILDS_ON` in each quest file is only a comment, and every world is open from the start.
- **Repeated across worlds.** Kettle `q1-recipe` re-teaches compound against mixture, percent composition and empirical formula, which Tallow `q1` and `q6` already taught.
- **Beyond the audience.** Kettle `q9-hsab` (hard–soft acid–base theory, a whole quest); Verdigris `q1` stage 7 (Lewis acids, labelled "beyond the exam" in its own prompt); Mirrowen `q5` stage 8 and `q7` stage 6 (labelled the same); Teeter `q8` stage 7 (ATP coupling); Ligar `q7` stage 7 (percent ionic character). Lanternfall `q10-wavefunctions` and Ligar `q9-orbitals` are also beyond AP, but the owner asked for them (`docs/feedback-11-01.md`), so they stay; see 3.9.
- **Boss.** Kettle's boss has three phases, titled Phase 1, Phase 4 and Phase 5; phases 2 and 3 are described in its header and missing from `STAGES`. Re-check every boss re-tests ideas the benches taught and that its hints do not hand over answers.

### 3.9 Owner requests that were built as the opposite

- Lanternfall `q10-wavefunctions` was asked for as an introduction to wavefunctions and orbitals "in a super visual way". It is five card sorts with no instrument, formula hints and the densest text in the track.
- The Molecular Orbitals expansion was asked to show "visually how the atomic orbitals add up or subtract", with "atoms transitioning between free and bonded". Ligar `q9` stages 4 to 6 are card sorts whose prompts state the rule.
- Bellows: pressure and volume for gauge, room and push; kelvin first; state the ideal gas law before it is needed; sort lowest on the left.

Re-read both feedback files for the world you are on and check each item against the source; do not assume an item marked implemented is.

### 3.10 Plain errors in the text

"Order the five sources of light form lowest" (Lanternfall `q1` stage 5). "(8 electrons).Group 18" (Tallow `q3` stage 5). "inspect the bond bond table" and "Now Read the Bond table" (Ember `q4` stage 4). "Methyl red changed between 25.0 and 25.0 mL" (Verdigris boss phase 4). "diamagnetic and unpulled" (Ligar `q9` stage 2). Hints that say "crate" for a piece labelled "drum" (Tallow `q6`). The scripted rename passes left grammar damage in about one string in twenty; read every string you keep. Check the chemistry of every reward card as you go, and record anything you correct.

## 4. What to do

Work one world at a time, in this order: **Ember Reach, Mirrowen, Teeter, Verdigris, Brinewire** (passed for words and motion, not for lesson design), then **Bellows, Tallow, Kettle, Lanternfall, Ligar**. Finish a world, verify it, and record it before starting the next. This will not fit in one run; `docs/teaching-pass/PROGRESS.md` (create it) carries the state between runs: per world, which benches are done, what is open, and what is waiting on the owner. Update it as you go, not at the end.

For each world:

### 4.1 Read it as the student

Dump every stage's text (section 5) and read the whole world top to bottom, in play order, before changing anything. Read each bench's kit and data code enough to know what the student actually sees and does on each table: the dump shows words, not the picture. Read the world's plan (`docs/plans/<world>-world.md`), its audit, its teaching-pass record if it has one, and its items in both feedback files.

For each stage write, in `docs/teaching-pass/<World>.md`, one row:

- **Idea:** the one thing the student should understand afterwards, in a sentence a 13-year-old could say. If you cannot write it, or it is two things, that is a finding.
- **How they would come to know it:** what on the bench makes the idea evident. "The reward card says so" is a failing answer.
- **Faults:** against the seven points of section 2, citing the text.
- **Change:** keep, reword, redesign, split, merge, move or cut.

Then read the bench as a sequence: does each stage need only what came before; does difficulty rise in steps; is any idea taught twice or used before it is taught; is there a stage whose removal would lose nothing?

### 4.2 Fix the lesson before the words

Decide the bench's sequence first (cuts, merges, moves, new stages), then redesign the stages that fail points 1 to 3, then write the text of everything. Do not polish wording on a stage you are about to rebuild.

What a redesign usually means, in order of preference:

1. **Make the existing instrument show its cause.** If a probe prints a number, show what the number is a measure of, responding as the student acts, so the ranking can be reasoned and not just read. Often the particle view the earlier passes added is already there and only needs to be the thing the student acts on, or to carry the difference between the cases.
2. **Change what is asked.** Keep the bench; ask the question that needs the idea. Ask for a prediction on a new case after an observed one; ask which change would produce a result; ask for the angle and not its distance from 109.5°.
3. **Change the graded act.** Where the student sets a dial to a number the bench already shows, have them make the system reach the state instead. `docs/general-problems.md` ("Lessons from ...") lists the engine routes that worked: a tap on a particle that sets a hidden dial, a tap zone on a graph, dragging the real object onto the rail.
4. **Put the telling before the doing.** The stage `briefing` (two sentences at most) and the predict stages' `lead` clip are the places to set up the question and name the idea on a neighbouring case. Most stages have no briefing and start cold. The reward card then confirms in one or two short sentences what the student just saw; it does not introduce it.
5. **Teach the calculation.** First a stage where the quantity is seen and compared without arithmetic; then one worked case with steps shown, placed before the first typed stage; then typed stages on new cases, each with something on the bench that the number describes. Cut typed stages that only repeat. A stage with only a plate and a field needs a reason to exist.
6. **Cut.** A bench that teaches four ideas well in five stages is better than one that covers eight in eight. Archive what you cut (`archive/<date>/` with a README, never deleted); never reuse a stage id.

A new kit or a rebuilt instrument is sometimes right, but it is the most expensive option and the earlier passes show that large engine work crowds out the lesson. Spend it where a bench cannot teach its idea any other way (Lanternfall `q10` and Ligar `q9` stages 4 to 6 are clear cases: the owner asked for visual lessons and got card sorts).

### 4.3 Write every string to the standard

- **Prompts:** one plain question or instruction, at most 25 words, stating what to find out. No route, no entry-format puzzles, no "then say". Real terms.
- **Terms:** one word per concept per world, in `src/learn/glossary/<world>.js` (five worlds have one; create the other five on the same pattern and register them in `glossary/index.js`). Real quantity and instrument names: pressure, volume, charge meter, mass spectrometer, reaction vessel. Each term glossed in a clause at first use. Fiction stays in boss names, saga and Vess's lines.
- **Hints:** three one-sentence rungs that would help a student who does not yet have the idea: where to look, what to notice, how to reason from it. Rung 3 may give a needed formula or constant; it never gives the answer, the move, or the worked arithmetic of this stage.
- **Misses:** say what the attempt showed and why that is not it, without the answer.
- **Rewards:** one or two short sentences, at most 40 words, naming the concept the student just saw. No new idea, no second example, no derivation. If it needs more, the stage is not doing its job.
- **Register:** sentences a 13-year-old reads once. Not "exhibits", "consequently", "possessing", "internuclear", "electrostatic repulsion", "thermodynamic effects". Not "happy", "wants", "prefers" either.
- **Honesty:** where a rule is a simplification, say its limit in a clause.
- Apply the same to labels, plaques, captions, Tour steps, the question bank (`src/learn/bank/<unit>.json`) and the boss. Leave internal ids alone.

Follow the owner's copy rule (`CLAUDE.md`): remove any text that does not have to be there, and make sure what remains makes sense and is not merely fancy.

### 4.4 Order and prerequisites across worlds

Within a world, fix order freely. Across worlds, do not assume an earlier world was played: where a stage needs moles, ions, kelvin, logs or the like, give a short recap at first use (the glossary `NEEDS` and primer mechanism exists in the passed worlds). Move or cut a stage whose idea belongs to another unit (limiting reactant in Ember, activation energy in Ember), and keep `BUILDS_ON` true.

### 4.5 Decisions that are the owner's

Do not stop work to wait on these. Take the default, record the decision at the top of the world's teaching-pass file and in `PROGRESS.md`, and carry on; ask only if a default would destroy something that cannot be restored from `archive/`.

- Beyond-exam content (Kettle `q9-hsab`, Verdigris `q1` stage 7, Mirrowen `q5` stage 8 and `q7` stage 6, Teeter `q8` stage 7, Ligar `q7` stage 7). Default: leave in place, fix its teaching last, list it for the owner with a recommendation.
- Removing a whole quest, or changing the number of quests in a world.
- Which neighbouring case a predict lead-in may show when any clip of the topic reveals the answer.

## 5. Tools, checks and limits

- **Stage dump.** `node tools/lib/teaching-dump.mjs unitNN` prints every stage of a world as JSON (title, prompt, hints, reward, fixture kinds, labels). Format it into one readable page and read it whole; re-dump after changes and read it again. Boss phases resolve their text lazily in places, so check the boss file directly.
- **No browser play.** The owner play-tests. Verify with `npm run verify` and its parts (`verify:learn`, `verify:table`, `verify:bench`, `verify:teaching`, `verify:<world>`, `verify:story`), `npm run build`, and Node scripts of your own. `npm run verify` stops at the first failure, so run the parts singly. Record the failures that exist before you start a world and report them separately from your own. `dist/` is wiped by the build: move anything non-build out of it first.
- **Checks are not the goal.** A stage that passes every check can still fail section 2, and the last five passes prove it. Do not add motion, primers, ratchet entries or glossary rows to move a count. Where a check blocks a real improvement (for example a `VOCABULARY.introducedAt` gate that forbids glossing a term where it is first needed), change the check and say so; do not weaken XP, answer-leak, overlap, geometry or phone-size checks. Extend the leak check where you can so it catches rung-3 hints that state the answer or the arithmetic.
- **Engine limits that bit earlier passes** (details in `docs/general-problems.md`): two phone-size floors pin each table's area, so adding a fixture usually means re-laying the table; painters must be pure functions of state and clock and must not write to their fixture; a kit that spreads another kit must re-declare `live`, `onMiss` and `tapZones`; a mechanism view must read only what the player may see, or it draws the sealed answer; rename with a tokenizer that touches string literals only, then read the diff.
- **Shared checkout.** Another session may be editing this tree. Do not `git stash`; do not rewrite shared ratchet files whole. Commit nothing unless asked.
- **Hard rules that still hold** (`CLAUDE.md`): the Learn track pays no XP; every drag has a two-tap twin; one decision per stage; predictions are never graded and come before the instrument; what is drawn is what is graded; nothing overlaps; Scoured Plate aesthetic; `mountConsole` rules; retire by archiving.
- When a bench's stage count, order or ids change, update `meta.stageCount`, `VOCABULARY`, the world chart in `src/learn/worlds/`, any stage indices in the checks, the bank, the Tour, the counts in `PRODUCT.md` and `CLAUDE.md`, and `docs/engineering/engine-and-worlds.md`.

## 6. Done, and what to hand back

A world is done when every stage row in its teaching-pass file has a written idea, an honest "how they would come to know it" that is not the reward card, no open fault against section 2 (or the fault is listed as open, with the reason), and the world's checks and the build pass.

Report, per run:

1. `docs/teaching-pass/<World>.md`: the per-stage table (before and after), stages added, cut, moved or merged, corrections to chemistry, and decisions the owner may want to reverse.
2. `docs/teaching-pass/PROGRESS.md`, current.
3. **What is still not good**, stated plainly and ordered by how likely a student is to get lost: stages where the graded act is still a dial, card or typed number and why; stages whose idea you could not make visible; anything only a human eye can judge (pacing, whether a 13-year-old follows it). The earlier records were useful exactly where they said "this was not reached"; keep that standard, and do not describe a stage as fixed because a check passes.
4. Check results, with pre-existing failures separated from new ones.
5. `CLAUDE.md` and `docs/general-problems.md` updated where the doctrine or the lessons changed.
