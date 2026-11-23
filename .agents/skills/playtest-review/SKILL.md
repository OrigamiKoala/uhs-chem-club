---
name: playtest-review
description: Play an Avalon Learn world (or one quest, or the ship and its screens) in the browser the way the owner does, as a student who has never taken chemistry, and write a stage-by-stage feedback file in the owner's own format (docs/feedback-*.md). Use whenever asked to playtest, audit, review, play through, QA, critique or "go through like I do" a world, quest, bench, tour, explainer, debrief or screen, even if the word "playtest" is not used. Review only: it does not fix what it finds.
---

# Playtest Review

The owner audits Avalon by playing it: walking the world, opening every bench, reading every tour step,
doing every stage with their own hands, watching every explainer and Vess debrief, and writing down each
thing that made them stop. Their notes are in `docs/feedback.md`, `docs/feedback-11-01.md`,
`docs/feedback-11-15.md`, `docs/feedback-11-18.md` and `docs/feedback-11-21.md`. This skill does the same
job at the same depth so the owner's next audit finds less.

The standard is one sentence from the first audit: **figuring out the game must never be harder than
learning the chemistry.** Any idiot should be able to play it. The audience is 12 to 17 and has never taken
chemistry.

## Coverage is mandatory: EVERY SINGLE stage

The owner wants detailed notes on everything. A review that samples stages is a failed review.

- **Make a checklist first** from the quest files (`src/learn/quests/<unit>/*.js`, `meta.stageCount`) and
  the curriculum: every quest, every stage number, plus each quest's question card, opening scene,
  reward cards, explainers and Vess debrief. Keep it in the scratchpad and tick items off only when you
  have seen them on screen.
- **Every stage gets all of this, no exceptions:** the prompt, the tour (every step), the bench
  screenshot, each instrument used, a plausible wrong answer and its miss message, hint rungs 1 to 3
  (rung 3 may need two wrong answers), then the correct solve, the reward card or explainer to its end,
  and the debrief after the last stage. Predict stages and typed stages are not exempt.
- **Do not skip ahead with `window.__lqStage(n)` to save time.** Use it only to return to a stage or pass a
  stage that cannot be passed, and say so in the file. A stage you only glanced at after a jump has
  not been checked: jumping can also leave a stale tour box on screen, so reload or skip the tour
  before judging, and never write a note on a stale box.
- **Keep going until the checklist is empty.** Long worlds take hundreds of tool calls; that is expected.
  Do not stop to ask whether to continue. If you truly must stop, the file header must list every
  stage and item not played, and your report to the user must say the review is incomplete.
- **Write notes as you go** into a scratchpad file, appended after each stage, then assemble the
  feedback file. Every stage should have at least one note or an explicit "checked, nothing to change"
  line in the scratchpad (not in the final file).

## Not in scope: practice questions and worked problems

The cards that open after a quest's debrief (the multiple-choice "Practice" cards and the "Worked
problem" screens) are **not audited**. Close or skip them (Skip, or Leave) and go on; write no notes about
them. Everything before them (bench, tours, hints, miss messages, rewards, explainers, the Vess debrief
and its Case Pin) is still checked in full.

## Fast ways in (use them, they are allowed)

- Go to a bench by URL: mark every earlier quest complete (see Setup), set
  `location.hash = '#/learn/<unitNN>/<questId>'` and reload. Benches then take 20 to 30 s to build; wait.
- Onboarding: join a guild, then hold the oath button with real timed pointer events, not a quick click:
  dispatch `pointerdown` on the "Confirm" button, wait 3.5 s, dispatch `pointerup`. Then press
  "Mission briefing" and its Continue buttons.
- Getting off the ship after a flight: `(await import('/src/three/stage.js')).stage.voyage.disembark()`
  works when the walk to the airlock is not what is being reviewed. Say so in the file.
- Stage buttons and tour buttons are plain `<button>`s: read their text with `document.body.innerText`
  or loop over `button` elements in `javascript_tool` to read every tour step quickly.
- A drag on empty table tilts the bench camera. Drag from card and handle centres; reload to reset.
- Typed stages: read the instrument values, work out the answer as a student would, type it. Hint
  button is at the bottom right beside Submit.

## How a full run actually goes (learned on the Mirrowen run; follow it)

1. **Checklist, then loop.** For each quest in curriculum order: reload by URL, wait for the bench, read the
   question card, press Start, press TOUR and read every step (loop over buttons in `javascript_exec`
   to read all steps at once, then also look at the pointer animation with two or three screenshots),
   then play stage 1 to the end, press "Next stage", and repeat for every stage in order. Finish with the
   reward card, explainer and Vess debrief (click Next through every slide, screenshot each at 0.7 scale).
2. **Solve in order, in the normal flow.** Reaching stage n by solving stages 1 to n-1 is the review:
   it shows the real hand-off between stages, the real reward card and the real "Next stage" button. You
   may read `src/learn/quests/<unit>/<quest>.js` to learn the correct answer when the on-screen evidence
   cannot be turned into one quickly (say so if the evidence itself was not enough), but still
   look at what the bench shows and judge it as a student.
3. **Try one wrong answer per stage first** and read the miss message, open hint 1, 2 and 3, then solve.
4. **Append notes after every stage** to a scratchpad notes file (`**quest, stage n, part.** ...`), one
   problem per note, with the fix as a direct instruction. Write "checked, nothing to change" for a
   clean stage in the scratchpad so the checklist is provably complete.
5. **Tour is optional in real play.** The tour (and its Vess box) opens only when the student presses
   TOUR (the stage briefing is its first step); after "Next stage" nothing opens by itself. A tour box
   that appears by itself after `window.__lqStage(n)` is a jump artifact. So: any concept that only
   lives in a tour step is never seen by a student who skips it. Note that where it matters.
6. **Coordinates:** screenshots are 800x500 frames of a 1440x900 viewport; click and drag in that frame.
   Drop a card at the centre of the tray, not on its edge, or it lands overlapping two trays. After
   each drop, screenshot to confirm before submitting.
7. **Assemble last.** Join the scratchpad notes under per-quest headings, add "In general" notes per quest
   and per world, write the header (played / not played / caveats), then report counts per quest.

## Ground rules

- **This skill is the owner's permission to use the browser.** The project rule "agents do not test in
  the browser" is lifted for the run of this skill only. Do not edit source code during the review. If a
  bench is so broken you cannot go on, note it and skip ahead with `window.__lqStage(n)`.
- **Play, don't read.** Each note must come from something you saw or did on screen. You may open source
  afterwards to name the cause of a note or find the stage number, but never write a note you only
  inferred from code. If you could not check something, say so in the file.
- **Play as the student, not as an engineer.** Forget what you know about chemistry and about this
  codebase. Solve each stage only from what the bench, the prompt and earlier stages showed you. If the
  only way through was your own prior knowledge or a guess, that is a note.
- **Every part of the quest counts.** Opening scene, question card, prompt, tour (every step, and its
  pointer animation), the bench itself, each instrument, hints, miss messages, reward card, explainer
  animation, Vess debrief, cutscenes, and the world and ship around them.
- **Read the open feedback first.** Skim the latest `docs/feedback-*.md` and its plan in `docs/plans/`
  for the area you are reviewing. Do not repeat a note that is already written down and still open; do
  check that items marked done are actually fixed, and report any that are not as "still" items. Bench
  layouts changed after some screenshots (see the warning in `docs/feedback-11-21.md`), so judge what is on
  screen now.

## Setup

1. Start the dev server with the built-in browser: `preview_start` with `{ name: "avalon-3000" }`.
   Use a desktop-sized window (around 1440 x 900), which is how the owner plays.
2. Continue as Guest and finish onboarding (join a guild, hold the oath button, Mission Briefing). If it
   loops, run `(await import('/src/session.js')).session.player.team_id = 'fire'` and reload.
3. Choose how to reach the work:
   - **A whole world (the default when a world is named):** play it in order the way a student would. Mark
     every quest of earlier worlds complete so the world is open, fly there from the ship, watch the
     arrival cutscene, walk to each bench, and play its quests in curriculum order (`src/learn/curriculum.js`).
   - **One quest or bench:** mark every live quest complete with
     `session.markLearnQuestComplete(w.id, q.id)` for each quest in `WORLDS` (it must persist; setting
     `session.learn` in memory is lost on reload), set `location.hash = '#/learn/<unitNN>/<questId>'`, and
     **reload**. Changing the hash without a reload on the ship starts a flight instead.
   - `window.__lqStage(n)` opens stage n of the open bench, for returning to a stage or skipping a broken one.
4. Use screenshots for anything visual (layout, overlap, darkness, z-fighting, animation); use
   `get_page_text` / `read_page` to quote text exactly. Take several screenshots through an animation;
   one frame hides motion problems.

## How to play each quest

Do these in order and note as you go, not at the end.

1. **Arrive.** Walk up or teleport. Watch the opening scene and read the question card. Ask: does the
   question follow from the story's premise, and does it lead to what this bench teaches? (The basalt note
   in `docs/feedback-11-21.md` is the model failure.)
2. **Read the prompt before touching anything.** Can you say, in your own words, what you are being asked
   to find, and what the words in it mean? Every unfamiliar word, made-up name, or term used before it was
   introduced is a note.
3. **Watch the tour, step by step.** For each step: does the text match what the pointer does? Does the
   pointer show the real gesture on the real object (not, say, dragging a sample into the answer tray when
   the text is about a lens)? Does the highlight cover the whole thing it is about? Is the order the order
   you will actually do things? Does any step give away the answer? Does it explain equipment a beginner
   has never seen (what a conductivity tester does, why a cuvette, what calibration is)? Is it a "how to
   submit" step, or a gesture already taught in an earlier world? Those tours should not exist.
4. **Look at the bench before using it.** Overlaps from your point of view, labels cut off or hidden under
   pieces, cards that do not fit their slots or trays, pieces too small to read or too big for their
   holder, a layout that looks dropped rather than arranged, empty space, too dark to see, z-fighting or
   glitching edges, 2D pictures showing under 3D ones, objects that do not look like what they are called.
   Is there an "Answer" label where the answer goes? Is anything on the bench (a colour, a label, a
   reading, a word like "unchanged") a giveaway?
5. **Use every instrument.** Drag and click each piece. Does something visibly happen on the model, not
   only a number or tiny text? Can you pick a piece back up and move it elsewhere? Can you undo a mistake?
   Do dials drag smoothly? Does a meter ever move? Does a control get blocked by another piece? Could you
   reach the answer without this instrument (then it is busywork or useless)?
6. **Solve it honestly.** Commit your prediction where there is one. Before the right answer, submit one
   plausible wrong one and read the miss message: does it tell you why? Open the hints in order. Then
   solve. Note any stage where you had to guess, where the evidence did not decide it, where the stage
   repeats an earlier one, or where it asks you to do busywork that teaches nothing.
7. **Watch the reward card and explainer to the end.** Is it an animation (no buttons to press)? Does it
   show one idea at a time, with no text or labels inside the animation unless they are needed (angles
   should be labelled)? Does it show the mechanism itself (a photon striking metal and an electron leaving,
   protons added and the atom shrinking)? Is it the same as an earlier explainer? Does it fit the window
   without scrolling? Is the motion slow enough to follow and count? Would 3D help here, or is a spinning
   3D model getting in the way?
8. **Read the Vess debrief.** One idea at a time, little text, plain words, visuals where they help. Flag
   jargon, story asides that confuse, mentions of mysteries the student has not met, and statements that
   overgeneralise ("atoms form three bonds").
9. **After the quest, step back.** Did it explain *why*, not only *what*? Is something the quest needs
   never taught, or taught after it is used? Is a stage missing (an exception, a comparison, a
   prerequisite), or should two stages merge, swap or go? Do the predict stages sit right before the stage
   that tests them? Does the quest close the mystery it opened?

Also note anything wrong outside the bench as you pass it: the ship, the star map, doors, the navbar, the
Practice screen, the glossary, NPCs, terrain textures, the lander on its pad, and whether the bench UI goes
away when you leave the bench.

`references/lenses.md` lists what the owner has flagged before, grouped by kind, with examples. Read it
before you start; it is the clearest picture of what the owner notices.

## Writing the feedback file

Write `docs/feedback-<YYYY-MM-DD>-playtest.md` (add `-2` etc. if it exists). Match the owner's format:

```markdown
# Playtest feedback 2026-11-22

Played: Ligar (unit03), all quests, 3D On, 1440 x 900. Not checked: 3D Off, phone width.

## Ligar

**q4-dots, stage 3, tour step 2.** The pointer drags the central atom into the slots marked "X", which is
not the move this stage needs. Show the pointer dragging an outer atom onto the central atom instead.

**q4-dots, stage 3, bench.** The "X" slot label is hidden under the tray. Move it below the tray.

**q6-shape, explainer.** The 104.5° angle is not labelled. Label every bond angle in this quest's explainers.

In general for this quest, ...
```

Rules for each note:

- **Start with where it is**, precise enough for another agent to open it: quest id, stage number, and
  the part (prompt, tour step n, bench, instrument name, hint n, miss message, reward card, explainer,
  debrief, opening scene). Quote on-screen text exactly in quotes.
- **Say what is wrong as the student experienced it**, then **say the fix** as a direct instruction:
  "Replace X with Y", "Remove this stage", "Have the pointer drag the plate on first, then turn the dial".
  When there is no obvious fix, say what the fix must achieve ("find a better way to show when each
  sample melts").
- **Say when it applies more widely**: "Same for every bench in this quest" or "everywhere across the
  Learn worlds". Do not repeat the same note on every stage.
- **One problem per note**, a few sentences at most. Plain words; the owner dislikes jargon in notes too.
- **No praise, no summaries of what works, no severity scores.** The file is a to-do list. Close each world
  with "In general" notes about the whole quest or world if there are any.
- If you saved screenshots (some browser setups can), put them in `docs/images/playtest-<date>/` and
  embed them as the owner does. Otherwise the location line is enough; do not describe a screenshot you
  did not take.

At the top, list what you played and what you did not check (3D Off, phone width, hint rungs skipped,
stages skipped with `__lqStage`). Then report to the user: the file path, how many notes per world, and
the few notes that block play outright (a stage that cannot be passed, a control that does nothing).

## Depth to aim for

The owner's audits run to roughly one note per stage plus several per quest on tours, explainers and
debriefs: 40 to 80 notes for a world. If you finish a world with ten, you skimmed. Go back to the
stages you passed fastest; those are usually where the answer was given away or the step was busywork.
