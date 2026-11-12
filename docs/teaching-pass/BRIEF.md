# Teaching pass: the brief every session reads

This is the standing brief for the final teaching pass of the ten live Learn worlds. Every session (exemplar, plan, world, close-out) reads this file, `PATTERNS.md`, and its own world file under `worlds/`. Nothing else is required reading; section 9 lists what not to read.

The owner's verdict on the track today: it does not explain things intuitively, it is often confusing and overcomplicated, and in places it oversimplifies. Five worlds had a wording-and-motion pass on 2026-11-06 and five had none. Both groups share one fault: the student operates an instrument (turns a dial, lays a card, types a number) and the idea arrives afterwards in the reward card. This pass fixes the lessons. After it the owner should not have to edit a world again, so a stage you leave weak stays weak.

## 1. The standard

A first-time student aged 12 to 17 should be able to say, after a stage, what they found out and why it is so, because of what they did and saw on the bench. Hold every stage to these seven points.

1. **The question comes first.** Before touching anything the student knows what we are trying to find out, in words a 13-year-old has. "Set the marker to..." and "Type the..." are operations, not questions.
2. **The cause is visible while they act.** Particles, charges, energy or bonds are on the bench and respond to what the student does. If the idea first appears in the reward card, the stage did not teach it.
3. **The answer needs the idea.** A student cannot pass by ranking a readout that prints the property, by turning a dial until two numbers match, or by copying the last hint.
4. **Every word is known or explained where it stands.** The real term with a one-clause gloss at first use, that term only afterwards. No stand-in words (gauge, room, push, needle, pot, heap, arms) and no textbook register (consequently, exhibits, lateral overlap, microstates without a gloss). Atoms have no motives (happy, wants, prefers, trades).
5. **As simple as the idea allows, and no simpler.** One decision. The answer is entered in its most direct form (the angle, not "degrees short of 109.5"). Nothing on the table the decision does not need. Where a rule has a limit, say it in a clause ("for the first 18 elements", "a rough guide").
6. **Being stuck leads to the idea, not the answer.** Three hints build the idea on the student's own bench. A miss says what the attempt showed. Neither gives the answer, the move, or this stage's arithmetic.
7. **Nothing is needed that the track has not taught.** Maths, notation, how to read the instrument and facts from other worlds are taught on the bench first or given on a plate.

"Never give away answers" is not "never explain". Teach the idea on one case, in a briefing or a lead clip, then ask about a different case.

## 2. Decisions already made by the owner (2026-11-11)

- **Beyond-exam content stays and is fixed to the standard:** Kettle `q9-hsab`, Verdigris `q1` stage 7, Teeter `q8` stage 7, Ligar `q7` stage 7, Mirrowen `q5` stage 8 and `q7` stage 6, Lanternfall `q10-wavefunctions`, Ligar `q9-orbitals`, and any other stage marked beyond the exam (Brinewire `q1` stage 5 says so in its title). Do not cut these for being beyond the exam. Each must be followable by a 13-year-old; say "beyond the exam" nowhere in play text or titles.
- **You may restructure without asking:** cut, merge, split, move and add stages, and remove or merge whole quests, when that makes the world teach better. Archive what you remove (section 7). Record each structural change and its reason in the world file.
- **No browser.** No session opens the app. The owner play-tests. Verify with the checks in section 8 and with Node scripts.
- **Prerequisites.** Worlds are all open from the start, so do not assume an earlier world was played. Where a stage needs moles, ions, kelvin, logarithms or similar, recap at first use (glossary `NEEDS` and primer, see `PATTERNS.md`). An idea that belongs to a later unit is cut from the earlier one or replaced by a case that does not need it: limiting reactant and activation energy leave Ember Reach.
- **Do not stop to ask.** Take the option that teaches best, record it, continue. Stop only if a change cannot be restored from `archive/`.

## 3. Method: one bench at a time

Work through the world in play order, one bench (quest) at a time, the boss last. Finish a bench completely before opening the next. For each bench:

1. **Read it as the student.** `node tools/teaching-report.mjs <unit> <quest> --read` prints the bench in play order; the same command without `--read` prints fault flags. Read the quest file's `table` definitions and the kit's painter for each fixture kind used, enough to know what the student sees and does. The text alone does not tell you that.
2. **Write the plan rows** in the world file, one per stage, before editing code (skip if a plan session already wrote them; then check each row against the bench and correct it):
   - **Idea:** what the student understands afterwards, in one sentence a 13-year-old could say. Two ideas, or none, is a fault.
   - **Evidence:** what on the bench makes the idea evident while they act. "The reward says so" fails.
   - **Faults:** which of the seven points fail, quoting the text.
   - **Change:** keep, reword, redesign (name the pattern from `PATTERNS.md`), split, merge, move or cut.
   Then read the rows as a sequence: does each stage need only what came before, does difficulty rise in steps, is an idea taught twice, would removing a stage lose nothing.
3. **Fix the lesson before the words.** Settle the sequence, then redesign the stages that fail points 1 to 3, then write every string. Do not polish text on a stage you are about to rebuild.
4. **Write every string** to section 5, including strings you keep.
5. **Update what depends on the bench** (section 7 list) and run the bench's checks (section 8).
6. **Record** in the world file: the rows' final state, what changed, what is still weak and why. Update `PROGRESS.md`. Then start the next bench.

Preference order for a redesign (details and file pointers in `PATTERNS.md`):

1. Make the existing instrument show its cause, and make that the thing the student acts on.
2. Change what is asked, on the same bench: a prediction on a new case after an observed one; which change would produce a result; the direct quantity.
3. Change the graded act: a tap on a particle, a tap zone on the graph, dragging the real object, instead of a dial set to a number the bench already shows.
4. Put telling before doing: a `briefing` of at most two sentences, or a `lead` clip of a neighbouring case on a predict stage. Almost no stage has a briefing today (7 of 610).
5. Teach a calculation in three steps: see and compare the quantity without arithmetic; one worked case with steps shown, placed before the first typed stage; then typed stages on new cases, each with something on the bench that the number describes.
6. Cut. Four ideas taught well in five stages beat eight ideas in eight.

A new kit or rebuilt instrument is the most expensive option. Earlier passes spent their budget on engine work and left the lessons unchanged. Build one only where the world file says so or where no cheaper option can make the idea visible.

## 4. What the earlier passes got wrong (do not repeat)

- They measured themselves by counts (stages "live", words banned, ratchets held). The counts reached target and the teaching did not change. No count is a goal in this pass, including the flags from `teaching-report`. Never edit text to clear a flag.
- They added moving particles beside the dial. Motion that the student does not act on, and that does not differ between right and wrong answers, is decoration.
- They ran mechanical renames and left broken grammar in about one string in twenty. Read every string you keep.
- They called a stage fixed because a check passed. A stage is fixed when its plan row has an honest Evidence entry and the stage as built matches it.

## 5. Text rules

- **Prompt:** one plain question or instruction, at most 25 words, saying what to find out. No route, no entry-format puzzle, no "then", no "!". Real terms.
- **Briefing:** at most two sentences, immediately before the stage that needs it. It teaches the idea on a neighbouring case or names what to watch. It does not state this stage's answer.
- **Hints:** exactly three, one sentence each. 1: where to look or which control. 2: what to compare or notice. 3: how to reason from it; may give a needed formula or constant; never the answer, the move, or this stage's arithmetic.
- **Miss:** what the attempt showed and why that is not it, from evidence on the table.
- **Reward:** one or two short sentences, at most 40 words, confirming what the student just saw. No new idea, no second example, no derivation. If it needs more, the stage is not doing its job.
- **Register:** sentences a 13-year-old reads once. One word per concept per world, listed in `src/learn/glossary/<world>.js` and registered in `glossary/index.js` (five worlds have a glossary; create the other five on the same pattern). Fiction stays in boss names, the saga and Vess's lines.
- **Honesty:** a simplification carries its limit in a clause. Check the chemistry of every reward and record corrections.
- **Remove** any text that does not have to be there. Apply all of this to labels, plaques, captions, Tour steps, the question bank (`src/learn/bank/<unit>.json`) and the boss. Leave internal ids alone.

## 6. Engine rules and traps

Hard rules (`CLAUDE.md`): the Learn track pays no XP; every drag has a two-tap twin; one decision per stage; predictions come before the instrument and are never graded; what is drawn is what is graded; nothing overlaps; Scoured Plate aesthetic; every stage has the `Calc` button.

Traps that cost earlier passes the most:

- Two phone-size floors pin each table's area (`verify:table` at 340 px wide, `verify:bench` at 812 x 375, every piece at least 28 px). Making a table taller shrinks every piece. To add a fixture, re-lay the existing pieces; do not enlarge the bounds.
- A painter is a pure function of state and `b.clock`. It must not write to its fixture (`verify:table` builds each table twice and compares). Painter memory lives in a module map or `WeakMap` keyed by scope.
- A kit that spreads another kit must re-declare `live`, `onMiss` and `tapZones`. The miss hook is `kit.onMiss`, not `replay`.
- A mechanism view reads only what the player may see. Built from the planner's read function it draws the sealed answer.
- Predict stages: an older check forbids any fixture; a `lead` clip is the exception (`kind !== 'lead'`).
- `VOCABULARY.introducedAt` gates Tour text by stage. Where it forbids glossing a term at the point it is first needed, change the gate and say so.
- Rename words with a tokenizer that touches string literals only (`tools/lib/rewrite-play-text.py`), never `sed`; then read the diff, and grep `tools/` for checks that match the old word.
- `verify:learn` hard-codes stage indices for some quests; inserting or cutting a stage shifts them and the `NOTES` keys in the quest file.

## 7. When a bench's stages change

Update in the same bench step: `meta.stageCount`; `SOLUTIONS` and `MISSES`; `VOCABULARY`; `BUILDS_ON`; the world chart in `src/learn/worlds/<unit>-*.js`; stage indices in the world's check files under `tools/`; the bank entries for the bench; the Tour. Never reuse a stage id.

Archive what you remove under `archive/2026-11-11/<world>/` with a `README.md` saying what it was and why it went (never `git rm` working code or docs; `archive/` is not built or verified).

**Shared files: do not edit them.** `CLAUDE.md`, `PRODUCT.md`, `docs/plans/world-plans.md`, `docs/engineering/engine-and-worlds.md`, `docs/AP-coverage-audit.md` and `docs/general-problems.md` are reconciled once, by the close-out session, from the world files. Put count changes, doctrine changes and engine lessons under "For close-out" in your world file. The exception is a count that a check you must run compares against (`verify:docs` reads the `facts` comment in `PRODUCT.md`): change that one value and note it.

Shared code (`src/learn/engine/`, `src/learn/table/*.js` outside your world's kits, `tools/verify-learn.mjs`, `tools/verify-table.mjs`, `tools/verify-bench.mjs`): change only what your world needs, keep every other world's behaviour, and list each change under "For close-out". `atoms.js` and `mass.js` serve Tallow, Ligar and Kettle; `eqdata.js` serves Teeter and Verdigris; `pans-3d.js` serves Teeter, Ember Reach and Mirrowen.

Do not `git stash`. Do not commit unless the prompt you were given says to.

## 8. Checks

Run parts singly; `npm run verify` stops at the first failure and ends with a build. Baseline results from before the pass are in `PROGRESS.md`: a failure listed there is not yours, and you do not need to rediscover it.

- After each bench: `npm run verify:learn`, `npm run verify:table`, `npm run verify:<world>`.
- Once at the end of the world: those three, plus `npm run verify:teaching`, `npm run verify:bench`, `npm run verify:story`, `npm run verify:docs`, `npm run build`. The build wipes `dist/`; if `dist/art` exists, move it out first and put it back after.
- Do not weaken the XP, answer-leak, overlap, geometry or phone-size checks. A teaching ratchet or word check that blocks a real improvement may be changed; say so in the world file.
- Report only what you ran. If a check fails and you could not fix it, say so with the failing line.

## 9. Keeping the session small

Usage is limited. Read what the step needs and nothing more.

- Find faults with `teaching-report`, not by reading quest files end to end. Read a quest file one bench at a time, in chunks.
- Do not read: `docs/general-problems.md`, the audits (`docs/*-audit.md`), the 2026-11-06 records (`docs/teaching-pass/<World>.md`), `docs/archive/`, `docs/plans/*`, `PRODUCT.md`, or other worlds' quest files. Your world file already carries what matters from them. Open one only when the world file points to a section of it.
- Do not print whole check logs; pipe to `tail -30` or grep for `FAIL`.
- Write to the world file and `PROGRESS.md` after every bench, so a session that is cut off can be resumed by a new one.

## 10. Done

A world is done when:

- every stage has a plan row with an Idea, an Evidence entry that is not the reward card, and no open fault; or the fault is listed under "Still weak" with the reason it could not be fixed;
- the cold-read review (in the world prompt) has run on the finished world and each of its findings is fixed or listed under "Still weak";
- the end-of-world checks pass, apart from baseline failures;
- the world file ends with: structural changes, chemistry corrections, "Still weak" ordered by how likely a student is to get lost, "For the owner to look at" (stages whose table you rebuilt, since nobody has seen them), and "For close-out".

Say plainly what was not reached. A short honest list is worth more to the owner than a clean report.
