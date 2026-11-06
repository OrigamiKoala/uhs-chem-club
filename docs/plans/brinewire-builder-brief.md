# Brinewire: builder brief (read this first if you are building one bench or the world)

You are one of several builders working in ONE git tree (`~/chem-3d`, branch `world/unit10`) on Avalon's world 10, Brinewire (electrochemistry). The integrator owns commits, shared docs and the browser. **You never run `git add`, `git commit`, `git stash`, `git checkout` or `git reset`, never run `npm run verify` (it wipes `dist/`), never run `npm run build`, and never use a browser or the preview tools.** Verify with the individual scripts below and Node.

## Read, in this order

1. `docs/plans/brinewire-world.md`: the spec. Your bench's stage table (section 3), section 4 (kit plan, planners), section 6 (pitfall review) are your contract. Where your build parts from it, say so in your notes file.
2. `PRODUCT.md` section 3 (bench module), 4 (stage design, the quantity ramp, anti-patterns), 5 (the pitfall ledger: every row is a defect that was built once). `CLAUDE.md` teaching doctrine.
3. **The finished vertical slice is your template. Copy its patterns file by file**:
   - quest: `src/learn/quests/unit10/q4-potential.js` (STAGES, SOLUTIONS, MISSES, VOCABULARY, predict pair, typed stages with slip refusals that name a reading, `rigRead`/`boardRead` use in `check`)
   - kit: `src/learn/table/kits/cell.js` (kit shell, `cellTable`), `cell-registry.js`, `cell-read.js`, `cell-board.js` (fixture + piece + `settle` memory + `dress3d` + `piece3d`), `cell-rig.js` (a fixture with a Run key, hidden dials, a log), `cell-board-tour.js` / `cell-rig-tour.js` (Tour words)
   - planners: `src/learn/engine/celldata.js` (pure; read it, reuse it) and its independent checks `tools/lib/brinewire-data-checks.mjs`
   - checks: `tools/lib/brinewire-q4-checks.mjs` (hand-worked values at the top, then slips, refusals, story numbers)
   - story: `src/ui/story-scenes-brinewire.js` (painter `cell-gap`), the `unit10/q4-potential` block in `src/story/quest-story.js`, lead line in `src/learn/engine/stage-story.js`
   - bank: `src/learn/bank/unit10/q4-potential.json`
   - Verdigris's equivalents (`unit09/q3-weak.js`, `ph-*.js`, `verdigris-q*-checks.mjs`) show more instrument patterns (a plot painted to the reached tick: `ph-curve.js`; a burette Run key: `ph-burette.js`; a rail rank; trays; `selectorFixture` verdicts).
4. Skim `docs/plans/verdigris-world.md` section 6 and `docs/verdigris-audit.md` for what went wrong last time.

## What you deliver (all of it, for your bench)

- `src/learn/quests/unit10/<quest>.js`: 8 stages (the boss 5) per the spec table. Prompt one sentence, at most 25 words, no "!"; exactly three hints (control, what to look at, method; one sentence each; never the answer or the arithmetic); reward 1 to 3 sentences, about 45 words, naming the idea in real terms; `VOCABULARY` (term to the 1-based stage whose reward card defines it); `BUILDS_ON` (only real built quests, e.g. `unit10/q4-potential`, and only if you use their words); `SOLUTIONS` and `MISSES` (scripts replayed through the real action path); `meta.stageCount`; `DEBRIEF`; `mount`; `stateFor`; `CHECKS`. No `PRACTICE`; no `session.addXp`, `api.gradeStage`, `api.completeQuest`, `session.recordProgress`.
- Your instruments in NEW files `src/learn/table/kits/cell-<name>.js` + `cell-<name>-tour.js` (every new kind of piece, tool or fixture needs a Tour step in earned words). Import them in your quest **directly from the file** (not through `cell.js`). The only edit to `cell.js` is ONE line: `import './cell-<name>.js';` added after the line `import './cell-rig.js';` (re-read the file afterwards: another builder may have added a line there at the same time; both lines must be present). Prefix every fixture and piece kind with `cell` and the bench (`celldip`, not `dip`). Kinds you register must not collide with existing ones (`grep -rn "registerFixture('" src/learn/table/kits/cell-*.js`).
- Planners you need that `celldata.js` lacks go in a NEW pure file `src/learn/engine/celldata-<quest>.js` (import `celldata.js`; do not edit it). Each is checked in your checks file against values worked by an independent route (paper, or Python: never the code under test).
- Story animation: a painter in NEW `src/ui/story-scenes-brinewire-<quest>.js` (3 to 5 beats of Vess, at most 2 sentences and 36 words each, then a `Filed:` line; every number on screen counted or measured from what is drawn; 960-wide plate, `(ctx, w, h, t)`); register it with two lines in `src/ui/story-scenes.js` (an `import` line after `import { BRINEWIRE_SCENES } ...` and a `...legacy(...)` line after `...legacy(BRINEWIRE_SCENES),`); add the quest's block to `src/story/quest-story.js` (insert it just above the `'unit10/q4-potential': {` line, `to` values rising to about 0.94; a beat ends at `t = to`, so the painter switches scene on `t <= to`); the lead line (at most 20 words, stage 1, never the boss, never stating the click) in `stage-story.js` above `'q4-potential': {`.
- Bank: `src/learn/bank/unit10/<quest>.json` = `{ "problems": [two problems, ids "<quest>#b1","<quest>#b2"], "worked": {... id "<quest>#w", 4 to 8 steps, number steps carry a `calc` expression} }` (the boss has none). Then add ONE import line after `import b10q4 ...` in `src/learn/bank.js` and one entry in the `bench: { ... }` object on the next line.
- Chart: flip your quest's line in `src/learn/worlds/unit10-electrochemistry.js` (`status: 'live'`, `module: () => import(...)`, a one-line descriptor from the spec's story table; descriptors are factual and plain). Edit only your own line.
- Checks: `tools/lib/brinewire-<quest>-checks.mjs` exporting `checkBrinewire<Q>({ ok, fail })` (model: `brinewire-q4-checks.mjs`), and in `tools/verify-learn.mjs` (a) a `WITHHELD_VOCAB` line for your quest after the `'unit10/q4-potential':` line and (b) the import+call after `await checkBrinewireQ4({ ok, fail });` inside the Brinewire block. In `tools/verify-story.mjs` nothing is needed (the loop covers unit10).
- Notes: `docs/plans/brinewire-notes-<quest>.md`: what you built, every place you parted from the spec and why, the hints and prompts as built, what only a hand can judge, defects you found. And `docs/brinewire-audit-<quest>.md`: the per-stage audit table (Operable, Intuitive, Busywork, Builds intuition, Accurate, AP topic, evidence label: `Code`, `Scripted` or `Bench` only; you have no browser, so never claim `Played`).

## Checks you run (each on its own; filter to your quest; never the full verify)

```
npm run verify:learn 2>&1 | grep -E "FAIL|PROBLEM|unit10|Brinewire"
npm run verify:table 2>&1 | grep -E "FAIL|PROBLEM|unit10"
npm run verify:story 2>&1 | grep -E "FAIL|unit10|story animations"
```
Known and not yours: `unit02/q10-wavefunctions has no story animation` (pre-existing) and `verify:docs` count mismatches (the integrator updates counts at the end). `verify:table` replays your `SOLUTIONS`/`MISSES` by script, by drag and by two taps, and fails on layout overlap (pieces, captions, rail labels, fixtures), a tool with no Tour step, an unearned word and a predict stage with an instrument: fix what it says. Iterate until all three are green for your quest.

## Rules that were broken most often (full list: `PRODUCT.md` section 5)

- A plate, header, readout, caption, tray name or refusal that prints the answer, the capacity or the reasoning. A refusal names a reading the table shows ("Cell B read −0.46 V and its lamp stayed dark"), never the rule. Typed stages: the instrument that would show the answer is absent or unwired; the slips a student makes (wrong sign, forgot n, forgot a factor, joules for kJ, minutes for seconds) are each refused by a message naming what the table shows, and each is checked in your checks file.
- Discover, never read off: the property under study starts hidden; compare two or more readings; no sorting of printed facts; no hunting a dial (a dial has two or three settings, not a range); a correct answer is accepted at once (a wrong order is told which reading is missing; a right one needs no pull).
- One decision per stage; a predict stage shows NO instrument and offers the model students actually hold; the next stage quotes the locked guess (`remember`/`recall`).
- Every drag has a two-tap twin (the engine gives it; your pieces must be pieces/slots/trays/rails). A tool laid on a card must be able to join (avoid `nojoin` cards as targets).
- Layout: sizes in table units; text at least `LABEL.min`; nothing painted under a dial's strip (content starts about 11 units below the fixture's top where it has a dial); keep the Run key's corner (bottom right, about 8 units) free of text; trays and captions inside the table; `cellH` at least a card tall; pieces and captions at least 18 units apart in a column. `verify:table` finds overlaps; fix the layout, not the check.
- Words: plain labels until the reward card earns the term; no word a later bench introduces (`verify:story` and `verify:learn` hold it); no Le Châtelier language for cells (the CED says it does not apply); no +/− electrode labels (the CED excludes them).
- Fonts: sans symbols for element letters; true minus; "O" never in a mono face.
- Chemistry accuracy over everything: a simplification is fine, a falsehood is not; where the kit simplifies, say so on the bench.
- Do not edit another builder's files. Shared files get single-line anchored insertions only, done with one atomic command (a short Python read-modify-write), then re-read the file to confirm your line and the others' lines are all there.

## When you finish

Reply with: the files you created or edited, the stage list as built, what the three checks say, every place you parted from the spec, and the stages whose feel only a hand can judge. Do not claim anything you did not run.
