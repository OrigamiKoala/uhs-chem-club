{world} = <fill in: Mirrowen | Kettle (benches after q1) | Teeter | Verdigris | Brinewire | Quicklight | Lodestone | Thornmere | Cinder Halo>
{unit}  = <fill in: unit06 | unit07 | unit08 | unit09 | unit10 | unit11 | unit12 | unit13 | unit14>

# Goal

Build the whole of **{world}** in Avalon (repo: `~/chem-3d`), a browser chemistry game for students aged 12 to 17: every bench, the boss, the table kit, the story, the question bank, the walkable 3D site and every check. When you finish, the owner will play it and should find no operability bug, no unreadable or overlapping text, no answer given away, no stage that can be passed without understanding, and no chemistry that is false. The five worlds already built each needed weeks of audit and rework to get there. Every defect that audit found is written down. Your job is to not build any of them again.

**This is one autonomous run.** Do the whole job without stopping to ask for the next task. Stop and ask only if (a) an instruction here conflicts with `PRODUCT.md`, or (b) a decision is genuinely the owner's (a change of scope or of the product). Everything else: decide, do it, log it.

Be honest about what no agent can verify. You cannot see a student's confusion, the feel of a drag on a phone, or whether a number is friendly to a 12-year-old. Your deliverable therefore ends with the list of stages only the owner can judge. Do not claim more than you tested.

# Authorizations for this task

- **Commit on a branch.** Work on a new branch `world/{unit}` cut from the current branch. Commit after each phase, only your own files, with a message describing the change. **Never push.** Other agents may have uncommitted work in the tree: do not stage, revert or reformat their files.
- Do **not** run the full `npm run verify`: it ends in `npm run build`, which empties `dist/` (the owner keeps reference art there). Run the individual `npm run verify:<name>` scripts. If you must build, first copy anything in `dist/` that is not build output out to the scratchpad.
- **Never delete** code, docs or checks that were once real. Move them under `archive/<date>/` (or `docs/archive/<date>/`) with a README saying why.

# Read first, in this order (read large files in chunks; read only what you need)

1. `PRODUCT.md`, **all of it**, and especially "Building a Learn world". Its principles are hard constraints. Its section 5 is the pitfall ledger: every row is a defect that was built and fixed.
2. `CLAUDE.md` (hard rules, commands, the SCOURED PLATE aesthetic) and `docs/engineering/engine-and-worlds.md` (how the engine, kits, tabletops, worlds and bosses are built; the "Per-bench build notes" section has the layout traps).
3. The {world} section of `docs/plans/learn-quests.md` (the content brief: quests, stage objectives, the evidence on each bench, the word each reward card earns, the CED topics, the typed worked-figure stages) and `docs/AP-coverage-audit.md` (what the AP expects and which topics are still owed).
4. The AP Chemistry CED in `docs/ap-chemistry-course-and-exam-description.pdf` for the unit's topics. Read it by page range. Cite topic numbers.
5. **Exemplars. Read the actual files of the two most recent worlds**, because copying a working pattern beats inventing one: Ember Reach (`src/learn/quests/unit05/`, `src/learn/table/kits/heat*.js`, `tools/verify-ember.mjs`, `tools/lib/ember-learn-checks.mjs`, `src/three/ember/`, `tools/gen-ember-layout.mjs`) and Bellows (`unit04`, the gas kit). `src/learn/quests/unit05/q3-enthalpy.js` is the cleanest single bench (predict pair, proportional ramp, typed worked figure, miss messages that name what the table shows). `src/learn/quests/_template.js` is the contract.
6. To find every file a world touches: `grep -rIlE "unit05|ember" src tools` (about 50 files). Do the same for any file you suspect you missed at the end.

# Method

Build in this order. Each phase ends with its checks green and a commit. Do not start a phase until the previous one is green.

## Phase 0. Spec before code

Write `docs/plans/{world}-world.md`. It is the contract you will audit yourself against. It must contain:

1. **CED map.** Every CED topic of the unit, each assigned to a bench and a stage. A topic you cannot place is a logged gap with a reason. Topics that are calculations must have a stage where the player produces the number.
2. **Bench list** in teaching order, 6 to 9 benches and a boss. For each bench: the one idea thread, the instrument family, **the one click** (the stage whose answer contradicts a model students really hold, and what that wrong model is), the story stake (one thread of the case against the Fifth, a lead line, and the `Filed:` line the next bench picks up), `BUILDS_ON`, and the words it earns.
3. **A stage table for every stage.** 8 stages per bench (6 for a recap), each carrying a distinct idea, stage 8 normally a sealed sample, the boss five phases that re-test earlier ideas on a new case. Columns: objective (the prompt, at most 25 words, no "!", no route); **the evidence on the bench** that lets someone who does not know the answer work it out; **everything the bench prints, and the check that none of it is the answer or the capacity or the reasoning**; the wrong answers a student gives and the message each gets (naming what the table shows); the three hints (control, what to look at, method); the reward card (1 to 3 sentences, about 45 words, naming the idea); flat or 3D, and why; for numeric stages, the rung of the quantity ramp (picture, prediction, proportional, formula as shorthand, friendly numbers, past-the-dial typed figure with its slips as refused cards).
4. **Kit plan.** Pieces, fixtures, dials, the pure planners (one function per reading, shared by the drawn and the built twin), and the real data tables each number comes from (with a source). Reuse an existing kit (gas, heat, optics, shells, bonds, domain, atoms, mass, cloud, cuvette, pes, trends) wherever the physics allows; write a new kit only when it does not. Say which Tour words each new kind of piece needs.
5. **World plan.** The site layout (one host per bench, built into the world's machinery and clear of the bay envelope), the terrain and atmosphere, the boss arena spot, and the generator and verify script you will write.
6. **Pitfall review.** Go through every row of `PRODUCT.md` section 5 and the stage anti-patterns in section 4 and write, for each, either "not applicable: why" or "avoided by: how". Do not skip rows. A row you cannot answer means the design has a hole: fix the design.

Gate: reread the spec as a first-time 13-year-old with a phone. Cut every stage where the answer can be read off the table, found by hunting a dial, or reached by matching a printed fact to a tray. Cut anything crowded (principle 17: one decision per stage).

## Phase 1. Data and planners

Write the pure planners and the data tables first, with no UI. Every number the player will see comes from them. Check the planners in Node against hand-computed values from an independent source (a formula worked on paper, the CED, a standard table); never certify a value with the same code that produced it. Chemistry must be accurate: simplify freely, say nothing false, and where the kit encodes a simplification say so on the bench or under the model.

## Phase 2. Vertical slice: the click bench, end to end

Before building anything else, build **one bench completely**: the bench that holds the world's central click. Wire everything it needs, for real, not as stubs: the kit, the quest module (copy `_template.js`), the chart entry, the bank entry (two problems and the worked problem), the lead line, the Tour steps, the reward models, the story animation and painter, the `SOLUTIONS` and `MISSES` scripts, the `verify` entries, and its site in the world (or its own room, as Kettle's bench has, if you have not yet laid the ground). Then:

- Run `verify:learn`, `verify:table`, `verify:story`, `verify:docs` and `verify:bench`. All green.
- **Play every stage of it by hand** (Phase 5 describes how). Fix everything you find.
- Reread your spec and the pitfall ledger against what you learned. Amend the spec and fix the pattern **before** copying it seven times. Defects found here are cheap; the same defect in seven benches is not.

## Phase 3. The remaining benches

Build them in teaching order. After **each** bench: its checks green, every stage played by hand, a commit. Do not batch. If a bench's idea needs a piece the kit lacks, extend the kit with an opt-in option, never a global change. After any change to shared engine, kit or verify code, run **all** world scripts (`verify:tallow`, `verify:lanternfall`, `verify:ligar`, `verify:bellows`, `verify:ember`, and yours) and `verify:bench`.

You may delegate independent benches to subagents once the vertical slice is green and the kit is stable, but you own integration: you play and sign off every stage yourself.

## Phase 4. The boss, and the world

- **Boss:** five phases that re-test earlier benches' ideas on a new case, never introducing a concept. One foe from the instrument's own planner, mapped one-to-one onto the stage's samples. Encounter per phase, no lead line, answer slot clear of the foe's corner, the miss reason on screen before the foe answers, the finale and arena (`boss-arena.js`, `boss-models.js`, `story-scenes-finales.js`).
- **The walkable world:** generate the layout with `tools/gen-{world}-layout.mjs` into `src/three/world-data/`, write the host builders, terrain, atmosphere and textures, register the world (`worlds3d.js`, voyage, stage), and write `tools/verify-{world}.mjs` (modelled on `verify-ember.mjs`): overlap, buried bodies, walkability flood fill, lamps-only-lit, bay clearance. Add it to `package.json`'s verify chain. Every bench is checked from the lean-in view.
- **Player-facing lists:** Field Manual, galaxy map, commendations, requisitions, saga, learn styles. The facts line and the counts in `PRODUCT.md`, the stage counts in each chart and each `meta`, the stage indices in `tools/verify-learn.mjs`, `NOTES` and `LEAKS` keys: all agree (`verify:docs` holds the first two).

## Phase 5. Whole-world audit by hand (this is the step that removes the weeks)

Play **every stage of every bench and the boss**, in order, as a first-time student who does not know the answer, with real gestures (drag, click then click, dials, typed answers, Submit), never only `window.__R.act`. Set-up is in `PRODUCT.md` section 6: dev server on a free port, Continue as Guest, unlock the world's quests with `session.markLearnQuestComplete`, deep-link then reload, `__LQ_TEST__` runner and `loadStage(i)`. Then:

For **every** stage, record in `docs/{world}-audit.md` (per-stage table, one line of evidence each): Operable, Intuitive, Busywork, Builds intuition, Accurate, AP topic, and the evidence label (Played, Viewed, Scripted, Bench, Code). A stage you did not play by hand is labelled so. Check on each:

1. **It renders and reads at the default camera.** No black bench, no overlap, no clipped or tiny text (zoom into every label, plate and plot), no readout hidden under a knob, a post, a rim, a bezel or glass. The console is clean.
2. **A real hand can finish it.** Every drag has a two-tap twin; a tool dropped on a card joins; a missed grab does not throw the camera; a drop beside a slot does not strand a piece; dials set where the pointer ends (within one step); a control that reacts late is not double-clicked back.
3. **The answer is not given.** Read every plate, header, readout, tray name, caption, prompt, hint, refusal and reward against the stage's answer. Does anything print the answer, the capacity, the rule or the reasoning? Can the stage be passed by looking at the table, by matching a printed fact to a tray, by hunting a dial, by copying a number, or by a 50 % guess? If yes, rebuild the stage around an experiment.
4. **Wrong answers speak.** Make each plausible mistake and read the refusal: it names what the table shows, not the reasoning.
5. **Operating help is on the object.** A first-time player can tell what each tool does from its caption and the Tour, without opening a hint.
6. **The words are earned.** No term appears before the card that defines it; no code words.
7. **One decision per stage.** If it feels crowded, remove something.

Also check, once per bench: `3D Off` draws the same picture; the viewport at 375 px wide landscape (`resize_window`) still lets the stage be operated and read; the reward model (if any) is honest and shows the idea; the story animation's every number is counted from the drawn thing.

Then do a **second full pass** over every stage you changed (new stages count) and over the whole boss. Repeat until a pass finds nothing blocking or major, or until you have done three passes. Log anything left, with why.

## Phase 6. Close out

- Run, each as its own script: `verify:learn`, `verify:table`, `verify:story`, `verify:docs`, `verify:drills`, `verify:sync`, `verify:run`, `verify:bench`, `verify:arena`, `verify:voyage`, `verify:tallow`, `verify:lanternfall`, `verify:ligar`, `verify:bellows`, `verify:ember`, and `verify:{world}`. All green, or each failure logged with why it is not yours.
- Update `PRODUCT.md` (the facts line and the counts sentence, the Learn track and worlds sentence, the walkable-worlds sentence, the story-animation count in principle 22, and the status table in section 8 with this world's open items), `CLAUDE.md` (counts and any new mechanism or trap, kept short; long notes go in `docs/engineering/engine-and-worlds.md`), `docs/AP-coverage-audit.md` (topics now covered), and `docs/plans/learn-quests.md` (checkboxes, and a "built differently" note wherever the build parted from the brief).
- Add to `PRODUCT.md` section 5 any **new** pitfall this world taught that is not yet there, as a row. This is how the next world gets cheaper.
- Write `docs/plans/{world}-world.md` as the build record (what was built, where it differs from the spec, and why).

# Rules you must not break

(The full list is `PRODUCT.md` and `CLAUDE.md`. These are the ones that were broken most.)

- The Learn track pays no XP, writes no progress to the server and never reaches Standings. Nothing in `src/learn/` may call `session.addXp`, `api.gradeStage`, `api.completeQuest` or `session.recordProgress`.
- Prompt: one sentence, at most 25 words, no "!", objective not route. Hints: exactly three, one sentence each (control, what to look at, method; never the answer or the arithmetic). Reward: 1 to 3 sentences, about 45 words, real terms. Lead line: at most 20 words, one per bench at least, none on a boss.
- A prediction only on the click and on a new case; the predict stage shows no instrument; the next stage quotes the locked guess. A prediction offers the model students actually hold.
- Discover it, never read it off. Compare two or more readings. No sort of printed facts. No hunting a dial. No plug-and-chug with the answer's constants all printed. Typed worked figures need a picture behind them and are asked past the dial's range.
- Plain labels until the word is earned, then the real term; never a code word. `VOCABULARY`, `BUILDS_ON`, `WITHHELD_VOCAB`.
- Every drag has a two-tap twin. Snaps are physics, never a gatekeeper. Undo and Start Over work. Nothing blocks a correct answer.
- Every tool and fixture and kind of piece has a Tour step in earned words.
- Flat things are drawn flat; spatial things are 3D objects; the picture is honest (what is drawn is what is graded) and `3D Off` draws the same.
- SCOURED PLATE aesthetic: filament not LED, no glow, no emoji, no rounded corners, amber is a signal. No text that advertises the interface.
- Questions live in the bank (two per bench after the debrief, an optional worked problem, an end set); ids never reused; quests export no `PRACTICE`.
- Every quest ends on Vess's story animation (3 to 5 beats, a `Filed:` line, every number counted from the drawn thing).
- Nothing occupies the same space as anything else (`verify:table` and the world script measure it).
- Chemistry accuracy over everything: a simplification is fine, a falsehood is not.

# Pitfalls that cost the most (details and the full list: `PRODUCT.md` section 5)

- A plate, header, readout or refusal that prints the answer, the capacity or the reasoning. `verify:learn` only searches for the answer string.
- A tool that cannot join (`nojoin` card), a missed grab that moves the camera, a drop beside a slot that strands a piece, a dial that stops a step short, a tool that is invisible once placed. `verify:table` replays scripted actions and cannot see any of these.
- `c.label(text, w, h)` takes **metres**. An opaque slab or bezel over a painted display. Glass bodies over printed text. Lining plates over painted contents. Painted words under knobs, rail posts, rims and cards.
- Mono-face "O" reads as "0"; the font has no superscript minus.
- Option objects silently drop keys they do not list. Check an option reached the drawing.
- Stage counts live in five places; inserting a stage shifts indices, `NOTES` keys and 1-based `LEAKS` keys. Update them all.
- A shared-engine change that is not opt-in will break another world's layout. Run every world's script after one.
- The scripted solution passes while a hand fails. Green checks are necessary, never sufficient.

# Definition of done

You are done only when **all** hold, and your final report says which you verified and how:

1. Every check in Phase 6 is green (or each failure is logged with why it is not yours).
2. Every stage of every bench and the boss was played by hand with real gestures at least once, and every stage changed after that was played again. The audit file says, per stage, what was played and what was not.
3. Every row of `PRODUCT.md` section 5 was reviewed against this world (in the spec) and re-checked in play.
4. `3D Off` and a 375 px landscape viewport were checked on at least one stage of every bench.
5. The docs and counts are updated, new pitfalls are added to the ledger, and the build record is written.
6. Everything is committed on `world/{unit}`, nothing is pushed, and the tree holds no file of yours that is uncommitted.

# Final report

Reply with: what you built (benches, stage counts, kit, boss, the world site); the CED topics covered and any gaps with why; what you changed in shared code; every check and its result; what you played and what you did not; the defects you found and fixed along the way (so the ledger can learn from them); what is still weak; and **the short list of stages only the owner can judge by playing** (confusion, pacing, phone legibility, whether the typed figures suit a 12-year-old).

If something blocks you (a sign-in fails, a bench crashes, a gesture cannot be made to work), log it in the audit and move on rather than stalling.
