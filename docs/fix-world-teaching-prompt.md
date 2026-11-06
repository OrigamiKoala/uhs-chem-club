# Prompt: fix the teaching of one Learn world

Fill in the two values below, then give this whole file to an agent.

- **WORLD** = `<name>` (for example Bellows)
- **UNIT** = `<unitNN>` (for example `unit04`)

Do the whole job in one autonomous run. Do not stop between tasks to ask what is next. Ask only when something here conflicts with `PRODUCT.md`, or when a decision is genuinely the owner's (for example cutting a stage whose idea nothing else teaches). Do not browser-play the world: the owner play-tests (`CLAUDE.md`, "Testing"). You may write Node or Playwright scripts to check what you build.

Please make it so the graded answer is the student’s interaction with the particles, rather than a dial or a card (except for where necessary, like prediction stages). Also, make the tour animated and shrink the tour text to an absolute minimum. Also, make sure misses replay the cause.

## 0. What you are fixing, and who for

Read `docs/general-problems.md` first, all of it. It lists twelve teaching problems found across the Learn worlds. Your job is to remove every one of them from WORLD, stage by stage. The audience is students aged 12 to 17 who are meeting the topic for the first time. They are not the owner, who already knows the chemistry.

The three problems the owner cares about most:

1. **Straight language.** Say "pressure", not "push". Say "volume", not "room". Name the real quantity, the real instrument and the real chemistry term the first time it appears, with a short gloss, and then use only that word.
2. **Nothing assumed.** If a stage needs a fact, a term, a piece of maths or a way to read an instrument, the bench teaches it first, in the world, in plain steps.
3. **Everything moves. This is the largest part of the job.** Replace ALL static benches in WORLD with dynamic visualization interactives, except where a static bench is absolutely necessary (section 4.3a). Each bench is a live model of the chemistry that the student acts on directly and that responds in time. A plate of cards, dials, tiles and numbers is not acceptable as the experiment. Expect most of your effort, and most of the new code, to go here.

**The bar, in one example.** The owner pointed at Brinewire `q1-halves` stage 3 ("Writing the Halves": two text cards and four electron dials, solved by turning dials until the printed charge numbers match) as the kind of bench that must not exist. Read the "Worked example" in `docs/general-problems.md` and make every bench in WORLD clearly better than that: if a stage could be solved by turning dials until two numbers match, with no picture of the atoms, ions or electrons involved, it must be rebuilt around a moving model of the event.

## 3D first (added 2026-11-06)

Build every mechanism view as a **3D visualization** wherever possible, and a 2D painter only as the `3D Off` / reduced-motion twin of the same pure model. Particles, ions, electrons, strips, vessels and wires are solid objects in space. Gravity does not matter: things may hover in the air, clouds of ions may float, electrons may stream along a wire in mid-air; clarity of the mechanism beats realism of support. Flat drawings stay only for things that are flat by nature (graphs, spectra, printed tables). The checks in section 7 apply to both forms: the 3D dress must tick with `dt`, respond to the controls, and stay inside the particle budget.

## 1. Read before you touch anything

In this order, reading large files in chunks and only what you need:

1. `docs/general-problems.md` (the problems and the new standard).
2. `CLAUDE.md` and `PRODUCT.md`, especially "Building a Learn world" and the pitfall ledger. Note where they conflict with the new standard (section 2 below says how to resolve it).
3. `docs/original-prompt.md` (the earlier audit process and traps).
4. `docs/feedback.md` and `docs/feedback-11-01.md` (the owner's own words on what is wrong).
5. WORLD's quest files `src/learn/quests/UNIT/*.js`, its kit under `src/learn/table/kits/`, its engine data and props under `src/learn/engine/`, its question bank `src/learn/bank/<worldId>.json`, its story scenes `src/ui/story-scenes-<world>*.js`, `src/learn/table/tour*.js`, and its existing audit under `docs/` or `docs/archive/`.
6. `tools/verify-learn.mjs` (`WITHHELD_VOCAB`, `VOCABULARY` handling), `tools/verify-table.mjs`, and the check files for WORLD.

## 2. Change the rules first

The current doctrine caused part of the problem, so fix the doctrine and the checks before the content.

1. In `CLAUDE.md`, replace the bullet "Plain labels until the word is earned, then the real term. Never a code word." with the new standard: **say the real term the first time it is needed, with a one-clause gloss; afterwards use only the real term.** Only answers stay hidden, never names of quantities, instruments or concepts. Update the "Never give away answers" bullet and the `PRODUCT.md` text that repeats the old rule so none contradicts it.
2. In `tools/verify-learn.mjs`, change `WITHHELD_VOCAB` so it only withholds words that **are the answer** to a stage (for example the name of the element in a "find the element" stage). Remove entries that only withhold a quantity or concept name (such as `pressure`, `kPa`, `Boyle's law`, `atoms`, `nucleus`, `protons`, `bond`, `lone pair`). Keep the `VOCABULARY` card promise, but change it to "the term is defined, with a gloss, on the first stage that uses it".
3. Add new checks (section 7). Do not weaken any existing XP, no-leak, overlap or geometry check.
4. Do not delete retired code or docs. Archive them under `archive/<date>/` or `docs/archive/<date>/` with a README (`CLAUDE.md`, "Retire by archiving").

If another world's quests fail the changed `verify:learn` rule, loosen the rule for that world only (keep its own entry) and record it in the deliverable. You are fixing WORLD, not the others.

## 3. Audit every stage of WORLD

First list every bench whose only interaction is dials, cards or tiles over a text or number readout (look for `ledgerFixture`, `selectorFixture`, dial fixtures and tile rigs with no mechanism view). Each of these is rebuilt, not patched. Then make a table with one row per stage, in `docs/teaching-pass/WORLD.md` (create the folder). Columns:

| Stage | Static or dynamic now | Prompt as written | Terms used before defined | Euphemisms and metaphor names | Maths or prior knowledge assumed | What moves on the bench | What the student actually sees | Fix |

For each stage, answer these questions from the source, not from memory:

1. **Words.** List every noun in the prompt, briefing, hints, misses, reward, captions, tool names and Tour steps. For each one, mark whether it is (a) a real chemistry or lab term, (b) a euphemism or synonym of a real term (push, knock, room, squeeze, gauge for pressure gauge), or (c) a fiction name (pan, pot, rig, crate, tray, slate, chip, tile, drum, well, holder). Every (b) and (c) is a defect unless the stage is a boss or a story line.
2. **First use.** Is every real term defined, in one clause, where it first appears in this world? Is it defined again if the player could open the world cold?
3. **Prerequisites.** What does the stage need the student to know or do? Facts from earlier worlds, maths (ratios, powers of ten, logs, unit conversion, reading a graph, slopes, solving for one unknown), notation (subscripts, charges, state symbols, equations), how to read the instrument. Mark which of these the world has taught before this stage.
4. **Mechanism.** What is the particle, ion, bond, electron, energy or force event behind the number the student reads? Is it drawn, in time, on the bench, driven by the controls? If not, the stage fails.
5. **Answer type.** Is the student working something out from what they see, or reading a number and typing it, or matching cards? Prefer the first.
6. **Prediction.** If it is a predict stage: could a student with no model of the topic make a reasoned guess? Is there a short demonstration first?
7. **Hints and misses.** Does each rung help a student who does not know a term? Does a miss replay the cause in the model?
8. **Load.** One decision, only the pieces that decision needs, prompt at most 25 words, reward one or two short sentences.

Finish the audit before you fix anything, then fix in the order of section 4. Keep the audit file updated as stages change; at the end its "Fix" column becomes a "Done" column.

## 4. The fixes

Do 4.3a and 4.3 (rebuilding static benches as dynamic interactives) first and give them most of your effort; 4.1, 4.2, 4.4 and 4.5 are then applied to the rebuilt stages, because the new models change the prompts, hints, captions and rewards. Do not polish the words of a stage you are about to replace.

### 4.1 Language

- Replace every (b) and (c) from the audit.
  - Quantities: **pressure, volume, temperature, concentration, amount (moles), mass, energy, heat, rate**, never "push", "knock", "room", "squeeze", "size", "strength", "level" for a measured quantity.
  - Instruments: name the real instrument or a plain description of its job ("pressure gauge", "gas cylinder with a piston", "thermometer", "balance", "reaction vessel", "burette", "voltmeter"). Remove "pan", "pot", "rig", "holder", "drum", "crate", "tray", "slate" as names of things the student must operate or reason about. Pieces that really are cards or tokens may be called cards or tokens.
  - Fiction names stay only for bosses, the saga, the Case File and Vess's lines.
- Keep a **glossary** for WORLD in one file (`src/learn/glossary/WORLD.js`, or the equivalent if one already exists). One term per concept, a one-clause gloss, the stage where it is first used. Make it reachable from the bench frame (a Glossary key beside the Tour key) and from the Learn screen. Prompts, hints, misses, rewards, captions, the Tour and the question bank use these terms and no others.
- Rename the fiction objects in code (labels, plaques, captions, `NOTES`, `TOOL_TEXT`, Tour steps, bank items, saga text) and keep internal ids as they are unless a rename is cheap and safe.
- Write every prompt as one plain question or instruction that states the objective, never the route. Do not tell the student which move solves the stage. Do not hide the name of the thing being measured.

### 4.2 Nothing assumed

- For each prerequisite the audit found, either teach it on the bench just before the first stage that needs it, or remove the need.
  - **Maths:** add a small hands-on step, not a lecture. For logarithms: a scale the student can slide, powers of ten on one side and the log on the other. For scientific notation: a number line that zooms. For ratios and proportion: two bars that scale together. For slope: a line drawn through points the student placed, with the rise and run drawn on it. For unit conversion: a ladder of units the student climbs. Each is a short interactive stage or a pre-stage panel, uses the world's own data, and records mastery by id in the bank the way worked problems do.
  - **Earlier worlds:** if WORLD uses moles, ions, valence, electronegativity, equilibrium or anything else from another world, give a short recap card with a small animation at the first stage that uses it. Do not rely on `BUILDS_ON`. Keep `BUILDS_ON` accurate, and have the recap name which world it is from.
  - **Notation:** the first time a formula, charge, subscript, state symbol or equation form appears, show what each part means on a labelled example.
  - **Instruments:** the first time a student meets an instrument, its Tour step (or a short animated demo) shows it being used and read. The Tour must not be the only explanation. A tool that is not self-evident from its name and looks is a defect.
- Remove content that is beyond the exam or the audience unless the owner wants it. For anything cut, archive it (section 2.4).
- Re-check stage order. An idea must come after the idea it needs. If it does not, move the stage, or split the stage so the prerequisite comes first.

### 4.3a The default is to replace every static bench

**Rule: every stage's bench is rebuilt as a dynamic visualization interactive unless it passes the exception test below.** Do not patch a static bench with an animation on the side; change what the student *does* so that they act on the particles, ions, bonds, electrons, orbitals or energy directly (drag an electron, add a reagent to a beaker, push a piston, join two atoms, hold a probe in a solution, tilt a flask), and the numbers, charges and equations follow from what they did.

What counts as static (replace it): a bench whose interaction is dials, sliders, stepper knobs, cards, tiles, tokens, selectors or a typed field, over a text, table, ledger, graph or number readout, where the picture does not change in time because of what the student did. Typical forms: `ledgerFixture` and counting cards, `selectorFixture` answer dials, tile rigs, "set the dial to the number", sort-the-cards stages whose cards are only text and labels, a graph that only redraws.

How to convert, by stage kind:

| Static form | Dynamic form |
|---|---|
| Balance a printed count with dials | Drag or tap the actual electrons, atoms or ions; counters live on the particles; the equation writes itself from the scene |
| Sort cards by a property | Drop each sample into a field, beam, bath, flame, magnet or heater and watch what it does; sort by what was seen |
| Read a number off a meter and type it | The meter is attached to a moving model (gas, solution, cell, flask) the student changes; the reading follows from it; the student reasons from the motion, then types |
| Set a dial to an answer | Make the system reach the answer state (heat until it boils, add titrant until the colour changes, bring atoms together until they bond) |
| Rank or order items | Run each case in a shared model side by side (race, bath, scale), rank by what happened |
| Pick a statement | Run the experiment that decides it, then pick; or build the thing the statement describes |
| Match a formula, equation or name | Assemble it from particles that move together; the formula is printed from the assembly |
| Graph that only redraws | The graph is traced live by the model the student is running, with a moving point and the matching particle view next to it |

**Exception test.** A stage may stay static only if ALL of these hold:

1. The idea is purely symbolic or archival and nothing physical happens (for example reading a printed periodic-table trend, an unbuildable data reading, a formula-to-name convention).
2. Every moving version you can think of would add no understanding, only decoration, and you wrote down why.
3. The stage is short (one decision) and sits between two dynamic stages, never two static stages in a row.
4. The static form is a flat picture drawn honestly (`CLAUDE.md`: flat things are drawn flat), not a dial over a number.

Static stages are the exception, so: **at most one in six stages of a bench may be static, and no bench may be wholly static.** Each exception is listed in the audit with the reason and in the "Only the owner can judge these" section. If you are unsure, it is not an exception: rebuild it.

Order of work: rebuild the benches before polishing the language, because the new models change the prompts, hints, captions and rewards. Do the highest-value and most-static benches first (those that are only dials and numbers), and keep a running tally in `docs/teaching-pass/WORLD.md` of: stages total, stages converted to dynamic, stages kept static (with reasons).

### 4.3 Everything moves

Every instrument in WORLD must have a **mechanism view**: a model of what is happening underneath the reading, running in time and driven by the controls and the table state.

Hard rules:

1. **Responds to the controls.** Changing a dial, moving a piston, adding a reagent, applying heat or switching a circuit changes the model within a frame or two, and the model settles into steady motion afterwards. If the model stops when the controls stop, it is a diagram, not a model.
2. **Shows the particles, ions, bonds, electrons or energy.** Gas: particles and wall collisions with a count. Solutions: solvent, ions and molecules, with colour and shape that match the species. Reactions: bonds break and form and atoms move; the count of each atom is visible. Equilibrium: forward and reverse events continue after the graph goes flat. Electrochemistry: electrons travel through the wire; ions through the salt bridge; the electrode changes mass. Thermochemistry: energy moves between objects and bond energies show as stretch. Bonding and structure: orbitals overlap, atoms vibrate, shapes form by domains pushing apart.
3. **What is drawn is what is graded.** Counts, speeds, positions and ratios come from the same planner functions that grade the stage, so the picture is honest (`CLAUDE.md`: "the picture is honest").
4. **Spatial things are 3D, flat things are 2D**, and both move (3D is the default; see "3D first"). `3D Off` draws the same model flat and still moves, unless `prefers-reduced-motion` is set, in which case show the final state with a visible step control.
5. **Motion has a purpose.** Remove spinning idle models. Every moving element means something the stage's reward card names.
6. **Hit the performance budget.** Particle counts and per-frame work are bounded (use the shared helpers in `src/learn/engine/gas-particles.js` and `src/learn/engine/atom3d.js` as the model; keep to one `requestAnimationFrame` per table via the existing frame loop in `table3d.js` and `table2d.js`, not one per piece). `verify:bench` or a new frame-cost check must pass.
7. **Do not turn a prediction or measurement into a giveaway.** The mechanism shows the cause, not the answer. For a sorting or reading stage, the student still has to make the comparison.

Per stage, the audit's "What moves" column must read as a concrete description (what moves, what it responds to, what it means) before you mark the stage done. "A needle moves" is not enough where there is a mechanism underneath.

Minimum set of animation work for WORLD:

- A mechanism view on every instrument of every bench.
- A "see it first" lead-in (three to eight seconds, no controls) before every predict stage, so the student has a picture to guess from.
- A transition animation whenever the student commits an answer, replaying the cause: the miss shows what happened to the particles, ions or bonds, then the message says it in words.
- The reward model (`reward.model`) on every stage whose idea is spatial or dynamic (not only the one in ten that has one today), and no spinning models.
- Put the animation first in the Tour step for each instrument: a short loop showing the tool being used.

Reuse what exists before writing new code: `src/ui/model-viewer.js`, `orbital-3d-viewer.js`, `shielding-explainer.js`, `cuvette-explainer.js`, `ionic-radius-animator.js`, `slice-explainer.js`, `photoelectric-explainer.js`, the story painters over `src/ui/story-kit.js` and `story-sim.js`, `engine/gas-particles.js`, `engine/atom3d.js`, `engine/ligar-materials-3d.js`, `engine/orbital-props.js`. New painters and 3D props follow `story-sim.js` and `table-props.js`.

### 4.4 Teach in steps

For every idea, the order of the stages should be:

1. **See it:** the model moves; the student changes a control and watches.
2. **Name it:** the real term, with a gloss, while it is on screen.
3. **Use it:** a stage where the student works the idea on a new case.
4. **Calculate with it:** a worked step first (the bank's `worked` format, but placed inline before the first typed-number stage, not only at the end), then the typed stage.

Concretely:

- Predict stages: lead-in demonstration, real terms, no blank submits, never graded (as now).
- Reward cards: one or two short sentences, the real term, the one new fact. Put derivations, extra figures and worked arithmetic in the model's caption or the worked problem, not in the card.
- Hints: rung 1 names the control, rung 2 says what to look at, rung 3 gives the method; every rung uses only glossary terms. Add a "What is this?" action on the hint panel that opens the glossary entry for the stage's key term.
- Misses: the reason, the replayed cause in the model, never the answer.
- Typed-number stages: allow the student to see the working. Provide a calculator-free path (give numbers that work with simple arithmetic where the idea is not the arithmetic).
- Worked problems and practice stay skippable and free of XP; they must now use the glossary terms and, where the bank's problem is about a mechanism, show it in a mechanism view as well.

### 4.5 Load

- Remove text that does not help the student: features advertised, narration that restates the lesson, long captions. Keep the story, but move it out of the way: story lines are at most one short lead line, and Vess's debrief stays as is unless its words use euphemisms or unearned terms (then fix those).
- One decision per stage (`CLAUDE.md`). If the audit finds a stage that stacks decisions, cut it or split it.
- Prompts: one sentence, at most 25 words, no setting clause, no "!".

## 5. Stage and bench changes

You may add, merge, split, move or cut stages when the audit shows a need. When you do:

- Keep stage ids unique and never reuse a retired id (bank mastery is stored by id).
- Update `meta.stageCount`, `VOCABULARY.introducedAt`, any hard-coded stage indices in `tools/verify-learn.mjs`, `NOTES` keys, the quest header comment, the world chart in `src/learn/worlds/UNIT-*.js`, the counts in `PRODUCT.md` and `CLAUDE.md`, and `docs/engineering/engine-and-worlds.md`.
- A new bench needs a site in the world's layout generator (`tools/gen-<world>-layout.mjs`) and the world's JSON; `verify:<world>` checks overlap and walkability. Prefer stages on existing benches.
- Boss phases only re-test earlier ideas on new cases (`PRODUCT.md`). After changing a bench, re-check that each boss phase still tests an idea that is taught and still works.
- Anything cut goes to `archive/` with a README.

## 6. Hard rules to keep (do not break these while fixing)

- The Learn track pays no XP and never reaches the leaderboard (`session.addXp`, `api.gradeStage`, `api.completeQuest`, `session.recordProgress` are never called from `src/learn/`).
- Never give the answer. Which move solves a stage is never stated by the prompt, briefing, hints, miss messages or captions, and misses may not contain the stage's answer (`verify:learn` searches for it).
- Every drag has a two-tap twin. Snaps never reject a move. Ordering is dragging onto a rail.
- Nothing occupies the same space as anything else (`tools/lib/overlap.mjs`).
- SCOURED PLATE aesthetic and copy discipline (`CLAUDE.md`). Mechanism views follow the same plate and glass rules; no neon, no bloom, no emoji.
- Phone-size floor of 375 px for screens outside benches; benches and worlds may require landscape.
- Reduced motion and `3D Off` still work.
- Do not touch other worlds' content except for shared code that you must change for WORLD, and then re-run the other worlds' checks.

## 7. New checks to add

Add these to `tools/` (a new `tools/verify-teaching.mjs` wired into `npm run verify`, or additions to `verify-learn.mjs`), scoped per world so other worlds can adopt them later:

1. **Banned vague words.** A per-world list (for Bellows: `push`, `pushes`, `knocks`, `knock`, `room` used as volume, `squeeze` as a noun for compression, and so on) must not appear in prompts, hints, misses, rewards, captions, Tour steps or bank items for WORLD. Include a short allow-list for the story files.
2. **Banned fiction nouns.** `pan`, `pot`, `rig`, `crate`, `slate`, `drum`, `holder` and similar as labels of operable objects in WORLD's table fixtures and pieces. (Check labels, not code identifiers.)
3. **Define on first use.** Every term in WORLD's glossary appears with its gloss at its first stage; no glossary term is used earlier than its first stage; no term outside the glossary and the shared vocabulary appears in prompts or rewards.
4. **One word per concept.** No two glossary-listed synonyms appear in WORLD's text.
5. **Prerequisite map.** Each stage lists `needs: [...]` (maths skills, notation, recaps) and each need is provided by an earlier stage or panel of the same world. The check fails on a need with no provider.
6. **Mechanism present.** Each instrument kind used in WORLD declares a mechanism view (`mechanism: true` on its fixture or `piece3d`/`dress3d` with an `update(f, state, dt)` that uses `dt`), and a Node check steps it for a few hundred frames under two different control settings and fails if the two runs are identical or the model does not change when the control does.
7. **Frame cost.** The mechanism view's per-frame cost on a mid-range budget (use the existing bench-timing helpers, or a particle-count cap) stays under the limit.
8. **Predict lead-in.** Each predict stage has a lead-in clip.
9. **Static ratio.** Classify each stage's fixture kinds as dynamic (has a mechanism view that responds to the controls) or static. Fail when a bench is wholly static or more than one stage in six is static, unless the stage is on an explicit exceptions file with a written reason.
10. **Reading load.** Prompt at most 25 words; reward at most 2 sentences and 40 words (exceptions listed in an explicit file); hints one sentence each.

Run `npm run verify`, fix whatever it finds, and run it again. Report any pre-existing failures separately from failures you introduced.

## 8. Question bank and worked problems

Apply sections 4.1 to 4.4 to `src/learn/bank/<worldId>.json`. Terms, units, names for the quantities and instruments must match the glossary. Number steps keep their `calc` expressions (`verify:learn` recomputes them). Ids are never reused.

## 9. Verification (no browser-play)

- `npm run verify` and the world's own check (`verify:<world>`).
- `npm run build` (`dist/` is wiped by the build, so copy anything non-build out of `dist/` first, per the memory note).
- Node scripts that mount each of WORLD's quests, run every stage with the scripted solution, and step each mechanism view for a few hundred frames.
- A Node check that scans WORLD's visible strings against the banned-word lists and the glossary.
- You may write a Playwright script to screenshot a few benches for your own inspection; use guest mode (`session.startGuest()`, or `#landing-guest-btn`) to pass the login screen. Do not treat any browser check as a gate or a definition of done.

## 10. Deliverables

1. The fixed WORLD (quests, kits, engine, bank, tour, story words) and the changes to the rules and checks.
2. `docs/teaching-pass/WORLD.md`: the full per-stage audit table (before and after), the list of added or cut stages, the glossary, and every decision you made that the owner might want to reverse.
3. The tally in `docs/teaching-pass/WORLD.md`: stages total, converted to dynamic, kept static with the reason for each.
4. A short section at the end of that file: **"Only the owner can judge these"**: the stages where you believe a first-time student could still get lost, or where an animation needs a human eye for pacing and feel. Order it by how likely a student is to get stuck.
5. Updated `CLAUDE.md` and `PRODUCT.md` (counts, the new language rule, the glossary, the mechanism-view rule) and `docs/engineering/engine-and-worlds.md` (what was built).
6. Append to `docs/general-problems.md` a dated "Lessons from WORLD" section with any problem you found that the general list missed, and any rule from section 6 that proved hard to keep.
7. Commit nothing unless asked.
