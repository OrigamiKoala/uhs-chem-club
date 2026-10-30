# Mirrowen: how to build one bench (brief for a builder)

You are building ONE bench of Mirrowen (`unit06`, states of matter) in Avalon (`/Users/carlliu/chem-3d`, branch `world/unit06`). Other builders are
building the other benches in the SAME working tree at the same time, each in their own files. The slice, `q2-grip`, is built, played and green: copy its
pattern, do not reinvent it.

## Ground rules for a parallel build

- **Do not commit, stage, stash, reset, checkout or reformat anything.** The owner of the integration commits. Only touch the files listed under "Your files".
- **Do not use the browser** (Browser pane, Chrome, Playwright). There is one pane and the integrator uses it. You verify with Node scripts only.
- **Do not edit `PRODUCT.md`, `CLAUDE.md`, `package.json`, `tools/verify-*.mjs`, `matter.js`, `matter-draw.js`, `matter-registry.js` or another bench's files.** If you
  need a change to shared code, make it opt-in inside your own file; if you truly cannot, say so in your report.
- Run `node tools/verify-learn.mjs`, `node tools/verify-table.mjs` and `node tools/verify-story.mjs` often (each takes seconds to a minute); `node tools/verify-docs.mjs`
  will fail on stage counts until integration: ignore that one. Output other builders' failures you did not cause is not yours; say so.
- Never delete code. Chemistry must be accurate: simplify freely, say nothing false. Every number a player sees comes from a data row with a source.

## Read first (in order; read big files in chunks)

1. `PRODUCT.md`: "Building a Learn world" sections 3, 4 and 5 (the bench contract, how to design a stage, the pitfall ledger). Every row of 5 is a defect that was built.
2. `docs/plans/mirrowen-world.md`: sections 0, 2, 3 (your bench), 4 (kit plan), 6 (pitfall review). It is the contract; where this file is thin, YOU write the stage table
   (below). Your bench's design seeds are in the prompt that sent you here.
3. `src/learn/quests/unit06/q2-grip.js` (the pattern: stages, `SOLUTIONS`, `MISSES`, notes, `CHECKS`), `src/learn/quests/unit05/q3-enthalpy.js` (typed worked figure,
   rank on a rail, predict pair), `src/learn/quests/_template.js` (the contract).
4. The matter kit: `src/learn/table/kits/matter.js`, `matter-registry.js`, `matter-draw.js` (`say`, `slab`, `frameOf`, `topOf`, `paintGlyph` are exported),
   `matter-read.js`, `matter-parts.js`, `matter-tour.js`, and the heat kit it extends (`heat.js`, `heat-draw.js`, `heat-read.js`: cup, plaque, marker, selector, phase box,
   rail, note, tag, stmt, num, chip, shift cards are yours to use). The pure data and planners: `src/learn/engine/matterdata.js` (read its header: sources).
5. How a table is built and graded: `src/learn/table/model.js` (actions: `place`, `setDial`, `run`, `type`; zones: trays, rail, slots), `src/learn/engine/stagerunner.js`.
6. The AP CED text for your topics is in `/private/tmp/claude-501/-Users-carlliu-chem-3d/36dbefac-af21-4c4a-9eb3-1a72e51ba45f/scratchpad/ced.txt` (search "TOPIC 3.x").

## What a finished bench is (every item, no stubs)

1. **The quest module** `src/learn/quests/unit06/<questId>.js` copied from the pattern: `meta.stageCount`, `STAGES`, `SOLUTIONS`, `MISSES` (one plausible wrong answer per
   stage, each refused with a reason that names what the table shows and never the rule or the answer), `stateFor`, `mount` (pass `room: ROOM` with `export const ROOM = 'foundry'`
   as q2-grip does: Mirrowen has no ground yet), `VOCABULARY` (term -> stage whose reward card defines it), `BUILDS_ON` (real built quest ids only), `DEBRIEF` (one section,
   used only if the story animation is missing), `CHECKS` (exports for the verifier). No `PRACTICE`. No XP calls.
2. **Stages**: the count in your prompt (6 to 8). Each stage: prompt (ONE sentence, at most 25 words, no "!", objective never route), exactly three hints (one sentence each:
   control / what to look at / method, never the answer or the arithmetic), a reward card (1 to 3 sentences, about 45 words, real terms) and a `check` that returns
   `{ ok }`, `{ ok:false, notYet:true, msg }` for a blank bench, or `{ ok:false, msg }` naming what the table shows. A predict stage (`predict: true`) shows ONLY the question and
   the guess cards (no instrument, no runnable control) and its `onClear` calls `remember`; the next stage's `prompt` and `reward` getters call `recall` (see q2-grip).
   Predict only on the bench's click and on a new case. One decision per stage. Stage 8 (or the last) is normally a sealed sample. Numeric stages follow the quantity ramp
   (picture, prediction, proportional, formula as shorthand, friendly numbers, then a figure PAST the dial's range that is typed: `entry: { id, label, unit }`,
   `entryNumber`); the slips a student makes (a factor of ten, a missing step) are kept as refused answers in `MISSES`. A typed stage needs a picture behind it.
3. **Discover it, never read it off.** Nothing on the bench prints the answer, the capacity or the rule; if a student could answer by looking at the table, rebuild the stage
   around an instrument. No sort of printed facts, no hunting a dial until a number goes green (a heater with steps has a typed or ranked answer BETWEEN its steps), no
   plug-and-chug with every constant printed. Plain labels until the word is earned; every term defined by an earlier reward card (list it in `VOCABULARY`; nothing unearned
   appears in a prompt, hint, plate or caption: `verify:learn` and `verify:story` check).
4. **The kit part**: your instrument(s) and pieces live in your own file `src/learn/table/kits/matter-<name>.js` (a stub is waiting; it is already imported by `matter.js`).
   Register with `registerFixture(kind, { paint, run, dress3d?, settle? })` and `registerPiece(kind, { kind: {r, rect, nojoin: true}, paint, faceKey, piece3d?, printed? })`.
   A painter is a pure function of the table state: it prints what `matterdata.js` (or your own data file `src/learn/engine/matterdata-<name>.js`) says, never decides. Text on
   a plate is 6 px or larger, nothing is painted under a knob, a rail post, a rim or glass; fixtures that carry dials leave the dial rows free (`topOf`/`contentTop`). A card is
   at least as tall as a tray's cell. Pieces are `nojoin` unless physics says they join. Every drag has a two-tap twin (the engine gives it for free for pieces in
   slots, trays and rails). Add Tour words for EVERY new fixture and piece kind with `addTourText({ 'matter:<kind>': { title, dials: false, text } }, { <pieceKind>: [title, text] })`
   at the bottom of your kit file: three beats (what it is, what to do with it, what it tells you), plain words, no unearned term, never which move solves the stage.
   Build a `dress3d`/`piece3d` solid only if cheap and clearly correct; the flat picture must be complete without it (`3D Off` draws the same picture).
5. **Data**: new constants go in `src/learn/engine/matterdata-<name>.js` (pure, Node-importable, source in the header comment, rounding stated). Check every planner in Node
   against values you work by hand or read from the CRC/NIST; never certify a value with the code that produced it.
6. **The chart**: in `src/learn/worlds/unit06-states-of-matter.js` flip YOUR quest only: `status: 'live'`, `module: () => import('../quests/unit06/<id>.js')`, the right `stageCount`.
7. **The bank**: `src/learn/bank/unit06.json` gains `bench.<questId>.problems` (exactly two multiple-choice problems after the debrief, ids `<questId>#b1`, `#b2`) and, for a
   computational bench, `bench.<questId>.worked` (4 to 8 steps, number steps carry a `calc` expression the checker recomputes; id `<questId>#w`) plus 2 to 3 `end` problems
   (ids `<questId>#0..`). Edit the JSON with a short Python script that loads, merges only YOUR keys and dumps with `ensure_ascii=False, indent=2` (other builders do the same: be quick).
8. **Lead line**: replace the marker `  // @mirrowen <questId>` in `src/learn/engine/stage-story.js` with `  '<questId>': { 1: '...' },` (one sentence, at most 20 words, only earned words, a stake, not a task).
9. **Story animation**: put your painter(s) in `src/ui/story-scenes-mirrowen-<q#>.js` (a stub is waiting; export the `Q#_SCENES` object `{ 'name': painter }`; painters take
   `(ctx, w, h, t, clock)`, draw on a 960 x 540 plate, use `story-kit.js` and `story-sim.js` as `story-scenes-mirrowen.js` does, and every number on screen is counted or read from
   the data, never typed). Replace the marker `  // @mirrowen <questId>` in `src/story/quest-story.js` with the entry
   `'unit06/<questId>': { scene, beats: [{to, say}...3 to 5...], filed: 'Filed: ...' },`. A beat is at most 2 sentences and 36 words; `filed` is one sentence of at most 24 words that
   moves the case on, using only what the bench measured; every word must be earned by the bench's last reward card and none introduced by a later bench (`verify:story`).
10. **The verifier file** `tools/lib/mirrowen/<questId>.mjs` (pattern: `q2-grip.mjs`): `LEAKS` (words a refusal may not carry, 1-based stages) and `check(c)` that recomputes every
   graded figure from an INDEPENDENT value (hand-worked or CRC), the rank orders, that each predict stage shows no instrument, that an untouched table never passes, and that each
   stage's evidence is really on the bench.
11. **The stage table**: write `docs/plans/mirrowen-<questId>.md`: per stage the prompt, the evidence on the bench, everything the bench prints and why none of it is the answer,
   the wrong answers and the message each gets, the three hints, the reward, flat or 3D and why, the ramp rung for numeric stages. Be honest about what is weak.

Verification you must run before reporting: `node tools/verify-learn.mjs`, `node tools/verify-table.mjs`, `node tools/verify-story.mjs` (your quest must appear in each and pass; the story check needs your
entry; if it does not require unit06 yet, run the painter yourself against a stub 2D context at every beat with a Node script and say so). Read every refusal and every plate against its stage's answer.

## Layout rules that cost the most (table units; a table is 150 x 64 by default, `bounds: { w: 150, h: 72 }` is allowed)

A fixture box carries its dial rows at the top (`contentTop(nDials)`); a probe-like fixture is about 58 x 40, a cup 46 x 45. A card is 20 x 19 (`mol`) or 20 x 14 (heat cards).
A tray's `cellH` must be at least a card tall and the tray tall enough for the label strip above the first card. Pieces that rest in a rail are laid by the rail (`items`, `start`:
a start that is NOT the answer). Pieces resting at the table's lower edge need `y` at most `bounds.h - card half height`. `verify:table` fails any overlap of a zone, label, note, fixture or
piece, and any how-to note line with no clear strip (drop a note rather than crowd a table). Words are paint: nothing under a knob, a post or glass.

## Report (at most 300 words)

Files created and changed; the stage list with each stage's one-line idea and the click; the planner values you checked and against what; the check results; what you know is weak or could
not do; and the list of stages the integrator must view at `3D On` and play by hand (which fixtures are new, which gestures are unusual).
