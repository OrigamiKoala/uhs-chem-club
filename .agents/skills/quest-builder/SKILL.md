---
name: quest-builder
description: Design and build a complete Avalon side quest (a paid Contract like Quest 1, The Charge Gardens of Erebus) - a puzzle game with its own mechanic and its own walkable world that teaches one chemistry idea to a student who has never taken chemistry. Use this whenever the task is to add, design, plan, extend or rework a side quest, contract, campaign quest, competition quest, "something like Erebus", or a recruiting game for the club, even if the word "quest" is not used. Not for Learn-track benches or worlds (those follow docs/world-build-prompt.md).
---

# Quest Builder

A side quest is the thing a student who has never opened a chemistry book plays first. It is how the club
recruits. So it has two jobs that pull against each other, and the whole skill is about holding both:

- **It is a game someone would choose to play.** A puzzle with a verb you understand in five seconds, that
  gets harder in interesting ways, and that feels good to solve.
- **The puzzle is real chemistry.** The rule the player works out with their hands is a true rule of how
  matter behaves. After each solve they are told the name chemists use for what they just did.

Quest 1, The Charge Gardens of Erebus, is the model: the player drags an arrow from a red cloud to a blue
spot on a 3D molecule. They are doing organic reaction mechanisms and are never told so until a stage is
solved. Read `references/erebus-anatomy.md` before designing anything; it says how Erebus is built and
which of its files to open.

## Decisions already made by the owner

Do not reopen these. They were asked and answered.

| Question | Answer |
|---|---|
| Mechanic | Each side quest gets **its own** puzzle mechanic, designed around its concept. Do not reuse the Erebus arrow chamber. |
| Scope of one run | **Full build, no design checkpoint.** Spec, code, server data, 3D Off twin, world, story, checks, docs, in one autonomous run. |
| XP | **Pays XP like Erebus** and feeds Standings: flat, once per stage, graded by the server. |
| Place | **Its own walkable 3D world**, built to the world rules, with the puzzle entered from sites on the ground. |
| Audience | Ages 12 to 17, **no chemistry assumed at all**. |

Stop and ask the owner only when an instruction here conflicts with `PRODUCT.md`, or the request leaves a
choice that changes the product (for example two quests wanted in one run, or a concept the owner ruled
out). Everything else: decide, do it, write the decision in the spec.

If the request names no chemistry concept, choose one yourself (step 1) and say which and why in the spec
and the final report. Do not stop to ask.

## Project rules that bind this work

Read `CLAUDE.md` and `PRODUCT.md` first; they win over this file. The ones that are easy to break here:

- **No browser testing.** The owner play-tests. You verify with Node scripts and the individual
  `npm run verify:<name>` scripts.
- **`npm run build` and the full `npm run verify` empty `dist/`**, where the owner keeps reference art.
  Run individual verify scripts. If you must build, first copy anything in `dist/` that is not build
  output to a scratch directory and put it back afterwards.
- **Archive, never delete.** Retired code, docs or checks move under `archive/<date>/` with a README.
- **The Learn track pays no XP.** Nothing in `src/learn/` may call `session.addXp`, `api.gradeStage` or
  `api.completeQuest`. Side quest code lives outside `src/learn/` and imports nothing that would pull XP
  into it.
- **Commit only when asked.** If the owner asks for commits, branch first (`quest/<questId>`), commit
  your own files only, never push.
- **SCOURED PLATE** aesthetic and copy discipline (`CLAUDE.md`, `DESIGN.md`, `src/styles/tokens.css`):
  no neon, cyan, glass, gradients, rounded corners or emoji; no text that advertises a feature; every
  sentence on screen must be needed and must make literal sense.
- Read large files in chunks. `src/screens/quest.js`, `src/quest3d/evaluator.js` and the world files are
  long; `references/erebus-anatomy.md` tells you which parts matter.

## The method

Work in this order. Each step ends with its checks green before the next begins, because a defect found
in the vertical slice costs one fix and the same defect found after twenty stages costs twenty.

### 1. Choose the concept and the mechanic together

Read `references/game-design.md` now. It holds the test for a good concept, the test for a fun mechanic,
and a table of starting points.

The concept and the mechanic are one decision. A concept is right for a side quest only if it has a
**physical rule a hand can act out** (things attract, things take up room, things must balance, things
flow from more to less) and a mechanic is right only if **playing it well is the same act as applying
that rule**. If the chemistry could be swapped for coloured blocks and the puzzle would not change, the
chemistry is decoration: find a different mechanic.

Check what already exists so the new quest is not a second Erebus: `docs/quests/`, the contract list in
`src/screens/contracts.js`, and the Learn worlds in `PRODUCT.md`. The sealed postings on the Contract
Board (The Siphon Drift, Cinder Gate Purge, The Deep Vent Rig) are placeholders with a guild and a
theme; fill one when the concept fits it, and replace its invented figures with the real ones.

### 2. Write the spec before any code

Write `docs/quests/<questId>-<slug>.md` (Erebus's is `docs/quests/q1-charge-gardens.md`). This is the
contract you audit yourself against in step 8. It holds:

1. **The idea in one sentence**, in words a 12-year-old has, and the two or three sub-ideas the quest
   builds on top of it (Erebus: opposites attract; then crowding blocks a route; then steps happen in
   order).
2. **The mechanic**: the verb, what the player sees, what counts as an answer, and the canonical answer
   payload (see `references/erebus-anatomy.md`, "Answers the server can grade").
3. **The withheld vocabulary**: the list of real terms kept out of every prompt, hint, miss message and
   transmission, and the plain words used in their place. Erebus's list is the `BANNED` array in
   `tools/verify-stages.mjs`.
4. **The stage ladder**: one row per stage (see "What a stage is" below). Group the rows into three or
   four movements, each adding one new rule, and mark the stages that auto-show a briefing because a new
   rule starts there.
5. **The world**: what the place is, what the sites are, how a cleared stage visibly changes the ground.
6. **The story**: the contract, who posted it, what the Fifth Guild did here, the clue it yields, and how
   it sits in `docs/story/bible.md`.
7. **XP**: the per-stage ladder and the total (see "XP" below).
8. **A pitfall review**: go through `PRODUCT.md` section 5 (the pitfall ledger) and the lists in
   `references/game-design.md` and write, for each row that could apply, how the design avoids it.

Then reread the spec as a 12-year-old on a phone who was dragged here by a friend. Cut any stage they
could pass by guessing between two options, any stage that needs a word they were never given, and any
stage that is the previous stage again with different numbers.

### 3. Plumbing: make room for a second quest (first run only)

The campaign is hardwired to one quest, `q1`, in the client, the proxy, the server and the checks. The
first side quest built with this skill has to generalise that. `references/erebus-anatomy.md` lists every
hardwired place and the target shape (a contract registry, one source for stage data, a generated server
file). Do this before building the game, run every existing campaign check (`verify:quest`,
`verify:flows`, `verify:sync`, `verify:story`, `verify:console`, `verify:progression`) and confirm Erebus
still passes untouched. On later runs this step is "add one registry entry".

### 4. Vertical slice: three stages, end to end

Build stage 1, the first stage of the second movement, and one multi-step stage, completely: the pure
stage data and grader, the 3D game view, the 3D Off twin, the hint ladder, the miss messages, the payoff
animation, the chemistry card, the server rows and the per-quest verify script. Then run the checks and
reread the spec against what you learned. Fix the pattern here, before copying it.

Write the grader and stage data first, as a pure module with no DOM and no `three` import, so Node can
replay every intended solution and every planned mistake. Check any chemistry number or ordering against
an independent source (a table, a worked formula), never against the code that produced it.

### 5. The remaining stages

Build in order. After each movement: checks green. Stages must be data plus small per-stage differences;
if a stage needs a new code path, ask whether it is really a second mechanic sneaking in.

### 6. The world

Read `references/world-build.md`. Lay out the sites with a generator into `src/three/world-data/`, build
terrain, atmosphere and site hardware, register the world, write `tools/verify-<world>.mjs`. The world is
where progress is seen: every cleared stage changes something the player can look back at (Erebus wakes a
pylon).

### 7. Story, records and lists

Story module, Vess transmissions, milestones, clue, debrief, Field Manual terms, Contract Board card,
Star Map plate, Case File ids, galaxy map. `references/erebus-anatomy.md` has the list and the rules for
story copy.

### 8. Audit against the spec, then close out

You cannot play it, so audit by reading and by script:

- For every stage, replay the intended solution, the reversed or near-miss solutions, and each mistake
  the spec lists, through the real grader in Node. Each mistake must get its own message.
- Read every string the player can see against the withheld-vocabulary list and against the stage's
  answer. Does a prompt or hint rung 1 or 2 give the move away? Does any word appear before it was given?
- Hold each stage to the fun test in `references/game-design.md`.
- Run, each on its own: `verify:quest`, `verify:<questId>` (yours), `verify:flows`, `verify:sync`,
  `verify:story`, `verify:docs`, `verify:progression`, `verify:galaxy`, `verify:voyage`, `verify:normals`,
  `verify:<world>` (yours), and `node tools/perf-worlds.mjs`. All green, or each failure reported with why
  it is not yours.
- Update `PRODUCT.md` (the "At launch the competition is Quest 1 only" sentence in the Two roads
  paragraph, the Campaign bullet, counts, and the "Not established" line if this run settled any of it;
  add a pitfall row for anything new this quest taught), `CLAUDE.md` (architecture and commands, kept
  short), `docs/engineering/engine-and-worlds.md` (a section for the quest and its world), and finish the
  spec as the build record: what was built, where it parted from the spec and why.

End with a report that says plainly what was verified by script, and lists **what only the owner can
judge**: whether the drag feels right on a phone, whether stage N is too hard, whether it is fun. Do not
claim more than was tested.

## What a stage is

Every stage carries all of these. The per-quest verify script enforces each one, as
`tools/verify-stages.mjs` does for Erebus.

| Field | Rule | Why |
|---|---|---|
| `title` | `Stage N — Two Or Three Words` | The words name the situation, never the answer. |
| `shape` | A short kicker naming the kind of problem (`FIRST CONTACT`, `DISPLACEMENT`) | Lets a player see that this one is a new kind. |
| `prompt` | One or two plain sentences saying what to achieve. No withheld word. | The player must know the goal before touching anything. |
| `hints` | Exactly three, each a full sentence, all different. 1 **Nudge**: where to look. 2 **Narrow it down**: what to compare. 3 **Show the move**: the move itself. | Rung 1 is free, rung 2 opens after one miss or 45 s, rung 3 after two misses. Rung 3 gives the move on purpose: the quest pays XP, so a stuck player must never be locked out. Using it only resets the display-only CLEAN streak. Hints cost nothing. |
| miss diagnosis | Each plausible mistake has a title and a one-sentence reason naming what the player did and what the scene shows (`BACKWARDS`, `TWO GIVERS`, `PATH BLOCKED`, `RIGHT MOVES, WRONG ORDER`). | "Not quite" teaches nothing. A miss is the best teaching moment the game has. |
| payoff | An animation in which the chemistry visibly happens because of the player's move, plus one plain sentence. It must always finish and hand control back. | This is the reward and the lesson at once. Physically honest: what moves is what would move. |
| `concept` (optional, intro) | Shown before a stage that starts a new rule. Teaches the **controls and the visual code only**. | A card that explains the chemistry before the work is a lecture. Auto-show it only on the first stage of each movement. |
| `chem` | Badge, title, body of at most three sentences, shown **only after the solve**. Real vocabulary is allowed here and nowhere earlier. | Do the thing, then meet the word for it. This is what turns puzzles into lessons. |
| `xp` | Flat integer. | See below. |

One decision per stage. The screen holds what that decision needs and nothing else.

## Rules that make it playable by someone with no chemistry

- **Plain words carry the play; real words arrive after the solve.** Keep the withheld list out of
  prompts, hints, miss messages, the concept card and all story copy.
- **Write in Erebus's voice: loose, lively, a little playful.** This is a game for someone who was
  dragged here by a friend, not a textbook. Erebus calls its pieces givers and receivers, hungry
  targets, a sleepy target that a helper wakes up, bystanders, a domino reaction, pieces that make
  room and leave. Give the new quest's pieces the same kind of everyday nicknames and let them have
  character ("this one is hungry for charge", "the big neighbours are in the way"). Short sentences,
  an exclamation mark where a solve earns one. Read the `STAGE_COPY` and `diagnoseMiss` text in
  `src/quest3d/evaluator.js` for the register and match it. This is deliberately looser than the Learn
  track's rule against motives for atoms; that rule does not apply to side quests.
- **A nickname always resolves.** Each one stands for one real thing, keeps one meaning for the whole
  quest, and is tied to its real name on a chemistry card and again in the debrief ("the red part has
  extra electrons, and the blue part is hungry for them"). A nickname that is never cashed in is a
  code word.
- **Nothing to read off, nothing to look up.** No formula, symbol, equation or periodic table is needed
  to play. If the concept has symbols, the debrief shows them; the play does not depend on them.
- **No arithmetic beyond counting.** A quest whose stages are sums is a worksheet. If a stage ever asks for a
  number, it carries the game's Calc key (`src/ui/calculator.js`), but no stage should need one.
- **The visual code is taught once and never changes.** Erebus: red gives, blue receives, brighter is
  stronger. Every cue is doubled (colour plus shape, size or motion), because colour alone fails some
  players.
- **The voice is loose; the chemistry is not.** A figure of speech is fine; a wrong rule is not. What
  the player learns to do (which piece goes where, what blocks what, what happens first) must be what
  really happens, so nothing has to be un-taught later. Where the game simplifies, the debrief says so
  in a clause.
- **Every drag has a two-tap twin**, the play area is `touch-action: none` with single-pointer drags, and
  the stage works at 375 px wide in landscape. Many players arrive on a phone.
- **3D Off is the same quest.** With WebGL off, the same stage, the same answer payload and the same
  grader run from a DOM or canvas view. It may look plainer; it may not be easier or different.
- **Guest mode works.** `session.startGuest()` plays the whole quest from `localStorage` with no Sheet
  traffic; the local proxy mock answers every route.

## XP

Flat per stage, paid once, no attempt or speed multiplier, replays pay nothing, completion is idempotent,
progress never goes backwards. The server's number is the truth; the client shows the same number
because it reads it from the same stage data. Nothing a player can grind.

Erebus pays 650 XP over 20 stages on a rising ladder (15, 15, 20, 20, 25, 25, 30, 30, 30, 35, 35, 35, 35,
40, 40, 40, 40, 45, 45, 50) plus a completion bonus of 65. Default to the same shape: 12 to 20 stages,
25 to 35 minutes, a ladder that rises with difficulty, a total near 650 so no contract outweighs
another in Standings, and a completion bonus of a tenth. Record the figures in the spec, `PRODUCT.md`
and the Contract Board card, and name the total in the final report, since it is a competition fact the
owner may want to change.

## Reference files

- `references/erebus-anatomy.md`: how Quest 1 is built file by file, the stage and story data shapes,
  every place `q1` is hardwired, the target shape for a second quest, and which checks cover what. Read
  before step 2.
- `references/game-design.md`: choosing a concept, the fun test, the difficulty curve, mechanic starting
  points by concept, and the ways a chemistry game goes wrong. Read at step 1.
- `references/world-build.md`: the walkable-world rules, the files a world touches, and the checks. Read
  at step 6.
